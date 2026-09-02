"use client";

import { useState, useTransition } from "react";
import {
  verificarPaciente,
  solicitarCitaExistente,
  solicitarCitaNueva,
  type PacienteResumen,
} from "@/app/actions";

const SEDES = ["Integra", "Decorísima", "Galerías Tiffany"];

const INPUT =
  "land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80";
const LABEL = "text-[10px] tracking-wider uppercase text-white/60 font-medium";

/**
 * Paso 1: DPI + fecha de nacimiento.
 * Si los dos coinciden con un paciente registrado, el paso 2 llega con sus datos
 * ya cargados; si no, el paso 2 pide los datos para registrarlo.
 * Pedimos también la fecha de nacimiento para no exponer los datos de un paciente
 * a cualquiera que teclee su DPI.
 */
type Paso =
  | { nombre: "identidad" }
  | { nombre: "existente"; paciente: PacienteResumen }
  | { nombre: "nuevo" }
  | { nombre: "listo"; correoEnviado: boolean };

export function SolicitudForm() {
  const [paso, setPaso] = useState<Paso>({ nombre: "identidad" });
  const [dpi, setDpi] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function verificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await verificarPaciente(dpi, fechaNacimiento);
      if (res.status === "error") return setError(res.message);
      if (res.status === "not_found") return setPaso({ nombre: "nuevo" });
      setPaso({ nombre: "existente", paciente: res.paciente });
    });
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const res =
        paso.nombre === "existente"
          ? await solicitarCitaExistente(formData)
          : await solicitarCitaNueva(dpi, fechaNacimiento, formData);

      if (res.status !== "success") {
        return setError(res.status === "error" ? res.message : "No pudimos enviar tu solicitud.");
      }
      setPaso({ nombre: "listo", correoEnviado: res.correoEnviado });
    });
  }

  if (paso.nombre === "listo") {
    return (
      <div className="bg-white/10 rounded-2xl p-10 text-center">
        <p
          className="text-[1.8rem] font-medium text-white mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          ¡Solicitud recibida!
        </p>
        <p className="text-[14px] text-white/70 leading-relaxed mb-5">
          {paso.correoEnviado
            ? "Te enviamos un correo de confirmación. Te contactamos en menos de 24 horas para confirmar tu cita, y recibirás un segundo correo cuando quede agendada."
            : "Te contactamos en menos de 24 horas para confirmar tu cita. Lo haremos por teléfono, así que mantente pendiente."}
        </p>
        <a
          href="/mis-citas"
          className="inline-block text-[12px] text-white/80 underline underline-offset-4 hover:text-white transition-colors"
        >
          Ver mis citas →
        </a>
      </div>
    );
  }

  if (paso.nombre === "identidad") {
    return (
      <form onSubmit={verificar} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>DPI *</label>
          <input
            name="dpi"
            required
            inputMode="numeric"
            value={dpi}
            onChange={(e) => setDpi(e.target.value)}
            placeholder="1234567890101"
            className={INPUT}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Fecha de nacimiento *</label>
          <input
            name="fecha_nacimiento"
            type="date"
            required
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className={`${INPUT} bg-transparent [color-scheme:dark]`}
          />
        </div>

        <p className="text-[11px] text-white/50 leading-relaxed">
          Si ya eres paciente, llenamos tus datos automáticamente. Si es tu primera
          vez, te registramos en el siguiente paso.
        </p>

        {error && (
          <p className="text-[13px] text-white bg-white/10 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-fill mt-1 h-12 w-full rounded-full text-[13px] font-medium tracking-wide text-[oklch(0.72_0.065_25)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "white" }}
        >
          {pending ? "Verificando…" : "Continuar →"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {paso.nombre === "existente" ? (
        <div className="rounded-xl bg-white/10 px-5 py-4">
          <p className="text-[10px] tracking-wider uppercase text-white/60 font-medium mb-1.5">
            Paciente encontrado ✓
          </p>
          <p className="text-[15px] font-medium text-white">
            {paso.paciente.primer_nombre} {paso.paciente.primer_apellido}
          </p>
          <p className="text-[12px] text-white/60">
            {paso.paciente.telefono}
            {paso.paciente.email ? ` · ${paso.paciente.email}` : ""}
          </p>
          {!paso.paciente.email && (
            <p className="text-[11px] text-white/70 mt-2 leading-relaxed">
              No tenemos un correo tuyo registrado, así que te contactaremos por teléfono.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-[12px] text-white/70 leading-relaxed bg-white/10 rounded-xl px-5 py-4">
            No encontramos ese DPI. Completa tus datos y te registramos junto con la
            solicitud.
          </p>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Nombre *</label>
              <input name="primer_nombre" required placeholder="Ana" className={INPUT} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Apellido *</label>
              <input name="primer_apellido" required placeholder="García" className={INPUT} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Teléfono *</label>
              <input name="telefono" required type="tel" placeholder="5555 0000" className={INPUT} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Correo</label>
              <input name="email" type="email" placeholder="ana@correo.com" className={INPUT} />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Sede</label>
          <select
            name="sede"
            className={`${INPUT} bg-transparent appearance-none cursor-pointer`}
          >
            <option value="Sin preferencia" className="text-foreground bg-white">
              Sin preferencia
            </option>
            {SEDES.map((s) => (
              <option key={s} value={s} className="text-foreground bg-white">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Fecha aproximada</label>
          <input
            name="fecha_preferida"
            type="date"
            className={`${INPUT} bg-transparent [color-scheme:dark]`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL}>¿Qué te preocupa?</label>
        <textarea
          name="motivo"
          rows={3}
          placeholder="Cuéntanos brevemente…"
          className={`${INPUT} resize-none`}
        />
      </div>

      {error && <p className="text-[13px] text-white bg-white/10 rounded-lg px-4 py-3">{error}</p>}

      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPaso({ nombre: "identidad" });
          }}
          className="h-12 px-5 rounded-full text-[13px] font-medium text-white/70 border border-white/25 hover:text-white hover:border-white/60 transition-colors"
        >
          ←
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn-fill h-12 flex-1 rounded-full text-[13px] font-medium tracking-wide text-[oklch(0.72_0.065_25)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "white" }}
        >
          {pending ? "Enviando…" : "Solicitar cita →"}
        </button>
      </div>
    </form>
  );
}
