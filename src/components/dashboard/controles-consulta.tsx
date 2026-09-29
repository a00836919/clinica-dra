"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reprogramarConsulta, cambiarEstadoConsulta } from "@/app/actions";
import { enGuatemala } from "@/lib/hora-guatemala";

const CAMPO =
  "rounded-md border border-border/60 bg-background px-2 py-1 text-xs transition-colors focus:border-ring focus:outline-none";
const BOTON =
  "rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60";

/** Reprogramar, marcar no asistió o cancelar, sin salir de la consulta. */
export function ControlesConsulta({
  consultaId,
  estado,
  fechaISO,
}: {
  consultaId: string;
  estado: string;
  fechaISO: string;
}) {
  const [panel, setPanel] = useState<"ninguno" | "mover" | "cancelar">("ninguno");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  // En hora de Guatemala: cortar el ISO daba el día UTC, uno después para las citas de la noche.
  const { fecha, hora } = enGuatemala(fechaISO);

  function mover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMensaje(null);
    start(async () => {
      const res = await reprogramarConsulta(consultaId, {
        fecha: fd.get("fecha")?.toString() ?? "",
        hora: fd.get("hora")?.toString() ?? "",
        avisarPorCorreo: fd.get("avisar") === "on",
      });
      if (res.error) return setMensaje(res.error);
      setMensaje(res.aviso ?? null);
      setPanel("ninguno");
      router.refresh();
    });
  }

  function cambiar(nuevo: string) {
    setMensaje(null);
    start(async () => {
      const res = await cambiarEstadoConsulta(consultaId, nuevo);
      if (res.error) return setMensaje(res.error);
      setPanel("ninguno");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {panel === "mover" ? (
        <form onSubmit={mover} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          <input name="fecha" type="date" required defaultValue={fecha} aria-label="Nueva fecha" className={CAMPO} />
          <input name="hora" type="time" required step={900} defaultValue={hora} aria-label="Nueva hora" className={CAMPO} />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" name="avisar" defaultChecked className="h-3.5 w-3.5" />
            Avisar
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ background: "oklch(0.45 0.13 155)" }}
          >
            {pending ? "Moviendo…" : "Mover"}
          </button>
          <button type="button" onClick={() => setPanel("ninguno")} disabled={pending} className={BOTON}>
            Cancelar
          </button>
        </form>
      ) : panel === "cancelar" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          <span className="text-xs text-muted-foreground">¿Cancelar esta cita?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => cambiar("cancelada")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ background: "oklch(0.5 0.14 25)" }}
          >
            {pending ? "…" : "Sí, cancelar"}
          </button>
          <button type="button" onClick={() => setPanel("ninguno")} disabled={pending} className={BOTON}>
            No
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPanel("mover")} disabled={pending} className={BOTON}>
            Reprogramar
          </button>
          {estado !== "no_asistio" && (
            <button type="button" onClick={() => cambiar("no_asistio")} disabled={pending} className={BOTON}>
              No asistió
            </button>
          )}
          {estado !== "cancelada" ? (
            <button type="button" onClick={() => setPanel("cancelar")} disabled={pending} className={BOTON}>
              Cancelar cita
            </button>
          ) : (
            <button type="button" onClick={() => cambiar("agendada")} disabled={pending} className={BOTON}>
              Reactivar
            </button>
          )}
        </div>
      )}

      {mensaje && (
        <p className="text-xs" style={{ color: "oklch(0.48 0.11 65)" }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
