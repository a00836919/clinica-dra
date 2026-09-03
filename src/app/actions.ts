"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, ERROR_CONFIG } from "@/lib/supabase/admin";
import {
  enviarRecetaEmail,
  enviarConfirmacionSolicitud,
  enviarConfirmacionAprobacion,
  enviarConfirmacionCancelacion,
} from "@/lib/email";
import { setPortalCookie, clearPortalCookie, getPortalPatientId } from "@/lib/portal-session";
import { redirect } from "next/navigation";
import { parseISO } from "date-fns";
import { calcularFranjas, esDiaAbierto, HORARIO } from "@/lib/disponibilidad";


/**
 * Adjunta el error real de Postgres al mensaje.
 *
 * Se usa solo en acciones del dashboard, que son de personal: ahí ver "violates
 * row-level security policy" ahorra horas. En los formularios públicos NO se
 * usa, porque filtrarle detalles internos de la base a un paciente no aporta
 * nada y sí expone estructura.
 */
function conDetalle(mensaje: string, error: { message?: string } | null) {
  if (!error?.message) return mensaje;
  return `${mensaje} — ${error.message}`;
}

// ── Verificar paciente por DPI + fecha de nacimiento ──────────────────────────

export type PacienteResumen = {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  telefono: string;
  email: string | null;
};

export type VerifyResult =
  | { status: "found"; paciente: PacienteResumen }
  | { status: "not_found" }
  | { status: "error"; message: string };

export async function verificarPaciente(dpi: string, fechaNacimiento: string): Promise<VerifyResult> {
  const dpiTrim = dpi?.trim();
  const fecha = fechaNacimiento?.trim();
  if (!dpiTrim || !fecha) {
    return { status: "error", message: "Completa ambos campos." };
  }

  const supabase = createAdminClient();
  if (!supabase) return { status: "error", message: ERROR_CONFIG };

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .select("id, primer_nombre, primer_apellido, telefono, email")
    .eq("numero_identificacion", dpiTrim)
    .eq("fecha_nacimiento", fecha)
    .maybeSingle();

  // Un fallo de base de datos no es lo mismo que "no existe": si lo tratáramos
  // igual, mandaríamos a registrarse a un paciente que sí está en el sistema.
  if (error) {
    console.error("[citas] verificarPaciente falló:", error);
    return { status: "error", message: ERROR_CONFIG };
  }

  if (!paciente) return { status: "not_found" };

  await setPortalCookie(paciente.id);
  return { status: "found", paciente };
}

// ── Solicitar cita — paciente existente (usa sesión del portal) ───────────────

export type SolicitudState =
  | { status: "idle" }
  // correoEnviado es false cuando el paciente no dejó correo o cuando el envío
  // falló: la pantalla de éxito no debe prometer un correo que no salió.
  | { status: "success"; correoEnviado: boolean }
  | { status: "error"; message: string };

export async function solicitarCitaExistente(formData: FormData): Promise<SolicitudState> {
  const patientId = await getPortalPatientId();
  if (!patientId) return { status: "error", message: "Sesión expirada. Ingresa tus datos de nuevo." };

  const sede = formData.get("sede")?.toString() || "Sin preferencia";
  const motivo = formData.get("motivo")?.toString().trim() || null;
  const fechaStr = formData.get("fecha_preferida")?.toString();
  const fecha_preferida = fechaStr ? fechaStr : null;
  const hora_preferida = formData.get("hora_preferida")?.toString() || null;

  const supabase = createAdminClient();
  if (!supabase) return { status: "error", message: ERROR_CONFIG };

  const { data: paciente, error: pacienteError } = await supabase
    .from("pacientes")
    .select("primer_nombre, primer_apellido, telefono, email")
    .eq("id", patientId)
    .maybeSingle();

  if (pacienteError) {
    console.error("[citas] solicitarCitaExistente — lectura de paciente falló:", pacienteError);
    return { status: "error", message: ERROR_CONFIG };
  }
  if (!paciente) return { status: "error", message: "No encontramos tu registro." };

  const nombre = `${paciente.primer_nombre} ${paciente.primer_apellido}`;

  const { error } = await supabase.from("solicitudes_cita").insert({
    nombre,
    telefono: paciente.telefono,
    email: paciente.email,
    sede,
    motivo,
    fecha_preferida,
    hora_preferida,
    paciente_id: patientId,
  });

  if (error) {
    console.error("[citas] solicitarCitaExistente — insert de solicitud falló:", error);
    return { status: "error", message: "No pudimos registrar tu solicitud." };
  }

  let correoEnviado = false;
  if (paciente.email) {
    const envio = await enviarConfirmacionSolicitud({
      to: paciente.email,
      nombre,
      fechaPreferida: fecha_preferida,
      hora: hora_preferida,
      sede,
    });
    correoEnviado = envio.ok;
  }

  return { status: "success", correoEnviado };
}

