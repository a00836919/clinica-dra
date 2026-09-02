"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Sistema de motion del sitio: GSAP + ScrollTrigger, con Lenis como ÚNICO
 * motor de smooth scroll (no se instala ni inicializa Locomotive).
 *
 * Se maneja por atributos data-* en el marcado:
 *   data-hero-step        → entrada del hero, en orden de aparición
 *   data-motion-text      → títulos que se revelan palabra por palabra
 *   data-reveal           → aparición individual (fade-up | blur-in | scale)
 *   data-reveal-group/-item → aparición escalonada de un grupo
 *   data-image-reveal     → clip reveal de una figura
 *   data-parallax-image   → parallax dentro de data-parallax-section
 *   data-magnetic         → botón magnético (solo puntero fino)
 *   data-nav + data-hero-sentinel → nav claro sobre el hero, sólido después
 *
 * Con prefers-reduced-motion todo queda en su estado final, sin smooth scroll
 * ni timelines atadas al scroll. Sin JavaScript nada se oculta: la clase
 * `has-motion` que dispara los estados iniciales la agrega este componente.
 */
export function CinematicMotion() {
  // Sin `scope`: los selectores de abajo deben alcanzar toda la página, no un
  // subárbol. useGSAP igual revierte al desmontar lo que se crea aquí dentro.
  useGSAP(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    // ── Estado final inmediato para quien pidió menos movimiento ──────────────
    if (reduceMotion) {
      gsap.set(
        "[data-hero-step], [data-motion-text], [data-reveal], [data-reveal-item], [data-image-reveal]",
        { autoAlpha: 1, clearProps: "all" },
      );
      document.querySelector("[data-nav]")?.classList.remove("nav-over-hero");
      return;
    }

    root.classList.add("has-motion");
    gsap.defaults({ ease: "power3.out", duration: 0.85 });

    // ── Lenis ─────────────────────────────────────────────────────────────────
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // ── Nav: transparente sobre el hero, sólido a partir de ahí ───────────────
    const nav = document.querySelector("[data-nav]");
    const sentinel = document.querySelector("[data-hero-sentinel]");
    if (nav && sentinel) {
      nav.classList.add("nav-over-hero");
      ScrollTrigger.create({
        trigger: sentinel,
        start: "bottom top+=72",
        onEnter: () => nav.classList.remove("nav-over-hero"),
        onLeaveBack: () => nav.classList.add("nav-over-hero"),
      });
    }

    // ── Entrada del hero: imagen, luego titular, luego apoyo, luego CTA ───────
    const heroImage = document.querySelector("[data-hero-image]");
    const heroSteps = gsap.utils.toArray<HTMLElement>("[data-hero-step]");
    if (heroSteps.length) {
      const tl = gsap.timeline({ delay: 0.15 });
      if (heroImage) {
        tl.fromTo(heroImage, { scale: 1.07 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
      }
      tl.fromTo(
        heroSteps,
        { y: 26, autoAlpha: 0, filter: "blur(10px)" },
        {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power4.out",
          stagger: 0.12,
        },
        0.25,
      );
    }

    // ── Títulos palabra por palabra ───────────────────────────────────────────
    // Se conserva el nombre accesible completo con aria-label y las palabras
    // partidas quedan ocultas para lectores de pantalla.
    gsap.utils.toArray<HTMLElement>("[data-motion-text]").forEach((el) => {
      const texto = (el.textContent ?? "").trim();
      if (!texto) return;

      el.setAttribute("aria-label", texto);
      const partes = texto.split(/(\s+)/);
      el.textContent = "";

      partes.forEach((parte) => {
        if (!parte.trim()) {
          el.appendChild(document.createTextNode(parte));
          return;
        }
        const mask = document.createElement("span");
        mask.className = "motion-word-mask";
        mask.setAttribute("aria-hidden", "true");
        const word = document.createElement("span");
        word.className = "motion-word";
        word.textContent = parte;
        mask.appendChild(word);
        el.appendChild(mask);
      });

      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(
        el.querySelectorAll(".motion-word"),
        { yPercent: 110, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.055,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });

    // ── Apariciones ───────────────────────────────────────────────────────────
    const presets: Record<string, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
      "fade-up": { from: { y: 32, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
      "blur-in": {
        from: { y: 18, autoAlpha: 0, filter: "blur(10px)" },
        to: { y: 0, autoAlpha: 1, filter: "blur(0px)" },
      },
      scale: { from: { scale: 0.96, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 } },
    };

    gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
      gsap.set(group, { autoAlpha: 1 });
      gsap.fromTo(
        group.querySelectorAll("[data-reveal-item]"),
        { y: 36, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.95,
          ease: "power4.out",
          stagger: 0.075,
          scrollTrigger: { trigger: group, start: "top 82%", once: true },
        },
      );
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal]:not([data-reveal-item])").forEach((el) => {
      const preset = presets[el.dataset.reveal ?? "fade-up"] ?? presets["fade-up"];
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(el, preset.from, {
        ...preset.to,
        duration: 0.9,
        ease: "power4.out",
        delay: Number(el.dataset.revealDelay ?? 0),
        scrollTrigger: { trigger: el, start: "top 84%", once: true },
      });
    });

    // ── Clip reveal de fotografías ────────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>("[data-image-reveal]").forEach((figure) => {
      gsap.set(figure, { autoAlpha: 1 });
      gsap
        .timeline({ scrollTrigger: { trigger: figure, start: "top 85%", once: true } })
        .fromTo(
          figure,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.out" },
        )
        .fromTo(
          figure.querySelector("img"),
          { scale: 1.09 },
          { scale: 1, duration: 1.3, ease: "power4.out" },
          0,
        );
    });

    // ── Parallax ──────────────────────────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>("[data-parallax-image]").forEach((layer) => {
      const speed = Number(layer.dataset.parallaxSpeed ?? 0.12);
      const section = layer.closest("[data-parallax-section]") ?? layer;
      gsap.to(layer, {
        y: () => window.innerHeight * speed * -1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });
    });

    // ── Botones magnéticos (solo puntero fino) ────────────────────────────────
    if (finePointer) {
      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
        const fuerza = Number(el.dataset.magnetic ?? 0.16);
        const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * fuerza);
          yTo((e.clientY - r.top - r.height / 2) * fuerza);
        });
        el.addEventListener("pointerleave", () => {
          xTo(0);
          yTo(0);
        });
      });
    }

    // Las fotos cambian la altura de la página: recalcular al terminar de cargar.
    const refrescar = () => ScrollTrigger.refresh();
    window.addEventListener("load", refrescar);
    document.fonts?.ready.then(refrescar);

    return () => {
      window.removeEventListener("load", refrescar);
      gsap.ticker.remove(raf);
      lenis.destroy();
      root.classList.remove("has-motion");
    };
  }, []);

  return null;
}
