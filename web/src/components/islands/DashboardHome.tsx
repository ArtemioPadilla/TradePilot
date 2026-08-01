/**
 * DashboardHome — the /app dashboard island (spec §4 Phase 4). Replaces
 * AppHome's plain card list with a widgets grid:
 *
 *   greeting → portfolio value KPI → watchlist quotes → recent backtests →
 *   quick links.
 *
 * DESTINATION: web/src/components/islands/DashboardHome.tsx
 * (swap into web/src/pages/app/index.astro in place of <AppHome client:load />)
 *
 * Widget independence: every widget owns its fetch + error state AND is
 * wrapped in its own <ErrorBoundary>, so one failing widget renders its own
 * error card instead of taking down the page.
 *
 * FX note: the portfolio total sums market values numerically and formats as
 * USD; per-account rows format in the account's own currency. No FX
 * conversion is attempted (quotes come back in the instrument's own quote
 * currency — USD for US listings).
 */
import * as React from 'react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Sparkline } from '@/components/ui/charts/sparkline';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { provideRepos } from '@/lib/data/supabase';
import type { Account, Backtest, Profile, Watchlist } from '@/lib/data/contracts';
import { withBase } from '@/lib/href';
import { getQuotes, getSparkline, type Quote } from '@/lib/market/cache';
import { $session } from '@/stores/session';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

// ---------------------------------------------------------------------------
// formatting helpers
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.NumberFormat>();

function fmtMoney(value: number, currency = 'USD'): string {
  let f = formatters.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    } catch {
      f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    }
    formatters.set(currency, f);
  }
  return f.format(value);
}

const num2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------
// greeting (kept from AppHome)
// ---------------------------------------------------------------------------

