"use server";

import { createClient } from "@/lib/supabase/server";
import { enviarRecetaEmail } from "@/lib/email";
import { setPortalCookie, clearPortalCookie } from "@/lib/portal-session";
import { redirect } from "next/navigation";

// ── Solicitud de cita (landing page pública) ──────────────────────────────────

export type SolicitudState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function solicitarCita(
  _prev: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  const nombre = formData.get("nombre")?.toString().trim();
  const telefono = formData.get("telefono")?.toString().trim();
  const email = formData.get("email")?.toString().trim() || null;
  const sede = formData.get("sede")?.toString() || "Sin preferencia";
  const motivo = formData.get("motivo")?.toString().trim() || null;
  const fechaStr = formData.get("fecha_preferida")?.toString();
  const fecha_preferida = fechaStr ? fechaStr : null;

  if (!nombre || !telefono) {
    return { status: "error", message: "Nombre y teléfono son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("solicitudes_cita").insert({
    nombre,
    telefono,
    email,
    sede,
    motivo,
    fecha_preferida,
  });

  if (error) return { status: "error", message: "No pudimos registrar tu solicitud. Intenta de nuevo." };
  return { status: "success" };
}

// ── Finalizar consulta + enviar receta por correo ──────────────────────────────

export async function finalizarConsulta(consultaId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 1. Marcar como atendida
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

  if (!paciente?.email) return {}; // Sin email, finalizado pero sin envío

  if (consulta.receta_enviada) return {}; // Ya enviada

  // 2. Buscar receta asociada
  const { data: receta } = await supabase
    .from("recetas")
    .select("medicamentos")
    .eq("consulta_id", consultaId)
    .single();

  const doctora = Array.isArray(consulta.doctora) ? consulta.doctora[0] : consulta.doctora as { nombre_completo: string } | null;

  // 3. Enviar email
  try {
    await enviarRecetaEmail({
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

    // 4. Marcar receta como enviada
    await supabase
      .from("consultas")
      .update({ receta_enviada: true, receta_enviada_en: new Date().toISOString() })
      .eq("id", consultaId);
  } catch (err) {
    console.error("Error enviando receta:", err);
    // No bloqueamos el flujo si el email falla
  }

  return {};
}

// ── Portal de pacientes ────────────────────────────────────────────────────────

export type PortalLoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function loginPortal(
  _prev: PortalLoginState,
  formData: FormData
): Promise<PortalLoginState> {
  const dpi = formData.get("dpi")?.toString().trim();
  const fechaNacimiento = formData.get("fecha_nacimiento")?.toString().trim();

  if (!dpi || !fechaNacimiento) {
    return { status: "error", message: "Completa ambos campos." };
  }

  // Usamos el supabase service-role-less client — RLS debe permitir esta consulta
  // (usamos anon key, la tabla pacientes no expone datos sensibles por este path)
  const supabase = await createClient();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, primer_nombre")
    .eq("numero_identificacion", dpi)
    .eq("fecha_nacimiento", fechaNacimiento)
    .single();

  if (!paciente) {
    return { status: "error", message: "No encontramos un paciente con ese DPI y fecha de nacimiento." };
  }

  await setPortalCookie(paciente.id);
  redirect("/mis-citas");
}

export async function logoutPortal() {
  await clearPortalCookie();
  redirect("/#mis-citas");
}

export async function cancelarSolicitud(solicitudId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solicitudes_cita")
    .update({ estado: "cancelada" })
    .eq("id", solicitudId);

  if (error) return { error: "No se pudo cancelar." };
  return {};
}
