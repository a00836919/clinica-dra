/**
 * Generación de calendarios iCalendar (RFC 5545).
 *
 * Se eligió un feed ICS en vez de la API de Google Calendar a propósito: un
 * enlace de suscripción funciona igual en Google, Apple y Outlook, no pide
 * OAuth ni consentimiento de Google, no caduca cuando la doctora cambia su
 * contraseña y no guarda tokens de terceros en nuestra base. El precio es que
 * la sincronía es de lectura y con retraso (Google refresca cada pocas horas),
 * que para una agenda de consultorio es aceptable.
 */

export type EventoIcs = {
  /** Estable en el tiempo: es lo que permite actualizar en vez de duplicar. */
  uid: string;
  inicio: Date;
  fin: Date;
  titulo: string;
  descripcion?: string | null;
  lugar?: string | null;
  url?: string | null;
  /** CONFIRMED | TENTATIVE | CANCELLED */
  estado?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  /** Cambia con cada edición para que el cliente sepa que hay versión nueva. */
  actualizado?: Date;
};

function comoUtc(fecha: Date) {
  return `${fecha.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Escapa según RFC 5545: la coma y el punto y coma separan campos. */
function esc(texto: string) {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Las líneas van cortadas a 75 octetos con continuación por espacio. Se cuenta
 * en bytes y no en caracteres: una tilde ocupa dos, y cortar a la mitad de un
 * carácter multibyte rompe el archivo en Outlook.
 */
function plegar(linea: string): string {
  const bytes = Buffer.from(linea, "utf8");
  if (bytes.length <= 75) return linea;

  const partes: string[] = [];
  let inicio = 0;
  let limite = 75;

  while (inicio < bytes.length) {
    let fin = Math.min(inicio + limite, bytes.length);
    // Retrocede hasta el inicio de un carácter completo.
    while (fin < bytes.length && (bytes[fin] & 0b1100_0000) === 0b1000_0000) fin--;
    partes.push(bytes.subarray(inicio, fin).toString("utf8"));
    inicio = fin;
    // Las continuaciones llevan un espacio al frente, que también cuenta.
    limite = 74;
  }

  return partes.join("\r\n ");
}

function campo(nombre: string, valor: string) {
  return plegar(`${nombre}:${valor}`);
}

export function construirCalendario({
  nombre,
  descripcion,
  eventos,
  /** Cada cuántos minutos debería refrescar el cliente. */
  refrescoMinutos = 60,
}: {
  nombre: string;
  descripcion?: string;
  eventos: EventoIcs[];
  refrescoMinutos?: number;
}): string {
  const ahora = comoUtc(new Date());

  const lineas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skin Clinic GT//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    campo("X-WR-CALNAME", esc(nombre)),
    campo("NAME", esc(nombre)),
    "X-WR-TIMEZONE:America/Guatemala",
    // Google y Apple usan estos dos para decidir cada cuánto vuelven a pedir.
    campo("REFRESH-INTERVAL;VALUE=DURATION", `PT${refrescoMinutos}M`),
    campo("X-PUBLISHED-TTL", `PT${refrescoMinutos}M`),
  ];

  if (descripcion) {
    lineas.push(campo("X-WR-CALDESC", esc(descripcion)), campo("DESCRIPTION", esc(descripcion)));
  }

  for (const evento of eventos) {
    lineas.push(
      "BEGIN:VEVENT",
      campo("UID", evento.uid),
      campo("DTSTAMP", ahora),
      campo("DTSTART", comoUtc(evento.inicio)),
      campo("DTEND", comoUtc(evento.fin)),
      campo("SUMMARY", esc(evento.titulo)),
      campo("STATUS", evento.estado ?? "CONFIRMED"),
    );

    if (evento.descripcion) lineas.push(campo("DESCRIPTION", esc(evento.descripcion)));
    if (evento.lugar) lineas.push(campo("LOCATION", esc(evento.lugar)));
    if (evento.url) lineas.push(campo("URL", evento.url));
    if (evento.actualizado) {
      lineas.push(campo("LAST-MODIFIED", comoUtc(evento.actualizado)));
      // SEQUENCE tiene que crecer para que el cliente acepte el cambio; los
      // minutos desde la época dan un número creciente y estable.
      lineas.push(campo("SEQUENCE", String(Math.floor(evento.actualizado.getTime() / 60_000))));
    }

    lineas.push("END:VEVENT");
  }

  lineas.push("END:VCALENDAR");

  // CRLF obligatorio, y salto final: Outlook descarta el archivo sin él.
  return `${lineas.join("\r\n")}\r\n`;
}

/** Enlace para agregar la cita a Google Calendar desde el navegador. */
export function enlaceGoogleCalendar(evento: EventoIcs): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titulo,
    dates: `${comoUtc(evento.inicio)}/${comoUtc(evento.fin)}`,
    ctz: "America/Guatemala",
  });
  if (evento.descripcion) params.set("details", evento.descripcion);
  if (evento.lugar) params.set("location", evento.lugar);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
