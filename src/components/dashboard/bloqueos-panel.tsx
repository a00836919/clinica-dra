"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { crearBloqueo, eliminarBloqueo, type Bloqueo } from "@/app/actions";
import { SEDES } from "@/lib/sedes";
import type { Doctora } from "@/components/dashboard/agendar-solicitud-form";

const CAMPO =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none";
const ETIQUETA = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

const TODAS = "__todas__";

export function BloqueosPanel({
  bloqueos,
  doctoras,
}: {
  bloqueos: (Bloqueo & { doctora: string | null })[];
  doctoras: Doctora[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setError(null);

    const sede = fd.get("sede")?.toString() ?? TODAS;
    const doctora = fd.get("doctora")?.toString() ?? TODAS;

    start(async () => {
      const res = await crearBloqueo({
        desde: `${fd.get("desde_fecha")}T${fd.get("desde_hora")}`,
        hasta: `${fd.get("hasta_fecha")}T${fd.get("hasta_hora")}`,
        sede: sede === TODAS ? null : sede,
        doctoraId: doctora === TODAS ? null : doctora,
        motivo: fd.get("motivo")?.toString() ?? "",
      });
      if (res.error) return setError(res.error);
      form.reset();
      router.refresh();
    });
  }

  function borrar(id: string) {
    setError(null);
    start(async () => {
      const res = await eliminarBloqueo(id);
      if (res.error) return setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Nuevo bloqueo</h2>
        <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
          Las horas bloqueadas dejan de ofrecerse en el formulario público. Sin
          doctora o sin sede, el bloqueo aplica a todas.
        </p>

        <form onSubmit={crear} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={ETIQUETA} htmlFor="desde_fecha">Desde</label>
              <input id="desde_fecha" name="desde_fecha" type="date" required className={CAMPO} />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="desde_hora">Hora inicio</label>
              <input id="desde_hora" name="desde_hora" type="time" required defaultValue="00:00" className={CAMPO} />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="hasta_fecha">Hasta</label>
              <input id="hasta_fecha" name="hasta_fecha" type="date" required className={CAMPO} />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="hasta_hora">Hora fin</label>
              <input id="hasta_hora" name="hasta_hora" type="time" required defaultValue="23:59" className={CAMPO} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={ETIQUETA} htmlFor="bl-doctora">Doctora</label>
              <select id="bl-doctora" name="doctora" defaultValue={TODAS} className={CAMPO}>
                <option value={TODAS}>Todas</option>
                {doctoras.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="bl-sede">Sede</label>
              <select id="bl-sede" name="sede" defaultValue={TODAS} className={CAMPO}>
                <option value={TODAS}>Todas</option>
                {SEDES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="bl-motivo">Motivo</label>
              <input id="bl-motivo" name="motivo" placeholder="Viaje, capacitación, feriado…" className={CAMPO} />
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "oklch(0.5 0.14 25)" }}>{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: "oklch(0.72 0.065 25)" }}
            >
              {pending ? "Guardando…" : "Bloquear"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Bloqueos activos
          <span className="ml-2 text-xs font-normal text-muted-foreground">({bloqueos.length})</span>
        </h2>

        {bloqueos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-sm text-muted-foreground/70">No hay horarios bloqueados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bloqueos.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(b.desde), "d MMM yyyy, HH:mm", { locale: es })} →{" "}
                    {format(parseISO(b.hasta), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.doctora ?? "Todas las doctoras"} · {b.sede ?? "Todas las sedes"}
                    {b.motivo ? ` · ${b.motivo}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => borrar(b.id)}
                  disabled={pending}
                  className="flex-shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
