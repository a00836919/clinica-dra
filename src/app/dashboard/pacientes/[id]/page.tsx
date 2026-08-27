import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  ArrowLeft,
  CalendarDays,
  FileImage,
  FileText,
  User,
  MapPin,
  Stethoscope,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  agendada:   { label: "Agendada",   dot: "oklch(0.52 0.12 250)", bg: "oklch(0.95 0.03 250)", text: "oklch(0.42 0.12 250)" },
  confirmada: { label: "Confirmada", dot: "oklch(0.45 0.13 155)", bg: "oklch(0.95 0.04 155)", text: "oklch(0.38 0.12 155)" },
  atendida:   { label: "Atendida",   dot: "oklch(0.42 0.12 145)", bg: "oklch(0.94 0.04 145)", text: "oklch(0.35 0.11 145)" },
  cancelada:  { label: "Cancelada",  dot: "oklch(0.55 0.18 25)",  bg: "oklch(0.96 0.04 25)",  text: "oklch(0.45 0.15 25)"  },
  no_asistio: { label: "No asistió", dot: "oklch(0.5 0.04 50)",   bg: "oklch(0.95 0.015 50)", text: "oklch(0.42 0.04 50)"  },
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-base font-medium text-foreground mb-4"
      style={{ fontFamily: "var(--font-playfair)" }}
    >
      {children}
    </h3>
  );
}

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: paciente }, { data: consultas }, { data: imagenes }] =
    await Promise.all([
      supabase.from("pacientes").select("*").eq("id", id).single(),
      supabase
        .from("consultas")
        .select("*, doctora:staff!consultas_doctora_id_fkey(nombre_completo)")
        .eq("paciente_id", id)
        .order("fecha", { ascending: false }),
      supabase
        .from("imagenes_clinicas")
        .select("*")
        .eq("paciente_id", id)
        .order("fecha", { ascending: false }),
    ]);

  if (!paciente) notFound();

  // Get recetas via consulta IDs
  const consultaIds = consultas?.map((c) => c.id) ?? [];
  const { data: recetas } = consultaIds.length
    ? await supabase
        .from("recetas")
        .select("*, doctora:staff(nombre_completo), consulta:consultas(fecha, motivo)")
        .in("consulta_id", consultaIds)
        .order("fecha_emision", { ascending: false })
    : { data: [] };

  const nombreCompleto = [
    paciente.primer_nombre,
    paciente.segundo_nombre,
    paciente.tercer_nombre,
    paciente.primer_apellido,
    paciente.segundo_apellido,
    paciente.apellido_casada,
  ]
    .filter(Boolean)
    .join(" ");

  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), new Date(paciente.fecha_nacimiento))
    : null;

  const initials = [paciente.primer_nombre?.[0], paciente.primer_apellido?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/pacientes"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Pacientes
      </Link>

      {/* ── Patient Header ── */}
      <div className="flex items-start gap-5 mb-8 pb-8 border-b border-border/60">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
          style={{ background: "oklch(0.72 0.065 25)" }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h1
            className="text-[1.6rem] font-medium leading-tight text-foreground mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {nombreCompleto}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {edad !== null && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {edad} años
                {paciente.fecha_nacimiento && (
                  <span className="text-muted-foreground/60">
                    · {format(new Date(paciente.fecha_nacimiento), "d MMM yyyy", { locale: es })}
                  </span>
                )}
              </span>
            )}
            {paciente.telefono && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {paciente.telefono}
              </span>
            )}
            {paciente.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {paciente.email}
              </span>
            )}
            {paciente.sexo && (
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground/60">·</span>
                {paciente.sexo}
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex gap-3 flex-shrink-0">
          {[
            { label: "Consultas", value: consultas?.length ?? 0, icon: CalendarDays },
            { label: "Imágenes",  value: imagenes?.length ?? 0,  icon: FileImage },
            { label: "Recetas",   value: recetas?.length ?? 0,   icon: FileText },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 bg-muted/40 rounded-xl px-4 py-2.5 min-w-[70px]"
            >
              <stat.icon className="h-4 w-4 text-muted-foreground/70" />
              <span className="text-lg font-semibold text-foreground leading-none">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="info">
        <TabsList className="mb-6 h-9 bg-muted/40 p-0.5">
          <TabsTrigger value="info" className="h-8 text-xs gap-1.5">
            <User className="h-3.5 w-3.5" /> Info
          </TabsTrigger>
          <TabsTrigger value="consultas" className="h-8 text-xs gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Consultas
            {(consultas?.length ?? 0) > 0 && (
              <span className="ml-0.5 bg-primary/15 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {consultas!.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="imagenes" className="h-8 text-xs gap-1.5">
            <FileImage className="h-3.5 w-3.5" /> Imágenes
          </TabsTrigger>
          <TabsTrigger value="recetas" className="h-8 text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Recetas
          </TabsTrigger>
        </TabsList>

        {/* ── Info Tab ── */}
        <TabsContent value="info" className="space-y-8">
          {/* Personal */}
          <div>
            <SectionTitle>Datos personales</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              <InfoRow label="Tipo ID" value={paciente.tipo_identificacion} />
              <InfoRow label="Número ID" value={paciente.numero_identificacion} />
              <InfoRow label="NIT" value={paciente.nit} />
              <InfoRow label="Nacionalidad" value={paciente.nacionalidad} />
              <InfoRow label="País de nacimiento" value={paciente.lugar_nacimiento_pais} />
              <InfoRow label="Ciudad de nacimiento" value={paciente.lugar_nacimiento_ciudad} />
              <InfoRow label="Estado civil" value={paciente.estado_civil} />
              <InfoRow label="Profesión" value={paciente.profesion} />
              <InfoRow label="Dirección" value={paciente.direccion} />
              <InfoRow label="Teléfono alterno" value={paciente.telefono_alterno} />
            </div>
          </div>

          {/* Insurance */}
          {(paciente.aseguradora || paciente.no_carnet_poliza) && (
            <div>
              <SectionTitle>Seguro médico</SectionTitle>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <InfoRow label="Aseguradora" value={paciente.aseguradora} />
                <InfoRow label="No. carnet / póliza" value={paciente.no_carnet_poliza} />
              </div>
            </div>
          )}

          {/* Medical history */}
          <div>
            <SectionTitle>Antecedentes médicos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <InfoRow label="Condiciones médicas" value={paciente.condiciones_medicas} />
              <InfoRow label="Medicamentos actuales" value={paciente.medicamentos_actuales} />
              <InfoRow label="Enfermedades de piel" value={paciente.enfermedades_piel} />
              <InfoRow label="Otras enfermedades" value={paciente.otras_enfermedades} />
              <InfoRow label="Antecedentes cáncer familiar" value={paciente.antecedentes_cancer_familiar} />
              <InfoRow label="Historia personal de cáncer" value={paciente.historia_personal_cancer} />
            </div>
          </div>

          {/* Habits */}
          <div>
            <SectionTitle>Hábitos y estilo de vida</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Fuma
                </span>
                <span className="text-sm text-foreground">
                  {paciente.fuma === null ? "—" : paciente.fuma ? "Sí" : "No"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Alcohol
                </span>
                <span className="text-sm text-foreground">
                  {paciente.toma_alcohol === null ? "—" : paciente.toma_alcohol ? "Sí" : "No"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ejercicio
                </span>
                <span className="text-sm text-foreground">
                  {paciente.se_ejercita === null ? "—" : paciente.se_ejercita ? "Sí" : "No"}
                </span>
              </div>
              {paciente.horas_sueno != null && (
                <InfoRow label="Horas de sueño" value={`${paciente.horas_sueno}h`} />
              )}
              {paciente.nivel_estres != null && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Nivel de estrés
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${paciente.nivel_estres * 10}%`,
                          background: "oklch(0.72 0.065 25)",
                        }}
                      />
                    </div>
                    <span className="text-sm text-foreground">{paciente.nivel_estres}/10</span>
                  </div>
                </div>
              )}
              <InfoRow label="Productos de piel actuales" value={paciente.productos_piel_actuales} />
            </div>
          </div>
        </TabsContent>

        {/* ── Consultas Tab ── */}
        <TabsContent value="consultas">
          {!consultas || consultas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
              <Stethoscope className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Sin consultas registradas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {consultas.map((c) => {
                const est = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.agendada;
                const doctora = (Array.isArray(c.doctora) ? c.doctora[0] : c.doctora) as
                  | { nombre_completo: string }
                  | null;

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border/60 bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p
                          className="text-base font-medium text-foreground leading-tight"
                          style={{ fontFamily: "var(--font-playfair)" }}
                        >
                          {format(new Date(c.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(c.fecha), "HH:mm")} · {c.sede}
                          {doctora ? ` · ${doctora.nombre_completo}` : ""}
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{ background: est.bg, color: est.text }}
                      >
                        {est.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {c.motivo && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Motivo
                          </p>
                          <p className="text-foreground/90">{c.motivo}</p>
                        </div>
                      )}
                      {c.diagnostico && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Diagnóstico
                          </p>
                          <p className="text-foreground/90">{c.diagnostico}</p>
                        </div>
                      )}
                      {c.tratamiento && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Tratamiento
                          </p>
                          <p className="text-foreground/90">{c.tratamiento}</p>
                        </div>
                      )}
                    </div>

                    {(c.notas || c.notas_ampliadas) && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                          Notas
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {c.notas_ampliadas ?? c.notas}
                        </p>
                      </div>
                    )}

                    {c.proxima_control && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Próximo control:{" "}
                        <span className="font-medium text-foreground">
                          {format(new Date(c.proxima_control), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Imágenes Tab ── */}
        <TabsContent value="imagenes">
          {!imagenes || imagenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
              <FileImage className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Sin imágenes clínicas</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {imagenes.map((img) => (
                <div
                  key={img.id}
                  className="rounded-xl overflow-hidden border border-border/60 bg-card group"
                >
                  <div className="aspect-square bg-muted/30 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.archivo_url}
                      alt={img.zona_cuerpo ?? "Imagen clínica"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5">
                    {img.zona_cuerpo && (
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {img.zona_cuerpo}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(img.fecha), "d MMM yyyy", { locale: es })}
                    </p>
                    {img.notas_evolucion && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2 leading-snug">
                        {img.notas_evolucion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Recetas Tab ── */}
        <TabsContent value="recetas">
          {!recetas || recetas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Sin recetas registradas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recetas.map((r) => {
                const doctora = (Array.isArray(r.doctora) ? r.doctora[0] : r.doctora) as
                  | { nombre_completo: string }
                  | null;
                const consulta = (Array.isArray(r.consulta) ? r.consulta[0] : r.consulta) as
                  | { fecha: string; motivo: string | null }
                  | null;
                const meds = Array.isArray(r.medicamentos)
                  ? r.medicamentos
                  : typeof r.medicamentos === "object" && r.medicamentos !== null
                  ? Object.values(r.medicamentos)
                  : [];

                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border/60 bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p
                          className="text-base font-medium text-foreground"
                          style={{ fontFamily: "var(--font-playfair)" }}
                        >
                          Receta —{" "}
                          {format(new Date(r.fecha_emision), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doctora?.nombre_completo}
                          {consulta?.motivo ? ` · ${consulta.motivo}` : ""}
                        </p>
                      </div>
                    </div>

                    {meds.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                          Medicamentos
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {meds.map((med: unknown, i: number) => (
                            <div
                              key={i}
                              className="text-sm text-foreground/90 bg-muted/30 rounded-lg px-3 py-2"
                            >
                              {typeof med === "string"
                                ? med
                                : typeof med === "object" && med !== null
                                ? Object.entries(med)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" · ")
                                : String(med)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.archivo_url && (
                      <a
                        href={r.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Ver archivo adjunto
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
