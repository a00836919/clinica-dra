import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { estadoConsulta, ESTADOS_CERRADOS } from "@/lib/estados";
import { CierreConsultaForm } from "@/components/dashboard/cierre-consulta-form";
import { ControlesConsulta } from "@/components/dashboard/controles-consulta";
import type { Medicamento } from "@/app/actions";

export default async function ConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: consulta } = await supabase
    .from("consultas")
    .select(
      `id, fecha, motivo, estado, sede, diagnostico, tratamiento, notas, notas_ampliadas,
       proxima_control, receta_enviada, receta_enviada_en, doctora_nombre,
       paciente_nombre, paciente_telefono, origen,
       paciente:pacientes!consultas_paciente_id_fkey(
         id, primer_nombre, primer_apellido, telefono, email, nit, direccion,
         fecha_nacimiento, numero_identificacion, condiciones_medicas, medicamentos_actuales
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
    numero_identificacion: string;
    condiciones_medicas: string | null;
    medicamentos_actuales: string | null;
  } | null;

  const receta = Array.isArray(consulta.recetas) ? consulta.recetas[0] : null;
  const medicamentos = (receta?.medicamentos ?? []) as Medicamento[];
  const est = estadoConsulta(consulta.estado);
  const cerrada = ESTADOS_CERRADOS.includes(consulta.estado);
  const nombre = paciente
    ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
    : (consulta.paciente_nombre ?? "Paciente");

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

      <div className="mb-6">
        <ControlesConsulta consultaId={consulta.id} estado={consulta.estado} fechaISO={consulta.fecha} />
      </div>

      {/* Contexto del paciente: lo que la doctora necesita a la vista */}
      {paciente && (
        <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="DPI" valor={paciente.numero_identificacion} />
          <Dato
            etiqueta="Nacimiento"
            valor={format(new Date(`${paciente.fecha_nacimiento}T12:00:00`), "d MMM yyyy", { locale: es })}
          />
          <Dato etiqueta="Teléfono" valor={paciente.telefono} />
          <Dato etiqueta="Correo" valor={paciente.email ?? "Sin correo"} />
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
