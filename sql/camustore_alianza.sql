-- =====================================================
-- camustore_alianza.sql — 10/09/2026
--
-- Panel de la guild aliada (DECISIONES §16). UNA alianza fija, sin tabla de
-- guilds: `miembros` y `eventos_registros` ganan una columna `guild` con dos
-- valores ('propia' / 'alianza'). Un registro se ve solo desde su guild,
-- salvo que tenga `compartido_alianza = true`: ahí lo ven las dos.
--
-- Qué crea/cambia:
--   1. miembros.guild                    (default 'propia')
--   2. eventos_registros.guild           (default 'propia')
--      eventos_registros.compartido_alianza (default false)
--   3. miembro_guild()                   → la guild del logueado (security definer)
--   4. RLS de eventos_registros REHECHA: leés lo de tu guild o lo compartido;
--      insertás solo con tu guild; borra el admin.
--   5. registro_set_compartido(id, bool) → prender/apagar el compartir después
--      de cargar, solo sobre registros de tu guild (patrón de miembro_set_raza).
--   6. Vista miembros_perfil             → lo que un miembro ve de los demás
--      (email, personaje, raza, foto, guild) SIN las notas del admin. Es lo
--      que usa la web para pintar apuntados con foto y distintivo de guild.
--
-- Lo que NO toca: eventos_asistencias, calendario_asistencias, eventos_config,
-- storage. Los miembros de la alianza usan todo eso igual que los propios.
--
-- Todos los miembros y registros que ya existen quedan como 'propia' (default).
--
-- CORRER LOS PASOS DE A UNO, EN ORDEN, en el SQL Editor de Supabase.
-- =====================================================


-- -----------------------------------------------------
-- PASO 0 — Diagnóstico. Correr SOLO esto primero.
--
-- Tiene que devolver 0 filas (todavía no existe nada de la alianza).
-- Si devuelve filas, ya se corrió algo de este script antes: igual se puede
-- seguir, todo es idempotente, pero avisame.
-- -----------------------------------------------------
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'miembros' and column_name = 'guild')
    or (table_name = 'eventos_registros' and column_name in ('guild', 'compartido_alianza'))
  );


-- -----------------------------------------------------
-- PASO 1 — Columnas.
-- -----------------------------------------------------
alter table public.miembros
  add column if not exists guild text not null default 'propia';

do $$ begin
  alter table public.miembros
    add constraint miembros_guild_check check (guild in ('propia', 'alianza'));
exception when duplicate_object then null;
end $$;

alter table public.eventos_registros
  add column if not exists guild text not null default 'propia';

alter table public.eventos_registros
  add column if not exists compartido_alianza boolean not null default false;

do $$ begin
  alter table public.eventos_registros
    add constraint eventos_registros_guild_check check (guild in ('propia', 'alianza'));
exception when duplicate_object then null;
end $$;

-- La lectura de siempre ("los últimos N registros") ahora filtra por guild.
create index if not exists eventos_registros_guild_created_idx
  on public.eventos_registros (guild, created_at desc);

comment on column public.miembros.guild is
  'propia = la guild de Camus; alianza = la guild aliada. Define que registros privados ve.';
comment on column public.eventos_registros.guild is
  'Guild duena del registro. La otra guild no lo ve salvo compartido_alianza = true.';
comment on column public.eventos_registros.compartido_alianza is
  'Compartir con la alianza: la otra guild lo ve en su timeline y puede apuntarse.';


-- -----------------------------------------------------
-- PASO 2 — miembro_guild(): la guild del usuario logueado.
--
-- Security definer (mismo patrón que is_miembro): lee `miembros` aunque la
-- policy no deje. Devuelve NULL si no es miembro activo ni admin.
-- El admin sin fila propia cuenta como 'propia'.
-- -----------------------------------------------------
create or replace function public.miembro_guild()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select m.guild
      from public.miembros m
      where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        and m.activo
      limit 1
    ),
    case when public.is_admin() then 'propia' else null end
  );
$$;

grant execute on function public.miembro_guild() to authenticated;


-- -----------------------------------------------------
-- PASO 3 — RLS de eventos_registros, rehecha.
--
-- Se BORRAN todas las policies actuales de la tabla (sin importar cómo se
-- llamen) y se crean las tres nuevas. Antes: "miembros leen todo". Ahora:
--   select → admin, o miembro cuya guild es la del registro, o registro compartido
--   insert → admin, o miembro insertando con SU guild (no puede firmar por la otra)
--   delete → admin (como antes)
-- No hay policy de update: el único cambio permitido después de cargar es
-- compartir/descompartir, y va por la función del PASO 4.
-- -----------------------------------------------------
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'eventos_registros'
  loop
    execute format('drop policy if exists %I on public.eventos_registros', p.policyname);
  end loop;
end $$;

alter table public.eventos_registros enable row level security;

create policy "registros_select_guild_o_compartido"
  on public.eventos_registros
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_miembro()
      and (guild = public.miembro_guild() or compartido_alianza = true)
    )
  );

create policy "registros_insert_con_mi_guild"
  on public.eventos_registros
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (public.is_miembro() and guild = public.miembro_guild())
  );

create policy "registros_delete_admin"
  on public.eventos_registros
  for delete
  to authenticated
  using (public.is_admin());


-- -----------------------------------------------------
-- PASO 4 — registro_set_compartido(id, valor).
--
-- Prende o apaga "Compartir con la alianza" en un registro YA cargado
-- ("no puedo ir" suele aparecer después de cargar). Solo sobre registros de
-- la guild del que llama (o admin). `registro` va como texto para no depender
-- del tipo exacto del id.
-- -----------------------------------------------------
create or replace function public.registro_set_compartido(registro text, valor boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g text := public.miembro_guild();
begin
  if g is null then
    raise exception 'No sos miembro activo.';
  end if;

  update public.eventos_registros
  set compartido_alianza = valor
  where id::text = registro
    and (guild = g or public.is_admin());

  if not found then
    raise exception 'Registro no encontrado o no es de tu guild.';
  end if;
end;
$$;

grant execute on function public.registro_set_compartido(text, boolean) to authenticated;


-- -----------------------------------------------------
-- PASO 5 — Vista miembros_perfil.
--
-- Lo que la web necesita de los demás miembros: foto y guild para pintar los
-- apuntados. Sin `notas` (son del admin). Solo la ve un miembro activo o el
-- admin; la vista corre con permisos del dueño, así que no depende de la
-- policy de select de `miembros` (que sigue siendo "cada uno su fila").
-- -----------------------------------------------------
create or replace view public.miembros_perfil as
  select id, email, personaje, raza, avatar_url, guild, activo
  from public.miembros
  where public.is_miembro();

grant select on public.miembros_perfil to authenticated;


-- -----------------------------------------------------
-- PASO 6 — Verificación.
-- a) 3 filas: miembros.guild · eventos_registros.guild · eventos_registros.compartido_alianza
-- b) 3 policies en eventos_registros (select / insert / delete)
-- c) 2 funciones: miembro_guild · registro_set_compartido
-- d) la vista miembros_perfil con 7 columnas
-- -----------------------------------------------------
select table_name, column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'miembros' and column_name = 'guild')
    or (table_name = 'eventos_registros' and column_name in ('guild', 'compartido_alianza'))
  )
order by table_name, column_name;

select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'eventos_registros'
order by cmd;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('miembro_guild', 'registro_set_compartido')
order by routine_name;

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'miembros_perfil'
order by ordinal_position;
