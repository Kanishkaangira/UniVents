-- Registration deadline and capacity are optional in the admin form.
-- The existing check incorrectly requires both whenever registration is on.
-- Remove only that check; registration_required itself remains unchanged.

alter table public.events
  drop constraint if exists registration_fields_required;

notify pgrst, 'reload schema';
