-- Events attachment schema.
-- Additive schema definition for notice PDF/image attachments.
-- The full events table is managed by the existing database migrations.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'attachment_type_enum'
  ) then
    create type public.attachment_type_enum as enum ('pdf', 'image');
  end if;
end
$$;

alter table public.events
  add column if not exists attachment_url text,
  add column if not exists attachment_type public.attachment_type_enum,
  add column if not exists attachment_name text;

do $$
declare
  current_type text;
begin
  select udt_name into current_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'attachment_type';

  if current_type is distinct from 'attachment_type_enum' then
    alter table public.events
      alter column attachment_type type public.attachment_type_enum
      using (
        case
          when lower(btrim(attachment_type)) in ('pdf', 'image')
            then lower(btrim(attachment_type))::public.attachment_type_enum
          else null
        end
      );
  end if;
end
$$;
