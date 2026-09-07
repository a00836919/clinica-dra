/**
 * Identificación del paciente: DPI o pasaporte.
 *
 * Antes el sistema asumía DPI y punto, así que un extranjero no podía ni pedir
 * cita ni entrar al portal. `pacientes.tipo_identificacion` ya existía en la
 * base; lo que faltaba era usarla.
 */

export const TIPOS_IDENTIFICACION = ["DPI", "Pasaporte"] as const;

export type TipoIdentificacion = (typeof TIPOS_IDENTIFICACION)[number];

export const TIPO_POR_DEFECTO: TipoIdentificacion = "DPI";

export function esTipoIdentificacion(valor: string | null | undefined): valor is TipoIdentificacion {
  return (TIPOS_IDENTIFICACION as readonly string[]).includes(valor ?? "");
}

/** El tipo guardado en la base puede venir viejo o vacío: se asume DPI. */
export function tipoIdentificacion(valor: string | null | undefined): TipoIdentificacion {
  return esTipoIdentificacion(valor) ? valor : TIPO_POR_DEFECTO;
}

export const PLACEHOLDER_IDENTIFICACION: Record<TipoIdentificacion, string> = {
  DPI: "1234567890101",
  Pasaporte: "A1234567",
};

/**
 * Cómo se nombra el documento dentro de una frase.
 *
 * "DPI" son siglas y van en mayúsculas siempre; "pasaporte" es un sustantivo
 * común. Sin esto salían frases como "no encontramos ese dpi".
 */
export function nombreEnFrase(tipo: TipoIdentificacion): string {
  return tipo === "DPI" ? "DPI" : "pasaporte";
}

/**
 * Normaliza antes de guardar y de comparar. El DPI se queda solo con dígitos
 * (la gente lo escribe con espacios o guiones) y el pasaporte en mayúsculas sin
 * separadores, para que "a1234567" y "A 1234567" no sean dos pacientes.
 */
export function normalizarIdentificacion(tipo: TipoIdentificacion, valor: string): string {
  const limpio = valor.trim();
  return tipo === "DPI" ? limpio.replace(/\D/g, "") : limpio.replace(/[\s-]/g, "").toUpperCase();
}

/** Mensaje de error, o null si el número sirve. */
export function validarIdentificacion(tipo: TipoIdentificacion, valor: string): string | null {
  const limpio = normalizarIdentificacion(tipo, valor);
  if (!limpio) return "Escribe tu número de identificación.";

  if (tipo === "DPI") {
    // 13 dígitos exactos. No se valida el dígito verificador: rechazar un DPI
    // real por un cálculo nuestro es peor que aceptar uno mal tecleado, que la
    // clínica corrige en mostrador.
    if (limpio.length !== 13) return "El DPI tiene 13 dígitos.";
    return null;
  }

  if (limpio.length < 5 || limpio.length > 15) {
    return "Revisa el número de pasaporte.";
  }
  if (!/^[A-Z0-9]+$/.test(limpio)) {
    return "El pasaporte solo lleva letras y números.";
  }
  return null;
}
