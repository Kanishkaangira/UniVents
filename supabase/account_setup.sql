-- UniVents account setup: safe to run more than once.
-- Run this in the Supabase SQL Editor, then enable this function under
-- Authentication > Hooks > Before User Created.

-- Keep the application's profile column name consistent with the client.
-- Existing schemas may have called this column enrollment_no.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles does not exist';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'enrollment_no'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'enroll_no'
  ) then
    alter table public.profiles rename column enrollment_no to enroll_no;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'enroll_no'
  ) then
    alter table public.profiles add column enroll_no text;
  end if;
end
$$;

-- Administration profiles may omit a department. Keep it required for all
-- existing profiles and for newly created student/faculty profiles.
alter table public.profiles alter column department_id drop not null;

-- The existing student_fields_required constraint must only apply to students.
-- Keep its student checks, while allowing faculty and administration profiles
-- to omit student-only academic fields.
alter table public.profiles
  drop constraint if exists student_fields_required;
alter table public.profiles
  add constraint student_fields_required
  check (
    user_type::text <> 'student'
    or (
      enroll_no is not null and btrim(enroll_no) <> ''
      and course is not null and btrim(course) <> ''
      and batch is not null and btrim(batch) <> ''
      and semester between 1 and 8
    )
  );

-- Add the administrative profile category to the existing user_type enum.
-- This category does not grant database or application admin privileges.
do $$
declare
  user_type_schema text;
  user_type_name text;
begin
  select column_info.udt_schema, column_info.udt_name
    into user_type_schema, user_type_name
  from information_schema.columns as column_info
  where column_info.table_schema = 'public'
    and column_info.table_name = 'profiles'
    and column_info.column_name = 'user_type';

  if user_type_name is null then
    raise exception 'public.profiles.user_type does not exist';
  end if;

  if exists (
    select 1
    from pg_type as type_info
    join pg_namespace as namespace_info on namespace_info.oid = type_info.typnamespace
    where namespace_info.nspname = user_type_schema
      and type_info.typname = user_type_name
      and type_info.typtype = 'e'
  ) then
    execute format(
      'alter type %I.%I add value if not exists %L',
      user_type_schema,
      user_type_name,
      'administration'
    );
  else
    raise notice 'profiles.user_type is not a PostgreSQL enum; no enum value was added';
  end if;
end
$$;

-- Accept flexible student and faculty email usernames under the SVSU domain.
-- Student enrollment numbers are collected in their profile, independently of email.
create or replace function public.hook_restrict_signup_to_roll_emails(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  signup_email text := event->'user'->>'email';
begin
  if signup_email is null or signup_email !~* '^[^@]+@svsu[.]ac[.]in$' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Use a valid SVSU university email ending in @svsu.ac.in.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.hook_restrict_signup_to_roll_emails(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_signup_to_roll_emails(jsonb) to supabase_auth_admin;

-- Require the authenticated user to create their own profile. Student profiles
-- must include their enrollment number and academic details; faculty omit those fields.
alter table public.profiles enable row level security;

-- Remove previous INSERT-specific policies so permissive policies cannot OR-bypass this rule.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'INSERT'
  loop
    execute format('drop policy %I on public.profiles', existing_policy.policyname);
  end loop;
end
$$;

drop policy if exists profiles_insert_own_student_roll_email on public.profiles;
create policy profiles_insert_own_student_roll_email
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and (user_type::text = 'administration' or department_id is not null)
    and (
      (
        user_type = 'student'
        and enroll_no is not null and btrim(enroll_no) <> ''
        and course is not null and batch is not null and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
        and enroll_no is null and course is null and batch is null and semester is null
      )
      or (
        user_type::text = 'administration'
        and enroll_no is null and course is null and batch is null and semester is null
      )
    )
  );

-- Also constrain INSERTs that could match a pre-existing FOR ALL policy.
drop policy if exists profiles_insert_own_student_roll_email_guard on public.profiles;
create policy profiles_insert_own_student_roll_email_guard
  on public.profiles
  as restrictive
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and (user_type::text = 'administration' or department_id is not null)
    and (
      (
        user_type = 'student'
        and enroll_no is not null and btrim(enroll_no) <> ''
        and course is not null and batch is not null and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
        and enroll_no is null and course is null and batch is null and semester is null
      )
      or (
        user_type::text = 'administration'
        and enroll_no is null and course is null and batch is null and semester is null
      )
    )
  );

-- Let users edit their own profile fields while preserving the verified email,
-- account type, and the student's enrollment number.
drop policy if exists profiles_update_own_profile on public.profiles;
create policy profiles_update_own_profile
  on public.profiles
  as permissive
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and user_name is not null and btrim(user_name) <> ''
    and (user_type::text = 'administration' or department_id is not null)
    and (
      (
        user_type = 'student'
        and enroll_no is not null and btrim(enroll_no) <> ''
        and course is not null and btrim(course) <> ''
        and batch is not null and btrim(batch) <> ''
        and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
        and enroll_no is null and course is null and batch is null and semester is null
      )
      or (
        user_type::text = 'administration'
        and enroll_no is null and course is null and batch is null and semester is null
      )
    )
  );

-- Keep the same checks even if another permissive policy applies to UPDATE.
drop policy if exists profiles_update_own_profile_guard on public.profiles;
create policy profiles_update_own_profile_guard
  on public.profiles
  as restrictive
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
    and user_name is not null and btrim(user_name) <> ''
    and (user_type::text = 'administration' or department_id is not null)
    and (
      (
        user_type = 'student'
        and enroll_no is not null and btrim(enroll_no) <> ''
        and course is not null and btrim(course) <> ''
        and batch is not null and btrim(batch) <> ''
        and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
        and enroll_no is null and course is null and batch is null and semester is null
      )
      or (
        user_type::text = 'administration'
        and enroll_no is null and course is null and batch is null and semester is null
      )
    )
  );

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- Refresh PostgREST's cached table definition after the possible column rename.
notify pgrst, 'reload schema';

-- Configure this function in Dashboard > Authentication > Hooks:
-- Before User Created -> Postgres Function -> public.hook_restrict_signup_to_roll_emails
