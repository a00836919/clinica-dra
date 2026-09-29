import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { AgendarSolicitudForm } from "@/components/dashboard/agendar-solicitud-form";
import { CancelarSolicitudBtn } from "@/components/portal/cancelar-btn";

const ESTADO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  agendada: {
    label: "Agendada",
    color: "oklch(0.52 0.12 250)",
    bg: "oklch(0.95 0.03 250)",
  },
  confirmada: {
    label: "Confirmada",
    color: "oklch(0.45 0.13 155)",
    bg: "oklch(0.95 0.04 155)",
  },
  atendida: {
    label: "Atendida",
    color: "oklch(0.42 0.12 145)",
    bg: "oklch(0.94 0.04 145)",
  },
  cancelada: {
    label: "Cancelada",
    color: "oklch(0.55 0.18 25)",
    bg: "oklch(0.96 0.04 25)",
  },
  no_asistio: {
    label: "No asistió",
    color: "oklch(0.5 0.04 50)",
    bg: "oklch(0.95 0.015 50)",
  },
};

const SEDE_DOTS: Record<string, string> = {
  Integra: "oklch(0.72 0.065 25)",
  "Decorísima": "oklch(0.62 0.08 20)",
  "Galerías Tiffany": "oklch(0.55 0.09 15)",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date();

  const { data: solicitudes } = await supabase
    .from("solicitudes_cita")
    .select("id, nombre, telefono, email, sede, fecha_preferida, motivo, estado, creado_en")
    .in("estado", ["pendiente", "agendada"])
    .order("creado_en", { ascending: false })
    .limit(20);

  const { data: consultas } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede, doctora_nombre, paciente_nombre, paciente_telefono,
       paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido, telefono)`
    )
    .gte("fecha", startOfDay(hoy).toISOString())
    .lte("fecha", endOfDay(hoy).toISOString())
    .order("fecha", { ascending: true });

  // Doctoras activas para el selector al agendar una solicitud
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

  const { count: totalPacientes } = await supabase
    .from("pacientes")
    .select("id", { count: "exact", head: true });

  const { count: consultasMes } = await supabase
    .from("consultas")
    .select("id", { count: "exact", head: true })
    .gte("fecha", new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString())
    .lte("fecha", endOfDay(hoy).toISOString());

  const atendidas = consultas?.filter((c) => c.estado === "atendida").length ?? 0;
  const pendientes =
    consultas?.filter((c) => ["agendada", "confirmada"].includes(c.estado)).length ?? 0;

  const metrics = [
    {
      label: "Citas hoy",
      value: consultas?.length ?? 0,
      icon: Calendar,
      sub: `${pendientes} pendientes`,
    },
    {
      label: "Atendidas hoy",
      value: atendidas,
      icon: CheckCircle2,
      sub: "del día",
    },
    {
      label: "Pacientes totales",
      value: totalPacientes ?? 0,
      icon: Users,
      sub: "en el sistema",
    },
    {
      label: "Consultas este mes",
      value: consultasMes ?? 0,
      icon: Clock,
      sub: "hasta hoy",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">
          {format(hoy, "EEEE", { locale: es })}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {format(hoy, "d 'de' MMMM, yyyy", { locale: es })}
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="border border-border/60 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {m.label}
              </CardTitle>
              <m.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Solicitudes pendientes */}
      {solicitudes && solicitudes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Solicitudes de cita
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({solicitudes.filter(s => s.estado === "pendiente").length} pendientes)
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {solicitudes.map((s) => (
              <div key={s.id}
                   className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      s.estado === "pendiente" ? "bg-amber-400" : "bg-green-500"
                    }`} />
                    <span className="text-[11px] font-medium text-muted-foreground capitalize">{s.estado}</span>
                    {s.fecha_preferida && (
                      <span className="text-[11px] text-muted-foreground">
                        · {format(parseISO(s.fecha_preferida), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                    {s.sede && s.sede !== "Sin preferencia" && (
                      <span className="text-[11px] text-muted-foreground">· {s.sede}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground">{s.telefono}{s.email ? ` · ${s.email}` : ""}</p>
                  {s.motivo && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{s.motivo}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.estado === "pendiente" && (
                    <AgendarSolicitudForm
                      solicitudId={s.id}
                      fechaSugerida={s.fecha_preferida}
                      sedeSugerida={s.sede}
                      doctoras={doctoras}
                    />
                  )}
                  <CancelarSolicitudBtn solicitudId={s.id} scope="clinica" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda del día */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Agenda de hoy</h2>
          <a
            href="/dashboard/agenda"
            className="text-xs text-primary hover:underline"
          >
            Ver agenda completa →
          </a>
        </div>

        {!consultas || consultas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Sin citas agendadas para hoy
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Usa la agenda para agendar consultas
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {consultas.map((c) => {
              const estado = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.agendada;
              const paciente = (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) as {
                primer_nombre: string;
                primer_apellido: string;
                telefono: string;
              } | null;
              const hora = format(new Date(c.fecha), "HH:mm");

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/consultas/${c.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors"
                >
                  {/* Hora */}
                  <div className="w-12 flex-shrink-0 text-center">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {hora}
                    </span>
                  </div>

                  {/* Separador de sede */}
                  <div
                    className="w-0.5 h-8 rounded-full flex-shrink-0"
                    style={{
                      background: SEDE_DOTS[c.sede] ?? "oklch(0.72 0.065 25)",
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {paciente
                        ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
                        : (c.paciente_nombre ?? "Paciente desconocido")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.motivo ?? "Sin motivo especificado"} · {c.sede}
                    </p>
                  </div>

                  {/* Estado */}
                  <div
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      color: estado.color,
                      background: estado.bg,
                    }}
                  >
                    {estado.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
