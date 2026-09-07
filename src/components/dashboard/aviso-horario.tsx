"use client";

import { bloquesDelDia, franjasDelDia, horarioDeSede } from "@/lib/disponibilidad";
import { nombreSedeCompleto } from "@/lib/sedes";

/**
 * Avisa cuando una cita del dashboard cae fuera del horario publicado.
 *
 * Es un aviso, no un bloqueo: la clínica sí atiende fuera de horario cuando hay
 * razón para hacerlo (un control corto, un paciente que viaja). Lo que no debe
 * pasar es que ocurra sin que nadie se dé cuenta.
 */
export function AvisoHorario({
  fecha,
  hora,
  sede,
}: {
  /** "YYYY-MM-DD" */
  fecha: string;
  /** "HH:mm" */
  hora: string;
  sede: string;
}) {
  if (!fecha) return null;

  const dia = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(dia.getTime())) return null;

  const bloquesDelDiaCompleto = bloquesDelDia(dia);
  const bloquesDeLaSede = bloquesDelDia(dia, sede);

  let problema: string | null = null;

  if (bloquesDelDiaCompleto.length === 0) {
    problema = "Ese día la clínica no atiende.";
  } else if (bloquesDeLaSede.length === 0) {
    const otra = bloquesDelDiaCompleto[0];
    problema =
      `Ese día la doctora está en ${nombreSedeCompleto(otra.sede)} ` +
      `(${otra.desde}–${otra.hasta}), no en ${sede}.`;
  } else if (hora && !franjasDelDia(dia, sede).includes(hora)) {
    const rango = bloquesDeLaSede.map((b) => `${b.desde}–${b.hasta}`).join(" y ");
    problema = `Fuera del horario de ${sede} ese día (${rango}).`;
  }

  if (!problema) return null;

  const horario = horarioDeSede(sede);

  return (
    <p className="text-[11px] leading-snug" style={{ color: "oklch(0.48 0.11 65)" }}>
      {problema} La cita se crea igual.
      {horario.length > 0 && (
        <>
          {" "}
          {sede}:{" "}
          {horario.map((h) => `${h.etiquetaDias} ${h.etiquetaHoras}`).join("; ")}.
        </>
      )}
    </p>
  );
}
