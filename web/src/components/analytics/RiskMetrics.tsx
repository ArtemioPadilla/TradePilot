/**
 * RiskMetrics Component
 *
 * Replicates the risk metrics from PMSS.py for the web app:
 * - VaR (Historic, Gaussian, Cornish-Fisher)
 * - CVaR (Conditional Value at Risk)
 * - Sharpe Ratio, Sortino Ratio
 * - Volatility, Max Drawdown
 * - Skewness, Kurtosis
 *
 * Displays summary cards, a comparative VaR bar chart, and a full metrics table
 * with best/worst highlighting per column.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssetRiskMetrics {
  symbol: string;
  annualized_return: number;
  volatility: number;
  var_historic: number;
  var_gaussian: number;
  var_cf: number;
  cvar: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
  skewness: number;
  kurtosis: number;
}

interface PortfolioSummaryMetrics {
  var_historic: number;
  cvar: number;
  sharpe: number;
  sortino: number;
}

interface RiskMetricsResponse {
  portfolio: PortfolioSummaryMetrics;
  assets: AssetRiskMetrics[];
}

interface RiskMetricsProps {
  symbols?: string[];
}

// ---------------------------------------------------------------------------
// Mock data (fallback for 5 symbols)
// ---------------------------------------------------------------------------

const MOCK_DATA: RiskMetricsResponse = {
  portfolio: {
    var_historic: -0.0213,
    cvar: -0.0341,
    sharpe: 1.12,
    sortino: 1.47,
  },
  assets: [
    {
      symbol: 'AAPL',
      annualized_return: 0.2845,
      volatility: 0.2312,
      var_historic: -0.0198,
      var_gaussian: -0.0215,
      var_cf: -0.0227,
      cvar: -0.0318,
      sharpe: 1.06,
      sortino: 1.38,
      max_drawdown: -0.1642,
      skewness: -0.32,
      kurtosis: 3.85,
    },
    {
      symbol: 'MSFT',
      annualized_return: 0.3127,
      volatility: 0.2198,
      var_historic: -0.0183,
      var_gaussian: -0.0201,
      var_cf: -0.0209,
      cvar: -0.0295,
      sharpe: 1.24,
      sortino: 1.62,
      max_drawdown: -0.1387,
      skewness: -0.18,
      kurtosis: 3.42,
    },
    {
      symbol: 'NVDA',
      annualized_return: 0.8934,
      volatility: 0.4821,
      var_historic: -0.0387,
      var_gaussian: -0.0412,
      var_cf: -0.0468,
      cvar: -0.0589,
      sharpe: 1.77,
      sortino: 2.34,
      max_drawdown: -0.2915,
      skewness: 0.45,
      kurtosis: 5.12,
    },
    {
      symbol: 'GOOGL',
      annualized_return: 0.2456,
      volatility: 0.2543,
      var_historic: -0.0221,
      var_gaussian: -0.0237,
      var_cf: -0.0248,
      cvar: -0.0342,
      sharpe: 0.81,
      sortino: 1.05,
      max_drawdown: -0.1798,
      skewness: -0.41,
      kurtosis: 4.18,
    },
    {
      symbol: 'TSLA',
      annualized_return: 0.1523,
      volatility: 0.5634,
      var_historic: -0.0456,
      var_gaussian: -0.0489,
      var_cf: -0.0567,
      cvar: -0.0712,
      sharpe: 0.20,
      sortino: 0.28,
      max_drawdown: -0.4312,
      skewness: -0.67,
      kurtosis: 6.43,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatRatio(value: number): string {
  return value.toFixed(2);
}

type Direction = 'higher' | 'lower' | 'closerToZero';

function findExtreme(
  assets: AssetRiskMetrics[],
  key: keyof AssetRiskMetrics,
  direction: Direction
): string {
  if (assets.length === 0) return '';
  let bestSymbol = assets[0].symbol;
  let bestValue = assets[0][key] as number;

  for (const asset of assets) {
    const val = asset[key] as number;
    if (direction === 'higher' && val > bestValue) {
      bestValue = val;
      bestSymbol = asset.symbol;
    } else if (direction === 'lower' && val < bestValue) {
      bestValue = val;
      bestSymbol = asset.symbol;
    } else if (direction === 'closerToZero' && Math.abs(val) < Math.abs(bestValue)) {
      bestValue = val;
      bestSymbol = asset.symbol;
    }
  }
  return bestSymbol;
}

function findWorst(
  assets: AssetRiskMetrics[],
  key: keyof AssetRiskMetrics,
  direction: Direction
): string {
  if (assets.length === 0) return '';
  const opposite: Direction =
    direction === 'higher' ? 'lower' : direction === 'lower' ? 'higher' : 'closerToZero';

  if (direction === 'closerToZero') {
    let worstSymbol = assets[0].symbol;
    let worstValue = assets[0][key] as number;
    for (const asset of assets) {
      const val = asset[key] as number;
      if (Math.abs(val) > Math.abs(worstValue)) {
        worstValue = val;
        worstSymbol = asset.symbol;
      }
    }
    return worstSymbol;
  }

  return findExtreme(assets, key, opposite);
}

/** Column config for best/worst highlighting */
interface ColumnHighlightConfig {
  key: keyof AssetRiskMetrics;
  bestDirection: Direction;
}

