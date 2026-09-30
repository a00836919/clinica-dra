-- Permisos del personal: que el acceso dependa de staff_permisos de verdad.
--
-- Contexto: rls-staff.sql creó la política "personal_gestiona" (FOR ALL TO
-- authenticated USING true) en consultas, recetas, pacientes, solicitudes_cita
-- y staff. Como en Postgres basta con que UNA política permita, esa anulaba
-- todas las que usan tiene_permiso(): cualquier usuario con sesión —incluido
-- alguien que se registrara solo, porque el trigger de auth.users le creaba un
-- registro en staff— podía leer y editar todos los expedientes.
--
-- Este script:
--   1. Hace que tiene_permiso() exija que la persona esté activa.
--   2. Quita "personal_gestiona" y las políticas abiertas, y agrega las que
--      faltaban para que el dashboard siga funcionando (editar recetas,
--      bloqueos de agenda, editar el token del calendario propio).
--   3. Hace que los usuarios nuevos entren inactivos y sin permisos.
--   4. Cierra las funciones RPC públicas que la app ya no usa.
--   5. Agrega private.asignar_perfil() y private.desactivar_staff() para
--      administrar al personal desde el SQL Editor.
--
-- Los flujos públicos (solicitar cita, portal de pacientes, calendario) usan la
-- llave de servicio desde el servidor y no dependen de estas políticas.
--
-- Es idempotente: se puede correr varias veces sin romper nada.

-- ── 1. Funciones de permisos ────────────────────────────────────────────────

create or replace function public.tiene_permiso(permiso text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_permisos sp
    join public.staff s on s.id = sp.staff_id
    where sp.staff_id = (select auth.uid())
      and sp.permiso_clave = permiso
      and s.activo
  );
$$;

create or replace function public.tiene_acceso_emergencia_activo(p_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.acceso_emergencia_log l
    join public.staff s on s.id = l.staff_id
    where l.staff_id = (select auth.uid())
      and l.paciente_id = p_paciente_id
      and l.fecha > now() - interval '12 hours'
      and s.activo
  );
$$;

create or replace function public.es_staff_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = (select auth.uid()) and activo
  );
$$;

-- anon las conserva a propósito: las políticas de storage.objects (que no son
-- nuestras y no podemos cambiar de rol) las evalúan también para visitantes, y
-- para ellos siempre devuelven false porque auth.uid() es null.
grant execute on function public.es_staff_activo() to authenticated;
revoke execute on function public.es_staff_activo() from public, anon;

-- ── 2. Políticas ────────────────────────────────────────────────────────────

-- pacientes
drop policy if exists "personal_gestiona" on public.pacientes;
drop policy if exists "portal_login_lookup" on public.pacientes;
drop policy if exists "pacientes_insert_public" on public.pacientes;
alter policy "pacientes_select" on public.pacientes to authenticated;
alter policy "pacientes_insert" on public.pacientes to authenticated;
drop policy if exists "pacientes_update" on public.pacientes;
create policy "pacientes_update" on public.pacientes
  for update to authenticated
  using (public.tiene_permiso('editar_historial') or public.tiene_permiso('gestionar_usuarios'))
  with check (public.tiene_permiso('editar_historial') or public.tiene_permiso('gestionar_usuarios'));

-- consultas
drop policy if exists "personal_gestiona" on public.consultas;
alter policy "consultas_select" on public.consultas to authenticated;
alter policy "consultas_insert" on public.consultas to authenticated;
drop policy if exists "consultas_update" on public.consultas;
create policy "consultas_update" on public.consultas
  for update to authenticated
  using (
    (public.tiene_permiso('editar_historial') and (doctora_id = (select auth.uid()) or doctora_id is null))
    or public.tiene_permiso('gestionar_citas')
    or public.tiene_permiso('gestionar_usuarios')
  )
  with check (
    (public.tiene_permiso('editar_historial') and (doctora_id = (select auth.uid()) or doctora_id is null))
    or public.tiene_permiso('gestionar_citas')
    or public.tiene_permiso('gestionar_usuarios')
  );

-- recetas: guardarConsulta reescribe la receta existente, así que hace falta UPDATE.
drop policy if exists "personal_gestiona" on public.recetas;
alter policy "recetas_select" on public.recetas to authenticated;
alter policy "recetas_insert" on public.recetas to authenticated;
drop policy if exists "recetas_update" on public.recetas;
create policy "recetas_update" on public.recetas
  for update to authenticated
  using (public.tiene_permiso('editar_historial'))
  with check (public.tiene_permiso('editar_historial'));

