/**
 * DESTINATION: web/src/components/islands/CalculatorsPage.tsx
 *
 * Public /tools island — three calculators in one Tabs composition:
 *   1. Compound growth  — ported from the old app's CompoundGrowthCalculator
 *      (logic now in @/lib/tools/compound), projection drawn with AreaChart.
 *   2. Sharpe / Sortino — paste period returns, computed by the REAL engine
 *      functions (sharpeRatio, sortinoRatio, annualizeReturns, annualizeVol).
 *   3. Drawdown         — paste an equity curve, maxDrawdown + getDrawdown
 *      series rendered in a LineChart.
 *
 * All inputs are free-text friendly: parsing is tolerant, results are
 * NaN-guarded, and validation messages replace results instead of throwing.
 */

import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, LineChart } from '@/components/ui/charts';
import { Input } from '@/components/ui/input';
import { KpiCard } from '@/components/ui/kpi-card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  annualizeReturns,
  annualizeVol,
  getDrawdown,
  maxDrawdown,
  sharpeRatio,
  sortinoRatio,
} from '@/lib/engine/metrics';
import {
  formatCurrency,
  projectCompoundGrowth,
  type CompoundingFrequency,
} from '@/lib/tools/compound';
import { parseNumberList, parsePositiveSeries } from '@/lib/tools/parse-series';
import ErrorBoundary from './ErrorBoundary';

const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : '—');
const num = (v: number, digits = 2) => (Number.isFinite(v) ? v.toFixed(digits) : '—');

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <KpiCard className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </KpiCard>
  );
}

// ---------------------------------------------------------------------------
// 1. Compound growth (ported from the old app)
// ---------------------------------------------------------------------------

function CompoundGrowthCalculator() {
  const [initial, setInitial] = React.useState('10000');
  const [monthly, setMonthly] = React.useState('500');
  const [rate, setRate] = React.useState('7');
  const [years, setYears] = React.useState('20');
  const [frequency, setFrequency] = React.useState<CompoundingFrequency>('monthly');

  const result = React.useMemo(
    () =>
      projectCompoundGrowth({
        initialInvestment: Number(initial),
        monthlyContribution: Number(monthly),
        annualReturnRate: Number(rate),
        years: Number(years),
        compoundingFrequency: frequency,
      }),
    [initial, monthly, rate, years, frequency],
  );

  const chartData = React.useMemo(
    () =>
      result.yearlyBreakdown.map((row) => ({
        year: `Y${row.year}`,
        Balance: Math.round(row.endBalance),
        Contributions: Math.round(row.cumulativeContributions),
      })),
    [result],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assumptions</CardTitle>
          <CardDescription>Growth compounds each period; contributions are added first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cg-initial">Initial investment ($)</Label>
            <Input
              id="cg-initial"
              type="number"
              inputMode="decimal"
              min={0}
              step={1000}
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-monthly">Monthly contribution ($)</Label>
            <Input
              id="cg-monthly"
              type="number"
              inputMode="decimal"
              min={0}
              step={100}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-rate">Expected annual return (%)</Label>
            <Input
              id="cg-rate"
              type="number"
              inputMode="decimal"
              min={-100}
              max={100}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-years">Time period (years)</Label>
            <Input
              id="cg-years"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label id="cg-frequency-label">Compounding frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as CompoundingFrequency)}
            >
              <SelectTrigger aria-labelledby="cg-frequency-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label="Future value" value={formatCurrency(result.finalValue)} />
          <Kpi label="Total contributions" value={formatCurrency(result.totalContributions)} />
          <Kpi
            label="Growth earned"
            value={formatCurrency(result.totalInterestEarned)}
            hint={
              result.totalContributions > 0
                ? `${pct(result.totalInterestEarned / result.totalContributions, 0)} on money in`
                : undefined
            }
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Projection</CardTitle>
            <CardDescription>
              Balance vs. cumulative contributions — the gap between the two areas is compounding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <AreaChart
                data={chartData}
                index="year"
                series={['Balance', 'Contributions']}
                height={260}
                ariaLabel="Projected balance and cumulative contributions by year"
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Enter a time period of at least 1 year to see the projection.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Sharpe / Sortino calculator (new — engine functions on pasted returns)
// ---------------------------------------------------------------------------

const SHARPE_PLACEHOLDER = '0.012, -0.004, 0.021, 0.008, -0.013, 0.017, 0.005, -0.002, 0.011, 0.006';

