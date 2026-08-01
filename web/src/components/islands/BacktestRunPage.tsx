import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart } from '@/components/ui/charts';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { KpiCard } from '@/components/ui/kpi-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TagInput } from '@/components/ui/tag-input';
import { fetchMultiplePrices } from '@/lib/engine/data';
import { runBacktestInWorker } from '@/lib/engine/runBacktest';
import type { BacktestConfig, BacktestResultV2 } from '@/lib/engine/types';
import { provideRepos } from '@/lib/data/supabase';
import {
  BacktestFormSchema,
  type BacktestFormInput,
  type BacktestFormValues,
} from '@/schemas/backtest';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

type RunState =
  | { phase: 'idle' }
  | { phase: 'fetching'; done: number; total: number }
  | { phase: 'running'; fraction: number }
  | { phase: 'done'; result: BacktestResultV2; config: BacktestConfig }
  | { phase: 'error'; message: string };

const BENCHMARK = 'SPY';

/** JSONB-safe: Infinity/NaN → null (Postgres jsonb rejects them as numbers). */
function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) =>
      typeof v === 'number' && !Number.isFinite(v) ? null : v,
    ),
  ) as T;
}

/** Downsample long daily series so Recharts stays fluid. */
function sampleCurve(dates: string[], values: number[], benchmark: number[] | null, max = 400) {
  const step = Math.max(1, Math.ceil(dates.length / max));
  const rows: { date: string; portfolio: number; benchmark?: number }[] = [];
  for (let i = 0; i < dates.length; i += step) {
    const row: { date: string; portfolio: number; benchmark?: number } = {
      date: dates[i]!,
      portfolio: Math.round(values[i]! * 100) / 100,
    };
    if (benchmark && benchmark[i] != null) row.benchmark = Math.round(benchmark[i]! * 100) / 100;
    rows.push(row);
  }
  return rows;
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const num = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '∞');

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <KpiCard className="p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
    </KpiCard>
  );
}

