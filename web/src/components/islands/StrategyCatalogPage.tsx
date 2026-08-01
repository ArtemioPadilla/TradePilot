/**
 * DESTINATION: web/src/components/islands/StrategyCatalogPage.tsx
 *
 * Public /catalog island — interactive catalog of the built-in strategy
 * types. Explanations, formulas, parameters, and pros/cons are ported from
 * the old app's StrategyCatalog.tsx; the "see it rank" demo runs the REAL
 * engine strategy functions (@/lib/engine/strategies) on the deterministic
 * sample-data generator from @/lib/ai/strategy-executor — same code path the
 * Strategy Builder uses. Also lists the 5 AI strategy templates
 * (@/lib/ai/strategy-templates) with a live sandboxed run of each.
 */

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { executeStrategy, generateSampleData } from '@/lib/ai/strategy-executor';
import {
  meanReversionStrategy,
  momentumStrategy,
  smartBetaStrategy,
} from '@/lib/engine/strategies';
import { strategyTemplates } from '@/lib/ai/strategy-templates';
import { withBase } from '@/lib/href';
import ErrorBoundary from './ErrorBoundary';

// ---------------------------------------------------------------------------
// Built-in strategy content — ported from the old app's StrategyCatalog.tsx
// (descriptions, formulas, steps, pros/cons, use cases), parameters aligned
// with the TypeScript engine signatures instead of the Python ones.
// ---------------------------------------------------------------------------

interface StrategyParam {
  name: string;
  type: string;
  desc: string;
}

interface BuiltinStrategy {
  id: 'momentum' | 'meanReversion' | 'smartBeta';
  title: string;
  description: string;
  formula: string;
  formulaDesc: string;
  parameters: StrategyParam[];
  steps: string[];
  pros: string[];
  cons: string[];
  useCase: string;
  /** Whether the demo exposes a lookback (t) input. */
  hasLookback: boolean;
  defaultT: number;
  run: (prices: Map<string, number[]>, t: number) => string[];
}

