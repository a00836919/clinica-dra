import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ── Plantilla compartida ──────────────────────────────────────────────────────

const COLORS = {
  primary: "#C9A99A",
  bg: "#FAFAF9",
  text: "#1A1A1A",
  muted: "#6B5B52",
  page: "#F0EBEA",
  border: "#E8DDD9",
  footer: "#F5EFED",
};

const FOOTER_BASE = "Skin Clinic GT · Dermatología &amp; Estética Avanzada · Guatemala";

function resend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function from() {
  return process.env.RESEND_FROM ?? "Skin Clinic GT <onboarding@resend.dev>";
}

/** Escapa datos que vienen de la base de datos antes de meterlos en el HTML. */
function esc(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fechaLarga(fecha: Date | string | null | undefined) {
  if (!fecha) return null;
  const d = typeof fecha === "string" ? parseISO(fecha) : fecha;
  return format(d, "d 'de' MMMM yyyy", { locale: es });
}

/** Caja con pares etiqueta/valor. Devuelve "" si no hay ningún dato. */
function datosBox(filas: Array<[string, string | null | undefined]>) {
  const visibles = filas.filter(([, valor]) => valor);
  if (!visibles.length) return "";

  const items = visibles
    .map(
      ([etiqueta, valor], i) => `<p style="margin:0${i < visibles.length - 1 ? " 0 8px" : ""};font-size:13px;color:${COLORS.muted};">
              <span style="font-weight:600;color:${COLORS.text};">${etiqueta}:</span> ${esc(valor)}
            </p>`,
    )
    .join("\n            ");

  return `<div style="border:1px solid ${COLORS.border};border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            ${items}
          </div>`;
}

function shell({
  titulo,
  subtitulo,
  cuerpo,
  footerNota,
}: {
  titulo: string;
  subtitulo?: string | null;
  cuerpo: string;
  footerNota?: string | null;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

        <tr><td style="background:${COLORS.primary};padding:32px 40px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);font-weight:500;">Skin Clinic GT</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:600;color:#fff;">${titulo}</p>
          ${subtitulo ? `<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${subtitulo}</p>` : ""}
        </td></tr>

        <tr><td style="padding:36px 40px;background:${COLORS.bg};">
          ${cuerpo}
        </td></tr>

        <tr><td style="padding:20px 40px;background:${COLORS.footer};border-top:1px solid ${COLORS.border};">
          <p style="margin:0;font-size:11px;color:${COLORS.muted};text-align:center;">
            ${FOOTER_BASE}${footerNota ? `<br/>${footerNota}` : ""}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Un envío nunca debe tumbar la operación de negocio, pero sí debe poder
 *  reportarse: quien llama decide qué contarle al paciente o a la secretaria. */
export type ResultadoEmail = { ok: true; id?: string } | { ok: false; motivo: string };

/** Oculta la parte local para no dejar correos completos en los logs. */
function ofuscar(correo: string) {
  const [local, dominio] = correo.split("@");
  if (!dominio) return "***";
  return `${local.slice(0, 1)}***@${dominio}`;
}

let avisoRemitente = false;

async function enviar({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResultadoEmail> {
  const remitente = from();

  // Causa más común de "el correo no llega": onboarding@resend.dev es el
  // remitente compartido de pruebas de Resend y solo entrega al correo del
  // dueño de la cuenta. A un paciente nunca le va a llegar.
  if (remitente.includes("onboarding@resend.dev") && !avisoRemitente) {
    avisoRemitente = true;
    console.warn(
      "[email] RESEND_FROM apunta a onboarding@resend.dev, el remitente de pruebas " +
        "de Resend: solo entrega al correo del dueño de la cuenta, así que los " +
        "pacientes no van a recibir nada. Verifica un dominio en Resend y cambia " +
        "RESEND_FROM a una dirección de ese dominio.",
    );
  }

  if (!process.env.RESEND_API_KEY) {
    const motivo = "Falta RESEND_API_KEY";
    console.error(`[email] "${subject}" no se envió: ${motivo}`);
    return { ok: false, motivo };
  }

  try {
    const { data, error } = await resend().emails.send({
      from: remitente,
      to: [to],
      subject,
      html,
    });

    if (error) {
      const motivo = error.message || error.name || "Resend rechazó el envío";
      console.error(`[email] "${subject}" → ${ofuscar(to)} rechazado por Resend:`, motivo);
      return { ok: false, motivo };
    }

    console.log(`[email] "${subject}" → ${ofuscar(to)} enviado (id ${data?.id ?? "?"})`);
    return { ok: true, id: data?.id };
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`[email] "${subject}" → ${ofuscar(to)} falló:`, motivo);
    return { ok: false, motivo };
  }
}

function nota(texto: string) {
  return `<p style="margin:0;font-size:12px;color:${COLORS.muted};line-height:1.7;">${texto}</p>`;
}

function saludo(html: string) {
  return `<p style="margin:0 0 20px;font-size:15px;color:${COLORS.text};">${html}</p>`;
}

type CitaEmail = {
  to: string;
  nombre: string;
  fechaPreferida?: string | null;
  sede?: string | null;
};

// ── 1. Confirmación de solicitud recibida (al enviar el formulario) ────────────

export async function enviarConfirmacionSolicitud({ to, nombre, fechaPreferida, sede }: CitaEmail) {
  const html = shell({
    titulo: "Solicitud recibida",
    cuerpo: `
          ${saludo(`Hola <strong>${esc(nombre)}</strong>, recibimos tu solicitud de cita.
            Te contactamos en menos de <strong>24 horas</strong> para confirmar tu hora.`)}

          ${datosBox([
            ["Fecha aproximada", fechaLarga(fechaPreferida)],
            ["Sede", sede && sede !== "Sin preferencia" ? sede : null],
          ])}

          ${nota(`Todavía <strong>no es una cita confirmada</strong>: te enviaremos un segundo
            correo cuando la clínica confirme tu hora. Recuerda traer tu DPI el día de la consulta.`)}`,
  });

  return enviar({ to, subject: "Solicitud de cita recibida — Skin Clinic GT", html });
}

// ── 2. Cita confirmada por la clínica ─────────────────────────────────────────

export async function enviarConfirmacionAprobacion({ to, nombre, fechaPreferida, sede }: CitaEmail) {
  const html = shell({
    titulo: "¡Tu cita está confirmada!",
    cuerpo: `
          ${saludo(`Hola <strong>${esc(nombre)}</strong>, tu cita en Skin Clinic GT ha sido confirmada.
            Te esperamos con gusto.`)}

          ${datosBox([
            ["Fecha", fechaLarga(fechaPreferida)],
            ["Sede", sede && sede !== "Sin preferencia" ? sede : null],
          ])}

          ${nota(`Recuerda traer tu DPI el día de la consulta. Si necesitas cancelar o
            reagendar, entra a <strong>Mis citas</strong> en nuestro sitio con tu DPI y fecha
            de nacimiento, o contáctanos con anticipación.`)}`,
  });

  return enviar({ to, subject: "Tu cita está confirmada — Skin Clinic GT", html });
}

// ── 3. Cita cancelada ─────────────────────────────────────────────────────────

export async function enviarConfirmacionCancelacion({
  to,
  nombre,
  fechaPreferida,
  sede,
  origen = "clinica",
}: CitaEmail & { origen?: "paciente" | "clinica" }) {
  const cuerpoSaludo =
    origen === "paciente"
      ? `Hola <strong>${esc(nombre)}</strong>, cancelamos tu cita tal como lo solicitaste
         desde el portal de pacientes. Esta es tu constancia.`
      : `Hola <strong>${esc(nombre)}</strong>, tu solicitud de cita fue cancelada por la clínica.
         Si fue un error o quieres reagendar, escríbenos y con gusto te ayudamos.`;

  const cuerpoNota =
    origen === "paciente"
      ? `Si <strong>no fuiste tú</strong> quien canceló, contáctanos de inmediato.
         Puedes solicitar una cita nueva cuando quieras desde nuestro sitio.`
      : `Puedes solicitar una cita nueva cuando quieras desde nuestro sitio.`;

  const html = shell({
    titulo: "Cita cancelada",
    cuerpo: `
          ${saludo(cuerpoSaludo)}

          ${datosBox([
            ["Fecha solicitada", fechaLarga(fechaPreferida)],
            ["Sede", sede && sede !== "Sin preferencia" ? sede : null],
          ])}

          ${nota(cuerpoNota)}`,
  });

  return enviar({ to, subject: "Cita cancelada — Skin Clinic GT", html });
}

// ── 4. Receta al finalizar consulta ───────────────────────────────────────────

interface Medicamento {
  nombre: string;
  dosis?: string;
  instrucciones?: string;
}

export async function enviarRecetaEmail({
  to,
  pacienteNombre,
  fechaConsulta,
  doctoraNombre,
  sede,
  diagnostico,
  tratamiento,
  notas,
  medicamentos,
}: {
  to: string;
  pacienteNombre: string;
  fechaConsulta: Date | string;
  doctoraNombre: string;
  sede?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  notas?: string | null;
  medicamentos?: Medicamento[] | null;
}) {
  const fechaStr = fechaLarga(fechaConsulta)!;

  const seccion = (titulo: string, contenido: string) => `
          <div style="margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${COLORS.primary};font-weight:600;">${titulo}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.text};">${esc(contenido).replace(/\n/g, "<br/>")}</p>
          </div>`;

  const medicamentosHtml = medicamentos?.length
    ? `<div style="margin-bottom:24px;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${COLORS.primary};font-weight:600;">Medicamentos recetados</p>
            ${medicamentos
              .map(
                (m) => `<div style="border:1px solid ${COLORS.border};border-radius:8px;padding:12px 16px;margin-bottom:8px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${COLORS.text};">${esc(m.nombre)}</p>
              ${m.dosis ? `<p style="margin:0 0 2px;font-size:12px;color:${COLORS.muted};">Dosis: ${esc(m.dosis)}</p>` : ""}
              ${m.instrucciones ? `<p style="margin:0;font-size:12px;color:${COLORS.muted};">${esc(m.instrucciones)}</p>` : ""}
            </div>`,
              )
              .join("\n            ")}
          </div>`
    : "";

  const html = shell({
    titulo: "Resumen de consulta",
    subtitulo: fechaStr,
    cuerpo: `
          <p style="margin:0 0 28px;font-size:15px;color:${COLORS.text};">
            Hola <strong>${esc(pacienteNombre)}</strong>, aquí está el resumen de tu consulta con
            <strong>${esc(doctoraNombre)}</strong>${sede ? ` en ${esc(sede)}` : ""}.
          </p>

          <div style="border-top:1px solid ${COLORS.border};padding-top:24px;margin-bottom:24px;">
            ${diagnostico ? seccion("Diagnóstico", diagnostico) : ""}
            ${tratamiento ? seccion("Tratamiento indicado", tratamiento) : ""}
            ${notas ? seccion("Notas adicionales", notas) : ""}
            ${medicamentosHtml}
          </div>

          ${nota(`Si tienes dudas sobre tu tratamiento, contáctanos respondiendo este correo o
            llámanos directamente. Recuerda seguir las indicaciones de tu doctora al pie de la letra.`)}`,
    footerNota: "Este correo es generado automáticamente, por favor no responder.",
  });

  return enviar({ to, subject: `Tu consulta del ${fechaStr} — Skin Clinic GT`, html });
}
