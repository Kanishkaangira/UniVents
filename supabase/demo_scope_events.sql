-- Add one department event and one club event using existing database rows.
-- Run event_organizer_scope.sql first. Safe to run repeatedly by title.
-- Uses the first available department, club, and profile; inserts only when
-- those records exist. Refresh the Events screen after running this SQL.

insert into public.events (
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
  'event',
  'Department Demo: Innovation Workshop',
  'A sample department-level event. Its department label is loaded from the related departments table.',
  'Workshop',
  department.name,
  'department',
  department.id,
  null,
  current_date + 18,
  time '11:00',
  time '13:00',
  'Department Seminar Hall',
  true,
  (current_date + 17) + time '17:00',
  60,
  'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
  'all',
  'upcoming',
  profile.id,
  now(),
  now()
from (select id, name from public.departments order by created_at limit 1) as department
cross join (select id from public.profiles order by created_at limit 1) as profile
where not exists (
  select 1 from public.events
  where title = 'Department Demo: Innovation Workshop'
    and content_type = 'event'
);

insert into public.events (
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
  'event',
  'Club Demo: Creative Meetup',
  'A sample club-level event. Its club label is loaded from the related clubs table.',
  'Meetup',
  club.name,
  'club',
  null,
  club.id,
  current_date + 21,
  time '15:00',
  time '17:00',
  'Student Activity Centre',
  false,
  null,
  null,
  'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
  'all',
  'upcoming',
  profile.id,
  now(),
  now()
from (select id, name from public.clubs order by created_at limit 1) as club
cross join (select id from public.profiles order by created_at limit 1) as profile
where not exists (
  select 1 from public.events
  where title = 'Club Demo: Creative Meetup'
    and content_type = 'event'
);

notify pgrst, 'reload schema';
