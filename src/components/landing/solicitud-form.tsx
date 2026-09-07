"use client";

import { useState, useTransition } from "react";
import {
  verificarPaciente,
  solicitarCitaExistente,
  solicitarCitaNueva,
  type PacienteResumen,
} from "@/app/actions";
import { SEDES, nombreSedeCompleto } from "@/lib/sedes";
import { diasCortosDeSede } from "@/lib/disponibilidad";
import { SelectorFranja } from "@/components/landing/selector-franja";
import { ACLARACION_PRECIO, PRECIO_CONSULTA_TEXTO } from "@/lib/precios";
import { RESUMEN_CONSENTIMIENTO } from "@/lib/consentimiento";
import {
  PLACEHOLDER_IDENTIFICACION,
  TIPOS_IDENTIFICACION,
  TIPO_POR_DEFECTO,
  nombreEnFrase,
  type TipoIdentificacion,
} from "@/lib/identificacion";

const INPUT =
  "land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80";
const LABEL = "text-[10px] tracking-wider uppercase text-white/60 font-medium";

/**
 * Paso 1: identificación (DPI o pasaporte) + fecha de nacimiento.
 * Si los dos coinciden con un paciente registrado, el paso 2 llega con sus datos
 * ya cargados; si no, el paso 2 pide los datos para registrarlo.
 * Pedimos también la fecha de nacimiento para no exponer los datos de un paciente
 * a cualquiera que teclee su número.
 */
type Paso =
  | { nombre: "identidad" }
  | { nombre: "existente"; paciente: PacienteResumen }
  | { nombre: "nuevo" }
  | { nombre: "listo"; correoEnviado: boolean };

export function SolicitudForm() {
  const [paso, setPaso] = useState<Paso>({ nombre: "identidad" });
  const [tipo, setTipo] = useState<TipoIdentificacion>(TIPO_POR_DEFECTO);
  const [identificacion, setIdentificacion] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sede, setSede] = useState<string>(SEDES[0]);
  const [franja, setFranja] = useState<{ fecha: string; hora: string } | null>(null);
  const [pending, start] = useTransition();

  function verificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await verificarPaciente(identificacion, fechaNacimiento, tipo);
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
          : await solicitarCitaNueva(identificacion, fechaNacimiento, formData, tipo);

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
        <p className="text-[12px] text-white/55 leading-relaxed mb-5">
          La consulta cuesta {PRECIO_CONSULTA_TEXTO}. El procedimiento que se te realice se cobra
          aparte. Lleva tu {nombreEnFrase(tipo)} el día de la cita.
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
        <div className="grid grid-cols-[130px_1fr] gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL} htmlFor="tipo-identificacion">
              Documento
            </label>
            <select
              id="tipo-identificacion"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoIdentificacion);
                setIdentificacion("");
                setError(null);
              }}
              className={`${INPUT} bg-transparent appearance-none cursor-pointer`}
            >
              {TIPOS_IDENTIFICACION.map((t) => (
                <option key={t} value={t} className="text-foreground bg-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL} htmlFor="numero-identificacion">
              Número de {nombreEnFrase(tipo)} *
            </label>
            <input
              id="numero-identificacion"
              name="numero_identificacion"
              required
              inputMode={tipo === "DPI" ? "numeric" : "text"}
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              placeholder={PLACEHOLDER_IDENTIFICACION[tipo]}
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="fecha-nacimiento">
            Fecha de nacimiento *
          </label>
          <input
            id="fecha-nacimiento"
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
            No encontramos ese {nombreEnFrase(tipo)}. Completa tus datos y te registramos junto
            con la solicitud.
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

      <div className="grid grid-cols-1 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="sede">
            Sede
          </label>
          <select
            id="sede"
            name="sede"
            value={sede}
            onChange={(e) => {
              setSede(e.target.value);
              setFranja(null);
            }}
            className={`${INPUT} bg-transparent appearance-none cursor-pointer`}
          >
            {SEDES.map((s) => (
              <option key={s} value={s} className="text-foreground bg-white">
                {nombreSedeCompleto(s)} — {diasCortosDeSede(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/[0.06] p-4">
        {/* La llave remonta el selector al cambiar de sede: si no, quedaba
            marcado un día en el que esa sede no atiende. */}
        <SelectorFranja key={sede} sede={sede} onCambio={setFranja} />
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

      {!franja && (
        <p className="text-[11px] text-white/50">
          Si no eliges día y hora, te contactamos para acordarlos.
        </p>
      )}

      {/* Precio: la duda que llega por teléfono todos los días */}
      <div className="rounded-xl bg-white/10 px-5 py-4">
        <p className="text-[10px] tracking-wider uppercase text-white/60 font-medium mb-1.5">
          Costo · consulta {PRECIO_CONSULTA_TEXTO}
        </p>
        <p className="text-[12px] leading-relaxed text-white/70">{ACLARACION_PRECIO}</p>
      </div>

      <label className="flex items-start gap-3 text-[12px] leading-relaxed text-white/70">
        <input
          type="checkbox"
          name="consentimiento"
          required
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-white"
        />
        <span>
          {RESUMEN_CONSENTIMIENTO}{" "}
          <a
            href="/consentimiento"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline underline-offset-4"
          >
            Leerlo
          </a>
          .
        </span>
      </label>

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
