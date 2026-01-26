import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import {
  getNetWorthByRange,
  convertToDataPoints,
  calculatePeriodStats,
  generateMockData,
  type DateRange,
  type NetWorthDataPoint,
  type PeriodStats,
} from '../../lib/services/networth';

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency with decimals
 */
function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with year
 */
function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface NetWorthChartProps {
  /** Use mock data for demo */
  useMockData?: boolean;
  /** Starting value for mock data */
  mockStartValue?: number;
}

export function NetWorthChart({
  useMockData = true,
  mockStartValue = 100000,
}: NetWorthChartProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('1M');
  const [dataPoints, setDataPoints] = useState<NetWorthDataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<NetWorthDataPoint | null>(null);

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
  }, [userId, dateRange, useMockData]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Generate mock data based on date range
        const daysMap: Record<DateRange, number> = {
          '1W': 7,
          '1M': 30,
          '3M': 90,
          '6M': 180,
          '1Y': 365,
          'YTD': Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
          'ALL': 730,
        };
        const days = daysMap[dateRange];
        const mockData = generateMockData(mockStartValue, days, 0.015);
        setDataPoints(mockData);
      } else if (userId) {
        const snapshots = await getNetWorthByRange(userId, dateRange);
        const points = convertToDataPoints(snapshots);
        setDataPoints(points);
      }
    } catch (err) {
      console.error('Failed to load net worth data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate period stats
  const stats = useMemo(() => calculatePeriodStats(dataPoints), [dataPoints]);

  // Calculate chart dimensions
  const chartHeight = 200;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 60 };

  // Calculate min/max for scaling
  const { minValue, maxValue, points } = useMemo(() => {
    if (dataPoints.length === 0) {
      return { minValue: 0, maxValue: 100, points: [] };
    }

    const values = dataPoints.map((d) => d.totalValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || max * 0.1;

    const chartWidth = 100; // Percentage-based
    const xScale = (i: number) => (i / (dataPoints.length - 1)) * chartWidth;
    const yScale = (v: number) =>
      chartHeight - chartPadding.bottom - ((v - (min - padding)) / (max - min + padding * 2)) * (chartHeight - chartPadding.top - chartPadding.bottom);

    const pts = dataPoints.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.totalValue),
      data: d,
    }));

    return { minValue: min - padding, maxValue: max + padding, points: pts };
  }, [dataPoints, chartHeight]);

  // Generate SVG path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`)
      .join(' ');
  }, [points]);

  // Generate area path (for gradient fill)
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`).join(' ');
    return `${line} L ${points[points.length - 1].x}% ${chartHeight - chartPadding.bottom} L ${points[0].x}% ${chartHeight - chartPadding.bottom} Z`;
  }, [points, chartHeight]);

  const isPositive = stats ? stats.change >= 0 : true;

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: 'YTD', label: 'YTD' },
    { value: 'ALL', label: 'All' },
  ];

  return (
    <div className="net-worth-chart" data-testid="net-worth-chart">
      {/* Header */}
      <div className="chart-header">
        <div className="header-left">
          <h3>Net Worth</h3>
          {stats && (
            <div className="current-value">
              <span className="value">{formatCurrency(stats.endValue)}</span>
              <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
                {formatCurrencyPrecise(stats.change)} ({formatPercent(stats.changePercent)})
              </span>
            </div>
          )}
        </div>
        <div className="date-range-selector" data-testid="date-range-selector">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              className={`range-btn ${dateRange === option.value ? 'active' : ''}`}
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="chart-error">
            <p>{error}</p>
            <button onClick={loadData}>Retry</button>
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="chart-empty">
            <p>No data available for this period</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 100 ${chartHeight}`}
            preserveAspectRatio="none"
            className="chart-svg"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? 'var(--positive, #10b981)' : 'var(--negative, #ef4444)'}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? 'var(--positive, #10b981)' : 'var(--negative, #ef4444)'}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={isPositive ? 'var(--positive, #10b981)' : 'var(--negative, #ef4444)'}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Hover points */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={`${point.x}%`}
                cy={point.y}
                r="1"
                fill="transparent"
                className="hover-point"
                onMouseEnter={() => setHoveredPoint(point.data)}
              />
            ))}
          </svg>
        )}

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="chart-tooltip" data-testid="chart-tooltip">
            <div className="tooltip-date">{formatDateFull(hoveredPoint.date)}</div>
            <div className="tooltip-value">{formatCurrency(hoveredPoint.totalValue)}</div>
            <div className={`tooltip-change ${hoveredPoint.change >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrencyPrecise(hoveredPoint.change)} ({formatPercent(hoveredPoint.changePercent)})
            </div>
          </div>
        )}
      </div>

      {/* Period Stats */}
      {stats && (
        <div className="period-stats" data-testid="period-stats">
          <div className="stat">
            <span className="stat-label">Period High</span>
            <span className="stat-value">{formatCurrency(stats.high)}</span>
            <span className="stat-date">{formatDate(stats.highDate)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Period Low</span>
            <span className="stat-value">{formatCurrency(stats.low)}</span>
            <span className="stat-date">{formatDate(stats.lowDate)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Average</span>
            <span className="stat-value">{formatCurrency(stats.averageValue)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Start</span>
            <span className="stat-value">{formatCurrency(stats.startValue)}</span>
          </div>
        </div>
      )}

      <style>{`
        .net-worth-chart {
          background: var(--glass-bg, var(--bg-secondary));
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border, var(--border));
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-6, 1.5rem);
          position: relative;
          overflow: hidden;
        }

        .net-worth-chart::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-5, 1.25rem);
          flex-wrap: wrap;
          gap: var(--space-4, 1rem);
        }

        .header-left h3 {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 500;
          color: var(--text-muted);
          margin: 0 0 var(--space-2, 0.5rem) 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .current-value {
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 0.25rem);
        }

        .current-value .value {
          font-size: var(--text-4xl, 2.25rem);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .current-value .change {
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
        }

        .change.positive {
          color: var(--positive);
        }

        .change.negative {
          color: var(--negative);
        }

        .date-range-selector {
          display: flex;
          gap: var(--space-1, 0.25rem);
          background: var(--bg-tertiary);
          padding: var(--space-1, 0.25rem);
          border-radius: var(--radius-lg, 12px);
        }

        .range-btn {
          padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
          background: transparent;
          border: none;
          color: var(--text-muted);
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .range-btn:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .range-btn:active {
          transform: scale(0.95);
        }

        .range-btn.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .chart-container {
          position: relative;
          height: 220px;
          margin-bottom: var(--space-5, 1.25rem);
        }

        .chart-loading,
        .chart-error,
        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
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

        .chart-svg {
          width: 100%;
          height: 100%;
        }

        .hover-point {
          cursor: crosshair;
          transition: var(--transition-fast);
        }

        .hover-point:hover {
          fill: var(--accent);
          r: 4;
        }

        .chart-tooltip {
          position: absolute;
          top: var(--space-3, 0.75rem);
          right: var(--space-3, 0.75rem);
          background: var(--glass-bg, var(--bg-primary));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border, var(--border));
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-4, 1rem);
          box-shadow: var(--shadow-xl);
          pointer-events: none;
          z-index: 10;
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

        .tooltip-date {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          margin-bottom: var(--space-1, 0.25rem);
        }

        .tooltip-value {
          font-size: var(--text-lg, 1.125rem);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .tooltip-change {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
          margin-top: var(--space-1, 0.25rem);
        }

        .tooltip-change.positive {
          color: var(--positive);
        }

        .tooltip-change.negative {
          color: var(--negative);
        }

        .period-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4, 1rem);
          padding-top: var(--space-5, 1.25rem);
          border-top: 1px solid var(--border);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 0.25rem);
          padding: var(--space-3, 0.75rem);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg, 12px);
          transition: var(--transition-fast);
        }

        .stat:hover {
          background: var(--bg-hover);
        }

        .stat-label {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: var(--text-base, 1rem);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .stat-date {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
          }

          .date-range-selector {
            width: 100%;
            justify-content: space-between;
          }

          .period-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .current-value .value {
            font-size: var(--text-2xl, 1.5rem);
          }

          .range-btn {
            padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
            font-size: 0.6875rem;
          }

          .stat {
            padding: var(--space-2, 0.5rem);
          }

          .stat-value {
            font-size: var(--text-sm, 0.875rem);
          }
        }
      `}</style>
    </div>
  );
}

export default NetWorthChart;
