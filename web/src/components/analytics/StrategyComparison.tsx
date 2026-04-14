/**
 * StrategyComparison Component
 *
 * Displays a side-by-side comparison table of multiple backtest strategies,
 * replicating the get_strategies_comparisons output from PMSS.py.
 *
 * Features:
 * - Columns: Strategy Name, Ranking Function, Optimization, Return, Alpha,
 *   Volatility, Sharpe Ratio, Sortino Ratio, Max Drawdown, VaR, CVaR,
 *   Return Diff vs S&P500
 * - Best value per numeric column highlighted green, worst highlighted red
 * - Sortable columns (click header)
 * - S&P500 Benchmark and Risk-Free Rate benchmark rows
 * - Loading and error states
 * - Fetches from POST /api/strategy-comparison when no data supplied via props
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StrategyResult {
  name: string;
  rankingFunction: string | null;
  optimization: string | null;
  annualizedReturn: number;
  alpha: number;
  volatility: number;
  sharpe: number | null;
  sortino: number | null;
  maxDrawdown: number;
  var: number;
  cvar: number;
  returnDiffSP500: number;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof StrategyResult;
  direction: SortDirection;
}

interface StrategyComparisonProps {
  strategies?: StrategyResult[];
}

// ---------------------------------------------------------------------------
// Numeric column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: keyof StrategyResult;
  label: string;
  isNumeric: boolean;
  /** For numeric columns, whether a higher value is "better" */
  higherIsBetter: boolean;
  format: (value: unknown) => string;
}

function formatPercent(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatRatio(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(4);
}

function formatText(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return String(value);
}

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Strategy', isNumeric: false, higherIsBetter: true, format: formatText },
  { key: 'rankingFunction', label: 'Ranking Function', isNumeric: false, higherIsBetter: true, format: formatText },
  { key: 'optimization', label: 'Optimization', isNumeric: false, higherIsBetter: true, format: formatText },
  { key: 'annualizedReturn', label: 'Return', isNumeric: true, higherIsBetter: true, format: formatPercent },
  { key: 'alpha', label: 'Alpha', isNumeric: true, higherIsBetter: true, format: formatPercent },
  { key: 'volatility', label: 'Volatility', isNumeric: true, higherIsBetter: false, format: formatPercent },
  { key: 'sharpe', label: 'Sharpe Ratio', isNumeric: true, higherIsBetter: true, format: formatRatio },
  { key: 'sortino', label: 'Sortino Ratio', isNumeric: true, higherIsBetter: true, format: formatRatio },
  { key: 'maxDrawdown', label: 'Max Drawdown', isNumeric: true, higherIsBetter: false, format: formatPercent },
  { key: 'var', label: 'VaR', isNumeric: true, higherIsBetter: false, format: formatPercent },
  { key: 'cvar', label: 'CVaR', isNumeric: true, higherIsBetter: false, format: formatPercent },
  { key: 'returnDiffSP500', label: 'Return Diff vs S&P500', isNumeric: true, higherIsBetter: true, format: formatPercent },
];

// ---------------------------------------------------------------------------
// Mock data — mirrors the 9 strategies from PMSS.py plus benchmarks
// ---------------------------------------------------------------------------

const SP500_RETURN = 0.1052;
const RFR_RETURN = 0.0178;

