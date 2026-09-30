import type { Medicamento } from "@/app/actions";

/**
 * Los medicamentos de una receta tal como vienen de la base.
 *
 * Las primeras recetas (agosto 2026) se guardaron como {name, dose, freq,
 * duration}; las actuales, como {nombre, dosis, instrucciones}. Leer las viejas
 * como si fueran nuevas dejaba `nombre` en undefined, y el `.trim()` del
 * historial tumbaba la página de la consulta. Un elemento sin nombre se omite.
 */
export function leerMedicamentos(valor: unknown): Medicamento[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((m): Medicamento[] => {
    if (!m || typeof m !== "object") return [];
    const o = m as Record<string, unknown>;

    const nombre = texto(o.nombre) ?? texto(o.name);
    if (!nombre) return [];

    const instrucciones =
      texto(o.instrucciones) ?? ([texto(o.freq), texto(o.duration)].filter(Boolean).join(" · ") || undefined);

    return [{ nombre, dosis: texto(o.dosis) ?? texto(o.dose), instrucciones }];
  });
}

function texto(v: unknown) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
