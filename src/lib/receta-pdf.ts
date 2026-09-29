import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Medicamento } from "@/app/actions";
import { enGuatemala } from "@/lib/hora-guatemala";

/**
 * Receta en PDF con el membrete de la clínica.
 *
 * Copia el formato de las recetas que la clínica ya imprimía desde su sistema
 * anterior: logo y datos arriba, paciente y fecha sobre una línea, el logo de
 * marca de agua al centro, y firma con sello a la derecha. Es un documento
 * que el paciente lleva a la farmacia o al seguro, así que se ve como el de
 * siempre, no como un correo.
 *
 * Las imágenes viven en src/assets/receta y se leen del disco. next.config.ts
 * las incluye en el trazado de las rutas del dashboard para que existan en
 * producción.
 */

const CLINICA = {
  razonSocial: "SKIN CLINIC VRG SOCIEDAD ANONIMA",
  nombre: "SKIN CLINIC",
  lineas: [
    "9a Calle 4-52 zona 10 Edificio Integra Medical Center 407-408",
    "vgarcia@doctoravilmagarcia.com",
    "2279-0970",
  ],
  destacadas: [
    "Citas: 2279-0970  4706-7459.",
    "Emergencias: Dra. Vilma Garcia: 3085-4298. Dra. Maria Jose Polanco: 3092-6855",
    "Ig: dermatipsgt skinclinic.gt",
  ],
};

/**
 * Firma y sello por doctora. Se reconoce por el nombre en `staff`, sin tildes
 * ni mayúsculas. Una doctora sin firma aquí recibe una línea para firmar a
 * mano: estampar la firma de otra persona en una receta no es una opción.
 */
const FIRMAS: { coincide: string; archivo: string }[] = [
  { coincide: "maria jose polanco", archivo: "firma-sello-maria-jose-polanco.png" },
];

const CARPETA = path.join(process.cwd(), "src/assets/receta");

// Carta, en puntos.
const ANCHO = 612;
const ALTO = 792;
const MARGEN_X = 57;
const DERECHA = 582;
const LIMITE_INFERIOR = 60;

const NEGRO = rgb(0, 0, 0);
const GRIS = rgb(0.35, 0.35, 0.35);

export type DatosReceta = {
  paciente: string;
  /** ISO de la consulta. */
  fecha: string;
  doctora: string | null;
  diagnostico?: string | null;
  /** "L70.0 — Acné vulgar" */
  cie10?: string | null;
  medicamentos: Medicamento[];
  indicaciones?: string | null;
  proximoControl?: string | null;
};

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function tieneFirma(doctora: string | null | undefined) {
  return Boolean(doctora && FIRMAS.some((f) => normalizar(doctora).includes(f.coincide)));
}

/** "Receta - Ana Pérez - 2026-09-29.pdf" */
export function nombreArchivoReceta(paciente: string, fechaISO: string) {
  const limpio = paciente.replace(/[\\/:*?"<>|]/g, "").trim() || "Paciente";
  return `Receta - ${limpio} - ${enGuatemala(fechaISO).fecha}.pdf`;
}

/** Las fuentes estándar solo codifican Latin-1: lo demás se cambia o se quita. */
function seguro(fuente: PDFFont, texto: string) {
  const reemplazos: Record<string, string> = { "→": "->", "≥": ">=", "≤": "<=", "µ": "u" };
  let salida = "";
  for (const c of texto.replace(/\r/g, "")) {
    // El salto de línea no se dibuja, pero `envolver` lo necesita para separar párrafos.
    if (c === "\n") {
      salida += c;
      continue;
    }
    const candidato = reemplazos[c] ?? c;
    try {
      fuente.encodeText(candidato);
      salida += candidato;
    } catch {
      // Carácter sin representación (emoji, etc.): se omite.
    }
  }
  return salida;
}

/** Parte un texto en líneas que caben en `ancho`, respetando los saltos de línea. */
function envolver(fuente: PDFFont, texto: string, tamano: number, ancho: number) {
  const lineas: string[] = [];
  for (const parrafo of seguro(fuente, texto).split("\n")) {
    let actual = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) {
        actual = prueba;
        continue;
      }
      if (actual) lineas.push(actual);
      actual = palabra;
    }
    lineas.push(actual);
  }
  return lineas;
}