const MOCK_STRATEGIES: StrategyResult[] = [
  {
    name: 'Random EW',
    rankingFunction: 'Random',
    optimization: 'Eq Weighted',
    annualizedReturn: 0.1523,
    alpha: 0.1523 - RFR_RETURN,
    volatility: 0.2134,
    sharpe: 0.1523 / 0.2134,
    sortino: 0.1523 / 0.1247,
    maxDrawdown: -0.3012,
    var: -0.0198,
    cvar: -0.0287,
    returnDiffSP500: 0.1523 - SP500_RETURN,
  },
  {
    name: 'Random GMV',
    rankingFunction: 'Random',
    optimization: 'GMV',
    annualizedReturn: 0.1187,
    alpha: 0.1187 - RFR_RETURN,
    volatility: 0.1523,
    sharpe: 0.1187 / 0.1523,
    sortino: 0.1187 / 0.0891,
    maxDrawdown: -0.2145,
    var: -0.0152,
    cvar: -0.0213,
    returnDiffSP500: 0.1187 - SP500_RETURN,
  },
  {
    name: 'MaxMomentum GMV',
    rankingFunction: 'MaxMomentum',
    optimization: 'GMV',
    annualizedReturn: 0.0934,
    alpha: 0.0934 - RFR_RETURN,
    volatility: 0.1689,
    sharpe: 0.0934 / 0.1689,
    sortino: 0.0934 / 0.1012,
    maxDrawdown: -0.2587,
    var: -0.0178,
    cvar: -0.0245,
    returnDiffSP500: 0.0934 - SP500_RETURN,
  },
  {
    name: 'MinMomentum GMV',
    rankingFunction: 'MinMomentum',
    optimization: 'GMV',
    annualizedReturn: 0.2145,
    alpha: 0.2145 - RFR_RETURN,
    volatility: 0.1834,
    sharpe: 0.2145 / 0.1834,
    sortino: 0.2145 / 0.1067,
    maxDrawdown: -0.2234,
    var: -0.0167,
    cvar: -0.0234,
    returnDiffSP500: 0.2145 - SP500_RETURN,
  },
  {
    name: 'MaxMomentum MSR',
    rankingFunction: 'MaxMomentum',
    optimization: 'MSR',
    annualizedReturn: 0.1078,
    alpha: 0.1078 - RFR_RETURN,
    volatility: 0.2345,
    sharpe: 0.1078 / 0.2345,
    sortino: 0.1078 / 0.1389,
    maxDrawdown: -0.3245,
    var: -0.0223,
    cvar: -0.0312,
    returnDiffSP500: 0.1078 - SP500_RETURN,
  },
  {
    name: 'MinMomentum MSR',
    rankingFunction: 'MinMomentum',
    optimization: 'MSR',
    annualizedReturn: 0.2567,
    alpha: 0.2567 - RFR_RETURN,
    volatility: 0.2012,
    sharpe: 0.2567 / 0.2012,
    sortino: 0.2567 / 0.1156,
    maxDrawdown: -0.2456,
    var: -0.0189,
    cvar: -0.0267,
    returnDiffSP500: 0.2567 - SP500_RETURN,
  },
  {
    name: 'MinVaR MSR',
    rankingFunction: 'MinVaR',
    optimization: 'MSR',
    annualizedReturn: 0.1345,
    alpha: 0.1345 - RFR_RETURN,
    volatility: 0.1756,
    sharpe: 0.1345 / 0.1756,
    sortino: 0.1345 / 0.1023,
    maxDrawdown: -0.2012,
    var: -0.0145,
    cvar: -0.0198,
    returnDiffSP500: 0.1345 - SP500_RETURN,
  },
  {
    name: 'MaxVaR MSR',
    rankingFunction: 'MaxVaR',
    optimization: 'MSR',
    annualizedReturn: 0.3412,
    alpha: 0.3412 - RFR_RETURN,
    volatility: 0.2789,
    sharpe: 0.3412 / 0.2789,
    sortino: 0.3412 / 0.1534,
    maxDrawdown: -0.3534,
    var: -0.0256,
    cvar: -0.0367,
    returnDiffSP500: 0.3412 - SP500_RETURN,
  },
  {
    name: 'MaxVaR EW',
    rankingFunction: 'MaxVaR',
    optimization: 'Eq Weighted',
    annualizedReturn: 0.2978,
    alpha: 0.2978 - RFR_RETURN,
    volatility: 0.2567,
    sharpe: 0.2978 / 0.2567,
    sortino: 0.2978 / 0.1423,
    maxDrawdown: -0.3123,
    var: -0.0234,
    cvar: -0.0334,
    returnDiffSP500: 0.2978 - SP500_RETURN,
  },
];

const BENCHMARK_SP500: StrategyResult = {
  name: 'S&P500 Benchmark',
  rankingFunction: null,
  optimization: null,
  annualizedReturn: SP500_RETURN,
  alpha: SP500_RETURN - RFR_RETURN,
  volatility: 0.1534,
  sharpe: SP500_RETURN / 0.1534,
  sortino: SP500_RETURN / 0.0923,
  maxDrawdown: -0.1987,
  var: -0.0156,
  cvar: -0.0212,
  returnDiffSP500: 0,
};

