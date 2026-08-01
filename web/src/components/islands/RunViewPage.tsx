// destination: web/src/components/islands/RunViewPage.tsx
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { withBase } from '@/lib/href';
import { provideRepos } from '@/lib/data/supabase';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import type { Backtest } from '@/lib/data/contracts';
import ErrorBoundary from './ErrorBoundary';

const pct = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : '—';
const num = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '—';

interface CurvePoint {
  date: string;
  portfolio: number;
  benchmark?: number;
}

/**
 * Public shared-run view (/runs/?id=<uuid>). Static hosting → the id travels
 * as a query param; RLS decides visibility (own runs, or is_public for
 * everyone incl. signed-out visitors).
 */
function RunView() {
  const [state, setState] = React.useState<'loading' | 'missing' | 'error' | 'ready'>('loading');
  const [run, setRun] = React.useState<Backtest | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setState('error');
      return;
    }
    const id = new URLSearchParams(location.search).get('id');
    if (!id) {
      setState('missing');
      return;
    }
    let cancelled = false;
    provideRepos()
      .backtests.get(id)
      .then((r) => {
        if (cancelled) return;
        setRun(r);
        setState(r ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading run">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (state === 'missing') {
    return (
      <p className="text-sm text-muted-foreground">
        This run doesn't exist or isn't public.{' '}
        <a href={withBase('/leaderboard/')} className="font-semibold text-primary underline">
          Back to the leaderboard
        </a>
      </p>
    );
  }
  if (state === 'error' || !run) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        Could not load this run.
      </p>
    );
  }

  const metrics = (run.metrics ?? {}) as Record<string, unknown>;
  const config = (run.config ?? {}) as Record<string, unknown>;
  const curve = (Array.isArray(run.equity_curve) ? run.equity_curve : []) as unknown as CurvePoint[];
  const hasBenchmark = curve.some((p) => typeof p.benchmark === 'number');

  const kpis: [string, string][] = [
    ['Ann. return', pct(metrics.annualizedReturn)],
    ['Sharpe', num(metrics.sharpeRatio)],
    ['Max drawdown', pct(metrics.maxDrawdown)],
    ['Volatility', pct(metrics.annualizedVol)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {String(config.strategy ?? '?')} · {String(config.optimizer ?? '?')} ·{' '}
          {String(config.startDate ?? '')} → {String(config.endDate ?? '')} · published{' '}
          {new Date(run.created_at).toLocaleDateString()}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard unavailable — the URL bar still works.
            }
          }}
        >
          {copied ? 'Link copied ✓' : 'Copy share link'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([label, value]) => (
          <KpiCard key={label} className="p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
          </KpiCard>
        ))}
      </div>

      {curve.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Equity curve{hasBenchmark ? ' vs benchmark' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={curve as unknown as Record<string, unknown>[]}
              index="date"
              series={hasBenchmark ? ['portfolio', 'benchmark'] : ['portfolio']}
              height={320}
              ariaLabel="Shared run equity curve"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RunViewPage() {
  return (
    <ErrorBoundary name="RunViewPage">
      <RunView />
    </ErrorBoundary>
  );
}
