import * as React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TagInput } from '@/components/ui/tag-input';
import { fetchMultiplePrices } from '@/lib/engine/data';
import { runBacktestInWorker } from '@/lib/engine/runBacktest';
import type { BacktestConfig, BacktestResultV2, PriceData } from '@/lib/engine/types';
import {
  buildCompareRows,
  alignCurves,
  COMPARE_METRICS,
} from '@/lib/lab/compare';
import { createPool, type PoolHandle } from '@/lib/lab/pool';
import { saveBacktestRun, slicePriceMap } from '@/lib/lab/save';
import {
  buildSweepGrid,
  countCombinations,
  parseRange,
  sweepCellSummary,
  SWEEP_BUDGET,
  type SweepAxis,
  type SweepParam,
} from '@/lib/lab/sweep';
import {
  buildWalkForwardWindows,
  summarizeWalkForward,
  type WalkForwardSummary,
} from '@/lib/lab/walkforward';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';
import { HeatmapGrid } from './lab/HeatmapGrid';

// ---------------------------------------------------------------------------
// Shared base configuration (kept deliberately lean — the single-run page has
// the full form; the Lab varies parameters on top of a fixed base).
// ---------------------------------------------------------------------------

interface BaseConfig {
  symbols: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: BacktestConfig['strategy'];
  optimizer: BacktestConfig['optimizer'];
  rebalanceFreq: number;
  topN: number;
  window: number;
  t: number;
  riskFreeRate: number;
}

const DEFAULT_BASE: BaseConfig = {
  symbols: ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM'],
  startDate: '2021-01-01',
  endDate: '2024-12-31',
  initialCapital: 10_000,
  strategy: 'momentum',
  optimizer: 'MSR',
  rebalanceFreq: 5,
  topN: 3,
  window: 60,
  t: 10,
  riskFreeRate: 0.04,
};

function toEngineConfig(base: BaseConfig): BacktestConfig {
  return { ...base };
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const num = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '∞');

const METRIC_LABELS: Record<string, string> = {
  annualizedReturn: 'Ann. return',
  annualizedVol: 'Volatility',
  sharpeRatio: 'Sharpe',
  sortinoRatio: 'Sortino',
  maxDrawdown: 'Max DD',
  calmarRatio: 'Calmar',
  winRate: 'Win rate',
  profitFactor: 'Profit factor',
};

const PCT_METRICS = new Set(['annualizedReturn', 'annualizedVol', 'maxDrawdown', 'winRate']);

interface RunProgress {
  done: number;
  total: number;
}

/** One price download per Lab session config; sweeps and windows reuse it. */
function usePriceCache() {
  const cache = React.useRef<Map<string, Map<string, PriceData>>>(new Map());
  return React.useCallback(async (symbols: string[], start: string, end: string) => {
    const key = `${[...symbols].sort().join(',')}|${start}|${end}`;
    const hit = cache.current.get(key);
    if (hit) return hit;
    const fetched = await fetchMultiplePrices(symbols, start, end);
    cache.current.set(key, fetched);
    return fetched;
  }, []);
}