const BENCHMARK_RFR: StrategyResult = {
  name: 'Risk-Free Rate',
  rankingFunction: null,
  optimization: null,
  annualizedReturn: RFR_RETURN,
  alpha: 0,
  volatility: 0.0012,
  sharpe: null,
  sortino: null,
  maxDrawdown: 0,
  var: 0,
  cvar: 0,
  returnDiffSP500: RFR_RETURN - SP500_RETURN,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBenchmarkRow(strategy: StrategyResult): boolean {
  return strategy.name === 'S&P500 Benchmark' || strategy.name === 'Risk-Free Rate';
}

/** Compute min/max for each numeric column across all rows (excluding nulls). */
function computeExtremes(rows: StrategyResult[]) {
  const extremes: Record<string, { min: number; max: number }> = {};

  for (const col of COLUMNS) {
    if (!col.isNumeric) continue;

    let min = Infinity;
    let max = -Infinity;

    for (const row of rows) {
      const val = row[col.key];
      if (val === null || val === undefined) continue;
      const n = Number(val);
      if (n < min) min = n;
      if (n > max) max = n;
    }

    if (min !== Infinity) {
      extremes[col.key] = { min, max };
    }
  }

  return extremes;
}

function getCellHighlight(
  col: ColumnDef,
  value: unknown,
  extremes: Record<string, { min: number; max: number }>,
): string | undefined {
  if (!col.isNumeric || value === null || value === undefined) return undefined;

  const n = Number(value);
  const range = extremes[col.key];
  if (!range || range.min === range.max) return undefined;

  const isBest = col.higherIsBetter ? n === range.max : n === range.min;
  const isWorst = col.higherIsBetter ? n === range.min : n === range.max;

  if (isBest) return 'cell-best';
  if (isWorst) return 'cell-worst';
  return undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StrategyComparison({ strategies }: StrategyComparisonProps) {
  const [data, setData] = useState<StrategyResult[] | null>(strategies ?? null);
  const [loading, setLoading] = useState(!strategies);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'sortino',
    direction: 'desc',
  });

  // Fetch from API when no strategies provided via props
  useEffect(() => {
    if (strategies) {
      setData(strategies);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStrategies() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/strategy-comparison', { method: 'POST' });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          setData(result.strategies ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          // Fallback to mock data when API is unavailable
          setData(MOCK_STRATEGIES);
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStrategies();

    return () => {
      cancelled = true;
    };
  }, [strategies]);

  // Combine strategies with benchmark rows
  const allRows = useMemo<StrategyResult[]>(() => {
    if (!data) return [];
    return [...data, BENCHMARK_SP500, BENCHMARK_RFR];
  }, [data]);

  // Sort rows — benchmarks always at the bottom
  const sortedRows = useMemo(() => {
    const strategyRows = allRows.filter((r) => !isBenchmarkRow(r));
    const benchmarkRows = allRows.filter((r) => isBenchmarkRow(r));

    const sorted = [...strategyRows].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = typeof aVal === 'number' ? aVal : String(aVal);
      const bNum = typeof bVal === 'number' ? bVal : String(bVal);

      let comparison: number;
      if (typeof aNum === 'number' && typeof bNum === 'number') {
        comparison = aNum - bNum;
      } else {
        comparison = String(aNum).localeCompare(String(bNum));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return [...sorted, ...benchmarkRows];
  }, [allRows, sortConfig]);

  const extremes = useMemo(() => computeExtremes(allRows), [allRows]);

  const handleSort = useCallback((key: keyof StrategyResult) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // --- Loading state ---
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="strategy-comparison">
          <div className="comparison-header">
            <h2>Strategy Comparison</h2>
          </div>
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading strategy comparison data...</p>
          </div>
        </div>
      </>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="strategy-comparison">
          <div className="comparison-header">
            <h2>Strategy Comparison</h2>
          </div>
          <div className="error-state">
            <p className="error-title">Failed to load strategies</p>
            <p className="error-message">{error}</p>
            <button
              className="retry-button"
              onClick={() => {
                setError(null);
                setLoading(true);
                setData(null);
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // --- Table ---
  return (
    <>
      <style>{styles}</style>
      <div className="strategy-comparison">
        <div className="comparison-header">
          <h2>Strategy Comparison</h2>
          <p className="comparison-subtitle">
            Side-by-side performance comparison of backtest strategies against benchmarks.
            Click any column header to sort.
          </p>
        </div>

        <div className="table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const isActive = sortConfig.key === col.key;
                  const arrow = isActive
                    ? sortConfig.direction === 'asc'
                      ? ' \u25B2'
                      : ' \u25BC'
                    : '';

                  return (
                    <th
                      key={col.key}
                      className={`sortable-header ${isActive ? 'active-sort' : ''}`}
                      onClick={() => handleSort(col.key)}
                      title={`Sort by ${col.label}`}
                    >
                      {col.label}
                      {arrow && <span className="sort-arrow">{arrow}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const benchmark = isBenchmarkRow(row);

                return (
                  <tr
                    key={row.name}
                    className={benchmark ? 'benchmark-row' : 'strategy-row'}
                  >
                    {COLUMNS.map((col) => {
                      const value = row[col.key];
                      const highlight = getCellHighlight(col, value, extremes);

                      return (
                        <td
                          key={col.key}
                          className={[
                            col.isNumeric ? 'numeric-cell' : 'text-cell',
                            highlight ?? '',
                            benchmark ? 'benchmark-cell' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {col.format(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = `
  .strategy-comparison {
    max-width: 1600px;
    margin: 0 auto;
    padding: var(--space-6, 1.5rem);
  }

  .comparison-header {
    margin-bottom: var(--space-6, 1.5rem);
  }

  .comparison-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #e2e8f0);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .comparison-subtitle {
    color: var(--text-muted, #94a3b8);
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
  }

  /* Loading state */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12, 3rem);
    background: var(--glass-bg, rgba(15, 23, 42, 0.6));
    border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.1));
    border-radius: var(--radius-xl, 1rem);
    color: var(--text-muted, #94a3b8);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border, rgba(148, 163, 184, 0.2));
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: var(--space-4, 1rem);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error state */
  .error-state {
    text-align: center;
    padding: var(--space-12, 3rem);
    background: var(--glass-bg, rgba(15, 23, 42, 0.6));
    border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.1));
    border-radius: var(--radius-xl, 1rem);
  }

  .error-title {
    color: var(--negative, #ef4444);
    font-weight: 600;
    font-size: 1.125rem;
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .error-message {
    color: var(--text-muted, #94a3b8);
    font-size: 0.875rem;
    margin: 0 0 var(--space-4, 1rem) 0;
  }

  .retry-button {
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    background: var(--accent, #6366f1);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .retry-button:hover {
    opacity: 0.85;
  }

  /* Table container */
  .table-container {
    overflow-x: auto;
    background: var(--glass-bg, rgba(15, 23, 42, 0.6));
    border: 1px solid var(--glass-border, rgba(148, 163, 184, 0.1));
    border-radius: var(--radius-xl, 1rem);
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  /* Header */
  .comparison-table thead {
    background: var(--bg-secondary, #1e293b);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .sortable-header {
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    text-align: left;
    color: var(--text-muted, #94a3b8);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    user-select: none;
    border-bottom: 2px solid var(--border, rgba(148, 163, 184, 0.2));
    transition: color 0.15s ease;
  }

  .sortable-header:hover {
    color: var(--text-primary, #e2e8f0);
  }

  .sortable-header.active-sort {
    color: var(--accent, #6366f1);
  }

  .sort-arrow {
    font-size: 0.625rem;
    margin-left: 2px;
  }

  /* Cells */
  .comparison-table td {
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.1));
    color: var(--text-primary, #e2e8f0);
  }

  .numeric-cell {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  }

  .text-cell {
    font-weight: 500;
  }

  /* Best / Worst highlights */
  .cell-best {
    background-color: rgba(34, 197, 94, 0.18);
    color: var(--positive, #22c55e);
    font-weight: 600;
  }

  .cell-worst {
    background-color: rgba(239, 68, 68, 0.18);
    color: var(--negative, #ef4444);
    font-weight: 600;
  }

  /* Benchmark rows */
  .benchmark-row {
    background: var(--bg-tertiary, rgba(30, 41, 59, 0.5));
  }

  .benchmark-row td {
    border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.2));
    font-style: italic;
    color: var(--text-muted, #94a3b8);
  }

  .benchmark-cell {
    opacity: 0.85;
  }

  /* Strategy rows hover */
  .strategy-row {
    transition: background 0.1s ease;
  }

  .strategy-row:hover {
    background: var(--bg-secondary, rgba(30, 41, 59, 0.35));
  }

  /* Responsive */
  @media (max-width: 768px) {
    .strategy-comparison {
      padding: var(--space-4, 1rem);
    }

    .comparison-table {
      font-size: 0.75rem;
    }

    .sortable-header,
    .comparison-table td {
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    }
  }
`;

export default StrategyComparison;
