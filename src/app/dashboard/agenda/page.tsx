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
  parseISO,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";
import { NuevaCitaForm } from "@/components/dashboard/nueva-cita-form";
import {
  AgendaArrastrable,
  type BloqueoAgenda,
  type CitaAgenda,
} from "@/components/dashboard/agenda-arrastrable";
import { enGuatemala } from "@/lib/hora-guatemala";

type Vista = "semana" | "mes";

type ConsultaAgenda = {
  id: string;
  fecha: string;
  motivo: string | null;
  estado: string;
  sede: string;
  doctora_id: string | null;
  paciente: { primer_nombre: string; primer_apellido: string; email: string | null } | null;
  /** Las citas importadas no tienen expediente: el nombre viene suelto. */
  paciente_nombre: string | null;
};

function nombrePaciente(c: ConsultaAgenda) {
  if (c.paciente) return `${c.paciente.primer_nombre} ${c.paciente.primer_apellido}`;
  return c.paciente_nombre ?? "Paciente";
}

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

  // Un día de holgura a cada lado: el rango se arma en la zona del servidor y
  // la grilla filtra después por el día de Guatemala.
  const supabase = await createClient();
  const [{ data }, { data: filasBloqueo }] = await Promise.all([
    supabase
      .from("consultas")
      .select(
        `id, fecha, motivo, estado, sede, doctora_id, paciente_nombre,
         paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido, email)`,
      )
      // Las canceladas no se muestran: siguen en el expediente del paciente.
      .neq("estado", "cancelada")
      .gte("fecha", addDays(desde, -1).toISOString())
      .lte("fecha", addDays(hasta, 2).toISOString())
      .order("fecha", { ascending: true }),
    supabase
      .from("bloqueos_agenda")
      .select("id, desde, hasta, sede, doctora_id, motivo")
      .lt("desde", addDays(hasta, 2).toISOString())
      .gt("hasta", addDays(desde, -1).toISOString()),
  ]);

  const { data: staff } = await supabase
    .from("staff")
    .select("id, nombre_completo, nombre_agenda")
    .eq("es_doctora", true)
    .eq("activo", true)
    .order("nombre_completo");

  const doctoras = (staff ?? []).map((d) => ({
    id: d.id,
    nombre: d.nombre_agenda ?? d.nombre_completo,
  }));

  const consultas: ConsultaAgenda[] = (data ?? []).map((c) => ({
    ...c,
    paciente: (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) ?? null,
  })) as ConsultaAgenda[];

  const dias = eachDayOfInterval({ start: desde, end: hasta }).map((d) => format(d, "yyyy-MM-dd"));
  const enPeriodo = consultas.filter((c) => dias.includes(enGuatemala(c.fecha).fecha));

  const citas: CitaAgenda[] = consultas.map((c) => ({
    id: c.id,
    fecha: c.fecha,
    motivo: c.motivo,
    estado: c.estado,
    sede: c.sede,
    doctoraId: c.doctora_id,
    nombre: nombrePaciente(c),
    tieneCorreo: Boolean(c.paciente?.email),
  }));

  const bloqueos: BloqueoAgenda[] = (filasBloqueo ?? []).map((b) => ({
    id: b.id,
    desde: b.desde,
    hasta: b.hasta,
    sede: b.sede,
    doctoraId: b.doctora_id,
    motivo: b.motivo,
  }));

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
            {enPeriodo.length} cita{enPeriodo.length !== 1 ? "s" : ""} en el período
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

      <div className="mb-5">
        <NuevaCitaForm doctoras={doctoras} />
      </div>

      <AgendaArrastrable
        vista={vista}
        dias={dias}
        hoy={enGuatemala(hoy).fecha}
        mes={format(ancla, "yyyy-MM")}
        citas={citas}
        bloqueos={bloqueos}
      />
    </div>
  );
}
