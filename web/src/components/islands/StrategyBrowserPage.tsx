// destination: web/src/components/islands/StrategyBrowserPage.tsx
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { withBase } from '@/lib/href';
import { provideRepos } from '@/lib/data/supabase';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import type { Strategy } from '@/lib/data/contracts';
import ErrorBoundary from './ErrorBoundary';

const TYPE_LABELS: Record<string, string> = {
  momentum: 'Momentum',
  meanReversion: 'Mean reversion',
  smartBeta: 'Smart beta',
  custom: 'Custom code',
};

/** Public strategy browser — RLS exposes only is_public rows to visitors. */
function StrategyBrowser() {
  const [strategies, setStrategies] = React.useState<Strategy[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    provideRepos()
      .strategies.listPublic()
      .then((s) => {
        if (!cancelled) setStrategies(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load strategies.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <p className="text-sm text-muted-foreground">Browser unavailable in this build.</p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }
  if (!strategies) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading strategies">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (strategies.length === 0) {
    return (
      <EmptyState
        title="Nothing public yet"
        description="Mark one of your strategies as public and it will show up here."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {strategies.map((s) => {
        const params = (s.params ?? {}) as Record<string, unknown>;
        return (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{s.name}</span>
                <Badge variant="secondary">{TYPE_LABELS[s.type] ?? s.type}</Badge>
              </CardTitle>
              <CardDescription>
                Updated {new Date(s.updated_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-mono text-xs">
                {['t', 'window', 'topN']
                  .filter((k) => typeof params[k] === 'number')
                  .map((k) => `${k}=${params[k]}`)
                  .join(' · ') || 'default parameters'}
              </p>
              {s.code && (
                <pre className="max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-[11px] leading-relaxed">
                  {s.code.slice(0, 600)}
                  {s.code.length > 600 ? '\n…' : ''}
                </pre>
              )}
              <p>
                <a
                  href={withBase('/app/lab/')}
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                  Try ideas like this in the Lab →
                </a>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function StrategyBrowserPage() {
  return (
    <ErrorBoundary name="StrategyBrowserPage">
      <StrategyBrowser />
    </ErrorBoundary>
  );
}
