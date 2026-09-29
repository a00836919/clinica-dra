import tricoscopia from "@/assets/fotos/tricoscopia.jpg";
import fototerapia from "@/assets/fotos/fototerapia.jpg";
import infiltracion from "@/assets/fotos/infiltracion-capilar.jpg";
import mesoterapia from "@/assets/fotos/mesoterapia.jpg";
import laser from "@/assets/fotos/laser.jpg";
import crioterapia from "@/assets/fotos/crioterapia.jpg";
import { GaleriaClinica, type FotoClinica } from "./galeria-clinica";

/** Sólo el nombre de cada cosa: la foto explica el resto. */
const FOTOS: FotoClinica[] = [
  {
    src: tricoscopia,
    alt: "Evaluación capilar con tricoscopia digital: la imagen ampliada del cuero cabelludo se proyecta en el monitor del equipo.",
    titulo: "Tricoscopia",
  },
  {
    src: fototerapia,
    alt: "Máscara de fototerapia LED encendida en luz roja dentro de una sala de tratamiento.",
    titulo: "Fototerapia LED",
  },
  {
    src: infiltracion,
    alt: "Infiltración en el cuero cabelludo con jeringa de insulina, hecha con guantes estériles.",
    titulo: "Infiltración capilar",
  },
  {
    src: mesoterapia,
    alt: "Mano con guante sosteniendo una jeringa preparada para mesoterapia facial.",
    titulo: "Mesoterapia",
  },
  {
    src: laser,
    alt: "Dermatóloga con gafas de protección sosteniendo el cabezal del equipo de láser.",
    titulo: "Láser",
  },
  {
    src: crioterapia,
    alt: "Aplicación de crioterapia con nitrógeno líquido en el rostro de una paciente recostada.",
    titulo: "Crioterapia",
  },
];

/** Única banda oscura del sitio: deja que la luz de los equipos ponga el color. */
export function Tecnologia() {
  return (
    <section
      id="clinica"
      className="relative overflow-hidden"
      style={{ background: "oklch(0.19 0.008 45)" }}
    >
      <GaleriaClinica fotos={FOTOS} />
    </section>
  );
}
