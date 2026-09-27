-- The admin form intentionally allows an event to omit its end time.
-- Preserve the rest of the existing event_fields_required check while
-- removing only its end_time IS NOT NULL requirement.
-- Safe to rerun after the constraint has been updated.

do $$
declare
  constraint_definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_constraintdef(constraint_row.oid)
    into constraint_definition
  from pg_catalog.pg_constraint as constraint_row
  where constraint_row.conrelid = 'public.events'::regclass
    and constraint_row.conname = 'event_fields_required'
    and constraint_row.contype = 'c';

  if not found then
    raise exception 'Check constraint public.events.event_fields_required was not found.';
  end if;

  updated_definition := pg_catalog.regexp_replace(
    constraint_definition,
    'end_time[[:space:]]+IS[[:space:]]+NOT[[:space:]]+NULL',
    'TRUE',
    'gi'
  );

  if updated_definition = constraint_definition then
    -- Already optional, or the database constraint uses a different shape.
    if constraint_definition ~* 'end_time[[:space:]]+IS[[:space:]]+NOT[[:space:]]+NULL' then
      raise exception 'Could not update the end_time requirement in event_fields_required.';
    end if;
    raise notice 'event_fields_required already allows a missing end_time.';
    return;
  end if;

  execute 'alter table public.events drop constraint event_fields_required';
  execute pg_catalog.format(
    'alter table public.events add constraint event_fields_required %s',
    updated_definition
  );
end;
$$;

notify pgrst, 'reload schema';