export async function generarRecetaPdf(datos: DatosReceta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Receta — ${datos.paciente}`);
  doc.setAuthor(CLINICA.razonSocial);

  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(await readFile(path.join(CARPETA, "logo.png")));

  const firma = FIRMAS.find((f) => datos.doctora && normalizar(datos.doctora).includes(f.coincide));
  const imagenFirma = firma
    ? await doc.embedPng(await readFile(path.join(CARPETA, firma.archivo)))
    : null;

  const { fecha } = enGuatemala(datos.fecha);
  const [a, m, d] = fecha.split("-");
  const fechaTexto = `${d}/${m}/${a}`;

  let pagina = nuevaPagina(doc, { normal, negrita, logo, paciente: datos.paciente, fecha: fechaTexto });
  let y = 262;

  /** Deja espacio para `alto`; si no cabe, sigue en otra hoja con el mismo membrete. */
  const reservar = (alto: number) => {
    if (y + alto <= ALTO - LIMITE_INFERIOR) return;
    pagina = nuevaPagina(doc, { normal, negrita, logo, paciente: datos.paciente, fecha: fechaTexto });
    y = 262;
  };

  const texto = (contenido: string, x: number, tamano: number, fuente: PDFFont, color = NEGRO) => {
    pagina.drawText(contenido, { x, y: ALTO - y, size: tamano, font: fuente, color });
  };

  const parrafo = (etiqueta: string, contenido: string) => {
    reservar(28);
    texto(seguro(negrita, etiqueta), MARGEN_X, 10, negrita);
    y += 14;
    for (const linea of envolver(normal, contenido, 10, DERECHA - MARGEN_X)) {
      reservar(14);
      texto(linea, MARGEN_X, 10, normal);
      y += 14;
    }
    y += 10;
  };

  if (datos.diagnostico) parrafo("Diagnóstico:", datos.diagnostico);
  if (datos.cie10) parrafo("CIE-10:", datos.cie10);

  if (datos.medicamentos.length) {
    reservar(30);
    texto("Rx", MARGEN_X, 14, negrita);
    y += 22;

    datos.medicamentos.forEach((med, i) => {
      const sangria = MARGEN_X + 16;
      const anchoUtil = DERECHA - sangria;
      const nombre = envolver(negrita, med.nombre, 11, anchoUtil);
      const detalle = [med.dosis, med.instrucciones]
        .filter((t): t is string => Boolean(t?.trim()))
        .flatMap((t) => envolver(normal, t, 10, anchoUtil));

      reservar(nombre.length * 15 + detalle.length * 13 + 12);
      texto(`${i + 1}.`, MARGEN_X, 11, negrita);
      for (const linea of nombre) {
        texto(linea, sangria, 11, negrita);
        y += 15;
      }
      for (const linea of detalle) {
        texto(linea, sangria, 10, normal, GRIS);
        y += 13;
      }
      y += 10;
    });
  }

  if (datos.indicaciones) parrafo("Indicaciones:", datos.indicaciones);
  if (datos.proximoControl) parrafo("Próximo control:", datos.proximoControl);

  // Firma: en el formato original cae arriba a la derecha, bajo el membrete.
  // Si el contenido baja más, va después de él.
  const altoFirma = 100;
  y = Math.max(y + 16, 312);
  reservar(altoFirma);
  dibujarFirma(pagina, { imagen: imagenFirma, doctora: datos.doctora, normal, top: y, alto: altoFirma });

  return doc.save();
}

function nuevaPagina(
  doc: PDFDocument,
  {
    normal,
    negrita,
    logo,
    paciente,
    fecha,
  }: { normal: PDFFont; negrita: PDFFont; logo: PDFImage; paciente: string; fecha: string },
): PDFPage {
  const pagina = doc.addPage([ANCHO, ALTO]);
  const centrado = (contenido: string, top: number, tamano: number, fuente: PDFFont) => {
    const limpio = seguro(fuente, contenido);
    const w = fuente.widthOfTextAtSize(limpio, tamano);
    pagina.drawText(limpio, { x: (ANCHO - w) / 2 + 15, y: ALTO - top, size: tamano, font: fuente, color: NEGRO });
  };

  // Marca de agua primero, para que todo lo demás quede encima.
  const anchoMarca = 210;
  const altoMarca = (anchoMarca * logo.height) / logo.width;
  pagina.drawImage(logo, {
    x: (ANCHO - anchoMarca) / 2,
    y: ALTO - 200 - altoMarca,
    width: anchoMarca,
    height: altoMarca,
    opacity: 0.16,
  });

  // Membrete
  const anchoLogo = 60;
  pagina.drawImage(logo, {
    x: MARGEN_X,
    y: ALTO - 70 - (anchoLogo * logo.height) / logo.width,
    width: anchoLogo,
    height: (anchoLogo * logo.height) / logo.width,
  });

  centrado(CLINICA.razonSocial, 86, 14, negrita);
  centrado(CLINICA.nombre, 103, 12, normal);
  CLINICA.lineas.forEach((l, i) => centrado(l, 121 + i * 12, 8.5, normal));
  CLINICA.destacadas.forEach((l, i) => centrado(l, 159 + i * 12.5, 8.5, negrita));

  // Paciente y fecha sobre la línea
  const etiqueta = (t: string, x: number) =>
    pagina.drawText(t, { x, y: ALTO - 220, size: 9, font: negrita, color: NEGRO });
  etiqueta("Paciente:", MARGEN_X);
  pagina.drawText(seguro(normal, paciente), { x: MARGEN_X + 46, y: ALTO - 220, size: 10, font: normal, color: NEGRO });

  const fechaX = DERECHA - normal.widthOfTextAtSize(fecha, 10);
  pagina.drawText(fecha, { x: fechaX, y: ALTO - 220, size: 10, font: normal, color: NEGRO });
  etiqueta("Fecha:", fechaX - negrita.widthOfTextAtSize("Fecha:", 9) - 6);

  pagina.drawLine({
    start: { x: 52, y: ALTO - 237 },
    end: { x: DERECHA, y: ALTO - 237 },
    thickness: 0.8,
    color: NEGRO,
  });

  return pagina;
}

function dibujarFirma(
  pagina: PDFPage,
  {
    imagen,
    doctora,
    normal,
    top,
    alto,
  }: { imagen: PDFImage | null; doctora: string | null; normal: PDFFont; top: number; alto: number },
) {
  const derecha = DERECHA - 10;

  if (imagen) {
    const ancho = (alto * imagen.width) / imagen.height;
    pagina.drawImage(imagen, { x: derecha - ancho, y: ALTO - top - alto, width: ancho, height: alto });
    return;
  }

  // Sin firma registrada: línea para firmar a mano y el nombre debajo.
  const ancho = 170;
  const lineaY = ALTO - top - alto + 30;
  pagina.drawLine({
    start: { x: derecha - ancho, y: lineaY },
    end: { x: derecha, y: lineaY },
    thickness: 0.6,
    color: GRIS,
  });
  if (doctora) {
    const nombre = seguro(normal, doctora);
    const w = normal.widthOfTextAtSize(nombre, 9);
    pagina.drawText(nombre, { x: derecha - ancho / 2 - w / 2, y: lineaY - 13, size: 9, font: normal, color: GRIS });
  }
}
