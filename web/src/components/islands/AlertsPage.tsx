/**
 * AlertsPage — CRUD island for /app/alerts (spec §4 Phase 4).
 *
 * DESTINATION: web/src/components/islands/AlertsPage.tsx
 *
 * Alerts here are CLIENT-SIDE ONLY: this app deploys to a static host with no
 * server process, so nothing evaluates conditions in the background. The
 * "Check now" button fetches a fresh quote on demand and reports
 * triggered/not-triggered inline. True background evaluation needs infra we
 * don't have yet (Supabase Edge Function on a cron + a notification channel) —
 * the JSONB `condition` column is already shaped for that future worker.
 */
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { provideRepos } from '@/lib/data/supabase';
import type { Alert } from '@/lib/data/contracts';
import { getQuote } from '@/lib/market/cache';
import {
  ALERT_KINDS,
  AlertFormSchema,
  parseAlertCondition,
  type AlertCondition,
  type AlertFormInput,
  type AlertFormValues,
} from '@/schemas/alert';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const KIND_LABELS: Record<(typeof ALERT_KINDS)[number], string> = {
  above: 'rises above',
  below: 'falls below',
};

function conditionText(condition: AlertCondition | null): string {
  if (!condition) return 'Invalid condition — edit this alert to fix it.';
  return `Price ${KIND_LABELS[condition.kind]} ${usd.format(condition.price)}`;
}

// ---------------------------------------------------------------------------
// form
// ---------------------------------------------------------------------------

function AlertForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Alert | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const initialCondition = parseAlertCondition(initial?.condition);
  const form = useForm<AlertFormInput, unknown, AlertFormValues>({
    resolver: zodResolver(AlertFormSchema),
    defaultValues: {
      symbol: initial?.symbol ?? '',
      condition: initialCondition ?? { kind: 'above', price: 0 },
      is_active: initial?.is_active ?? true,
    },
  });

  async function onSubmit(values: AlertFormValues) {
    setError(null);
    setBusy(true);
    try {
      const repos = provideRepos();
      // Fresh object literal → structurally assignable to the Json column type
      // (contracts.ts intentionally does not re-export Json; islands stay on
      // the contracts surface only).
      const payload = {
        symbol: values.symbol,
        condition: { kind: values.condition.kind, price: values.condition.price },
        is_active: values.is_active,
      };
      if (initial) {
        await repos.alerts.update(initial.id, payload);
      } else {
        await repos.alerts.create(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the alert.');
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input placeholder="AAPL" autoCapitalize="characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="condition.kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALERT_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {KIND_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="condition.price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    {...field}
                    value={String(field.value ?? '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Active</FormLabel>
                <FormDescription>Paused alerts are kept but never reported.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create alert'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// card + check-now
// ---------------------------------------------------------------------------

type CheckState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'done'; triggered: boolean; price: number }
  | { phase: 'error' };

function AlertCard({
  alert,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  alert: Alert;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const [check, setCheck] = React.useState<CheckState>({ phase: 'idle' });
  const condition = parseAlertCondition(alert.condition);

  async function checkNow() {
    if (!condition) return;
    setCheck({ phase: 'checking' });
    try {
      // force: a "check" must reflect the market now, not a 14-min-old cache.
      const quote = await getQuote(alert.symbol, { force: true });
      const triggered =
        condition.kind === 'above' ? quote.price > condition.price : quote.price < condition.price;
      setCheck({ phase: 'done', triggered, price: quote.price });
    } catch {
      setCheck({ phase: 'error' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate font-mono">{alert.symbol}</span>
          <Badge variant={alert.is_active ? 'default' : 'secondary'}>
            {alert.is_active ? 'Active' : 'Paused'}
          </Badge>
        </CardTitle>
        <CardDescription>{conditionText(condition)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm text-muted-foreground">Active</span>
          <Switch
            checked={alert.is_active}
            onCheckedChange={onToggleActive}
            aria-label={`Toggle ${alert.symbol} alert`}
          />
        </div>

        {check.phase === 'done' && (
          <p
            role="status"
            className={
              check.triggered
                ? 'text-sm font-semibold text-destructive'
                : 'text-sm text-muted-foreground'
            }
          >
            {check.triggered ? 'Triggered' : 'Not triggered'} — {alert.symbol} at{' '}
            {usd.format(check.price)}.
          </p>
        )}
        {check.phase === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            Could not fetch a quote for {alert.symbol}. Try again in a moment.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Checks run in your browser on demand — there is no background monitoring on this static
          deployment.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={checkNow}
          disabled={!condition || check.phase === 'checking'}
        >
          {check.phase === 'checking' ? 'Checking…' : 'Check now'}
        </Button>
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

function AlertsList() {
  const [alerts, setAlerts] = React.useState<Alert[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Alert | null>(null);

  const load = React.useCallback(() => {
    provideRepos()
      .alerts.list()
      .then(setAlerts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load alerts.'));
  }, []);

  React.useEffect(load, [load]);

  async function remove(a: Alert) {
    try {
      await provideRepos().alerts.remove(a.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the alert.');
    }
  }

  async function toggleActive(a: Alert, active: boolean) {
    try {
      await provideRepos().alerts.update(a.id, { is_active: active });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the alert.');
    }
  }

  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }

  if (!alerts) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading alerts">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alerts.length === 0 ? 'No alerts yet.' : `${alerts.length} alert${alerts.length === 1 ? '' : 's'}.`}
        </p>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button>New alert</Button>} />
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit alert' : 'New alert'}</DialogTitle>
              <DialogDescription>
                A price threshold you can check on demand from any device.
              </DialogDescription>
            </DialogHeader>
            <AlertForm
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

      {alerts.length === 0 ? (
        <EmptyState
          title="Create your first alert"
          description="Set a price threshold for a symbol, then use Check now to compare it against a fresh quote."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {alerts.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onEdit={() => {
                setEditing(a);
                setDialogOpen(true);
              }}
              onDelete={() => remove(a)}
              onToggleActive={(active) => toggleActive(a, active)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="AlertsPage">
        <AlertsList />
      </ErrorBoundary>
    </AuthGuard>
  );
}
