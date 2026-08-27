"use server";

import { createClient } from "@/lib/supabase/server";

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

  if (error) {
    return { status: "error", message: "No pudimos registrar tu solicitud. Intenta de nuevo." };
  }

  return { status: "success" };
}
