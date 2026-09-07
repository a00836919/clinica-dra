import { suscripcionCalendario } from "@/app/actions";
import { PanelCalendario } from "@/components/dashboard/panel-calendario";
import { horarioPublicado } from "@/lib/disponibilidad";
import { nombreSedeCompleto } from "@/lib/sedes";

/**
 * Suscripción de la agenda al calendario personal de la doctora.
 *
 * El enlace se genera aquí, del lado del servidor, porque necesita la sesión
 * del staff: cada quien ve el suyo y nadie ve el de otra.
 */
export default async function CalendarioPage() {
  const suscripcion = await suscripcionCalendario();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Calendario</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Conecta tu agenda de Skin Clinic GT con Google Calendar, el calendario del iPhone o
          Outlook. Las citas aparecen solas y se actualizan cuando cambian aquí.
        </p>
      </div>

      {"error" in suscripcion ? (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm" style={{ color: "oklch(0.5 0.14 25)" }}>
            {suscripcion.error}
          </p>
        </div>
      ) : (
        <PanelCalendario inicial={suscripcion} />
      )}

      <section className="mt-6 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Horario publicado</h2>
        <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
          Es el horario que ve el paciente en el sitio y el único en el que se pueden pedir citas
          por la web. Se cambia en <code className="text-[11px]">src/lib/disponibilidad.ts</code>.
        </p>
        <ul className="flex flex-col gap-2">
          {horarioPublicado().map((h) => (
            <li
              key={`${h.sede}-${h.desde}-${h.etiquetaDias}`}
              className="flex flex-wrap items-baseline gap-x-2 text-sm text-foreground"
            >
              <span className="font-medium">{h.etiquetaDias}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{nombreSedeCompleto(h.sede)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums text-muted-foreground">{h.etiquetaHoras}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
