"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, History } from "lucide-react";
import type { Medicamento } from "@/app/actions";
import { estadoConsulta } from "@/lib/estados";
import { enGuatemala } from "@/lib/hora-guatemala";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ConsultaHistorial = {
  id: string;
  fecha: string;
  estado: string;
  sede: string;
  motivo: string | null;
  doctora: string | null;
  /** Viene del sistema anterior: solo trae fecha, estado y motivo. */
  importada: boolean;
  diagnostico: string | null;
  /** "L70.0 — Acné vulgar" */
  cie10: string | null;
  tratamiento: string | null;
  notas: string | null;
  proximoControl: string | null;
  medicamentos: Medicamento[];
};

/**
 * Consultas y recetas anteriores del paciente, sin salir de la consulta.
 *
 * Va en una ventana y no en la página porque la doctora lo consulta de
 * pasada, a mitad de atender: abrir, ver qué se le recetó la vez pasada,
 * cerrar. El expediente completo sigue en "Ver expediente".
 */
export function HistorialPaciente({
  nombre,
  consultas,
}: {
  nombre: string;
  consultas: ConsultaHistorial[];
}) {
  const conReceta = consultas.filter((c) => c.medicamentos.length > 0).length;

  // Lo que ya se le ha recetado, sin repetir, del más reciente al más viejo.
  const yaRecetados = [
    ...new Set(consultas.flatMap((c) => c.medicamentos.map((m) => m.nombre.trim()))),
  ];

  const importadas = consultas.some((c) => c.importada);

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
        <History className="h-3.5 w-3.5" />
        Historial
        <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
          {consultas.length}
        </span>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 px-6 pb-4 pt-5">
          <DialogTitle className="text-base font-semibold">Historial de {nombre}</DialogTitle>
          <DialogDescription className="text-xs">
            {consultas.length
              ? `${consultas.length} consulta${consultas.length !== 1 ? "s" : ""} anterior${consultas.length !== 1 ? "es" : ""} · ${conReceta} con receta`
              : "No hay consultas anteriores de este paciente."}
            {importadas && " · Las del sistema anterior se ligan por teléfono."}
          </DialogDescription>

          {yaRecetados.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Se le ha recetado
              </p>
              <div className="flex flex-wrap gap-1.5">
                {yaRecetados.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>

        {consultas.length > 0 ? (
          <ol className="flex-1 overflow-y-auto px-6 py-5">
            {consultas.map((c, i) => (
              <Entrada key={c.id} consulta={c} ultima={i === consultas.length - 1} />
            ))}
          </ol>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Es su primera consulta registrada.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Entrada({ consulta: c, ultima }: { consulta: ConsultaHistorial; ultima: boolean }) {
  const est = estadoConsulta(c.estado);
  const { fecha } = enGuatemala(c.fecha);

  return (
    <li className="relative flex gap-4 pb-6">
      {/* Línea de tiempo */}
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "oklch(0.72 0.065 25)" }} />
        {!ultima && <span className="mt-1.5 w-px flex-1 bg-border" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-foreground">
            {format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es })}
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ color: est.color, background: est.bg }}
          >
            {est.label}
          </span>
          {c.importada && (
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              Sistema anterior
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {[c.doctora, c.sede].filter(Boolean).join(" · ")}
          {c.motivo ? ` · ${c.motivo}` : ""}
        </p>

        {(c.diagnostico || c.cie10) && (
          <Bloque titulo="Diagnóstico">
            {c.diagnostico && <p>{c.diagnostico}</p>}
            {c.cie10 && <p className="mt-0.5 text-xs text-muted-foreground">{c.cie10}</p>}
          </Bloque>
        )}

        {c.medicamentos.length > 0 && (
          <Bloque titulo="Receta">
            <ul className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              {c.medicamentos.map((m, i) => (
                <li key={`${m.nombre}-${i}`}>
                  <p className="font-medium">{m.nombre}</p>
                  {(m.dosis || m.instrucciones) && (
                    <p className="text-xs text-muted-foreground">
                      {[m.dosis, m.instrucciones].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Bloque>
        )}

        {c.tratamiento && (
          <Bloque titulo="Indicaciones">
            <p className="whitespace-pre-line">{c.tratamiento}</p>
          </Bloque>
        )}
        {c.notas && (
          <Bloque titulo="Notas">
            <p className="whitespace-pre-line">{c.notas}</p>
          </Bloque>
        )}
        {c.proximoControl && (
          <Bloque titulo="Próximo control">
            <p>{c.proximoControl}</p>
          </Bloque>
        )}

        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          <Link
            href={`/dashboard/consultas/${c.id}`}
            className="font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Abrir consulta
          </Link>
          {c.medicamentos.length > 0 && (
            <a
              href={`/dashboard/consultas/${c.id}/receta`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              <FileText className="h-3 w-3" />
              Receta en PDF
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 text-sm text-foreground">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {titulo}
      </p>
      {children}
    </div>
  );
}
