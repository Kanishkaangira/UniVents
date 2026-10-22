-- Device tokens are owned by the signed-in user. Only the Edge Function's
-- service-role client can read tokens belonging to other users.
create table if not exists public.device_tokens (
  fcm_token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  last_seen timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx
  on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from public, anon;
grant select, insert, update, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

drop policy if exists device_tokens_owner_access on public.device_tokens;
create policy device_tokens_owner_access
  on public.device_tokens
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.get_event_push_device_tokens(
  p_user_types text[],
  p_offset integer,
  p_limit integer
)
returns table (fcm_token text)
language sql
security definer
set search_path = ''
as $$
  select device_token.fcm_token
  from public.device_tokens as device_token
  join public.profiles as profile_row on profile_row.id = device_token.user_id
  where profile_row.user_type::text = any(p_user_types)
  order by device_token.fcm_token
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 1000);
$$;

revoke all on function public.get_event_push_device_tokens(text[], integer, integer)
  from public, anon, authenticated;
grant execute on function public.get_event_push_device_tokens(text[], integer, integer)
  to service_role;

alter table public.event_notifications
  add column if not exists push_sent_at timestamptz;
