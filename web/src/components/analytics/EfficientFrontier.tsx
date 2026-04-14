/**
 * EfficientFrontier Component
 *
 * Visualizes the efficient frontier from Modern Portfolio Theory:
 * - Scatter plot of risk (volatility) vs return for frontier portfolios
 * - Highlighted special portfolios: MSR (Max Sharpe), GMV (Global Min Variance), EW (Equal Weight)
 * - Interactive tooltip showing portfolio weights for special portfolios
 * - Form to configure stock symbols and date range
 * - Fallback mock data for development without a running API
 */

import { useState, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FrontierPoint {
  volatility: number;
  expectedReturn: number;
  weights?: Record<string, number>;
  label?: string;
}

interface EfficientFrontierData {
  frontier: FrontierPoint[];
  msr: FrontierPoint;
  gmv: FrontierPoint;
  ew: FrontierPoint;
}

interface EfficientFrontierProps {
  symbols?: string[];
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Mock / fallback data generator
// ---------------------------------------------------------------------------

function generateMockFrontier(symbols: string[]): EfficientFrontierData {
  const n = 50;
  const frontier: FrontierPoint[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const volatility = 0.1 + t * 0.4;
    // Parabolic curve: return rises then levels off
    const expectedReturn = 0.05 + 0.75 * t - 0.45 * t * t;
    frontier.push({
      volatility: Number(volatility.toFixed(4)),
      expectedReturn: Number(expectedReturn.toFixed(4)),
    });
  }

  const buildWeights = (bias: number[]): Record<string, number> => {
    const raw = symbols.map((_, idx) => Math.max(0.01, bias[idx % bias.length] + Math.random() * 0.1));
    const sum = raw.reduce((a, b) => a + b, 0);
    const weights: Record<string, number> = {};
    symbols.forEach((s, idx) => {
      weights[s] = Number((raw[idx] / sum).toFixed(4));
    });
    return weights;
  };

  const msr: FrontierPoint = {
    volatility: 0.18,
    expectedReturn: 0.28,
    weights: buildWeights([0.35, 0.25, 0.2, 0.1, 0.1]),
    label: 'Max Sharpe Ratio',
  };

  const gmv: FrontierPoint = {
    volatility: 0.11,
    expectedReturn: 0.12,
    weights: buildWeights([0.1, 0.15, 0.25, 0.3, 0.2]),
    label: 'Global Min Variance',
  };

  const equalWeight = 1 / Math.max(symbols.length, 1);
  const ewWeights: Record<string, number> = {};
  symbols.forEach((s) => {
    ewWeights[s] = Number(equalWeight.toFixed(4));
  });

  const ew: FrontierPoint = {
    volatility: 0.22,
    expectedReturn: 0.2,
    weights: ewWeights,
    label: 'Equal Weight',
  };

  return { frontier, msr, gmv, ew };
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  payload?: FrontierPoint & { label?: string; weights?: Record<string, number> };
}

function FrontierTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  if (!point) return null;

  return (
    <div className="frontier-tooltip">
      {point.label && <div className="tooltip-label">{point.label}</div>}
      <div className="tooltip-row">
        <span>Volatility:</span>
        <span>{(point.volatility * 100).toFixed(2)}%</span>
      </div>
      <div className="tooltip-row">
        <span>Expected Return:</span>
        <span>{(point.expectedReturn * 100).toFixed(2)}%</span>
      </div>
      {point.weights && (
        <div className="tooltip-weights">
          <div className="tooltip-weights-title">Weights</div>
          {Object.entries(point.weights).map(([sym, w]) => (
            <div key={sym} className="tooltip-row">
              <span>{sym}:</span>
              <span>{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EfficientFrontier({
  symbols: initialSymbols,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: EfficientFrontierProps) {
  const defaultSymbols = initialSymbols ?? ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'];
  const defaultStart = initialStartDate ?? '2023-01-01';
  const defaultEnd = initialEndDate ?? '2024-12-31';

  const [symbolsInput, setSymbolsInput] = useState(defaultSymbols.join(', '));
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EfficientFrontierData | null>(() =>
    generateMockFrontier(defaultSymbols),
  );

  const parseSymbols = (raw: string): string[] =>
    raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

  const fetchFrontier = useCallback(async () => {
    const symbols = parseSymbols(symbolsInput);
    if (symbols.length < 2) {
      setError('Please enter at least two stock symbols.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/efficient-frontier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols,
          start_date: startDate,
          end_date: endDate,
          risk_free: 0.04,
          n_points: 50,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result: EfficientFrontierData = await response.json();
      setData(result);
    } catch (err) {
      console.error('Efficient frontier fetch failed, using mock data:', err);
      setData(generateMockFrontier(symbols));
      setError('Could not reach the API. Displaying mock data.');
    } finally {
      setLoading(false);
    }
  }, [symbolsInput, startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFrontier();
  };

  return (
    <div className="efficient-frontier" data-testid="efficient-frontier">
      {/* Header */}
      <div className="ef-header">
        <div>
          <h1>Efficient Frontier</h1>
          <p>Optimal risk-return trade-off from Modern Portfolio Theory</p>
        </div>
      </div>

      {/* Configuration form */}
      <form className="ef-form" onSubmit={handleSubmit}>
        <div className="ef-form-group ef-form-group--symbols">
          <label htmlFor="ef-symbols">Symbols (comma-separated)</label>
          <input
            id="ef-symbols"
            type="text"
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value.toUpperCase())}
            placeholder="AAPL, MSFT, NVDA..."
          />
        </div>

        <div className="ef-form-group">
          <label htmlFor="ef-start">Start Date</label>
          <input
            id="ef-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="ef-form-group">
          <label htmlFor="ef-end">End Date</label>
          <input
            id="ef-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary ef-submit" disabled={loading}>
          {loading ? 'Computing...' : 'Calculate'}
        </button>
      </form>

      {/* Error banner */}
      {error && (
        <div className="ef-error">
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchFrontier}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="ef-loading">
          <div className="loading-spinner" />
          <p>Computing efficient frontier...</p>
        </div>
      )}

      {/* Chart */}
      {data && !loading && (
        <div className="ef-chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <XAxis
                type="number"
                dataKey="volatility"
                name="Volatility"
                unit="%"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                label={{ value: 'Volatility (Risk)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)' }}
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="expectedReturn"
                name="Expected Return"
                unit="%"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: 0, fill: 'var(--text-muted)' }}
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <Tooltip content={<FrontierTooltip />} />
              <Legend verticalAlign="top" height={36} />

              {/* Frontier curve */}
              <Scatter
                name="Frontier"
                data={data.frontier}
                fill="#3b82f6"
                r={3}
              />

              {/* MSR */}
              <Scatter
                name="Max Sharpe (MSR)"
                data={[data.msr]}
                fill="#ef4444"
                r={8}
                shape="circle"
              />

              {/* GMV */}
              <Scatter
                name="Global Min Variance (GMV)"
                data={[data.gmv]}
                fill="#22c55e"
                r={8}
                shape="circle"
              />

              {/* Equal Weight */}
              <Scatter
                name="Equal Weight (EW)"
                data={[data.ew]}
                fill="#eab308"
                r={8}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Portfolio summary cards */}
          <div className="ef-portfolio-cards">
            <PortfolioCard
              title="Max Sharpe Ratio"
              point={data.msr}
              color="#ef4444"
            />
            <PortfolioCard
              title="Global Min Variance"
              point={data.gmv}
              color="#22c55e"
            />
            <PortfolioCard
              title="Equal Weight"
              point={data.ew}
              color="#eab308"
            />
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio summary card
// ---------------------------------------------------------------------------

function PortfolioCard({
  title,
  point,
  color,
}: {
  title: string;
  point: FrontierPoint;
  color: string;
}) {
  return (
    <div className="portfolio-card" style={{ borderTopColor: color }}>
      <div className="portfolio-card-header">
        <span className="portfolio-dot" style={{ backgroundColor: color }} />
        <span className="portfolio-card-title">{title}</span>
      </div>
      <div className="portfolio-card-metrics">
        <div className="portfolio-metric">
          <span className="portfolio-metric-label">Return</span>
          <span className="portfolio-metric-value">{(point.expectedReturn * 100).toFixed(2)}%</span>
        </div>
        <div className="portfolio-metric">
          <span className="portfolio-metric-label">Volatility</span>
          <span className="portfolio-metric-value">{(point.volatility * 100).toFixed(2)}%</span>
        </div>
      </div>
      {point.weights && (
        <div className="portfolio-card-weights">
          {Object.entries(point.weights).map(([sym, w]) => (
            <div key={sym} className="weight-bar-row">
              <span className="weight-symbol">{sym}</span>
              <div className="weight-bar-track">
                <div
                  className="weight-bar-fill"
                  style={{ width: `${(w * 100).toFixed(1)}%`, backgroundColor: color }}
                />
              </div>
              <span className="weight-pct">{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (CSS-in-JS via template literal, matching RiskDashboard pattern)
// ---------------------------------------------------------------------------

const styles = `
  .efficient-frontier {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--space-6, 1.5rem);
    width: 100%;
  }

  /* Header */
  .ef-header {
    margin-bottom: var(--space-6, 1.5rem);
  }

  .ef-header h1 {
    font-size: var(--text-2xl, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .ef-header p {
    color: var(--text-muted);
    margin: 0;
  }

  /* Form */
  .ef-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-4, 1rem);
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
    margin-bottom: var(--space-6, 1.5rem);
  }

  .ef-form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
  }

  .ef-form-group--symbols {
    flex: 1;
    min-width: 200px;
  }

  .ef-form-group label {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ef-form-group input {
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    background: var(--bg-primary, #fff);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 8px);
    color: var(--text-primary);
    font-size: var(--text-sm, 0.875rem);
  }

  .ef-form-group input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .ef-submit {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    border: none;
    border-radius: var(--radius-lg, 12px);
    cursor: pointer;
    transition: all 0.2s;
    background: var(--accent);
    color: white;
  }

  .ef-submit:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .ef-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Error */
  .ef-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4, 1rem);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-lg, 12px);
    color: var(--negative, #ef4444);
    font-size: var(--text-sm, 0.875rem);
    margin-bottom: var(--space-6, 1.5rem);
  }

  /* Loading */
  .ef-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: ef-spin 1s linear infinite;
  }

  @keyframes ef-spin {
    to { transform: rotate(360deg); }
  }

  /* Chart container */
  .ef-chart-container {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
  }

  /* Recharts overrides */
  .ef-chart-container .recharts-legend-item-text {
    color: var(--text-muted) !important;
    font-size: var(--text-sm, 0.875rem);
  }

  /* Tooltip */
  .frontier-tooltip {
    background: var(--bg-secondary, #1e1e2e);
    border: 1px solid var(--border, #333);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-3, 0.75rem);
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-secondary, #ccc);
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.3));
    min-width: 160px;
  }

  .tooltip-label {
    font-weight: 700;
    color: var(--text-primary, #fff);
    margin-bottom: var(--space-2, 0.5rem);
    padding-bottom: var(--space-2, 0.5rem);
    border-bottom: 1px solid var(--border, #333);
  }

  .tooltip-row {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3, 0.75rem);
    padding: 2px 0;
  }

  .tooltip-row span:last-child {
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .tooltip-weights {
    margin-top: var(--space-2, 0.5rem);
    padding-top: var(--space-2, 0.5rem);
    border-top: 1px solid var(--border, #333);
  }

  .tooltip-weights-title {
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: var(--space-1, 0.25rem);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Portfolio summary cards */
  .ef-portfolio-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4, 1rem);
    margin-top: var(--space-6, 1.5rem);
  }

  .portfolio-card {
    background: var(--bg-tertiary, #262638);
    border: 1px solid var(--border, #333);
    border-top: 3px solid;
    border-radius: var(--radius-lg, 12px);
    padding: var(--space-4, 1rem);
  }

  .portfolio-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .portfolio-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .portfolio-card-title {
    font-weight: 600;
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-primary);
  }

  .portfolio-card-metrics {
    display: flex;
    gap: var(--space-6, 1.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .portfolio-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .portfolio-metric-label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .portfolio-metric-value {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 700;
    color: var(--text-primary);
  }

  .portfolio-card-weights {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
  }

  .weight-bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
  }

  .weight-symbol {
    width: 40px;
    font-size: var(--text-xs, 0.75rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .weight-bar-track {
    flex: 1;
    height: 6px;
    background: var(--bg-secondary, #1e1e2e);
    border-radius: 3px;
    overflow: hidden;
  }

  .weight-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .weight-pct {
    width: 42px;
    text-align: right;
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  /* Shared button styles */
  .btn {
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

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .btn-sm {
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    font-size: var(--text-xs, 0.75rem);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .efficient-frontier {
      padding: var(--space-4, 1rem);
    }

    .ef-form {
      flex-direction: column;
      align-items: stretch;
    }

    .ef-portfolio-cards {
      grid-template-columns: 1fr;
    }
  }
`;

export default EfficientFrontier;