function Greeting() {
  const session = useStore($session);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');

  React.useEffect(() => {
    if (!session.userId) return;
    let cancelled = false;
    provideRepos()
      .profiles.get(session.userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [session.userId]);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {state === 'loading' && 'Loading your profile…'}
        {state === 'ready' && `Welcome${profile?.display_name ? `, ${profile.display_name}` : ''}!`}
        {state === 'error' && 'Welcome!'}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {state === 'error' ? 'Could not load your profile row.' : (session.email ?? 'Signed in')}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// portfolio value widget
// ---------------------------------------------------------------------------

interface AccountValue {
  account: Account;
  /** Sum of qty × live price for priced holdings, in quote currency. */
  value: number;
  pricedHoldings: number;
  totalHoldings: number;
}

type PortfolioState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; total: number; perAccount: AccountValue[] };

function PortfolioWidget() {
  const [state, setState] = React.useState<PortfolioState>({ phase: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const repos = provideRepos();
      const accounts = await repos.accounts.list();
      if (cancelled) return;
      if (accounts.length === 0) {
        setState({ phase: 'empty' });
        return;
      }

      // Holdings per account — a failed account degrades to zero holdings
      // rather than sinking the whole widget.
      const holdingsSettled = await Promise.allSettled(
        accounts.map((a) => repos.holdings.listByAccount(a.id)),
      );
      if (cancelled) return;

      const perAccountHoldings = accounts.map((account, i) => {
        const settled = holdingsSettled[i];
        return {
          account,
          holdings: settled && settled.status === 'fulfilled' ? settled.value : [],
        };
      });

      const symbols = [
        ...new Set(
          perAccountHoldings.flatMap((e) => e.holdings.map((h) => h.symbol.toUpperCase())),
        ),
      ];
      const quotes: Map<string, Quote> = symbols.length ? await getQuotes(symbols) : new Map();
      if (cancelled) return;

      const perAccount: AccountValue[] = perAccountHoldings.map(({ account, holdings }) => {
        let value = 0;
        let priced = 0;
        for (const h of holdings) {
          const quote = quotes.get(h.symbol.toUpperCase());
          if (quote) {
            value += quote.price * h.qty;
            priced += 1;
          }
        }
        return { account, value, pricedHoldings: priced, totalHoldings: holdings.length };
      });

      setState({
        phase: 'ready',
        total: perAccount.reduce((sum, e) => sum + e.value, 0),
        perAccount,
      });
    })().catch((e) => {
      if (!cancelled) {
        setState({
          phase: 'error',
          message: e instanceof Error ? e.message : 'Could not compute portfolio value.',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === 'loading') {
    return (
      <KpiCard aria-busy="true" aria-label="Loading portfolio value">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-48" />
        <Skeleton className="mt-4 h-16 w-full" />
      </KpiCard>
    );
  }

  if (state.phase === 'error') {
    return (
      <KpiCard>
        <p className="text-sm text-muted-foreground">Portfolio value</p>
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.message}
        </p>
      </KpiCard>
    );
  }

  if (state.phase === 'empty') {
    return (
      <KpiCard className="p-0">
        <EmptyState
          className="border-0"
          title="No accounts yet"
          description="Add an account with a few holdings to see your portfolio value here."
          action={
            <Button asChild>
              <a href={withBase('/app/accounts/')}>Add an account</a>
            </Button>
          }
        />
      </KpiCard>
    );
  }

  return (
    <KpiCard>
      <p className="text-sm text-muted-foreground">Portfolio value</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
        {fmtMoney(state.total)}
      </p>
      <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
        {state.perAccount.map(({ account, value, pricedHoldings, totalHoldings }) => (
          <li key={account.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-muted-foreground">{account.name}</span>
            <span className="tabular-nums text-foreground">
              {fmtMoney(value, account.currency)}
              {pricedHoldings < totalHoldings && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({pricedHoldings}/{totalHoldings} priced)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <a
        href={withBase('/app/accounts/')}
        className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-2"
      >
        Manage accounts →
      </a>
    </KpiCard>
  );
}

// ---------------------------------------------------------------------------
// watchlist widget
// ---------------------------------------------------------------------------

const WATCHLIST_WIDGET_SYMBOLS = 5;

type WatchlistWidgetState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'error' }
  | {
      phase: 'ready';
      watchlist: Watchlist;
      quotes: Map<string, Quote>;
      sparks: Map<string, number[]>;
    };

function WatchlistWidget() {
  const [state, setState] = React.useState<WatchlistWidgetState>({ phase: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const lists = await provideRepos().watchlists.list();
      if (cancelled) return;
      const first = lists[0];
      if (!first || first.symbols.length === 0) {
        setState({ phase: 'empty' });
        return;
      }
      const symbols = first.symbols.slice(0, WATCHLIST_WIDGET_SYMBOLS);
      const quotes = await getQuotes(symbols);
      if (cancelled) return;

      const sparkSettled = await Promise.allSettled(symbols.map((s) => getSparkline(s)));
      if (cancelled) return;
      const sparks = new Map<string, number[]>();
      symbols.forEach((sym, i) => {
        const r = sparkSettled[i];
        if (r && r.status === 'fulfilled') sparks.set(sym, r.value.prices);
      });

      setState({ phase: 'ready', watchlist: first, quotes, sparks });
    })().catch(() => {
      if (!cancelled) setState({ phase: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>
          {state.phase === 'ready' ? state.watchlist.name : 'Your first watchlist at a glance.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.phase === 'loading' && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading watchlist">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        )}
        {state.phase === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            Watchlist quotes are unavailable right now.
          </p>
        )}
        {state.phase === 'empty' && (
          <EmptyState
            className="border-0 py-8"
            title="No watchlists yet"
            description="Create one to pin live quotes to your dashboard."
          />
        )}
        {state.phase === 'ready' && (
          <ul className="space-y-2">
            {state.watchlist.symbols.slice(0, WATCHLIST_WIDGET_SYMBOLS).map((sym) => {
              const quote = state.quotes.get(sym);
              const spark = state.sparks.get(sym);
              return (
                <li key={sym} className="flex items-center gap-3">
                  <span className="w-20 truncate font-mono text-xs font-semibold text-foreground">
                    {sym}
                  </span>
                  <div className="min-w-0 flex-1">
                    {spark && spark.length > 1 ? (
                      <Sparkline data={spark} height={24} ariaLabel={`${sym} 30-day trend`} />
                    ) : (
                      <span className="block h-6" aria-hidden="true" />
                    )}
                  </div>
                  <span className="w-24 text-right text-sm tabular-nums text-foreground">
                    {quote ? fmtMoney(quote.price) : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <a
          href={withBase('/app/watchlists/')}
          className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-2"
        >
          All watchlists →
        </a>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// recent backtests widget
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function backtestLabel(b: Backtest): string {
  const cfg = asRecord(b.config);
  const strategy = typeof cfg.strategy === 'string' ? cfg.strategy : 'backtest';
  const optimizer = typeof cfg.optimizer === 'string' ? cfg.optimizer : null;
  return optimizer ? `${strategy} · ${optimizer}` : strategy;
}

function backtestSharpe(b: Backtest): number | null {
  const metrics = asRecord(b.metrics);
  const sharpe = metrics.sharpeRatio;
  return typeof sharpe === 'number' && Number.isFinite(sharpe) ? sharpe : null;
}

type BacktestsState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; backtests: Backtest[] };

function RecentBacktestsWidget() {
  const [state, setState] = React.useState<BacktestsState>({ phase: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    provideRepos()
      .backtests.list()
      .then((rows) => {
        if (cancelled) return;
        const recent = [...rows]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setState({ phase: 'ready', backtests: recent });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent backtests</CardTitle>
        <CardDescription>Your last five saved runs.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.phase === 'loading' && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading backtests">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        {state.phase === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            Could not load your backtests.
          </p>
        )}
        {state.phase === 'ready' &&
          (state.backtests.length === 0 ? (
            <EmptyState
              className="border-0 py-8"
              title="No backtests yet"
              description="Run one in the Backtest workbench and save the result."
            />
          ) : (
            <ul className="divide-y divide-border">
              {state.backtests.map((b) => {
                const sharpe = backtestSharpe(b);
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{backtestLabel(b)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {sharpe == null ? '—' : `Sharpe ${num2.format(sharpe)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
        <div className="mt-4 flex gap-4">
          <a
            href={withBase('/app/backtest/')}
            className="text-sm font-semibold text-primary underline underline-offset-2"
          >
            Backtest →
          </a>
          <a
            href={withBase('/app/lab/')}
            className="text-sm font-semibold text-primary underline underline-offset-2"
          >
            Lab →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// quick links
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { href: '/app/strategies/', label: 'Strategies', blurb: 'Momentum, mean reversion, custom code' },
  { href: '/app/backtest/', label: 'Backtest', blurb: 'Run a simulation in your browser' },
  { href: '/app/lab/', label: 'Backtest Lab', blurb: 'Compare variants and sweep parameters' },
] as const;

function QuickLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {QUICK_LINKS.map((link) => (
        <a
          key={link.href}
          href={withBase(link.href)}
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
        >
          <p className="font-semibold text-foreground">{link.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{link.blurb}</p>
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------

function Dashboard() {
  return (
    <div className="space-y-8">
      <Greeting />

      <ErrorBoundary name="DashboardHome/Portfolio">
        <PortfolioWidget />
      </ErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary name="DashboardHome/Watchlist">
          <WatchlistWidget />
        </ErrorBoundary>
        <ErrorBoundary name="DashboardHome/RecentBacktests">
          <RecentBacktestsWidget />
        </ErrorBoundary>
      </div>

      <QuickLinks />
    </div>
  );
}

export default function DashboardHome() {
  return (
    <AuthGuard>
      <ErrorBoundary name="DashboardHome">
        <Dashboard />
      </ErrorBoundary>
    </AuthGuard>
  );
}
