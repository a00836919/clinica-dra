import Image from "next/image";
import tricoscopia from "@/assets/fotos/tricoscopia.jpg";
import fototerapia from "@/assets/fotos/fototerapia.jpg";

const FOTOS = [
  {
    src: tricoscopia,
    alt: "Evaluación capilar con tricoscopia digital: la imagen ampliada del cuero cabelludo se proyecta en el monitor del equipo.",
    titulo: "Tricoscopia digital",
    pie: "Evaluamos el cuero cabelludo ampliado en pantalla antes de indicar cualquier tratamiento capilar.",
  },
  {
    src: fototerapia,
    alt: "Máscara de fototerapia LED encendida en luz roja dentro de una sala de tratamiento.",
    titulo: "Fototerapia LED",
    pie: "Sesiones de luz LED como complemento de los tratamientos indicados en consulta.",
  },
];

/** Única banda oscura del sitio: deja que la luz de los equipos ponga el color. */
export function Tecnologia() {
  return (
    <section
      id="clinica"
      data-parallax-section
      className="px-6 py-24 md:px-10 md:py-32"
      style={{ background: "oklch(0.19 0.008 45)" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 grid gap-8 md:grid-cols-[1fr_1fr] md:items-end md:gap-20">
          <div>
            <p
              data-reveal="fade-up"
              className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-white/45"
            >
              La clínica por dentro
            </p>
            <h2
              data-motion-text
              className="leading-[1.12] text-white"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(1.9rem,4vw,2.9rem)",
                fontWeight: 500,
              }}
            >
              Equipo que sostiene el diagnóstico.
            </h2>
          </div>

          <p
            data-reveal="fade-up"
            data-reveal-delay="0.05"
            className="max-w-[42ch] text-[14px] leading-[1.85] text-white/55"
          >
            La consulta empieza con una revisión clínica. La tecnología entra después,
            cuando hay algo concreto que medir o tratar.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:gap-10">
          {FOTOS.map((foto) => (
            <figure key={foto.titulo} className="flex flex-col">
              <div
                data-image-reveal
                className="photo-zoom relative aspect-[3/4] w-full overflow-hidden rounded-2xl"
              >
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  loading="lazy"
                  placeholder="blur"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption data-reveal="fade-up" className="mt-5">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
                  {foto.titulo}
                </p>
                <p className="max-w-[36ch] text-[13px] leading-[1.75] text-white/65">
                  {foto.pie}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
