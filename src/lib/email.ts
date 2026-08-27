import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ── Confirmación de solicitud de cita ──────────────────────────────────────────

export async function enviarConfirmacionSolicitud({
  to,
  nombre,
  fechaPreferida,
  sede,
}: {
  to: string;
  nombre: string;
  fechaPreferida?: string | null;
  sede?: string | null;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM ?? "Skin Clinic GT <onboarding@resend.dev>";

  const fechaStr = fechaPreferida
    ? format(parseISO(fechaPreferida), "d 'de' MMMM yyyy", { locale: es })
    : null;

  const primaryColor = "#C9A99A";
  const bgColor = "#FAFAF9";
  const textColor = "#1A1A1A";
  const mutedColor = "#6B5B52";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0EBEA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBEA;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

        <tr><td style="background:${primaryColor};padding:32px 40px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);font-weight:500;">Skin Clinic GT</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:600;color:#fff;">Solicitud recibida</p>
        </td></tr>

        <tr><td style="padding:36px 40px;background:${bgColor};">
          <p style="margin:0 0 20px;font-size:15px;color:${textColor};">
            Hola <strong>${nombre}</strong>, recibimos tu solicitud de cita.
            Te contactamos en menos de <strong>24 horas</strong> para confirmar tu hora.
          </p>

          <div style="border:1px solid #E8DDD9;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            ${fechaStr ? `<p style="margin:0 0 8px;font-size:13px;color:${mutedColor};">
              <span style="font-weight:600;color:${textColor};">Fecha aproximada:</span> ${fechaStr}
            </p>` : ""}
            ${sede && sede !== "Sin preferencia" ? `<p style="margin:0;font-size:13px;color:${mutedColor};">
              <span style="font-weight:600;color:${textColor};">Sede:</span> ${sede}
            </p>` : ""}
          </div>

          <p style="margin:0;font-size:12px;color:${mutedColor};line-height:1.7;">
            Si tienes alguna pregunta antes de tu cita, puedes contactarnos directamente.
            Recuerda traer tu DPI el día de la consulta.
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px;background:#F5EFED;border-top:1px solid #E8DDD9;">
          <p style="margin:0;font-size:11px;color:${mutedColor};text-align:center;">
            Skin Clinic GT · Dermatología &amp; Estética Avanzada · Guatemala
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Solicitud de cita recibida — Skin Clinic GT",
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ── Confirmación de aprobación de cita (secretaria) ───────────────────────────

export async function enviarConfirmacionAprobacion({
  to,
  nombre,
  fechaPreferida,
  sede,
}: {
  to: string;
  nombre: string;
  fechaPreferida?: string | null;
  sede?: string | null;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM ?? "Skin Clinic GT <onboarding@resend.dev>";

  const fechaStr = fechaPreferida
    ? format(parseISO(fechaPreferida), "d 'de' MMMM yyyy", { locale: es })
    : null;

  const primaryColor = "#C9A99A";
  const bgColor = "#FAFAF9";
  const textColor = "#1A1A1A";
  const mutedColor = "#6B5B52";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0EBEA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBEA;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

        <tr><td style="background:${primaryColor};padding:32px 40px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);font-weight:500;">Skin Clinic GT</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:600;color:#fff;">¡Tu cita está confirmada!</p>
        </td></tr>

        <tr><td style="padding:36px 40px;background:${bgColor};">
          <p style="margin:0 0 20px;font-size:15px;color:${textColor};">
            Hola <strong>${nombre}</strong>, tu cita en Skin Clinic GT ha sido confirmada.
            Te esperamos con gusto.
          </p>

          <div style="border:1px solid #E8DDD9;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            ${fechaStr ? `<p style="margin:0 0 8px;font-size:13px;color:${mutedColor};">
              <span style="font-weight:600;color:${textColor};">Fecha:</span> ${fechaStr}
            </p>` : ""}
            ${sede && sede !== "Sin preferencia" ? `<p style="margin:0;font-size:13px;color:${mutedColor};">
              <span style="font-weight:600;color:${textColor};">Sede:</span> ${sede}
            </p>` : ""}
          </div>

          <p style="margin:0;font-size:12px;color:${mutedColor};line-height:1.7;">
            Recuerda traer tu DPI el día de la consulta. Si necesitas cancelar o
            reagendar, contáctanos con anticipación.
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px;background:#F5EFED;border-top:1px solid #E8DDD9;">
          <p style="margin:0;font-size:11px;color:${mutedColor};text-align:center;">
            Skin Clinic GT · Dermatología &amp; Estética Avanzada · Guatemala
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Tu cita está confirmada — Skin Clinic GT",
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ── Receta al finalizar consulta ───────────────────────────────────────────────

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
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM ?? "Skin Clinic GT <onboarding@resend.dev>";

  const fechaStr = format(new Date(fechaConsulta), "d 'de' MMMM yyyy", { locale: es });

  const html = buildRecetaHtml({
    pacienteNombre,
    fechaStr,
    doctoraNombre,
    sede,
    diagnostico,
    tratamiento,
    notas,
    medicamentos,
  });

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Tu consulta del ${fechaStr} — Skin Clinic GT`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

function buildRecetaHtml({
  pacienteNombre,
  fechaStr,
  doctoraNombre,
  sede,
  diagnostico,
  tratamiento,
  notas,
  medicamentos,
}: {
  pacienteNombre: string;
  fechaStr: string;
  doctoraNombre: string;
  sede?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  notas?: string | null;
  medicamentos?: Medicamento[] | null;
}) {
  const primaryColor = "#C9A99A";
  const bgColor = "#FAFAF9";
  const textColor = "#1A1A1A";
  const mutedColor = "#6B5B52";

  const seccion = (titulo: string, contenido: string) => `
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${primaryColor};font-weight:600;">${titulo}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${textColor};">${contenido.replace(/\n/g, "<br/>")}</p>
    </div>`;

  const medicamentosHtml = medicamentos?.length
    ? `<div style="margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${primaryColor};font-weight:600;">Medicamentos recetados</p>
        ${medicamentos.map((m) => `
          <div style="border:1px solid #E8DDD9;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
            <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${textColor};">${m.nombre}</p>
            ${m.dosis ? `<p style="margin:0 0 2px;font-size:12px;color:${mutedColor};">Dosis: ${m.dosis}</p>` : ""}
            ${m.instrucciones ? `<p style="margin:0;font-size:12px;color:${mutedColor};">${m.instrucciones}</p>` : ""}
          </div>`).join("")}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0EBEA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBEA;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${primaryColor};padding:32px 40px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);font-weight:500;">Skin Clinic GT</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:600;color:#fff;">Resumen de consulta</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${fechaStr}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;background:${bgColor};">
          <p style="margin:0 0 28px;font-size:15px;color:${textColor};">
            Hola <strong>${pacienteNombre}</strong>, aquí está el resumen de tu consulta con
            <strong>${doctoraNombre}</strong>${sede ? ` en ${sede}` : ""}.
          </p>

          <div style="border-top:1px solid #E8DDD9;padding-top:24px;margin-bottom:24px;">
            ${diagnostico ? seccion("Diagnóstico", diagnostico) : ""}
            ${tratamiento ? seccion("Tratamiento indicado", tratamiento) : ""}
            ${notas ? seccion("Notas adicionales", notas) : ""}
            ${medicamentosHtml}
          </div>

          <p style="margin:0;font-size:12px;color:${mutedColor};line-height:1.6;">
            Si tienes dudas sobre tu tratamiento, contáctanos respondiendo este correo o
            llámanos directamente. Recuerda seguir las indicaciones de tu doctora al pie de la letra.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;background:#F5EFED;border-top:1px solid #E8DDD9;">
          <p style="margin:0;font-size:11px;color:${mutedColor};text-align:center;">
            Skin Clinic GT · Dermatología &amp; Estética Avanzada · Guatemala<br/>
            Este correo es generado automáticamente, por favor no responder.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
