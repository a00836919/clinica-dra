"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

/*
 * Adaptado del original para Skin Clinic GT:
 *   · next/image con placeholder borroso en vez de <img>.
 *   · Anchos por flex-grow en vez de rem fijos: llena el contenedor que le
 *     toque y en móvil se vuelve vertical (no hay hover; se toca para abrir).
 *   · Cada foto es un botón: con Tab se recorre y se abre al enfocarla.
 *   · Con `prefers-reduced-motion` cambia sin animar.
 *   · Se quitaron la demo y los imports de CSS de Swiper, que no se usaban y
 *     rompían el build sin Swiper instalado.
 */

export type HoverExpandImage = {
  src: StaticImageData;
  alt: string;
  /** Rótulo que aparece al abrir la foto. */
  code: string;
};

const HoverExpand_001 = ({
  images,
  className,
  initial = 0,
}: {
  images: HoverExpandImage[];
  className?: string;
  initial?: number;
}) => {
  const [activeImage, setActiveImage] = useState(initial);
  const reducir = useReducedMotion();
  const transicion = reducir ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.ul
      initial={reducir ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full flex-col gap-1.5 md:flex-row", className)}
    >
      {images.map((image, index) => {
        const activa = activeImage === index;
        return (
          <motion.li
            key={image.code}
            className="relative min-h-0 min-w-0 overflow-hidden rounded-3xl"
            initial={false}
            animate={{ flexGrow: activa ? 6 : 1 }}
            style={{ flexBasis: 0 }}
            transition={transicion}
            onHoverStart={() => setActiveImage(index)}
          >
            <button
              type="button"
              aria-expanded={activa}
              aria-label={image.code}
              onClick={() => setActiveImage(index)}
              onFocus={() => setActiveImage(index)}
              className="group absolute inset-0 block size-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                placeholder="blur"
                sizes="(max-width: 768px) 100vw, 60vw"
                className={cn(
                  "object-cover transition-[filter,transform] duration-700",
                  activa ? "brightness-100 saturate-100" : "brightness-[0.55] saturate-[0.7]",
                )}
              />
              {/* En móvil las franjas cerradas son anchas: el nombre dice qué hay adentro. */}
              {!activa && (
                <p className="absolute inset-y-0 left-5 flex items-center text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 md:hidden">
                  {image.code}
                </p>
              )}
              <AnimatePresence>
                {activa && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transicion}
                    className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {activa && (
                  <motion.div
                    initial={reducir ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ ...transicion, delay: reducir ? 0 : 0.15 }}
                    className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white">
                      {image.code}
                    </p>
                    <p
                      aria-hidden="true"
                      className="tabular-nums leading-none text-white/60"
                      style={{ fontFamily: "var(--font-playfair)", fontSize: "1.4rem" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
};

export { HoverExpand_001 };

/**
 * Skiper 52 HoverExpand_001 — React + Framer Motion
 * Illustrations by AarzooAly - https://x.com/AarzooAly
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */
