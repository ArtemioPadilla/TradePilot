-- Close Supabase advisor WARNs 0028/0029: SECURITY DEFINER functions in the
-- exposed public schema were still executable through the Data API because
-- Postgres grants EXECUTE to PUBLIC by default and anon/authenticated inherit
-- it — revoking from those roles alone (as 20260716041556 did) is not enough.
-- Neither function is meant to be called by clients: handle_new_user runs only
-- from the on_auth_user_created trigger, rls_auto_enable only as an event
-- trigger (Supabase platform safety net).

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
