import Image from "next/image";
import recepcion from "@/assets/fotos/recepcion.jpg";
import { nombreSedeCompleto } from "@/lib/sedes";
import { horarioPublicado } from "@/lib/disponibilidad";
import { WHATSAPP_URL } from "@/lib/contacto";
import { IconoWhatsApp } from "./icono-whatsapp";

/**
 * Apertura editorial sobre el crema del sitio.
 *
 * Antes la foto de la recepción ocupaba la pantalla bajo cuatro capas de velo
 * oscuro: la pared clara y el rótulo dorado quedaban turbios y el hero no se
 * parecía al resto de la página. Ahora la foto va enmarcada y a su brillo real,
 * y el texto vive sobre el mismo fondo que las demás secciones.
 */
export function Hero() {
  return (
    <section data-parallax-section className="px-6 pb-14 pt-28 md:px-10 md:pb-16 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_1.05fr] md:gap-16">
          <div className="md:pb-2">
            <div data-hero-step className="mb-7 flex items-center gap-4">
              <span
                aria-hidden="true"
                className="h-px w-10 flex-shrink-0"
                style={{ background: "oklch(0.82 0.08 78)" }}
              />
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[oklch(0.62_0.07_25)]">
                Dermatología · Guatemala
              </p>
            </div>

            <h1
              data-hero-step
              className="mb-7 text-[oklch(0.22_0.02_40)]"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(3rem,7.2vw,5.8rem)",
                lineHeight: 0.98,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Skin Clinic <span className="italic text-[oklch(0.66_0.075_25)]">GT</span>
            </h1>

            <p
              data-hero-step
              className="mb-9 max-w-[40ch] text-[15px] leading-[1.75] text-[oklch(0.45_0.015_40)]"
            >
              Dermatólogas dedicadas al cuidado de la piel, el cabello y las uñas, para
              pacientes de todas las edades.
            </p>

            <div data-hero-step className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="#cita"
                data-magnetic
                className="btn-fill inline-flex h-12 items-center rounded-full px-7 text-[13px] font-medium tracking-wide text-white"
                style={{ background: "oklch(0.3 0.025 35)" }}
              >
                Agenda tu cita →
              </a>
              {/* Para quien prefiere escribir antes que llenar un formulario */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[13px] font-medium tracking-wide text-[oklch(0.4_0.02_40)] underline decoration-[oklch(0.85_0.02_40)] underline-offset-[6px] transition-colors hover:text-[oklch(0.25_0.02_40)] hover:decoration-[oklch(0.62_0.07_25)]"
              >
                <IconoWhatsApp className="h-[15px] w-[15px]" />
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>

          {/* La recepción, a su brillo real: la pared clara y el dorado son la marca */}
          <figure
            data-hero-step
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] md:aspect-auto md:h-[min(64vh,40rem)]"
          >
            <div
              data-parallax-image
              data-parallax-speed="0.05"
              className="absolute inset-x-0 -top-[8%] -bottom-[8%]"
            >
              <div data-hero-image className="relative h-full w-full">
                <Image
                  src={recepcion}
                  alt="Recepción de Skin Clinic GT: el rótulo dorado de la clínica iluminado sobre una pared clara, con plantas en primer plano."
                  fill
                  priority
                  placeholder="blur"
                  sizes="(max-width: 768px) 100vw, 52vw"
                  className="object-cover object-[46%_50%]"
                />
              </div>
            </div>
          </figure>
        </div>

        {/* Días de consulta: una franja, no una tarjeta */}
        <div
          data-hero-step
          className="mt-12 grid gap-x-8 gap-y-6 border-t border-[oklch(0.91_0.008_60)] pt-7 sm:grid-cols-2 md:mt-14 md:grid-cols-[auto_repeat(4,1fr)]"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.62_0.07_25)] sm:col-span-2 md:col-span-1 md:pr-6 md:pt-1">
            Días de consulta
          </p>
          {horarioPublicado().map((h) => (
            <div key={`${h.sede}-${h.desde}-${h.etiquetaDias}`} className="leading-snug">
              <p
                className="text-[16px] text-[oklch(0.25_0.02_40)]"
                style={{ fontFamily: "var(--font-playfair)", fontWeight: 500 }}
              >
                {h.etiquetaDias}
              </p>
              <p className="mt-1 text-[12px] text-[oklch(0.52_0.012_40)]">{nombreSedeCompleto(h.sede)}</p>
              <p className="text-[12px] tabular-nums text-[oklch(0.52_0.012_40)]">{h.etiquetaHoras}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
