import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { estadoConsulta, ESTADOS_CERRADOS } from "@/lib/estados";
import { CierreConsultaForm } from "@/components/dashboard/cierre-consulta-form";
import { ControlesConsulta } from "@/components/dashboard/controles-consulta";
import type { Medicamento } from "@/app/actions";
import { tipoIdentificacion } from "@/lib/identificacion";
import { enlaceGoogleCalendar } from "@/lib/ics";
import { HORARIO } from "@/lib/disponibilidad";
import { nombreSedeCompleto } from "@/lib/sedes";
import { etiquetaCie10 } from "@/lib/cie10";
import {
  HistorialPaciente,
  type ConsultaHistorial,
} from "@/components/dashboard/historial-paciente";

export default async function ConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: consulta } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede, diagnostico, diagnostico_cie10, diagnostico_cie10_desc,
       tratamiento, notas, notas_ampliadas,
       proxima_control, receta_enviada, receta_enviada_en, doctora_nombre,
       paciente_nombre, paciente_telefono, origen,
       paciente:pacientes!consultas_paciente_id_fkey(
         id, primer_nombre, primer_apellido, telefono, email, nit, direccion,
         fecha_nacimiento, tipo_identificacion, numero_identificacion,
         consentimiento_aceptado_en, consentimiento_version,
         condiciones_medicas, medicamentos_actuales
       ),
       recetas(id, medicamentos, fecha_emision)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!consulta) notFound();

  const paciente = (Array.isArray(consulta.paciente) ? consulta.paciente[0] : consulta.paciente) as {
    id: string;
    primer_nombre: string;
    primer_apellido: string;
    telefono: string;
    email: string | null;
    nit: string | null;
    direccion: string | null;
    fecha_nacimiento: string;
    tipo_identificacion: string | null;
    numero_identificacion: string;
    consentimiento_aceptado_en: string | null;
    consentimiento_version: string | null;
    condiciones_medicas: string | null;
    medicamentos_actuales: string | null;
  } | null;

  // Consultas anteriores del mismo paciente. Casi todas las citas vienen del
  // sistema anterior sin expediente ligado, así que además del expediente se
  // busca por teléfono (los últimos 8 dígitos: unos traen el 502, otros dos
  // números pegados) y, si no hay teléfono, por el nombre exacto.
  const telefono = (paciente?.telefono ?? consulta.paciente_telefono ?? "").replace(/\D/g, "").slice(-8);
  const filtros: string[] = [];
  if (paciente) filtros.push(`paciente_id.eq.${paciente.id}`);
  if (telefono.length === 8) {
    filtros.push(`paciente_telefono.ilike.*${telefono}*`);
  } else if (!paciente && consulta.paciente_nombre?.trim()) {
    // Entre comillas para que comas o paréntesis del nombre no rompan el filtro.
    const exacto = consulta.paciente_nombre.trim().replace(/["\\%*_]/g, "");
    filtros.push(`paciente_nombre.ilike."${exacto}"`);
  }

  const { data: previas } = filtros.length
    ? await supabase
        .from("consultas")
        .select(
          `id, fecha, estado, sede, motivo, origen, paciente_id, paciente_nombre, doctora_nombre,
           diagnostico, diagnostico_cie10,
           diagnostico_cie10_desc, tratamiento, notas, proxima_control,
           recetas(medicamentos)`,
        )
        .or(filtros.join(","))
        .neq("id", consulta.id)
        .lt("fecha", consulta.fecha)
        .not("estado", "in", "(cancelada,no_asistio)")
        .order("fecha", { ascending: false })
        .limit(50)
    : { data: [] };

  const nombreActual = paciente
    ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
    : (consulta.paciente_nombre ?? "");

  const historial: ConsultaHistorial[] = (previas ?? [])
    // Un mismo teléfono lo comparten a veces madre e hija o hermanos: por
    // teléfono solo cuenta si el nombre también coincide.
    .filter((c) => (paciente && c.paciente_id === paciente.id) || mismoNombre(c.paciente_nombre, nombreActual))
    .map((c) => {
      const r = Array.isArray(c.recetas) ? c.recetas[0] : c.recetas;
      return {
        id: c.id,
        fecha: c.fecha,
        estado: c.estado,
        sede: c.sede,
        motivo: c.motivo,
        doctora: c.doctora_nombre,
        importada: c.origen === "importado",
        diagnostico: c.diagnostico,
        cie10: etiquetaCie10(c.diagnostico_cie10, c.diagnostico_cie10_desc),
        tratamiento: c.tratamiento,
        notas: c.notas,
        proximoControl: c.proxima_control,
        medicamentos: ((r as { medicamentos?: Medicamento[] } | null)?.medicamentos ?? []) as Medicamento[],
      };
    })
    // Una cita de la app que nunca se atendió no aporta nada clínico. Las del
    // sistema anterior se quedan: casi ninguna se marcó como atendida, pero
    // son las visitas que hubo.
    .filter(
      (c) => c.importada || c.estado === "atendida" || c.medicamentos.length > 0 || c.diagnostico,
    );

  const receta = Array.isArray(consulta.recetas) ? consulta.recetas[0] : null;
  const medicamentos = (receta?.medicamentos ?? []) as Medicamento[];
  const est = estadoConsulta(consulta.estado);
  const cerrada = ESTADOS_CERRADOS.includes(consulta.estado);
  const nombre = paciente
    ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
    : (consulta.paciente_nombre ?? "Paciente");

  const inicio = new Date(consulta.fecha);
  const enGoogle = enlaceGoogleCalendar({
    uid: `consulta-${consulta.id}@skinclinic.gt`,
    inicio,
    fin: new Date(inicio.getTime() + HORARIO.minutosPorFranja * 60_000),
    titulo: `Consulta · ${nombre}`,
    descripcion: consulta.motivo ?? undefined,
    lugar: nombreSedeCompleto(consulta.sede),
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Cabecera */}
      <div className="mb-6">
        <Link
          href={`/dashboard/agenda?vista=semana&ref=${format(new Date(consulta.fecha), "yyyy-MM-dd")}`}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a la agenda
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ color: est.color, background: est.bg }}
              >
                {est.label}
              </span>
              {consulta.receta_enviada && (
                <span className="text-[10px] text-muted-foreground">
                  Resumen enviado
                  {consulta.receta_enviada_en
                    ? ` el ${format(new Date(consulta.receta_enviada_en), "d MMM yyyy, HH:mm", { locale: es })}`
                    : ""}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-semibold text-foreground">{nombre}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {format(new Date(consulta.fecha), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })} ·{" "}
              {consulta.sede}
              {consulta.doctora_nombre ? ` · ${consulta.doctora_nombre}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HistorialPaciente nombre={nombre} consultas={historial} />
            {medicamentos.length > 0 && (
              <a
                href={`/dashboard/consultas/${consulta.id}/receta`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Receta en PDF
              </a>
            )}
            <a
              href={enGoogle}
              target="_blank"
              rel="noopener noreferrer"
              title="Agrega solo esta cita. Para ver toda la agenda, suscríbete en Calendario."
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Agregar a Google Calendar
            </a>
            {paciente && (
              <Link
                href={`/dashboard/pacientes/${paciente.id}`}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Ver expediente
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ControlesConsulta consultaId={consulta.id} estado={consulta.estado} fechaISO={consulta.fecha} />
      </div>

      {/* Contexto del paciente: lo que la doctora necesita a la vista */}
      {paciente && (
        <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato
            etiqueta={tipoIdentificacion(paciente.tipo_identificacion)}
            valor={paciente.numero_identificacion}
          />
          <Dato
            etiqueta="Nacimiento"
            valor={format(new Date(`${paciente.fecha_nacimiento}T12:00:00`), "d MMM yyyy", { locale: es })}
          />
          <Dato etiqueta="Teléfono" valor={paciente.telefono} />
          <Dato etiqueta="Correo" valor={paciente.email ?? "Sin correo"} />
          <Dato
            etiqueta="Consentimiento"
            valor={
              paciente.consentimiento_aceptado_en
                ? `Aceptado el ${format(new Date(paciente.consentimiento_aceptado_en), "d MMM yyyy", { locale: es })}` +
                  (paciente.consentimiento_version ? ` · ${paciente.consentimiento_version}` : "")
                : "Pendiente — fírmalo en la clínica"
            }
          />
          {consulta.motivo && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Dato etiqueta="Motivo de la visita" valor={consulta.motivo} />
            </div>
          )}
          {paciente.condiciones_medicas && (
            <div className="sm:col-span-2">
              <Dato etiqueta="Condiciones médicas" valor={paciente.condiciones_medicas} />
            </div>
          )}
          {paciente.medicamentos_actuales && (
            <div className="sm:col-span-2">
              <Dato etiqueta="Medicamentos actuales" valor={paciente.medicamentos_actuales} />
            </div>
          )}
        </div>
      )}

      <CierreConsultaForm
        consulta={{
          id: consulta.id,
          diagnostico: consulta.diagnostico,
          cie10: consulta.diagnostico_cie10,
          cie10Descripcion: consulta.diagnostico_cie10_desc,
          tratamiento: consulta.tratamiento,
          notas: consulta.notas,
          notas_ampliadas: consulta.notas_ampliadas,
          proxima_control: consulta.proxima_control,
          cerrada,
          recetaEnviada: Boolean(consulta.receta_enviada),
        }}
        facturacion={{
          nit: paciente?.nit ?? null,
          direccion: paciente?.direccion ?? null,
          nombre,
          tieneCorreo: Boolean(paciente?.email),
        }}
        medicamentosIniciales={medicamentos}
      />
    </div>
  );
}

/**
 * "Ana Pérez" y "Ana María Pérez López" son la misma persona; "Ana Díaz" y
 * "Sofía Díaz", no. Todas las palabras del nombre corto deben estar en el largo.
 */
function mismoNombre(a: string | null, b: string | null) {
  const palabras = (t: string | null) =>
    (t ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  const [corto, largo] = [palabras(a), palabras(b)].sort((x, y) => x.length - y.length);
  return corto.length > 0 && corto.every((p) => largo.includes(p));
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {etiqueta}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{valor}</p>
    </div>
  );
}
