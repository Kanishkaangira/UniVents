-- Add an explicit organizing level for each event or notice.
-- Safe to run repeatedly. Existing rows are inferred from their related IDs.

alter table public.events
  add column if not exists organizer_scope text;

update public.events
set organizer_scope = case
  when department_id is not null then 'department'
  when club_id is not null then 'club'
  else 'university'
end
where organizer_scope is null;

alter table public.events
  alter column organizer_scope set default 'university',
  alter column organizer_scope set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_organizer_scope_valid'
  ) then
    alter table public.events
      add constraint events_organizer_scope_valid
      check (
        organizer_scope in ('university', 'department', 'club')
        and (organizer_scope <> 'university' or (department_id is null and club_id is null))
        and (organizer_scope <> 'department' or department_id is not null)
        and (organizer_scope <> 'club' or club_id is not null)
      );
  end if;
end
$$;

notify pgrst, 'reload schema';
