/**
 * Tarifas de la clínica, en un solo lugar.
 *
 * La confusión que hay que evitar es siempre la misma: el paciente cree que los
 * Q400 incluyen lo que le hagan. No: la consulta se cobra aparte del
 * procedimiento. El texto vive aquí para que el sitio, el correo de solicitud y
 * el de confirmación digan exactamente lo mismo.
 */

export const PRECIO_CONSULTA = 400;

export const MONEDA = "Q";

/** "Q400" */
export const PRECIO_CONSULTA_TEXTO = `${MONEDA}${PRECIO_CONSULTA}`;

/** La aclaración completa. Es la que debe leer el paciente antes de agendar. */
export const ACLARACION_PRECIO =
  `La consulta cuesta ${PRECIO_CONSULTA_TEXTO}. Ese monto cubre la evaluación con la doctora: ` +
  `cualquier procedimiento que se realice se cobra aparte, según lo que se necesite. ` +
  `Antes de hacer cualquier procedimiento te decimos su precio.`;

/** Versión corta para lugares donde no cabe el párrafo completo. */
export const ACLARACION_PRECIO_CORTA =
  `Consulta ${PRECIO_CONSULTA_TEXTO} + el procedimiento que se realice, cobrado aparte.`;
