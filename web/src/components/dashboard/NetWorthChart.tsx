import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
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
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h3 {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .current-value {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .current-value .value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .current-value .change {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .change.positive {
          color: var(--positive, #10b981);
        }

        .change.negative {
          color: var(--negative, #ef4444);
        }

        .date-range-selector {
          display: flex;
          gap: 0.25rem;
          background: var(--bg-tertiary);
          padding: 0.25rem;
          border-radius: var(--radius-md, 8px);
        }

        .range-btn {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: transparent;
          border: none;
          color: var(--text-muted);
          border-radius: var(--radius-sm, 4px);
          cursor: pointer;
          transition: all 0.15s;
        }

        .range-btn:hover {
          color: var(--text-primary);
        }

        .range-btn.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .chart-container {
          position: relative;
          height: 200px;
          margin-bottom: 1rem;
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
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
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
        }

        .hover-point:hover {
          fill: var(--accent);
          r: 3;
        }

        .chart-tooltip {
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md, 8px);
          padding: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          z-index: 10;
        }

        .tooltip-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .tooltip-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .tooltip-change {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tooltip-change.positive {
          color: var(--positive, #10b981);
        }

        .tooltip-change.negative {
          color: var(--negative, #ef4444);
        }

        .period-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-date {
          font-size: 0.75rem;
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
            font-size: 1.5rem;
          }

          .range-btn {
            padding: 0.25rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default NetWorthChart;
