"use client";

import { useEffect, useActionState } from "react";
import { solicitarCita, loginPortal, type SolicitudState, type PortalLoginState } from "./actions";

const SEDES = ["Integra", "Decorísima", "Galerías Tiffany"];

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: "-20px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const initState: SolicitudState  = { status: "idle" };
const initPortal: PortalLoginState = { status: "idle" };

export default function LandingPage() {
  const [state, action, pending]             = useActionState(solicitarCita, initState);
  const [portalState, portalAction, portalPending] = useActionState(loginPortal, initPortal);

  useScrollReveal();

  return (
    <div style={{ fontFamily: "var(--font-geist-sans)", background: "oklch(0.988 0.003 85)", color: "oklch(0.145 0 0)", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-[oklch(0.92_0.008_60)]"
        style={{ background: "oklch(0.988 0.003 85 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <span className="text-[11px] tracking-[0.25em] uppercase font-semibold" style={{ color: "oklch(0.72 0.065 25)" }}>
          Skin Clinic GT
        </span>
        <div className="flex items-center gap-4">
          <a href="#cita"
             className="hidden sm:inline text-[12px] text-[oklch(0.52_0.012_40)] hover:text-[oklch(0.145_0_0)] transition-colors tracking-wide">
            Solicitar cita
          </a>
          <a href="#mis-citas"
             className="text-[11px] font-medium px-4 py-2 rounded-full border border-[oklch(0.88_0.01_60)] text-[oklch(0.4_0.012_40)] hover:border-[oklch(0.72_0.065_25)] hover:text-[oklch(0.55_0.07_25)] transition-colors">
            Mis citas
          </a>
        </div>
      </nav>

      {/* ── Hero — dos acciones ── */}
      <section className="pt-28 pb-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">

          {/* Eyebrow */}
          <p className="hero-anim hero-d0 text-[10px] tracking-[0.3em] uppercase text-[oklch(0.62_0.065_25)] mb-8 font-medium">
            Dermatología · Estética Avanzada · Guatemala
          </p>

          {/* Heading */}
          <h1 className="hero-anim hero-d1 mb-3"
              style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.4rem,6vw,4.2rem)", lineHeight: 1.08, fontWeight: 500 }}>
            Bienvenida a<br />
            <span className="italic" style={{ color: "oklch(0.72 0.065 25)" }}>Skin Clinic GT</span>
          </h1>

          <p className="hero-anim hero-d2 text-[14px] text-[oklch(0.5_0.012_40)] leading-relaxed max-w-[42ch] mb-12">
            Solicita tu cita en línea o ingresa con tu DPI para ver el historial
            de tus consultas y recetas.
          </p>

          {/* Two action cards */}
          <div className="hero-anim hero-d3 grid sm:grid-cols-2 gap-4">

            {/* Card: Solicitar cita */}
            <a href="#cita"
               className="group flex flex-col gap-3 p-7 rounded-2xl border border-[oklch(0.9_0.008_60)] bg-white hover:border-[oklch(0.72_0.065_25)] transition-all duration-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-[oklch(0.65_0.065_25)]">
                  Nueva cita
                </span>
                <span className="text-[oklch(0.75_0.065_25)] group-hover:translate-x-1 transition-transform duration-200 text-lg">→</span>
              </div>
              <p className="text-[1.25rem] font-medium leading-snug"
                 style={{ fontFamily: "var(--font-playfair)" }}>
                Solicitar cita
              </p>
              <p className="text-[12px] text-[oklch(0.55_0.012_40)] leading-relaxed">
                Completa el formulario y te contactamos en menos de 24 horas.
              </p>
            </a>

            {/* Card: Mis citas */}
            <a href="#mis-citas"
               className="group flex flex-col gap-3 p-7 rounded-2xl border border-[oklch(0.9_0.008_60)] bg-white hover:border-[oklch(0.72_0.065_25)] transition-all duration-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-[oklch(0.65_0.065_25)]">
                  Pacientes
                </span>
                <span className="text-[oklch(0.75_0.065_25)] group-hover:translate-x-1 transition-transform duration-200 text-lg">→</span>
              </div>
              <p className="text-[1.25rem] font-medium leading-snug"
                 style={{ fontFamily: "var(--font-playfair)" }}>
                Mis citas y recetas
              </p>
              <p className="text-[12px] text-[oklch(0.55_0.012_40)] leading-relaxed">
                Ingresa con tu DPI para ver diagnósticos, medicamentos y solicitudes.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* ── Solicitar cita ── */}
      <section id="cita" className="px-6 md:px-10 py-20"
               style={{ background: "oklch(0.72 0.065 25)" }}>
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1.4fr] gap-16 items-start">

          {/* Left copy */}
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/60 mb-4 font-medium">
              Solicitar cita
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-medium text-white leading-snug mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}>
              Tu primera cita<br />
              <span className="italic font-normal">nos cuenta todo.</span>
            </h2>
            <p className="text-[13px] text-white/65 leading-[1.8] max-w-[30ch]">
              Te contactamos en menos de 24 horas para confirmar tu hora y sede.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              {SEDES.map((s) => (
                <div key={s} className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/40 flex-shrink-0" />
                  <span className="text-[12px] text-white/55">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="reveal reveal-d1">
            {state.status === "success" ? (
              <div className="bg-white/10 rounded-2xl p-10 text-center">
                <p className="text-[1.8rem] font-medium text-white mb-3"
                   style={{ fontFamily: "var(--font-playfair)" }}>
                  ¡Solicitud recibida!
                </p>
                <p className="text-[14px] text-white/70 leading-relaxed">
                  Te contactamos en menos de 24 horas para confirmar tu cita.
                </p>
              </div>
            ) : (
              <form action={action} className="flex flex-col gap-5">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                    Nombre completo *
                  </label>
                  <input name="nombre" required placeholder="Ana García López"
                         className="land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Teléfono *
                    </label>
                    <input name="telefono" required placeholder="5555 0000" type="tel"
                           className="land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Correo
                    </label>
                    <input name="email" placeholder="ana@correo.com" type="email"
                           className="land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Sede
                    </label>
                    <select name="sede"
                            className="land-input text-white border-white/25 focus:border-white/80 bg-transparent appearance-none cursor-pointer">
                      <option value="Sin preferencia" className="text-foreground bg-white">Sin preferencia</option>
                      {SEDES.map((s) => (
                        <option key={s} value={s} className="text-foreground bg-white">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Fecha aproximada
                    </label>
                    <input name="fecha_preferida" type="date"
                           className="land-input text-white border-white/25 focus:border-white/80 bg-transparent [color-scheme:dark]" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                    ¿Qué te preocupa?
                  </label>
                  <textarea name="motivo" rows={3} placeholder="Cuéntanos brevemente…"
                            className="land-input text-white placeholder:text-white/30 border-white/25 focus:border-white/80 resize-none" />
                </div>

                {state.status === "error" && (
                  <p className="text-[13px] text-white bg-white/10 rounded-lg px-4 py-3">
                    {state.message}
                  </p>
                )}

                <button type="submit" disabled={pending}
                        className="btn-fill mt-1 h-12 w-full rounded-full text-[13px] font-medium tracking-wide text-[oklch(0.72_0.065_25)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "white" }}>
                  {pending ? "Enviando…" : "Solicitar cita →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Portal paciente ── */}
      <section id="mis-citas" className="px-6 md:px-10 py-20 border-t border-[oklch(0.91_0.008_60)]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1.4fr] gap-16 items-start">

          {/* Left copy */}
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[oklch(0.72_0.065_25)] font-medium mb-4">
              Portal de pacientes
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-snug mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}>
              Tus citas<br />
              <span className="italic font-normal" style={{ color: "oklch(0.72 0.065 25)" }}>y recetas</span>
            </h2>
            <p className="text-[13px] text-[oklch(0.5_0.012_40)] leading-[1.8] max-w-[30ch]">
              Ingresa con tu DPI y fecha de nacimiento para ver el historial de tus
              consultas, diagnósticos y medicamentos recetados.
            </p>
          </div>

          {/* Right: form */}
          <div className="reveal reveal-d1">
            <form action={portalAction} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
                  Número de DPI
                </label>
                <input
                  name="dpi"
                  required
                  placeholder="1234567890101"
                  className="clinic-input w-full rounded-xl border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-wider uppercase text-[oklch(0.55_0.012_40)] font-medium">
                  Fecha de nacimiento
                </label>
                <input
                  name="fecha_nacimiento"
                  type="date"
                  required
                  className="clinic-input w-full rounded-xl border border-[oklch(0.88_0.01_60)] px-4 py-3 text-sm bg-white"
                />
              </div>

              {portalState.status === "error" && (
                <p className="text-[13px] text-[oklch(0.5_0.14_25)] bg-[oklch(0.97_0.01_25)] border border-[oklch(0.88_0.04_25)] rounded-lg px-4 py-3">
                  {portalState.message}
                </p>
              )}

              <button
                type="submit"
                disabled={portalPending}
                className="btn-fill h-12 w-full rounded-full text-[13px] font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "oklch(0.72 0.065 25)" }}
              >
                {portalPending ? "Verificando…" : "Ver mis citas →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-10 py-8 border-t border-[oklch(0.91_0.008_60)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-[11px] tracking-[0.2em] uppercase font-medium text-[oklch(0.55_0.065_25)]">
            Skin Clinic GT
          </p>
          <span className="text-[11px] text-[oklch(0.7_0.012_60)]">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>

    </div>
  );
}
