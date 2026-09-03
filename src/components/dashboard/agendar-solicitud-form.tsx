"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agendarSolicitud } from "@/app/actions";
import { SEDES, SIN_PREFERENCIA } from "@/lib/sedes";

const CAMPO =
  "rounded-md border border-border/60 bg-background px-2 py-1 text-xs transition-colors focus:border-ring focus:outline-none";

export type Doctora = { id: string; nombre: string };

/**
 * Agendar una solicitud. Antes solo se marcaba como confirmada y la cita no
 * existía en ninguna parte; ahora hay que decir cuándo, dónde y con quién,
 * porque de eso sale la consulta que aparece en la agenda.
 */
export function AgendarSolicitudForm({
  solicitudId,
  fechaSugerida,
  sedeSugerida,
  doctoras,
}: {
  solicitudId: string;
  fechaSugerida: string | null;
  sedeSugerida: string | null;
  doctoras: Doctora[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "aviso"; texto: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMensaje(null);
    start(async () => {
      const res = await agendarSolicitud(solicitudId, {
        fecha: fd.get("fecha")?.toString() ?? "",
        hora: fd.get("hora")?.toString() ?? "",
        sede: fd.get("sede")?.toString() ?? SIN_PREFERENCIA,
        doctoraId: fd.get("doctora")?.toString() ?? "",
      });

      if (res.error) return setMensaje({ tipo: "error", texto: res.error });
      if (res.aviso) setMensaje({ tipo: "aviso", texto: res.aviso });
      setAbierto(false);
      router.refresh();
    });
  }

  if (mensaje?.tipo === "aviso" && !abierto) {
    return (
      <span className="text-[11px] leading-snug" style={{ color: "oklch(0.48 0.11 65)" }}>
        {mensaje.texto}
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
        style={{
          background: "oklch(0.93 0.04 145)",
          color: "oklch(0.38 0.1 145)",
          border: "1px solid oklch(0.82 0.06 145)",
        }}
      >
        Agendar…
      </button>
    );
  }

  const sedePorDefecto =
    sedeSugerida && SEDES.includes(sedeSugerida as (typeof SEDES)[number])
      ? sedeSugerida
      : SEDES[0];

  return (
    <form onSubmit={agendar} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="fecha"
          type="date"
          required
          defaultValue={fechaSugerida ?? ""}
          aria-label="Fecha de la cita"
          className={CAMPO}
        />
        <input
          name="hora"
          type="time"
          required
          defaultValue="09:00"
          step={900}
          aria-label="Hora de la cita"
          className={CAMPO}
        />
        <select name="sede" defaultValue={sedePorDefecto} aria-label="Sede" className={CAMPO}>
          {SEDES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="doctora" required defaultValue={doctoras[0]?.id ?? ""} aria-label="Doctora" className={CAMPO}>
          {doctoras.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      {mensaje && (
        <p
          className="text-[11px] leading-snug"
          style={{ color: mensaje.tipo === "error" ? "oklch(0.5 0.14 25)" : "oklch(0.48 0.11 65)" }}
        >
          {mensaje.texto}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || doctoras.length === 0}
          className="rounded-full px-3 py-1.5 text-[11px] font-medium text-white transition-colors disabled:opacity-60"
          style={{ background: "oklch(0.45 0.13 155)" }}
        >
          {pending ? "Agendando…" : "Crear cita y avisar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setAbierto(false);
            setMensaje(null);
          }}
          className="rounded-full border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