// ── Solicitar cita — paciente nuevo (crea paciente + solicitud + sesión) ──────

export async function solicitarCitaNueva(
  dpi: string,
  fechaNacimiento: string,
  formData: FormData,
): Promise<SolicitudState> {
  const primer_nombre = formData.get("primer_nombre")?.toString().trim();
  const primer_apellido = formData.get("primer_apellido")?.toString().trim();
  const telefono = formData.get("telefono")?.toString().trim();
  const email = formData.get("email")?.toString().trim() || null;
  const sede = formData.get("sede")?.toString() || "Sin preferencia";
  const motivo = formData.get("motivo")?.toString().trim() || null;
  const fechaStr = formData.get("fecha_preferida")?.toString();
  const fecha_preferida = fechaStr ? fechaStr : null;
  const hora_preferida = formData.get("hora_preferida")?.toString() || null;

  if (!primer_nombre || !primer_apellido || !telefono) {
    return { status: "error", message: "Nombre, apellido y teléfono son obligatorios." };
  }
  if (!dpi?.trim() || !fechaNacimiento?.trim()) {
    return { status: "error", message: "Falta DPI o fecha de nacimiento." };
  }

  const supabase = createAdminClient();
  if (!supabase) return { status: "error", message: ERROR_CONFIG };

  // 1. Crear paciente
  const { data: nuevoPaciente, error: insertError } = await supabase
    .from("pacientes")
    .insert({
      tipo_identificacion: "DPI",
      numero_identificacion: dpi.trim(),
      fecha_nacimiento: fechaNacimiento.trim(),
      primer_nombre,
      primer_apellido,
      sexo: "Prefiero no decirlo",
      telefono,
      email,
    })
    .select("id")
    .single();

  if (insertError || !nuevoPaciente) {
    console.error("[citas] solicitarCitaNueva — insert de paciente falló:", insertError);
    // Un DPI repetido no es un fallo del sistema: es alguien que ya está registrado
    // pero puso otra fecha de nacimiento.
    if (insertError?.code === "23505") {
      return {
        status: "error",
        message:
          "Ese DPI ya está registrado, pero la fecha de nacimiento no coincide. Revísala e intenta de nuevo.",
      };
    }
    return { status: "error", message: "No pudimos crear tu registro. Intenta de nuevo." };
  }

  // 2. Crear solicitud vinculada
  const nombre = `${primer_nombre} ${primer_apellido}`;
  const { error: solError } = await supabase.from("solicitudes_cita").insert({
    nombre,
    telefono,
    email,
    sede,
    motivo,
    fecha_preferida,
    hora_preferida,
    paciente_id: nuevoPaciente.id,
  });

  if (solError) {
    console.error("[citas] solicitarCitaNueva — insert de solicitud falló:", solError);
    return { status: "error", message: "Te registramos, pero no pudimos guardar la solicitud." };
  }

  // 3. Sesión activa para /mis-citas
  await setPortalCookie(nuevoPaciente.id);

  // 4. Correo de confirmación
  let correoEnviado = false;
  if (email) {
    const envio = await enviarConfirmacionSolicitud({
      to: email,
      nombre,
      fechaPreferida: fecha_preferida,
      hora: hora_preferida,
      sede,
    });
    correoEnviado = envio.ok;
  }

  return { status: "success", correoEnviado };
}

// ── Cancelar solicitud ────────────────────────────────────────────────────────

