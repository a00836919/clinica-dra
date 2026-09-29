/**
 * Horas de pared de Guatemala, independientes de la zona del servidor.
 *
 * Guatemala es UTC-6 todo el año, sin horario de verano, así que el desfase es
 * fijo y no hace falta una base de zonas horarias. Existe porque `new Date("…T09:00")`
 * se interpreta en la zona de quien lo ejecuta: en un servidor en UTC eso mueve
 * la cita seis horas, que es exactamente el error que tuvo la importación.
 */

export const DESFASE_GUATEMALA = "-06:00";
const DESFASE_MS = -6 * 3600_000;

/** "2026-10-02" + "10:30" → el instante de las 10:30 en Guatemala. */
export function instanteGuatemala(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${DESFASE_GUATEMALA}`);
}

/** Día, hora y minutos desde medianoche de un instante, vistos desde Guatemala. */
export function enGuatemala(instante: Date | string) {
  // Se corre el instante y se lee en UTC: así da lo mismo la zona del proceso.
  const local = new Date(new Date(instante).getTime() + DESFASE_MS);
  const iso = local.toISOString();
  return {
    /** "yyyy-MM-dd" */
    fecha: iso.slice(0, 10),
    /** "HH:mm" */
    hora: iso.slice(11, 16),
    minutos: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

/** Día de la semana (0 = domingo) de una fecha "yyyy-MM-dd". */
export function diaSemana(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}
