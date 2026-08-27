"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "gsap";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Set initial states
      gsap.set(
        [
          ".gsap-brand",
          ".gsap-w1",
          ".gsap-w2",
          ".gsap-w3",
          ".gsap-tagline",
          ".gsap-sedes",
          ".gsap-divider",
          ".gsap-form-heading",
          ".gsap-form-sub",
          ".gsap-field-1",
          ".gsap-field-2",
          ".gsap-button",
          ".gsap-footnote",
        ],
        { opacity: 0, y: 24 }
      );
      gsap.set(".gsap-divider", { scaleX: 0, transformOrigin: "left center" });

      tl
        // Left panel sequence
        .to(".gsap-brand", { opacity: 1, y: 0, duration: 0.6 })
        .to(".gsap-w1", { opacity: 1, y: 0, duration: 0.75 }, "-=0.3")
        .to(".gsap-w2", { opacity: 1, y: 0, duration: 0.75 }, "-=0.55")
        .to(".gsap-w3", { opacity: 1, y: 0, duration: 0.75 }, "-=0.55")
        .to(".gsap-tagline", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
        .to(".gsap-sedes", { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        // Right panel — starts overlapping
        .to(".gsap-form-heading", { opacity: 1, y: 0, duration: 0.65 }, "-=0.9")
        .to(".gsap-form-sub", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
        .to(".gsap-divider", { scaleX: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3")
        .to(".gsap-field-1", { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .to(".gsap-field-2", { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(".gsap-button", { opacity: 1, y: 0, duration: 0.45 }, "-=0.3")
        .to(".gsap-footnote", { opacity: 1, y: 0, duration: 0.4 }, "-=0.2");
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="min-h-screen flex select-none">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.76 0.06 28) 0%, oklch(0.65 0.08 22) 100%)",
        }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Brand */}
        <div className="gsap-brand">
          <span
            className="text-white/60 text-[10px] tracking-[0.3em] uppercase font-medium"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Skin Clinic GT
          </span>
        </div>

        {/* Hero headline */}
        <div className="flex-1 flex flex-col justify-center -mt-8">
          <p
            className="text-white/50 text-sm mb-6 tracking-[0.15em] uppercase gsap-tagline"
            style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 400 }}
          >
            Bienvenida
          </p>
          <div
            className="leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            <div className="gsap-w1 text-white text-[4.5rem] font-semibold">
              Dra. Majo
            </div>
            <div className="gsap-w2 text-white/90 text-[4.5rem] font-medium italic">
              Polanco
            </div>
          </div>
          <p
            className="gsap-w3 text-white/55 text-[15px] leading-relaxed mt-8 max-w-[30ch]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Sistema de gestión clínica. Agenda, expedientes de pacientes e
            imágenes en un solo lugar.
          </p>
        </div>

        {/* Sedes */}
        <div className="gsap-sedes flex items-center gap-4">
          {["Integra", "Decorísima", "Galerías Tiffany"].map((sede, i) => (
            <span key={sede} className="flex items-center gap-4">
              {i > 0 && (
                <span className="w-px h-3 bg-white/20 inline-block" />
              )}
              <span
                className="text-white/40 text-[11px] tracking-wider"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {sede}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-10 bg-[oklch(0.988_0.003_85)]">
        <div className="w-full max-w-[360px]">

          {/* Mobile brand */}
          <p className="lg:hidden gsap-brand text-[10px] tracking-[0.25em] uppercase text-[oklch(0.52_0.012_40)] mb-10"
            style={{ fontFamily: "var(--font-geist-sans)" }}>
            Skin Clinic GT
          </p>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="gsap-form-heading text-[2rem] font-medium leading-tight tracking-tight text-[oklch(0.145_0_0)]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Iniciar sesión
            </h1>
            <p
              className="gsap-form-sub mt-2 text-[13px] text-[oklch(0.52_0.012_40)] leading-snug"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Solo personal autorizado de la clínica
            </p>
          </div>

          {/* Divider */}
          <div
            className="gsap-divider h-px bg-[oklch(0.72_0.065_25)] mb-8 opacity-0"
            style={{ width: "2.5rem" }}
          />

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="gsap-field-1 flex flex-col gap-1.5">
              <label
                className="text-[11px] font-medium tracking-wider uppercase text-[oklch(0.52_0.012_40)]"
                htmlFor="email"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="doctora@skinclinicgt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="clinic-input h-11 w-full rounded-lg border border-[oklch(0.93_0.008_60)] bg-white px-4 text-[14px] text-[oklch(0.145_0_0)] placeholder:text-[oklch(0.72_0.012_60)]"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              />
            </div>

            {/* Password */}
            <div className="gsap-field-2 flex flex-col gap-1.5">
              <label
                className="text-[11px] font-medium tracking-wider uppercase text-[oklch(0.52_0.012_40)]"
                htmlFor="password"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="clinic-input h-11 w-full rounded-lg border border-[oklch(0.93_0.008_60)] bg-white px-4 text-[14px] text-[oklch(0.145_0_0)] placeholder:text-[oklch(0.72_0.012_60)]"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-[13px] text-[oklch(0.55_0.18_25)] bg-[oklch(0.96_0.04_25)] rounded-lg px-4 py-3"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="gsap-button btn-fill mt-1 h-11 w-full rounded-lg text-[14px] font-medium text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
              style={{
                background: "oklch(0.72 0.065 25)",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          {/* Footnote */}
          <p
            className="gsap-footnote text-[11px] text-[oklch(0.65_0.01_60)] mt-8 text-center"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            © {new Date().getFullYear()} Skin Clinic GT · Majo Polanco
          </p>
        </div>
      </div>
    </div>
  );
}
