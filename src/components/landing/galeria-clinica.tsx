"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type FotoClinica = {
  src: StaticImageData;
  alt: string;
  titulo: string;
};

/**
 * Galería horizontal de la clínica.
 *
 * Tiene dos modos y el marcado es el mismo para los dos:
 *
 *   · Base (sin JS, móvil, o `prefers-reduced-motion`): el visor es un scroll
 *     horizontal nativo con scroll-snap. Se arrastra con el dedo y funciona
 *     aunque nunca corra una línea de JavaScript.
 *   · Escritorio con movimiento: ScrollTrigger fija el panel y convierte el
 *     scroll vertical en avance horizontal de la tira. En ese modo el visor
 *     deja de ser scrollable (overflow hidden) y manda la timeline.
 *
 * El cambio entre modos lo hace gsap.matchMedia, que revierte solo al salir.
 */
export function GaleriaClinica({ fotos }: { fotos: FotoClinica[] }) {
  const raiz = useRef<HTMLDivElement>(null);
  const visor = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const contador = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const elVisor = visor.current;
      const laPista = pista.current;
      const panel = raiz.current?.querySelector<HTMLElement>("[data-panel]");
      if (!elVisor || !laPista || !panel) return;

      /** Cuánto tiene que correr la tira para que se vea la última foto. */
      const recorrido = () => {
        const cs = getComputedStyle(elVisor);
        const util =
          elVisor.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return Math.max(0, laPista.scrollWidth - util);
      };

      const pintarAvance = (p: number) => {
        if (barra.current) gsap.set(barra.current, { scaleX: p });
        if (contador.current) {
          contador.current.textContent = String(
            Math.round(p * (fotos.length - 1)) + 1,
          ).padStart(2, "0");
        }
      };

      // Las fotos van en carga diferida, pero dentro de una tira recortada y
      // desplazada por transform el navegador no siempre las pide. Al acercarse
      // la sección se pasan a carga inmediata, que es lo que dispara el fetch.
      ScrollTrigger.create({
        trigger: raiz.current,
        start: "top bottom+=60%",
        once: true,
        onEnter: () => {
          laPista.querySelectorAll("img").forEach((img) => {
            img.loading = "eager";
          });
        },
      });

      const mm = gsap.matchMedia(raiz);

      // ── Modo fijado: el scroll vertical mueve la tira ───────────────────────
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        if (recorrido() <= 0) return;
        elVisor.style.overflow = "hidden";
        elVisor.removeAttribute("tabindex");
        elVisor.scrollLeft = 0;

        const tarjetas = gsap.utils.toArray<HTMLElement>("[data-tarjeta]", laPista);
        const fondos = gsap.utils.toArray<HTMLElement>("[data-foto]", laPista);

        // La tira avanza durante el 86% del recorrido; el resto es un respiro
        // sobre la última foto antes de soltar el panel.
        const AVANCE = 0.86;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: raiz.current,
            start: "top top",
            end: () => `+=${Math.round(recorrido() / AVANCE) + 1}`,
            pin: panel,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => pintarAvance(Math.min(1, self.progress / AVANCE)),
          },
        });

        tl.to(laPista, { x: () => -recorrido(), ease: "none", duration: AVANCE }, 0)
          // Las fotos van un poco más lentas que su marco: da profundidad.
          .fromTo(fondos, { xPercent: -7 }, { xPercent: 7, ease: "none", duration: AVANCE }, 0)
          .to({}, { duration: 1 - AVANCE });

        // Entrada de las tarjetas la primera vez que se ve el panel
        const entrada = gsap.from(tarjetas, {
          y: 60,
          autoAlpha: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.08,
          scrollTrigger: { trigger: raiz.current, start: "top 65%", once: true },
        });

        return () => {
          entrada.scrollTrigger?.kill();
          elVisor.style.overflow = "";
          elVisor.setAttribute("tabindex", "0");
          // Sólo lo que puso GSAP. `clearProps: "all"` borraría también el
          // position/width/height inline que next/image necesita para `fill`.
          const TRANSFORMES = "transform,translate,rotate,scale";
          gsap.set(laPista, { clearProps: TRANSFORMES });
          gsap.set(fondos, { clearProps: TRANSFORMES });
          gsap.set(tarjetas, { clearProps: `${TRANSFORMES},opacity,visibility` });
        };
      });

      // ── Modo base: la barra sigue al scroll nativo del visor ────────────────
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        const alDesplazar = () => {
          const max = elVisor.scrollWidth - elVisor.clientWidth;
          pintarAvance(max > 0 ? elVisor.scrollLeft / max : 0);
        };
        alDesplazar();
        elVisor.addEventListener("scroll", alDesplazar, { passive: true });

        // Gesto horizontal de trackpad: Lenis escucha la rueda en window y le
        // hace preventDefault, así que aquí se corta la propagación.
        const alRodar = (e: WheelEvent) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation();
        };
        elVisor.addEventListener("wheel", alRodar);

        return () => {
          elVisor.removeEventListener("scroll", alDesplazar);
          elVisor.removeEventListener("wheel", alRodar);
        };
      });

      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className="relative">
      {/* En escritorio el panel mide exactamente una pantalla (es lo que se
          fija) y se parte en dos: el título a la izquierda, la tira corriendo
          a la derecha hasta salirse por el borde. En móvil se apila. */}
      <div
        data-panel
        className="flex min-h-screen flex-col px-6 py-16 md:h-screen md:min-h-0 md:px-10 md:py-14"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:min-h-0 md:flex-row md:gap-12 lg:gap-16">
          {/* Columna fija: título, contador y avance */}
          <div className="mb-8 md:mb-0 md:flex md:w-[32%] md:max-w-[22rem] md:flex-shrink-0 md:flex-col md:justify-center">
            <p
              data-reveal="fade-up"
              className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/45"
            >
              La clínica por dentro
            </p>

            <h2
              data-motion-text
              className="mb-8 leading-[1.1] text-white"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(1.8rem,3.4vw,2.8rem)",
                fontWeight: 500,
              }}
            >
              Dermatología cercana, ética y basada en ciencia.
            </h2>

            <p
              aria-hidden="true"
              className="mb-5 tabular-nums leading-none text-white/25"
              style={{ fontFamily: "var(--font-playfair)", fontSize: "1.6rem" }}
            >
              <span ref={contador} style={{ color: "oklch(0.82 0.08 78)" }}>
                01
              </span>
              <span className="mx-1.5 text-white/20">/</span>
              {String(fotos.length).padStart(2, "0")}
            </p>

            <div className="flex items-center gap-5">
              <div aria-hidden="true" className="h-px flex-1 bg-white/15">
                <span
                  ref={barra}
                  className="block h-px origin-left"
                  style={{ background: "oklch(0.82 0.08 78)", transform: "scaleX(0)" }}
                />
              </div>
              <p className="flex-shrink-0 text-[10px] font-medium uppercase tracking-[0.25em] text-white/35">
                <span className="md:hidden">Desliza</span>
                <span className="hidden md:inline">Sigue bajando</span>
              </p>
            </div>
          </div>

          {/* Tira de fotos: se sale por el borde derecho de la pantalla */}
          <div
            ref={visor}
            tabIndex={0}
            role="region"
            aria-label="Fotografías de la clínica"
            className="sin-scrollbar -ml-6 mr-[calc(50%-50vw)] snap-x snap-mandatory scroll-p-6 overflow-x-auto pb-2 pl-6 pr-6 md:-ml-0 md:h-full md:min-w-0 md:flex-1 md:scroll-p-0 md:pb-0 md:pl-0 md:pr-10"
            style={{ overscrollBehaviorX: "contain" }}
          >
            <div ref={pista} className="flex h-full items-center gap-5 md:gap-8">
              {fotos.map((foto, i) => (
                <article
                  key={foto.titulo}
                  data-tarjeta
                  className={`tarjeta-galeria flex w-[74vw] flex-shrink-0 flex-col sm:w-[52vw] ${
                    i % 2 === 1 ? "md:translate-y-8" : ""
                  }`}
                >
                  <div className="mb-4 flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="tabular-nums leading-none text-white/35"
                      style={{ fontFamily: "var(--font-playfair)", fontSize: "1.4rem" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
                  </div>

                  <div className="foto-marco relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
                    <Image
                      data-foto
                      src={foto.src}
                      alt={foto.alt}
                      fill
                      loading={i < 2 ? undefined : "lazy"}
                      placeholder="blur"
                      sizes="(max-width: 640px) 74vw, (max-width: 768px) 52vw, 34vw"
                      className="scale-[1.16] object-cover"
                    />
                  </div>

                  <h3 className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-white/65">
                    {foto.titulo}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
