import Image from "next/image";
import recepcion from "@/assets/fotos/recepcion.jpg";

const SEDES = ["Integra", "Decorísima", "Galerías Tiffany"];

/**
 * Escenario fotográfico de apertura: la foto de la recepción ocupa el viewport,
 * el contenido se ancla abajo a la izquierda y los rieles verticales le dan
 * estructura sin tapar la imagen.
 */
export function Hero() {
  return (
    <section
      data-hero-sentinel
      data-parallax-section
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* Capa fotográfica, con sobremedida vertical para el parallax */}
      <div
        data-parallax-image
        data-parallax-speed="0.07"
        className="absolute inset-x-0 -top-[9%] -bottom-[9%]"
      >
        <div data-hero-image className="relative h-full w-full">
          <Image
            src={recepcion}
            alt="Recepción de Skin Clinic GT: el rótulo dorado de la clínica iluminado sobre una pared clara, con plantas en primer plano."
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Velo superior: el nav es blanco y la pared de la foto es clara */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgba(20,14,11,0.62), transparent)" }}
      />

      {/* Lavados direccionales para que el texto se lea sin aplanar la foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(20,14,11,0.90) 0%, rgba(20,14,11,0.62) 38%, rgba(20,14,11,0.18) 72%, rgba(20,14,11,0.04) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[78%]"
        style={{
          background:
            "linear-gradient(to top, rgba(20,14,11,0.95) 0%, rgba(20,14,11,0.72) 30%, transparent 100%)",
        }}
      />
      {/* Poza de sombra bajo el titular: el rótulo de la pared no debe competir.
          Se abre bastante porque en móvil el texto cae justo sobre las letras. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 90% at 10% 88%, rgba(20,14,11,0.78) 0%, rgba(20,14,11,0.30) 50%, transparent 78%)",
        }}
      />

      {/* Rieles y marcadores */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="relative mx-auto h-full w-full max-w-6xl px-6 md:px-10">
          <div className="stage-rail left-6 md:left-10" />
          <div className="stage-rail right-6 md:right-10" />
          <div className="stage-marker left-6 top-24 -translate-x-[2px] md:left-10" />
          <div className="stage-marker right-6 top-24 translate-x-[2px] md:right-10" />
          <div className="stage-marker left-6 bottom-16 -translate-x-[2px] md:left-10" />
          <div className="stage-marker right-6 bottom-16 translate-x-[2px] md:right-10" />
        </div>
      </div>

      {/* Contenido anclado abajo */}
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-40 md:px-10 md:pb-24">
        <div className="grid items-end gap-10 md:grid-cols-[1.55fr_1fr]">
          <div>
            <div data-hero-step className="mb-6 flex items-center gap-4">
              <span
                aria-hidden="true"
                className="hidden h-px w-10 flex-shrink-0 sm:block"
                style={{ background: "oklch(0.82 0.08 78)" }}
              />
              <p className="on-photo text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">
                Dermatología · Estética avanzada · Guatemala
              </p>
            </div>

            <h1
              data-hero-step
              className="on-photo mb-6 max-w-[14ch] text-white"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2.5rem,5.6vw,4.4rem)",
                lineHeight: 1.05,
                fontWeight: 500,
              }}
            >
              {/* Jerarquía por tono, no por color: el dorado se lo queda la foto */}
              <span className="text-white/65">Bienvenidos a</span>
              <br />
              <span className="italic">Skin Clinic GT</span>
            </h1>

            <p
              data-hero-step
              className="on-photo mb-9 max-w-[42ch] text-[14px] leading-relaxed text-white/85"
            >
              Solicita tu cita en línea o ingresa con tu DPI para ver el historial de tus
              consultas, diagnósticos y recetas.
            </p>

            <div data-hero-step className="flex flex-wrap items-center gap-3">
              <a
                href="#cita"
                data-magnetic
                className="btn-fill inline-flex h-12 items-center rounded-full px-7 text-[13px] font-medium tracking-wide text-[oklch(0.28_0.03_35)]"
                style={{ background: "white" }}
              >
                Solicitar cita →
              </a>
              <a
                href="#mis-citas"
                data-magnetic
                className="inline-flex h-12 items-center rounded-full border border-white/40 px-7 text-[13px] font-medium tracking-wide text-white/85 transition-colors hover:border-white hover:text-white"
              >
                Mis citas
              </a>
            </div>
          </div>

          {/* Carril secundario: sedes */}
          <div
            data-hero-step
            className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-[2px] md:justify-self-end md:w-full"
          >
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/55">
              Tres sedes
            </p>
            <ul className="flex flex-col gap-2.5">
              {SEDES.map((sede) => (
                <li key={sede} className="flex items-center gap-2.5">
                  <span className="h-1 w-1 flex-shrink-0 rounded-full bg-white/45" />
                  <span className="text-[13px] text-white/80">{sede}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
