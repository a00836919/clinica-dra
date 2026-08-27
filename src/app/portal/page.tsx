"use client";

import { useActionState } from "react";
import { loginPortal, type PortalLoginState } from "@/app/actions";

const init: PortalLoginState = { status: "idle" };

export default function PortalLoginPage() {
  const [state, action, pending] = useActionState(loginPortal, init);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "oklch(0.988 0.003 85)", fontFamily: "var(--font-geist-sans)" }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.72_0.065_25)] font-medium mb-3">
            Skin Clinic GT
          </p>
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--font-playfair)", color: "oklch(0.145 0 0)" }}
          >
            Portal de pacientes
          </h1>
          <p className="text-sm text-[oklch(0.52_0.012_40)] mt-2">
            Ingresa tu DPI y fecha de nacimiento para acceder
          </p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
              Número de DPI
            </label>
            <input
              name="dpi"
              required
              placeholder="1234567890101"
              className="clinic-input w-full rounded-lg border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
              Fecha de nacimiento
            </label>
            <input
              name="fecha_nacimiento"
              type="date"
              required
              className="clinic-input w-full rounded-lg border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
            />
          </div>

          {state.status === "error" && (
            <p className="text-sm text-[oklch(0.55_0.18_25)] bg-[oklch(0.97_0.01_25)] border border-[oklch(0.88_0.04_25)] rounded-lg px-4 py-3">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-fill w-full rounded-full py-3.5 text-sm font-medium text-white transition-all"
            style={{ background: "oklch(0.72 0.065 25)" }}
          >
            {pending ? "Verificando…" : "Acceder a mis citas →"}
          </button>
        </form>

        <p className="text-center text-xs text-[oklch(0.65_0.012_40)] mt-8">
          ¿No puedes ingresar?{" "}
          <a href="tel:+502" className="underline">
            Llámanos
          </a>
        </p>
      </div>
    </div>
  );
}