-- solicitudes_cita: el formulario público inserta con la llave de servicio.
drop policy if exists "personal_gestiona" on public.solicitudes_cita;
drop policy if exists "solicitudes_insert_public" on public.solicitudes_cita;
drop policy if exists "solicitudes_select_staff" on public.solicitudes_cita;
create policy "solicitudes_select_staff" on public.solicitudes_cita
  for select to authenticated
  using (public.tiene_permiso('ver_citas') or public.tiene_permiso('gestionar_citas'));
drop policy if exists "solicitudes_update_staff" on public.solicitudes_cita;
create policy "solicitudes_update_staff" on public.solicitudes_cita
  for update to authenticated
  using (public.tiene_permiso('gestionar_citas'))
  with check (public.tiene_permiso('gestionar_citas'));

-- bloqueos_agenda: solo tenía "personal_gestiona".
drop policy if exists "personal_gestiona" on public.bloqueos_agenda;
drop policy if exists "bloqueos_agenda_select" on public.bloqueos_agenda;
create policy "bloqueos_agenda_select" on public.bloqueos_agenda
  for select to authenticated
  using (
    public.tiene_permiso('ver_citas') or public.tiene_permiso('crear_citas')
    or public.tiene_permiso('bloquear_horario') or public.tiene_permiso('gestionar_horarios_todos')
  );
drop policy if exists "bloqueos_agenda_insert" on public.bloqueos_agenda;
create policy "bloqueos_agenda_insert" on public.bloqueos_agenda
  for insert to authenticated
  with check (
    creado_por = (select auth.uid())
    and (
      (public.tiene_permiso('bloquear_horario') and doctora_id = (select auth.uid()))
      or public.tiene_permiso('gestionar_horarios_todos')
    )
  );
drop policy if exists "bloqueos_agenda_update" on public.bloqueos_agenda;
create policy "bloqueos_agenda_update" on public.bloqueos_agenda
  for update to authenticated
  using (
    (public.tiene_permiso('bloquear_horario') and doctora_id = (select auth.uid()))
    or public.tiene_permiso('gestionar_horarios_todos')
  )
  with check (
    (public.tiene_permiso('bloquear_horario') and doctora_id = (select auth.uid()))
    or public.tiene_permiso('gestionar_horarios_todos')
  );
drop policy if exists "bloqueos_agenda_delete" on public.bloqueos_agenda;
create policy "bloqueos_agenda_delete" on public.bloqueos_agenda
  for delete to authenticated
  using (
    (public.tiene_permiso('bloquear_horario') and doctora_id = (select auth.uid()))
    or public.tiene_permiso('gestionar_horarios_todos')
  );

-- staff: lo lee el personal activo (y cada quien su propio registro). Por la
-- API solo se puede cambiar el token del calendario; activo, es_doctora y los
-- permisos se administran con las funciones de private (sección 5).
drop policy if exists "personal_gestiona" on public.staff;
drop policy if exists "staff_select_autenticado" on public.staff;
create policy "staff_select_autenticado" on public.staff
  for select to authenticated
  using (id = (select auth.uid()) or public.es_staff_activo());
drop policy if exists "staff_update_admin" on public.staff;
create policy "staff_update_admin" on public.staff
  for update to authenticated
  using (public.tiene_permiso('gestionar_usuarios'))
  with check (public.tiene_permiso('gestionar_usuarios'));
drop policy if exists "staff_update_propio" on public.staff;
create policy "staff_update_propio" on public.staff
  for update to authenticated
  using (id = (select auth.uid()) and public.es_staff_activo())
  with check (id = (select auth.uid()));
revoke insert, update, delete on public.staff from anon, authenticated;
grant update (calendario_token) on public.staff to authenticated;

-- permisos_catalogo: auth.role() está obsoleto; se reemplaza por TO authenticated.
drop policy if exists "permisos_catalogo_select" on public.permisos_catalogo;
create policy "permisos_catalogo_select" on public.permisos_catalogo
  for select to authenticated
  using (true);
revoke insert, update, delete on public.permisos_catalogo from anon, authenticated;

