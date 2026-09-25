-- Persist event registrations with a snapshot of the registering profile.
-- Safe to run repeatedly. Enable pg_cron in Supabase, then rerun this file to
-- install the scheduled cleanup job. Registration setup still succeeds without it.

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_type text not null check (user_type in ('student', 'faculty')),
  user_name text not null,
  email text not null,
  department_id uuid references public.departments(id) on delete set null,
  department_name text,
  department_code text,
  course text,
  batch text,
  semester integer,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_registrations_user_id_idx
  on public.event_registrations(user_id);

alter table public.event_registrations enable row level security;

drop policy if exists event_registrations_select_own on public.event_registrations;
create policy event_registrations_select_own
  on public.event_registrations
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists event_registrations_delete_own on public.event_registrations;

revoke all on public.event_registrations from public, anon;
grant select on public.event_registrations to authenticated;
revoke insert, update, delete on public.event_registrations from authenticated;

create or replace function public.register_for_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row public.profiles%rowtype;
  event_row public.events%rowtype;
  registration_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in to register for this event.' using errcode = '42501';
  end if;

  select * into profile_row
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'Complete your profile before registering.' using errcode = '23503';
  end if;

  if profile_row.user_type::text not in ('student', 'faculty')
    or nullif(btrim(profile_row.user_name), '') is null
    or nullif(btrim(profile_row.email), '') is null
    or profile_row.department_id is null then
    raise exception 'Complete your name, email, user type, and department in your profile before registering.' using errcode = '22023';
  end if;

  if profile_row.user_type::text = 'student'
    and (nullif(btrim(profile_row.course), '') is null
      or nullif(btrim(profile_row.batch), '') is null
      or profile_row.semester is null) then
    raise exception 'Complete your course, batch, and semester in your profile before registering.' using errcode = '22023';
  end if;

  select * into event_row
  from public.events
  where id = p_event_id and content_type = 'event';

  if not found or not event_row.registration_required then
    raise exception 'This event is not accepting registrations.' using errcode = '22023';
  end if;

  if event_row.visibility::text not in ('all', profile_row.user_type::text) then
    raise exception 'This event is not available to your account type.' using errcode = '42501';
  end if;

  if event_row.status not in ('upcoming', 'live') then
    raise exception 'Registration is closed for this event.' using errcode = '22023';
  end if;

  if event_row.registration_deadline is not null and event_row.registration_deadline < now() then
    raise exception 'The registration deadline has passed.' using errcode = '22023';
  end if;

  insert into public.event_registrations (
    event_id, user_id, user_type, user_name, email,
    department_id, department_name, department_code,
    course, batch, semester
  )
  select
    event_row.id,
    profile_row.id,
    profile_row.user_type::text,
    profile_row.user_name,
    profile_row.email,
    profile_row.department_id,
    (select department.name from public.departments as department where department.id = profile_row.department_id),
    (select department.code from public.departments as department where department.id = profile_row.department_id),
    profile_row.course,
    profile_row.batch,
    profile_row.semester
  on conflict (event_id, user_id) do update
    set user_type = excluded.user_type,
        user_name = excluded.user_name,
        email = excluded.email,
        department_id = excluded.department_id,
        department_name = excluded.department_name,
        department_code = excluded.department_code,
        course = excluded.course,
        batch = excluded.batch,
        semester = excluded.semester
  returning id into registration_id;

  return registration_id;
end;
$$;

revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;

-- Daily cleanup: remove registrations two days after an event date, events twenty
-- days after their event date, and notices thirty days after they were created.
-- Events store a DATE, so date retention is evaluated at 02:15 UTC each day.
create or replace function public.cleanup_expired_event_data()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
  total_deleted bigint := 0;
begin
  delete from public.event_registrations as registration
  using public.events as event
  where registration.event_id = event.id
    and event.content_type = 'event'
    and event.event_date <= current_date - 2;

  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  -- Deleting events cascades any remaining registrations through the FK.
  delete from public.events
  where content_type = 'event'
    and event_date <= current_date - 20;

  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  delete from public.events
  where content_type = 'notice'
    and created_at <= now() - interval '30 days';

  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  return total_deleted;
end;
$$;

revoke all on function public.cleanup_expired_event_data() from public, anon, authenticated;
drop function if exists public.cleanup_old_event_registrations();

-- Replace any earlier copy of this named job. If pg_cron is not enabled yet,
-- leave a notice instead of failing the entire registration setup.
do $$
declare
  existing_job_id bigint;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    for existing_job_id in
      select jobid
      from cron.job
      where jobname in ('cleanup-old-event-registrations', 'cleanup-expired-event-data')
    loop
      perform cron.unschedule(existing_job_id);
    end loop;

    perform cron.schedule(
      'cleanup-expired-event-data',
      '15 2 * * *',
      'select public.cleanup_expired_event_data();'
    );
  else
    raise notice 'pg_cron is not enabled. Enable it in Supabase Dashboard > Integrations > Cron, then rerun this SQL to schedule cleanup.';
  end if;
end;
$$;

notify pgrst, 'reload schema';
