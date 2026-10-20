-- Replace the old departments table with a faculty parent table and a
-- department child table. Review the related app/admin foreign keys before
-- running this migration in production.

do $$
begin
  if to_regclass('public.skill_faculty') is null
     and to_regclass('public.departments') is not null then
    alter table public.departments rename to skill_faculty;
  elsif to_regclass('public.skill_faculty') is null then
    raise exception 'Expected public.departments to exist before this migration.';
  elsif to_regclass('public.departments') is not null then
    raise exception 'Both public.skill_faculty and public.departments exist; review the schema before continuing.';
  end if;
end
$$;

-- Seed the faculty rows from Faculty_Department_Classification.docx.
insert into public.skill_faculty (name, code)
values
  ('Skill Faculty of Engineering and Technology', 'SFET'),
  ('Skill Faculty of Applied Sciences & Humanities', 'SFASH'),
  ('Skill Faculty of Management Studies & Research', 'SFMSR'),
  ('Skill Faculty of Medical & Allied Health Sciences', 'SFMAHS'),
  ('Skill Faculty of Agriculture', 'SFA'),
  ('Skill Faculty of Interdisciplinary Studies', 'SFIS'),
  ('Skill Faculty of Performing and Visual Arts', 'SFPVA'),
  ('Department of Student Welfare', 'DSW')
on conflict (code) do update
set name = excluded.name;

create table if not exists public.department (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  skill_faculty_id uuid not null references public.skill_faculty(id) on delete restrict,
  created_at timestamp without time zone not null default now()
);

insert into public.department (name, code, skill_faculty_id)
select department_row.name, department_row.code, faculty.id
from (values
  ('Automotive Studies', 'AUTOMOTIVE_STUDIES', 'SFET'),
  ('Construction Management', 'CONSTRUCTION_MANAGEMENT', 'SFET'),
  ('Green Technology', 'GREEN_TECHNOLOGY', 'SFET'),
  ('Skill Department of CS/IT', 'SKILL_DEPARTMENT_CS_IT', 'SFET'),
  ('Industry 4.0', 'INDUSTRY_4_0', 'SFET'),
  ('Plastic Technology', 'PLASTIC_TECHNOLOGY', 'SFET'),
  ('Skill Department of Language', 'SKILL_DEPARTMENT_LANGUAGE', 'SFASH'),
  ('Skill Department of Psychology & Behavioral Sciences', 'SKILL_DEPARTMENT_PSYCHOLOGY_BEHAVIORAL_SCIENCES', 'SFASH'),
  ('Skill Department of Sports & Yoga', 'SKILL_DEPARTMENT_SPORTS_YOGA', 'SFASH'),
  ('Skill Department of Science & Computation', 'SKILL_DEPARTMENT_SCIENCE_COMPUTATION', 'SFASH'),
  ('Skill Department of Management Studies', 'SKILL_DEPARTMENT_MANAGEMENT_STUDIES', 'SFMSR'),
  ('Skill Department of Tourism & Hospitality', 'SKILL_DEPARTMENT_TOURISM_HOSPITALITY', 'SFMSR'),
  ('Skill Department of Banking & Finance', 'SKILL_DEPARTMENT_BANKING_FINANCE', 'SFMSR'),
  ('Skill Department of Pharmacy', 'SKILL_DEPARTMENT_PHARMACY', 'SFMAHS'),
  ('Skill Department of Nursing', 'SKILL_DEPARTMENT_NURSING', 'SFMAHS'),
  ('Skill Department of Medical Laboratory Science', 'SKILL_DEPARTMENT_MEDICAL_LABORATORY_SCIENCE', 'SFMAHS'),
  ('Skill Department of Physiotherapy', 'SKILL_DEPARTMENT_PHYSIOTHERAPY', 'SFMAHS'),
  ('Skill Department of Agriculture', 'SKILL_DEPARTMENT_AGRICULTURE', 'SFA'),
  ('Skill Department of Horticulture', 'SKILL_DEPARTMENT_HORTICULTURE', 'SFA')
) as department_row(name, code, faculty_code)
join public.skill_faculty as faculty on faculty.code = department_row.faculty_code
on conflict (code) do update
set name = excluded.name,
    skill_faculty_id = excluded.skill_faculty_id;

alter table public.department enable row level security;
grant select on public.department to authenticated;
drop policy if exists department_authenticated_read on public.department;
create policy department_authenticated_read on public.department
  for select to authenticated using (true);

notify pgrst, 'reload schema';