async function cancelar(
  solicitudId: string,
  origen: "paciente" | "clinica",
  pacienteId?: string,
): Promise<{ error?: string }> {
  // Desde el portal el visitante es anónimo para Supabase, así que va por el
  // cliente de servicio; desde el dashboard vale la sesión del personal.
  const supabase = pacienteId ? createAdminClient() : await createClient();
  if (!supabase) return { error: ERROR_CONFIG };

  let query = supabase
    .from("solicitudes_cita")
    .update({ estado: "cancelada" })
    .eq("id", solicitudId)
    .neq("estado", "cancelada");

  // Desde el portal, solo el dueño de la solicitud puede cancelarla.
  if (pacienteId) query = query.eq("paciente_id", pacienteId);

  const { data: solicitud, error } = await query
    .select("nombre, email, fecha_preferida, sede")
    .maybeSingle();

  if (error) return { error: "No se pudo cancelar." };
  if (!solicitud) return { error: "Esta solicitud ya no se puede cancelar." };

  if (solicitud.email) {
    await enviarConfirmacionCancelacion({
      to: solicitud.email,
      nombre: solicitud.nombre,
      fechaPreferida: solicitud.fecha_preferida,
      sede: solicitud.sede,
      origen,
    });
  }

  return {};
}

/** Cancelación hecha por la secretaria desde el dashboard. */
export async function cancelarSolicitud(solicitudId: string): Promise<{ error?: string }> {
  return cancelar(solicitudId, "clinica");
}

/** Cancelación hecha por el paciente desde /mis-citas — verifica que sea suya. */
export async function cancelarSolicitudPaciente(solicitudId: string): Promise<{ error?: string }> {
  const patientId = await getPortalPatientId();
  if (!patientId) return { error: "Sesión expirada. Ingresa tus datos de nuevo." };
  return cancelar(solicitudId, "paciente", patientId);
}

// ── Finalizar consulta + enviar receta por correo ─────────────────────────────

export async function finalizarConsulta(consultaId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: consulta, error: updateError } = await supabase
    .from("consultas")
    .update({ estado: "atendida" })
    .eq("id", consultaId)
    .select(`
      id, fecha, diagnostico, tratamiento, notas, sede, receta_enviada,
      paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido, email),
      doctora:staff!consultas_doctora_id_fkey(nombre_completo)
    `)
    .single();

  if (updateError || !consulta) return { error: "No se pudo finalizar la consulta." };

  const paciente = Array.isArray(consulta.paciente) ? consulta.paciente[0] : consulta.paciente as {
    primer_nombre: string; primer_apellido: string; email: string | null;
  } | null;

  if (!paciente?.email) return {};
  if (consulta.receta_enviada) return {};

  const { data: receta } = await supabase
    .from("recetas")
    .select("medicamentos")
    .eq("consulta_id", consultaId)
    .single();

  const doctora = Array.isArray(consulta.doctora) ? consulta.doctora[0] : consulta.doctora as { nombre_completo: string } | null;

  const envio = await enviarRecetaEmail({
      to: paciente.email,
      pacienteNombre: `${paciente.primer_nombre} ${paciente.primer_apellido}`,
      fechaConsulta: consulta.fecha,
      doctoraNombre: doctora?.nombre_completo ?? "Dra. Majo Polanco",
      sede: consulta.sede,
      diagnostico: consulta.diagnostico,
      tratamiento: consulta.tratamiento,
      notas: consulta.notas,
    medicamentos: receta?.medicamentos ?? null,
  });

  // Solo se marca como enviada si el servidor de correo la aceptó, para que
  // un reintento posterior siga siendo posible.
  if (envio.ok) {
    await supabase
      .from("consultas")
      .update({ receta_enviada: true, receta_enviada_en: new Date().toISOString() })
      .eq("id", consultaId);
    return {};
  }

  return { error: "La consulta quedó finalizada, pero la receta no se pudo enviar por correo." };
}

// ── Portal de pacientes (logout usado por /mis-citas) ─────────────────────────

export async function logoutPortal() {
  await clearPortalCookie();
  redirect("/");
}

// ── Agendar una solicitud: crea la cita real en el calendario ────────────────

/**
 * Confirmar una solicitud no basta para que la cita exista: hasta ahora solo
 * cambiaba el estado de la solicitud y la agenda nunca la veía. Esto crea la
 * consulta con fecha, hora, sede y doctora, y recién entonces avisa al paciente.
 */
