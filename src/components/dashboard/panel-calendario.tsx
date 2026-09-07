"use client";

import { useState, useTransition } from "react";
import { regenerarSuscripcionCalendario, type SuscripcionCalendario } from "@/app/actions";

/**
 * Enlace de suscripción, con instrucciones y botón para revocarlo.
 *
 * El enlace es la única credencial del feed: quien lo tenga ve la agenda. Por
 * eso se dice sin rodeos y por eso existe el botón de regenerar.
 */
export function PanelCalendario({ inicial }: { inicial: SuscripcionCalendario }) {
  const [suscripcion, setSuscripcion] = useState(inicial);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [pending, start] = useTransition();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(suscripcion.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  }

  function regenerar() {
    setError(null);
    start(async () => {
      const res = await regenerarSuscripcionCalendario();
      setConfirmando(false);
      if ("error" in res) return setError(res.error);
      setSuscripcion(res);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">
          Tu enlace de suscripción — {suscripcion.doctora}
        </h2>
        <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
          Es privado: cualquiera con este enlace puede ver tu agenda. No lo compartas ni lo
          publiques; si se te sale de las manos, regeneralo abajo.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={suscripcion.url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Enlace de suscripción al calendario"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 font-mono text-xs text-foreground"
          />
          <div className="flex flex-shrink-0 gap-2">
            <button
              type="button"
              onClick={copiar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ background: "oklch(0.72 0.065 25)" }}
            >
              {copiado ? "Copiado ✓" : "Copiar"}
            </button>
            <a
              href={suscripcion.webcal}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Abrir en Calendario
            </a>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs" style={{ color: "oklch(0.5 0.14 25)" }}>
            {error}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Cómo conectarlo</h2>

        <div className="flex flex-col gap-4">
          <Paso
            titulo="Google Calendar (computadora)"
            pasos={[
              "Entra a calendar.google.com desde la computadora; en la app del teléfono no se puede agregar.",
              "En la columna izquierda, junto a «Otros calendarios», haz clic en + y elige «Desde URL».",
              "Pega el enlace de arriba y presiona «Agregar calendario».",
            ]}
            nota="Google revisa el enlace cada varias horas: una cita nueva puede tardar en aparecerte."
          />
          <Paso
            titulo="iPhone o iPad"
            pasos={[
              "Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito.",
              "Pega el enlace y guarda.",
            ]}
            nota="También funciona con el botón «Abrir en Calendario» desde el mismo teléfono."
          />
          <Paso
            titulo="Outlook"
            pasos={[
              "Calendario → Agregar calendario → Suscribirse desde la web.",
              "Pega el enlace, ponle nombre e importa.",
            ]}
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          La suscripción es de solo lectura: mover una cita desde tu calendario personal no cambia
          nada aquí. Las citas se editan en la agenda del dashboard.
        </p>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Regenerar el enlace</h2>
        <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
          Crea un enlace nuevo y deja muerto el anterior. Tendrás que volver a suscribirte en cada
          calendario donde lo hayas agregado.
        </p>

        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              El enlace actual dejará de funcionar de inmediato.
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={regenerar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: "oklch(0.5 0.14 25)" }}
            >
              {pending ? "Regenerando…" : "Sí, regenerar"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmando(false)}
              className="rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Regenerar enlace
          </button>
        )}
      </section>
    </div>
  );
}

function Paso({
  titulo,
  pasos,
  nota,
}: {
  titulo: string;
  pasos: string[];
  nota?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-4">
        {pasos.map((paso) => (
          <li key={paso} className="text-sm leading-relaxed text-foreground">
            {paso}
          </li>
        ))}
      </ol>
      {nota && <p className="mt-1.5 text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}
