"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarConsulta, type CierreState, type Medicamento } from "@/app/actions";

const CAMPO =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none";
const ETIQUETA = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

export type DatosConsulta = {
  id: string;
  diagnostico: string | null;
  tratamiento: string | null;
  notas: string | null;
  notas_ampliadas: string | null;
  proxima_control: string | null;
  cerrada: boolean;
  recetaEnviada: boolean;
};

export type DatosFacturacion = {
  nit: string | null;
  direccion: string | null;
  nombre: string;
  tieneCorreo: boolean;
};

export function CierreConsultaForm({
  consulta,
  facturacion,
  medicamentosIniciales,
}: {
  consulta: DatosConsulta;
  facturacion: DatosFacturacion;
  medicamentosIniciales: Medicamento[];
}) {
  const [meds, setMeds] = useState<Medicamento[]>(medicamentosIniciales);
  const [estado, setEstado] = useState<CierreState>({ status: "idle" });
  const [pending, start] = useTransition();
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const router = useRouter();

  function enviar(form: HTMLFormElement, accion: "guardar" | "cerrar") {
    const formData = new FormData(form);
    formData.set("medicamentos", JSON.stringify(meds.filter((m) => m.nombre.trim())));
    setEstado({ status: "idle" });
    start(async () => {
      const res = await guardarConsulta(consulta.id, accion, formData);
      setEstado(res);
      setConfirmandoCierre(false);
      if (res.status !== "error") router.refresh();
    });
  }

  function actualizarMed(i: number, campo: keyof Medicamento, valor: string) {
    setMeds((prev) => prev.map((m, j) => (j === i ? { ...m, [campo]: valor } : m)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // El submit por Enter guarda; cerrar y enviar el correo siempre es explícito.
        enviar(e.currentTarget, "guardar");
      }}
      className="flex flex-col gap-6"
    >
      {/* ── Datos clínicos ── */}
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Consulta</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className={ETIQUETA} htmlFor="diagnostico">
              Diagnóstico
            </label>
            <textarea
              id="diagnostico"
              name="diagnostico"
              rows={3}
              defaultValue={consulta.diagnostico ?? ""}
              placeholder="Hallazgos y diagnóstico…"
              className={`${CAMPO} resize-y`}
            />
          </div>

          <div>
            <label className={ETIQUETA} htmlFor="tratamiento">
              Tratamiento indicado
            </label>
            <textarea
              id="tratamiento"
              name="tratamiento"
              rows={3}
              defaultValue={consulta.tratamiento ?? ""}
              placeholder="Qué debe hacer el paciente…"
              className={`${CAMPO} resize-y`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={ETIQUETA} htmlFor="notas">
                Notas para el paciente
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={2}
                defaultValue={consulta.notas ?? ""}
                placeholder="Van incluidas en el correo"
                className={`${CAMPO} resize-y`}
              />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="notas_ampliadas">
                Notas internas
              </label>
              <textarea
                id="notas_ampliadas"
                name="notas_ampliadas"
                rows={2}
                defaultValue={consulta.notas_ampliadas ?? ""}
                placeholder="No se envían al paciente"
                className={`${CAMPO} resize-y`}
              />
            </div>
          </div>

          <div className="sm:max-w-[220px]">
            <label className={ETIQUETA} htmlFor="proxima_control">
              Próximo control
            </label>
            <input
              id="proxima_control"
              name="proxima_control"
              type="date"
              defaultValue={consulta.proxima_control ?? ""}
              className={CAMPO}
            />
          </div>
        </div>
      </section>

      {/* ── Receta ── */}
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Receta</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Los medicamentos van en el correo que recibe el paciente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMeds((p) => [...p, { nombre: "", dosis: "", instrucciones: "" }])}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            + Medicamento
          </button>
        </div>

        {meds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 py-6 text-center">
            <p className="text-xs text-muted-foreground/60">
              Sin medicamentos. Si esta consulta no lleva receta, déjalo así.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {meds.map((m, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-background p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground/70">
                    {i + 1}
                  </span>
                  <input
                    value={m.nombre}
                    onChange={(e) => actualizarMed(i, "nombre", e.target.value)}
                    placeholder="Nombre del medicamento *"
                    className={`${CAMPO} font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setMeds((p) => p.filter((_, j) => j !== i))}
                    aria-label={`Quitar medicamento ${i + 1}`}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    ×
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
                  <input
                    value={m.dosis ?? ""}
                    onChange={(e) => actualizarMed(i, "dosis", e.target.value)}
                    placeholder="Dosis"
                    className={CAMPO}
                  />
                  <input
                    value={m.instrucciones ?? ""}
                    onChange={(e) => actualizarMed(i, "instrucciones", e.target.value)}
                    placeholder="Instrucciones"
                    className={CAMPO}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Facturación ── */}
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Facturación</h2>
        <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
          Se guarda en el expediente del paciente y queda listo para la factura
          electrónica. Si no dan NIT, se factura como consumidor final (CF).
        </p>

        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div>
            <label className={ETIQUETA} htmlFor="nit">
              NIT
            </label>
            <input
              id="nit"
              name="nit"
              defaultValue={facturacion.nit ?? ""}
              placeholder="CF"
              className={CAMPO}
            />
          </div>
          <div>
            <label className={ETIQUETA} htmlFor="direccion_facturacion">
              Dirección
            </label>
            <input
              id="direccion_facturacion"
              name="direccion_facturacion"
              defaultValue={facturacion.direccion ?? ""}
              placeholder="Ciudad"
              className={CAMPO}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Nombre para la factura: <strong className="text-foreground">{facturacion.nombre}</strong>
        </p>
      </section>

      {/* ── Acciones ── */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border/60 bg-background/95 px-1 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar borrador"}
        </button>

        {confirmandoCierre ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {facturacion.tieneCorreo
                ? "Se marca como atendida y se envía el resumen por correo."
                : "El paciente no tiene correo: se marca como atendida sin enviar nada."}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={(e) => enviar(e.currentTarget.form!, "cerrar")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: "oklch(0.45 0.13 155)" }}
            >
              {pending ? "Cerrando…" : "Sí, cerrar y enviar"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmandoCierre(false)}
              className="rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmandoCierre(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: "oklch(0.45 0.13 155)" }}
          >
            {consulta.cerrada ? "Reenviar resumen al paciente" : "Cerrar consulta y enviar resumen"}
          </button>
        )}

        <Resultado estado={estado} />
      </div>
    </form>
  );
}

function Resultado({ estado }: { estado: CierreState }) {
  if (estado.status === "idle") return null;

  if (estado.status === "error") {
    return (
      <p className="text-xs" style={{ color: "oklch(0.5 0.14 25)" }}>
        {estado.message}
      </p>
    );
  }

  if (estado.status === "guardado") {
    return <p className="text-xs text-muted-foreground">Borrador guardado.</p>;
  }

  return (
    <p className="text-xs" style={{ color: estado.correoEnviado ? "oklch(0.38 0.1 145)" : "oklch(0.48 0.11 65)" }}>
      {estado.correoEnviado
        ? "Consulta cerrada y resumen enviado al paciente."
        : "Consulta cerrada, pero el correo no salió. Avísale por otro medio."}
    </p>
  );
}
