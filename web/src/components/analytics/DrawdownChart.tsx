/**
 * DrawdownChart Component
 *
 * Visualizes portfolio drawdown from peak over time.
 * Replicates the drawdown analysis from PMSS.py (get_drawdown):
 * - Line chart showing drawdown percentage from peak
 * - Red/pink shaded area indicating drawdown severity
 * - Annotated maximum drawdown point
 *
 * Drawdown is computed as: (value[i] - cummax[i]) / cummax[i]
 * where cummax is the running maximum of portfolio values.
 */

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { getDrawdown as engineGetDrawdown, maxDrawdown as engineMaxDrawdown } from '../../lib/engine';

interface DataPoint {
  date: string;
  value: number;
}

interface DrawdownChartProps {
  data?: DataPoint[];
  symbols?: string[];
}

interface DrawdownDataPoint {
  date: string;
  drawdown: number;
}

function generateMockData(): DataPoint[] {
  const points: DataPoint[] = [];
  const startDate = new Date('2023-06-01');
  let value = 100000;

  for (let i = 0; i < 250; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    // Simulate realistic daily returns with occasional drawdown episodes
    let dailyReturn: number;

    if (i > 40 && i < 70) {
      // First drawdown episode: moderate correction
      dailyReturn = -0.003 + Math.random() * 0.004;
    } else if (i > 120 && i < 165) {
      // Second drawdown episode: deeper correction
      dailyReturn = -0.005 + Math.random() * 0.005;
    } else if (i > 200 && i < 220) {
      // Third drawdown episode: sharp but short
      dailyReturn = -0.004 + Math.random() * 0.006;
    } else {
      // Normal trending market with slight upward bias
      dailyReturn = 0.0003 + (Math.random() - 0.48) * 0.015;
    }

    value = value * (1 + dailyReturn);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    points.push({
      date: `${year}-${month}-${day}`,
      value,
    });
  }

  return points;
}

function computeDrawdown(data: DataPoint[]): DrawdownDataPoint[] {
  if (data.length === 0) return [];

  let cumulativeMax = data[0].value;
  const drawdownData: DrawdownDataPoint[] = [];

  for (const point of data) {
    if (point.value > cumulativeMax) {
      cumulativeMax = point.value;
    }

    const drawdown = (point.value - cumulativeMax) / cumulativeMax;

    drawdownData.push({
      date: point.date,
      drawdown: drawdown * 100,
    });
  }

  return drawdownData;
}

function findMaxDrawdownPoint(drawdownData: DrawdownDataPoint[]): DrawdownDataPoint | null {
  if (drawdownData.length === 0) return null;

  let maxDrawdownPoint = drawdownData[0];
  for (const point of drawdownData) {
    if (point.drawdown < maxDrawdownPoint.drawdown) {
      maxDrawdownPoint = point;
    }
  }

  return maxDrawdownPoint;
}

function formatDateTick(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
}

function formatTooltipDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const drawdownValue = payload[0].value;

  return (
    <div className="drawdown-tooltip">
      <p className="drawdown-tooltip__date">{formatTooltipDate(label || '')}</p>
      <p className="drawdown-tooltip__value">
        Drawdown: {drawdownValue.toFixed(2)}%
      </p>
    </div>
  );
}

