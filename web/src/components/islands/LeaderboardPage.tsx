// destination: web/src/components/islands/LeaderboardPage.tsx
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { withBase } from '@/lib/href';
import { isSupabaseConfigured, requireSupabase } from '@/lib/data/supabaseClient';
import ErrorBoundary from './ErrorBoundary';

interface LeaderboardRow {
  id: string;
  created_at: string;
  sharpe: number | null;
  annualized_return: number | null;
  max_drawdown: number | null;
  username: string | null;
  display_name: string | null;
  config: { strategy?: string; optimizer?: string } | null;
}

const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(2)}%`);
const num = (v: number | null) => (v === null ? '—' : v.toFixed(2));

/**
 * Public leaderboard — reads the security_invoker `leaderboard` view (RLS of
 * backtests/profiles stays in force; only is_public rows are visible). Works
 * signed-out: the view is queried with the publishable key.
 */
function Leaderboard() {
  const [rows, setRows] = React.useState<LeaderboardRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = requireSupabase();
        // The view is not in generated types yet; query it dynamically.
        const { data, error: err } = await sb
          .from('leaderboard' as never)
          .select('*')
          .order('sharpe', { ascending: false, nullsFirst: false })
          .limit(50);
        if (err) throw new Error(err.message);
        if (!cancelled) setRows((data ?? []) as unknown as LeaderboardRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the leaderboard.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <p className="text-sm text-muted-foreground">Leaderboard unavailable in this build.</p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }
  if (!rows) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading leaderboard">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No public runs yet"
        description="Run a backtest and publish it to claim the first spot."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-3 font-medium text-muted-foreground">#</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Trader</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Strategy</th>
            <th className="px-2 py-2 text-right font-medium text-muted-foreground">Sharpe</th>
            <th className="px-2 py-2 text-right font-medium text-muted-foreground">Ann. return</th>
            <th className="px-2 py-2 text-right font-medium text-muted-foreground">Max DD</th>
            <th className="px-2 py-2 text-right font-medium text-muted-foreground">Run</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-border/50">
              <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
              <td className="py-2 pr-4 font-medium text-foreground">
                {r.display_name || r.username || 'Anonymous'}
              </td>
              <td className="py-2 pr-4">
                <Badge variant="secondary">
                  {r.config?.strategy ?? '?'} · {r.config?.optimizer ?? '?'}
                </Badge>
              </td>
              <td className="px-2 py-2 text-right font-mono text-xs">{num(r.sharpe)}</td>
              <td className="px-2 py-2 text-right font-mono text-xs">{pct(r.annualized_return)}</td>
              <td className="px-2 py-2 text-right font-mono text-xs">{pct(r.max_drawdown)}</td>
              <td className="px-2 py-2 text-right">
                <a
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                  href={withBase(`/runs/?id=${r.id}`)}
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ErrorBoundary name="LeaderboardPage">
      <Leaderboard />
    </ErrorBoundary>
  );
}
