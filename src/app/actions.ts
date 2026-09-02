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
      sede,
    });
    correoEnviado = envio.ok;
  }

  return { status: "success", correoEnviado };
}

// ── Confirmar solicitud (secretaria) ──────────────────────────────────────────

export async function confirmarSolicitud(
  solicitudId: string,
): Promise<{ error?: string; aviso?: string }> {
  const supabase = await createClient();

  // Solo pasa de "pendiente" a "agendada": evita reenviar el correo en un doble clic.
  const { data: solicitud, error } = await supabase
    .from("solicitudes_cita")
    .update({ estado: "agendada" })
    .eq("id", solicitudId)
    .eq("estado", "pendiente")
    .select("nombre, email, fecha_preferida, sede")
    .maybeSingle();

  if (error) return { error: "No se pudo confirmar la solicitud." };
  if (!solicitud) return {}; // ya estaba confirmada o cancelada

  if (!solicitud.email) {
    return { aviso: "Cita confirmada. No hay correo registrado: avísale por teléfono." };
  }

  const envio = await enviarConfirmacionAprobacion({
    to: solicitud.email,
    nombre: solicitud.nombre,
    fechaPreferida: solicitud.fecha_preferida,
    sede: solicitud.sede,
  });

  if (!envio.ok) {
    return { aviso: "Cita confirmada, pero el correo no salió. Avísale por teléfono." };
  }

  return {};
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
