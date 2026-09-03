"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarPacientes, crearCita, type PacienteBusqueda } from "@/app/actions";
import { SEDES } from "@/lib/sedes";
import type { Doctora } from "@/components/dashboard/agendar-solicitud-form";

const CAMPO =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none";
const ETIQUETA = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

/**
 * Agendar por teléfono o en mostrador. Hasta ahora la única vía para que
 * existiera una cita era que el paciente la pidiera por la web.
 */
export function NuevaCitaForm({ doctoras }: { doctoras: Doctora[] }) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<PacienteBusqueda[]>([]);
  const [elegido, setElegido] = useState<PacienteBusqueda | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "aviso"; texto: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  // Búsqueda con freno, para no consultar en cada tecla. El indicador de
  // "buscando" se enciende en el onChange, no aquí: marcar estado dentro del
  // cuerpo de un efecto encadena renders.
  useEffect(() => {
    // Sin setState en la salida temprana: la lista solo se pinta cuando la
    // consulta es válida, así que un resultado viejo nunca llega a verse.
    if (elegido || query.trim().length < 2) return;
    let vigente = true;
    const t = setTimeout(async () => {
      const encontrados = await buscarPacientes(query);
      if (!vigente) return;
      setResultados(encontrados);
      setBuscando(false);
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [query, elegido]);

  function cerrar() {
    setAbierto(false);
    setQuery("");
    setResultados([]);
    setElegido(null);
    setMensaje(null);
  }

  function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!elegido) return setMensaje({ tipo: "error", texto: "Elige al paciente." });

    const fd = new FormData(e.currentTarget);
    setMensaje(null);
    start(async () => {
      const res = await crearCita({
        pacienteId: elegido.id,
        fecha: fd.get("fecha")?.toString() ?? "",
        hora: fd.get("hora")?.toString() ?? "",
        sede: fd.get("sede")?.toString() ?? SEDES[0],
        doctoraId: fd.get("doctora")?.toString() ?? "",
        motivo: fd.get("motivo")?.toString(),
        avisarPorCorreo: fd.get("avisar") === "on",
      });

      if (res.error) return setMensaje({ tipo: "error", texto: res.error });
      if (res.aviso) {
        setMensaje({ tipo: "aviso", texto: res.aviso });
        router.refresh();
        return;
      }
      cerrar();
      router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
        style={{ background: "oklch(0.72 0.065 25)" }}
      >
        + Nueva cita
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Nueva cita</h2>
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
        >
          ×
        </button>
      </div>

      <form onSubmit={crear} className="flex flex-col gap-4">
        {/* Paciente */}
        <div>
          <label className={ETIQUETA} htmlFor="buscar-paciente">
            Paciente
          </label>

          {elegido ? (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{elegido.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  DPI {elegido.numero_identificacion} · {elegido.telefono}
                  {elegido.email ? "" : " · sin correo"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setElegido(null);
                  setQuery("");
                }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                id="buscar-paciente"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setBuscando(e.target.value.trim().length >= 2);
                }}
                placeholder="Nombre, apellido o DPI…"
                autoComplete="off"
                className={CAMPO}
              />
              {query.trim().length >= 2 && (
                <div className="mt-1 overflow-hidden rounded-lg border border-border/60">
                  {buscando ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Buscando…</p>
                  ) : resultados.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Sin coincidencias. Registra al paciente primero desde Pacientes.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {resultados.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setElegido(p)}
                            className="w-full px-3 py-2 text-left transition-colors hover:bg-muted"
                          >
                            <span className="block text-sm text-foreground">{p.nombre}</span>
                            <span className="block text-xs text-muted-foreground">
                              DPI {p.numero_identificacion} · {p.telefono}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Cuándo y con quién */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={ETIQUETA} htmlFor="nc-fecha">
              Fecha
            </label>
            <input id="nc-fecha" name="fecha" type="date" required className={CAMPO} />
          </div>
          <div>
            <label className={ETIQUETA} htmlFor="nc-hora">
              Hora
            </label>
            <input
              id="nc-hora"
              name="hora"
              type="time"
              required
              step={900}
              defaultValue="09:00"
              className={CAMPO}
            />
          </div>
          <div>
            <label className={ETIQUETA} htmlFor="nc-sede">
              Sede
            </label>
            <select id="nc-sede" name="sede" className={CAMPO}>
              {SEDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ETIQUETA} htmlFor="nc-doctora">
              Doctora
            </label>
            <select id="nc-doctora" name="doctora" required className={CAMPO}>
              {doctoras.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={ETIQUETA} htmlFor="nc-motivo">
            Motivo
          </label>
          <input
            id="nc-motivo"
            name="motivo"
            placeholder="Opcional"
            className={CAMPO}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="avisar"
            defaultChecked
            disabled={Boolean(elegido && !elegido.email)}
            className="h-3.5 w-3.5"
          />
          {elegido && !elegido.email
            ? "Este paciente no tiene correo registrado"
            : "Enviarle el correo de cita confirmada"}
        </label>

        {mensaje && (
          <p
            className="text-xs"
            style={{ color: mensaje.tipo === "error" ? "oklch(0.5 0.14 25)" : "oklch(0.48 0.11 65)" }}
          >
            {mensaje.texto}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending || !elegido}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "oklch(0.45 0.13 155)" }}
          >
            {pending ? "Creando…" : "Crear cita"}
          </button>
          <button
            type="button"
            onClick={cerrar}
            disabled={pending}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
