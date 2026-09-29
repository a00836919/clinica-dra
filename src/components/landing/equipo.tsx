import Image from "next/image";
import retrato from "@/assets/fotos/duo-retrato.jpg";
import pasillo from "@/assets/fotos/duo-pasillo.jpg";

const DOCTORAS = ["Dra. Vilma García", "Dra. María José Polanco"];

/**
 * Bloque del equipo, contado desde las dos doctoras: la composición fotográfica
 * abre a la izquierda y el texto cierra a la derecha, al revés que el hero.
 */
export function Equipo() {
  return (
    <section
      id="equipo"
      data-parallax-section
      className="border-t border-[oklch(0.91_0.008_60)] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-24">
        {/* Composición fotográfica */}
        <div className="relative order-2 md:order-1">
          <figure
            data-image-reveal
            className="photo-zoom relative aspect-[3/4] w-full overflow-hidden rounded-2xl md:aspect-[4/5]"
          >
            <Image
              src={retrato}
              alt="La Dra. Vilma García y la Dra. María José Polanco, dermatólogas de Skin Clinic GT, sentadas con bata blanca."
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </figure>

          <figure
            data-image-reveal
            className="photo-zoom relative -mt-16 ml-auto aspect-[2/3] w-[46%] overflow-hidden rounded-xl border-4 border-[oklch(0.988_0.003_85)] md:absolute md:-bottom-14 md:-right-14 md:ml-0 md:mt-0 md:w-[42%]"
          >
            <Image
              src={pasillo}
              alt="Las dos dermatólogas de espalda contra espalda en el pasillo de la clínica."
              fill
              placeholder="blur"
              sizes="(max-width: 768px) 46vw, 24vw"
              className="object-cover"
            />
          </figure>
        </div>

        {/* Texto */}
        <div className="order-1 md:order-2">
          <p
            data-reveal="fade-up"
            className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.72_0.065_25)]"
          >
            El equipo
          </p>

          <h2
            data-motion-text
            className="mb-7 leading-[1.14]"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.9rem,4vw,2.9rem)",
              fontWeight: 500,
            }}
          >
            Dos generaciones, una misma vocación: Cuidar la salud de tu piel.
          </h2>

          {/* Las firmas, antes del párrafo: son el sujeto del bloque */}
          <div
            data-reveal-group
            className="mb-8 flex flex-col gap-2.5 border-t border-[oklch(0.91_0.008_60)] pt-6"
          >
            {DOCTORAS.map((nombre) => (
              <p
                key={nombre}
                data-reveal-item
                className="flex items-center gap-3 text-[15px] text-[oklch(0.25_0.02_40)]"
                style={{ fontFamily: "var(--font-playfair)", fontWeight: 500 }}
              >
                <span
                  aria-hidden="true"
                  className="h-px w-6 flex-shrink-0"
                  style={{ background: "oklch(0.72 0.065 25)" }}
                />
                {nombre}
              </p>
            ))}
          </div>

          <p
            data-reveal="fade-up"
            data-reveal-delay="0.05"
            className="mb-8 max-w-[42ch] text-[14px] leading-[1.85] text-[oklch(0.5_0.012_40)]"
          >
            Somos un equipo de dermatólogas de Guatemala dedicadas al cuidado integral de la
            piel, el cabello y las uñas, atendiendo a pacientes de todas las edades con un
            enfoque personalizado y humano.
          </p>

          <a
            href="#cita"
            data-reveal="fade-up"
            data-reveal-delay="0.1"
            data-magnetic
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[oklch(0.55_0.07_25)] underline decoration-[oklch(0.85_0.03_25)] underline-offset-[6px] transition-colors hover:text-[oklch(0.42_0.09_25)] hover:decoration-[oklch(0.72_0.065_25)]"
          >
            Agenda tu cita
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
