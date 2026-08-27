"use client";

import { useTransition } from "react";
import { confirmarSolicitud } from "@/app/actions";
import { useRouter } from "next/navigation";

export function ConfirmarSolicitudBtn({ solicitudId }: { solicitudId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmarSolicitud(solicitudId);
          router.refresh();
        })
      }
      className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
      style={{
        background: pending ? "oklch(0.94 0.006 60)" : "oklch(0.93 0.04 145)",
        color: pending ? "oklch(0.6 0.012 40)" : "oklch(0.38 0.1 145)",
        border: "1px solid oklch(0.82 0.06 145)",
      }}
    >
      {pending ? "…" : "Confirmar"}
    </button>
  );
}
