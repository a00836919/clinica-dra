/**
 * Catálogo CIE-10 de uso dermatológico.
 *
 * No es el CIE-10 completo (son ~14 000 códigos): es la lista corta con la que
 * se cierra el 95 % de las consultas de piel, pelo y uñas. El campo queda libre
 * para escribir cualquier otro código a mano, así que la lista ayuda sin
 * estorbar.
 *
 * Se usa en dos lugares: el diagnóstico de la consulta y la receta que se le
 * manda al paciente, que es la que le sirve para el seguro.
 */

export type CodigoCie10 = {
  codigo: string;
  descripcion: string;
  categoria: string;
};

export const CIE10: readonly CodigoCie10[] = [
  // ── Acné, rosácea y folículo ──────────────────────────────────────────────
  { codigo: "L70.0", descripcion: "Acné vulgar", categoria: "Acné y folículo" },
  { codigo: "L70.1", descripcion: "Acné conglobata", categoria: "Acné y folículo" },
  { codigo: "L70.8", descripcion: "Otros acnés", categoria: "Acné y folículo" },
  { codigo: "L70.9", descripcion: "Acné, no especificado", categoria: "Acné y folículo" },
  { codigo: "L71.0", descripcion: "Dermatitis perioral", categoria: "Acné y folículo" },
  { codigo: "L71.9", descripcion: "Rosácea, no especificada", categoria: "Acné y folículo" },
  { codigo: "L73.0", descripcion: "Acné queloide", categoria: "Acné y folículo" },
  { codigo: "L73.2", descripcion: "Hidradenitis supurativa", categoria: "Acné y folículo" },
  { codigo: "L73.9", descripcion: "Trastorno folicular, no especificado", categoria: "Acné y folículo" },
  { codigo: "L72.0", descripcion: "Quiste epidérmico", categoria: "Acné y folículo" },
  { codigo: "L72.1", descripcion: "Quiste tricodérmico (sebáceo)", categoria: "Acné y folículo" },

  // ── Dermatitis y eccema ───────────────────────────────────────────────────
  { codigo: "L20.9", descripcion: "Dermatitis atópica, no especificada", categoria: "Dermatitis y eccema" },
  { codigo: "L21.0", descripcion: "Seborrea capitis (costra láctea)", categoria: "Dermatitis y eccema" },
  { codigo: "L21.9", descripcion: "Dermatitis seborreica, no especificada", categoria: "Dermatitis y eccema" },
  { codigo: "L22", descripcion: "Dermatitis del pañal", categoria: "Dermatitis y eccema" },
  { codigo: "L23.9", descripcion: "Dermatitis alérgica de contacto, causa no especificada", categoria: "Dermatitis y eccema" },
  { codigo: "L24.9", descripcion: "Dermatitis de contacto por irritantes, causa no especificada", categoria: "Dermatitis y eccema" },
  { codigo: "L25.9", descripcion: "Dermatitis de contacto, no especificada", categoria: "Dermatitis y eccema" },
  { codigo: "L27.0", descripcion: "Erupción cutánea generalizada por medicamentos", categoria: "Dermatitis y eccema" },
  { codigo: "L28.0", descripcion: "Liquen simple crónico", categoria: "Dermatitis y eccema" },
  { codigo: "L28.1", descripcion: "Prurigo nodular", categoria: "Dermatitis y eccema" },
  { codigo: "L29.9", descripcion: "Prurito, no especificado", categoria: "Dermatitis y eccema" },
  { codigo: "L30.0", descripcion: "Dermatitis numular", categoria: "Dermatitis y eccema" },
  { codigo: "L30.9", descripcion: "Dermatitis, no especificada", categoria: "Dermatitis y eccema" },

  // ── Papuloescamosas y urticaria ───────────────────────────────────────────
  { codigo: "L40.0", descripcion: "Psoriasis vulgar", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L40.1", descripcion: "Psoriasis pustulosa generalizada", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L40.5", descripcion: "Artropatía psoriásica", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L40.9", descripcion: "Psoriasis, no especificada", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L42", descripcion: "Pitiriasis rosada", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L43.9", descripcion: "Liquen plano, no especificado", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L44.0", descripcion: "Pitiriasis rubra pilaris", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L50.0", descripcion: "Urticaria alérgica", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L50.1", descripcion: "Urticaria idiopática", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L50.9", descripcion: "Urticaria, no especificada", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L51.9", descripcion: "Eritema multiforme, no especificado", categoria: "Papuloescamosas y urticaria" },
  { codigo: "L53.9", descripcion: "Afección eritematosa, no especificada", categoria: "Papuloescamosas y urticaria" },

  // ── Pelo y uñas ───────────────────────────────────────────────────────────
  { codigo: "L63.9", descripcion: "Alopecia areata, no especificada", categoria: "Pelo y uñas" },
  { codigo: "L64.0", descripcion: "Alopecia androgénica inducida por drogas", categoria: "Pelo y uñas" },
  { codigo: "L64.9", descripcion: "Alopecia androgénica, no especificada", categoria: "Pelo y uñas" },
  { codigo: "L65.0", descripcion: "Efluvio telógeno", categoria: "Pelo y uñas" },
  { codigo: "L65.9", descripcion: "Pérdida no cicatricial del pelo, no especificada", categoria: "Pelo y uñas" },
  { codigo: "L66.1", descripcion: "Liquen plano pilaris", categoria: "Pelo y uñas" },
  { codigo: "L68.0", descripcion: "Hirsutismo", categoria: "Pelo y uñas" },
  { codigo: "L60.0", descripcion: "Uña encarnada", categoria: "Pelo y uñas" },
  { codigo: "L60.9", descripcion: "Trastorno de la uña, no especificado", categoria: "Pelo y uñas" },

  // ── Pigmentación y fotodaño ───────────────────────────────────────────────
  { codigo: "L80", descripcion: "Vitíligo", categoria: "Pigmentación y fotodaño" },
  { codigo: "L81.0", descripcion: "Hiperpigmentación postinflamatoria", categoria: "Pigmentación y fotodaño" },
  { codigo: "L81.1", descripcion: "Cloasma (melasma)", categoria: "Pigmentación y fotodaño" },
  { codigo: "L81.4", descripcion: "Otras hiperpigmentaciones melanodérmicas (lentigos)", categoria: "Pigmentación y fotodaño" },
  { codigo: "L81.9", descripcion: "Trastorno de la pigmentación, no especificado", categoria: "Pigmentación y fotodaño" },
  { codigo: "L57.0", descripcion: "Queratosis actínica", categoria: "Pigmentación y fotodaño" },
  { codigo: "L57.9", descripcion: "Cambios de la piel por exposición crónica al sol", categoria: "Pigmentación y fotodaño" },
  { codigo: "L55.0", descripcion: "Quemadura solar de primer grado", categoria: "Pigmentación y fotodaño" },

  // ── Infecciones ───────────────────────────────────────────────────────────
  { codigo: "L01.0", descripcion: "Impétigo", categoria: "Infecciones" },
  { codigo: "L02.9", descripcion: "Absceso cutáneo, furúnculo o ántrax, sin especificar", categoria: "Infecciones" },
  { codigo: "L03.9", descripcion: "Celulitis, no especificada", categoria: "Infecciones" },
  { codigo: "L08.9", descripcion: "Infección local de la piel, no especificada", categoria: "Infecciones" },
  { codigo: "B00.1", descripcion: "Herpes simple labial (dermatitis vesicular)", categoria: "Infecciones" },
  { codigo: "B00.9", descripcion: "Infección por herpes simple, no especificada", categoria: "Infecciones" },
  { codigo: "B02.9", descripcion: "Herpes zóster sin complicación", categoria: "Infecciones" },
  { codigo: "B07", descripcion: "Verrugas víricas", categoria: "Infecciones" },
  { codigo: "B08.1", descripcion: "Molusco contagioso", categoria: "Infecciones" },
  { codigo: "B35.0", descripcion: "Tiña de la barba y del cuero cabelludo", categoria: "Infecciones" },
  { codigo: "B35.1", descripcion: "Tiña de las uñas (onicomicosis)", categoria: "Infecciones" },
  { codigo: "B35.2", descripcion: "Tiña de la mano", categoria: "Infecciones" },
  { codigo: "B35.3", descripcion: "Tiña del pie", categoria: "Infecciones" },
  { codigo: "B35.4", descripcion: "Tiña del cuerpo", categoria: "Infecciones" },
  { codigo: "B35.6", descripcion: "Tiña inguinal", categoria: "Infecciones" },
  { codigo: "B36.0", descripcion: "Pitiriasis versicolor", categoria: "Infecciones" },
  { codigo: "B37.2", descripcion: "Candidiasis de la piel y las uñas", categoria: "Infecciones" },
  { codigo: "B85.0", descripcion: "Pediculosis de la cabeza", categoria: "Infecciones" },
  { codigo: "B86", descripcion: "Escabiosis", categoria: "Infecciones" },

  // ── Lesiones y tumores ────────────────────────────────────────────────────
  { codigo: "D22.9", descripcion: "Nevo melanocítico, sitio no especificado", categoria: "Lesiones y tumores" },
  { codigo: "D23.9", descripcion: "Tumor benigno de la piel, sitio no especificado", categoria: "Lesiones y tumores" },
  { codigo: "D18.0", descripcion: "Hemangioma", categoria: "Lesiones y tumores" },
  { codigo: "D48.5", descripcion: "Tumor de comportamiento incierto de la piel", categoria: "Lesiones y tumores" },
  { codigo: "D04.9", descripcion: "Carcinoma in situ de la piel, sitio no especificado", categoria: "Lesiones y tumores" },
  { codigo: "C44.9", descripcion: "Neoplasia maligna de la piel, sitio no especificado", categoria: "Lesiones y tumores" },
  { codigo: "C43.9", descripcion: "Melanoma maligno de la piel, sitio no especificado", categoria: "Lesiones y tumores" },
  { codigo: "L82", descripcion: "Queratosis seborreica", categoria: "Lesiones y tumores" },
  { codigo: "L84", descripcion: "Callos y callosidades", categoria: "Lesiones y tumores" },
  { codigo: "Q82.5", descripcion: "Nevo no neoplásico congénito", categoria: "Lesiones y tumores" },

  // ── Cicatrices, inflamatorias y otras ─────────────────────────────────────
  { codigo: "L90.5", descripcion: "Cicatriz y fibrosis de la piel", categoria: "Otras" },
  { codigo: "L91.0", descripcion: "Cicatriz queloide", categoria: "Otras" },
  { codigo: "L92.0", descripcion: "Granuloma anular", categoria: "Otras" },
  { codigo: "L93.0", descripcion: "Lupus eritematoso discoide", categoria: "Otras" },
  { codigo: "L94.0", descripcion: "Esclerodermia localizada (morfea)", categoria: "Otras" },
  { codigo: "L95.9", descripcion: "Vasculitis limitada a la piel, no especificada", categoria: "Otras" },
  { codigo: "L83", descripcion: "Acantosis nigricans", categoria: "Otras" },
  { codigo: "L85.3", descripcion: "Xerosis cutis", categoria: "Otras" },
  { codigo: "L88", descripcion: "Piodermia gangrenosa", categoria: "Otras" },
  { codigo: "L97", descripcion: "Úlcera de miembro inferior, no clasificada en otra parte", categoria: "Otras" },
  { codigo: "L98.9", descripcion: "Trastorno de la piel y del tejido subcutáneo, no especificado", categoria: "Otras" },
  { codigo: "R21", descripcion: "Erupción cutánea inespecífica", categoria: "Otras" },
  { codigo: "R23.4", descripcion: "Cambios en la textura de la piel", categoria: "Otras" },
  { codigo: "R61", descripcion: "Hiperhidrosis", categoria: "Otras" },
  { codigo: "Z12.8", descripcion: "Examen de pesquisa de tumores (control de lunares)", categoria: "Otras" },
  { codigo: "Z41.1", descripcion: "Procedimiento estético sin diagnóstico de enfermedad", categoria: "Otras" },
];

