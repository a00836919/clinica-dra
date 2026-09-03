import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";
import { estadoConsulta, ESTADOS_CERRADOS } from "@/lib/estados";

type Vista = "semana" | "mes";

type ConsultaAgenda = {
  id: string;
  fecha: string;
  motivo: string | null;
  estado: string;
  sede: string;
  paciente: { primer_nombre: string; primer_apellido: string } | null;
};

/** El ancla de la vista viaja en la URL, así navegar no necesita JavaScript. */
function leerParams(params: { vista?: string; ref?: string }) {
  const vista: Vista = params.vista === "mes" ? "mes" : "semana";
  const ref = params.ref ? parseISO(params.ref) : new Date();
  return { vista, ancla: isValid(ref) ? ref : new Date() };
}

function rango(vista: Vista, ancla: Date) {
  if (vista === "mes") {
    // Se completa con los días de las semanas de borde para que la grilla cuadre.
    return {
      desde: startOfWeek(startOfMonth(ancla), { weekStartsOn: 1 }),
      hasta: endOfWeek(endOfMonth(ancla), { weekStartsOn: 1 }),
    };
  }
  return {
    desde: startOfWeek(ancla, { weekStartsOn: 1 }),
    hasta: endOfWeek(ancla, { weekStartsOn: 1 }),
  };
}

