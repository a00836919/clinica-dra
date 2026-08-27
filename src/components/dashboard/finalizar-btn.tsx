"use client";

import { useTransition } from "react";
import { finalizarConsulta } from "@/app/actions";
import { useRouter } from "next/navigation";

export function FinalizarBtn({ consultaId, estado }: { consultaId: string; estado: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (estado === "atendida" || estado === "cancelada" || estado === "no_asistio") {
    return null;
  }

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await finalizarConsulta(consultaId);
          router.refresh();
        })
      }
      className="mt-1.5 w-full text-[10px] font-medium tracking-wide rounded-md py-1 transition-colors"
      style={{
        background: pending ? "oklch(0.88 0.01 60)" : "oklch(0.45 0.13 155 / 0.12)",
        color: pending ? "oklch(0.55 0.012 40)" : "oklch(0.35 0.1 155)",
        border: "1px solid oklch(0.45 0.13 155 / 0.25)",
      }}
    >
      {pending ? "Finalizando…" : "✓ Finalizar"}
    </button>
  );
}
