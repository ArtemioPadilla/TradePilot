/**
 * AccountsPage — tabbed island for /app/accounts (spec §4 Phase 4):
 * Accounts | Holdings | Transactions.
 *
 * DESTINATION: web/src/components/islands/AccountsPage.tsx
 *
 * One React root: Tabs + every Dialog live inside this single island
 * (compound-component rule). All persistence goes through the adapter
 * contracts; live prices come from '@/lib/market/cache'.
 *
 * Conventions:
 * - `cost_basis` is PER-SHARE cost; unrealized P/L = (price − cost) × qty.
 * - Money is formatted with Intl.NumberFormat('en-US') in the account's
 *   currency (USD default). Live quotes are in the instrument's own quote
 *   currency (USD for US listings) — no FX conversion is attempted.
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { provideRepos } from '@/lib/data/supabase';
import type { Account, Holding, Transaction } from '@/lib/data/contracts';
import { getQuotes, type Quote } from '@/lib/market/cache';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  AccountFormSchema,
  CURRENCIES,
  type AccountFormInput,
  type AccountFormValues,
  type AccountTypeId,
} from '@/schemas/account';
import { HoldingFormSchema, type HoldingFormInput, type HoldingFormValues } from '@/schemas/holding';
import {
  CASH_SYMBOL,
  sideNeedsSymbol,
  TRANSACTION_SIDE_LABELS,
  TRANSACTION_SIDES,
  TransactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
  type TransactionSide,
} from '@/schemas/transaction';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.NumberFormat>();

/** Currency formatting per account currency; falls back to USD on bad codes. */
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

const qtyFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

function accountLabel(a: Account): string {
  return a.broker ? `${a.name} (${a.broker})` : a.name;
}