function href(vista: Vista, fecha: Date) {
  return `/dashboard/agenda?vista=${vista}&ref=${format(fecha, "yyyy-MM-dd")}`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; ref?: string }>;
}) {
  const { vista, ancla } = leerParams(await searchParams);
  const { desde, hasta } = rango(vista, ancla);
  const hoy = new Date();

  const supabase = await createClient();
  const { data } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede,
       paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido)`,
    )
    .gte("fecha", desde.toISOString())
    .lte("fecha", addDays(hasta, 1).toISOString())
    .order("fecha", { ascending: true });

  const consultas: ConsultaAgenda[] = (data ?? []).map((c) => ({
    ...c,
    paciente: (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) ?? null,
  })) as ConsultaAgenda[];

  const dias = eachDayOfInterval({ start: desde, end: hasta });
  const delDia = (dia: Date) => consultas.filter((c) => isSameDay(new Date(c.fecha), dia));

  const anterior = vista === "mes" ? addMonths(ancla, -1) : addWeeks(ancla, -1);
  const siguiente = vista === "mes" ? addMonths(ancla, 1) : addWeeks(ancla, 1);

  const titulo =
    vista === "mes"
      ? format(ancla, "MMMM yyyy", { locale: es })
      : `${format(desde, "d 'de' MMMM", { locale: es })} — ${format(hasta, "d 'de' MMMM yyyy", { locale: es })}`;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="mt-0.5 text-sm capitalize text-muted-foreground">{titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {consultas.length} cita{consultas.length !== 1 ? "s" : ""} en el período
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="flex overflow-hidden rounded-lg border border-border/60">
            {(["semana", "mes"] as Vista[]).map((v) => (
              <Link
                key={v}
                href={href(v, ancla)}
                aria-current={vista === v ? "page" : undefined}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  vista === v
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {v}
              </Link>
            ))}
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-1">
            <Link
              href={href(vista, anterior)}
              aria-label={vista === "mes" ? "Mes anterior" : "Semana anterior"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              ←
            </Link>
            <Link
              href={href(vista, hoy)}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Hoy
            </Link>
            <Link
              href={href(vista, siguiente)}
              aria-label={vista === "mes" ? "Mes siguiente" : "Semana siguiente"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              →
            </Link>
          </div>
        </div>
      </div>

      {vista === "semana" ? (
        <VistaSemana dias={dias} hoy={hoy} delDia={delDia} />
      ) : (
        <VistaMes dias={dias} hoy={hoy} ancla={ancla} delDia={delDia} />
      )}
    </div>
  );
}

// ── Semana: siete columnas con la ficha completa de cada cita ────────────────

function VistaSemana({
  dias,
  hoy,
  delDia,
}: {
  dias: Date[];
  hoy: Date;
  delDia: (d: Date) => ConsultaAgenda[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {dias.map((dia) => {
        const citas = delDia(dia);
        const esHoy = isSameDay(dia, hoy);

        return (
          <div key={dia.toISOString()} className="flex flex-col gap-2">
            <div
              className={`rounded-lg px-3 py-2 text-center ${esHoy ? "text-white" : "bg-muted/50 text-foreground"}`}
              style={esHoy ? { background: "oklch(0.72 0.065 25)" } : undefined}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                {format(dia, "EEE", { locale: es })}
              </p>
              <p className="text-lg font-bold leading-tight">{format(dia, "d")}</p>
              {citas.length > 0 && (
                <p className="mt-0.5 text-[10px] opacity-70">
                  {citas.length} cita{citas.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {citas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 py-4 text-center">
                  <p className="text-[10px] text-muted-foreground/50">Sin citas</p>
                </div>
              ) : (
                citas.map((c) => <TarjetaCita key={c.id} consulta={c} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mes: grilla compacta, la ficha completa se abre al entrar a la consulta ──

function VistaMes({
  dias,
  hoy,
  ancla,
  delDia,
}: {
  dias: Date[];
  hoy: Date;
  ancla: Date;
  delDia: (d: Date) => ConsultaAgenda[];
}) {
  const encabezados = dias.slice(0, 7);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="mb-1 grid grid-cols-7 gap-1.5">
          {encabezados.map((d) => (
            <p
              key={d.toISOString()}
              className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {format(d, "EEE", { locale: es })}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {dias.map((dia) => {
            const citas = delDia(dia);
            const esHoy = isSameDay(dia, hoy);
            const delMes = isSameMonth(dia, ancla);
            const visibles = citas.slice(0, 3);

            return (
              <div
                key={dia.toISOString()}
                className={`flex min-h-[104px] flex-col gap-1 rounded-lg border p-1.5 ${
                  delMes ? "border-border/60 bg-card" : "border-border/30 bg-muted/20"
                }`}
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
                        style={{ background: "oklch(0.72 0.065 25)" }}
                      >
                        {format(dia, "d")}
                      </span>
                    ) : (
                      format(dia, "d")
                    )}
                  </span>
                  {citas.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/70">{citas.length}</span>
                  )}
                </div>

                {visibles.map((c) => {
                  const est = estadoConsulta(c.estado);
                  const nombre = c.paciente
                    ? `${c.paciente.primer_nombre} ${c.paciente.primer_apellido}`
                    : "Paciente";
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/consultas/${c.id}`}
                      className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-muted"
                      style={{ background: est.bg }}
                      title={`${format(new Date(c.fecha), "HH:mm")} · ${nombre} · ${est.label}`}
                    >
                      <span
                        className="h-1 w-1 flex-shrink-0 rounded-full"
                        style={{ background: est.dot }}
                      />
                      <span className="text-[9px] font-semibold tabular-nums" style={{ color: est.color }}>
                        {format(new Date(c.fecha), "HH:mm")}
                      </span>
                      <span className="truncate text-[9px]" style={{ color: est.color }}>
                        {nombre}
                      </span>
                    </Link>
                  );
                })}

                {citas.length > visibles.length && (
                  <Link
                    href={`/dashboard/agenda?vista=semana&ref=${format(dia, "yyyy-MM-dd")}`}
                    className="px-1 text-[9px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    +{citas.length - visibles.length} más
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Ficha de cita en la vista semanal ────────────────────────────────────────

function TarjetaCita({ consulta }: { consulta: ConsultaAgenda }) {
  const est = estadoConsulta(consulta.estado);
  const nombre = consulta.paciente
    ? `${consulta.paciente.primer_nombre} ${consulta.paciente.primer_apellido}`
    : "Paciente";
  const cerrada = ESTADOS_CERRADOS.includes(consulta.estado);

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 transition-shadow hover:shadow-sm">
      <div className="mb-1 flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: est.dot }} />
        <span className="text-[10px] font-semibold tabular-nums text-foreground">
          {format(new Date(consulta.fecha), "HH:mm")}
        </span>
        <span className="ml-auto text-[9px]" style={{ color: est.color }}>
          {est.label}
        </span>
      </div>

      <p className="truncate text-[11px] font-medium leading-tight text-foreground">{nombre}</p>
      {consulta.motivo && (
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
          {consulta.motivo}
        </p>
      )}
      <p className="mt-1 truncate text-[9px] text-muted-foreground/60">{consulta.sede}</p>

      <Link
        href={`/dashboard/consultas/${consulta.id}`}
        className="mt-1.5 block w-full rounded-md py-1 text-center text-[10px] font-medium tracking-wide transition-colors"
        style={
          cerrada
            ? { background: "oklch(0.94 0.006 60)", color: "oklch(0.45 0.012 40)" }
            : {
                background: "oklch(0.45 0.13 155 / 0.12)",
                color: "oklch(0.35 0.1 155)",
                border: "1px solid oklch(0.45 0.13 155 / 0.25)",
              }
        }
      >
        {cerrada ? "Ver consulta" : "Atender →"}
      </Link>
    </div>
  );
}
