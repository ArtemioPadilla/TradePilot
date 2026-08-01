/**
 * DESTINATION: web/src/components/islands/LearnContent.tsx
 *
 * Interactive half of the public /learn page: every metric card shows its
 * formula in plain text AND a worked example computed live by the REAL
 * engine functions (web/src/lib/engine/metrics.ts) on a small hardcoded
 * monthly price series — the same code that scores every backtest.
 *
 * The surrounding prose (what backtesting is, strategy families, FAQ) is
 * static and lives in pages/learn.astro; only this computation island ships JS.
 */

import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts';
import {
  annualizeReturns,
  annualizeVol,
  cvarHistoric,
  getDrawdown,
  getReturns,
  maxDrawdown,
  sharpeRatio,
  sortinoRatio,
  varHistoric,
} from '@/lib/engine/metrics';
import ErrorBoundary from './ErrorBoundary';

// ---------------------------------------------------------------------------
// Demo data — 13 month-end portfolio values (12 monthly returns).
// Small enough to eyeball, bumpy enough that every metric is non-trivial.
// ---------------------------------------------------------------------------

const DEMO_PRICES = [100, 102, 99.5, 103.1, 105.4, 101.9, 98.2, 102.6, 106.8, 104.1, 108.9, 106.2, 111.4];
const PERIODS_PER_YEAR = 12; // monthly series
const RISK_FREE = 0.03; // 3% annual

const fmtPct = (v: number, digits = 2) => `${(v * 100).toFixed(digits)}%`;
const fmtNum = (v: number, digits = 2) => (Number.isFinite(v) ? v.toFixed(digits) : '—');

interface MetricCardData {
  title: string;
  formula: string;
  /** What the formula symbols mean + how to read the number. */
  explanation: string;
  /** The live-computed example line. */
  example: string;
  /** Rule-of-thumb interpretation. */
  ruleOfThumb: string;
}

