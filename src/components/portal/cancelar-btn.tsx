"use client";

import { useState, useTransition } from "react";
import { cancelarSolicitud, cancelarSolicitudPaciente } from "@/app/actions";
import { useRouter } from "next/navigation";

/**
 * Cancelar una solicitud de cita. `scope` decide qué acción se llama:
 * "portal" verifica que la solicitud sea del paciente con sesión activa,
 * "clinica" es la cancelación de la secretaria desde el dashboard.
 * Cancelar es irreversible, así que siempre pide confirmación antes.
 */
export function CancelarSolicitudBtn({
  solicitudId,
  scope = "portal",
}: {
  solicitudId: string;
  scope?: "portal" | "clinica";
}) {
  const [pending, start] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function cancelar() {
    setError(null);
    start(async () => {
      const accion = scope === "portal" ? cancelarSolicitudPaciente : cancelarSolicitud;
      const { error } = await accion(solicitudId);
      if (error) {
        setError(error);
        setConfirmando(false);
        return;
      }
      router.refresh();
    });
  }

  if (error) {
    return (
      <span className="flex-shrink-0 text-[11px]" style={{ color: "oklch(0.5 0.14 25)" }}>
        {error}
      </span>
    );
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
        style={{
          background: "oklch(0.97 0.01 25)",
          color: "oklch(0.5 0.14 25)",
          border: "1px solid oklch(0.88 0.04 25)",
        }}
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center gap-2">
      <span className="text-[11px] text-[oklch(0.55_0.012_40)]">¿Seguro?</span>
      <button
        disabled={pending}
        onClick={cancelar}
        className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
        style={{
          background: "oklch(0.5 0.14 25)",
          color: "white",
          border: "1px solid oklch(0.5 0.14 25)",
        }}
      >
        {pending ? "…" : "Sí, cancelar"}
      </button>
      <button
        disabled={pending}
        onClick={() => setConfirmando(false)}
        className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
        style={{
          background: "transparent",
          color: "oklch(0.5 0.012 40)",
          border: "1px solid oklch(0.88 0.01 60)",
        }}
      >
        No
      </button>
    </div>
  );
}
