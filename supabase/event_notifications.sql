-- Approved event and notice notification feed for the UniVents app.
-- Run after admin_skill_faculty_scope.sql.

create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique
    references public.events(id) on delete cascade,
  content_type text not null default 'event',
  title text not null,
  message text not null,
  event_date date,
  start_time time,
  venue text,
  image_url text,
  organizer_name text,
  visibility text not null,
  push_sent_at timestamptz,
  published_at timestamptz not null default now()
);

alter table public.event_notifications
  add column if not exists content_type text not null default 'event',
  add column if not exists push_sent_at timestamptz;

-- If the earlier expanded draft was already applied, keep this table limited
-- to fields used by the user-facing notification card.
alter table public.event_notifications
  drop column if exists notification_type,
  drop column if exists event_title,
  drop column if exists event_description,
  drop column if exists category,
  drop column if exists end_time,
  drop column if exists organizer_scope,
  drop column if exists skill_faculty_id,
  drop column if exists department_id,
  drop column if exists club_id,
  drop column if exists created_at,
  drop column if exists updated_at;

create index if not exists event_notifications_published_at_idx
  on public.event_notifications (published_at desc);

create index if not exists event_notifications_visibility_idx
  on public.event_notifications (visibility);

alter table public.event_notifications enable row level security;
revoke all on public.event_notifications from public, anon, authenticated;
grant select on public.event_notifications to anon, authenticated;

drop policy if exists event_notifications_app_read on public.event_notifications;
create policy event_notifications_app_read
  on public.event_notifications for select to anon, authenticated
  using (
    exists (
      select 1
      from public.events as event_row
      where event_row.id = event_notifications.event_id
        and event_row.content_type::text = event_notifications.content_type
        and event_row.content_type::text in ('event', 'notice')
        and event_row.approval::text = 'approved'
    )
    and (
      event_notifications.visibility = 'all'
      or exists (
        select 1
        from public.profiles as profile_row
        where profile_row.id = (select auth.uid())
          and profile_row.user_type::text = event_notifications.visibility
      )
      or exists (
        select 1
        from public.admins as admin_row
        where admin_row.id = (select auth.uid())
      )
    )
  );

create or replace function public.sync_approved_event_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_new_publication boolean := false;
  notification_message text;
begin
  if tg_op = 'INSERT' then
    is_new_publication := true;
  else
    is_new_publication := old.approval::text is distinct from 'approved'
      and new.approval::text = 'approved';
  end if;

  if new.content_type::text not in ('event', 'notice')
    or new.approval::text <> 'approved' then
    delete from public.event_notifications
    where event_id = new.id;
    return new;
  end if;

  notification_message := case when new.content_type::text = 'notice'
    then coalesce(nullif(new.description, ''), 'A new notice is now available on UniVents.')
    else coalesce(
      nullif(pg_catalog.concat_ws(
        ' | ',
        case when new.event_date is not null
          then pg_catalog.to_char(new.event_date, 'Mon FMDD') end,
        case when new.start_time is not null
          then pg_catalog.to_char(new.start_time, 'FMHH12:MI AM') end,
        nullif(new.venue, ''),
        nullif(new.organizer_name, '')
      ), ''),
      'An approved event is now live on UniVents.'
    )
  end;

  insert into public.event_notifications as notification (
    event_id, content_type, title, message, event_date, start_time,
    venue, image_url, organizer_name, visibility, push_sent_at, published_at
  ) values (
    new.id, new.content_type::text, new.title, notification_message, new.event_date,
    new.start_time, new.venue,
    case
      when new.content_type::text = 'notice' and new.attachment_type::text = 'image'
        then new.attachment_url
      when new.content_type::text = 'event' then new.image_url
      else null
    end,
    new.organizer_name, new.visibility, null,
    now()
  )
  on conflict (event_id) do update set
    content_type = excluded.content_type,
    title = excluded.title,
    message = excluded.message,
    event_date = excluded.event_date,
    start_time = excluded.start_time,
    venue = excluded.venue,
    image_url = excluded.image_url,
    organizer_name = excluded.organizer_name,
    visibility = excluded.visibility,
    published_at = case when is_new_publication
      then excluded.published_at else notification.published_at end;

  return new;
end;
$$;

drop trigger if exists events_sync_approved_notification on public.events;
create trigger events_sync_approved_notification
after insert or update of approval, content_type, title, description, category,
  event_date, start_time, venue, image_url, attachment_url, attachment_type,
  organizer_name, visibility
on public.events
for each row execute function public.sync_approved_event_notification();

-- Backfill approved posts already in the app. Rerunning this file updates
-- snapshots while retaining the original publish time for existing rows.
insert into public.event_notifications (
  event_id, content_type, title, message, event_date, start_time,
  venue, image_url, organizer_name, visibility, push_sent_at
)
select
  event_row.id,
  event_row.content_type::text,
  event_row.title,
  case when event_row.content_type::text = 'notice'
    then coalesce(nullif(event_row.description, ''), 'A new notice is now available on UniVents.')
    else coalesce(
      nullif(pg_catalog.concat_ws(
        ' | ',
        case when event_row.event_date is not null
          then pg_catalog.to_char(event_row.event_date, 'Mon FMDD') end,
        case when event_row.start_time is not null
          then pg_catalog.to_char(event_row.start_time, 'FMHH12:MI AM') end,
        nullif(event_row.venue, ''),
        nullif(event_row.organizer_name, '')
      ), ''),
      'An approved event is now live on UniVents.'
    )
  end,
  event_row.event_date, event_row.start_time, event_row.venue,
  case
    when event_row.content_type::text = 'notice' and event_row.attachment_type::text = 'image'
      then event_row.attachment_url
    when event_row.content_type::text = 'event' then event_row.image_url
    else null
  end,
  event_row.organizer_name, event_row.visibility, null
from public.events as event_row
where event_row.content_type::text in ('event', 'notice')
  and event_row.approval::text = 'approved'
on conflict (event_id) do update set
  content_type = excluded.content_type,
  title = excluded.title,
  message = excluded.message,
  event_date = excluded.event_date,
  start_time = excluded.start_time,
  venue = excluded.venue,
  image_url = excluded.image_url,
  organizer_name = excluded.organizer_name,
  visibility = excluded.visibility;

-- Realtime lets the mobile app subscribe to newly approved post notifications.
do $$
begin
  if exists (
    select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'event_notifications'
  ) then
    alter publication supabase_realtime add table public.event_notifications;
  end if;
end;
$$;

notify pgrst, 'reload schema';
