"use client";

import { useEffect, useActionState } from "react";
import { solicitarCita, loginPortal, type SolicitudState, type PortalLoginState } from "./actions";

const SEDES = [
  { num: "01", name: "Integra",          city: "Ciudad de Guatemala" },
  { num: "02", name: "Decorísima",       city: "Ciudad de Guatemala" },
  { num: "03", name: "Galerías Tiffany", city: "Ciudad de Guatemala" },
];

const SERVICIOS = [
  { num: "01", title: "Consulta dermatológica", desc: "Diagnóstico completo de tu piel, plan de tratamiento personalizado y seguimiento continuo." },
  { num: "02", title: "Rejuvenecimiento facial", desc: "Toxina botulínica, ácido hialurónico y bioestimuladores para resultados naturales y duraderos." },
  { num: "03", title: "Tratamiento del acné",   desc: "Control de brotes activos, reducción de cicatrices y prevención con protocolos clínicos probados." },
  { num: "04", title: "Manchas y pigmentación", desc: "Melasma, hiperpigmentación y manchas solares tratadas con tecnología láser y químicos especializados." },
];

const MARQUEE_TEXT = "SKIN CLINIC GT · DERMATOLOGÍA · CUIDADO DE LA PIEL · ESTÉTICA AVANZADA · GUATEMALA · MAJO POLANCO · ";

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal, .rule-draw");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: "-40px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const initState: SolicitudState = { status: "idle" };
const initPortal: PortalLoginState = { status: "idle" };

