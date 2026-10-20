-- Registration totals and attendee snapshots are private to the admin who
-- created the event. Scope-wide post visibility does not grant attendee access.

create or replace function public.get_event_registration_counts(p_event_ids uuid[])
returns table (event_id uuid, registration_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    event_row.id,
    count(registration.id)::bigint
  from public.events as event_row
  join public.admins as admin_row
    on admin_row.id = (select auth.uid())
    and event_row.created_by = admin_row.id
  left join public.event_registrations as registration
    on registration.event_id = event_row.id
  where event_row.id = any(coalesce(p_event_ids, '{}'::uuid[]))
    and event_row.content_type::text = 'event'
    and event_row.registration_required is true
  group by event_row.id;
$$;

revoke all on function public.get_event_registration_counts(uuid[]) from public, anon;
grant execute on function public.get_event_registration_counts(uuid[]) to authenticated;

drop function if exists public.get_event_registrants(uuid);
create function public.get_event_registrants(p_event_id uuid)
returns table (
  registration_id uuid,
  user_name text,
  email text,
  user_type text,
  department_id uuid,
  department_name text,
  department_code text,
  skill_faculty_id uuid,
  skill_faculty_name text,
  skill_faculty_code text,
  course text,
  batch text,
  semester integer,
  registered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.events as event_row
    join public.admins as admin_row on admin_row.id = (select auth.uid())
    where event_row.id = p_event_id
      and event_row.created_by = admin_row.id
      and event_row.content_type::text = 'event'
      and event_row.registration_required is true
      and event_row.approval::text = 'approved'
  ) then
    raise exception 'Only the event creator can view registrations for this event.' using errcode = '42501';
  end if;

  return query
    select
      registration.id,
      registration.user_name,
      registration.email,
      registration.user_type::text,
      registration.department_id,
      registration.department_name,
      registration.department_code,
      registration.skill_faculty_id,
      registration.skill_faculty_name,
      registration.skill_faculty_code,
      registration.course,
      registration.batch,
      registration.semester,
      registration.created_at
    from public.event_registrations as registration
    where registration.event_id = p_event_id
    order by registration.created_at desc, registration.user_name asc;
end;
$$;

revoke all on function public.get_event_registrants(uuid) from public, anon;
grant execute on function public.get_event_registrants(uuid) to authenticated;

notify pgrst, 'reload schema';
