/**
 * PortfolioValuation Component
 *
 * Displays a portfolio valuation line chart over time with S&P 500 benchmark overlay.
 * Replicates the plot_pretty_portfolio_vals visualization from PMSS.py.
 *
 * Features:
 * - Portfolio value line (accent color, thicker stroke)
 * - S&P 500 benchmark line (gray, dashed)
 * - Optional annotation dots for rebalancing events and max drawdown
 * - Toggle to show/hide benchmark
 * - Summary stats: Final Value, Total Return, vs Benchmark
 */

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface Annotation {
  date: string;
  label: string;
  type: 'rebalance' | 'drawdown';
}

interface PortfolioValuationProps {
  portfolioValues?: DataPoint[];
  benchmarkValues?: DataPoint[];
  annotations?: Annotation[];
}

interface MergedDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

function generateMockData(): {
  portfolio: DataPoint[];
  benchmark: DataPoint[];
  annotations: Annotation[];
} {
  const startDate = new Date('2020-01-06');
  const startValue = 10_000_000;
  const weeklyPortfolioGrowth = Math.pow(1.15, 1 / 52);
  const weeklyBenchmarkGrowth = Math.pow(1.10, 1 / 52);
  const volatility = 0.02;

  const portfolio: DataPoint[] = [];
  const benchmark: DataPoint[] = [];

  let portfolioValue = startValue;
  let benchmarkValue = startValue;
  let maxDrawdownDate = '';
  let maxDrawdownRatio = 0;
  let peakPortfolioValue = startValue;

  for (let i = 0; i < 200; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);
    const dateStr = date.toISOString().split('T')[0];

    const portfolioNoise = 1 + (Math.random() - 0.5) * volatility * 2;
    const benchmarkNoise = 1 + (Math.random() - 0.5) * volatility * 1.5;

    portfolioValue *= weeklyPortfolioGrowth * portfolioNoise;
    benchmarkValue *= weeklyBenchmarkGrowth * benchmarkNoise;

    portfolio.push({ date: dateStr, value: Math.round(portfolioValue) });
    benchmark.push({ date: dateStr, value: Math.round(benchmarkValue) });

    if (portfolioValue > peakPortfolioValue) {
      peakPortfolioValue = portfolioValue;
    }
    const drawdownRatio = (peakPortfolioValue - portfolioValue) / peakPortfolioValue;
    if (drawdownRatio > maxDrawdownRatio) {
      maxDrawdownRatio = drawdownRatio;
      maxDrawdownDate = dateStr;
    }
  }

  const rebalanceDates = portfolio
    .filter((_, i) => i > 0 && i % 26 === 0)
    .map((p) => p.date);

  const annotations: Annotation[] = rebalanceDates.map((date) => ({
    date,
    label: 'Rebalance',
    type: 'rebalance' as const,
  }));

  if (maxDrawdownDate) {
    annotations.push({
      date: maxDrawdownDate,
      label: `Max Drawdown (${(maxDrawdownRatio * 100).toFixed(1)}%)`,
      type: 'drawdown',
    });
  }

  return { portfolio, benchmark, annotations };
}

function formatDollar(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatFullDollar(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="valuation-tooltip">
      <p className="tooltip-date">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="tooltip-line" style={{ color: entry.color }}>
          <span className="tooltip-label">{entry.name}:</span>{' '}
          <span className="tooltip-value">{formatFullDollar(entry.value)}</span>
        </p>
      ))}
      <style>{tooltipStyles}</style>
    </div>
  );
}