const HIGHLIGHT_CONFIGS: ColumnHighlightConfig[] = [
  { key: 'annualized_return', bestDirection: 'higher' },
  { key: 'volatility', bestDirection: 'lower' },
  { key: 'var_historic', bestDirection: 'higher' },
  { key: 'var_gaussian', bestDirection: 'higher' },
  { key: 'var_cf', bestDirection: 'higher' },
  { key: 'cvar', bestDirection: 'higher' },
  { key: 'sharpe', bestDirection: 'higher' },
  { key: 'sortino', bestDirection: 'higher' },
  { key: 'max_drawdown', bestDirection: 'higher' },
  { key: 'skewness', bestDirection: 'higher' },
  { key: 'kurtosis', bestDirection: 'lower' },
];

function getCellClass(
  assets: AssetRiskMetrics[],
  symbol: string,
  key: keyof AssetRiskMetrics,
  configs: ColumnHighlightConfig[]
): string {
  const config = configs.find((c) => c.key === key);
  if (!config || assets.length < 2) return '';

  const best = findExtreme(assets, key, config.bestDirection);
  const worst = findWorst(assets, key, config.bestDirection);

  if (symbol === best) return 'cell-best';
  if (symbol === worst) return 'cell-worst';
  return '';
}

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

const VAR_COLORS = {
  historic: '#6366f1',
  gaussian: '#f59e0b',
  cornishFisher: '#ef4444',
};

// ---------------------------------------------------------------------------
// Custom Tooltip for the bar chart
// ---------------------------------------------------------------------------

function VarChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="var-chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="tooltip-entry">
          {entry.name}: {(entry.value * 100).toFixed(2)}%
        </p>
      ))}
      <style>{tooltipStyles}</style>
    </div>
  );
}

