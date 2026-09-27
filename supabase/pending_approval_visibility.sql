-- Pending posts are visible only to their creator and the admin team assigned
-- to the post's selected review destination. Anonymous users see approved
-- posts only. Existing permissive SELECT policies remain in force as well.

alter table public.events enable row level security;

drop policy if exists events_approved_only_anon_guard on public.events;
create policy events_approved_only_anon_guard
  on public.events
  as restrictive
  for select
  to anon
  using (approval::text = 'approved');

drop policy if exists events_pending_creator_reviewer_guard on public.events;
create policy events_pending_creator_reviewer_guard
  on public.events
  as restrictive
  for select
  to authenticated
  using (
    approval::text = 'approved'
    or exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (
          events.created_by = admin_row.id
          or (approval::text = 'pending' and (
            (organizer_scope::text = 'university'
              and admin_row.scope_type::text = 'super')
            or (organizer_scope::text = 'department'
              and admin_row.scope_type::text = 'department'
              and department_id = admin_row.department_id)
            or (organizer_scope::text = 'club'
              and admin_row.scope_type::text = 'club'
              and club_id = admin_row.club_id)
          ))
        )
    )
  );

-- Route the inbox to the target reviewer group only. Super admins receive
-- pending university-wide posts; department/club admins receive only posts
-- addressed to their own organization.
create or replace function public.get_pending_admin_posts()
returns setof public.events
language sql
stable
security definer
set search_path = ''
as $$
  select event_row.*
  from public.events as event_row
  join public.admins as admin_row on admin_row.id = (select auth.uid())
  where event_row.approval::text = 'pending'
    and (
      (event_row.organizer_scope::text = 'university'
        and admin_row.scope_type::text = 'super')
      or (event_row.organizer_scope::text = 'department'
        and admin_row.scope_type::text = 'department'
        and event_row.department_id = admin_row.department_id)
      or (event_row.organizer_scope::text = 'club'
        and admin_row.scope_type::text = 'club'
        and event_row.club_id = admin_row.club_id)
    )
  order by event_row.created_at asc;
$$;

revoke all on function public.get_pending_admin_posts() from public, anon;
grant execute on function public.get_pending_admin_posts() to authenticated;

-- Enforce the same routing at the approval decision boundary.
create or replace function public.protect_approval_column()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewing_admin public.admins%rowtype;
begin
  if new.approval::text is not distinct from old.approval::text then
    return new;
  end if;

  if old.approval::text is distinct from 'pending'
    or new.approval::text not in ('approved', 'rejected') then
    raise exception 'Only pending posts can be approved or rejected.' using errcode = '42501';
  end if;

  select * into reviewing_admin
  from public.admins
  where id = (select auth.uid());

  if not found then
    raise exception 'Only an admin assigned to this post scope can review it.' using errcode = '42501';
  end if;

  if (reviewing_admin.scope_type::text = 'super'
      and old.organizer_scope::text = 'university')
    or (old.organizer_scope::text = 'department'
      and reviewing_admin.scope_type::text = 'department'
      and old.department_id = reviewing_admin.department_id)
    or (old.organizer_scope::text = 'club'
      and reviewing_admin.scope_type::text = 'club'
      and old.club_id = reviewing_admin.club_id) then
    return new;
  end if;

  raise exception 'You are not assigned to review this post.' using errcode = '42501';
end;
$$;

create or replace function public.review_event_approval(p_event_id uuid, p_decision text)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_row public.events%rowtype;
  affected_count bigint;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;

  execute pg_catalog.format(
    'update public.events
       set approval = %L
     where id = $1
       and approval::text = ''pending''
       and (
         exists (
           select 1 from public.admins as admin_row
           where admin_row.id = (select auth.uid())
             and admin_row.scope_type::text = ''super''
             and organizer_scope::text = ''university''
         )
         or exists (
           select 1 from public.admins as admin_row
           where admin_row.id = (select auth.uid())
             and admin_row.scope_type::text = ''department''
             and organizer_scope::text = ''department''
             and department_id = admin_row.department_id
         )
         or exists (
           select 1 from public.admins as admin_row
           where admin_row.id = (select auth.uid())
             and admin_row.scope_type::text = ''club''
             and organizer_scope::text = ''club''
             and club_id = admin_row.club_id
         )
       )
     returning *',
    p_decision
  ) into result_row using p_event_id;

  -- EXECUTE does not update PL/pgSQL's FOUND variable. Read ROW_COUNT so a
  -- successful UPDATE isn't rolled back as if the reviewer lacked access.
  get diagnostics affected_count = row_count;
  if affected_count = 0 then
    raise exception 'This pending post is not assigned to your admin scope.' using errcode = '42501';
  end if;

  return result_row;
end;
$$;

revoke all on function public.review_event_approval(uuid, text) from public, anon;
grant execute on function public.review_event_approval(uuid, text) to authenticated;

notify pgrst, 'reload schema';
