-- Phase 5: leaderboard view (spec §2) — security_invoker so the underlying
-- RLS policies decide visibility (public backtests + public-read profiles);
-- no duplicate table, no RLS bypass. Ranked by Sharpe from metrics JSONB.

create or replace view public.leaderboard
with (security_invoker = true) as
select
  b.id,
  b.created_at,
  b.config,
  b.metrics,
  (b.metrics ->> 'sharpeRatio')::numeric      as sharpe,
  (b.metrics ->> 'annualizedReturn')::numeric as annualized_return,
  (b.metrics ->> 'maxDrawdown')::numeric      as max_drawdown,
  p.username,
  p.display_name
from public.backtests b
join public.profiles p on p.id = b.user_id
where b.is_public = true;

comment on view public.leaderboard is
  'Public backtest runs joined with public profiles; security_invoker keeps RLS in force.';

-- Views get no default grants for API roles; security_invoker still applies
-- the underlying RLS, so this only exposes what policies already allow.
grant select on public.leaderboard to anon, authenticated;
