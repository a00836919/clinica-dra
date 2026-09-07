/** Sedes de la clínica. Estaba repetido en cuatro archivos. */
export const SEDES = ["Integra", "Decorísima", "Galerías Tiffany"] as const;

export type Sede = (typeof SEDES)[number];

export const SIN_PREFERENCIA = "Sin preferencia";

/**
 * Referencia de ubicación que se muestra junto al nombre.
 *
 * El nombre a secas es el que ya está guardado en `consultas.sede` y en
 * `solicitudes_cita.sede`: cambiarlo obligaría a migrar filas viejas, así que la
 * zona vive aparte y solo se usa para mostrar.
 */
export const UBICACION_SEDE: Record<Sede, string | null> = {
  Integra: null,
  Decorísima: null,
  "Galerías Tiffany": "Zona 14",
};

/** "Galerías Tiffany · Zona 14" para pantallas y correos. */
export function nombreSedeCompleto(sede: string | null | undefined): string {
  if (!sede) return SIN_PREFERENCIA;
  const zona = UBICACION_SEDE[sede as Sede];
  return zona ? `${sede} · ${zona}` : sede;
}
