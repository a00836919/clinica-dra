"use client";

import { useEffect, useId, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { reprogramarConsulta } from "@/app/actions";
import { ATENCION, HORARIO } from "@/lib/disponibilidad";
import { estadoConsulta, ESTADOS_CERRADOS } from "@/lib/estados";
import { diaSemana, enGuatemala, instanteGuatemala } from "@/lib/hora-guatemala";
import { Link000 } from "@/components/ui/skiper-ui/skiper40";

export type CitaAgenda = {
  id: string;
  /** ISO del inicio. */
  fecha: string;
  motivo: string | null;
  estado: string;
  sede: string;
  doctoraId: string | null;
  nombre: string;
  tieneCorreo: boolean;
};

export type BloqueoAgenda = {
  id: string;
  desde: string;
  hasta: string;
  sede: string | null;
  doctoraId: string | null;
  motivo: string | null;
};

/** Alto en píxeles de una franja de 30 minutos en la vista semanal. */
const ALTO_FRANJA = 44;
const FRANJA = HORARIO.minutosPorFranja;
const ROSA = "oklch(0.72 0.065 25)";
const AMBAR = "oklch(0.48 0.11 65)";

/** Una cita cancelada, sin asistencia o atendida ya no se mueve. */
const esMovible = (c: CitaAgenda) => !ESTADOS_CERRADOS.includes(c.estado);
/** Las canceladas no ocupan la hora de nadie. */
const ocupa = (c: CitaAgenda) => c.estado !== "cancelada" && c.estado !== "no_asistio";

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHora(minutos: number) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/** "jue 2 de oct, 10:30" */
function etiqueta(fecha: string, hora: string) {
  return `${format(parseISO(fecha), "EEE d 'de' MMM", { locale: es })}, ${hora}`;
}

/** Solo la primera letra: con `capitalize` de CSS salía "Jue 2 De Oct". */
function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function bloquesDe(fecha: string) {
  const dia = diaSemana(fecha);
  return ATENCION.filter((b) => b.dia === dia);
}

/** La sede que atiende a esa hora; si el día tiene una sola, esa aunque la hora quede fuera. */
function sedeDeLaHora(fecha: string, minutos: number) {
  const bloques = bloquesDe(fecha);
  const dentro = bloques.find((b) => minutos >= aMinutos(b.desde) && minutos < aMinutos(b.hasta));
  if (dentro) return dentro.sede;
  const sedes = new Set(bloques.map((b) => b.sede));
  return sedes.size === 1 ? bloques[0].sede : null;
}

function abierto(fecha: string, minutos: number) {
  return bloquesDe(fecha).some(
    (b) => minutos >= aMinutos(b.desde) && minutos + FRANJA <= aMinutos(b.hasta),
  );
}

/**
 * Los destinos se codifican en el id del droppable: "franja|2026-10-02|10:30"
 * en la semana y "dia|2026-10-02" en el mes, donde la cita conserva su hora.
 */
function leerDestino(id: string, cita: CitaAgenda) {
  const [tipo, fecha, hora] = id.split("|");
  if (tipo === "franja") return { fecha, hora };
  if (tipo === "dia") return { fecha, hora: enGuatemala(cita.fecha).hora };
  return null;
}

function describirDestino(id: string | number) {
  const [tipo, fecha, hora] = String(id).split("|");
  if (tipo === "franja") return etiqueta(fecha, hora);
  if (tipo === "dia") return format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es });
  return "la agenda";
}

/** Con puntero manda lo que está bajo el cursor; con teclado, lo más cercano. */
const colision: CollisionDetection = (args) => {
  const bajoElPuntero = pointerWithin(args);
  return bajoElPuntero.length > 0 ? bajoElPuntero : closestCenter(args);
};

type Propuesta = { cita: CitaAgenda; fecha: string; hora: string };
type Mensaje = { tipo: "ok" | "aviso" | "error"; texto: string };