export async function agendarSolicitud(
  solicitudId: string,
  datos: { fecha: string; hora: string; sede: string; doctoraId: string },
): Promise<{ error?: string; aviso?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a entrar." };

  if (!datos.fecha || !datos.hora) return { error: "Falta la fecha o la hora." };
  if (!datos.doctoraId) return { error: "Elige a la doctora que atiende." };

  const cuando = new Date(`${datos.fecha}T${datos.hora}`);
  if (Number.isNaN(cuando.getTime())) return { error: "La fecha o la hora no son válidas." };

  const { data: solicitud, error: solError } = await supabase
    .from("solicitudes_cita")
    .select("id, nombre, email, motivo, estado, paciente_id")
    .eq("id", solicitudId)
    .maybeSingle();

  if (solError || !solicitud) return { error: "No encontramos la solicitud." };
  if (solicitud.estado === "cancelada") return { error: "Esa solicitud está cancelada." };
  if (!solicitud.paciente_id) {
    return {
      error:
        "Esta solicitud no está ligada a un expediente. Registra al paciente primero y vuelve a intentar.",
    };
  }

  const { data: doctora } = await supabase
    .from("staff")
    .select("nombre_completo, nombre_agenda")
    .eq("id", datos.doctoraId)
    .maybeSingle();

  const { error: citaError } = await supabase.from("consultas").insert({
    paciente_id: solicitud.paciente_id,
    doctora_id: datos.doctoraId,
    doctora_nombre: doctora?.nombre_agenda ?? doctora?.nombre_completo ?? null,
    sede: datos.sede || "Sin preferencia",
    fecha: cuando.toISOString(),
    motivo: solicitud.motivo,
    estado: "agendada",
  });

  if (citaError) {
    console.error("[agenda] no se pudo crear la consulta:", citaError);
    return { error: conDetalle("No se pudo crear la cita en la agenda.", citaError) };
  }

  await supabase.from("solicitudes_cita").update({ estado: "agendada" }).eq("id", solicitudId);

  if (!solicitud.email) {
    return { aviso: "Cita agendada. No hay correo registrado: avísale por teléfono." };
  }

  const envio = await enviarConfirmacionAprobacion({
    to: solicitud.email,
    nombre: solicitud.nombre,
    fechaPreferida: cuando.toISOString(),
    hora: datos.hora,
    sede: datos.sede,
  });

  if (!envio.ok) return { aviso: "Cita agendada, pero el correo no salió. Avísale por teléfono." };

  return {};
}

// ── Cerrar la consulta: diagnóstico, receta, facturación y correo ───────────

export type Medicamento = { nombre: string; dosis?: string; instrucciones?: string };

export type CierreState =
  | { status: "idle" }
  | { status: "guardado" }
  | { status: "cerrado"; correoEnviado: boolean }
  | { status: "error"; message: string };

