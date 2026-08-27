"use client";

import { useTransition } from "react";
import { cancelarSolicitud } from "@/app/actions";
import { useRouter } from "next/navigation";

export function CancelarSolicitudBtn({ solicitudId }: { solicitudId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const { error } = await cancelarSolicitud(solicitudId);
          if (!error) router.refresh();
        })
      }
      className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
      style={{
        background: pending ? "oklch(0.94 0.006 60)" : "oklch(0.97 0.01 25)",
        color: pending ? "oklch(0.6 0.012 40)" : "oklch(0.5 0.14 25)",
        border: "1px solid oklch(0.88 0.04 25)",
      }}
    >
      {pending ? "…" : "Cancelar"}
    </button>
  );
}
