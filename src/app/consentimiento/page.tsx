import Link from "next/link";
import type { Metadata } from "next";
import { CONSENTIMIENTO, VERSION_CONSENTIMIENTO } from "@/lib/consentimiento";
import { horarioPublicado } from "@/lib/disponibilidad";
import { nombreSedeCompleto } from "@/lib/sedes";
import { ACLARACION_PRECIO } from "@/lib/precios";

export const metadata: Metadata = {
  title: "Consentimiento informado — Skin Clinic GT",
  description:
    "Qué autorizas al agendar una consulta en Skin Clinic GT, cómo tratamos tus datos y cómo se cobran los procedimientos.",
};

/**
 * El texto que el paciente acepta al pedir cita, en una página propia.
 *
 * Va en su propia URL y no en un modal: el paciente tiene que poder abrirlo sin
 * perder el formulario, volver después, y guardarse el enlace.
 */
export default function ConsentimientoPage() {
  return (
    <div
      className="min-h-screen px-6 py-16 md:px-10 md:py-24"
      style={{
        background: "oklch(0.988 0.003 85)",
        color: "oklch(0.145 0 0)",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <article className="mx-auto max-w-2xl">
        <Link
          href="/#cita"
          className="text-[12px] text-[oklch(0.55_0.012_40)] underline underline-offset-4 transition-colors hover:text-[oklch(0.3_0.02_40)]"
        >
          ← Volver a solicitar cita
        </Link>

        <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.72_0.065_25)]">
          Skin Clinic GT
        </p>
        <h1
          className="mt-3 leading-tight"
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem,5vw,2.8rem)",
            fontWeight: 500,
          }}
        >
          Consentimiento informado
        </h1>
        <p className="mt-4 text-[14px] leading-[1.8] text-[oklch(0.45_0.012_40)]">
          Esto es lo que aceptas al agendar una consulta. Léelo antes de marcar la casilla del
          formulario. Si algo no te queda claro, pregúntanos: preferimos explicarlo dos veces.
        </p>
        <p className="mt-2 text-[11px] text-[oklch(0.6_0.012_40)]">
          Versión {VERSION_CONSENTIMIENTO}
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {CONSENTIMIENTO.map((seccion) => (
            <section key={seccion.titulo}>
              <h2
                className="mb-3 text-[18px] font-medium"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {seccion.titulo}
              </h2>
              <div className="flex flex-col gap-3">
                {seccion.parrafos.map((parrafo, i) => (
                  <p key={i} className="text-[14px] leading-[1.85] text-[oklch(0.4_0.012_40)]">
                    {parrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2
              className="mb-3 text-[18px] font-medium"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Dónde y cuándo atendemos
            </h2>
            <ul className="flex flex-col gap-2">
              {horarioPublicado().map((h) => (
                <li
                  key={`${h.sede}-${h.desde}-${h.etiquetaDias}`}
                  className="flex flex-wrap items-baseline gap-x-2 text-[14px] text-[oklch(0.4_0.012_40)]"
                >
                  <span className="font-medium text-[oklch(0.2_0.012_40)]">{h.etiquetaDias}</span>
                  <span className="text-[oklch(0.6_0.012_40)]">·</span>
                  <span>{nombreSedeCompleto(h.sede)}</span>
                  <span className="text-[oklch(0.6_0.012_40)]">·</span>
                  <span className="tabular-nums">{h.etiquetaHoras}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-[1.8] text-[oklch(0.45_0.012_40)]">
              {ACLARACION_PRECIO}
            </p>
          </section>
        </div>

        <div className="mt-14 border-t border-[oklch(0.91_0.008_60)] pt-6">
          <p className="text-[12px] leading-[1.8] text-[oklch(0.55_0.012_40)]">
            Este consentimiento cubre la consulta. Cada procedimiento se consiente aparte, por
            escrito, el día que se realiza.
          </p>
          <Link
            href="/#cita"
            className="mt-5 inline-block rounded-full px-6 py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "oklch(0.72 0.065 25)" }}
          >
            Solicitar mi cita →
          </Link>
        </div>
      </article>
    </div>
  );
}
