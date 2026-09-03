/**
 * Horario de atención y cálculo de franjas libres.
 *
 * Vive en código y no en la base a propósito: es una regla de negocio estable
 * que cambia pocas veces al año. Ajustar aquí no requiere migración.
 */

export const HORARIO = {
  /** 1 = lunes … 6 = sábado. Domingo (0) cerrado. */
  diasAbiertos: [1, 2, 3, 4, 5, 6],
  apertura: "08:00",
  cierre: "18:00",
  /** Duración de cada franja en minutos. La agenda real usa 30. */
  minutosPorFranja: 30,
  /** Con cuánta anticipación mínima se puede pedir una cita. */
  horasMinimasDeAnticipacion: 24,
  /** Hasta cuántos días hacia adelante se puede pedir. */
  diasMaximosAdelante: 60,
} as const;

export type Franja = {
  /** "HH:mm" */
  hora: string;
  disponible: boolean;
};

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Todas las franjas del día, sin mirar ocupación. */
export function franjasDelDia(): string[] {
  const franjas: string[] = [];
  const fin = aMinutos(HORARIO.cierre);
  for (let m = aMinutos(HORARIO.apertura); m + HORARIO.minutosPorFranja <= fin; m += HORARIO.minutosPorFranja) {
    franjas.push(aHora(m));
  }
  return franjas;
}

export function esDiaAbierto(fecha: Date) {
  return (HORARIO.diasAbiertos as readonly number[]).includes(fecha.getDay());
}

/** Rango [desde, hasta) que ocupa una cita o un bloqueo. */
type Ocupacion = { desde: Date; hasta: Date };

/**
 * Franjas de un día con su disponibilidad.
 *
 * Una franja se marca ocupada si se traslapa con una cita o con un bloqueo, y
 * también si ya pasó la anticipación mínima. El traslape se evalúa por rango y
 * no por hora exacta: una cita de 60 minutos tapa dos franjas de 30.
 */
export function calcularFranjas({
  dia,
  ocupaciones,
  ahora = new Date(),
}: {
  dia: Date;
  ocupaciones: Ocupacion[];
  ahora?: Date;
}): Franja[] {
  if (!esDiaAbierto(dia)) return [];

  const minimo = new Date(ahora.getTime() + HORARIO.horasMinimasDeAnticipacion * 3600_000);

  return franjasDelDia().map((hora) => {
    const [h, m] = hora.split(":").map(Number);
    const inicio = new Date(dia);
    inicio.setHours(h, m, 0, 0);
    const fin = new Date(inicio.getTime() + HORARIO.minutosPorFranja * 60_000);

    if (inicio < minimo) return { hora, disponible: false };

    const chocada = ocupaciones.some((o) => inicio < o.hasta && fin > o.desde);
    return { hora, disponible: !chocada };
  });
}

/** Rango de días que el paciente puede elegir. */
export function ventanaDeReserva(ahora = new Date()) {
  const desde = new Date(ahora);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + HORARIO.diasMaximosAdelante);
  return { desde, hasta };
}
