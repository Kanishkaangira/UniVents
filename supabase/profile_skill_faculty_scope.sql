-- Add Skill Faculty + child Department profile assignments.
-- Run after skill_faculty_department.sql and account_setup.sql.
-- Safe to rerun after the initial legacy migration.

alter table public.profiles add column if not exists skill_faculty_id uuid;
alter table public.profiles alter column department_id drop not null;

do $$
declare
  department_fk_target oid;
  department_fk_name text;
begin
  select constraint_row.confrelid, constraint_row.conname
    into department_fk_target, department_fk_name
  from pg_catalog.pg_constraint as constraint_row
  where constraint_row.conrelid = 'public.profiles'::regclass
    and constraint_row.contype = 'f'
    and constraint_row.conkey = array[(
      select attribute_row.attnum
      from pg_catalog.pg_attribute as attribute_row
      where attribute_row.attrelid = 'public.profiles'::regclass
        and attribute_row.attname = 'department_id'
        and not attribute_row.attisdropped
    )]::smallint[]
  limit 1;

  if department_fk_target = 'public.skill_faculty'::regclass then
    update public.profiles as profile_row
    set skill_faculty_id = coalesce(profile_row.skill_faculty_id, profile_row.department_id),
        department_id = null
    where profile_row.department_id is not null;

    execute pg_catalog.format('alter table public.profiles drop constraint %I', department_fk_name);
    alter table public.profiles
      add constraint profiles_department_id_fkey
      foreign key (department_id) references public.department(id) on delete set null;
  elsif department_fk_target is null then
    -- Preserve old faculty IDs in installations where the FK was absent.
    update public.profiles as profile_row
    set skill_faculty_id = coalesce(profile_row.skill_faculty_id, faculty.id),
        department_id = null
    from public.skill_faculty as faculty
    where faculty.id = profile_row.department_id
      and not exists (
        select 1 from public.department as department_row
        where department_row.id = profile_row.department_id
      );

    alter table public.profiles
      add constraint profiles_department_id_fkey
      foreign key (department_id) references public.department(id) on delete set null;
  elsif department_fk_target = 'public.department'::regclass then
    update public.profiles as profile_row
    set skill_faculty_id = department_row.skill_faculty_id
    from public.department as department_row
    where department_row.id = profile_row.department_id
      and profile_row.skill_faculty_id is distinct from department_row.skill_faculty_id;
  else
    raise exception 'profiles.department_id references an unexpected table; review before migrating.';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_skill_faculty_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_skill_faculty_id_fkey
      foreign key (skill_faculty_id) references public.skill_faculty(id) on delete set null;
  end if;
end;
$$;

create index if not exists profiles_skill_faculty_id_idx
  on public.profiles(skill_faculty_id);

create or replace function public.set_profile_skill_faculty()
returns trigger
language plpgsql
set search_path = ''
as $$
declare parent_faculty_id uuid;
begin
  if new.department_id is not null then
    select department_row.skill_faculty_id
      into parent_faculty_id
    from public.department as department_row
    where department_row.id = new.department_id;

    if parent_faculty_id is null then
      raise exception 'The selected department has no Skill Faculty.' using errcode = '23503';
    end if;
    if new.skill_faculty_id is not null and new.skill_faculty_id <> parent_faculty_id then
      raise exception 'The selected department does not belong to the selected Skill Faculty.' using errcode = '23514';
    end if;
    new.skill_faculty_id := parent_faculty_id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_skill_faculty on public.profiles;
create trigger profiles_set_skill_faculty
before insert or update of department_id, skill_faculty_id
on public.profiles
for each row execute function public.set_profile_skill_faculty();

notify pgrst, 'reload schema';
