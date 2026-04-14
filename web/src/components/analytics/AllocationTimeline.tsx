/**
 * AllocationTimeline Component
 *
 * Stacked bar chart showing portfolio composition over time,
 * replicating the allocation visualization from PMSS.py (plot_allocations).
 * Supports toggling between absolute dollar values and normalized percentages.
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface AllocationData {
  date: string;
  allocations: { symbol: string; value: number }[];
}

interface AllocationTimelineProps {
  allocations?: AllocationData[];
}

type ViewMode = 'absolute' | 'normalized';

const STOCK_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#a855f7',
  '#e11d48',
  '#84cc16',
  '#0ea5e9',
  '#d946ef',
  '#facc15',
];

function generateMockData(): AllocationData[] {
  const symbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN', 'META', 'AMD'];
  const baseValues: Record<string, number> = {
    AAPL: 15000,
    MSFT: 12000,
    NVDA: 10000,
    GOOGL: 8000,
    TSLA: 6000,
    AMZN: 9000,
    META: 7000,
    AMD: 5000,
  };

  const dates = [
    '2024-01-02', '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01',
    '2024-06-03', '2024-07-01', '2024-08-01', '2024-09-03', '2024-10-01',
  ];

  return dates.map((date, dateIndex) => {
    const activeCount = 5 + Math.floor(Math.random() * (symbols.length - 5 + 1));
    const activeSymbols = [...symbols]
      .sort(() => Math.random() - 0.5)
      .slice(0, activeCount);

    const allocations = activeSymbols.map((symbol) => {
      const base = baseValues[symbol];
      const drift = 1 + (dateIndex * 0.03) + (Math.random() - 0.4) * 0.15;
      return { symbol, value: Math.round(base * drift) };
    });

    return { date, allocations };
  });
}

function formatDollar(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function AllocationTimeline({ allocations }: AllocationTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const data = allocations ?? generateMockData();

  const allSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    for (const entry of data) {
      for (const alloc of entry.allocations) {
        symbolSet.add(alloc.symbol);
      }
    }
    return Array.from(symbolSet).sort();
  }, [data]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allSymbols.forEach((symbol, index) => {
      map[symbol] = STOCK_COLORS[index % STOCK_COLORS.length];
    });
    return map;
  }, [allSymbols]);

  const chartData = useMemo(() => {
    return data.map((entry) => {
      const row: Record<string, string | number> = { date: entry.date };

      if (viewMode === 'absolute') {
        for (const symbol of allSymbols) {
          const match = entry.allocations.find((a) => a.symbol === symbol);
          row[symbol] = match ? match.value : 0;
        }
      } else {
        const total = entry.allocations.reduce((sum, a) => sum + a.value, 0);
        for (const symbol of allSymbols) {
          const match = entry.allocations.find((a) => a.symbol === symbol);
          row[symbol] = total > 0 && match ? (match.value / total) * 100 : 0;
        }
      }

      return row;
    });
  }, [data, allSymbols, viewMode]);

  if (loading) {
    return (
      <div className="allocation-timeline allocation-timeline--loading" data-testid="allocation-timeline-loading">
        <div className="at-loading-spinner" />
        <p>Loading allocation data...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allocation-timeline allocation-timeline--error" data-testid="allocation-timeline-error">
        <div className="at-error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="allocation-timeline" data-testid="allocation-timeline">
      <div className="at-header">
        <div>
          <h2>Portfolio Allocation Over Time</h2>
          <p>Composition at each rebalancing date</p>
        </div>
        <div className="at-toggle">
          <button
            className={`at-toggle-btn ${viewMode === 'absolute' ? 'active' : ''}`}
            onClick={() => setViewMode('absolute')}
          >
            Value ($)
          </button>
          <button
            className={`at-toggle-btn ${viewMode === 'normalized' ? 'active' : ''}`}
            onClick={() => setViewMode('normalized')}
          >
            Weight (%)
          </button>
        </div>
      </div>

      <div className="at-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tickFormatter={viewMode === 'absolute' ? formatDollar : (v) => `${v.toFixed(0)}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              domain={viewMode === 'normalized' ? [0, 100] : undefined}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const total = payload.reduce(
                  (sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0),
                  0,
                );
                return (
                  <div className="at-tooltip">
                    <div className="at-tooltip-date">{formatDate(label as string)}</div>
                    <div className="at-tooltip-items">
                      {payload
                        .filter((entry) => typeof entry.value === 'number' && entry.value > 0)
                        .sort((a, b) => ((b.value as number) ?? 0) - ((a.value as number) ?? 0))
                        .map((entry) => {
                          const val = entry.value as number;
                          return (
                            <div key={entry.name} className="at-tooltip-item">
                              <span
                                className="at-tooltip-color"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="at-tooltip-symbol">{entry.name}</span>
                              <span className="at-tooltip-value">
                                {viewMode === 'absolute'
                                  ? `$${val.toLocaleString()}`
                                  : `${val.toFixed(1)}%`}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    {viewMode === 'absolute' && (
                      <div className="at-tooltip-total">
                        Total: ${total.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
            />
            {allSymbols.map((symbol) => (
              <Bar
                key={symbol}
                dataKey={symbol}
                stackId="allocation"
                fill={colorMap[symbol]}
                name={symbol}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .allocation-timeline {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-6, 1.5rem);
  }

  .allocation-timeline--loading,
  .allocation-timeline--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .at-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: at-spin 1s linear infinite;
  }

  @keyframes at-spin {
    to { transform: rotate(360deg); }
  }

  .at-error-icon {
    color: var(--negative, #ef4444);
  }

  .at-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-5, 1.25rem);
    gap: var(--space-4, 1rem);
    flex-wrap: wrap;
  }

  .at-header h2 {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }

  .at-header p {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
    margin: 0;
  }

  .at-toggle {
    display: flex;
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-1, 0.25rem);
  }

  .at-toggle-btn {
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    background: transparent;
    border: none;
    border-radius: var(--radius-xl, 16px);
    color: var(--text-muted);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .at-toggle-btn:hover {
    color: var(--text-primary);
  }

  .at-toggle-btn.active {
    background: var(--accent);
    color: white;
  }

  .at-chart-container {
    width: 100%;
    height: 400px;
  }

  .at-tooltip {
    background: var(--bg-secondary, #1a1a2e);
    border: 1px solid var(--border, #2a2a3e);
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-4, 1rem);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    min-width: 180px;
  }

  .at-tooltip-date {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-3, 0.75rem);
    padding-bottom: var(--space-2, 0.5rem);
    border-bottom: 1px solid var(--border, #2a2a3e);
  }

  .at-tooltip-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
  }

  .at-tooltip-item {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    font-size: var(--text-sm, 0.875rem);
  }

  .at-tooltip-color {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .at-tooltip-symbol {
    flex: 1;
    color: var(--text-primary);
    font-weight: 500;
  }

  .at-tooltip-value {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .at-tooltip-total {
    margin-top: var(--space-3, 0.75rem);
    padding-top: var(--space-2, 0.5rem);
    border-top: 1px solid var(--border, #2a2a3e);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--text-primary);
    text-align: right;
  }

  .recharts-legend-item {
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .allocation-timeline {
      padding: var(--space-4, 1rem);
    }

    .at-header {
      flex-direction: column;
    }

    .at-chart-container {
      height: 300px;
    }
  }
`;

export default AllocationTimeline;
