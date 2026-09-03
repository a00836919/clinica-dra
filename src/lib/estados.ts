/** Estados de una consulta, en un solo lugar: estaban duplicados en tres páginas. */
export const ESTADO_CONSULTA: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  agendada: {
    label: "Agendada",
    color: "oklch(0.52 0.12 250)",
    bg: "oklch(0.95 0.03 250)",
    dot: "oklch(0.52 0.12 250)",
  },
  confirmada: {
    label: "Confirmada",
    color: "oklch(0.38 0.1 155)",
    bg: "oklch(0.94 0.03 155)",
    dot: "oklch(0.45 0.13 155)",
  },
  atendida: {
    label: "Atendida",
    color: "oklch(0.38 0.1 145)",
    bg: "oklch(0.93 0.04 145)",
    dot: "oklch(0.42 0.12 145)",
  },
  cancelada: {
    label: "Cancelada",
    color: "oklch(0.5 0.14 25)",
    bg: "oklch(0.96 0.02 25)",
    dot: "oklch(0.55 0.18 25)",
  },
  no_asistio: {
    label: "No asistió",
    color: "oklch(0.45 0.03 50)",
    bg: "oklch(0.94 0.006 60)",
    dot: "oklch(0.5 0.04 50)",
  },
};

export function estadoConsulta(estado: string) {
  return ESTADO_CONSULTA[estado] ?? ESTADO_CONSULTA.agendada;
}

/** Una consulta ya cerrada o cancelada no se puede atender. */
export const ESTADOS_CERRADOS = ["atendida", "cancelada", "no_asistio"];