function buildMetricCards(): MetricCardData[] {
  const returns = getReturns(DEMO_PRICES);
  const annRet = annualizeReturns(returns, PERIODS_PER_YEAR);
  const annVol = annualizeVol(returns, PERIODS_PER_YEAR);
  const sharpe = sharpeRatio(returns, RISK_FREE, PERIODS_PER_YEAR);
  const sortino = sortinoRatio(returns, RISK_FREE, PERIODS_PER_YEAR);
  const mdd = maxDrawdown(DEMO_PRICES);
  const var5 = varHistoric(returns, 0, 5);
  const cvar5 = cvarHistoric(returns, 0, 5);
  const first = DEMO_PRICES[0] ?? 0;
  const second = DEMO_PRICES[1] ?? 0;
  const firstReturn = returns[0] ?? 0;

  return [
    {
      title: 'Returns & annualized return',
      formula: 'Rₜ = (Pₜ − Pₜ₋₁) / Pₜ₋₁    R_ann = (∏(1 + Rₜ))^(N/n) − 1',
      explanation:
        'Each period return Rₜ is the percentage change in value. To compare series of different lengths, compound all n returns and rescale to N periods per year (N = 12 for monthly data).',
      example: `First month: (${second} − ${first}) / ${first} = ${fmtPct(firstReturn)}. Compounding all ${returns.length} monthly returns → annualized return ${fmtPct(annRet)}.`,
      ruleOfThumb:
        'Always compare annualized figures — a 10% total return means very different things over 6 months vs. 6 years.',
    },
    {
      title: 'Volatility (annualized)',
      formula: 'σ_ann = σ(R) · √N',
      explanation:
        'The standard deviation of period returns, scaled by the square root of periods per year. It measures how bumpy the ride is — not whether it goes up or down.',
      example: `Demo series: monthly σ scaled by √12 → annualized volatility ${fmtPct(annVol)}.`,
      ruleOfThumb:
        'Broad equity indexes historically sit around 15–20% annualized. Double the volatility ≈ double the size of a typical swing.',
    },
    {
      title: 'Sharpe ratio',
      formula: 'Sharpe = R_excess,ann / σ_ann    where R_excess = R − R_f',
      explanation:
        'Excess return (above the risk-free rate R_f) per unit of total volatility. The single most-quoted risk-adjusted performance number.',
      example: `Demo series with R_f = ${fmtPct(RISK_FREE, 0)}: annualized excess return ÷ ${fmtPct(annVol)} volatility → Sharpe ${fmtNum(sharpe)}.`,
      ruleOfThumb:
        'Above 1.0 is generally considered good, above 2.0 very good, above 3.0 excellent — and worth double-checking for overfitting.',
    },
    {
      title: 'Sortino ratio',
      formula: 'Sortino = R_excess,ann / σ_down,ann    σ_down = σ(R | R < 0) · √N',
      explanation:
        'Like Sharpe, but the denominator only counts DOWNSIDE deviation — volatility from negative periods. Upside surprises are not penalized.',
      example: `Demo series: ${returns.filter((r) => r < 0).length} of ${returns.length} months were negative → Sortino ${fmtNum(sortino)} (vs. Sharpe ${fmtNum(sharpe)}).`,
      ruleOfThumb:
        'Sortino > Sharpe on the same series means most of the volatility came from up moves — usually a good sign.',
    },
    {
      title: 'Maximum drawdown',
      formula: 'DDₜ = (Pₜ − peakₜ) / peakₜ    MaxDD = min(DDₜ)',
      explanation:
        'The worst peak-to-trough decline over the whole period. The single best gut-check: could you have held through that loss without abandoning the strategy?',
      example: `Demo series peaks at ${Math.max(...DEMO_PRICES)} and its worst trough after a peak gives MaxDD ${fmtPct(mdd)}.`,
      ruleOfThumb:
        'Recovering from a −50% drawdown requires a +100% gain. Deep drawdowns are why high-return backtests still fail live.',
    },
    {
      title: 'VaR & CVaR (5%)',
      formula: 'VaR₅ = −percentile(R, 5)    CVaR₅ = −mean(R | R ≤ −VaR₅)',
      explanation:
        'Historic Value at Risk: the loss threshold your worst 5% of periods exceed. CVaR (expected shortfall) answers the follow-up — when you DO land in that worst 5%, how bad is it on average?',
      example: `Demo series: monthly VaR₅ = ${fmtPct(var5)} — in 95% of months you lose less than that. CVaR₅ = ${fmtPct(cvar5)}, the average loss inside the worst tail.`,
      ruleOfThumb:
        'CVaR is always ≥ VaR. A big gap between them warns of rare-but-severe tail losses that VaR alone hides.',
    },
  ];
}

function LearnContentInner() {
  // Deterministic pure computation — memoized once per mount.
  const cards = React.useMemo(() => buildMetricCards(), []);
  const chartData = React.useMemo(
    () => DEMO_PRICES.map((p, i) => ({ month: `M${i}`, Value: p })),
    [],
  );
  const drawdownData = React.useMemo(
    () =>
      getDrawdown(DEMO_PRICES).map((dd, i) => ({
        month: `M${i}`,
        'Drawdown %': Number((dd * 100).toFixed(2)),
      })),
    [],
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground">
          The demo series every example below uses
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thirteen month-end portfolio values ({DEMO_PRICES.join(', ')}). Every number in the
          metric cards is computed in your browser, right now, by the same engine functions
          (<code className="rounded bg-muted px-1 py-0.5 text-xs">@/lib/engine/metrics</code>) that
          score real backtests — nothing is hardcoded.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Portfolio value</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={chartData} index="month" series={['Value']} height={180} ariaLabel="Demo portfolio value by month" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Drawdown from peak (computed with getDrawdown)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={drawdownData} index="month" series={['Drawdown %']} height={180} ariaLabel="Demo drawdown percentage by month" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-base">{card.title}</CardTitle>
              <CardDescription>
                <code className="block overflow-x-auto whitespace-pre rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground">
                  {card.formula}
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{card.explanation}</p>
              <p className="rounded-md border border-border bg-muted/40 p-3 text-foreground">
                <span className="font-semibold">Worked example — </span>
                {card.example}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">Rule of thumb: </span>
                {card.ruleOfThumb}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function LearnContent() {
  return (
    <ErrorBoundary name="LearnContent">
      <LearnContentInner />
    </ErrorBoundary>
  );
}