const BUILTIN_STRATEGIES: BuiltinStrategy[] = [
  {
    id: 'momentum',
    title: 'Momentum',
    description:
      'Selects assets with the strongest recent price momentum, betting that recent winners will continue to outperform.',
    formula: 'Momentum(i) = P(i, today) − P(i, today − t)',
    formulaDesc:
      'Where P(i, t) is the price of asset i at time t, and t is the lookback period in trading days.',
    parameters: [
      { name: 't', type: 'number', desc: 'Lookback period in trading days (engine default: 10)' },
      { name: 'prices', type: 'Map<string, number[]>', desc: 'Symbol → historical price series' },
    ],
    steps: [
      'Fetch historical closing prices for all assets in the universe',
      'Calculate momentum = current price − price t periods ago',
      'Rank assets by momentum score (highest first)',
      'Select the top N assets for the portfolio',
      'Pass the selection to the optimizer for weight allocation',
    ],
    pros: [
      'Simple and intuitive',
      'Well-documented academic support',
      'Works in trending markets',
      'Easy to implement and backtest',
    ],
    cons: [
      'Suffers in mean-reverting markets',
      'Can lead to high turnover',
      'Momentum crashes during regime changes',
      'Lookback-period sensitivity',
    ],
    useCase:
      'Best for trending markets with clear directional moves. Commonly used in cross-sectional equity strategies.',
    hasLookback: true,
    defaultT: 20,
    run: (prices, t) => momentumStrategy(prices, t),
  },
  {
    id: 'meanReversion',
    title: 'Mean reversion',
    description:
      'Identifies oversold assets trading below their moving average, betting they will revert to the mean.',
    formula: 'Deviation(i) = P(i, today) − SMA(i, t)',
    formulaDesc:
      'Where SMA(i, t) is the Simple Moving Average of asset i over t periods. Most negative = most oversold, ranked first.',
    parameters: [
      { name: 't', type: 'number', desc: 'Moving-average window in trading days (engine default: 20)' },
      { name: 'prices', type: 'Map<string, number[]>', desc: 'Symbol → historical price series' },
    ],
    steps: [
      'Calculate the t-period Simple Moving Average for each asset',
      'Compute deviation = current price − SMA',
      'Rank assets by deviation ascending — most oversold first',
      'Select the top N most oversold assets',
      'Allocate weights via the chosen optimizer',
    ],
    pros: [
      'Contrarian approach captures rebounds',
      'Works well in range-bound markets',
      'Can identify undervalued assets',
      'Natural buy-low mechanism',
    ],
    cons: [
      'Can catch falling knives',
      'Underperforms in strong trends',
      'Requires accurate mean estimation',
      'Risk of value traps',
    ],
    useCase:
      'Best for range-bound or mean-reverting markets. Pairs well with a minimum-variance optimizer for risk management.',
    hasLookback: true,
    defaultT: 20,
    run: (prices, t) => meanReversionStrategy(prices, t),
  },
  {
    id: 'smartBeta',
    title: 'Smart beta',
    description:
      'Ranks assets by their risk-adjusted returns (return per unit of risk), similar to a per-asset Sharpe ratio.',
    formula: 'SmartBeta(i) = mean(Rᵢ) / std(Rᵢ)',
    formulaDesc:
      'Where Rᵢ are the period returns of asset i. Higher ratio = better risk-adjusted performance, ranked first.',
    parameters: [
      { name: 'prices', type: 'Map<string, number[]>', desc: 'Symbol → historical price series' },
    ],
    steps: [
      'Calculate daily returns for each asset',
      'Compute mean return and standard deviation for each',
      'Score each asset as mean / std (risk-adjusted return)',
      'Rank by score descending — best risk-adjusted performers first',
      'Select the top N assets and optimize weights',
    ],
    pros: [
      'Risk-aware selection',
      'Favors consistent performers',
      'Produces less volatile portfolios',
      'Built on the academic Sharpe-ratio foundation',
    ],
    cons: [
      'Backward-looking (past ≠ future)',
      'Penalizes high-growth volatile stocks',
      'Sensitive to the estimation period',
      'May underperform in strong bull markets',
    ],
    useCase:
      'Best for investors seeking risk-adjusted returns. Works well for long-term portfolio construction.',
    hasLookback: false,
    defaultT: 20,
    run: (prices) => smartBetaStrategy(prices),
  },
];

// ---------------------------------------------------------------------------
// Ranking demo — the real strategy function on the deterministic sample data
// ---------------------------------------------------------------------------

