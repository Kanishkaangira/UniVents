-- Sample notices for the Notices screen: one university PDF notice and one
-- department image notice. Safe to run repeatedly by title.
-- Run event_organizer_scope.sql and notice_attachments.sql first.
-- Upload a PDF named Demo_Exam_Schedule.pdf into event-posters/Notice Folder
-- before using the PDF download action. The image row uses the existing event
-- poster object in event-posters/Events Folder.

-- Keep any rows seeded by an earlier version pointed at the intended files.
update public.events
set image_url = null,
    attachment_url = 'Notice Folder/Demo_Exam_Schedule.pdf',
    attachment_type = 'pdf'::public.attachment_type_enum,
    attachment_name = 'Demo_Exam_Schedule.pdf',
    updated_at = now()
where content_type = 'notice'
  and title = 'Demo Notice: Examination Schedule';

update public.events
set image_url = null,
    attachment_url = 'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
    attachment_type = 'image'::public.attachment_type_enum,
    attachment_name = 'Workshop_Poster.jpeg',
    updated_at = now()
where content_type = 'notice'
  and title = 'Demo Notice: Department Workshop Poster';

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
  attachment_url,
  attachment_type,
  attachment_name,
  visibility,
  status,
  created_by,
  created_at,
  updated_at
)
select
  'notice',
  'Demo Notice: Examination Schedule',
  'The examination schedule is available in the attached PDF. Download the document and check your course, semester, and reporting time.',
  'Exams',
  'Examination Branch',
  'university',
  null,
  null,
  null,
  null,
  null,
  null,
  false,
  null,
  null,
  null,
  'Notice Folder/Demo_Exam_Schedule.pdf',
  'pdf',
  'Demo_Exam_Schedule.pdf',
  'all',
  'upcoming',
  profile.id,
  now(),
  now()
from (select id from public.profiles order by created_at limit 1) as profile
where not exists (
  select 1 from public.events
  where content_type = 'notice'
    and title = 'Demo Notice: Examination Schedule'
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
  attachment_url,
  attachment_type,
  attachment_name,
  visibility,
  status,
  created_by,
  created_at,
  updated_at
)
select
  'notice',
  'Demo Notice: Department Workshop Poster',
  'Please review the attached workshop poster for the event information and schedule.',
  'Academic',
  department.name,
  'department',
  department.id,
  null,
  null,
  null,
  null,
  null,
  false,
  null,
  null,
  null,
  'Events Folder/WhatsApp Image 2026-09-09 at 10.06.33 AM.jpeg',
  'image',
  'Workshop_Poster.jpeg',
  'all',
  'upcoming',
  profile.id,
  now(),
  now()
from (select id, name from public.departments order by created_at limit 1) as department
cross join (select id from public.profiles order by created_at limit 1) as profile
where not exists (
  select 1 from public.events
  where content_type = 'notice'
    and title = 'Demo Notice: Department Workshop Poster'
);

notify pgrst, 'reload schema';
