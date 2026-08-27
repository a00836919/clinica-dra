import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function PacientesPage() {
  const supabase = await createClient();

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select(
      `id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
       fecha_nacimiento, telefono, email, creado_en,
       doctora_principal:staff(nombre_completo)`
    )
    .order("creado_en", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[1.75rem] font-medium leading-tight text-foreground"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Pacientes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pacientes?.length ?? 0} pacientes registrados
          </p>
        </div>
      </div>

      {!pacientes || pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Aún no hay pacientes registrados
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
          <div className="divide-y divide-border/40">
            {pacientes.map((p) => {
              const nombre = [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
                .filter(Boolean)
                .join(" ");
              const doctora = (Array.isArray(p.doctora_principal)
                ? p.doctora_principal[0]
                : p.doctora_principal) as { nombre_completo: string } | null;
              const edad = p.fecha_nacimiento
                ? Math.floor(
                    (Date.now() - new Date(p.fecha_nacimiento).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null;

              return (
                <Link
                  key={p.id}
                  href={`/dashboard/pacientes/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/20 transition-colors cursor-pointer group"
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                    style={{ background: "oklch(0.72 0.065 25)" }}
                  >
                    {p.primer_nombre?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {nombre}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {edad !== null ? `${edad} años` : "Edad desconocida"}
                      {p.telefono ? ` · ${p.telefono}` : ""}
                    </p>
                  </div>

                  {doctora && (
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {doctora.nombre_completo}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground/60 hidden lg:block flex-shrink-0">
                    {format(new Date(p.creado_en), "d MMM yyyy", { locale: es })}
                  </span>

                  <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors text-sm">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
