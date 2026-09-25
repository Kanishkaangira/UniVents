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

-- Allow only lowercase roll number emails: 4-20 ASCII lowercase letters/digits,
-- at least one digit, followed by @svsu.ac.in. No dots or plus-tags.
create or replace function public.hook_restrict_signup_to_roll_emails(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  signup_email text := event->'user'->>'email';
  local_part text;
begin
  if signup_email is null or signup_email !~ '^[a-z0-9]{4,20}@svsu[.]ac[.]in$' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Only roll number emails like 2301234@svsu.ac.in can create an account.'
      )
    );
  end if;

  local_part := split_part(signup_email, '@', 1);
  if local_part !~ '[0-9]' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Only roll number emails like 2301234@svsu.ac.in can create an account.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.hook_restrict_signup_to_roll_emails(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_signup_to_roll_emails(jsonb) to supabase_auth_admin;

-- Require the authenticated user to create their own profile. Student profiles
-- must include the roll number and academic details; faculty profiles omit them.
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
    and (
      (
        user_type = 'student'
        and email ~ '^[a-z0-9]{4,20}@svsu[.]ac[.]in$'
        and split_part(email, '@', 1) ~ '[0-9]'
        and enroll_no = split_part((select auth.jwt() ->> 'email'), '@', 1)
        and course is not null and batch is not null and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
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
    and (
      (
        user_type = 'student'
        and email ~ '^[a-z0-9]{4,20}@svsu[.]ac[.]in$'
        and split_part(email, '@', 1) ~ '[0-9]'
        and enroll_no = split_part((select auth.jwt() ->> 'email'), '@', 1)
        and course is not null and batch is not null and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
        and enroll_no is null and course is null and batch is null and semester is null
      )
    )
  );

-- Let users edit their own profile fields while preserving the verified email,
-- account type, and email-derived enrollment number.
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
    and department_id is not null
    and (
      (
        user_type = 'student'
        and email ~ '^[a-z0-9]{4,20}@svsu[.]ac[.]in$'
        and split_part(email, '@', 1) ~ '[0-9]'
        and enroll_no = split_part((select auth.jwt() ->> 'email'), '@', 1)
        and course is not null and btrim(course) <> ''
        and batch is not null and btrim(batch) <> ''
        and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
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
    and department_id is not null
    and (
      (
        user_type = 'student'
        and email ~ '^[a-z0-9]{4,20}@svsu[.]ac[.]in$'
        and split_part(email, '@', 1) ~ '[0-9]'
        and enroll_no = split_part((select auth.jwt() ->> 'email'), '@', 1)
        and course is not null and btrim(course) <> ''
        and batch is not null and btrim(batch) <> ''
        and semester between 1 and 8
      )
      or (
        user_type = 'faculty'
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
