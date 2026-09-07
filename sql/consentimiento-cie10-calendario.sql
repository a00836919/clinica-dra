-- Consentimiento informado, CIE-10, pasaporte y calendario de la doctora.
-- Idempotente: se puede correr varias veces.
--
-- El horario por sede (lunes/viernes Integra, miércoles Integra tarde, martes y
-- jueves Decorísima, sábado Galerías Tiffany) NO está aquí: vive en
-- `src/lib/disponibilidad.ts` junto al resto de las reglas de agenda.

-- 1. Consentimiento informado ────────────────────────────────────────────────
-- Se guarda en dos lados a propósito: en la solicitud queda la constancia de
-- ese trámite, y en el expediente queda la última aceptación, que es la que la
-- doctora necesita ver antes de atender.
alter table public.pacientes
  add column if not exists consentimiento_aceptado_en timestamptz,
  add column if not exists consentimiento_version     text;

alter table public.solicitudes_cita
  add column if not exists consentimiento_aceptado_en timestamptz,
  add column if not exists consentimiento_version     text;

comment on column public.pacientes.consentimiento_version is
  'Versión del texto que el paciente aceptó (ver src/lib/consentimiento.ts). "Aceptó" no sirve de nada sin saber qué aceptó.';

-- 2. CIE-10 en consultas y recetas ───────────────────────────────────────────
-- El código va en la consulta (diagnóstico) y se copia a la receta, que es el
-- documento que el paciente lleva al seguro.
alter table public.consultas
  add column if not exists diagnostico_cie10      text,
  add column if not exists diagnostico_cie10_desc text;

alter table public.recetas
  add column if not exists diagnostico_cie10 text;

comment on column public.consultas.diagnostico_cie10 is
  'Código CIE-10 del diagnóstico, en mayúsculas: L70.0, B35.1…';
comment on column public.consultas.diagnostico_cie10_desc is
  'Descripción del código al momento de guardarlo. Se copia para que el histórico no dependa del catálogo de hoy.';

-- Para sacar cuántos casos de cada diagnóstico hubo en el año.
create index if not exists consultas_cie10_idx
  on public.consultas (diagnostico_cie10);

-- 3. Identificación: DPI o pasaporte ─────────────────────────────────────────
-- La columna `tipo_identificacion` ya existía; lo único que faltaba era que la
-- app la usara. Los expedientes viejos se cargaron todos como DPI.
update public.pacientes
   set tipo_identificacion = 'DPI'
 where tipo_identificacion is null
    or btrim(tipo_identificacion) = '';

-- 4. Calendario de la doctora (suscripción ICS) ──────────────────────────────
-- El token es la única credencial del feed: se crea la primera vez que se abre
-- la página de Calendario y se puede regenerar desde ahí, lo que invalida el
-- enlace anterior. Se deja nulo por defecto para que quien nunca use el
-- calendario no tenga un enlace vivo dando vueltas.
alter table public.staff
  add column if not exists calendario_token uuid;

comment on column public.staff.calendario_token is
  'Token del feed /api/calendario/<token>. Quien lo tenga ve la agenda: tratarlo como contraseña.';

-- Único, pero acepta varios NULL (Postgres no compara nulos entre sí).
create unique index if not exists staff_calendario_token_key
  on public.staff (calendario_token);
