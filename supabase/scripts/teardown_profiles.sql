-- Teardown for supabase/migrations/20260716041556_create_profiles.sql.
-- NOT a migration: lives outside supabase/migrations/ so `supabase db push`
-- never runs it. Run manually (SQL editor or psql) to reverse the migration.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Policies first (harmless once the table drops, but explicit for the case
-- where you only want to reset the policies and keep the data — run just
-- this block for that).
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;

alter table public.profiles disable row level security;

-- DESTRUCTIVE: removes the table and all profile rows.
drop table if exists public.profiles;