export async function guardarConsulta(
  consultaId: string,
  accion: "guardar" | "cerrar",
  formData: FormData,
): Promise<CierreState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Tu sesión expiró. Vuelve a entrar." };

  const texto = (campo: string) => formData.get(campo)?.toString().trim() || null;

  let medicamentos: Medicamento[] = [];
  const crudo = formData.get("medicamentos")?.toString();
  if (crudo) {
    try {
      const parsed = JSON.parse(crudo) as Medicamento[];
      medicamentos = parsed.filter((m) => m?.nombre?.trim());
    } catch {
      return { status: "error", message: "La lista de medicamentos no se pudo leer." };
    }
  }

  const { data: consulta, error: consultaError } = await supabase
    .from("consultas")
    .select("id, paciente_id, doctora_id, sede, fecha, receta_enviada")
    .eq("id", consultaId)
    .maybeSingle();

  if (consultaError || !consulta) return { status: "error", message: "No encontramos la consulta." };

  // 1. Datos clínicos
  const { error: updateError } = await supabase
    .from("consultas")
    .update({
      diagnostico: texto("diagnostico"),
      tratamiento: texto("tratamiento"),
      notas: texto("notas"),
      notas_ampliadas: texto("notas_ampliadas"),
      proxima_control: texto("proxima_control"),
      ...(accion === "cerrar" ? { estado: "atendida" } : {}),
    })
    .eq("id", consultaId);

  if (updateError) {
    console.error("[consulta] no se pudo guardar:", updateError);
    return {
      status: "error",
      message: conDetalle("No se pudieron guardar los datos de la consulta.", updateError),
    };
  }

  // 2. Datos de facturación, que viven en el expediente del paciente
  const nit = texto("nit");
  const direccion = texto("direccion_facturacion");
  if (nit !== null || direccion !== null) {
    await supabase
      .from("pacientes")
      .update({
        ...(nit !== null ? { nit } : {}),
        ...(direccion !== null ? { direccion } : {}),
      })
      .eq("id", consulta.paciente_id);
  }

  // 3. Receta: una por consulta, se reescribe si ya existía
  const doctoraId = consulta.doctora_id ?? user.id;
  if (medicamentos.length) {
    const { data: existente } = await supabase
      .from("recetas")
      .select("id")
      .eq("consulta_id", consultaId)
      .maybeSingle();

    const fila = {
      consulta_id: consultaId,
      doctora_id: doctoraId,
      medicamentos,
      fecha_emision: new Date().toISOString(),
    };

    const { error: recetaError } = existente
      ? await supabase.from("recetas").update(fila).eq("id", existente.id)
      : await supabase.from("recetas").insert(fila);

    if (recetaError) {
      console.error("[receta] no se pudo guardar:", recetaError);
      return {
        status: "error",
        message: conDetalle("Los datos se guardaron, pero la receta no.", recetaError),
      };
    }
  }

  if (accion === "guardar") return { status: "guardado" };

  // 4. Enviar el resumen al paciente
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("primer_nombre, primer_apellido, email")
    .eq("id", consulta.paciente_id)
    .maybeSingle();

  if (!paciente?.email) return { status: "cerrado", correoEnviado: false };

  const { data: doctora } = await supabase
    .from("staff")
    .select("nombre_agenda, nombre_completo")
    .eq("id", doctoraId)
    .maybeSingle();

  const envio = await enviarRecetaEmail({
    to: paciente.email,
    pacienteNombre: `${paciente.primer_nombre} ${paciente.primer_apellido}`,
    fechaConsulta: consulta.fecha,
    doctoraNombre: doctora?.nombre_agenda ?? doctora?.nombre_completo ?? "Skin Clinic GT",
    sede: consulta.sede,
    diagnostico: texto("diagnostico"),
    tratamiento: texto("tratamiento"),
    notas: texto("notas"),
    medicamentos,
  });

  if (envio.ok) {
    await supabase
      .from("consultas")
      .update({ receta_enviada: true, receta_enviada_en: new Date().toISOString() })
      .eq("id", consultaId);
  }

  return { status: "cerrado", correoEnviado: envio.ok };
}

// ── Administración de citas desde el dashboard ──────────────────────────────

/** Toda acción del dashboard exige sesión de personal. */
async function sesionStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export type PacienteBusqueda = {
  id: string;
  nombre: string;
  numero_identificacion: string;
  telefono: string;
  email: string | null;
};

/** Busca por nombre, apellido o DPI para agendar sin pasar por la web. */
export async function buscarPacientes(query: string): Promise<PacienteBusqueda[]> {
  const sesion = await sesionStaff();
  if (!sesion) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  // Se escapan las comas para que no rompan la sintaxis de `or` de PostgREST.
  const patron = `%${q.replace(/[,()]/g, "")}%`;

  const { data, error } = await sesion.supabase
    .from("pacientes")
    .select("id, primer_nombre, primer_apellido, numero_identificacion, telefono, email")
    .or(
      `primer_nombre.ilike.${patron},primer_apellido.ilike.${patron},numero_identificacion.ilike.${patron}`,
    )
    .order("primer_apellido")
    .limit(10);

  if (error) {
    console.error("[pacientes] búsqueda falló:", error);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: `${p.primer_nombre} ${p.primer_apellido}`,
    numero_identificacion: p.numero_identificacion,
    telefono: p.telefono,
    email: p.email,
  }));
}

/**
 * Crea una cita sin solicitud previa: la clínica agenda por teléfono o en
 * mostrador, que hasta ahora no tenía ninguna vía en la app.
 */
