-- Demo event with every column from the events schema.
-- Run event_organizer_scope.sql first so organizer_scope exists.
-- Safe to run repeatedly: it updates the demo image and inserts the row only once.

update public.events
set image_url = 'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
    updated_at = now()
where title = 'UniVents Demo Workshop'
  and content_type = 'event'
  and image_url is distinct from 'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg';

insert into public.events (
  id,
  content_type,
  title,
  description,
  category,
  organizer_name,
  organizer_scope,
  department_id,
  club_id,
  event_date,
  start_time,
  end_time,
  venue,
  registration_required,
  registration_deadline,
  capacity,
  image_url,
  visibility,
  status,
  created_by,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  'event',
  'UniVents Demo Workshop',
  'A demo event to verify that the Events screen displays database content, schedule, location, and registration details.',
  'Workshop',
  'UniVents Demo Team',
  'university',
  null,
  null,
  current_date + 14,
  time '14:00',
  time '16:00',
  'University Main Hall',
  true,
  (current_date + 13) + time '17:00',
  100,
  'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
  'all',
  'upcoming',
  profile.id,
  now(),
  now()
from (
  select id
  from public.profiles
  order by created_at
  limit 1
) as profile
where not exists (
  select 1
  from public.events
  where title = 'UniVents Demo Workshop'
    and content_type = 'event'
);