export function PortfolioValuation({
  portfolioValues,
  benchmarkValues,
  annotations,
}: PortfolioValuationProps) {
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const mockData = useMemo(() => {
    if (!portfolioValues || !benchmarkValues) {
      return generateMockData();
    }
    return null;
  }, [portfolioValues, benchmarkValues]);

  const portfolio = portfolioValues ?? mockData?.portfolio ?? [];
  const benchmark = benchmarkValues ?? mockData?.benchmark ?? [];
  const annotationData = annotations ?? mockData?.annotations ?? [];

  const mergedData: MergedDataPoint[] = useMemo(() => {
    const benchmarkMap = new Map(benchmark.map((b) => [b.date, b.value]));
    return portfolio.map((p) => ({
      date: p.date,
      portfolio: p.value,
      benchmark: benchmarkMap.get(p.date) ?? 0,
    }));
  }, [portfolio, benchmark]);

  const summaryStats = useMemo(() => {
    if (portfolio.length === 0) return null;

    const initialValue = portfolio[0].value;
    const finalValue = portfolio[portfolio.length - 1].value;
    const totalReturn = ((finalValue - initialValue) / initialValue) * 100;

    const benchmarkInitial = benchmark.length > 0 ? benchmark[0].value : 0;
    const benchmarkFinal = benchmark.length > 0 ? benchmark[benchmark.length - 1].value : 0;
    const benchmarkReturn =
      benchmarkInitial > 0 ? ((benchmarkFinal - benchmarkInitial) / benchmarkInitial) * 100 : 0;

    const vsBenchmark = totalReturn - benchmarkReturn;

    return { finalValue, totalReturn, vsBenchmark };
  }, [portfolio, benchmark]);

  const rebalanceAnnotations = useMemo(
    () => annotationData.filter((a) => a.type === 'rebalance'),
    [annotationData],
  );

  const drawdownAnnotations = useMemo(
    () => annotationData.filter((a) => a.type === 'drawdown'),
    [annotationData],
  );

  if (loading) {
    return (
      <div className="portfolio-valuation portfolio-valuation--loading" data-testid="portfolio-valuation-loading">
        <div className="pv-loading-spinner" />
        <p>Loading portfolio valuation...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-valuation portfolio-valuation--error" data-testid="portfolio-valuation-error">
        <div className="pv-error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Error Loading Chart</h2>
        <p>{error}</p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="portfolio-valuation" data-testid="portfolio-valuation">
      {summaryStats && (
        <div className="pv-summary">
          <div className="pv-stat">
            <span className="pv-stat-label">Final Value</span>
            <span className="pv-stat-value">{formatFullDollar(summaryStats.finalValue)}</span>
          </div>
          <div className="pv-stat">
            <span className="pv-stat-label">Total Return</span>
            <span
              className={`pv-stat-value ${summaryStats.totalReturn >= 0 ? 'positive' : 'negative'}`}
            >
              {summaryStats.totalReturn >= 0 ? '+' : ''}
              {summaryStats.totalReturn.toFixed(2)}%
            </span>
          </div>
          <div className="pv-stat">
            <span className="pv-stat-label">vs Benchmark</span>
            <span
              className={`pv-stat-value ${summaryStats.vsBenchmark >= 0 ? 'positive' : 'negative'}`}
            >
              {summaryStats.vsBenchmark >= 0 ? '+' : ''}
              {summaryStats.vsBenchmark.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="pv-controls">
        <label className="pv-toggle">
          <input
            type="checkbox"
            checked={showBenchmark}
            onChange={(e) => setShowBenchmark(e.target.checked)}
          />
          <span className="pv-toggle-slider" />
          <span className="pv-toggle-label">S&P 500 Benchmark</span>
        </label>
      </div>

      <div className="pv-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mergedData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={(value: string) => {
                const d = new Date(value);
                return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
              }}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={(value: number) => formatDollar(value)}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value: string) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {value}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="Portfolio"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: 'var(--accent)' }}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                name="S&P 500"
                stroke="var(--text-muted)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--text-muted)' }}
              />
            )}
            {rebalanceAnnotations.map((annotation) => {
              const point = mergedData.find((d) => d.date === annotation.date);
              if (!point) return null;
              return (
                <ReferenceDot
                  key={`rebalance-${annotation.date}`}
                  x={annotation.date}
                  y={point.portfolio}
                  r={5}
                  fill="var(--accent)"
                  stroke="var(--bg-secondary)"
                  strokeWidth={2}
                  label={{
                    value: 'R',
                    fontSize: 10,
                    fill: 'var(--text-muted)',
                    position: 'top',
                  }}
                />
              );
            })}
            {drawdownAnnotations.map((annotation) => {
              const point = mergedData.find((d) => d.date === annotation.date);
              if (!point) return null;
              return (
                <ReferenceDot
                  key={`drawdown-${annotation.date}`}
                  x={annotation.date}
                  y={point.portfolio}
                  r={6}
                  fill="var(--negative, #ef4444)"
                  stroke="var(--bg-secondary)"
                  strokeWidth={2}
                  label={{
                    value: annotation.label,
                    fontSize: 10,
                    fill: 'var(--negative, #ef4444)',
                    position: 'bottom',
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const tooltipStyles = `
  .valuation-tooltip {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .tooltip-date {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
    margin: 0 0 var(--space-2, 0.5rem) 0;
    font-weight: 600;
  }

  .tooltip-line {
    margin: 0;
    font-size: var(--text-sm, 0.875rem);
    display: flex;
    justify-content: space-between;
    gap: var(--space-4, 1rem);
  }

  .tooltip-label {
    font-weight: 500;
  }

  .tooltip-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const styles = `
  .portfolio-valuation {
    max-width: 1400px;
    margin: 0 auto;
  }

  .portfolio-valuation--loading,
  .portfolio-valuation--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .pv-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: pv-spin 1s linear infinite;
  }

  @keyframes pv-spin {
    to { transform: rotate(360deg); }
  }

  .pv-error-icon {
    color: var(--negative, #ef4444);
  }

  .portfolio-valuation--error h2 {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .portfolio-valuation--error p {
    color: var(--text-muted);
    margin: 0;
  }

  /* Summary Stats */
  .pv-summary {
    display: flex;
    gap: var(--space-6, 1.5rem);
    margin-bottom: var(--space-4, 1rem);
    flex-wrap: wrap;
  }

  .pv-stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 0.25rem);
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
    min-width: 160px;
  }

  .pv-stat-label {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pv-stat-value {
    font-size: var(--text-xl, 1.25rem);
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .pv-stat-value.positive {
    color: var(--positive, #22c55e);
  }

  .pv-stat-value.negative {
    color: var(--negative, #ef4444);
  }

  /* Controls */
  .pv-controls {
    display: flex;
    align-items: center;
    gap: var(--space-4, 1rem);
    margin-bottom: var(--space-4, 1rem);
  }

  .pv-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
    cursor: pointer;
    user-select: none;
  }

  .pv-toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .pv-toggle-slider {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 10px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .pv-toggle-slider::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--text-muted);
    border-radius: 50%;
    transition: all 0.2s;
  }

  .pv-toggle input:checked + .pv-toggle-slider {
    background: var(--accent);
    border-color: var(--accent);
  }

  .pv-toggle input:checked + .pv-toggle-slider::after {
    transform: translateX(16px);
    background: white;
  }

  .pv-toggle-label {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Chart Container */
  .pv-chart-container {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-4, 1rem);
    width: 100%;
  }

  /* Recharts overrides */
  .pv-chart-container .recharts-cartesian-grid-horizontal line,
  .pv-chart-container .recharts-cartesian-grid-vertical line {
    stroke: var(--border);
  }

  .pv-chart-container .recharts-legend-item-text {
    color: var(--text-secondary) !important;
  }

  @media (max-width: 768px) {
    .pv-summary {
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .pv-stat {
      min-width: unset;
    }

    .pv-chart-container {
      padding: var(--space-2, 0.5rem);
    }
  }
`;

export default PortfolioValuation;
