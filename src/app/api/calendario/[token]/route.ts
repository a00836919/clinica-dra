import { createAdminClient } from "@/lib/supabase/admin";
import { construirCalendario, type EventoIcs } from "@/lib/ics";
import { HORARIO } from "@/lib/disponibilidad";
import { nombreSedeCompleto } from "@/lib/sedes";
import { ESTADO_CONSULTA } from "@/lib/estados";

/**
 * Feed de calendario de una doctora, para suscribirse desde Google Calendar,
 * Apple o Outlook.
 *
 * Quien pide este archivo es el servidor de Google, no un navegador con sesión:
 * la única credencial posible es el token del enlace. Por eso el token es un
 * UUID aleatorio guardado en `staff.calendario_token`, se puede regenerar desde
 * el dashboard —lo que invalida el enlace anterior— y el archivo nunca lleva
 * más datos de los que la doctora ya ve en su agenda.
 */

export const dynamic = "force-dynamic";

/** Cuántos días hacia atrás y hacia adelante se publican. */
const DIAS_ATRAS = 60;
const DIAS_ADELANTE = 180;

const ESTADO_ICS: Record<string, EventoIcs["estado"]> = {
  agendada: "TENTATIVE",
  confirmada: "CONFIRMED",
  atendida: "CONFIRMED",
  cancelada: "CANCELLED",
  no_asistio: "CANCELLED",
};

type PacienteFila = { primer_nombre: string; primer_apellido: string; telefono: string | null };

type FilaConsulta = {
  id: string;
  fecha: string;
  motivo: string | null;
  estado: string;
  sede: string | null;
  paciente_nombre: string | null;
  paciente_telefono: string | null;
  // PostgREST devuelve la relación como arreglo aunque sea uno a uno.
  paciente: PacienteFila | PacienteFila[] | null;
};

function expediente(fila: FilaConsulta): PacienteFila | null {
  return (Array.isArray(fila.paciente) ? fila.paciente[0] : fila.paciente) ?? null;
}

function nombrePaciente(fila: FilaConsulta) {
  const p = expediente(fila);
  if (p) return `${p.primer_nombre} ${p.primer_apellido}`;
  return fila.paciente_nombre ?? "Paciente";
}

function telefono(fila: FilaConsulta) {
  return expediente(fila)?.telefono ?? fila.paciente_telefono ?? null;
}

export async function GET(request: Request, ctx: RouteContext<"/api/calendario/[token]">) {
  const { token } = await ctx.params;

  // Un token con forma rara ni siquiera llega a la base.
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response("Enlace de calendario no válido.", { status: 404 });
  }

  const supabase = createAdminClient();
  if (!supabase) return new Response("Calendario no disponible.", { status: 503 });

  const { data: doctora, error: errorStaff } = await supabase
    .from("staff")
    .select("id, nombre_completo, nombre_agenda")
    .eq("calendario_token", token)
    .maybeSingle();

  if (errorStaff) {
    console.error("[calendario] no se pudo leer el staff:", errorStaff);
    return new Response("Calendario no disponible.", { status: 503 });
  }
  // Enlace revocado o inventado: se responde 404 sin pistas.
  if (!doctora) return new Response("Enlace de calendario no válido.", { status: 404 });

  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_ATRAS);
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + DIAS_ADELANTE);

  const { data: consultas, error } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede, paciente_nombre, paciente_telefono,
       paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido, telefono)`,
    )
    .eq("doctora_id", doctora.id)
    .gte("fecha", desde.toISOString())
    .lte("fecha", hasta.toISOString())
    .order("fecha");

  if (error) {
    console.error("[calendario] no se pudieron leer las consultas:", error);
    return new Response("Calendario no disponible.", { status: 503 });
  }

  const origen = new URL(request.url).origin;
  const nombreDoctora = doctora.nombre_agenda ?? doctora.nombre_completo ?? "Skin Clinic GT";

  const eventos: EventoIcs[] = ((consultas ?? []) as unknown as FilaConsulta[]).map((fila) => {
    const inicio = new Date(fila.fecha);
    const fin = new Date(inicio.getTime() + HORARIO.minutosPorFranja * 60_000);
    const tel = telefono(fila);
    const etiquetaEstado = ESTADO_CONSULTA[fila.estado]?.label ?? fila.estado;

    const detalle = [
      `Estado: ${etiquetaEstado}`,
      fila.motivo ? `Motivo: ${fila.motivo}` : null,
      tel ? `Teléfono: ${tel}` : null,
      `Expediente: ${origen}/dashboard/consultas/${fila.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      // El UID debe ser el mismo entre refrescos, o cada sincronización crea
      // eventos duplicados en vez de actualizar los que ya están.
      uid: `consulta-${fila.id}@skinclinic.gt`,
      inicio,
      fin,
      titulo: nombrePaciente(fila),
      descripcion: detalle,
      lugar: nombreSedeCompleto(fila.sede),
      url: `${origen}/dashboard/consultas/${fila.id}`,
      estado: ESTADO_ICS[fila.estado] ?? "CONFIRMED",
      actualizado: inicio,
    };
  });

  const ics = construirCalendario({
    nombre: `Consultas · ${nombreDoctora}`,
    descripcion: "Agenda de Skin Clinic GT. Se actualiza sola; se edita en el dashboard.",
    eventos,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="skin-clinic.ics"',
      // Que ningún intermediario guarde una agenda médica.
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