function SharpeCalculator() {
  const [returnsText, setReturnsText] = React.useState(SHARPE_PLACEHOLDER);
  const [riskFree, setRiskFree] = React.useState('3');
  const [periodsPerYear, setPeriodsPerYear] = React.useState('12');

  const parsed = React.useMemo(() => parseNumberList(returnsText), [returnsText]);
  const ppy = Number(periodsPerYear);
  const rf = Number(riskFree);
  const rfValid = Number.isFinite(rf) && rf > -100 && rf < 100;

  const results = React.useMemo(() => {
    if (parsed.values.length < 2 || !rfValid) return null;
    const rfDecimal = rf / 100;
    return {
      sharpe: sharpeRatio(parsed.values, rfDecimal, ppy),
      sortino: sortinoRatio(parsed.values, rfDecimal, ppy),
      annReturn: annualizeReturns(parsed.values, ppy),
      annVol: annualizeVol(parsed.values, ppy),
    };
  }, [parsed, rf, rfValid, ppy]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your return series</CardTitle>
          <CardDescription>
            Paste period returns as decimals (0.01 = 1%) or with a % suffix (1%), separated by
            commas, spaces, or newlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sh-returns">Period returns</Label>
            <Textarea
              id="sh-returns"
              rows={6}
              spellCheck={false}
              className="font-mono text-xs"
              value={returnsText}
              onChange={(e) => setReturnsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {parsed.values.length} value{parsed.values.length === 1 ? '' : 's'} parsed
              {parsed.skipped > 0 && (
                <span className="text-destructive"> · {parsed.skipped} skipped (not numbers)</span>
              )}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sh-rf">Risk-free rate (% per year)</Label>
            <Input
              id="sh-rf"
              type="number"
              inputMode="decimal"
              step={0.25}
              value={riskFree}
              onChange={(e) => setRiskFree(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label id="sh-ppy-label">Return frequency</Label>
            <Select value={periodsPerYear} onValueChange={(v) => setPeriodsPerYear(v ?? '12')}>
              <SelectTrigger aria-labelledby="sh-ppy-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="252">Daily (252/yr)</SelectItem>
                <SelectItem value="52">Weekly (52/yr)</SelectItem>
                <SelectItem value="12">Monthly (12/yr)</SelectItem>
                <SelectItem value="4">Quarterly (4/yr)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {results ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Kpi label="Sharpe ratio" value={num(results.sharpe)} hint="Excess return per unit of volatility" />
            <Kpi label="Sortino ratio" value={num(results.sortino)} hint="Only downside volatility counts" />
            <Kpi label="Annualized return" value={pct(results.annReturn)} />
            <Kpi label="Annualized volatility" value={pct(results.annVol)} />
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {!rfValid
                ? 'Enter a risk-free rate between -100% and 100%.'
                : 'Paste at least two period returns to compute ratios.'}
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">
          Computed by the engine's <code className="rounded bg-muted px-1 py-0.5">sharpeRatio</code> and{' '}
          <code className="rounded bg-muted px-1 py-0.5">sortinoRatio</code> — identical math to the
          Backtest Lab scoreboard.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Drawdown calculator (new — engine functions on a pasted equity curve)
// ---------------------------------------------------------------------------

const DRAWDOWN_PLACEHOLDER = '10000, 10250, 10100, 10600, 10900, 10400, 9800, 10150, 10800, 11200, 10950, 11600';

function DrawdownCalculator() {
  const [equityText, setEquityText] = React.useState(DRAWDOWN_PLACEHOLDER);

  const parsed = React.useMemo(() => parsePositiveSeries(equityText), [equityText]);

  const results = React.useMemo(() => {
    if (parsed.values.length < 2) return null;
    const dd = getDrawdown(parsed.values);
    const worst = maxDrawdown(parsed.values);
    const worstIndex = dd.indexOf(worst);
    return {
      maxDD: worst,
      worstIndex,
      chartData: dd.map((v, i) => ({
        period: `${i + 1}`,
        'Drawdown %': Number((v * 100).toFixed(2)),
      })),
    };
  }, [parsed]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your equity curve</CardTitle>
          <CardDescription>
            Paste portfolio values in time order (dollars, points — any positive unit), separated by
            commas, spaces, or newlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="dd-equity">Equity values</Label>
          <Textarea
            id="dd-equity"
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
            value={equityText}
            onChange={(e) => setEquityText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {parsed.values.length} value{parsed.values.length === 1 ? '' : 's'} parsed
            {parsed.skipped > 0 && (
              <span className="text-destructive">
                {' '}· {parsed.skipped} skipped (not positive numbers)
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {results ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Kpi
                label="Maximum drawdown"
                value={pct(results.maxDD)}
                hint={results.worstIndex >= 0 ? `Trough at period ${results.worstIndex + 1}` : undefined}
              />
              <Kpi
                label="Gain needed to recover"
                value={results.maxDD < 0 ? pct(-results.maxDD / (1 + results.maxDD)) : '0.00%'}
                hint="From the trough back to the peak"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Drawdown from running peak</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={results.chartData}
                  index="period"
                  series={['Drawdown %']}
                  height={240}
                  ariaLabel="Drawdown percentage per period"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Paste at least two positive equity values to compute drawdowns.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page island
// ---------------------------------------------------------------------------

function CalculatorsInner() {
  return (
    <Tabs defaultValue="compound" className="w-full">
      <TabsList className="mb-4 w-full max-w-lg">
        <TabsTrigger value="compound" className="flex-1">Compound growth</TabsTrigger>
        <TabsTrigger value="sharpe" className="flex-1">Sharpe &amp; Sortino</TabsTrigger>
        <TabsTrigger value="drawdown" className="flex-1">Drawdown</TabsTrigger>
      </TabsList>
      <TabsContent value="compound">
        <CompoundGrowthCalculator />
      </TabsContent>
      <TabsContent value="sharpe">
        <SharpeCalculator />
      </TabsContent>
      <TabsContent value="drawdown">
        <DrawdownCalculator />
      </TabsContent>
    </Tabs>
  );
}

export default function CalculatorsPage() {
  return (
    <ErrorBoundary name="CalculatorsPage">
      <CalculatorsInner />
    </ErrorBoundary>
  );
}