function AccountSelect({
  accounts,
  value,
  onChange,
  idPrefix,
}: {
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="max-w-sm space-y-1.5">
      <Label htmlFor={`${idPrefix}-account`}>Account</Label>
      <Select value={value ?? ''} onValueChange={(v) => onChange(String(v))}>
        <SelectTrigger id={`${idPrefix}-account`} aria-label="Select account">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {accountLabel(a)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accounts tab
// ---------------------------------------------------------------------------

function AccountForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Account | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const form = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      broker: initial?.broker ?? '',
      currency: (initial?.currency as AccountFormValues['currency']) ?? 'USD',
      type: (initial?.type as AccountTypeId) ?? 'brokerage',
    },
  });

  async function onSubmit(values: AccountFormValues) {
    setError(null);
    setBusy(true);
    try {
      const repos = provideRepos();
      if (initial) {
        await repos.accounts.update(initial.id, values);
      } else {
        await repos.accounts.create(values);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the account.');
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
                <Input placeholder="Main brokerage" {...field} value={String(field.value ?? '')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="broker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broker (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Alpaca, IBKR…" {...field} value={String(field.value ?? '')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create account'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AccountsTab({
  accounts,
  reload,
  onError,
}: {
  accounts: Account[];
  reload: () => void;
  onError: (message: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);

  async function remove(a: Account) {
    try {
      await provideRepos().accounts.remove(a.id);
      reload();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not delete the account.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length === 0
            ? 'No accounts yet.'
            : `${accounts.length} account${accounts.length === 1 ? '' : 's'}.`}
        </p>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button>New account</Button>} />
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit account' : 'New account'}</DialogTitle>
              <DialogDescription>
                A container for holdings and transactions — one per broker or goal.
              </DialogDescription>
            </DialogHeader>
            <AccountForm
              initial={editing}
              onSaved={() => {
                setDialogOpen(false);
                setEditing(null);
                reload();
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Create your first account"
          description="Group your positions per broker — then track holdings and transactions inside it."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{a.name}</span>
                  <Badge variant="secondary">{a.currency}</Badge>
                </CardTitle>
                <CardDescription>
                  {ACCOUNT_TYPE_LABELS[a.type as AccountTypeId] ?? a.type}
                  {a.broker ? ` · ${a.broker}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Created {new Date(a.created_at).toLocaleDateString()}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(a);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(a)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Holdings tab
// ---------------------------------------------------------------------------

function HoldingForm({
  accountId,
  initial,
  onSaved,
  onCancel,
}: {
  accountId: string;
  initial: Holding | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const form = useForm<HoldingFormInput, unknown, HoldingFormValues>({
    resolver: zodResolver(HoldingFormSchema),
    defaultValues: {
      symbol: initial?.symbol ?? '',
      qty: initial?.qty ?? ('' as unknown as number),
      cost_basis: initial?.cost_basis ?? null,
    },
  });

  async function onSubmit(values: HoldingFormValues) {
    setError(null);
    setBusy(true);
    try {
      const repos = provideRepos();
      if (initial) {
        await repos.holdings.update(initial.id, values);
      } else {
        await repos.holdings.create({ ...values, account_id: accountId });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the holding.');
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
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
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
          <FormField
            control={form.control}
            name="cost_basis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost basis / share</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="optional"
                    {...field}
                    value={field.value == null ? '' : String(field.value)}
                  />
                </FormControl>
                <FormDescription>Leave empty to skip P/L for this position.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add holding'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function HoldingsTab({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = React.useState<string | null>(accounts[0]?.id ?? null);
  const [holdings, setHoldings] = React.useState<Holding[] | null>(null);
  const [quotes, setQuotes] = React.useState<Map<string, Quote>>(new Map());
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Holding | null>(null);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const currency = account?.currency ?? 'USD';

  const load = React.useCallback(() => {
    if (!accountId) return;
    setHoldings(null);
    setError(null);
    provideRepos()
      .holdings.listByAccount(accountId)
      .then((rows) => {
        setHoldings(rows);
        // Quotes are best-effort: missing symbols render as '—'.
        return getQuotes(rows.map((h) => h.symbol)).then(setQuotes);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load holdings.'));
  }, [accountId]);

  React.useEffect(load, [load]);

  async function remove(h: Holding) {
    try {
      await provideRepos().holdings.remove(h.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the holding.');
    }
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        description="Create an account in the Accounts tab first, then add holdings to it."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AccountSelect
          accounts={accounts}
          value={accountId}
          onChange={setAccountId}
          idPrefix="holdings"
        />
        {accountId && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditing(null);
            }}
          >
            <DialogTrigger render={<Button>Add holding</Button>} />
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit holding' : 'Add holding'}</DialogTitle>
                <DialogDescription>
                  A position in {account ? accountLabel(account) : 'this account'}.
                </DialogDescription>
              </DialogHeader>
              <HoldingForm
                accountId={accountId}
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
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : !holdings ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading holdings">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : holdings.length === 0 ? (
        <EmptyState
          title="No holdings in this account"
          description="Add your first position to see live market value and unrealized P/L."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Cost basis / share</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Market value</TableHead>
              <TableHead className="text-right">Unrealized P/L</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((h) => {
              const quote = quotes.get(h.symbol.toUpperCase());
              const marketValue = quote ? quote.price * h.qty : null;
              const pl =
                quote && h.cost_basis != null ? (quote.price - h.cost_basis) * h.qty : null;
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-xs font-semibold">{h.symbol}</TableCell>
                  <TableCell className="text-right tabular-nums">{qtyFmt.format(h.qty)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.cost_basis == null ? '—' : fmtMoney(h.cost_basis, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {quote ? fmtMoney(quote.price, currency) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {marketValue == null ? '—' : fmtMoney(marketValue, currency)}
                  </TableCell>
                  <TableCell
                    className={
                      pl == null
                        ? 'text-right tabular-nums text-muted-foreground'
                        : pl >= 0
                          ? 'text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                          : 'text-right font-medium tabular-nums text-destructive'
                    }
                  >
                    {pl == null ? '—' : `${pl >= 0 ? '+' : ''}${fmtMoney(pl, currency)}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(h);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(h)}>
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transactions tab
// ---------------------------------------------------------------------------

const SIDE_BADGE_VARIANT: Record<TransactionSide, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  buy: 'default',
  sell: 'destructive',
  dividend: 'secondary',
  deposit: 'outline',
  withdrawal: 'outline',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function TransactionForm({
  accountId,
  onSaved,
  onCancel,
}: {
  accountId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const form = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: {
      side: 'buy',
      symbol: '',
      qty: '' as unknown as number,
      price: null,
      executed_at: todayIso(),
    },
  });

  const side = form.watch('side') as TransactionSide;

  async function onSubmit(values: TransactionFormValues) {
    setError(null);
    setBusy(true);
    try {
      await provideRepos().transactions.create({
        account_id: accountId,
        side: values.side,
        symbol: sideNeedsSymbol(values.side) ? values.symbol : values.symbol || CASH_SYMBOL,
        qty: values.qty,
        price: values.price,
        executed_at: new Date(values.executed_at).toISOString(),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the transaction.');
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="side"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Side</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRANSACTION_SIDES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {TRANSACTION_SIDE_LABELS[s]}
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
            name="executed_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Executed on</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Symbol{sideNeedsSymbol(side) ? '' : ' (optional — defaults to CASH)'}
              </FormLabel>
              <FormControl>
                <Input placeholder={sideNeedsSymbol(side) ? 'AAPL' : CASH_SYMBOL} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
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
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price / unit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="optional"
                    {...field}
                    value={field.value == null ? '' : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {busy ? 'Saving…' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function TransactionsTab({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = React.useState<string | null>(accounts[0]?.id ?? null);
  const [transactions, setTransactions] = React.useState<Transaction[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const currency = account?.currency ?? 'USD';

  const load = React.useCallback(() => {
    if (!accountId) return;
    setTransactions(null);
    setError(null);
    provideRepos()
      .transactions.listByAccount(accountId)
      .then((rows) =>
        setTransactions(
          // Newest first regardless of repo ordering.
          [...rows].sort(
            (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime(),
          ),
        ),
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load transactions.'));
  }, [accountId]);

  React.useEffect(load, [load]);

  async function remove(tx: Transaction) {
    try {
      await provideRepos().transactions.remove(tx.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the transaction.');
    }
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        description="Create an account in the Accounts tab first, then record transactions in it."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AccountSelect
          accounts={accounts}
          value={accountId}
          onChange={setAccountId}
          idPrefix="transactions"
        />
        {accountId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button>Add transaction</Button>} />
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add transaction</DialogTitle>
                <DialogDescription>
                  Recorded against {account ? accountLabel(account) : 'this account'}.
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                accountId={accountId}
                onSaved={() => {
                  setDialogOpen(false);
                  load();
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : !transactions ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions in this account"
          description="Record buys, sells, dividends, deposits, and withdrawals to build your history."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Executed</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(tx.executed_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={SIDE_BADGE_VARIANT[tx.side as TransactionSide] ?? 'outline'}>
                    {TRANSACTION_SIDE_LABELS[tx.side as TransactionSide] ?? tx.side}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">{tx.symbol}</TableCell>
                <TableCell className="text-right tabular-nums">{qtyFmt.format(tx.qty)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {tx.price == null ? '—' : fmtMoney(tx.price, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove(tx)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// shell
// ---------------------------------------------------------------------------

function AccountsManager() {
  const [accounts, setAccounts] = React.useState<Account[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    provideRepos()
      .accounts.list()
      .then(setAccounts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load accounts.'));
  }, []);

  React.useEffect(load, [load]);

  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }

  if (!accounts) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading accounts">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="accounts">
      <TabsList>
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="holdings">Holdings</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>
      <TabsContent value="accounts" className="pt-4">
        <AccountsTab accounts={accounts} reload={load} onError={setError} />
      </TabsContent>
      <TabsContent value="holdings" className="pt-4">
        <HoldingsTab accounts={accounts} />
      </TabsContent>
      <TabsContent value="transactions" className="pt-4">
        <TransactionsTab accounts={accounts} />
      </TabsContent>
    </Tabs>
  );
}

export default function AccountsPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="AccountsPage">
        <AccountsManager />
      </ErrorBoundary>
    </AuthGuard>
  );
}
