-- Add optional attachment metadata for notice PDFs and images.
-- Safe to run repeatedly. Uploaded files should use the event-posters bucket,
-- inside its "Notice Folder" directory, or store a complete public URL.

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

-- Convert the earlier text column. Values outside the enum are cleared so the
-- migration remains safe even if a row had an unsupported attachment label.
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

notify pgrst, 'reload schema';
