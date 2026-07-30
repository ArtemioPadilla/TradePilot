-- profiles: public identity for the leaderboard (design spec
-- docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md §2).
-- One row per auth user, auto-created by the on_auth_user_created trigger.
-- Idempotent: safe to re-run.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fully public read: the leaderboard view joins against profiles.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

-- No insert policy: rows are created only by the auth trigger below.
-- No delete policy: rows are removed by the on delete cascade from auth.users.

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Auto-create a profile row on signup. security definer so it can insert
-- despite RLS; empty search_path per Supabase hardening guidance.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Not callable through the Data API; only the trigger runs it.
revoke execute on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