function Results({ result, config }: { result: BacktestResultV2; config: BacktestConfig }) {
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [publish, setPublish] = React.useState(false);
  const m = result.metrics;

  const curve = React.useMemo(
    () => sampleCurve(result.dates, result.portfolioValues, result.benchmarkValues),
    [result],
  );
  const monthly = React.useMemo(
    () =>
      result.monthlyReturns.map((r) => ({
        month: r.month,
        return: Math.round(r.return * 10000) / 100,
      })),
    [result],
  );

  async function save() {
    setSaveState('saving');
    try {
      await provideRepos().backtests.create({
        config: jsonSafe(config) as never,
        metrics: jsonSafe({
          ...m,
          monthlyReturns: result.monthlyReturns,
          topDrawdowns: result.topDrawdowns,
        }) as never,
        equity_curve: jsonSafe(
          sampleCurve(result.dates, result.portfolioValues, result.benchmarkValues, 1000),
        ) as never,
        is_public: publish,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Annual return" value={pct(m.annualizedReturn)} />
        <Metric label="Volatility" value={pct(m.annualizedVol)} />
        <Metric label="Sharpe" value={num(m.sharpeRatio)} />
        <Metric label="Max drawdown" value={pct(m.maxDrawdown)} />
        <Metric label="Sortino" value={num(m.sortinoRatio)} />
        <Metric label="Calmar" value={num(m.calmarRatio)} />
        <Metric label="Win rate" value={pct(m.winRate)} />
        <Metric label="Profit factor" value={num(m.profitFactor)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equity curve{result.benchmarkValues ? ` vs ${BENCHMARK}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={curve}
            index="date"
            series={result.benchmarkValues ? ['portfolio', 'benchmark'] : ['portfolio']}
            height={320}
            ariaLabel="Portfolio equity curve"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly returns (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={monthly} index="month" series={['return']} height={240} ariaLabel="Monthly returns" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worst drawdowns</CardTitle>
          </CardHeader>
          <CardContent>
            {result.topDrawdowns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drawdowns in this period.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {result.topDrawdowns.map((d) => (
                  <li key={d.start} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {d.start} → {d.end ?? 'ongoing'}
                    </span>
                    <span className="font-semibold text-destructive">{pct(d.depth)}</span>
                    <span className="text-xs text-muted-foreground">{d.lengthDays}d</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 rounded-lg border border-border p-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={publish} onCheckedChange={setPublish} />
          Publish to leaderboard
        </label>
        <Button onClick={save} disabled={saveState === 'saving' || saveState === 'saved'}>
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save run'}
        </Button>
        {saveState === 'error' && (
          <p role="alert" className="text-sm font-medium text-destructive">
            Could not save the run.
          </p>
        )}
      </div>
    </div>
  );
}

function BacktestRunner() {
  const [run, setRun] = React.useState<RunState>({ phase: 'idle' });

  const form = useForm<BacktestFormInput, unknown, BacktestFormValues>({
    resolver: zodResolver(BacktestFormSchema),
    defaultValues: {
      symbols: ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA'],
      strategy: 'momentum',
      optimizer: 'MSR',
      startDate: '2022-01-01',
      endDate: '2024-12-31',
      initialCapital: 10_000,
      rebalanceFreq: 5,
      topN: 3,
      window: 60,
      t: 10,
      riskFreeRate: 0.04,
      costBps: 0,
      slippageBps: 0,
      withBenchmark: true,
    },
  });

  async function onSubmit(v: BacktestFormValues) {
    const config: BacktestConfig = {
      symbols: v.symbols,
      strategy: v.strategy,
      optimizer: v.optimizer,
      startDate: v.startDate,
      endDate: v.endDate,
      initialCapital: v.initialCapital,
      rebalanceFreq: v.rebalanceFreq,
      topN: v.topN,
      riskFreeRate: v.riskFreeRate,
      window: v.window,
      t: v.t,
      costs:
        v.costBps || v.slippageBps
          ? { costBps: v.costBps, slippageBps: v.slippageBps }
          : undefined,
      benchmarkSymbol: v.withBenchmark ? BENCHMARK : undefined,
    };

    const universe = v.withBenchmark ? [...new Set([...v.symbols, BENCHMARK])] : v.symbols;
    setRun({ phase: 'fetching', done: 0, total: universe.length });
    try {
      const priceMap = await fetchMultiplePrices(universe, v.startDate, v.endDate);
      const missing = v.symbols.filter((s) => !priceMap.has(s));
      if (missing.length > 0) {
        setRun({ phase: 'error', message: `No price data for: ${missing.join(', ')}.` });
        return;
      }
      setRun({ phase: 'running', fraction: 0 });
      const result = await runBacktestInWorker(config, priceMap, (fraction) =>
        setRun({ phase: 'running', fraction }),
      );
      setRun({ phase: 'done', result, config });
    } catch (e) {
      setRun({
        phase: 'error',
        message: e instanceof Error ? e.message : 'Backtest failed unexpectedly.',
      });
    }
  }

  const busy = run.phase === 'fetching' || run.phase === 'running';

  const numberField = (
    name: 'initialCapital' | 'rebalanceFreq' | 'topN' | 'window' | 't' | 'riskFreeRate' | 'costBps' | 'slippageBps',
    label: string,
    step?: string,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="decimal"
              step={step ?? '1'}
              {...field}
              value={String(field.value ?? '')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configure a run</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="symbols"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Universe</FormLabel>
                    <FormControl>
                      <TagInput
                        value={(field.value ?? []) as string[]}
                        onValueChange={field.onChange}
                        placeholder="Add a ticker and press Enter"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="momentum">Momentum</SelectItem>
                          <SelectItem value="meanReversion">Mean reversion</SelectItem>
                          <SelectItem value="smartBeta">Smart beta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="optimizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optimizer</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MSR">Max Sharpe (MSR)</SelectItem>
                          <SelectItem value="GMV">Min variance (GMV)</SelectItem>
                          <SelectItem value="EW">Equal weight</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={String(field.value ?? '')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={String(field.value ?? '')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {numberField('initialCapital', 'Capital (USD)')}
                {numberField('rebalanceFreq', 'Rebalance (days)')}
                {numberField('topN', 'Top N')}
                {numberField('window', 'Window')}
                {numberField('t', 'Lookback (t)')}
                {numberField('riskFreeRate', 'Risk-free rate', '0.005')}
                {numberField('costBps', 'Cost (bps)')}
                {numberField('slippageBps', 'Slippage (bps)')}
              </div>

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="withBenchmark"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      Compare against {BENCHMARK}
                    </label>
                  )}
                />
                <Button type="submit" disabled={busy}>
                  {busy ? 'Running…' : 'Run backtest'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {run.phase === 'fetching' && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">Downloading market data…</p>
          <ProgressBar value={run.total === 0 ? 0 : (run.done / run.total) * 100} label="Market data download" />
        </div>
      )}

      {run.phase === 'running' && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Simulating… {(run.fraction * 100).toFixed(0)}%
          </p>
          <ProgressBar value={run.fraction * 100} label="Backtest progress" />
        </div>
      )}

      {run.phase === 'error' && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {run.message}
        </p>
      )}

      {run.phase === 'done' && <Results result={run.result} config={run.config} />}
    </div>
  );
}

export default function BacktestRunPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="BacktestRunPage">
        <BacktestRunner />
      </ErrorBoundary>
    </AuthGuard>
  );
}
