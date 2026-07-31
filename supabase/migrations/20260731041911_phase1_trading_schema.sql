-- Phase 1 trading schema (spec §2): accounts, holdings, transactions,
-- strategies, backtests, watchlists, alerts, orders. broker_connections is
-- explicitly deferred. RLS on every table; holdings/transactions authorize
-- through their account's owner. Idempotent throughout.

-- ───────────────────────── accounts ─────────────────────────
create table if not exists public.accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  broker     text,
  currency   text not null default 'USD',
  type       text not null default 'brokerage',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists accounts_insert on public.accounts;
create policy accounts_insert on public.accounts
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists accounts_update on public.accounts;
create policy accounts_update on public.accounts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists accounts_delete on public.accounts;
create policy accounts_delete on public.accounts
  for delete to authenticated using (user_id = (select auth.uid()));

-- ───────────────────────── holdings ─────────────────────────
-- Authorization goes through the owning account.
create table if not exists public.holdings (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  symbol     text not null,
  qty        numeric not null default 0,
  cost_basis numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists holdings_account_id_idx on public.holdings (account_id);

alter table public.holdings enable row level security;

drop policy if exists holdings_select on public.holdings;
create policy holdings_select on public.holdings
  for select to authenticated using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists holdings_insert on public.holdings;
create policy holdings_insert on public.holdings
  for insert to authenticated with check (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists holdings_update on public.holdings;
create policy holdings_update on public.holdings
  for update to authenticated
  using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists holdings_delete on public.holdings;
create policy holdings_delete on public.holdings
  for delete to authenticated using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

-- ─────────────────────── transactions ───────────────────────
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts (id) on delete cascade,
  symbol      text not null,
  side        text not null check (side in ('buy', 'sell', 'dividend', 'deposit', 'withdrawal')),
  qty         numeric not null,
  price       numeric,
  executed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists transactions_account_id_idx on public.transactions (account_id);
create index if not exists transactions_executed_at_idx on public.transactions (executed_at desc);

alter table public.transactions enable row level security;

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert to authenticated with check (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists transactions_update on public.transactions;
create policy transactions_update on public.transactions
  for update to authenticated
  using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop policy if exists transactions_delete on public.transactions;
create policy transactions_delete on public.transactions
  for delete to authenticated using (
    exists (select 1 from public.accounts a
            where a.id = account_id and a.user_id = (select auth.uid()))
  );

-- ──────────────────────── strategies ────────────────────────
create table if not exists public.strategies (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  type       text not null default 'momentum',
  params     jsonb not null default '{}'::jsonb,
  code       text,
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strategies_user_id_idx on public.strategies (user_id);
create index if not exists strategies_is_public_idx on public.strategies (is_public) where is_public;

alter table public.strategies enable row level security;

-- Selective public read (spec §2): public strategies are browsable by anyone.
drop policy if exists strategies_select on public.strategies;
create policy strategies_select on public.strategies
  for select using (is_public = true or user_id = (select auth.uid()));

drop policy if exists strategies_insert on public.strategies;
create policy strategies_insert on public.strategies
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists strategies_update on public.strategies;
create policy strategies_update on public.strategies
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists strategies_delete on public.strategies;
create policy strategies_delete on public.strategies
  for delete to authenticated using (user_id = (select auth.uid()));

-- ───────────────────────── backtests ────────────────────────
create table if not exists public.backtests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  strategy_id  uuid references public.strategies (id) on delete set null,
  config       jsonb not null default '{}'::jsonb,
  metrics      jsonb not null default '{}'::jsonb,
  equity_curve jsonb not null default '[]'::jsonb,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists backtests_user_id_idx on public.backtests (user_id);
create index if not exists backtests_is_public_idx on public.backtests (is_public) where is_public;

alter table public.backtests enable row level security;

drop policy if exists backtests_select on public.backtests;
create policy backtests_select on public.backtests
  for select using (is_public = true or user_id = (select auth.uid()));

drop policy if exists backtests_insert on public.backtests;
create policy backtests_insert on public.backtests
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists backtests_update on public.backtests;
create policy backtests_update on public.backtests
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists backtests_delete on public.backtests;
create policy backtests_delete on public.backtests
  for delete to authenticated using (user_id = (select auth.uid()));

-- ──────────────────────── watchlists ────────────────────────
create table if not exists public.watchlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  symbols    text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watchlists_user_id_idx on public.watchlists (user_id);

alter table public.watchlists enable row level security;

drop policy if exists watchlists_select on public.watchlists;
create policy watchlists_select on public.watchlists
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists watchlists_insert on public.watchlists;
create policy watchlists_insert on public.watchlists
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists watchlists_update on public.watchlists;
create policy watchlists_update on public.watchlists
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists watchlists_delete on public.watchlists;
create policy watchlists_delete on public.watchlists
  for delete to authenticated using (user_id = (select auth.uid()));

-- ────────────────────────── alerts ──────────────────────────
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  symbol     text not null,
  condition  jsonb not null default '{}'::jsonb,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alerts_user_id_idx on public.alerts (user_id);

alter table public.alerts enable row level security;

drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists alerts_insert on public.alerts;
create policy alerts_insert on public.alerts
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists alerts_update on public.alerts;
create policy alerts_update on public.alerts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists alerts_delete on public.alerts;
create policy alerts_delete on public.alerts
  for delete to authenticated using (user_id = (select auth.uid()));

-- ────────────────────────── orders ──────────────────────────
-- Schema only (spec: "future trading"); no UI in phases 1-6.
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  account_id uuid references public.accounts (id) on delete cascade,
  symbol     text not null,
  side       text not null check (side in ('buy', 'sell')),
  qty        numeric not null,
  status     text not null default 'draft' check (status in ('draft', 'submitted', 'filled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders
  for delete to authenticated using (user_id = (select auth.uid()));

-- ─────────────────── updated_at maintenance ─────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['accounts','holdings','strategies','watchlists','alerts','orders','profiles']
  loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute procedure public.touch_updated_at()', t);
  end loop;
end;
$$;
