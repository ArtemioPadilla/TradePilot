/**
 * MomentumChart Component
 *
 * Visualizes price momentum for multiple symbols over time.
 * Replicates the momentum indicator from PMSS.py (get_momentum):
 *   Momentum(P, t) = P - P_t
 * where P is the current price and P_t is the price t days ago.
 *
 * Features:
 * - Multi-line chart with one line per symbol
 * - Configurable t parameter (lookback period) via slider
 * - Zero reference line separating positive/negative momentum
 * - Current momentum values table
 * - Mock data generation when no external data is provided
 */

import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const SYMBOL_COLORS: Record<string, string> = {
  AAPL: '#2563eb',
  MSFT: '#7c3aed',
  NVDA: '#059669',
  GOOGL: '#d97706',
  TSLA: '#dc2626',
  AMZN: '#0891b2',
  META: '#4f46e5',
  AMD: '#be185d',
  NFLX: '#ca8a04',
  CRM: '#0d9488',
};

const DEFAULT_PALETTE = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#4f46e5', '#be185d', '#ca8a04', '#0d9488',
];

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'];
const MIN_T = 5;
const MAX_T = 100;
const DEFAULT_T = 10;
const MOCK_DATA_POINTS = 200;

export interface MomentumChartProps {
  symbols?: string[];
  defaultT?: number;
}

interface MomentumDataPoint {
  date: string;
  [symbol: string]: number | string;
}

function generateMockPrices(symbol: string, count: number): number[] {
  const basePrices: Record<string, number> = {
    AAPL: 180, MSFT: 370, NVDA: 700, GOOGL: 140, TSLA: 240,
    AMZN: 175, META: 500, AMD: 140, NFLX: 620, CRM: 270,
  };
  const base = basePrices[symbol] ?? 100 + Math.random() * 200;
  const prices: number[] = [base];
  const volatility = 0.015 + Math.random() * 0.01;
  const drift = (Math.random() - 0.45) * 0.001;

  for (let i = 1; i < count; i++) {
    const change = prices[i - 1] * (drift + volatility * (Math.random() * 2 - 1));
    prices.push(Math.max(1, prices[i - 1] + change));
  }
  return prices;
}