/**
 * Agenda en la que las citas se arrastran a otro día u hora.
 *
 * Soltar no mueve nada todavía: abre una confirmación con lo que se va a
 * cambiar y lo que choca. Un arrastre accidental en la tablet no debe mandarle
 * un correo al paciente con una hora equivocada.
 */
export function AgendaArrastrable({
  vista,
  dias,
  hoy,
  mes,
  citas,
  bloqueos,
}: {
  vista: "semana" | "mes";
  /** "yyyy-MM-dd" de cada día visible. */
  dias: string[];
  hoy: string;
  /** "yyyy-MM" del mes que se está viendo. */
  mes: string;
  citas: CitaAgenda[];
  bloqueos: BloqueoAgenda[];
}) {
  const [visibles, moverOptimista] = useOptimistic(
    citas,
    (actuales, m: { id: string; fecha: string; sede: string }) =>
      actuales.map((c) => (c.id === m.id ? { ...c, fecha: m.fecha, sede: m.sede } : c)),
  );
  const [activa, setActiva] = useState<CitaAgenda | null>(null);
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [pending, start] = useTransition();

  const sensores = useSensors(
    // La distancia deja que un clic sobre el nombre siga abriendo la consulta.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En la tablet hay que mantener el dedo: si no, desplazar la agenda arrastraría citas.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    // Solo espacio empieza el arrastre: Enter sobre el nombre tiene que seguir abriendo la consulta.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );
  const idContexto = useId();

  useEffect(() => {
    if (mensaje?.tipo !== "ok") return;
    const t = setTimeout(() => setMensaje(null), 5000);
    return () => clearTimeout(t);
  }, [mensaje]);

  const porId = useMemo(() => new Map(visibles.map((c) => [c.id, c])), [visibles]);

  function alEmpezar(e: DragStartEvent) {
    setActiva(porId.get(String(e.active.id)) ?? null);
    setMensaje(null);
  }

  function alSoltar(e: DragEndEvent) {
    setActiva(null);
    const cita = porId.get(String(e.active.id));
    if (!cita || !e.over) return;
    const destino = leerDestino(String(e.over.id), cita);
    if (!destino) return;
    const origen = enGuatemala(cita.fecha);
    if (origen.fecha === destino.fecha && origen.hora === destino.hora) return;
    setPropuesta({ cita, ...destino });
  }

  function confirmar({ avisar, sede }: { avisar: boolean; sede?: string }) {
    if (!propuesta) return;
    const { cita, fecha, hora } = propuesta;
    setPropuesta(null);
    start(async () => {
      moverOptimista({
        id: cita.id,
        fecha: instanteGuatemala(fecha, hora).toISOString(),
        sede: sede ?? cita.sede,
      });
      const res = await reprogramarConsulta(cita.id, {
        fecha,
        hora,
        sede,
        avisarPorCorreo: avisar,
      });
      if (res.error) return setMensaje({ tipo: "error", texto: res.error });
      setMensaje(
        res.aviso
          ? { tipo: "aviso", texto: res.aviso }
          : { tipo: "ok", texto: `Cita de ${cita.nombre} movida al ${etiqueta(fecha, hora)}.` },
      );
    });
  }

  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Tomaste la cita de ${porId.get(String(active.id))?.nombre ?? "paciente"}.`,
    onDragOver: ({ over }) => (over ? `Sobre ${describirDestino(over.id)}.` : "Fuera de la agenda."),
    onDragEnd: ({ over }) =>
      over ? `Soltaste la cita en ${describirDestino(over.id)}. Confirma el cambio.` : "Soltaste la cita fuera de la agenda.",
    onDragCancel: () => "Se canceló el movimiento.",
  };

  return (
    <DndContext
      id={idContexto}
      sensors={sensores}
      collisionDetection={colision}
      onDragStart={alEmpezar}
      onDragEnd={alSoltar}
      onDragCancel={() => setActiva(null)}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable:
            "Para mover la cita presiona espacio, muévela con las flechas y vuelve a presionar espacio para soltarla. Escape cancela.",
        },
      }}
    >
      <div className="mb-3 flex min-h-5 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Arrastra una cita a otro {vista === "semana" ? "día u hora" : "día (conserva la hora)"} para moverla.
        </p>
        {pending ? (
          <p className="text-xs text-muted-foreground">Moviendo…</p>
        ) : (
          mensaje && (
            <p
              role={mensaje.tipo === "error" ? "alert" : "status"}
              className="text-xs"
              style={{
                color:
                  mensaje.tipo === "error"
                    ? "oklch(0.5 0.14 25)"
                    : mensaje.tipo === "aviso"
                      ? AMBAR
                      : "oklch(0.38 0.1 155)",
              }}
            >
              {mensaje.texto}
            </p>
          )
        )}
      </div>

      {vista === "semana" ? (
        <VistaSemana dias={dias} hoy={hoy} citas={visibles} bloqueos={bloqueos} propuesta={propuesta} />
      ) : (
        <VistaMes dias={dias} hoy={hoy} mes={mes} citas={visibles} />
      )}

      <DragOverlay dropAnimation={null}>
        {activa && <FichaFlotante cita={activa} />}
      </DragOverlay>

      {propuesta && (
        <Confirmacion
          key={`${propuesta.cita.id}-${propuesta.fecha}-${propuesta.hora}`}
          propuesta={propuesta}
          citas={visibles}
          bloqueos={bloqueos}
          onCancelar={() => setPropuesta(null)}
          onConfirmar={confirmar}
        />
      )}
    </DndContext>
  );
}

// ── Semana: grilla de horas, una columna por día ─────────────────────────────

function VistaSemana({
  dias,
  hoy,
  citas,
  bloqueos,
  propuesta,
}: {
  dias: string[];
  hoy: string;
  citas: CitaAgenda[];
  bloqueos: BloqueoAgenda[];
  propuesta: Propuesta | null;
}) {
  const conHora = citas.map((c) => ({ cita: c, ...enGuatemala(c.fecha) }));

  // El horario de atención marca el rango; se estira si hay citas fuera de él,
  // que las importadas a veces traen, para que ninguna quede sin verse.
  let inicio = Math.min(...ATENCION.map((b) => aMinutos(b.desde)));
  let fin = Math.max(...ATENCION.map((b) => aMinutos(b.hasta)));
  for (const c of conHora) {
    if (!dias.includes(c.fecha)) continue;
    inicio = Math.min(inicio, Math.floor(c.minutos / 60) * 60);
    fin = Math.max(fin, Math.ceil((c.minutos + FRANJA) / 60) * 60);
  }
  const franjas: number[] = [];
  for (let m = inicio; m < fin; m += FRANJA) franjas.push(m);
  const alto = franjas.length * ALTO_FRANJA;
  const y = (minutos: number) => ((minutos - inicio) / FRANJA) * ALTO_FRANJA;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <div className="grid min-w-[860px] grid-cols-[52px_repeat(7,minmax(0,1fr))]">
        {/* Encabezados */}
        <div className="sticky left-0 z-20 border-b border-border/60 bg-card" />
        {dias.map((dia) => {
          const esHoy = dia === hoy;
          const sedes = [...new Set(bloquesDe(dia).map((b) => b.sede))];
          return (
            <div key={dia} className="border-b border-l border-border/60 px-2 py-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {format(parseISO(dia), "EEE", { locale: es })}
              </p>
              <p
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                  esHoy ? "text-white" : "text-foreground"
                }`}
                style={esHoy ? { background: ROSA } : undefined}
              >
                {format(parseISO(dia), "d")}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                {sedes.length ? sedes.join(" · ") : "Cerrado"}
              </p>
            </div>
          );
        })}

        {/* Horas */}
        <div className="relative sticky left-0 z-20 bg-card" style={{ height: alto }}>
          {franjas.map((m) =>
            m % 60 === 0 ? (
              <p
                key={m}
                className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                style={{ top: y(m) }}
              >
                {m === inicio ? "" : aHora(m)}
              </p>
            ) : null,
          )}
        </div>

        {/* Días */}
        {dias.map((dia) => {
          const delDia = conHora.filter((c) => c.fecha === dia);
          const carril = carriles(delDia);
          const bloqueosDelDia = recortarBloqueos(bloqueos, dia, inicio, fin);
          const fantasma =
            propuesta && propuesta.fecha === dia ? aMinutos(propuesta.hora) : null;

          return (
            <div key={dia} className="relative border-l border-border/60" style={{ height: alto }}>
              {franjas.map((m) => (
                <Franja key={m} dia={dia} minutos={m} abierta={abierto(dia, m)} />
              ))}

              {bloqueosDelDia.map((b) => (
                <div
                  key={b.id}
                  className="pointer-events-none absolute inset-x-0 z-[1] overflow-hidden px-1.5 py-1"
                  style={{
                    top: y(b.desde),
                    height: y(b.hasta) - y(b.desde),
                    background:
                      "repeating-linear-gradient(135deg, oklch(0.5 0.14 25 / 0.07) 0 6px, transparent 6px 12px)",
                  }}
                >
                  <p className="truncate text-[9px] font-medium" style={{ color: "oklch(0.5 0.14 25)" }}>
                    Bloqueado{b.motivo ? ` · ${b.motivo}` : ""}
                  </p>
                </div>
              ))}

              {fantasma !== null && (
                <div
                  className="pointer-events-none absolute inset-x-1 z-[3] rounded-md border-2 border-dashed"
                  style={{ top: y(fantasma) + 1, height: ALTO_FRANJA - 2, borderColor: ROSA }}
                />
              )}

              {delDia.map(({ cita, minutos }) => {
                const { indice, total } = carril.get(cita.id) ?? { indice: 0, total: 1 };
                return (
                  <FichaCita
                    key={cita.id}
                    cita={cita}
                    compacta={total > 1}
                    atenuada={propuesta?.cita.id === cita.id}
                    style={{
                      top: y(minutos) + 1,
                      height: ALTO_FRANJA - 2,
                      left: `calc(${(indice / total) * 100}% + 2px)`,
                      width: `calc(${100 / total}% - 4px)`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Franja({ dia, minutos, abierta }: { dia: string; minutos: number; abierta: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `franja|${dia}|${aHora(minutos)}` });
  return (
    <div
      ref={setNodeRef}
      className={`border-t transition-colors ${
        minutos % 60 === 0 ? "border-border/60" : "border-dashed border-border/40"
      } ${abierta ? "" : "bg-muted/40"}`}
      style={{
        height: ALTO_FRANJA,
        ...(isOver ? { background: "oklch(0.72 0.065 25 / 0.14)" } : {}),
      }}
    />
  );
}

/**
 * Citas que se traslapan se reparten el ancho, como en cualquier calendario.
 * Sin duración guardada, cada cita ocupa una franja estándar.
 */
function carriles(citas: { cita: CitaAgenda; minutos: number }[]) {
  const resultado = new Map<string, { indice: number; total: number }>();
  const orden = [...citas].sort((a, b) => a.minutos - b.minutos);
  let grupo: { id: string; indice: number }[] = [];
  let finesPorCarril: number[] = [];
  let finGrupo = -Infinity;

  const cerrar = () => {
    for (const g of grupo) resultado.set(g.id, { indice: g.indice, total: finesPorCarril.length });
    grupo = [];
    finesPorCarril = [];
  };

  for (const { cita, minutos } of orden) {
    if (minutos >= finGrupo) cerrar();
    let indice = finesPorCarril.findIndex((f) => f <= minutos);
    if (indice === -1) indice = finesPorCarril.length;
    finesPorCarril[indice] = minutos + FRANJA;
    grupo.push({ id: cita.id, indice });
    finGrupo = Math.max(finGrupo, minutos + FRANJA);
  }
  cerrar();
  return resultado;
}

/** Parte de cada bloqueo que cae en ese día, en minutos, dentro del rango visible. */
function recortarBloqueos(bloqueos: BloqueoAgenda[], dia: string, inicio: number, fin: number) {
  const desdeDia = instanteGuatemala(dia, "00:00").getTime();
  return bloqueos.flatMap((b) => {
    const desde = Math.max((new Date(b.desde).getTime() - desdeDia) / 60_000, inicio);
    const hasta = Math.min((new Date(b.hasta).getTime() - desdeDia) / 60_000, fin);
    return hasta > desde ? [{ ...b, desde, hasta }] : [];
  });
}

function FichaCita({
  cita,
  style,
  compacta,
  atenuada,
}: {
  cita: CitaAgenda;
  style: React.CSSProperties;
  /** Comparte la franja con otras: el nombre va primero porque la hora ya la da la fila. */
  compacta: boolean;
  atenuada: boolean;
}) {
  const movible = esMovible(cita);
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: cita.id,
    disabled: !movible,
  });
  const est = estadoConsulta(cita.estado);
  const { hora } = enGuatemala(cita.fecha);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${hora} · ${cita.nombre} · ${est.label}`}
      title={`${hora} · ${cita.nombre}${cita.motivo ? ` · ${cita.motivo}` : ""} · ${est.label}`}
      className={`absolute z-[2] flex touch-manipulation select-none flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-1.5 text-left shadow-[0_1px_2px_oklch(0_0_0/0.06)] [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-1 ${
        movible ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
      style={{
        ...style,
        background: est.bg,
        borderLeftColor: est.dot,
        opacity: isDragging || atenuada ? 0.35 : movible ? 1 : 0.6,
        outlineColor: ROSA,
      }}
    >
      <div className={`flex min-w-0 gap-x-1 ${compacta ? "flex-col-reverse" : "items-center"}`}>
        <span
          className="flex-shrink-0 text-[10px] font-semibold leading-tight tabular-nums"
          style={{ color: est.color }}
        >
          {hora}
        </span>
        <Link000
          href={`/dashboard/consultas/${cita.id}`}
          className="min-w-0 text-[11px] font-medium leading-tight text-foreground"
        >
          <span className="truncate">{compacta ? cita.nombre.split(" ")[0] : cita.nombre}</span>
        </Link000>
      </div>
      {cita.motivo && !compacta && (
        <p className="truncate text-[10px] leading-tight text-muted-foreground">{cita.motivo}</p>
      )}
    </div>
  );
}

/** Lo que sigue al cursor mientras se arrastra. */
function FichaFlotante({ cita }: { cita: CitaAgenda }) {
  const est = estadoConsulta(cita.estado);
  // El overlay toma el ancho de la ficha original, que puede ser un carril angosto.
  return (
    <div
      className="flex w-max min-w-full max-w-[220px] cursor-grabbing flex-col justify-center rounded-md border-l-[3px] px-1.5 py-1 shadow-lg"
      style={{ background: est.bg, borderLeftColor: est.dot, minHeight: ALTO_FRANJA - 2 }}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="text-[10px] font-semibold tabular-nums" style={{ color: est.color }}>
          {enGuatemala(cita.fecha).hora}
        </span>
        <span className="truncate text-[11px] font-medium text-foreground">{cita.nombre}</span>
      </div>
    </div>
  );
}

// ── Mes: cada día es un destino; la cita conserva su hora ────────────────────

function VistaMes({
  dias,
  hoy,
  mes,
  citas,
}: {
  dias: string[];
  hoy: string;
  mes: string;
  citas: CitaAgenda[];
}) {
  const conHora = citas
    .map((c) => ({ cita: c, ...enGuatemala(c.fecha) }))
    .sort((a, b) => a.minutos - b.minutos);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="mb-1 grid grid-cols-7 gap-1.5">
          {dias.slice(0, 7).map((d) => (
            <p
              key={d}
              className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {format(parseISO(d), "EEE", { locale: es })}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {dias.map((dia) => (
            <DiaMes
              key={dia}
              dia={dia}
              esHoy={dia === hoy}
              delMes={dia.startsWith(mes)}
              citas={conHora.filter((c) => c.fecha === dia).map((c) => c.cita)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiaMes({
  dia,
  esHoy,
  delMes,
  citas,
}: {
  dia: string;
  esHoy: boolean;
  delMes: boolean;
  citas: CitaAgenda[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia|${dia}` });
  const visibles = citas.slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[104px] flex-col gap-1 rounded-lg border p-1.5 transition-colors ${
        delMes ? "border-border/60 bg-card" : "border-border/30 bg-muted/20"
      }`}
      style={isOver ? { background: "oklch(0.72 0.065 25 / 0.14)", borderColor: ROSA } : undefined}
    >
      <div className="flex items-center justify-between px-0.5">
        <span
          className={`text-[11px] font-semibold tabular-nums ${
            delMes ? "text-foreground" : "text-muted-foreground/40"
          }`}
        >
          {esHoy ? (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white"
              style={{ background: ROSA }}
            >
              {format(parseISO(dia), "d")}
            </span>
          ) : (
            format(parseISO(dia), "d")
          )}
        </span>
        {citas.length > 0 && <span className="text-[9px] text-muted-foreground/70">{citas.length}</span>}
      </div>

      {visibles.map((c) => (
        <ChipCita key={c.id} cita={c} />
      ))}

      {citas.length > visibles.length && (
        <Link
          href={`/dashboard/agenda?vista=semana&ref=${dia}`}
          className="px-1 text-[9px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          +{citas.length - visibles.length} más
        </Link>
      )}
    </div>
  );
}

function ChipCita({ cita }: { cita: CitaAgenda }) {
  const movible = esMovible(cita);
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: cita.id,
    disabled: !movible,
  });
  const est = estadoConsulta(cita.estado);
  const { hora } = enGuatemala(cita.fecha);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${hora} · ${cita.nombre} · ${est.label}`}
      title={`${hora} · ${cita.nombre} · ${est.label}`}
      className={`flex touch-manipulation select-none items-center gap-1 rounded px-1 py-0.5 [-webkit-touch-callout:none] ${
        movible ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{ background: est.bg, opacity: isDragging ? 0.35 : 1 }}
    >
      <span className="h-1 w-1 flex-shrink-0 rounded-full" style={{ background: est.dot }} />
      <span className="text-[9px] font-semibold tabular-nums" style={{ color: est.color }}>
        {hora}
      </span>
      <Link000 href={`/dashboard/consultas/${cita.id}`} className="min-w-0 text-[9px]">
        <span className="truncate" style={{ color: est.color }}>
          {cita.nombre}
        </span>
      </Link000>
    </div>
  );
}

// ── Confirmación ─────────────────────────────────────────────────────────────

function Confirmacion({
  propuesta,
  citas,
  bloqueos,
  onCancelar,
  onConfirmar,
}: {
  propuesta: Propuesta;
  citas: CitaAgenda[];
  bloqueos: BloqueoAgenda[];
  onCancelar: () => void;
  onConfirmar: (datos: { avisar: boolean; sede?: string }) => void;
}) {
  const { cita, fecha, hora } = propuesta;
  const minutos = aMinutos(hora);
  const inicio = instanteGuatemala(fecha, hora);
  const fin = new Date(inicio.getTime() + FRANJA * 60_000);
  const origen = enGuatemala(cita.fecha);

  const sedeDelDia = sedeDeLaHora(fecha, minutos);
  const otraSede = sedeDelDia && sedeDelDia !== cita.sede ? sedeDelDia : null;

  const [avisar, setAvisar] = useState(cita.tieneCorreo);
  const [cambiarSede, setCambiarSede] = useState(Boolean(otraSede));
  const sedeFinal = cambiarSede && otraSede ? otraSede : cita.sede;
  const [ahora] = useState(() => Date.now());
  const boton = useRef<HTMLButtonElement>(null);
  const cancelar = useRef(onCancelar);

  useEffect(() => {
    cancelar.current = onCancelar;
  });

  useEffect(() => {
    boton.current?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && cancelar.current();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  // Mismas reglas que la disponibilidad pública, pero aquí solo avisan: la
  // doctora puede hacer una excepción, el paciente en la web no.
  const mismaDoctora = (id: string | null) => !id || !cita.doctoraId || id === cita.doctoraId;
  const choques = citas.filter((c) => {
    if (c.id === cita.id || !ocupa(c) || !mismaDoctora(c.doctoraId)) return false;
    const otro = new Date(c.fecha).getTime();
    return otro < fin.getTime() && otro + FRANJA * 60_000 > inicio.getTime();
  });
  const bloqueo = bloqueos.find(
    (b) =>
      mismaDoctora(b.doctoraId) &&
      (!b.sede || b.sede === sedeFinal) &&
      new Date(b.desde) < fin &&
      new Date(b.hasta) > inicio,
  );

  const avisos: string[] = [];
  if (inicio.getTime() < ahora) avisos.push("Esa hora ya pasó.");
  if (!abierto(fecha, minutos)) avisos.push("Queda fuera del horario de atención.");
  if (choques.length) {
    avisos.push(`A esa hora ya está ${choques.map((c) => c.nombre).join(", ")}.`);
  }
  if (bloqueo) avisos.push(`La agenda está bloqueada${bloqueo.motivo ? ` (${bloqueo.motivo})` : ""}.`);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="mover-cita-titulo"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border/60 bg-card p-4 shadow-xl"
    >
      <p id="mover-cita-titulo" className="text-sm font-semibold text-foreground">
        Mover la cita de {cita.nombre}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {capitalizar(etiqueta(origen.fecha, origen.hora))}
        {" → "}
        <span className="font-medium text-foreground">{capitalizar(etiqueta(fecha, hora))}</span>
      </p>

      {avisos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 rounded-lg px-3 py-2" style={{ background: "oklch(0.97 0.03 80)" }}>
          {avisos.map((a) => (
            <li key={a} className="text-xs" style={{ color: AMBAR }}>
              {a}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {otraSede && (
          <label className="flex items-start gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={cambiarSede}
              onChange={(e) => setCambiarSede(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5"
            />
            <span>
              Cambiar la sede a <strong>{otraSede}</strong>: es la que atiende ese día. Hoy la cita está
              en {cita.sede}.
            </span>
          </label>
        )}
        <label className="flex items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={avisar}
            disabled={!cita.tieneCorreo}
            onChange={(e) => setAvisar(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5"
          />
          <span className={cita.tieneCorreo ? "" : "text-muted-foreground"}>
            {cita.tieneCorreo
              ? "Avisar al paciente por correo"
              : "El paciente no tiene correo registrado: avísale por teléfono."}
          </span>
        </label>
        {cita.estado === "confirmada" && (
          <p className="text-xs text-muted-foreground">
            La cita vuelve a quedar como agendada hasta que el paciente confirme la nueva hora.
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Dejarla donde estaba
        </button>
        <button
          ref={boton}
          type="button"
          onClick={() => onConfirmar({ avisar, sede: sedeFinal !== cita.sede ? sedeFinal : undefined })}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
          style={{ background: "oklch(0.45 0.13 155)" }}
        >
          Mover cita
        </button>
      </div>
    </div>
  );
}