-- El resto ya dependía de tiene_permiso(); solo se limitan a authenticated.
alter policy "staff_permisos_select_propio" on public.staff_permisos to authenticated;
alter policy "staff_permisos_insert_admin" on public.staff_permisos to authenticated;
alter policy "staff_permisos_delete_admin" on public.staff_permisos to authenticated;
alter policy "imagenes_clinicas_select" on public.imagenes_clinicas to authenticated;
alter policy "imagenes_clinicas_insert" on public.imagenes_clinicas to authenticated;
alter policy "archivos_adjuntos_select" on public.archivos_adjuntos to authenticated;
alter policy "archivos_adjuntos_insert" on public.archivos_adjuntos to authenticated;
alter policy "horarios_base_select" on public.horarios_base to authenticated;
alter policy "horarios_base_insert" on public.horarios_base to authenticated;
alter policy "horarios_base_update" on public.horarios_base to authenticated;
alter policy "horarios_bloqueos_select" on public.horarios_bloqueos to authenticated;
alter policy "horarios_bloqueos_insert" on public.horarios_bloqueos to authenticated;
alter policy "horarios_bloqueos_delete" on public.horarios_bloqueos to authenticated;
alter policy "acceso_emergencia_insert" on public.acceso_emergencia_log to authenticated;
alter policy "acceso_emergencia_select_admin" on public.acceso_emergencia_log to authenticated;

-- ── 3. Usuarios nuevos: inactivos y sin permisos ────────────────────────────
-- Antes el trigger creaba el registro activo y tomaba es_doctora de
-- user_metadata, que escribe el propio usuario al registrarse.

create or replace function public.crear_staff_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data->>'proposito', '') = 'verificacion_paciente' then
    return new; -- no crear registro de staff para pacientes
  end if;

  insert into public.staff (id, nombre_completo, email, activo, es_doctora)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    new.email,
    false,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 4. Funciones RPC públicas que la app ya no usa ──────────────────────────
-- Corren con privilegios elevados y se podían llamar sin sesión:
-- buscar_citas_publicas devolvía citas y correo con solo un DPI.

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'agendar_cita_publica',
        'buscar_citas_publicas',
        'buscar_paciente_por_identificacion',
        'cancelar_cita_publica',
        'obtener_disponibilidad_publica',
        'crear_staff_al_registrarse'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- ── 5. Administración del personal (solo desde el SQL Editor) ───────────────
-- El esquema private no está expuesto en la API.
--
--   select private.asignar_perfil('correo@ejemplo.com', 'admin');
--   select private.asignar_perfil('correo@ejemplo.com', 'doctora');
--   select private.asignar_perfil('correo@ejemplo.com', 'recepcion');
--   select private.desactivar_staff('correo@ejemplo.com');
--
-- asignar_perfil reemplaza todos los permisos de la persona y la activa.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.asignar_perfil(p_email text, p_perfil text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_permisos text[];
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No hay ningún usuario con el correo %. Invítalo primero desde Authentication → Users.', p_email;
  end if;

  v_permisos := case p_perfil
    when 'admin' then array(select clave from public.permisos_catalogo)
    when 'doctora' then array[
      'ver_citas', 'crear_citas', 'ver_historial_propio', 'editar_historial',
      'bloquear_horario', 'acceso_emergencia'
    ]
    when 'recepcion' then array['ver_citas', 'crear_citas', 'gestionar_citas']
  end;
  if v_permisos is null then
    raise exception 'Perfil desconocido: %. Usa admin, doctora o recepcion.', p_perfil;
  end if;

  insert into public.staff (id, nombre_completo, email, activo, es_doctora)
  select u.id, coalesce(u.raw_user_meta_data->>'nombre_completo', u.email), u.email, true, p_perfil = 'doctora'
  from auth.users u
  where u.id = v_id
  on conflict (id) do update set activo = true;

  delete from public.staff_permisos where staff_id = v_id;
  insert into public.staff_permisos (staff_id, permiso_clave)
  select v_id, unnest(v_permisos);

  return format('%s: perfil %s (%s permisos)', p_email, p_perfil, cardinality(v_permisos));
end;
$$;

create or replace function private.desactivar_staff(p_email text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No hay ningún usuario con el correo %.', p_email;
  end if;

  -- tiene_permiso() revisa activo, así que el acceso se corta al instante;
  -- borrar las sesiones evita además que renueve el token.
  update public.staff set activo = false where id = v_id;
  delete from auth.sessions where user_id = v_id;

  return format('%s desactivado', p_email);
end;
$$;

revoke all on function private.asignar_perfil(text, text) from public, anon, authenticated;
revoke all on function private.desactivar_staff(text) from public, anon, authenticated;
