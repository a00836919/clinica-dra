import { createClient } from "@/lib/supabase/server";
import { BloqueosPanel } from "@/components/dashboard/bloqueos-panel";

export default async function BloqueosPage() {
  const supabase = await createClient();
  const ahora = new Date().toISOString();

  const [{ data: filas }, { data: staff }] = await Promise.all([
    supabase
      .from("bloqueos_agenda")
      .select("id, desde, hasta, sede, motivo, doctora_id, staff:staff!bloqueos_agenda_doctora_id_fkey(nombre_agenda, nombre_completo)")
      .gte("hasta", ahora)
      .order("desde"),
    supabase
      .from("staff")
      .select("id, nombre_completo, nombre_agenda")
      .eq("es_doctora", true)
      .eq("activo", true)
      .order("nombre_completo"),
  ]);

  const bloqueos = (filas ?? []).map((b) => {
    const s = (Array.isArray(b.staff) ? b.staff[0] : b.staff) as
      | { nombre_agenda: string | null; nombre_completo: string }
      | null;
    return {
      id: b.id,
      desde: b.desde,
      hasta: b.hasta,
      sede: b.sede,
      motivo: b.motivo,
      doctora_id: b.doctora_id,
      doctora: s ? (s.nombre_agenda ?? s.nombre_completo) : null,
    };
  });

  const doctoras = (staff ?? []).map((d) => ({
    id: d.id,
    nombre: d.nombre_agenda ?? d.nombre_completo,
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Bloqueos de horario</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Viajes, capacitaciones o feriados. Solo se muestran los que no han terminado.
        </p>
      </div>

      <BloqueosPanel bloqueos={bloqueos} doctoras={doctoras} />
    </div>
  );
}
