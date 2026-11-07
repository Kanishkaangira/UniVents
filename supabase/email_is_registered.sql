-- Remove the unauthenticated account-existence endpoint. It allowed callers to
-- enumerate registered addresses. Run this migration in Supabase for projects
-- where the earlier version of this function was already installed.
drop function if exists public.email_is_registered(text);