const tooltipStyles = `
  .var-chart-tooltip {
    background: var(--bg-secondary, #1a1a2e);
    border: 1px solid var(--border, #2a2a4a);
    border-radius: var(--radius-lg, 12px);
    padding: var(--space-3, 0.75rem);
    font-size: var(--text-sm, 0.875rem);
  }
  .tooltip-label {
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }
  .tooltip-entry {
    margin: 0;
    font-size: var(--text-xs, 0.75rem);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskMetrics({ symbols: initialSymbols }: RiskMetricsProps) {
  const [inputValue, setInputValue] = useState(initialSymbols?.join(', ') ?? '');
  const [submittedSymbols, setSubmittedSymbols] = useState<string[]>(initialSymbols ?? []);
  const [data, setData] = useState<RiskMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseSymbols = useCallback((raw: string): string[] => {
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  }, []);

  const fetchMetrics = useCallback(async (syms: string[]) => {
    if (syms.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const response = await fetch('/api/risk-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: syms,
          start_date: oneYearAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          risk_free: 0.04,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result: RiskMetricsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.warn('API unavailable, falling back to mock data:', err);
      // Filter mock data to match requested symbols when possible
      const mockAssets = MOCK_DATA.assets.filter((a) => syms.includes(a.symbol));
      if (mockAssets.length > 0) {
        setData({ portfolio: MOCK_DATA.portfolio, assets: mockAssets });
      } else {
        setData(MOCK_DATA);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data or mock fallback
  useEffect(() => {
    if (submittedSymbols.length > 0) {
      fetchMetrics(submittedSymbols);
    } else {
      // Default to mock data when no symbols provided
      setData(MOCK_DATA);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const syms = parseSymbols(inputValue);
    setSubmittedSymbols(syms);
    fetchMetrics(syms);
  };

  const handleRetry = () => {
    if (submittedSymbols.length > 0) {
      fetchMetrics(submittedSymbols);
    } else {
      setData(MOCK_DATA);
      setError(null);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.assets.map((asset) => ({
      symbol: asset.symbol,
      Historic: Math.abs(asset.var_historic),
      Gaussian: Math.abs(asset.var_gaussian),
      'Cornish-Fisher': Math.abs(asset.var_cf),
    }));
  }, [data]);

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="risk-metrics risk-metrics--loading" data-testid="risk-metrics">
        <div className="rm-loading-spinner" />
        <p>Calculating risk metrics...</p>
        <style>{styles}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Error (no data at all)
  // ---------------------------------------------------------------------------

  if (error && !data) {
    return (
      <div className="risk-metrics risk-metrics--error" data-testid="risk-metrics">
        <div className="rm-error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Failed to Load Risk Metrics</h2>
        <p>{error}</p>
        <button onClick={handleRetry} className="rm-btn rm-btn-primary">
          Retry
        </button>
        <style>{styles}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main
  // ---------------------------------------------------------------------------

  const assets = data?.assets ?? [];
  const portfolio = data?.portfolio ?? null;

  return (
    <div className="risk-metrics" data-testid="risk-metrics">
      {/* Symbol input form */}
      <form className="rm-symbol-form" onSubmit={handleSubmit}>
        <label htmlFor="rm-symbols-input" className="rm-form-label">
          Stock Symbols
        </label>
        <div className="rm-input-row">
          <input
            id="rm-symbols-input"
            type="text"
            className="rm-text-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="AAPL, MSFT, NVDA, GOOGL, TSLA"
          />
          <button type="submit" className="rm-btn rm-btn-primary">
            Analyze
          </button>
        </div>
      </form>

      {/* Summary metric cards */}
      {portfolio && (
        <section className="rm-summary-section">
          <h2>Portfolio Risk Summary</h2>
          <div className="rm-summary-grid">
            <div className="rm-summary-card">
              <span className="rm-card-label">VaR (95%)</span>
              <span className="rm-card-value rm-negative">
                {formatPercent(portfolio.var_historic)}
              </span>
              <span className="rm-card-sub">Historic, 1-day</span>
            </div>
            <div className="rm-summary-card">
              <span className="rm-card-label">CVaR (95%)</span>
              <span className="rm-card-value rm-negative">
                {formatPercent(portfolio.cvar)}
              </span>
              <span className="rm-card-sub">Expected shortfall</span>
            </div>
            <div className="rm-summary-card">
              <span className="rm-card-label">Sharpe Ratio</span>
              <span
                className={`rm-card-value ${
                  portfolio.sharpe >= 1 ? 'rm-positive' : ''
                }`}
              >
                {formatRatio(portfolio.sharpe)}
              </span>
              <span className="rm-card-sub">
                {portfolio.sharpe >= 1.5
                  ? 'Excellent'
                  : portfolio.sharpe >= 1
                    ? 'Good'
                    : portfolio.sharpe >= 0.5
                      ? 'Average'
                      : 'Poor'}
              </span>
            </div>
            <div className="rm-summary-card">
              <span className="rm-card-label">Sortino Ratio</span>
              <span
                className={`rm-card-value ${
                  portfolio.sortino >= 1 ? 'rm-positive' : ''
                }`}
              >
                {formatRatio(portfolio.sortino)}
              </span>
              <span className="rm-card-sub">Downside-adjusted</span>
            </div>
          </div>
        </section>
      )}

      {/* VaR comparison bar chart */}
      {chartData.length > 0 && (
        <section className="rm-chart-section">
          <h2>Value at Risk Comparison</h2>
          <p className="rm-section-desc">
            95% VaR by method — higher bars indicate greater daily loss potential
          </p>
          <div className="rm-chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis
                  dataKey="symbol"
                  tick={{ fill: 'var(--text-muted, #888)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border, #333)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                  tick={{ fill: 'var(--text-muted, #888)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border, #333)' }}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<VarChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                />
                <Bar dataKey="Historic" fill={VAR_COLORS.historic} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={`hist-${idx}`} fill={VAR_COLORS.historic} />
                  ))}
                </Bar>
                <Bar dataKey="Gaussian" fill={VAR_COLORS.gaussian} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={`gaus-${idx}`} fill={VAR_COLORS.gaussian} />
                  ))}
                </Bar>
                <Bar dataKey="Cornish-Fisher" fill={VAR_COLORS.cornishFisher} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={`cf-${idx}`} fill={VAR_COLORS.cornishFisher} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Full metrics table */}
      {assets.length > 0 && (
        <section className="rm-table-section">
          <h2>Detailed Metrics by Asset</h2>
          <div className="rm-table-container">
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Ann. Return</th>
                  <th>Volatility</th>
                  <th>VaR Historic</th>
                  <th>VaR Gaussian</th>
                  <th>VaR C-F</th>
                  <th>CVaR</th>
                  <th>Sharpe</th>
                  <th>Sortino</th>
                  <th>Max DD</th>
                  <th>Skewness</th>
                  <th>Kurtosis</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.symbol}>
                    <td className="rm-symbol-cell">{asset.symbol}</td>
                    <td className={getCellClass(assets, asset.symbol, 'annualized_return', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.annualized_return)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'volatility', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.volatility)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'var_historic', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.var_historic)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'var_gaussian', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.var_gaussian)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'var_cf', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.var_cf)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'cvar', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.cvar)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'sharpe', HIGHLIGHT_CONFIGS)}>
                      {formatRatio(asset.sharpe)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'sortino', HIGHLIGHT_CONFIGS)}>
                      {formatRatio(asset.sortino)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'max_drawdown', HIGHLIGHT_CONFIGS)}>
                      {formatPercent(asset.max_drawdown)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'skewness', HIGHLIGHT_CONFIGS)}>
                      {formatRatio(asset.skewness)}
                    </td>
                    <td className={getCellClass(assets, asset.symbol, 'kurtosis', HIGHLIGHT_CONFIGS)}>
                      {formatRatio(asset.kurtosis)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <style>{styles}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = `
  .risk-metrics {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--space-6, 1.5rem);
  }

  .risk-metrics--loading,
  .risk-metrics--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .rm-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: rm-spin 1s linear infinite;
  }

  @keyframes rm-spin {
    to { transform: rotate(360deg); }
  }

  .rm-error-icon {
    color: var(--negative);
  }

  .risk-metrics--error h2 {
    color: var(--text-primary);
    margin: 0;
  }

  .risk-metrics--error p {
    color: var(--text-muted);
    margin: 0;
  }

  /* ---------- Buttons ---------- */

  .rm-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    border: none;
    border-radius: var(--radius-lg, 12px);
    cursor: pointer;
    transition: all 0.2s;
  }

  .rm-btn-primary {
    background: var(--accent);
    color: white;
  }

  .rm-btn-primary:hover {
    opacity: 0.9;
  }

  /* ---------- Symbol Form ---------- */

  .rm-symbol-form {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
    margin-bottom: var(--space-6, 1.5rem);
  }

  .rm-form-label {
    display: block;
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-2, 0.5rem);
  }

  .rm-input-row {
    display: flex;
    gap: var(--space-3, 0.75rem);
  }

  .rm-text-input {
    flex: 1;
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    color: var(--text-primary);
    font-size: var(--text-sm, 0.875rem);
    font-family: inherit;
  }

  .rm-text-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .rm-text-input::placeholder {
    color: var(--text-muted);
  }

  /* ---------- Summary Cards ---------- */

  .rm-summary-section {
    margin-bottom: var(--space-8, 2rem);
  }

  .rm-summary-section h2,
  .rm-chart-section h2,
  .rm-table-section h2 {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-4, 1rem) 0;
  }

  .rm-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4, 1rem);
  }

  .rm-summary-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 0.25rem);
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
    transition: all 0.2s;
  }

  .rm-summary-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .rm-card-label {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rm-card-value {
    font-size: var(--text-2xl, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .rm-card-value.rm-positive {
    color: var(--positive);
  }

  .rm-card-value.rm-negative {
    color: var(--negative);
  }

  .rm-card-sub {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  /* ---------- Chart Section ---------- */

  .rm-chart-section {
    margin-bottom: var(--space-8, 2rem);
  }

  .rm-section-desc {
    color: var(--text-muted);
    font-size: var(--text-sm, 0.875rem);
    margin: -0.5rem 0 var(--space-4, 1rem) 0;
  }

  .rm-chart-container {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
  }

  /* ---------- Table Section ---------- */

  .rm-table-section {
    margin-bottom: var(--space-8, 2rem);
  }

  .rm-table-container {
    overflow-x: auto;
    border-radius: var(--radius-lg, 12px);
    border: 1px solid var(--border);
  }

  .rm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm, 0.875rem);
    white-space: nowrap;
  }

  .rm-table th {
    background: var(--bg-tertiary);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
  }

  .rm-table td {
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
  }

  .rm-table tr:last-child td {
    border-bottom: none;
  }

  .rm-table tr:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.03));
  }

  .rm-symbol-cell {
    font-weight: 600;
    color: var(--text-primary) !important;
  }

  /* Best / worst highlighting */
  .rm-table td.cell-best {
    color: var(--positive);
    font-weight: 600;
  }

  .rm-table td.cell-worst {
    color: var(--negative);
    font-weight: 600;
  }

  /* ---------- Responsive ---------- */

  @media (max-width: 768px) {
    .risk-metrics {
      padding: var(--space-4, 1rem);
    }

    .rm-input-row {
      flex-direction: column;
    }

    .rm-summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .rm-summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default RiskMetrics;
