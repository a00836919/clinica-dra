import Image, { type StaticImageData } from "next/image";
import retrato from "@/assets/fotos/duo-retrato.jpg";
import pasillo from "@/assets/fotos/duo-pasillo.jpg";
import recepcion from "@/assets/fotos/equipo.jpg";
import { Link000 } from "@/components/ui/skiper-ui/skiper40";

const DOCTORAS = ["Dra. Vilma García", "Dra. María José Polanco"];

/**
 * Bloque del equipo: el texto queda fijo a la izquierda mientras las fotos
 * pasan a la derecha.
 *
 * Antes era un collage con una foto montada sobre la otra, que le tapaba el
 * brazo a una de las doctoras. Ahora las fotos van en una cuadrícula sin
 * encimarse: el retrato arriba y dos de la clínica abajo, lado a lado.
 */
export function Equipo() {
  return (
    <section
      id="equipo"
      className="border-t border-[oklch(0.91_0.008_60)] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[5fr_7fr] md:gap-20">
        <div className="md:sticky md:top-28 md:self-start">
          <p
            data-reveal="fade-up"
            className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.62_0.07_25)]"
          >
            El equipo
          </p>

          <h2
            data-motion-text
            className="mb-8 leading-[1.14] text-[oklch(0.22_0.02_40)]"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.9rem,3.6vw,2.7rem)",
              fontWeight: 500,
            }}
          >
            Dos generaciones, una misma vocación: cuidar la salud de tu piel.
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
                className="flex items-center gap-3 text-[16px] text-[oklch(0.25_0.02_40)]"
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
            className="mb-8 max-w-[40ch] text-[14px] leading-[1.85] text-[oklch(0.5_0.012_40)]"
          >
            Somos un equipo de dermatólogas de Guatemala dedicadas al cuidado integral de la
            piel, el cabello y las uñas, atendiendo a pacientes de todas las edades con un
            enfoque personalizado y humano.
          </p>

          <div data-reveal="fade-up" data-reveal-delay="0.1">
            <Link000
              href="#cita"
              className="inline-flex gap-2 text-[13px] font-medium text-[oklch(0.55_0.07_25)]"
            >
              Agenda tu cita <span aria-hidden="true">→</span>
            </Link000>
          </div>
        </div>

        {/* Fotos: retrato arriba, dos de la clínica abajo */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Foto
            src={retrato}
            alt="La Dra. Vilma García y la Dra. María José Polanco, dermatólogas de Skin Clinic GT, sentadas con bata blanca."
            className="col-span-2 aspect-[5/4]"
            posicion="object-[50%_30%]"
            sizes="(max-width: 768px) 100vw, 55vw"
          />
          <Foto
            src={recepcion}
            alt="Las dos dermatólogas en la recepción de la clínica, junto al rótulo de Skin Clinic."
            className="aspect-[2/3]"
            sizes="(max-width: 768px) 50vw, 28vw"
          />
          <Foto
            src={pasillo}
            alt="Las dos dermatólogas de espalda contra espalda en el pasillo de la clínica."
            className="aspect-[2/3] md:mt-16"
            sizes="(max-width: 768px) 50vw, 28vw"
          />
        </div>
      </div>
    </section>
  );
}

function Foto({
  src,
  alt,
  className,
  posicion = "object-center",
  sizes,
}: {
  src: StaticImageData;
  alt: string;
  className: string;
  posicion?: string;
  sizes: string;
}) {
  return (
    <figure
      data-image-reveal
      className={`photo-zoom relative w-full overflow-hidden rounded-2xl ${className}`}
    >
      <Image src={src} alt={alt} fill placeholder="blur" sizes={sizes} className={`object-cover ${posicion}`} />
    </figure>
  );
}
