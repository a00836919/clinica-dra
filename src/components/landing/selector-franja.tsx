"use client";

import { useEffect, useState } from "react";
import { franjasDisponibles } from "@/app/actions";
import { HORARIO, esDiaAbierto } from "@/lib/disponibilidad";

/**
 * Mini calendario con las horas libres.
 *
 * Se muestran también las franjas ocupadas, en gris y deshabilitadas: ver que
 * las 10:00 existe pero está tomada da más confianza que una lista donde esa
 * hora simplemente no aparece.
 */
export function SelectorFranja({
  sede,
  onCambio,
}: {
  sede: string;
  onCambio: (valor: { fecha: string; hora: string } | null) => void;
}) {
  // Se calcula una sola vez al montar. Perezoso y no en un efecto: los días no
  // dependen de nada reactivo, y marcar estado dentro de un efecto encadena
  // renders. El cálculo usa la fecha del navegador, así que va aquí y no en el
  // servidor, para no arriesgar un desajuste de hidratación.
  const [dias] = useState<Date[]>(() => {
    if (typeof window === "undefined") return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lista: Date[] = [];
    for (let i = 0; i < HORARIO.diasMaximosAdelante && lista.length < 42; i++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() + i);
      if (esDiaAbierto(d)) lista.push(d);
    }
    return lista;
  });
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [franjas, setFranjas] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [cargando, setCargando] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!fecha) return;
    let vigente = true;
    (async () => {
      const res = await franjasDisponibles(fecha, sede);
      if (!vigente) return;
      setFranjas(res);
      setCargando(false);
    })();
    return () => {
      vigente = false;
    };
  }, [fecha, sede]);

  function elegirDia(d: Date) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFecha(iso);
    setHora(null);
    setFranjas([]);
    setCargando(true);
    onCambio(null);
  }

  function elegirHora(h: string) {
    setHora(h);
    if (fecha) onCambio({ fecha, hora: h });
  }

  const visibles = dias.slice(offset, offset + 7);
  const libres = franjas.filter((f) => f.disponible).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Días */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-wider text-white/60">
            Elige el día
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 7))}
              disabled={offset === 0}
              aria-label="Días anteriores"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[11px] text-white/70 transition-colors hover:border-white/60 disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(Math.max(0, dias.length - 7), o + 7))}
              disabled={offset + 7 >= dias.length}
              aria-label="Días siguientes"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[11px] text-white/70 transition-colors hover:border-white/60 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {visibles.map((d) => {
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const activo = fecha === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => elegirDia(d)}
                aria-pressed={activo}
                className={`flex flex-col items-center rounded-lg border py-2 transition-colors ${
                  activo
                    ? "border-white bg-white text-[oklch(0.6_0.09_25)]"
                    : "border-white/25 text-white/80 hover:border-white/60"
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider opacity-70">
                  {d.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")}
                </span>
                <span className="text-[15px] font-semibold leading-tight">{d.getDate()}</span>
                <span className="text-[9px] opacity-60">
                  {d.toLocaleDateString("es-GT", { month: "short" }).replace(".", "")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Horas */}
      {fecha && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Elige la hora
            </label>
            {!cargando && (
              <span className="text-[10px] text-white/50">
                {libres === 0 ? "Sin horas libres ese día" : `${libres} disponibles`}
              </span>
            )}
          </div>

          {cargando ? (
            <p className="text-[12px] text-white/50">Consultando disponibilidad…</p>
          ) : franjas.length === 0 ? (
            <p className="text-[12px] text-white/60">
              Ese día no hay atención. Elige otro.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {franjas.map((f) => (
                <button
                  key={f.hora}
                  type="button"
                  disabled={!f.disponible}
                  onClick={() => elegirHora(f.hora)}
                  aria-pressed={hora === f.hora}
                  title={f.disponible ? undefined : "Esta hora ya está ocupada"}
                  className={`rounded-lg border py-1.5 text-[12px] tabular-nums transition-colors ${
                    hora === f.hora
                      ? "border-white bg-white font-semibold text-[oklch(0.6_0.09_25)]"
                      : f.disponible
                        ? "border-white/25 text-white/85 hover:border-white/60"
                        : "cursor-not-allowed border-white/10 text-white/25 line-through"
                  }`}
                >
                  {f.hora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campos que viajan en el formulario */}
      <input type="hidden" name="fecha_preferida" value={fecha ?? ""} />
      <input type="hidden" name="hora_preferida" value={hora ?? ""} />
    </div>
  );
}
