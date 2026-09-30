/**
 * Horario de atención y cálculo de franjas libres.
 *
 * Vive en código y no en la base a propósito: es una regla de negocio estable
 * que cambia pocas veces al año. Ajustar aquí no requiere migración.
 *
 * La doctora no atiende "de 8 a 6 en cualquier sede": cada día tiene una sede y
 * una ventana propias, así que el horario es una tabla de bloques y no un par
 * apertura/cierre. Ofrecer una hora en la sede equivocada era la forma más fácil
 * de agendar una cita a la que nadie iba a llegar.
 */

import { SEDES, type Sede } from "@/lib/sedes";
import { instanteGuatemala } from "@/lib/hora-guatemala";

export type BloqueAtencion = {
  /** 1 = lunes … 6 = sábado. Domingo (0) cerrado. */
  dia: number;
  sede: Sede;
  /** "HH:mm" */
  desde: string;
  /** "HH:mm", exclusivo: una franja debe terminar antes o justo a esta hora. */
  hasta: string;
};

export const ATENCION: readonly BloqueAtencion[] = [
  { dia: 1, sede: "Integra", desde: "09:00", hasta: "12:00" },
  { dia: 2, sede: "Decorísima", desde: "09:00", hasta: "12:00" },
  { dia: 3, sede: "Integra", desde: "13:00", hasta: "17:00" },
  { dia: 4, sede: "Decorísima", desde: "09:00", hasta: "12:00" },
  { dia: 5, sede: "Integra", desde: "09:00", hasta: "12:00" },
  { dia: 6, sede: "Galerías Tiffany", desde: "08:00", hasta: "11:00" },
];

export const HORARIO = {
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

const NOMBRE_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const NOMBRE_DIA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Una sede "sin preferencia" o vacía no filtra: en un día dado hay una sola
 * sede, así que no elegirla equivale a aceptar la que toque.
 */
function filtraSede(sede: string | null | undefined) {
  return Boolean(sede) && (SEDES as readonly string[]).includes(sede as string);
}

/** Bloques de atención de un día concreto, opcionalmente de una sola sede. */
export function bloquesDelDia(fecha: Date, sede?: string | null): BloqueAtencion[] {
  const dia = fecha.getDay();
  return ATENCION.filter((b) => b.dia === dia && (!filtraSede(sede) || b.sede === sede));
}

/** Días de la semana (1–6) en los que atiende una sede. */
export function diasDeSede(sede: string): number[] {
  return ATENCION.filter((b) => b.sede === sede).map((b) => b.dia);
}

export function esDiaAbierto(fecha: Date, sede?: string | null) {
  return bloquesDelDia(fecha, sede).length > 0;
}

/** Todas las franjas del día, sin mirar ocupación. */
export function franjasDelDia(fecha: Date, sede?: string | null): string[] {
  const franjas: string[] = [];
  for (const bloque of bloquesDelDia(fecha, sede)) {
    const fin = aMinutos(bloque.hasta);
    for (let m = aMinutos(bloque.desde); m + HORARIO.minutosPorFranja <= fin; m += HORARIO.minutosPorFranja) {
      franjas.push(aHora(m));
    }
  }
  return franjas;
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
  fecha,
  sede,
  ocupaciones,
  ahora = new Date(),
}: {
  /** "yyyy-MM-dd" */
  fecha: string;
  sede?: string | null;
  ocupaciones: Ocupacion[];
  ahora?: Date;
}): Franja[] {
  const minimo = new Date(ahora.getTime() + HORARIO.horasMinimasDeAnticipacion * 3600_000);

  // Mediodía para que el día de la semana no cambie en ninguna zona horaria.
  const dia = new Date(`${fecha}T12:00:00`);

  return franjasDelDia(dia, sede).map((hora) => {
    // Hora de Guatemala: con setHours, en un servidor en UTC cada franja
    // quedaba seis horas antes y no chocaba con las citas reales.
    const inicio = instanteGuatemala(fecha, hora);
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

// ── Horario para mostrar ─────────────────────────────────────────────────────

export type HorarioPublicado = {
  sede: Sede;
  dias: number[];
  desde: string;
  hasta: string;
  /** "Lunes y viernes" */
  etiquetaDias: string;
  /** "9:00 a 12:00" */
  etiquetaHoras: string;
};

/** "9:00" — sin cero a la izquierda, que es como se lee un horario. */
function horaLegible(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}:${m}`;
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function listaLegible(partes: string[]) {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/**
 * El horario agrupado como se anuncia: los días que comparten sede y ventana
 * van en una sola línea ("Lunes y viernes · Integra · 9:00 a 12:00").
 */
export function horarioPublicado(): HorarioPublicado[] {
  const grupos = new Map<string, HorarioPublicado>();

  for (const bloque of ATENCION) {
    const llave = `${bloque.sede}|${bloque.desde}|${bloque.hasta}`;
    const existente = grupos.get(llave);
    if (existente) {
      existente.dias.push(bloque.dia);
      continue;
    }
    grupos.set(llave, {
      sede: bloque.sede,
      dias: [bloque.dia],
      desde: bloque.desde,
      hasta: bloque.hasta,
      etiquetaDias: "",
      etiquetaHoras: `${horaLegible(bloque.desde)} a ${horaLegible(bloque.hasta)}`,
    });
  }

  return [...grupos.values()].map((g) => ({
    ...g,
    // Solo el primer día va con mayúscula: "Lunes y viernes", no "Lunes y Viernes".
    etiquetaDias: capitalizar(listaLegible(g.dias.map((d) => NOMBRE_DIA[d].toLowerCase()))),
  }));
}

/** Igual que `horarioPublicado`, pero solo lo de una sede. */
export function horarioDeSede(sede: string): HorarioPublicado[] {
  return horarioPublicado().filter((h) => h.sede === sede);
}

/** "Lun, mié y vie" — para espacios estrechos, como el selector de sede. */
export function diasCortosDeSede(sede: string): string {
  return listaLegible(diasDeSede(sede).map((d) => NOMBRE_DIA_CORTO[d]));
}
