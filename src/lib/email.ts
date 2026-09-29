import nodemailer, { type Transporter } from "nodemailer";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ACLARACION_PRECIO, PRECIO_CONSULTA_TEXTO } from "@/lib/precios";
import { nombreSedeCompleto, SIN_PREFERENCIA } from "@/lib/sedes";

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

// ── Transporte: Gmail de la clínica por SMTP ─────────────────────────────────
// No hay dominio propio, así que los correos salen desde la cuenta de Gmail de
// la clínica con una contraseña de aplicación. Gmail los firma como suyos
// (SPF y DKIM propios), que entrega bastante mejor que mandar "desde" un
// gmail.com a través de un proveedor externo, donde DMARC suele fallar.
//
// El día que haya dominio, esto es lo único que cambia: el resto del archivo
// —plantillas, resultados, llamadas— se queda igual.

const NOMBRE_REMITENTE = process.env.EMAIL_FROM_NAME ?? "Skin Clinic GT";

let transporte: Transporter | null = null;
let avisoConfig = false;

function obtenerTransporte(): Transporter | null {
  const user = process.env.GMAIL_USER;
  // Google entrega la contraseña de aplicación en bloques separados por
  // espacios; SMTP la quiere sin ellos. Es el tropiezo más común al copiarla.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    if (!avisoConfig) {
      avisoConfig = true;
      console.error(
        "[email] Faltan GMAIL_USER y/o GMAIL_APP_PASSWORD. Ningún correo va a " +
          "salir. La contraseña de aplicación se genera en la Cuenta de Google " +
          "→ Seguridad → Contraseñas de aplicaciones (requiere verificación en " +
          "dos pasos activada).",
      );
    }
    return null;
  }

  transporte ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    // Sin límites, un SMTP que no responde deja al paciente con el formulario
    // girando: es preferible fallar rápido y avisar que el correo no salió.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    pool: true,
    maxConnections: 2,
  });

  return transporte;
}

/** Traduce los fallos típicos de Gmail a algo accionable en los logs. */
function explicarFallo(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const texto = e?.message ?? String(err);

  if (e?.code === "EAUTH" || e?.responseCode === 535) {
    return (
      "Gmail rechazó las credenciales. Revisa que GMAIL_APP_PASSWORD sea una " +
      "contraseña de aplicación (16 caracteres) y no la contraseña normal de la " +
      "cuenta, y que la verificación en dos pasos esté activada."
    );
  }
  if (e?.code === "EENVELOPE") return `Dirección de destino inválida: ${texto}`;
  if (e?.code === "ETIMEDOUT" || e?.code === "ECONNECTION") {
    return `No se pudo conectar con smtp.gmail.com: ${texto}`;
  }
  if (e?.responseCode === 550 || e?.responseCode === 552) {
    return `Gmail rechazó el mensaje: ${texto}`;
  }
  return texto;
}

export type Adjunto = { filename: string; content: Uint8Array; contentType: string };

async function enviar({
  to,
  subject,
  html,
  adjuntos,
}: {
  to: string;
  subject: string;
  html: string;
  adjuntos?: Adjunto[];
}): Promise<ResultadoEmail> {
  const t = obtenerTransporte();
  if (!t) {
    return { ok: false, motivo: "El envío de correos no está configurado." };
  }

  const user = process.env.GMAIL_USER!;

  try {
    const info = await t.sendMail({
      // Gmail reescribe el remitente a la cuenta autenticada, así que se pone
      // esa misma dirección y solo se personaliza el nombre visible.
      from: `"${NOMBRE_REMITENTE}" <${user}>`,
      to,
      // Las respuestas del paciente caen en el buzón de la clínica.
      replyTo: process.env.EMAIL_REPLY_TO || user,
      subject,
      html,
      attachments: adjuntos?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    });

    console.log(`[email] "${subject}" → ${ofuscar(to)} enviado (${info.messageId})`);
    return { ok: true, id: info.messageId };
  } catch (err) {
    const motivo = explicarFallo(err);
    console.error(`[email] "${subject}" → ${ofuscar(to)} falló:`, motivo);
    return { ok: false, motivo };
  }
}

/** "Galerías Tiffany · Zona 14", o nada si el paciente no eligió sede. */
function sedeVisible(sede?: string | null) {
  if (!sede || sede === SIN_PREFERENCIA) return null;
  return nombreSedeCompleto(sede);
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
  /** Hora "HH:mm" de la cita ya agendada. Una solicitud todavía no la tiene. */
  hora?: string | null;
  sede?: string | null;
};

// ── 1. Confirmación de solicitud recibida (al enviar el formulario) ────────────

