/**
 * Consentimiento informado que el paciente acepta al pedir su cita.
 *
 * El texto vive en código y lleva versión: lo que hay que poder demostrar años
 * después no es "aceptó", sino "aceptó esto". Cuando el texto cambie, sube
 * `VERSION_CONSENTIMIENTO`; las aceptaciones viejas siguen apuntando a la
 * versión que el paciente sí leyó.
 *
 * Ojo: es un texto base. La doctora debe revisarlo con su asesor legal antes de
 * usarlo en firme, y el consentimiento específico de cada procedimiento se
 * firma aparte, en la clínica, antes de realizarlo.
 */

import { ACLARACION_PRECIO } from "@/lib/precios";

export const VERSION_CONSENTIMIENTO = "2026-09-v1";

export type SeccionConsentimiento = { titulo: string; parrafos: string[] };

export const CONSENTIMIENTO: SeccionConsentimiento[] = [
  {
    titulo: "Qué estás aceptando",
    parrafos: [
      "Autorizas a la doctora de Skin Clinic GT a evaluarte: revisar tu piel, pelo y uñas, hacerte preguntas sobre tu salud, tomar fotografías clínicas cuando sean necesarias para el diagnóstico o el seguimiento, y usar dermatoscopio o tricoscopio, que no duelen ni son invasivos.",
      "La consulta es una evaluación médica, no una promesa de resultado. La respuesta a un tratamiento depende de cada persona y puede requerir ajustes o varias sesiones.",
    ],
  },
  {
    titulo: "Procedimientos",
    parrafos: [
      "Este consentimiento cubre la consulta. Cualquier procedimiento —biopsia, infiltración, crioterapia, láser, toxina botulínica, rellenos, peelings, extracciones, cirugía menor— se explica aparte el día que se realice y se firma su propio consentimiento, con sus riesgos, cuidados y precio.",
      "Puedes negarte a cualquier procedimiento o suspenderlo en cualquier momento, sin que eso afecte tu atención.",
    ],
  },
  {
    titulo: "Riesgos generales",
    parrafos: [
      "Los tratamientos dermatológicos pueden causar irritación, enrojecimiento, resequedad, ardor, cambios de pigmentación o reacciones alérgicas. Los procedimientos con aguja o bisturí pueden dejar hematoma, infección o cicatriz. Avísale a la doctora si estás embarazada, dando de lactar, si tomas algún medicamento o si tienes alergias.",
      "Si aparece algo que no esperabas después de una consulta o un procedimiento, contáctanos: hacerlo a tiempo cambia el resultado.",
    ],
  },
  {
    titulo: "Costo de la consulta",
    parrafos: [
      ACLARACION_PRECIO,
      "Si necesitas factura, dinos tu NIT en la clínica; sin NIT se factura como consumidor final.",
    ],
  },
  {
    titulo: "Tus datos",
    parrafos: [
      "Guardamos tus datos personales y clínicos para atenderte y llevar tu expediente. Los usamos solo para eso: agendarte, darte seguimiento, enviarte tu receta y el resumen de tu consulta al correo que registraste, y cumplir con lo que exige la ley.",
      "No los vendemos ni los compartimos con terceros ajenos a tu atención. Las fotografías clínicas son parte de tu expediente y no se publican ni se usan con fines de promoción sin tu autorización expresa y aparte.",
      "Puedes pedir copia de tu expediente, corregir un dato equivocado o pedir que dejemos de contactarte escribiéndonos.",
    ],
  },
  {
    titulo: "Citas y cancelaciones",
    parrafos: [
      "Solicitar una cita por el sitio no la confirma: la clínica te contacta para confirmarla. Si no vas a poder llegar, cancela desde el portal o avísanos con anticipación para dársela a otro paciente.",
      "Llega con tu DPI o pasaporte: sin identificación no podemos abrir ni actualizar tu expediente.",
    ],
  },
];

/** La línea que acompaña a la casilla del formulario. */
export const RESUMEN_CONSENTIMIENTO =
  "He leído y acepto el consentimiento informado y el tratamiento de mis datos personales y clínicos.";
