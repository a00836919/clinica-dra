import type { StaticImageData } from "next/image";
import { HoverExpand_001 } from "@/components/ui/skiper-ui/skiper52";

export type FotoClinica = {
  src: StaticImageData;
  alt: string;
  titulo: string;
};

/**
 * La clínica por dentro: una tira de fotos que se abre al pasar el cursor.
 *
 * Reemplaza a la galería fijada con scroll horizontal. Esa secuestraba el
 * scroll durante varias pantallas; esta se ve entera de un vistazo y cada foto
 * se abre cuando interesa. En móvil las fotos van apiladas y se abren al tocarlas.
 */
export function GaleriaClinica({ fotos }: { fotos: FotoClinica[] }) {
  return (
    <div className="px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-6 md:mb-12 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-16">
          <div>
            <p
              data-reveal="fade-up"
              className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/45"
            >
              La clínica por dentro
            </p>
            <h2
              data-motion-text
              className="max-w-[18ch] leading-[1.1] text-white"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(1.8rem,3.4vw,2.8rem)",
                fontWeight: 500,
              }}
            >
              Dermatología cercana, ética y basada en ciencia.
            </h2>
          </div>

          <p
            data-reveal="fade-up"
            data-reveal-delay="0.05"
            className="max-w-[36ch] text-[13px] leading-[1.8] text-white/55 md:justify-self-end"
          >
            {fotos.length} tratamientos que hacemos en consulta, con el equipo con el que los
            hacemos.{" "}
            <span className="hidden md:inline">Pasa el cursor por cada foto.</span>
            <span className="md:hidden">Toca una foto para abrirla.</span>
          </p>
        </div>

        <HoverExpand_001
          className="h-[38rem] md:h-[clamp(22rem,56vh,34rem)]"
          images={fotos.map((f) => ({ src: f.src, alt: f.alt, code: f.titulo }))}
        />
      </div>
    </div>
  );
}
