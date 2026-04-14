/**
 * ReturnsDistribution Component
 *
 * Displays a histogram of portfolio returns with a normal distribution overlay
 * and Value at Risk (VaR) threshold. Replicates the returns distribution
 * analysis from PMSS.py.
 *
 * Features:
 * - Histogram of daily returns binned into ~40 buckets
 * - Normal distribution PDF overlay curve
 * - VaR 5% vertical threshold line
 * - Stats panel: Mean, Std Dev, Skewness, Kurtosis, VaR (5%)
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ReturnsDistributionProps {
  returns?: number[];
  symbol?: string;
}

interface HistogramBin {
  binCenter: number;
  binLabel: string;
  frequency: number;
  normalPdf: number;
}

interface ReturnStats {
  mean: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
  var5: number;
}

function generateMockReturns(count: number): number[] {
  const mean = 0.0005;
  const std = 0.02;
  const results: number[] = [];

  for (let i = 0; i < count; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let value = mean + std * z;

    // Add fat tails: ~8% chance of an extreme event
    if (Math.random() < 0.08) {
      value *= 1.8 + Math.random() * 1.2;
    }

    // Add slight negative skew: amplify negative returns
    if (value < 0 && Math.random() < 0.3) {
      value *= 1.4;
    }

    results.push(value);
  }

  return results;
}

function computeStats(returns: number[]): ReturnStats {
  const n = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / n;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const skewness =
    stdDev > 0
      ? returns.reduce((sum, r) => sum + ((r - mean) / stdDev) ** 3, 0) / n
      : 0;

  const kurtosis =
    stdDev > 0
      ? returns.reduce((sum, r) => sum + ((r - mean) / stdDev) ** 4, 0) / n
      : 0;

  // VaR at 5th percentile
  const sorted = [...returns].sort((a, b) => a - b);
  const var5Index = Math.floor(n * 0.05);
  const var5 = sorted[var5Index];

  return { mean, stdDev, skewness, kurtosis, var5 };
}

function normalPdf(x: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  const exponent = -0.5 * ((x - mean) / stdDev) ** 2;
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

function buildHistogram(
  returns: number[],
  stats: ReturnStats,
  numBins: number
): HistogramBin[] {
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const binWidth = (max - min) / numBins;

  const bins: HistogramBin[] = [];
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;

    const frequency = returns.filter(
      (r) => r >= binStart && (i === numBins - 1 ? r <= binEnd : r < binEnd)
    ).length;

    // Scale the normal PDF to match histogram area (count * binWidth)
    const pdfValue =
      normalPdf(binCenter, stats.mean, stats.stdDev) *
      returns.length *
      binWidth;

    bins.push({
      binCenter,
      binLabel: (binCenter * 100).toFixed(2) + '%',
      frequency,
      normalPdf: pdfValue,
    });
  }

  return bins;
}

function formatPercent(value: number, decimals = 4): string {
  return (value * 100).toFixed(decimals) + '%';
}

function formatNumber(value: number, decimals = 4): string {
  return value.toFixed(decimals);
}

export function ReturnsDistribution({
  returns: returnsProp,
  symbol,
}: ReturnsDistributionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returns, setReturns] = useState<number[]>([]);

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      if (returnsProp && returnsProp.length > 0) {
        setReturns(returnsProp);
      } else {
        setReturns(generateMockReturns(500));
      }

      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process returns data'
      );
      setIsLoading(false);
    }
  }, [returnsProp]);

  const stats = useMemo(() => {
    if (returns.length === 0) return null;
    return computeStats(returns);
  }, [returns]);

  const histogramData = useMemo(() => {
    if (returns.length === 0 || !stats) return [];
    return buildHistogram(returns, stats, 40);
  }, [returns, stats]);

  if (isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="returns-distribution returns-distribution--loading">
          <div className="rd-loading-spinner" />
          <p>Analyzing returns distribution...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="returns-distribution returns-distribution--error">
          <span className="rd-error-icon">&#9888;</span>
          <p>{error}</p>
        </div>
      </>
    );
  }

  if (!stats) return null;

  const title = symbol
    ? `Returns Distribution - ${symbol}`
    : 'Returns Distribution';

  const skewnessColor =
    stats.skewness < 0
      ? 'var(--negative, #ef4444)'
      : 'var(--positive, #22c55e)';
  const kurtosisColor =
    stats.kurtosis > 3
      ? 'var(--warning, #f97316)'
      : 'var(--info, #3b82f6)';
  const kurtosisLabel = stats.kurtosis > 3 ? 'Leptokurtic' : 'Platykurtic';

  return (
    <>
      <style>{styles}</style>
      <div className="returns-distribution">
        <div className="rd-header">
          <h2>{title}</h2>
          <p className="rd-subtitle">
            Daily returns histogram with normal distribution overlay
          </p>
        </div>

        <div className="rd-chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={histogramData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <XAxis
                dataKey="binLabel"
                tick={{ fontSize: 10, fill: 'var(--text-muted, #9ca3af)' }}
                interval={Math.floor(histogramData.length / 8)}
                axisLine={{ stroke: 'var(--border, #374151)' }}
                tickLine={{ stroke: 'var(--border, #374151)' }}
              />
              <YAxis
                yAxisId="frequency"
                tick={{ fontSize: 11, fill: 'var(--text-muted, #9ca3af)' }}
                axisLine={{ stroke: 'var(--border, #374151)' }}
                tickLine={{ stroke: 'var(--border, #374151)' }}
                label={{
                  value: 'Frequency',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    fontSize: 12,
                    fill: 'var(--text-muted, #9ca3af)',
                  },
                }}
              />
              <YAxis
                yAxisId="pdf"
                orientation="right"
                tick={{ fontSize: 11, fill: 'var(--text-muted, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary, #1f2937)',
                  border: '1px solid var(--border, #374151)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #f9fafb)',
                  fontSize: 12,
                }}
                formatter={(value: unknown, name: unknown) => {
                  const numValue = Number(value);
                  if (name === 'frequency') return [numValue, 'Frequency'];
                  if (name === 'normalPdf')
                    return [numValue.toFixed(2), 'Normal PDF'];
                  return [numValue, String(name)];
                }}
                labelFormatter={(label: unknown) => `Return: ${String(label)}`}
              />
              <ReferenceLine
                yAxisId="frequency"
                x={histogramData.reduce((closest, bin) =>
                  Math.abs(bin.binCenter - stats.var5) <
                  Math.abs(closest.binCenter - stats.var5)
                    ? bin
                    : closest
                ).binLabel}
                stroke="var(--negative, #ef4444)"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{
                  value: 'VaR 5%',
                  position: 'top',
                  fill: 'var(--negative, #ef4444)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Bar
                yAxisId="frequency"
                dataKey="frequency"
                fill="var(--accent, #6366f1)"
                fillOpacity={0.7}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="frequency"
                type="monotone"
                dataKey="normalPdf"
                stroke="var(--warning, #f97316)"
                strokeWidth={2}
                dot={false}
                name="normalPdf"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rd-stats-panel">
          <div className="rd-stat-card">
            <span className="rd-stat-label">Mean</span>
            <span className="rd-stat-value">{formatPercent(stats.mean)}</span>
          </div>
          <div className="rd-stat-card">
            <span className="rd-stat-label">Std Dev</span>
            <span className="rd-stat-value">
              {formatPercent(stats.stdDev)}
            </span>
          </div>
          <div className="rd-stat-card">
            <span className="rd-stat-label">Skewness</span>
            <span className="rd-stat-value" style={{ color: skewnessColor }}>
              {formatNumber(stats.skewness)}
            </span>
          </div>
          <div className="rd-stat-card">
            <span className="rd-stat-label">
              Kurtosis{' '}
              <span className="rd-kurtosis-badge" style={{ color: kurtosisColor }}>
                ({kurtosisLabel})
              </span>
            </span>
            <span className="rd-stat-value" style={{ color: kurtosisColor }}>
              {formatNumber(stats.kurtosis)}
            </span>
          </div>
          <div className="rd-stat-card">
            <span className="rd-stat-label">VaR (5%)</span>
            <span
              className="rd-stat-value"
              style={{ color: 'var(--negative, #ef4444)' }}
            >
              {formatPercent(stats.var5)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .returns-distribution {
    background: var(--glass-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
    border-radius: var(--radius-xl, 1rem);
    padding: var(--space-6, 1.5rem);
  }

  .returns-distribution--loading,
  .returns-distribution--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: var(--text-muted, #9ca3af);
    gap: var(--space-4, 1rem);
  }

  .rd-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border, #374151);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: rd-spin 1s linear infinite;
  }

  @keyframes rd-spin {
    to { transform: rotate(360deg); }
  }

  .rd-error-icon {
    font-size: 2rem;
    color: var(--negative, #ef4444);
  }

  .rd-header {
    margin-bottom: var(--space-6, 1.5rem);
  }

  .rd-header h2 {
    font-size: var(--text-xl, 1.25rem);
    font-weight: 700;
    color: var(--text-primary, #f9fafb);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .rd-subtitle {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted, #9ca3af);
    margin: 0;
  }

  .rd-chart-container {
    background: var(--bg-secondary, #1f2937);
    border: 1px solid var(--border, #374151);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--space-4, 1rem);
    margin-bottom: var(--space-6, 1.5rem);
  }

  .rd-stats-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-4, 1rem);
  }

  .rd-stat-card {
    background: var(--bg-tertiary, #111827);
    border: 1px solid var(--border, #374151);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--space-4, 1rem);
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
  }

  .rd-stat-label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted, #9ca3af);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .rd-stat-value {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 700;
    color: var(--text-primary, #f9fafb);
    font-variant-numeric: tabular-nums;
  }

  .rd-kurtosis-badge {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
  }
`;

export default ReturnsDistribution;