function RankingDemo({ strategy }: { strategy: BuiltinStrategy }) {
  const [lookback, setLookback] = React.useState(String(strategy.defaultT));

  // generateSampleData is seeded (deterministic) — every visitor sees the
  // same universe, so the ranking below is stable and explainable.
  const prices = React.useMemo(() => generateSampleData(), []);

  const t = Number(lookback);
  const tValid = Number.isInteger(t) && t >= 2 && t <= 250;

  const ranking = React.useMemo(() => {
    if (!tValid) return null;
    try {
      return strategy.run(prices, t);
    } catch {
      return null;
    }
  }, [prices, strategy, t, tValid]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <p className="text-sm font-semibold text-foreground">See it rank</p>
        {strategy.hasLookback && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`t-${strategy.id}`} className="text-xs text-muted-foreground">
              Lookback t (days)
            </Label>
            <Input
              id={`t-${strategy.id}`}
              type="number"
              inputMode="numeric"
              min={2}
              max={250}
              step={1}
              className="h-8 w-24"
              value={lookback}
              onChange={(e) => setLookback(e.target.value)}
            />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Live output of <code className="rounded bg-muted px-1 py-0.5">{strategy.id}Strategy()</code>{' '}
        on 252 days of seeded sample data for {generateSampleDataSymbols()}.
      </p>
      {!tValid ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Lookback must be a whole number between 2 and 250.
        </p>
      ) : ranking && ranking.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="w-24">Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((symbol, idx) => (
                <TableRow key={symbol}>
                  <TableCell className="font-mono text-xs">#{idx + 1}</TableCell>
                  <TableCell className="font-semibold">{symbol}</TableCell>
                  <TableCell>
                    <Badge variant={idx < 3 ? 'default' : 'secondary'}>
                      {idx < 3 ? 'Select' : 'Hold'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not enough sample history for this lookback — try a smaller t.
        </p>
      )}
    </div>
  );
}

function generateSampleDataSymbols(): string {
  // Mirror of the executor's default universe, for the caption only.
  return 'AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, JPM';
}

// ---------------------------------------------------------------------------
// AI template cards — content from @/lib/ai/strategy-templates, run through
// the real sandboxed executor on demand.
// ---------------------------------------------------------------------------

/** Strip the markdown bold markers the template explanations use. */
function plainExplanation(md: string): string {
  return md.replace(/\*\*/g, '');
}

function TemplateCard({ templateId }: { templateId: string }) {
  const template = strategyTemplates.find((t) => t.id === templateId);
  const [result, setResult] = React.useState<string | null>(null);

  if (!template) return null;

  function runTemplate() {
    if (!template) return;
    const res = executeStrategy(template.code, generateSampleData());
    if (res.success && res.rankedSymbols) {
      const top = res.rankedSymbols.slice(0, 5);
      setResult(
        top.length > 0
          ? `Top picks: ${top.join(' › ')} (${res.rankedSymbols.length} qualified, ${res.executionTimeMs ?? 0} ms)`
          : 'Ran fine — but no symbols qualified on the sample data.',
      );
    } else {
      setResult(`Error: ${res.error ?? 'execution failed'}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <details>
          <summary className="cursor-pointer font-medium text-foreground hover:underline">
            How it works
          </summary>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">
            {plainExplanation(template.explanation)}
          </p>
        </details>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={runTemplate}>
            Run on sample data
          </Button>
          {result && (
            <p
              className={
                result.startsWith('Error')
                  ? 'text-xs font-medium text-destructive'
                  : 'text-xs text-muted-foreground'
              }
            >
              {result}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page island
// ---------------------------------------------------------------------------

function StrategyCatalogInner() {
  return (
    <div className="space-y-12">
      <section className="space-y-6" aria-labelledby="builtin-heading">
        <div>
          <h2 id="builtin-heading" className="font-display text-2xl font-semibold text-foreground">
            Built-in strategies
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The three ranking families the backtester ships with. Each demo below calls the actual
            engine function — the identical code that ranks assets inside your backtests.
          </p>
        </div>

        {BUILTIN_STRATEGIES.map((strategy) => (
          <Card key={strategy.id}>
            <CardHeader>
              <CardTitle>{strategy.title}</CardTitle>
              <CardDescription>{strategy.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Formula
                </p>
                <code className="mt-1 block overflow-x-auto whitespace-pre font-mono text-sm text-foreground">
                  {strategy.formula}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">{strategy.formulaDesc}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Parameters</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {strategy.parameters.map((p) => (
                        <li key={p.name}>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                            {p.name}: {p.type}
                          </code>{' '}
                          — {p.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">How it works</h3>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {strategy.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Pros</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {strategy.pros.map((p) => (
                          <li key={p}>✓ {p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Cons</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {strategy.cons.map((c) => (
                          <li key={c}>✗ {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">When to use: </span>
                    {strategy.useCase}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <RankingDemo strategy={strategy} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-6" aria-labelledby="templates-heading">
        <div>
          <h2 id="templates-heading" className="font-display text-2xl font-semibold text-foreground">
            AI strategy templates
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Five ready-made strategies the AI Strategy Builder can load, tweak, or use as few-shot
            seeds. Each one runs in the same sandboxed executor that vets custom code — try them on
            the sample universe right here.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {strategyTemplates.map((t) => (
            <TemplateCard key={t.id} templateId={t.id} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Want to backtest one of these, or draft your own?{' '}
          <a
            href={withBase('/app/strategies/')}
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Open the Strategy Builder →
          </a>
        </p>
      </section>
    </div>
  );
}

export default function StrategyCatalogPage() {
  return (
    <ErrorBoundary name="StrategyCatalogPage">
      <StrategyCatalogInner />
    </ErrorBoundary>
  );
}
