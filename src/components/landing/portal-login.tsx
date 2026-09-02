"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verificarPaciente } from "@/app/actions";

/** Ingreso al portal de pacientes: mismos dos datos que el formulario de cita. */
export function PortalLogin() {
  const [dpi, setDpi] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function ingresar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await verificarPaciente(dpi, fechaNacimiento);
      if (res.status === "found") return router.push("/mis-citas");
      setError(
        res.status === "not_found"
          ? "No encontramos ese DPI con esa fecha de nacimiento. Revisa los datos o solicita tu primera cita."
          : res.message,
      );
    });
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
          Número de DPI
        </label>
        <input
          required
          inputMode="numeric"
          value={dpi}
          onChange={(e) => setDpi(e.target.value)}
          placeholder="1234567890101"
          className="clinic-input w-full rounded-xl border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
          Fecha de nacimiento
        </label>
        <input
          type="date"
          required
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className="clinic-input w-full rounded-xl border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
        />
      </div>

      {error && (
        <p className="text-[13px] text-[oklch(0.5_0.14_25)] bg-[oklch(0.97_0.01_25)] border border-[oklch(0.88_0.04_25)] rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-fill h-12 w-full rounded-full text-[13px] font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "oklch(0.72 0.065 25)" }}
      >
        {pending ? "Verificando…" : "Ver mis citas →"}
      </button>
    </form>
  );
}