export function DrawdownChart({ data, symbols }: DrawdownChartProps) {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const sourceData = useMemo(() => {
    return data && data.length > 0 ? data : generateMockData();
  }, [data]);

  const drawdownData = useMemo(() => computeDrawdown(sourceData), [sourceData]);

  const maxDrawdownPoint = useMemo(
    () => findMaxDrawdownPoint(drawdownData),
    [drawdownData],
  );

  const yDomainMin = useMemo(() => {
    if (!maxDrawdownPoint) return -10;
    return Math.floor(maxDrawdownPoint.drawdown - 2);
  }, [maxDrawdownPoint]);

  if (isLoading) {
    return (
      <div className="drawdown-chart drawdown-chart--loading" data-testid="drawdown-chart-loading">
        <div className="drawdown-chart__spinner" />
        <p>Loading drawdown data...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="drawdown-chart drawdown-chart--error" data-testid="drawdown-chart-error">
        <div className="drawdown-chart__error-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3>Failed to load drawdown data</h3>
        <p>{error}</p>
        <style>{styles}</style>
      </div>
    );
  }

  const symbolsLabel = symbols && symbols.length > 0
    ? symbols.join(', ')
    : 'Portfolio';

  return (
    <div className="drawdown-chart" data-testid="drawdown-chart">
      <div className="drawdown-chart__header">
        <div>
          <h3 className="drawdown-chart__title">Drawdown Analysis</h3>
          <p className="drawdown-chart__subtitle">
            {symbolsLabel} — Peak-to-trough decline over time
          </p>
        </div>
        {maxDrawdownPoint && (
          <div className="drawdown-chart__max-dd">
            <span className="drawdown-chart__max-dd-label">Max Drawdown</span>
            <span className="drawdown-chart__max-dd-value">
              {maxDrawdownPoint.drawdown.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="drawdown-chart__container">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={drawdownData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--negative, #ef4444)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--negative, #ef4444)" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              tick={{ fontSize: 11, fill: 'var(--text-muted, #94a3b8)' }}
              axisLine={{ stroke: 'var(--border, #334155)' }}
              tickLine={{ stroke: 'var(--border, #334155)' }}
              interval="preserveStartEnd"
              minTickGap={60}
            />

            <YAxis
              domain={[yDomainMin, 0]}
              tickFormatter={(value: number) => `${value.toFixed(0)}%`}
              tick={{ fontSize: 11, fill: 'var(--text-muted, #94a3b8)' }}
              axisLine={{ stroke: 'var(--border, #334155)' }}
              tickLine={{ stroke: 'var(--border, #334155)' }}
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              height={30}
              formatter={() => 'Drawdown from Peak'}
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}
            />

            <ReferenceLine
              y={0}
              stroke="var(--text-muted, #94a3b8)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />

            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="var(--negative, #ef4444)"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
              name="Drawdown from Peak"
              isAnimationActive={true}
              animationDuration={800}
            />

            {maxDrawdownPoint && (
              <ReferenceDot
                x={maxDrawdownPoint.date}
                y={maxDrawdownPoint.drawdown}
                r={5}
                fill="var(--negative, #ef4444)"
                stroke="var(--bg-secondary, #1e293b)"
                strokeWidth={2}
                label={{
                  value: `Max: ${maxDrawdownPoint.drawdown.toFixed(2)}%`,
                  position: 'top',
                  fill: 'var(--negative, #ef4444)',
                  fontSize: 11,
                  fontWeight: 600,
                  offset: 10,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!data && (
        <p className="drawdown-chart__mock-notice">
          Displaying simulated data. Connect a portfolio for live drawdown analysis.
        </p>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .drawdown-chart {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-6, 1.5rem);
    width: 100%;
  }

  .drawdown-chart--loading,
  .drawdown-chart--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 350px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .drawdown-chart__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--negative, #ef4444);
    border-radius: 50%;
    animation: drawdown-spin 1s linear infinite;
  }

  @keyframes drawdown-spin {
    to { transform: rotate(360deg); }
  }

  .drawdown-chart__error-icon {
    color: var(--negative, #ef4444);
  }

  .drawdown-chart--error h3 {
    font-size: var(--text-base, 1rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .drawdown-chart--error p {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
    margin: 0;
  }

  .drawdown-chart__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4, 1rem);
    gap: var(--space-4, 1rem);
  }

  .drawdown-chart__title {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }

  .drawdown-chart__subtitle {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
    margin: 0;
  }

  .drawdown-chart__max-dd {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .drawdown-chart__max-dd-label {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .drawdown-chart__max-dd-value {
    font-size: var(--text-2xl, 1.5rem);
    font-weight: 700;
    color: var(--negative, #ef4444);
    letter-spacing: -0.02em;
  }

  .drawdown-chart__container {
    width: 100%;
  }

  .drawdown-chart__mock-notice {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
    text-align: center;
    margin: var(--space-4, 1rem) 0 0 0;
    opacity: 0.7;
    font-style: italic;
  }

  .drawdown-tooltip {
    background: var(--bg-tertiary, #1e293b);
    border: 1px solid var(--border, #334155);
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .drawdown-tooltip__date {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted, #94a3b8);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }

  .drawdown-tooltip__value {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--negative, #ef4444);
    margin: 0;
  }

  @media (max-width: 768px) {
    .drawdown-chart {
      padding: var(--space-4, 1rem);
    }

    .drawdown-chart__header {
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .drawdown-chart__max-dd {
      align-items: flex-start;
    }
  }
`;

export default DrawdownChart;
