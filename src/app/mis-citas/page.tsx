import { redirect } from "next/navigation";
import { getPortalPatientId } from "@/lib/portal-session";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CancelarSolicitudBtn } from "@/components/portal/cancelar-btn";
import { logoutPortal } from "@/app/actions";

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente:  { label: "Pendiente",  color: "oklch(0.55 0.09 70)" },
  confirmada: { label: "Confirmada", color: "oklch(0.42 0.12 145)" },
  cancelada:  { label: "Cancelada",  color: "oklch(0.55 0.18 25)" },
  atendida:   { label: "Atendida",   color: "oklch(0.42 0.12 145)" },
};

export default async function MisCitasPage() {
  const patientId = await getPortalPatientId();
  if (!patientId) redirect("/#mis-citas");

  const supabase = await createClient();

  const [{ data: paciente }, { data: solicitudes }, { data: consultas }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("primer_nombre, primer_apellido, email, telefono")
      .eq("id", patientId)
      .single(),

    supabase
      .from("solicitudes_cita")
      .select("id, estado, fecha_preferida, sede, motivo, creado_en")
      .eq("paciente_id", patientId)
      .order("creado_en", { ascending: false }),

    supabase
      .from("consultas")
      .select(`
        id, fecha, estado, motivo, diagnostico, tratamiento, sede,
        receta_enviada,
        doctora:staff!consultas_doctora_id_fkey(nombre_completo),
        recetas(id, medicamentos, fecha_emision)
      `)
      .eq("paciente_id", patientId)
      .order("fecha", { ascending: false }),
  ]);

  if (!paciente) redirect("/#mis-citas");

  return (
    <div
      style={{ background: "oklch(0.988 0.003 85)", fontFamily: "var(--font-geist-sans)", minHeight: "100vh" }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[oklch(0.91_0.008_60)]"
        style={{ background: "oklch(0.988 0.003 85 / 0.95)", backdropFilter: "blur(12px)" }}
      >
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-[oklch(0.72_0.065_25)] font-medium">
            Skin Clinic GT
          </p>
          <p className="text-sm font-medium text-[oklch(0.145_0_0)]">
            {paciente.primer_nombre} {paciente.primer_apellido}
          </p>
        </div>
        <form action={logoutPortal}>
          <button
            type="submit"
            className="text-[11px] text-[oklch(0.6_0.012_40)] hover:text-[oklch(0.4_0.012_40)] transition-colors px-3 py-1.5 rounded-full border border-[oklch(0.88_0.01_60)]"
          >
            Salir
          </button>
        </form>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-12">

        {/* ── Solicitudes de cita ── */}
        <section>
          <h2 className="text-lg font-semibold text-[oklch(0.145_0_0)] mb-1">Mis solicitudes de cita</h2>
          <p className="text-sm text-[oklch(0.55_0.012_40)] mb-6">
            Solicitudes enviadas al clinic para agendar una consulta.
          </p>

          {!solicitudes?.length ? (
            <div className="rounded-xl border border-dashed border-[oklch(0.88_0.01_60)] py-10 text-center">
              <p className="text-sm text-[oklch(0.65_0.012_40)]">No tienes solicitudes registradas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {solicitudes.map((s) => {
                const cfg = ESTADO_LABEL[s.estado] ?? ESTADO_LABEL.pendiente;
                const canCancel = s.estado === "pendiente" || s.estado === "confirmada";
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-[oklch(0.91_0.008_60)] bg-white px-5 py-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: cfg.color }}
                        />
                        <span className="text-[11px] font-medium" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      {s.fecha_preferida && (
                        <p className="text-sm font-medium text-[oklch(0.145_0_0)]">
                          {format(new Date(s.fecha_preferida), "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                      )}
                      {s.sede && <p className="text-xs text-[oklch(0.55_0.012_40)]">{s.sede}</p>}
                      {s.motivo && (
                        <p className="text-xs text-[oklch(0.65_0.012_40)] mt-1 line-clamp-2">{s.motivo}</p>
                      )}
                    </div>
                    {canCancel && <CancelarSolicitudBtn solicitudId={s.id} />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Historial de consultas ── */}
        <section>
          <h2 className="text-lg font-semibold text-[oklch(0.145_0_0)] mb-1">Historial de consultas</h2>
          <p className="text-sm text-[oklch(0.55_0.012_40)] mb-6">
            Consultas atendidas, con diagnóstico y receta.
          </p>

          {!consultas?.length ? (
            <div className="rounded-xl border border-dashed border-[oklch(0.88_0.01_60)] py-10 text-center">
              <p className="text-sm text-[oklch(0.65_0.012_40)]">Sin consultas registradas aún.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {consultas.map((c) => {
                const doctora = Array.isArray(c.doctora) ? c.doctora[0] : c.doctora as { nombre_completo: string } | null;
                const receta = Array.isArray(c.recetas) ? c.recetas[0] : null as { id: string; medicamentos: unknown; fecha_emision: string } | null;
                const meds = (receta?.medicamentos ?? []) as Array<{ nombre: string; dosis?: string; instrucciones?: string }>;

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[oklch(0.91_0.008_60)] bg-white overflow-hidden"
                  >
                    {/* Header consulta */}
                    <div
                      className="px-5 py-3 flex items-center justify-between border-b border-[oklch(0.94_0.006_60)]"
                      style={{ background: "oklch(0.97 0.006 60)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[oklch(0.145_0_0)]">
                          {format(new Date(c.fecha), "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                        <p className="text-[11px] text-[oklch(0.55_0.012_40)]">
                          {doctora?.nombre_completo ?? "Skin Clinic GT"} · {c.sede}
                        </p>
                      </div>
                      {c.receta_enviada && (
                        <span className="text-[10px] bg-[oklch(0.93_0.015_145)] text-[oklch(0.38_0.1_145)] px-2 py-0.5 rounded-full font-medium">
                          Receta enviada ✓
                        </span>
                      )}
                    </div>

                    <div className="px-5 py-4 flex flex-col gap-4">
                      {c.diagnostico && (
                        <div>
                          <p className="text-[10px] tracking-wider uppercase text-[oklch(0.72_0.065_25)] font-medium mb-1">
                            Diagnóstico
                          </p>
                          <p className="text-sm text-[oklch(0.25_0_0)] leading-relaxed">{c.diagnostico}</p>
                        </div>
                      )}
                      {c.tratamiento && (
                        <div>
                          <p className="text-[10px] tracking-wider uppercase text-[oklch(0.72_0.065_25)] font-medium mb-1">
                            Tratamiento
                          </p>
                          <p className="text-sm text-[oklch(0.25_0_0)] leading-relaxed">{c.tratamiento}</p>
                        </div>
                      )}
                      {meds.length > 0 && (
                        <div>
                          <p className="text-[10px] tracking-wider uppercase text-[oklch(0.72_0.065_25)] font-medium mb-2">
                            Medicamentos
                          </p>
                          <div className="flex flex-col gap-2">
                            {meds.map((m, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-[oklch(0.91_0.008_60)] px-4 py-2.5"
                              >
                                <p className="text-sm font-medium text-[oklch(0.145_0_0)]">{m.nombre}</p>
                                {m.dosis && <p className="text-xs text-[oklch(0.55_0.012_40)]">Dosis: {m.dosis}</p>}
                                {m.instrucciones && <p className="text-xs text-[oklch(0.65_0.012_40)]">{m.instrucciones}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