export default function LandingPage() {
  const [state, action, pending] = useActionState(solicitarCita, initState);
  const [portalState, portalAction, portalPending] = useActionState(loginPortal, initPortal);

  useScrollReveal();

  return (
    <div style={{ fontFamily: "var(--font-geist-sans)", background: "oklch(0.988 0.003 85)", color: "oklch(0.145 0 0)" }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5"
           style={{ background: "oklch(0.988 0.003 85 / 0.92)", backdropFilter: "blur(12px)" }}>
        <span className="text-[11px] tracking-[0.25em] uppercase font-medium" style={{ color: "oklch(0.145 0 0)" }}>
          Skin Clinic GT
        </span>
        <div className="hidden md:flex items-center gap-8">
          {[["Servicios","servicios"],["Nosotros","nosotros"],["Solicitar cita","cita"],["Mis citas","mis-citas"]].map(([label, id]) => (
            <a key={id} href={`#${id}`}
               className="text-[12px] text-[oklch(0.52_0.012_40)] hover:text-foreground transition-colors tracking-wide">
              {label}
            </a>
          ))}
        </div>
        <a href="#cita"
           className="btn-fill text-[11px] tracking-wider uppercase font-medium px-5 py-2.5 rounded-full border border-[oklch(0.72_0.065_25)] text-[oklch(0.55_0.07_25)] hover:text-white transition-colors"
           style={{ borderColor: "oklch(0.72 0.065 25)" }}>
          Solicitar cita
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col justify-between pt-28 pb-10 px-8 md:px-14">
        <div className="hero-anim hero-d0">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.6_0.012_40)]">
            Dermatología · Estética Avanzada
          </span>
        </div>

        <div className="flex flex-col gap-0 mt-auto mb-8">
          <div style={{ fontFamily: "var(--font-playfair)", lineHeight: 1.02 }}>
            <div className="hero-anim hero-d1 text-[clamp(3.5rem,9vw,8rem)] font-semibold text-[oklch(0.145_0_0)]">
              Tu piel,
            </div>
            <div className="hero-anim hero-d2 text-[clamp(3.5rem,9vw,8rem)] font-medium italic text-[oklch(0.145_0_0)]">
              merece
            </div>
            <div className="hero-anim hero-d3 text-[clamp(3.5rem,9vw,8rem)] font-semibold"
                 style={{ color: "oklch(0.72 0.065 25)" }}>
              lo mejor.
            </div>
          </div>

          <div className="hero-rule-anim mt-8 mb-6 h-px bg-[oklch(0.88_0.01_60)]" />

          <div className="hero-anim hero-d5 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p className="text-[15px] text-[oklch(0.45_0.012_40)] leading-relaxed max-w-[38ch]">
              Clínica dermatológica especializada en diagnóstico,
              tratamiento y bienestar de la piel. Guatemala.
            </p>
            <a href="#cita"
               className="btn-fill inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[13px] font-medium text-white self-start md:self-end flex-shrink-0"
               style={{ background: "oklch(0.72 0.065 25)" }}>
              Solicitar cita
              <span className="text-base leading-none">→</span>
            </a>
          </div>
        </div>

        {/* Bottom sedes strip */}
        <div className="hero-anim hero-d6 flex items-center gap-6 pt-6 border-t border-[oklch(0.9_0.008_60)]">
          {SEDES.map((s, i) => (
            <span key={s.name} className="flex items-center gap-5">
              {i > 0 && <span className="w-px h-3 bg-[oklch(0.82_0.01_60)]" />}
              <span className="text-[11px] text-[oklch(0.6_0.012_40)] tracking-wide">{s.name}</span>
            </span>
          ))}
          <span className="ml-auto text-[11px] text-[oklch(0.72_0.012_60)] tabular-nums">© 2026</span>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="overflow-hidden border-y border-[oklch(0.9_0.008_60)] py-3.5"
           style={{ background: "oklch(0.97 0.008 60)" }}
           aria-hidden>
        <div className="marquee-track select-none">
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              {MARQUEE_TEXT.split("·").map((part, j) => (
                <span key={j} className="flex items-center">
                  <span className="text-[11px] tracking-[0.2em] text-[oklch(0.55_0.012_40)] uppercase px-3">
                    {part.trim()}
                  </span>
                  <span className="text-[oklch(0.72_0.065_25)] text-xs">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Servicios ── */}
      <section id="servicios" className="px-8 md:px-14 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
          <h2 className="reveal text-[clamp(2rem,5vw,3.5rem)] font-medium leading-tight"
              style={{ fontFamily: "var(--font-playfair)" }}>
            Lo que hacemos<br />
            <span className="italic font-normal" style={{ color: "oklch(0.72 0.065 25)" }}>por tu piel</span>
          </h2>
          <p className="reveal reveal-d1 text-[13px] text-[oklch(0.52_0.012_40)] max-w-[32ch] leading-relaxed md:text-right">
            Cada paciente es única. Cada tratamiento, personalizado.
          </p>
        </div>

        <div className="divide-y divide-[oklch(0.91_0.008_60)]">
          {SERVICIOS.map((s, i) => (
            <div key={s.num}
                 className={`reveal reveal-d${i % 3 + 1} flex flex-col md:flex-row md:items-start gap-4 md:gap-12 py-7 group cursor-default`}>
              <span className="text-[11px] text-[oklch(0.65_0.012_40)] tracking-widest flex-shrink-0 mt-1">
                {s.num}
              </span>
              <h3 className="text-[1.1rem] font-medium text-[oklch(0.18_0_0)] group-hover:text-[oklch(0.65_0.065_25)] transition-colors duration-300 min-w-[220px]">
                {s.title}
              </h3>
              <p className="text-[13px] text-[oklch(0.5_0.012_40)] leading-relaxed flex-1 max-w-[50ch]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nosotros ── */}
      <section id="nosotros" className="px-8 md:px-14 py-24"
               style={{ background: "oklch(0.97 0.008 60)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="reveal text-[10px] tracking-[0.25em] uppercase text-[oklch(0.62_0.065_25)] mb-5 font-medium">
              Sobre la clínica
            </p>
            <h2 className="reveal reveal-d1 text-[clamp(1.8rem,4vw,2.8rem)] font-medium leading-snug mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}>
              Dra. María José<br />
              <span className="italic">Polanco</span>
            </h2>
            <div className="reveal reveal-d2 rule-draw h-px mb-6"
                 style={{ background: "oklch(0.72 0.065 25)" }} />
            <p className="reveal reveal-d2 text-[14px] text-[oklch(0.45_0.012_40)] leading-[1.8] mb-4">
              La piel es el órgano más visible del cuerpo y el primero que refleja
              lo que ocurre dentro de él. En Skin Clinic GT tratamos cada caso con
              la precisión de la dermatología clínica y la sensibilidad que cada
              paciente merece.
            </p>
            <p className="reveal reveal-d3 text-[14px] text-[oklch(0.45_0.012_40)] leading-[1.8]">
              Tres sedes en Guatemala para que el cuidado de tu piel esté siempre
              cerca de ti.
            </p>
          </div>

          {/* Stats column */}
          <div className="reveal reveal-d2 grid grid-cols-2 gap-px"
               style={{ background: "oklch(0.88 0.01 60)" }}>
            {[
              { n: "3",   label: "Sedes en Guatemala" },
              { n: "10+", label: "Años de experiencia" },
              { n: "∞",   label: "Pacientes atendidas" },
              { n: "24h", label: "Respuesta a solicitudes" },
            ].map((s) => (
              <div key={s.label} className="bg-[oklch(0.97_0.008_60)] p-8 flex flex-col gap-2">
                <span className="text-[2.5rem] font-semibold leading-none"
                      style={{ fontFamily: "var(--font-playfair)", color: "oklch(0.72 0.065 25)" }}>
                  {s.n}
                </span>
                <span className="text-[12px] text-[oklch(0.52_0.012_40)] leading-snug">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sedes ── */}
      <section id="sedes" className="px-8 md:px-14 py-24">
        <p className="reveal text-[10px] tracking-[0.25em] uppercase text-[oklch(0.62_0.065_25)] mb-12 font-medium">
          Nuestras sedes
        </p>
        <div className="grid md:grid-cols-3 gap-px"
             style={{ background: "oklch(0.9 0.008 60)" }}>
          {SEDES.map((s, i) => (
            <div key={s.name}
                 className={`reveal reveal-d${i + 1} bg-[oklch(0.988_0.003_85)] p-8 flex flex-col gap-4 group hover:bg-[oklch(0.97_0.01_40)] transition-colors duration-300`}>
              <span className="text-[10px] tracking-widest text-[oklch(0.65_0.012_40)]">{s.num}</span>
              <h3 className="text-[1.5rem] font-medium leading-tight"
                  style={{ fontFamily: "var(--font-playfair)", color: "oklch(0.72 0.065 25)" }}>
                {s.name}
              </h3>
              <p className="text-[12px] text-[oklch(0.55_0.012_40)]">{s.city}</p>
              <div className="mt-auto pt-6">
                <a href="#cita"
                   className="text-[11px] tracking-wider text-[oklch(0.62_0.065_25)] hover:text-[oklch(0.5_0.07_25)] transition-colors uppercase font-medium">
                  Agendar aquí →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Booking ── */}
      <section id="cita" className="px-8 md:px-14 py-24"
               style={{ background: "oklch(0.72 0.065 25)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">

          {/* Left: CTA */}
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/60 mb-5 font-medium">
              Solicitar cita
            </p>
            <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-medium text-white leading-snug mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}>
              Tu primera cita<br />
              <span className="italic font-normal">nos cuenta todo.</span>
            </h2>
            <p className="text-[14px] text-white/65 leading-[1.8] max-w-[34ch]">
              Cuéntanos qué te preocupa. Te contactamos en menos de
              24 horas para confirmar tu cita en la sede más conveniente.
            </p>
            <div className="mt-10 flex flex-col gap-3">
              {SEDES.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  <span className="text-[12px] text-white/60">{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="reveal reveal-d1">
            {state.status === "success" ? (
              <div className="bg-white/10 rounded-2xl p-10 text-center">
                <p className="text-[2rem] font-medium text-white mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
                  ¡Recibimos tu solicitud!
                </p>
                <p className="text-[14px] text-white/70 leading-relaxed">
                  Te contactaremos en menos de 24 horas para confirmar tu cita.
                </p>
              </div>
            ) : (
              <form action={action} className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Nombre completo *
                    </label>
                    <input name="nombre" required placeholder="Ana García López"
                           className="land-input text-white placeholder:text-white/30 border-white/20 focus:border-white/70" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Teléfono *
                    </label>
                    <input name="telefono" required placeholder="5555 0000" type="tel"
                           className="land-input text-white placeholder:text-white/30 border-white/20 focus:border-white/70" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Correo
                    </label>
                    <input name="email" placeholder="ana@correo.com" type="email"
                           className="land-input text-white placeholder:text-white/30 border-white/20 focus:border-white/70" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Sede preferida
                    </label>
                    <select name="sede"
                            className="land-input text-white border-white/20 focus:border-white/70 bg-transparent appearance-none cursor-pointer">
                      <option value="Sin preferencia" className="text-foreground bg-white">Sin preferencia</option>
                      {SEDES.map((s) => (
                        <option key={s.name} value={s.name} className="text-foreground bg-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      Fecha aproximada
                    </label>
                    <input name="fecha_preferida" type="date"
                           className="land-input text-white border-white/20 focus:border-white/70 bg-transparent [color-scheme:dark]" />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-wider uppercase text-white/60 font-medium">
                      ¿Qué te preocupa?
                    </label>
                    <textarea name="motivo" rows={3} placeholder="Cuéntanos brevemente sobre tu piel…"
                              className="land-input text-white placeholder:text-white/30 border-white/20 focus:border-white/70 resize-none" />
                  </div>
                </div>

                {state.status === "error" && (
                  <p className="text-[13px] text-white bg-white/10 rounded-lg px-4 py-3">
                    {state.message}
                  </p>
                )}

                <button type="submit" disabled={pending}
                        className="btn-fill mt-2 h-12 w-full rounded-full text-[13px] font-medium tracking-wide text-[oklch(0.72_0.065_25)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
                        style={{ background: "white" }}>
                  {pending ? "Enviando…" : "Solicitar cita →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Portal paciente ── */}
      <section id="mis-citas" className="px-8 md:px-14 py-24 border-t border-[oklch(0.91_0.008_60)]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          {/* Copy */}
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[oklch(0.72_0.065_25)] font-medium mb-4">
              Pacientes
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-medium leading-snug mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}>
              Consulta tus citas<br />
              <span className="italic font-normal" style={{ color: "oklch(0.72 0.065 25)" }}>y tus recetas</span>
            </h2>
            <p className="text-[14px] text-[oklch(0.48_0.012_40)] leading-[1.8]">
              Ingresa tu número de DPI y fecha de nacimiento para ver el historial
              de tus consultas, diagnósticos, medicamentos y las solicitudes de cita
              que hayas enviado.
            </p>
          </div>

          {/* Form */}
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
                {portalPending ? "Verificando…" : "Ver mis citas y recetas →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 md:px-14 py-12 border-t border-[oklch(0.9_0.008_60)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase font-medium text-[oklch(0.3_0_0)]">
              Skin Clinic GT
            </p>
            <p className="text-[12px] text-[oklch(0.6_0.012_40)] mt-1">
              Dermatología · Estética Avanzada · Guatemala
            </p>
          </div>
          <span className="text-[11px] text-[oklch(0.7_0.012_60)]">
            © {new Date().getFullYear()} Skin Clinic GT
          </span>
        </div>
      </footer>

    </div>
  );
}
