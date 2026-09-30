import { createClient } from "@/lib/supabase/server";
import { etiquetaCie10 } from "@/lib/cie10";
import { leerMedicamentos } from "@/lib/medicamentos";
import { generarRecetaPdf, nombreArchivoReceta } from "@/lib/receta-pdf";

/**
 * La receta de una consulta en PDF, para reimprimirla o reenviarla a mano.
 *
 * Se arma con lo guardado en la base, igual que la que se adjunta al correo.
 * Solo la ve el personal: el proxy ya exige sesión en /dashboard, y aquí se
 * vuelve a revisar porque una ruta de archivo no pasa por el layout.
 */
export async function GET(_request: Request, ctx: RouteContext<"/dashboard/consultas/[id]/receta">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Necesitas iniciar sesión.", { status: 401 });

  const { data: consulta } = await supabase
    .from("consultas")
    .select(
      `id, fecha, diagnostico, diagnostico_cie10, diagnostico_cie10_desc, tratamiento,
       proxima_control, paciente_nombre, doctora_nombre,
       doctora:staff!consultas_doctora_id_fkey(nombre_completo, nombre_agenda),
       paciente:pacientes!consultas_paciente_id_fkey(primer_nombre, primer_apellido),
       recetas(medicamentos)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!consulta) return new Response("No encontramos esa consulta.", { status: 404 });

  const uno = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
  const receta = uno(consulta.recetas as { medicamentos: unknown }[] | null);
  const medicamentos = leerMedicamentos(receta?.medicamentos);
  if (!medicamentos.length) {
    return new Response("Esta consulta no tiene receta.", { status: 404 });
  }

  const paciente = uno(consulta.paciente as { primer_nombre: string; primer_apellido: string }[] | null);
  const doctora = uno(
    consulta.doctora as { nombre_completo: string | null; nombre_agenda: string | null }[] | null,
  );
  const nombre = paciente
    ? `${paciente.primer_nombre} ${paciente.primer_apellido}`
    : (consulta.paciente_nombre ?? "Paciente");

  const pdf = await generarRecetaPdf({
    paciente: nombre,
    fecha: consulta.fecha,
    doctora: doctora?.nombre_completo ?? doctora?.nombre_agenda ?? consulta.doctora_nombre,
    diagnostico: consulta.diagnostico,
    cie10: etiquetaCie10(consulta.diagnostico_cie10, consulta.diagnostico_cie10_desc),
    medicamentos,
    indicaciones: consulta.tratamiento,
    proximoControl: consulta.proxima_control,
  });

  const archivo = nombreArchivoReceta(nombre, consulta.fecha);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // inline: se abre en el visor del navegador, desde donde se imprime.
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(archivo)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