export async function crearCita(datos: {
  pacienteId: string;
  fecha: string;
  hora: string;
  sede: string;
  doctoraId: string;
  motivo?: string;
  avisarPorCorreo: boolean;
}): Promise<{ error?: string; aviso?: string; consultaId?: string }> {
  const sesion = await sesionStaff();
  if (!sesion) return { error: "Tu sesión expiró. Vuelve a entrar." };
  const { supabase } = sesion;

  if (!datos.pacienteId) return { error: "Elige al paciente." };
  if (!datos.fecha || !datos.hora) return { error: "Falta la fecha o la hora." };
  if (!datos.doctoraId) return { error: "Elige a la doctora que atiende." };

  const cuando = new Date(`${datos.fecha}T${datos.hora}`);
  if (Number.isNaN(cuando.getTime())) return { error: "La fecha o la hora no son válidas." };

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("primer_nombre, primer_apellido, email")
    .eq("id", datos.pacienteId)
    .maybeSingle();

  if (!paciente) return { error: "No encontramos a ese paciente." };

  const { data: doctora } = await supabase
    .from("staff")
    .select("nombre_completo, nombre_agenda")
    .eq("id", datos.doctoraId)
    .maybeSingle();

  const { data: creada, error } = await supabase
    .from("consultas")
    .insert({
      paciente_id: datos.pacienteId,
      doctora_id: datos.doctoraId,
      doctora_nombre: doctora?.nombre_agenda ?? doctora?.nombre_completo ?? null,
      sede: datos.sede,
      fecha: cuando.toISOString(),
      motivo: datos.motivo?.trim() || null,
      estado: "agendada",
    })
    .select("id")
    .single();

  if (error || !creada) {
    console.error("[agenda] no se pudo crear la cita:", error);
    return { error: conDetalle("No se pudo crear la cita.", error) };
  }

  if (!datos.avisarPorCorreo) return { consultaId: creada.id };
  if (!paciente.email) {
    return { consultaId: creada.id, aviso: "Cita creada. El paciente no tiene correo registrado." };
  }

  const envio = await enviarConfirmacionAprobacion({
    to: paciente.email,
    nombre: `${paciente.primer_nombre} ${paciente.primer_apellido}`,
    fechaPreferida: cuando.toISOString(),
    hora: datos.hora,
    sede: datos.sede,
  });

  if (!envio.ok) {
    return { consultaId: creada.id, aviso: "Cita creada, pero el correo no salió." };
  }

  return { consultaId: creada.id };
}

/** Mueve una cita de fecha u hora y, si se pide, vuelve a avisar al paciente. */
export async function reprogramarConsulta(
  consultaId: string,
  datos: { fecha: string; hora: string; avisarPorCorreo: boolean },
): Promise<{ error?: string; aviso?: string }> {
  const sesion = await sesionStaff();
  if (!sesion) return { error: "Tu sesión expiró. Vuelve a entrar." };
  const { supabase } = sesion;

  const cuando = new Date(`${datos.fecha}T${datos.hora}`);
  if (Number.isNaN(cuando.getTime())) return { error: "La fecha o la hora no son válidas." };

  const { data: consulta, error } = await supabase
    .from("consultas")
    .update({ fecha: cuando.toISOString(), estado: "agendada" })
    .eq("id", consultaId)
    .select(
      `sede, paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido, email)`,
    )
    .maybeSingle();

  if (error || !consulta) {
    console.error("[agenda] no se pudo reprogramar:", error);
    return { error: conDetalle("No se pudo mover la cita.", error) };
  }

  const paciente = (Array.isArray(consulta.paciente) ? consulta.paciente[0] : consulta.paciente) as {
    primer_nombre: string;
    primer_apellido: string;
    email: string | null;
  } | null;

  if (!datos.avisarPorCorreo) return {};
  if (!paciente?.email) return { aviso: "Cita movida. El paciente no tiene correo registrado." };

  const envio = await enviarConfirmacionAprobacion({
    to: paciente.email,
    nombre: `${paciente.primer_nombre} ${paciente.primer_apellido}`,
    fechaPreferida: cuando.toISOString(),
    hora: datos.hora,
    sede: consulta.sede,
  });

  if (!envio.ok) return { aviso: "Cita movida, pero el correo no salió." };
  return {};
}

const ESTADOS_VALIDOS = ["agendada", "confirmada", "atendida", "cancelada", "no_asistio"];