export async function enviarConfirmacionSolicitud({
  to,
  nombre,
  fechaPreferida,
  hora,
  sede,
}: CitaEmail) {
  const html = shell({
    titulo: "Solicitud recibida",
    cuerpo: `
          ${saludo(`Hola <strong>${esc(nombre)}</strong>, recibimos tu solicitud de cita.
            Te contactamos en menos de <strong>24 horas</strong> para confirmar tu hora.`)}

          ${datosBox([
            [hora ? "Día solicitado" : "Fecha aproximada", fechaLarga(fechaPreferida)],
            ["Hora solicitada", hora],
            ["Sede", sedeVisible(sede)],
            ["Costo de la consulta", PRECIO_CONSULTA_TEXTO],
          ])}

          ${nota(ACLARACION_PRECIO)}

          ${nota(`Todavía <strong>no es una cita confirmada</strong>: te enviaremos un segundo
            correo cuando la clínica confirme tu hora. Recuerda traer tu DPI o pasaporte el día
            de la consulta.`)}`,
  });

  return enviar({ to, subject: "Solicitud de cita recibida — Skin Clinic GT", html });
}

// ── 2. Cita confirmada por la clínica ─────────────────────────────────────────

export async function enviarConfirmacionAprobacion({
  to,
  nombre,
  fechaPreferida,
  hora,
  sede,
}: CitaEmail) {
  const html = shell({
    titulo: "¡Tu cita está confirmada!",
    cuerpo: `
          ${saludo(`Hola <strong>${esc(nombre)}</strong>, tu cita en Skin Clinic GT ha sido confirmada.
            Te esperamos con gusto.`)}

          ${datosBox([
            ["Fecha", fechaLarga(fechaPreferida)],
            ["Hora", hora],
            ["Sede", sedeVisible(sede)],
            ["Costo de la consulta", PRECIO_CONSULTA_TEXTO],
          ])}

          ${nota(ACLARACION_PRECIO)}

          ${nota(`Recuerda traer tu DPI o pasaporte el día de la consulta. Si necesitas cancelar o
            reagendar, entra a <strong>Mis citas</strong> en nuestro sitio con tu identificación y
            fecha de nacimiento, o contáctanos con anticipación.`)}`,
  });

  return enviar({ to, subject: "Tu cita está confirmada — Skin Clinic GT", html });
}

// ── 2b. Cita reprogramada ────────────────────────────────────────────────────
// Antes se reusaba la confirmación, y un "¡Tu cita está confirmada!" no le dice
// al paciente que lo que cambió fue el día: llega a la hora vieja.

export async function enviarCitaReprogramada({
  to,
  nombre,
  fechaPreferida,
  hora,
  sede,
}: CitaEmail) {
  const html = shell({
    titulo: "Tu cita cambió de fecha",
    cuerpo: `
          ${saludo(`Hola <strong>${esc(nombre)}</strong>, movimos tu cita en Skin Clinic GT.
            Estos son los datos nuevos:`)}

          ${datosBox([
            ["Fecha", fechaLarga(fechaPreferida)],
            ["Hora", hora],
            ["Sede", sedeVisible(sede)],
          ])}

          ${nota(`Si el nuevo horario no te queda, escríbenos o entra a <strong>Mis citas</strong>
            en nuestro sitio con tu identificación y fecha de nacimiento.`)}`,
  });

  return enviar({ to, subject: "Tu cita cambió de fecha — Skin Clinic GT", html });
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
            ["Sede", sedeVisible(sede)],
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
  cie10,
  tratamiento,
  notas,
  medicamentos,
  receta,
}: {
  to: string;
  pacienteNombre: string;
  fechaConsulta: Date | string;
  doctoraNombre: string;
  sede?: string | null;
  diagnostico?: string | null;
  /** "L70.0 — Acné vulgar". Es lo que pide el seguro. */
  cie10?: string | null;
  tratamiento?: string | null;
  notas?: string | null;
  medicamentos?: Medicamento[] | null;
  /** La receta en PDF con membrete, firma y sello. */
  receta?: Adjunto | null;
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
            <strong>${esc(doctoraNombre)}</strong>${sede ? ` en ${esc(nombreSedeCompleto(sede))}` : ""}.
          </p>

          <div style="border-top:1px solid ${COLORS.border};padding-top:24px;margin-bottom:24px;">
            ${diagnostico ? seccion("Diagnóstico", diagnostico) : ""}
            ${cie10 ? seccion("Código CIE-10", cie10) : ""}
            ${tratamiento ? seccion("Tratamiento indicado", tratamiento) : ""}
            ${notas ? seccion("Notas adicionales", notas) : ""}
            ${medicamentosHtml}
          </div>

          ${
            receta
              ? nota(`Adjuntamos tu <strong>receta en PDF</strong> con el membrete de la clínica.
            Puedes imprimirla o mostrarla desde el teléfono en la farmacia.`) + "<br/>"
              : ""
          }

          ${nota(`Si tienes dudas sobre tu tratamiento, contáctanos respondiendo este correo o
            llámanos directamente. Recuerda seguir las indicaciones de tu doctora al pie de la letra.`)}`,
    footerNota: "Este correo es generado automáticamente, por favor no responder.",
  });

  return enviar({
    to,
    subject: `Tu consulta del ${fechaStr} — Skin Clinic GT`,
    html,
    adjuntos: receta ? [receta] : undefined,
  });
}
