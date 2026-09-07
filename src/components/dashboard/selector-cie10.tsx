"use client";

import { useMemo, useState } from "react";
import { buscarCie10, descripcionCie10 } from "@/lib/cie10";

const CAMPO =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none";
const ETIQUETA =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

/**
 * Buscador del código CIE-10 del diagnóstico.
 *
 * Se busca por texto o por código y se puede escribir un código a mano: el
 * catálogo local cubre lo dermatológico, pero no todo lo que puede aparecer en
 * una consulta. Lo que viaja en el formulario son dos campos ocultos —código y
 * descripción— para que la receta no dependa de que el catálogo siga teniendo
 * ese código el día de mañana.
 */
export function SelectorCie10({
  codigoInicial,
  descripcionInicial,
}: {
  codigoInicial: string | null;
  descripcionInicial: string | null;
}) {
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? "");
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);

  const resultados = useMemo(() => buscarCie10(consulta), [consulta]);

  function elegir(nuevoCodigo: string, nuevaDescripcion: string) {
    setCodigo(nuevoCodigo);
    setDescripcion(nuevaDescripcion);
    setConsulta("");
    setAbierto(false);
  }

  function limpiar() {
    setCodigo("");
    setDescripcion("");
    setConsulta("");
  }

  return (
    <div>
      <label className={ETIQUETA} htmlFor="cie10-busqueda">
        Código CIE-10
      </label>

      {codigo ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
          <p className="text-sm text-foreground">
            <span className="font-medium tabular-nums">{codigo}</span>
            {descripcion ? <span className="text-muted-foreground"> — {descripcion}</span> : null}
          </p>
          <button
            type="button"
            onClick={limpiar}
            className="flex-shrink-0 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            id="cie10-busqueda"
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            placeholder="Busca por diagnóstico o código: acné, L70, melasma…"
            autoComplete="off"
            className={CAMPO}
          />

          {abierto && consulta.trim().length > 0 && (
            <div className="mt-1 overflow-hidden rounded-lg border border-border/60">
              {resultados.length === 0 ? (
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Sin coincidencias en el catálogo dermatológico.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      elegir(
                        consulta.trim().toUpperCase(),
                        descripcionCie10(consulta.trim()) ?? "",
                      )
                    }
                    className="mt-1 text-xs text-foreground underline underline-offset-2"
                  >
                    Usar «{consulta.trim().toUpperCase()}» como código
                  </button>
                </div>
              ) : (
                <ul className="max-h-56 divide-y divide-border/40 overflow-y-auto">
                  {resultados.map((c) => (
                    <li key={c.codigo}>
                      <button
                        type="button"
                        onClick={() => elegir(c.codigo, c.descripcion)}
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-muted"
                      >
                        <span className="block text-sm text-foreground">
                          <span className="font-medium tabular-nums">{c.codigo}</span> —{" "}
                          {c.descripcion}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {c.categoria}
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

      <p className="mt-1.5 text-xs text-muted-foreground">
        Va en la receta y en el resumen que recibe el paciente. Es lo que pide el seguro.
      </p>

      <input type="hidden" name="diagnostico_cie10" value={codigo} />
      <input type="hidden" name="diagnostico_cie10_desc" value={descripcion} />
    </div>
  );
}
