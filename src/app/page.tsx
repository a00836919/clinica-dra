import { SolicitudForm } from "@/components/landing/solicitud-form";
import { PortalLogin } from "@/components/landing/portal-login";
import { Hero } from "@/components/landing/hero";
import { Equipo } from "@/components/landing/equipo";
import { Tecnologia } from "@/components/landing/tecnologia";
import { CinematicMotion } from "@/components/motion/cinematic-motion";
import { SEDES } from "@/lib/sedes";

export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: "var(--font-geist-sans)",
        background: "oklch(0.988 0.003 85)",
        color: "oklch(0.145 0 0)",
        minHeight: "100vh",
      }}
    >
      <CinematicMotion />

      {/* ── Nav ── */}
      <nav
        data-nav
        className="site-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-10"
      >
        <a
          href="#top"
          className="nav-mark text-[11px] font-semibold uppercase tracking-[0.25em]"
        >
          Skin Clinic GT
        </a>
        <div className="flex items-center gap-5">
          <a href="#equipo" className="nav-link hidden text-[12px] tracking-wide sm:inline">
            El equipo
          </a>
          <a href="#cita" className="nav-link hidden text-[12px] tracking-wide sm:inline">
            Solicitar cita
          </a>
          <a
            href="#mis-citas"
            className="nav-link nav-pill rounded-full border px-4 py-2 text-[11px] font-medium"
          >
            Mis citas
          </a>
        </div>
      </nav>

      <main id="top">
        <Hero />
        <Equipo />
        <Tecnologia />

        {/* ── Solicitar cita ── */}
        <section id="cita" className="px-6 py-24 md:px-10 md:py-32" style={{ background: "oklch(0.72 0.065 25)" }}>
          <div className="mx-auto grid max-w-5xl items-start gap-16 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p
                data-reveal="fade-up"
                className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/60"
              >
                Solicitar cita
              </p>
              <h2
                data-motion-text
                className="mb-5 leading-snug text-white"
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "clamp(1.8rem,4vw,2.6rem)",
                  fontWeight: 500,
                }}
              >
                Tu primera cita nos cuenta todo.
              </h2>
              <p
                data-reveal="fade-up"
                data-reveal-delay="0.05"
                className="max-w-[30ch] text-[13px] leading-[1.8] text-white/65"
              >
                Te contactamos en menos de 24 horas para confirmar tu hora y sede.
              </p>
              <div data-reveal-group className="mt-8 flex flex-col gap-2.5">
                {SEDES.map((sede) => (
                  <div key={sede} data-reveal-item className="flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                    <span className="text-[12px] text-white/55">{sede}</span>
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal="fade-up" data-reveal-delay="0.08">
              <SolicitudForm />
            </div>
          </div>
        </section>

        {/* ── Portal paciente ── */}
        <section
          id="mis-citas"
          className="border-t border-[oklch(0.91_0.008_60)] px-6 py-24 md:px-10 md:py-32"
        >
          <div className="mx-auto grid max-w-5xl items-start gap-16 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p
                data-reveal="fade-up"
                className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-[oklch(0.72_0.065_25)]"
              >
                Portal de pacientes
              </p>
              <h2
                data-motion-text
                className="mb-5 leading-snug"
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "clamp(1.8rem,4vw,2.6rem)",
                  fontWeight: 500,
                }}
              >
                Tus citas y recetas.
              </h2>
              <p
                data-reveal="fade-up"
                data-reveal-delay="0.05"
                className="max-w-[30ch] text-[13px] leading-[1.8] text-[oklch(0.5_0.012_40)]"
              >
                Ingresa con tu DPI y fecha de nacimiento para ver el historial de tus
                consultas, diagnósticos y medicamentos recetados.
              </p>
            </div>

            <div data-reveal="fade-up" data-reveal-delay="0.08">
              <PortalLogin />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[oklch(0.91_0.008_60)] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[oklch(0.55_0.065_25)]">
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
