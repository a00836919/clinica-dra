import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con llave de servicio para los flujos públicos (solicitar cita y
 * portal de pacientes).
 *
 * Por qué: el rol `anon` no tiene —ni debe tener— permisos sobre `pacientes`,
 * `solicitudes_cita` ni `consultas`. Abrirle esas tablas al público expondría
 * datos médicos. En su lugar, estas operaciones corren solo en el servidor,
 * dentro de acciones "use server", y el acceso lo controla nuestro código:
 * verificamos DPI + fecha de nacimiento antes de devolver nada, y la cookie
 * firmada del portal limita cada consulta al paciente de la sesión.
 *
 * SUPABASE_SERVICE_ROLE_KEY no lleva el prefijo NEXT_PUBLIC_, así que nunca
 * llega al navegador.
 */

let cliente: SupabaseClient | null = null;
let avisoDado = false;

export function createAdminClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() solo puede usarse en el servidor.");
  }

  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (!avisoDado) {
      avisoDado = true;
      console.error(
        "[supabase] Falta SUPABASE_SERVICE_ROLE_KEY. El formulario de citas y el " +
          "portal de pacientes no pueden leer ni escribir sin ella: el rol anon no " +
          "tiene permisos sobre las tablas de pacientes. Agrégala a .env.local y a " +
          "las variables de entorno de Vercel (Project Settings → Environment Variables).",
      );
    }
    return null;
  }

  cliente = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cliente;
}

export const ERROR_CONFIG =
  "El servicio de citas no está configurado correctamente. Escríbenos y te agendamos de una vez.";
