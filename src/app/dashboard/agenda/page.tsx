import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { FinalizarBtn } from "@/components/dashboard/finalizar-btn";

const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  agendada: { label: "Agendada", dot: "oklch(0.52 0.12 250)" },
  confirmada: { label: "Confirmada", dot: "oklch(0.45 0.13 155)" },
  atendida: { label: "Atendida", dot: "oklch(0.42 0.12 145)" },
  cancelada: { label: "Cancelada", dot: "oklch(0.55 0.18 25)" },
  no_asistio: { label: "No asistió", dot: "oklch(0.5 0.04 50)" },
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const hoy = new Date();

  const lunesDeEsta = startOfWeek(hoy, { weekStartsOn: 1 });
  const viernesDeEsta = addDays(lunesDeEsta, 4);

  const { data: consultas } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede,
       paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido)`
    )
    .gte("fecha", startOfDay(lunesDeEsta).toISOString())
    .lte("fecha", endOfDay(viernesDeEsta).toISOString())
    .order("fecha", { ascending: true });

  const dias = Array.from({ length: 5 }, (_, i) => addDays(lunesDeEsta, i));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Semana del {format(lunesDeEsta, "d 'de' MMMM", { locale: es })} al{" "}
          {format(viernesDeEsta, "d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {dias.map((dia) => {
          const esHoy = format(dia, "yyyy-MM-dd") === format(hoy, "yyyy-MM-dd");
          const citasDia = consultas?.filter(
            (c) =>
              format(new Date(c.fecha), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
          ) ?? [];

          return (
            <div key={dia.toISOString()} className="flex flex-col gap-2">
              {/* Cabecera del día */}
              <div
                className={`rounded-lg px-3 py-2 text-center ${
                  esHoy
                    ? "text-white"
                    : "bg-muted/50 text-foreground"
                }`}
                style={esHoy ? { background: "oklch(0.72 0.065 25)" } : {}}
              >
                <p className="text-[10px] uppercase tracking-wider font-medium opacity-80">
                  {format(dia, "EEE", { locale: es })}
                </p>
                <p className="text-lg font-bold leading-tight">
                  {format(dia, "d")}
                </p>
                {citasDia.length > 0 && (
                  <p className="text-[10px] opacity-70 mt-0.5">
                    {citasDia.length} cita{citasDia.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Citas */}
              <div className="flex flex-col gap-1.5">
                {citasDia.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/50 py-4 text-center">
                    <p className="text-[10px] text-muted-foreground/50">
                      Sin citas
                    </p>
                  </div>
                ) : (
                  citasDia.map((c) => {
                    const estado = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.agendada;
                    const paciente = (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) as {
                      primer_nombre: string;
                      primer_apellido: string;
                    } | null;
                    const hora = format(new Date(c.fecha), "HH:mm");

                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border/60 bg-card px-3 py-2 hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                            style={{ background: estado.dot }}
                          />
                          <span className="text-[10px] font-semibold text-foreground tabular-nums">
                            {hora}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground leading-tight truncate">
                          {paciente
                            ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
                            : "Paciente"}
                        </p>
                        {c.motivo && (
                          <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">
                            {c.motivo}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground/60 mt-1 truncate">
                          {c.sede}
                        </p>
                        <FinalizarBtn consultaId={c.id} estado={c.estado} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