function buildDateLabels(count: number): string[] {
  const dates: string[] = [];
  const start = new Date('2025-04-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function computeMomentum(prices: number[], t: number): (number | null)[] {
  return prices.map((price, i) => (i >= t ? price - prices[i - t] : null));
}

function getSymbolColor(symbol: string, index: number): string {
  return SYMBOL_COLORS[symbol] ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function MomentumChart({ symbols: initialSymbols, defaultT = DEFAULT_T }: MomentumChartProps) {
  const [tParam, setTParam] = useState<number>(
    Math.max(MIN_T, Math.min(MAX_T, defaultT)),
  );
  const [symbolInput, setSymbolInput] = useState<string>(
    (initialSymbols ?? DEFAULT_SYMBOLS).join(', '),
  );
  const [activeSymbols, setActiveSymbols] = useState<string[]>(
    initialSymbols ?? DEFAULT_SYMBOLS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceCache = useMemo<Record<string, number[]>>(() => {
    const cache: Record<string, number[]> = {};
    for (const symbol of activeSymbols) {
      cache[symbol] = generateMockPrices(symbol, MOCK_DATA_POINTS + MAX_T);
    }
    return cache;
  }, [activeSymbols]);

  const dates = useMemo(() => buildDateLabels(MOCK_DATA_POINTS), []);

  const chartData = useMemo<MomentumDataPoint[]>(() => {
    const data: MomentumDataPoint[] = [];
    const momentumBySymbol: Record<string, (number | null)[]> = {};

    for (const symbol of activeSymbols) {
      const prices = priceCache[symbol];
      if (!prices) continue;
      const sliced = prices.slice(MAX_T - tParam);
      momentumBySymbol[symbol] = computeMomentum(sliced, tParam);
    }

    for (let i = tParam; i < MOCK_DATA_POINTS + tParam; i++) {
      const point: MomentumDataPoint = { date: dates[i - tParam] ?? '' };
      for (const symbol of activeSymbols) {
        const vals = momentumBySymbol[symbol];
        if (vals) {
          const val = vals[i];
          point[symbol] = val !== null ? Number(val.toFixed(2)) : 0;
        }
      }
      data.push(point);
    }
    return data;
  }, [activeSymbols, tParam, priceCache, dates]);

  const latestValues = useMemo<Record<string, number>>(() => {
    const latest: Record<string, number> = {};
    if (chartData.length === 0) return latest;
    const last = chartData[chartData.length - 1];
    for (const symbol of activeSymbols) {
      latest[symbol] = Number(last[symbol] ?? 0);
    }
    return latest;
  }, [chartData, activeSymbols]);

  const handleApplySymbols = useCallback(() => {
    const parsed = symbolInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0 && /^[A-Z]{1,5}$/.test(s));

    if (parsed.length === 0) {
      setError('Enter at least one valid symbol (1-5 uppercase letters).');
      return;
    }
    if (parsed.length > 10) {
      setError('Maximum 10 symbols allowed.');
      return;
    }
    setError(null);
    setIsLoading(true);
    // Simulate brief loading for UX feedback
    setTimeout(() => {
      setActiveSymbols(parsed);
      setIsLoading(false);
    }, 300);
  }, [symbolInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleApplySymbols();
      }
    },
    [handleApplySymbols],
  );

  if (isLoading) {
    return (
      <div className="momentum-chart">
        <style>{styles}</style>
        <div className="momentum-chart--loading">
          <div className="loading-spinner" />
          <p>Calculating momentum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="momentum-chart">
      <style>{styles}</style>

      <div className="momentum-chart__header">
        <h3 className="momentum-chart__title">Momentum Indicator</h3>
        <p className="momentum-chart__subtitle">
          M(P, t) = P - P<sub>t</sub> &mdash; Rate of price change over {tParam} days
        </p>
      </div>

      {error && (
        <div className="momentum-chart__error" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
          <button
            className="error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <div className="momentum-chart__controls">
        <div className="control-group">
          <label className="control-label" htmlFor="momentum-symbols">
            Symbols
          </label>
          <div className="symbol-input-row">
            <input
              id="momentum-symbols"
              type="text"
              className="control-input"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. AAPL, MSFT, NVDA"
            />
            <button className="apply-btn" onClick={handleApplySymbols}>
              Apply
            </button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label" htmlFor="momentum-t">
            Lookback (t = {tParam} days)
          </label>
          <input
            id="momentum-t"
            type="range"
            className="control-slider"
            min={MIN_T}
            max={MAX_T}
            value={tParam}
            onChange={(e) => setTParam(Number(e.target.value))}
          />
          <div className="slider-labels">
            <span>{MIN_T}</span>
            <span>{MAX_T}</span>
          </div>
        </div>
      </div>

      <div className="momentum-chart__chart">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="var(--text-muted, #888)"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--text-muted, #888)"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--glass-bg, rgba(30,30,40,0.85))',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                color: 'var(--text-primary, #fff)',
                fontSize: '13px',
              }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value, name) => [
                Number(value).toFixed(2),
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '13px', color: 'var(--text-primary, #ccc)' }}
            />
            <ReferenceLine
              y={0}
              stroke="var(--text-muted, #888)"
              strokeDasharray="6 4"
              label={{
                value: '0',
                position: 'insideTopLeft',
                fill: 'var(--text-muted, #888)',
                fontSize: 11,
              }}
            />
            {activeSymbols.map((symbol, i) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={getSymbolColor(symbol, i)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 1 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="momentum-chart__values">
        <h4 className="values-title">Current Momentum</h4>
        <div className="values-grid">
          {activeSymbols.map((symbol, i) => {
            const val = latestValues[symbol] ?? 0;
            const isPositive = val >= 0;
            return (
              <div key={symbol} className="value-card">
                <div className="value-card__header">
                  <span
                    className="value-card__dot"
                    style={{ backgroundColor: getSymbolColor(symbol, i) }}
                  />
                  <span className="value-card__symbol">{symbol}</span>
                </div>
                <div
                  className={`value-card__value ${isPositive ? 'value-card__value--positive' : 'value-card__value--negative'}`}
                >
                  {isPositive ? '+' : ''}
                  {val.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = `
  .momentum-chart {
    background: var(--glass-bg, rgba(30, 30, 40, 0.6));
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-6, 1.5rem);
  }

  .momentum-chart--loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: var(--text-muted, #888);
    gap: var(--space-4, 1rem);
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border, rgba(255, 255, 255, 0.1));
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: momentum-spin 0.8s linear infinite;
  }

  @keyframes momentum-spin {
    to { transform: rotate(360deg); }
  }

  .momentum-chart__header {
    margin-bottom: var(--space-5, 1.25rem);
  }

  .momentum-chart__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .momentum-chart__subtitle {
    margin: var(--space-1, 0.25rem) 0 0;
    font-size: 0.85rem;
    color: var(--text-muted, #888);
  }

  .momentum-chart__error {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    margin-bottom: var(--space-4, 1rem);
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-xl, 16px);
    color: var(--negative, #ef4444);
    font-size: 0.875rem;
  }

  .error-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--negative, #ef4444);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .error-dismiss {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--negative, #ef4444);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }

  .momentum-chart__controls {
    display: flex;
    gap: var(--space-5, 1.25rem);
    margin-bottom: var(--space-5, 1.25rem);
    flex-wrap: wrap;
  }

  .control-group {
    flex: 1;
    min-width: 200px;
  }

  .control-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted, #888);
    margin-bottom: var(--space-2, 0.5rem);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .symbol-input-row {
    display: flex;
    gap: var(--space-2, 0.5rem);
  }

  .control-input {
    flex: 1;
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .control-input:focus {
    border-color: var(--accent, #6366f1);
  }

  .apply-btn {
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    background: var(--accent, #6366f1);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;
  }

  .apply-btn:hover {
    opacity: 0.85;
  }

  .control-slider {
    width: 100%;
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted, #888);
    margin-top: var(--space-1, 0.25rem);
  }

  .momentum-chart__chart {
    background: var(--bg-secondary, rgba(0, 0, 0, 0.2));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
    border-radius: 12px;
    padding: var(--space-4, 1rem) var(--space-2, 0.5rem);
    margin-bottom: var(--space-5, 1.25rem);
  }

  .momentum-chart__values {
    background: var(--bg-secondary, rgba(0, 0, 0, 0.2));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
    border-radius: 12px;
    padding: var(--space-4, 1rem);
  }

  .values-title {
    margin: 0 0 var(--space-3, 0.75rem);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-3, 0.75rem);
  }

  .value-card {
    background: var(--bg-tertiary, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
    border-radius: 10px;
    padding: var(--space-3, 0.75rem);
  }

  .value-card__header {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-2, 0.5rem);
  }

  .value-card__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .value-card__symbol {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .value-card__value {
    font-size: 1.1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .value-card__value--positive {
    color: var(--positive, #22c55e);
  }

  .value-card__value--negative {
    color: var(--negative, #ef4444);
  }

  @media (max-width: 640px) {
    .momentum-chart__controls {
      flex-direction: column;
    }

    .values-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export { MomentumChart };
export default MomentumChart;
