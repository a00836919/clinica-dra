-- ⚠️ OBSOLETO — NO CORRER. Lo reemplaza permisos-seguridad.sql.
-- "personal_gestiona" daba a cualquier usuario con sesión acceso total a los
-- expedientes, sin importar sus permisos. Correrlo de nuevo reabre ese hueco.
-- Se deja solo como historial.
--
-- Políticas de escritura para el personal.
--
-- Contexto: en esta app el ÚNICO que se autentica contra Supabase Auth es el
-- personal de la clínica. Los pacientes no tienen cuenta: entran al portal con
-- DPI + fecha de nacimiento y su acceso pasa por la llave de servicio, con el
-- filtro puesto por la cookie firmada. Por eso "authenticated" equivale a
-- "personal", y darle acceso completo es lo correcto aquí.
--
-- Las tablas ya tenían RLS activo con política de lectura pero sin política de
-- escritura: la agenda se veía, pero crear una cita fallaba con
-- "new row violates row-level security policy".
--
-- Es idempotente: se puede correr varias veces sin romper nada.

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'consultas',
    'recetas',
    'pacientes',
    'solicitudes_cita',
    'staff'
  ]
  loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('drop policy if exists "personal_gestiona" on public.%I', tabla);
    execute format(
      'create policy "personal_gestiona" on public.%I for all to authenticated using (true) with check (true)',
      tabla
    );
  end loop;
end $$;
