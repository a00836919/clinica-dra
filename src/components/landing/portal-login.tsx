"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verificarPaciente } from "@/app/actions";
import {
  PLACEHOLDER_IDENTIFICACION,
  TIPOS_IDENTIFICACION,
  TIPO_POR_DEFECTO,
  nombreEnFrase,
  type TipoIdentificacion,
} from "@/lib/identificacion";

const CAMPO =
  "clinic-input w-full rounded-xl border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white";
const ETIQUETA =
  "text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium";

/** Ingreso al portal de pacientes: mismos dos datos que el formulario de cita. */
export function PortalLogin() {
  const [tipo, setTipo] = useState<TipoIdentificacion>(TIPO_POR_DEFECTO);
  const [identificacion, setIdentificacion] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function ingresar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await verificarPaciente(identificacion, fechaNacimiento, tipo);
      if (res.status === "found") return router.push("/mis-citas");
      setError(
        res.status === "not_found"
          ? `No encontramos ese ${nombreEnFrase(tipo)} con esa fecha de nacimiento. Revisa los datos o solicita tu primera cita.`
          : res.message,
      );
    });
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-5">
      <div className="grid grid-cols-[130px_1fr] gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="portal-tipo">
            Documento
          </label>
          <select
            id="portal-tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoIdentificacion);
              setIdentificacion("");
              setError(null);
            }}
            className={`${CAMPO} cursor-pointer`}
          >
            {TIPOS_IDENTIFICACION.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="portal-identificacion">
            Número de {nombreEnFrase(tipo)}
          </label>
          <input
            id="portal-identificacion"
            required
            inputMode={tipo === "DPI" ? "numeric" : "text"}
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            placeholder={PLACEHOLDER_IDENTIFICACION[tipo]}
            className={CAMPO}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={ETIQUETA} htmlFor="portal-nacimiento">
          Fecha de nacimiento
        </label>
        <input
          id="portal-nacimiento"
          type="date"
          required
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className={CAMPO}
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
