/**
 * Datos de contacto público de la clínica.
 *
 * El número de WhatsApp vive aquí (y no repartido por el marcado) porque lo
 * usan el hero, el bloque de citas y, cuando haga falta, los correos. Se puede
 * sobreescribir sin tocar código con NEXT_PUBLIC_WHATSAPP en el entorno.
 *
 * Formato: código de país + número, sin +, sin espacios ni guiones.
 * Guatemala es 502, así que un 5555-5555 se escribe 50255555555.
 */
const NUMERO_POR_DEFECTO = "50200000000"; // ← PENDIENTE: número real de la clínica

export const WHATSAPP_NUMERO =
  process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "") || NUMERO_POR_DEFECTO;

/** Lo que aparece ya escrito en el chat cuando el paciente abre WhatsApp. */
export const WHATSAPP_MENSAJE =
  "Hola, me gustaría agendar una cita en Skin Clinic GT.";

/** "5555 5555" — solo para mostrar. */
export const WHATSAPP_LEGIBLE = WHATSAPP_NUMERO.startsWith("502")
  ? WHATSAPP_NUMERO.slice(3).replace(/(\d{4})(\d{4})/, "$1 $2")
  : WHATSAPP_NUMERO;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(
  WHATSAPP_MENSAJE,
)}`;
