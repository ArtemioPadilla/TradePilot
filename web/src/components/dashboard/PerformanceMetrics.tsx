import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { getPortfolioData } from '../../lib/services/portfolio';
import {
  getNetWorthByRange,
  convertToDataPoints,
  type NetWorthDataPoint,
} from '../../lib/services/networth';
import type { PortfolioSummary } from '../../types/portfolio';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Performance metric with calculation and explanation
 */
interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  tooltip: string;
  isGood?: boolean | null;
}

/**
 * Format percentage
 */
function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate annualized return from total return and time period
 */
function calculateAnnualizedReturn(totalReturn: number, days: number): number {
  if (days <= 0 || totalReturn <= -100) return 0;
  const years = days / 365;
  return (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(dataPoints: NetWorthDataPoint[]): number {
  if (dataPoints.length < 2) return 0;

  const returns = dataPoints.slice(1).map((point) => point.changePercent);
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;

  // Annualize volatility (assuming daily data)
  return Math.sqrt(variance * 252);
}

/**
 * Calculate Sharpe ratio
 */
function calculateSharpeRatio(
  annualizedReturn: number,
  volatility: number,
  riskFreeRate: number = 4.5 // Current approximate T-bill rate
): number {
  if (volatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(dataPoints: NetWorthDataPoint[]): {
  maxDrawdown: number;
  peakDate: Date | null;
  troughDate: Date | null;
} {
  if (dataPoints.length < 2) {
    return { maxDrawdown: 0, peakDate: null, troughDate: null };
  }

  let maxDrawdown = 0;
  let peak = dataPoints[0].totalValue;
  let peakDate = dataPoints[0].date;
  let resultPeakDate: Date | null = null;
  let troughDate: Date | null = null;

  for (const point of dataPoints) {
    if (point.totalValue > peak) {
      peak = point.totalValue;
      peakDate = point.date;
    }

    const drawdown = ((peak - point.totalValue) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      resultPeakDate = peakDate;
      troughDate = point.date;
    }
  }

  return { maxDrawdown, peakDate: resultPeakDate, troughDate };
}

/**
 * Calculate Sortino ratio (downside deviation)
 */
function calculateSortinoRatio(
  annualizedReturn: number,
  dataPoints: NetWorthDataPoint[],
  riskFreeRate: number = 4.5
): number {
  if (dataPoints.length < 2) return 0;

  const negativeReturns = dataPoints
    .slice(1)
    .map((point) => point.changePercent)
    .filter((r) => r < 0);

  if (negativeReturns.length === 0) return annualizedReturn > riskFreeRate ? 999 : 0;

  const meanNegative = negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length;
  const squaredDiffs = negativeReturns.map((r) => Math.pow(r - meanNegative, 2));
  const downsideVariance = squaredDiffs.reduce((sum, d) => sum + d, 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance * 252);

  if (downsideDeviation === 0) return annualizedReturn > riskFreeRate ? 999 : 0;
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

interface PerformanceMetricsProps {
  /** Use mock data for demo */
  useMockData?: boolean;
  /** Time period for calculations (days) */
  periodDays?: number;
}

export function PerformanceMetrics({
  useMockData = true,
  periodDays = 365,
}: PerformanceMetricsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [dataPoints, setDataPoints] = useState<NetWorthDataPoint[]>([]);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadData();
  }, [userId, useMockData, periodDays]);

  async function loadData() {
    setLoading(true);
    try {
      if (useMockData) {
        // Generate mock data
        const mockSummary: PortfolioSummary = {
          totalValue: 125000,
          totalCash: 15000,
          totalCostBasis: 95000,
          totalUnrealizedPL: 15000,
          totalUnrealizedPLPercent: 15.79,
          dailyChange: 1250,
          dailyChangePercent: 1.01,
          accountCount: 2,
          holdingCount: 12,
          calculatedAt: new Date(),
        };
        setSummary(mockSummary);

        // Generate mock historical data
        const mockDataPoints: NetWorthDataPoint[] = [];
        let value = 95000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        for (let i = 0; i <= periodDays; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const change = value * (Math.random() * 0.04 - 0.018);
          const prevValue = value;
          value = Math.max(50000, value + change);

          mockDataPoints.push({
            date,
            totalValue: value,
            change: value - prevValue,
            changePercent: prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0,
          });
        }
        setDataPoints(mockDataPoints);
      } else if (userId) {
        const [portfolioData, snapshots] = await Promise.all([
          getPortfolioData(userId),
          getNetWorthByRange(userId, '1Y'),
        ]);
        setSummary(portfolioData.summary);
        setDataPoints(convertToDataPoints(snapshots));
      }
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate all metrics
  const metrics = useMemo((): PerformanceMetric[] => {
    if (!summary || dataPoints.length < 2) return [];

    const startValue = dataPoints[0].totalValue;
    const endValue = dataPoints[dataPoints.length - 1].totalValue;
    const totalReturn = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
    const days = dataPoints.length;
    const annualizedReturn = calculateAnnualizedReturn(totalReturn, days);
    const volatility = calculateVolatility(dataPoints);
    const sharpeRatio = calculateSharpeRatio(annualizedReturn, volatility);
    const sortinoRatio = calculateSortinoRatio(annualizedReturn, dataPoints);
    const { maxDrawdown, peakDate, troughDate } = calculateMaxDrawdown(dataPoints);

    return [
      {
        id: 'total_return',
        label: 'Total Return',
        value: formatPercent(totalReturn),
        subValue: formatCurrency(endValue - startValue),
        tooltip: 'The total percentage gain or loss over the selected period.',
        isGood: totalReturn > 0,
      },
      {
        id: 'annualized_return',
        label: 'Annualized Return',
        value: formatPercent(annualizedReturn),
        tooltip: 'The compounded annual growth rate (CAGR). What your return would be if annualized over a full year.',
        isGood: annualizedReturn > 0,
      },
      {
        id: 'volatility',
        label: 'Volatility',
        value: formatPercent(volatility),
        tooltip: 'Annualized standard deviation of daily returns. Higher values indicate more price fluctuation.',
        isGood: volatility < 20 ? true : volatility > 40 ? false : null,
      },
      {
        id: 'sharpe_ratio',
        label: 'Sharpe Ratio',
        value: sharpeRatio.toFixed(2),
        subValue: 'Risk-adjusted return',
        tooltip: 'Excess return per unit of risk. Higher is better. Above 1.0 is good, above 2.0 is excellent.',
        isGood: sharpeRatio > 1 ? true : sharpeRatio < 0 ? false : null,
      },
      {
        id: 'sortino_ratio',
        label: 'Sortino Ratio',
        value: sortinoRatio > 99 ? '>99' : sortinoRatio.toFixed(2),
        subValue: 'Downside risk-adjusted',
        tooltip: 'Like Sharpe ratio but only considers downside volatility. Better for asymmetric returns.',
        isGood: sortinoRatio > 1 ? true : sortinoRatio < 0 ? false : null,
      },
      {
        id: 'max_drawdown',
        label: 'Max Drawdown',
        value: formatPercent(-maxDrawdown),
        subValue: peakDate && troughDate
          ? `${peakDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${troughDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : undefined,
        tooltip: 'The largest peak-to-trough decline. Measures worst-case loss from a peak.',
        isGood: maxDrawdown < 10 ? true : maxDrawdown > 30 ? false : null,
      },
    ];
  }, [summary, dataPoints]);

  return (
    <div className="performance-metrics" data-testid="performance-metrics">
      <div className="metrics-header">
        <h3>Performance Metrics</h3>
        <span className="period-label">
          {periodDays === 365 ? '1 Year' : `${periodDays} Days`}
        </span>
      </div>

      {loading ? (
        <div className="metrics-loading">
          <div className="loading-spinner"></div>
        </div>
      ) : metrics.length === 0 ? (
        <div className="metrics-empty">
          <p>Not enough data to calculate metrics</p>
        </div>
      ) : (
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className={`metric-card ${expandedMetric === metric.id ? 'expanded' : ''}`}
              onClick={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
              data-testid={`metric-${metric.id}`}
            >
              <div className="metric-header">
                <span className="metric-label">{metric.label}</span>
                <button
                  className="metric-info"
                  title={metric.tooltip}
                  aria-label={`Info about ${metric.label}`}
                >
                  <Info size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div className="metric-content">
                <span
                  className={`metric-value ${
                    metric.isGood === true
                      ? 'positive'
                      : metric.isGood === false
                      ? 'negative'
                      : ''
                  }`}
                >
                  {metric.value}
                </span>
                {metric.subValue && (
                  <span className="metric-subvalue">{metric.subValue}</span>
                )}
              </div>
              <div className="metric-indicator">
                {metric.isGood === true && <TrendingUp size={16} strokeWidth={2} />}
                {metric.isGood === false && <TrendingDown size={16} strokeWidth={2} />}
                {metric.isGood === null && <Minus size={16} strokeWidth={2} />}
              </div>
              {expandedMetric === metric.id && (
                <div className="metric-tooltip">
                  {metric.tooltip}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .performance-metrics {
          background: var(--glass-bg, var(--bg-secondary));
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border, var(--border));
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-6, 1.5rem);
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5, 1.25rem);
        }

        .metrics-header h3 {
          font-size: var(--text-base, 1rem);
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .period-label {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 500;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
          border-radius: var(--radius-full, 9999px);
        }

        .metrics-loading,
        .metrics-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 180px;
          color: var(--text-muted);
          gap: var(--space-3, 0.75rem);
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-4, 1rem);
        }

        .metric-card {
          position: relative;
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-4, 1rem);
          cursor: pointer;
          transition: var(--transition-base);
          overflow: hidden;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          transition: var(--transition-fast);
        }

        .metric-card:hover {
          background: var(--bg-hover);
          border-color: var(--border);
          transform: translateY(-2px);
        }

        .metric-card:hover::before {
          background: var(--accent);
        }

        .metric-card.expanded {
          background: var(--bg-hover);
          border-color: var(--accent);
        }

        .metric-card.expanded::before {
          background: var(--accent);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-2, 0.5rem);
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 0.25rem);
        }

        .metric-label {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .metric-value {
          font-size: var(--text-2xl, 1.5rem);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .metric-value.positive {
          color: var(--positive);
        }

        .metric-value.negative {
          color: var(--negative);
        }

        .metric-subvalue {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
        }

        .metric-info {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: help;
          border-radius: var(--radius-full, 9999px);
          transition: var(--transition-fast);
          flex-shrink: 0;
        }

        .metric-info:hover {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }

        .metric-indicator {
          position: absolute;
          bottom: var(--space-3, 0.75rem);
          right: var(--space-3, 0.75rem);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full, 9999px);
          background: var(--bg-secondary);
          color: var(--text-muted);
          opacity: 0.6;
          transition: var(--transition-fast);
        }

        .metric-card:hover .metric-indicator {
          opacity: 1;
        }

        .metric-value.positive ~ .metric-indicator,
        .metric-card:has(.metric-value.positive) .metric-indicator {
          color: var(--positive);
          background: var(--positive-bg);
        }

        .metric-value.negative ~ .metric-indicator,
        .metric-card:has(.metric-value.negative) .metric-indicator {
          color: var(--negative);
          background: var(--negative-bg);
        }

        .metric-tooltip {
          position: absolute;
          top: calc(100% + var(--space-2, 0.5rem));
          left: 0;
          right: 0;
          padding: var(--space-4, 1rem);
          background: var(--glass-bg, var(--bg-primary));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border, var(--border));
          border-radius: var(--radius-lg, 12px);
          font-size: var(--text-sm, 0.875rem);
          color: var(--text-secondary);
          line-height: 1.6;
          z-index: 10;
          box-shadow: var(--shadow-xl);
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .metric-value {
            font-size: var(--text-xl, 1.25rem);
          }
        }
      `}</style>
    </div>
  );
}

export default PerformanceMetrics;
