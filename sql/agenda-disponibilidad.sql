-- Agenda: citas heredadas, hora preferida y bloqueos de horario.
-- Idempotente: se puede correr varias veces.

-- 1. Citas importadas del sistema anterior ───────────────────────────────────
-- El export de la agenda vieja trae nombre y teléfono, pero no DPI ni fecha de
-- nacimiento, que son obligatorios en `pacientes`. En vez de inventar 344
-- identidades falsas, se permite que una cita exista sin expediente ligado y
-- cargue el nombre suelto. Cuando el paciente se registre, se enlaza.
alter table public.consultas alter column paciente_id drop not null;

alter table public.consultas
  add column if not exists paciente_nombre    text,
  add column if not exists paciente_telefono  text,
  add column if not exists origen             text not null default 'app',
  add column if not exists origen_id          text;

comment on column public.consultas.paciente_nombre is
  'Nombre suelto para citas importadas que aún no tienen expediente.';
comment on column public.consultas.origen is
  'app | importado — de dónde salió la cita.';
comment on column public.consultas.origen_id is
  'ID de la cita en el sistema anterior, para no importarla dos veces.';

-- Evita duplicados si la importación se corre más de una vez.
create unique index if not exists consultas_origen_id_key
  on public.consultas (origen_id) where origen_id is not null;

-- 2. Hora preferida en la solicitud ──────────────────────────────────────────
-- El formulario público ahora deja elegir una franja concreta, no solo el día.
alter table public.solicitudes_cita
  add column if not exists hora_preferida text;

-- 3. Bloqueos de agenda ──────────────────────────────────────────────────────
-- Viajes, capacitaciones, feriados. Un bloqueo sin doctora aplica a todas, y
-- uno sin sede aplica a todas las sedes.
create table if not exists public.bloqueos_agenda (
  id          uuid primary key default gen_random_uuid(),
  doctora_id  uuid references public.staff(id) on delete cascade,
  sede        text,
  desde       timestamptz not null,
  hasta       timestamptz not null,
  motivo      text,
  creado_por  uuid references public.staff(id),
  creado_en   timestamptz not null default now(),
  constraint bloqueo_rango_valido check (hasta > desde)
);

create index if not exists bloqueos_agenda_rango_idx
  on public.bloqueos_agenda (desde, hasta);

-- 4. Permisos y políticas de las tablas nuevas ───────────────────────────────
grant all on public.bloqueos_agenda to service_role, authenticated;

alter table public.bloqueos_agenda enable row level security;
drop policy if exists "personal_gestiona" on public.bloqueos_agenda;
create policy "personal_gestiona" on public.bloqueos_agenda
  for all to authenticated using (true) with check (true);