function BaseConfigForm({
  base,
  onChange,
  disabled,
}: {
  base: BaseConfig;
  onChange: (b: BaseConfig) => void;
  disabled: boolean;
}) {
  const numInput = (
    key: 'initialCapital' | 'rebalanceFreq' | 'topN' | 'window' | 't' | 'riskFreeRate',
    label: string,
    step?: string,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`lab-${key}`}>{label}</Label>
      <Input
        id={`lab-${key}`}
        type="number"
        step={step ?? '1'}
        disabled={disabled}
        value={String(base[key])}
        onChange={(e) => onChange({ ...base, [key]: Number(e.target.value) })}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="lab-universe">Universe</Label>
        <TagInput
          value={base.symbols}
          onValueChange={(symbols) => onChange({ ...base, symbols })}
          placeholder="Add a ticker and press Enter"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="lab-start">Start</Label>
          <Input
            id="lab-start"
            type="date"
            disabled={disabled}
            value={base.startDate}
            onChange={(e) => onChange({ ...base, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lab-end">End</Label>
          <Input
            id="lab-end"
            type="date"
            disabled={disabled}
            value={base.endDate}
            onChange={(e) => onChange({ ...base, endDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Strategy</Label>
          <Select
            value={base.strategy}
            onValueChange={(v) => onChange({ ...base, strategy: v as BaseConfig['strategy'] })}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="momentum">Momentum</SelectItem>
              <SelectItem value="meanReversion">Mean reversion</SelectItem>
              <SelectItem value="smartBeta">Smart beta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Optimizer</Label>
          <Select
            value={base.optimizer}
            onValueChange={(v) => onChange({ ...base, optimizer: v as BaseConfig['optimizer'] })}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MSR">Max Sharpe</SelectItem>
              <SelectItem value="GMV">Min variance</SelectItem>
              <SelectItem value="EW">Equal weight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {numInput('initialCapital', 'Capital')}
        {numInput('rebalanceFreq', 'Rebalance (d)')}
        {numInput('topN', 'Top N')}
        {numInput('window', 'Window')}
        {numInput('t', 'Lookback (t)')}
        {numInput('riskFreeRate', 'Risk-free', '0.005')}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

interface Variant {
  label: string;
  strategy: BacktestConfig['strategy'];
  optimizer: BacktestConfig['optimizer'];
  t: number;
  topN: number;
}

function CompareTab({ base, getPrices }: { base: BaseConfig; getPrices: ReturnType<typeof usePriceCache> }) {
  const [variants, setVariants] = React.useState<Variant[]>([
    { label: 'Momentum MSR', strategy: 'momentum', optimizer: 'MSR', t: 10, topN: 3 },
    { label: 'Smart beta EW', strategy: 'smartBeta', optimizer: 'EW', t: 10, topN: 5 },
  ]);
  const [progress, setProgress] = React.useState<RunProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ReturnType<typeof buildCompareRows> | null>(null);
  const [curves, setCurves] = React.useState<Record<string, unknown>[] | null>(null);
  const [labels, setLabels] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<Set<number>>(new Set());
  const runsRef = React.useRef<{ config: BacktestConfig; result: BacktestResultV2 }[]>([]);
  const handleRef = React.useRef<PoolHandle<BacktestResultV2> | null>(null);

  function setVariant(i: number, patch: Partial<Variant>) {
    setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  }

  async function run() {
    setError(null);
    setRows(null);
    setCurves(null);
    setSaved(new Set());
    setProgress({ done: 0, total: variants.length });
    try {
      const priceMap = await getPrices(base.symbols, base.startDate, base.endDate);
      const configs = variants.map((v) => ({
        ...toEngineConfig(base),
        strategy: v.strategy,
        optimizer: v.optimizer,
        t: v.t,
        topN: v.topN,
      }));
      const handle = createPool(
        configs,
        (cfg) => runBacktestInWorker(cfg, priceMap),
        { onProgress: (done, total) => setProgress({ done, total }) },
      );
      handleRef.current = handle;
      const outcome = await handle.promise;
      const labelList = variants.map((v) => v.label);
      runsRef.current = configs.flatMap((config, i) => {
        const result = outcome.results[i];
        return result ? [{ config, result }] : [];
      });
      setLabels(labelList);
      setRows(buildCompareRows(labelList, outcome.results));
      setCurves(alignCurves(outcome.results, labelList));
      if (outcome.errors.length > 0) {
        setError(`${outcome.errors.length} run(s) failed: ${outcome.errors[0]!.message}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compare failed.');
    } finally {
      setProgress(null);
      handleRef.current = null;
    }
  }

  async function save(i: number) {
    const run = runsRef.current[i];
    if (!run) return;
    try {
      await saveBacktestRun(run.config, run.result);
      setSaved((s) => new Set(s).add(i));
    } catch {
      setError('Could not save the run.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-lg border border-border p-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor={`variant-label-${i}`}>Label</Label>
              <Input
                id={`variant-label-${i}`}
                value={v.label}
                onChange={(e) => setVariant(i, { label: e.target.value })}
              />
            </div>
            <Select value={v.strategy} onValueChange={(s) => setVariant(i, { strategy: s as Variant['strategy'] })}>
              <SelectTrigger aria-label={`Variant ${i + 1} strategy`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="momentum">Momentum</SelectItem>
                <SelectItem value="meanReversion">Mean reversion</SelectItem>
                <SelectItem value="smartBeta">Smart beta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={v.optimizer} onValueChange={(o) => setVariant(i, { optimizer: o as Variant['optimizer'] })}>
              <SelectTrigger aria-label={`Variant ${i + 1} optimizer`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MSR">MSR</SelectItem>
                <SelectItem value="GMV">GMV</SelectItem>
                <SelectItem value="EW">EW</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              aria-label={`Variant ${i + 1} lookback`}
              value={String(v.t)}
              onChange={(e) => setVariant(i, { t: Number(e.target.value) })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                aria-label={`Variant ${i + 1} top N`}
                value={String(v.topN)}
                onChange={(e) => setVariant(i, { topN: Number(e.target.value) })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={variants.length <= 2}
                onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                aria-label={`Remove variant ${i + 1}`}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={variants.length >= 6}
            onClick={() =>
              setVariants((vs) => [
                ...vs,
                { label: `Run ${vs.length + 1}`, strategy: 'momentum', optimizer: 'EW', t: 10, topN: 3 },
              ])
            }
          >
            Add variant
          </Button>
          <Button type="button" onClick={run} disabled={progress !== null}>
            {progress ? 'Running…' : 'Run comparison'}
          </Button>
        </div>
      </div>

      {progress && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {progress.done}/{progress.total} runs finished
          </p>
          <ProgressBar value={(progress.done / Math.max(progress.total, 1)) * 100} label="Comparison progress" />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Run</th>
                  {COMPARE_METRICS.map((m) => (
                    <th key={m} className="px-2 py-2 text-right font-medium text-muted-foreground">
                      {METRIC_LABELS[m]}
                    </th>
                  ))}
                  <th className="py-2 pl-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{row.label}</td>
                    {COMPARE_METRICS.map((m) => (
                      <td key={m} className="px-2 py-2 text-right font-mono text-xs">
                        {PCT_METRICS.has(m) ? pct(row.metrics[m]!) : num(row.metrics[m]!)}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saved.has(i)}
                        onClick={() => save(i)}
                      >
                        {saved.has(i) ? 'Saved ✓' : 'Save'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {curves && (
            <Card>
              <CardHeader>
                <CardTitle>Equity curves</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={curves} index="date" series={labels} height={320} ariaLabel="Compared equity curves" />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

const SWEEP_PARAMS: { id: SweepParam; label: string }[] = [
  { id: 't', label: 'Lookback (t)' },
  { id: 'topN', label: 'Top N' },
  { id: 'rebalanceFreq', label: 'Rebalance freq' },
  { id: 'window', label: 'Window' },
];

type SweepMetric = 'sharpe' | 'annualizedReturn' | 'maxDrawdown';

function SweepTab({ base, getPrices }: { base: BaseConfig; getPrices: ReturnType<typeof usePriceCache> }) {
  const [p1, setP1] = React.useState<SweepParam>('t');
  const [r1, setR1] = React.useState('5..30:5');
  const [p2, setP2] = React.useState<SweepParam | 'none'>('topN');
  const [r2, setR2] = React.useState('2,3,5,8');
  const [metric, setMetric] = React.useState<SweepMetric>('sharpe');
  const [progress, setProgress] = React.useState<RunProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [heatmap, setHeatmap] = React.useState<{
    xLabels: string[];
    yLabels: string[];
    xName: string;
    yName: string;
    cells: (number | null)[][];
  } | null>(null);
  const [detail, setDetail] = React.useState<{ label: string; result: BacktestResultV2; config: BacktestConfig } | null>(null);
  const [detailSaved, setDetailSaved] = React.useState(false);
  const gridRef = React.useRef<{ configs: BacktestConfig[]; results: (BacktestResultV2 | null)[]; cols: number } | null>(null);
  const handleRef = React.useRef<PoolHandle<BacktestResultV2> | null>(null);

  const combos = React.useMemo(() => {
    try {
      const axes: SweepAxis[] = [{ param: p1, values: parseRange(r1) }];
      if (p2 !== 'none') axes.push({ param: p2, values: parseRange(r2) });
      return { n: countCombinations(axes), axes, err: null as string | null };
    } catch (e) {
      return { n: 0, axes: [], err: e instanceof Error ? e.message : 'Invalid range' };
    }
  }, [p1, r1, p2, r2]);

  function cancel() {
    handleRef.current?.cancel();
  }

  async function run() {
    if (combos.err || combos.n === 0) return;
    setError(null);
    setHeatmap(null);
    setDetail(null);
    setDetailSaved(false);
    setProgress({ done: 0, total: combos.n });
    try {
      const grid = buildSweepGrid(toEngineConfig(base), combos.axes);
      const priceMap = await getPrices(base.symbols, base.startDate, base.endDate);
      const handle = createPool(
        grid.configs,
        (cfg) => runBacktestInWorker(cfg, priceMap),
        { onProgress: (done, total) => setProgress({ done, total }) },
      );
      handleRef.current = handle;
      const outcome = await handle.promise;

      const axis1 = combos.axes[0]!;
      const axis2 = combos.axes[1];
      const rows = axis1.values.length;
      const cols = axis2 ? axis2.values.length : 1;
      const cells: (number | null)[][] = [];
      for (let r = 0; r < rows; r++) {
        const rowCells: (number | null)[] = [];
        for (let c = 0; c < cols; c++) {
          const result = outcome.results[r * cols + c] ?? null;
          rowCells.push(result ? sweepCellSummary(result)[metric] : null);
        }
        cells.push(rowCells);
      }
      gridRef.current = { configs: grid.configs, results: outcome.results, cols };

      setHeatmap(
        axis2
          ? {
              yLabels: axis1.values.map(String),
              xLabels: axis2.values.map(String),
              yName: axis1.param,
              xName: axis2.param,
              cells,
            }
          : {
              yLabels: [''],
              xLabels: axis1.values.map(String),
              yName: '',
              xName: axis1.param,
              // 1-axis: single heatmap row.
              cells: [cells.map((row) => row[0]!).flat()],
            },
      );
      if (outcome.errors.length > 0) {
        setError(`${outcome.errors.length} of ${combos.n} runs failed.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sweep failed.');
    } finally {
      setProgress(null);
      handleRef.current = null;
    }
  }

  function openDetail(row: number, col: number) {
    const grid = gridRef.current;
    if (!grid) return;
    const axis2Present = combos.axes.length > 1;
    const index = axis2Present ? row * grid.cols + col : col;
    const result = grid.results[index];
    const config = grid.configs[index];
    if (!result || !config) return;
    setDetail({
      label: axis2Present
        ? `${combos.axes[0]!.param}=${combos.axes[0]!.values[row]}, ${combos.axes[1]!.param}=${combos.axes[1]!.values[col]}`
        : `${combos.axes[0]!.param}=${combos.axes[0]!.values[col]}`,
      result,
      config,
    });
    setDetailSaved(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label>Axis 1</Label>
          <div className="flex gap-2">
            <Select value={p1} onValueChange={(v) => setP1(v as SweepParam)}>
              <SelectTrigger aria-label="Sweep axis 1 parameter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SWEEP_PARAMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={r1}
              onChange={(e) => setR1(e.target.value)}
              aria-label="Axis 1 range (e.g. 5..30:5)"
              placeholder="5..30:5"
            />
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label>Axis 2 (optional)</Label>
          <div className="flex gap-2">
            <Select value={p2} onValueChange={(v) => setP2(v as SweepParam | 'none')}>
              <SelectTrigger aria-label="Sweep axis 2 parameter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {SWEEP_PARAMS.filter((p) => p.id !== p1).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={r2}
              onChange={(e) => setR2(e.target.value)}
              aria-label="Axis 2 range (e.g. 2,3,5,8)"
              placeholder="2,3,5,8"
              disabled={p2 === 'none'}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={metric} onValueChange={(m) => setMetric(m as SweepMetric)}>
            <SelectTrigger aria-label="Heatmap metric" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sharpe">Sharpe</SelectItem>
              <SelectItem value="annualizedReturn">Ann. return</SelectItem>
              <SelectItem value="maxDrawdown">Max drawdown</SelectItem>
            </SelectContent>
          </Select>
          <p className={combos.n > SWEEP_BUDGET ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'}>
            {combos.err ? combos.err : `${combos.n} combinations (budget ${SWEEP_BUDGET})`}
          </p>
        </div>
        <div className="flex gap-2">
          {progress && (
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={run}
            disabled={progress !== null || Boolean(combos.err) || combos.n === 0 || combos.n > SWEEP_BUDGET}
          >
            {progress ? 'Sweeping…' : 'Run sweep'}
          </Button>
        </div>
      </div>

      {progress && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {progress.done}/{progress.total} combinations
          </p>
          <ProgressBar value={(progress.done / Math.max(progress.total, 1)) * 100} label="Sweep progress" />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {heatmap && (
        <Card>
          <CardHeader>
            <CardTitle>{METRIC_LABELS[metric === 'sharpe' ? 'sharpeRatio' : metric] ?? 'Sharpe'} heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapGrid
              {...heatmap}
              metricLabel={metric}
              onCellClick={openDetail}
              formatValue={(v) => (metric === 'sharpe' ? v.toFixed(2) : pct(v))}
            />
          </CardContent>
        </Card>
      )}

      {detail && (
        <Card>
          <CardHeader>
            <CardTitle>Run detail — {detail.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {COMPARE_METRICS.map((m) => (
                <div key={m}>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {METRIC_LABELS[m]}
                  </p>
                  <p className="font-semibold text-foreground">
                    {PCT_METRICS.has(m)
                      ? pct(detail.result.metrics[m])
                      : num(detail.result.metrics[m])}
                  </p>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={detailSaved}
              onClick={async () => {
                try {
                  await saveBacktestRun(detail.config, detail.result);
                  setDetailSaved(true);
                } catch {
                  setError('Could not save the run.');
                }
              }}
            >
              {detailSaved ? 'Saved ✓' : 'Save this run'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Walk-forward
// ---------------------------------------------------------------------------

function WalkForwardTab({ base, getPrices }: { base: BaseConfig; getPrices: ReturnType<typeof usePriceCache> }) {
  const [trainMonths, setTrainMonths] = React.useState(12);
  const [testMonths, setTestMonths] = React.useState(3);
  const [progress, setProgress] = React.useState<RunProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<WalkForwardSummary | null>(null);
  const [skipped, setSkipped] = React.useState(0);

  async function run() {
    setError(null);
    setSummary(null);
    setSkipped(0);
    try {
      const windows = buildWalkForwardWindows(base.startDate, base.endDate, trainMonths, testMonths);
      const fullPrices = await getPrices(base.symbols, base.startDate, base.endDate);
      const tasks = windows.flatMap((w) => [
        { cfg: { ...toEngineConfig(base), startDate: w.trainStart, endDate: w.trainEnd }, w },
        { cfg: { ...toEngineConfig(base), startDate: w.testStart, endDate: w.testEnd }, w },
      ]);
      setProgress({ done: 0, total: tasks.length });
      const handle = createPool(
        tasks,
        (t) => runBacktestInWorker(t.cfg, slicePriceMap(fullPrices, t.cfg.startDate, t.cfg.endDate)),
        { onProgress: (done, total) => setProgress({ done, total }) },
      );
      const outcome = await handle.promise;

      const okWindows: typeof windows = [];
      const isResults: BacktestResultV2[] = [];
      const oosResults: BacktestResultV2[] = [];
      windows.forEach((w, i) => {
        const is = outcome.results[i * 2];
        const oos = outcome.results[i * 2 + 1];
        if (is && oos) {
          okWindows.push(w);
          isResults.push(is);
          oosResults.push(oos);
        }
      });
      setSkipped(windows.length - okWindows.length);
      if (okWindows.length < 2) {
        setError('Too few windows completed to summarize (need at least 2).');
        return;
      }
      setSummary(summarizeWalkForward(isResults, oosResults, okWindows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Walk-forward failed.');
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="wf-train">Train (months)</Label>
          <Input
            id="wf-train"
            type="number"
            className="w-28"
            value={String(trainMonths)}
            onChange={(e) => setTrainMonths(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wf-test">Test (months)</Label>
          <Input
            id="wf-test"
            type="number"
            className="w-28"
            value={String(testMonths)}
            onChange={(e) => setTestMonths(Number(e.target.value))}
          />
        </div>
        <Button type="button" onClick={run} disabled={progress !== null}>
          {progress ? 'Running…' : 'Run walk-forward'}
        </Button>
      </div>

      {progress && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {progress.done}/{progress.total} window runs
          </p>
          <ProgressBar value={(progress.done / Math.max(progress.total, 1)) * 100} label="Walk-forward progress" />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">OOS Sharpe (mean)</p>
              <p className="font-display text-2xl font-semibold">{num(summary.oosMean.sharpe)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">OOS return (mean)</p>
              <p className="font-display text-2xl font-semibold">{pct(summary.oosMean.annualizedReturn)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Degradation</p>
              <p className={`font-display text-2xl font-semibold ${summary.degradation > 0.3 ? 'text-destructive' : ''}`}>
                {pct(summary.degradation)}
              </p>
            </div>
          </div>

          {summary.degradation > 0.3 && (
            <Alert variant="destructive">
              <AlertTitle>Possible overfitting</AlertTitle>
              <AlertDescription>
                Out-of-sample Sharpe degrades more than 30% versus in-sample. Treat the in-sample
                results with skepticism.
              </AlertDescription>
            </Alert>
          )}

          {skipped > 0 && (
            <p className="text-sm text-muted-foreground">{skipped} window(s) skipped (insufficient data).</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Train</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Test</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">OOS Sharpe</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">OOS return</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">OOS max DD</th>
                </tr>
              </thead>
              <tbody>
                {summary.windows.map(({ window: w, metrics }) => (
                  <tr key={w.testStart} className="border-b border-border/50 font-mono text-xs">
                    <td className="py-2 pr-4">{w.trainStart} → {w.trainEnd}</td>
                    <td className="py-2 pr-4">{w.testStart} → {w.testEnd}</td>
                    <td className="px-2 py-2 text-right">{num(metrics.sharpe)}</td>
                    <td className="px-2 py-2 text-right">{pct(metrics.annualizedReturn)}</td>
                    <td className="px-2 py-2 text-right">{pct(metrics.maxDrawdown)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function Lab() {
  const [base, setBase] = React.useState<BaseConfig>(DEFAULT_BASE);
  const getPrices = usePriceCache();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Base configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <BaseConfigForm base={base} onChange={setBase} disabled={false} />
        </CardContent>
      </Card>

      <Tabs defaultValue="compare">
        <TabsList>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="sweep">Sweep</TabsTrigger>
          <TabsTrigger value="walkforward">Walk-forward</TabsTrigger>
        </TabsList>
        <TabsContent value="compare" className="pt-6">
          <CompareTab base={base} getPrices={getPrices} />
        </TabsContent>
        <TabsContent value="sweep" className="pt-6">
          <SweepTab base={base} getPrices={getPrices} />
        </TabsContent>
        <TabsContent value="walkforward" className="pt-6">
          <WalkForwardTab base={base} getPrices={getPrices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LabPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="LabPage">
        <Lab />
      </ErrorBoundary>
    </AuthGuard>
  );
}
