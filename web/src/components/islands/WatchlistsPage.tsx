/**
 * WatchlistsPage — CRUD island for /app/watchlists (spec §4 Phase 4).
 *
 * DESTINATION: web/src/components/islands/WatchlistsPage.tsx
 *
 * One React root (compound Dialog stays in a single island). Data goes
 * through the adapter contracts only; market quotes/sparklines come from the
 * localStorage-backed cache in '@/lib/market/cache'.
 */
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Sparkline } from '@/components/ui/charts/sparkline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TagInput } from '@/components/ui/tag-input';
import { provideRepos } from '@/lib/data/supabase';
import type { Watchlist } from '@/lib/data/contracts';
import { getQuotes, getSparkline, type Quote } from '@/lib/market/cache';
import {
  WatchlistFormSchema,
  type WatchlistFormInput,
  type WatchlistFormValues,
} from '@/schemas/watchlist';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// ---------------------------------------------------------------------------
// form
// ---------------------------------------------------------------------------

function WatchlistForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Watchlist | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const form = useForm<WatchlistFormInput, unknown, WatchlistFormValues>({
    resolver: zodResolver(WatchlistFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      symbols: initial?.symbols ?? [],
    },
  });

  async function onSubmit(values: WatchlistFormValues) {
    setError(null);
    setBusy(true);
    try {
      const repos = provideRepos();
      if (initial) {
        await repos.watchlists.update(initial.id, values);
      } else {
        await repos.watchlists.create(values);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the watchlist.');
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Tech megacaps" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="symbols"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbols</FormLabel>
              <FormControl>
                <TagInput
                  value={(field.value ?? []).map((s) => String(s))}
                  onValueChange={(tags) => field.onChange(tags.map((t) => t.toUpperCase()))}
                  placeholder="AAPL, MSFT, NVDA…"
                />
              </FormControl>
              <FormDescription>Press Enter or comma to add a ticker.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create watchlist'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// quotes per card
// ---------------------------------------------------------------------------

type QuoteState = 'loading' | 'ready' | 'error';

function SymbolRow({
  symbol,
  quote,
  spark,
}: {
  symbol: string;
  quote: Quote | undefined;
  spark: number[] | undefined;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-20 truncate font-mono text-xs font-semibold text-foreground">
        {symbol}
      </span>
      <div className="min-w-0 flex-1">
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} height={28} ariaLabel={`${symbol} 30-day trend`} />
        ) : (
          <Skeleton className="h-7 w-full" />
        )}
      </div>
      <span className="w-24 text-right text-sm tabular-nums text-foreground">
        {quote ? usd.format(quote.price) : '—'}
      </span>
    </li>
  );
}

function WatchlistCard({
  watchlist,
  onEdit,
  onDelete,
}: {
  watchlist: Watchlist;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [status, setStatus] = React.useState<QuoteState>('loading');
  const [quotes, setQuotes] = React.useState<Map<string, Quote>>(new Map());
  const [sparks, setSparks] = React.useState<Map<string, number[]>>(new Map());
  const [refreshTick, setRefreshTick] = React.useState(0);

  const symbolsKey = watchlist.symbols.join(',');

  React.useEffect(() => {
    let cancelled = false;
    const symbols = symbolsKey ? symbolsKey.split(',') : [];
    if (symbols.length === 0) {
      setStatus('ready');
      return;
    }
    setStatus('loading');

    (async () => {
      // refreshTick > 0 means the user pressed Refresh → bypass the TTL.
      const q = await getQuotes(symbols, refreshTick > 0 ? { force: true } : undefined);
      if (cancelled) return;
      setQuotes(q);
      setStatus(q.size === 0 ? 'error' : 'ready');

      // Sparklines load after quotes (cheaper perceived latency); failures
      // per symbol simply leave that row's skeleton→dash fallback.
      const settled = await Promise.allSettled(symbols.map((s) => getSparkline(s)));
      if (cancelled) return;
      const next = new Map<string, number[]>();
      symbols.forEach((sym, i) => {
        const r = settled[i];
        if (r && r.status === 'fulfilled') next.set(sym, r.value.prices);
      });
      setSparks(next);
    })().catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, [watchlist.id, symbolsKey, refreshTick]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{watchlist.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardTitle>
        <CardDescription>
          {watchlist.symbols.length} symbol{watchlist.symbols.length === 1 ? '' : 's'} · quotes
          cached 15 min
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'error' ? (
          <p role="alert" className="text-sm text-destructive">
            Quotes are unavailable right now. Try refreshing in a moment.
          </p>
        ) : status === 'loading' && quotes.size === 0 ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading quotes">
            {watchlist.symbols.slice(0, 4).map((s) => (
              <Skeleton key={s} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {watchlist.symbols.map((sym) => (
              <SymbolRow key={sym} symbol={sym} quote={quotes.get(sym)} spark={sparks.get(sym)} />
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

function WatchlistsList() {
  const [watchlists, setWatchlists] = React.useState<Watchlist[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Watchlist | null>(null);

  const load = React.useCallback(() => {
    provideRepos()
      .watchlists.list()
      .then(setWatchlists)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load watchlists.'));
  }, []);

  React.useEffect(load, [load]);

  async function remove(w: Watchlist) {
    try {
      await provideRepos().watchlists.remove(w.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the watchlist.');
    }
  }

  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }

  if (!watchlists) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading watchlists">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {watchlists.length === 0
            ? 'No watchlists yet.'
            : `${watchlists.length} watchlist${watchlists.length === 1 ? '' : 's'}.`}
        </p>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button>New watchlist</Button>} />
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit watchlist' : 'New watchlist'}</DialogTitle>
              <DialogDescription>
                A named list of tickers with live quotes and 30-day trends.
              </DialogDescription>
            </DialogHeader>
            <WatchlistForm
              initial={editing}
              onSaved={() => {
                setDialogOpen(false);
                setEditing(null);
                load();
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {watchlists.length === 0 ? (
        <EmptyState
          title="Create your first watchlist"
          description="Track the symbols you care about with cached live quotes and 30-day sparklines."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {watchlists.map((w) => (
            <WatchlistCard
              key={w.id}
              watchlist={w}
              onEdit={() => {
                setEditing(w);
                setDialogOpen(true);
              }}
              onDelete={() => remove(w)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WatchlistsPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="WatchlistsPage">
        <WatchlistsList />
      </ErrorBoundary>
    </AuthGuard>
  );
}