/** Quita tildes y baja a minúsculas: "psoriásica" debe encontrarse con "psoriasica". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca por código o por descripción. Los que empiezan con lo tecleado van
 * primero: quien escribe "L70" busca el acné, no todo lo que mencione 70.
 */
export function buscarCie10(consulta: string, limite = 12): CodigoCie10[] {
  const q = normalizar(consulta);
  if (!q) return [];

  const coincidencias = CIE10.filter(
    (c) => normalizar(c.codigo).includes(q) || normalizar(c.descripcion).includes(q),
  );

  return coincidencias
    .sort((a, b) => {
      const pesoA = normalizar(a.codigo).startsWith(q) ? 0 : normalizar(a.descripcion).startsWith(q) ? 1 : 2;
      const pesoB = normalizar(b.codigo).startsWith(q) ? 0 : normalizar(b.descripcion).startsWith(q) ? 1 : 2;
      return pesoA - pesoB || a.codigo.localeCompare(b.codigo);
    })
    .slice(0, limite);
}

export function descripcionCie10(codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  const normalizado = codigo.trim().toUpperCase();
  return CIE10.find((c) => c.codigo === normalizado)?.descripcion ?? null;
}

/** "L70.0 — Acné vulgar", para pantallas, correos y recetas. */
export function etiquetaCie10(codigo: string | null | undefined, descripcion?: string | null): string | null {
  if (!codigo?.trim()) return null;
  const texto = descripcion?.trim() || descripcionCie10(codigo);
  return texto ? `${codigo.trim().toUpperCase()} — ${texto}` : codigo.trim().toUpperCase();
}
