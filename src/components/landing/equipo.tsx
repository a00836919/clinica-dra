import Image from "next/image";
import doctora from "@/assets/fotos/doctora.jpg";
import equipo from "@/assets/fotos/equipo.jpg";

/** Bloque editorial del equipo: retrato dominante y una foto de apoyo desplazada. */
export function Equipo() {
  return (
    <section
      id="equipo"
      data-parallax-section
      className="border-t border-[oklch(0.91_0.008_60)] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-20">
        {/* Texto */}
        <div>
          <p
            data-reveal="fade-up"
            className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.72_0.065_25)]"
          >
            El equipo
          </p>

          <h2
            data-motion-text
            className="mb-6 leading-[1.12]"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.9rem,4vw,2.9rem)",
              fontWeight: 500,
            }}
          >
            Tu piel en manos que la conocen.
          </h2>

          <p
            data-reveal="fade-up"
            data-reveal-delay="0.05"
            className="mb-8 max-w-[38ch] text-[14px] leading-[1.85] text-[oklch(0.5_0.012_40)]"
          >
            Consulta médica y estética avanzada en un mismo lugar. Cada visita queda
            registrada en tu expediente, y el resumen con diagnóstico, tratamiento y
            receta te llega por correo el mismo día.
          </p>

          <a
            href="#cita"
            data-reveal="fade-up"
            data-reveal-delay="0.1"
            data-magnetic
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[oklch(0.55_0.07_25)] underline decoration-[oklch(0.85_0.03_25)] underline-offset-[6px] transition-colors hover:text-[oklch(0.42_0.09_25)] hover:decoration-[oklch(0.72_0.065_25)]"
          >
            Solicitar una cita
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Composición fotográfica */}
        <div className="relative">
          <figure
            data-image-reveal
            className="photo-zoom relative aspect-[3/4] w-full overflow-hidden rounded-2xl md:aspect-[4/5]"
          >
            <Image
              src={doctora}
              alt="Dermatóloga de Skin Clinic GT en la sala de productos de la clínica."
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </figure>

          <figure
            data-image-reveal
            className="photo-zoom relative -mt-16 ml-auto aspect-[2/3] w-[46%] overflow-hidden rounded-xl border-4 border-[oklch(0.988_0.003_85)] md:absolute md:-bottom-14 md:-left-14 md:ml-0 md:mt-0 md:w-[42%]"
          >
            <Image
              src={equipo}
              alt="El equipo médico de Skin Clinic GT frente al rótulo de la recepción."
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 46vw, 24vw"
              className="object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
