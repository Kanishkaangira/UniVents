-- Admins can update/delete their own posts; super admins retain access to all.
-- Department/club admins can still read scope-wide posts via the existing
-- SELECT policies, but cannot alter posts created by another admin.

alter table public.events enable row level security;
grant update, delete on public.events to authenticated;

drop policy if exists admins_update_own_posts_or_super on public.events;
create policy admins_update_own_posts_or_super
  on public.events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  )
  with check (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  );

-- Restrictive guards keep any older permissive scope-wide policies from
-- granting department/club admins edit access to another admin's posts.
drop policy if exists admins_update_own_posts_or_super_guard on public.events;
create policy admins_update_own_posts_or_super_guard
  on public.events
  as restrictive
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  )
  with check (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  );

drop policy if exists admins_delete_own_posts_or_super on public.events;
create policy admins_delete_own_posts_or_super
  on public.events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  );

drop policy if exists admins_delete_own_posts_or_super_guard on public.events;
create policy admins_delete_own_posts_or_super_guard
  on public.events
  as restrictive
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admins as admin_row
      where admin_row.id = (select auth.uid())
        and (admin_row.scope_type::text = 'super' or events.created_by = admin_row.id)
    )
  );

notify pgrst, 'reload schema';