/** Marcar no asistió, cancelar, o devolver a agendada. */
export async function cambiarEstadoConsulta(
  consultaId: string,
  estado: string,
): Promise<{ error?: string }> {
  const sesion = await sesionStaff();
  if (!sesion) return { error: "Tu sesión expiró. Vuelve a entrar." };
  if (!ESTADOS_VALIDOS.includes(estado)) return { error: "Estado no válido." };

  const { error } = await sesion.supabase
    .from("consultas")
    .update({ estado })
    .eq("id", consultaId);

  if (error) {
    console.error("[agenda] no se pudo cambiar el estado:", error);
    return { error: conDetalle("No se pudo cambiar el estado de la cita.", error) };
  }

  return {};
}

// ── Disponibilidad pública ──────────────────────────────────────────────────

/**
 * Franjas libres de un día. La consulta la hace el cliente de servicio porque
 * quien pregunta es un visitante anónimo; solo se devuelven horas, nunca datos
 * de las citas que las ocupan.
 */
export async function franjasDisponibles(
  fechaISO: string,
  sede?: string,
): Promise<{ hora: string; disponible: boolean }[]> {
  const dia = parseISO(fechaISO);
  if (Number.isNaN(dia.getTime()) || !esDiaAbierto(dia)) return [];

  const supabase = createAdminClient();
  if (!supabase) return [];

  const inicioDia = new Date(dia);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(dia);
  finDia.setHours(23, 59, 59, 999);

  const [{ data: citas }, { data: bloqueos }] = await Promise.all([
    supabase
      .from("consultas")
      .select("fecha, sede")
      .gte("fecha", inicioDia.toISOString())
      .lte("fecha", finDia.toISOString())
      .not("estado", "in", "(cancelada,no_asistio)"),
    supabase
      .from("bloqueos_agenda")
      .select("desde, hasta, sede")
      .lt("desde", finDia.toISOString())
      .gt("hasta", inicioDia.toISOString()),
  ]);

  const mismaSede = (s: string | null) => !sede || !s || s === sede;

  const ocupaciones = [
    // Una cita ocupa su franja; no guardamos duración, así que se asume la
    // franja estándar, que es lo que usa la agenda real.
    ...(citas ?? [])
      .filter((c) => mismaSede(c.sede))
      .map((c) => {
        const desde = new Date(c.fecha);
        return { desde, hasta: new Date(desde.getTime() + HORARIO.minutosPorFranja * 60_000) };
      }),
    ...(bloqueos ?? [])
      .filter((b) => mismaSede(b.sede))
      .map((b) => ({ desde: new Date(b.desde), hasta: new Date(b.hasta) })),
  ];

  return calcularFranjas({ dia, ocupaciones });
}

// ── Bloqueos de agenda (personal) ───────────────────────────────────────────

export type Bloqueo = {
  id: string;
  desde: string;
  hasta: string;
  sede: string | null;
  motivo: string | null;
  doctora_id: string | null;
};

export async function crearBloqueo(datos: {
  desde: string;
  hasta: string;
  sede: string | null;
  doctoraId: string | null;
  motivo: string;
}): Promise<{ error?: string }> {
  const sesion = await sesionStaff();
  if (!sesion) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const desde = new Date(datos.desde);
  const hasta = new Date(datos.hasta);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
    return { error: "Las fechas no son válidas." };
  }
  if (hasta <= desde) return { error: "La fecha de fin debe ser posterior a la de inicio." };

  const { error } = await sesion.supabase.from("bloqueos_agenda").insert({
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    sede: datos.sede,
    doctora_id: datos.doctoraId,
    motivo: datos.motivo.trim() || null,
    creado_por: sesion.user.id,
  });

  if (error) {
    console.error("[bloqueos] no se pudo crear:", error);
    return { error: conDetalle("No se pudo crear el bloqueo.", error) };
  }

  return {};
}

export async function eliminarBloqueo(id: string): Promise<{ error?: string }> {
  const sesion = await sesionStaff();
  if (!sesion) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const { error } = await sesion.supabase.from("bloqueos_agenda").delete().eq("id", id);
  if (error) {
    console.error("[bloqueos] no se pudo eliminar:", error);
    return { error: conDetalle("No se pudo eliminar el bloqueo.", error) };
  }
  return {};
}
