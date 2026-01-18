/**
 * PositionHistoryChart Component
 *
 * Visualizes portfolio position changes over time.
 * Shows how allocations shifted during the backtest.
 */

import { useMemo, useState } from 'react';
import type { PortfolioSnapshot } from '../../types/backtest';

interface PositionHistoryChartProps {
  /** Portfolio snapshots at rebalance dates */
  snapshots: PortfolioSnapshot[];
  /** Chart height in pixels */
  height?: number;
}

// Color palette for positions
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

type ChartMode = 'stacked' | 'line' | 'area';

export function PositionHistoryChart({
  snapshots,
  height = 300,
}: PositionHistoryChartProps) {
  const [mode, setMode] = useState<ChartMode>('stacked');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Get all unique symbols across snapshots
  const allSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    snapshots.forEach((snapshot) => {
      snapshot.positions.forEach((pos) => symbolSet.add(pos.symbol));
    });
    return Array.from(symbolSet).sort();
  }, [snapshots]);

  // Assign colors to symbols
  const symbolColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allSymbols.forEach((symbol, index) => {
      colors[symbol] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [allSymbols]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    return snapshots.map((snapshot) => {
      const positionMap: Record<string, number> = {};
      snapshot.positions.forEach((pos) => {
        positionMap[pos.symbol] = pos.weight;
      });

      return {
        date: new Date(snapshot.date).toLocaleDateString(),
        totalValue: snapshot.totalValue,
        cash: snapshot.cash,
        cashWeight: (snapshot.cash / snapshot.totalValue) * 100,
        positions: positionMap,
      };
    });
  }, [snapshots]);

  // Chart dimensions
  const chartWidth = 800;
  const padding = { top: 20, right: 120, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // X scale
  const xScale = (index: number) =>
    padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;

  // Y scale (0-100%)
  const yScale = (value: number) =>
    padding.top + innerHeight - (value / 100) * innerHeight;

  // Get hovered data
  const hoveredData = hoveredDate
    ? chartData.find((d) => d.date === hoveredDate)
    : null;

  if (snapshots.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
        data-testid="position-history-empty"
      >
        <p>No position history data available</p>
      </div>
    );
  }

  return (
    <div className="position-history-chart" data-testid="position-history-chart">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Position History</h3>
        <div className="flex gap-2">
          {(['stacked', 'area', 'line'] as ChartMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-sm rounded ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full min-w-[600px]"
          onMouseLeave={() => setHoveredDate(null)}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={yScale(pct)}
                x2={chartWidth - padding.right}
                y2={yScale(pct)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={padding.left - 8}
                y={yScale(pct) + 4}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Stacked Area Chart */}
          {mode === 'stacked' && (
            <g>
              {/* Cash area at the bottom */}
              <path
                d={`
                  M ${xScale(0)} ${yScale(0)}
                  ${chartData
                    .map((d, i) => `L ${xScale(i)} ${yScale(d.cashWeight)}`)
                    .join(' ')}
                  L ${xScale(chartData.length - 1)} ${yScale(0)}
                  Z
                `}
                fill="#9ca3af"
                opacity="0.5"
              />

              {/* Stacked position areas */}
              {allSymbols.map((symbol, symbolIndex) => {
                let cumulativeBottom = chartData.map((d) => d.cashWeight);

                // Add previous symbols' weights
                for (let s = 0; s < symbolIndex; s++) {
                  const prevSymbol = allSymbols[s];
                  cumulativeBottom = cumulativeBottom.map(
                    (v, i) => v + (chartData[i].positions[prevSymbol] || 0)
                  );
                }

                const cumulativeTop = cumulativeBottom.map(
                  (v, i) => v + (chartData[i].positions[symbol] || 0)
                );

                const pathData = `
                  M ${xScale(0)} ${yScale(cumulativeBottom[0])}
                  ${cumulativeTop
                    .map((v, i) => `L ${xScale(i)} ${yScale(v)}`)
                    .join(' ')}
                  L ${xScale(chartData.length - 1)} ${yScale(cumulativeBottom[chartData.length - 1])}
                  ${cumulativeBottom
                    .map((v, i) => `L ${xScale(chartData.length - 1 - i)} ${yScale(cumulativeBottom[chartData.length - 1 - i])}`)
                    .reverse()
                    .join(' ')}
                  Z
                `;

                return (
                  <path
                    key={symbol}
                    d={pathData}
                    fill={symbolColors[symbol]}
                    opacity="0.7"
                  />
                );
              })}
            </g>
          )}

          {/* Line Chart */}
          {mode === 'line' &&
            allSymbols.map((symbol) => (
              <path
                key={symbol}
                d={chartData
                  .map((d, i) => {
                    const weight = d.positions[symbol] || 0;
                    return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(weight)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={symbolColors[symbol]}
                strokeWidth="2"
              />
            ))}

          {/* Area Chart */}
          {mode === 'area' &&
            allSymbols.map((symbol) => (
              <g key={symbol}>
                <path
                  d={`
                    M ${xScale(0)} ${yScale(0)}
                    ${chartData
                      .map((d, i) => {
                        const weight = d.positions[symbol] || 0;
                        return `L ${xScale(i)} ${yScale(weight)}`;
                      })
                      .join(' ')}
                    L ${xScale(chartData.length - 1)} ${yScale(0)}
                    Z
                  `}
                  fill={symbolColors[symbol]}
                  opacity="0.3"
                />
                <path
                  d={chartData
                    .map((d, i) => {
                      const weight = d.positions[symbol] || 0;
                      return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(weight)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={symbolColors[symbol]}
                  strokeWidth="2"
                />
              </g>
            ))}

          {/* Hover areas */}
          {chartData.map((d, i) => (
            <rect
              key={i}
              x={xScale(i) - innerWidth / chartData.length / 2}
              y={padding.top}
              width={innerWidth / chartData.length}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredDate(d.date)}
            />
          ))}

          {/* Hover line */}
          {hoveredDate && (
            <>
              {chartData.map((d, i) =>
                d.date === hoveredDate ? (
                  <line
                    key="hover"
                    x1={xScale(i)}
                    y1={padding.top}
                    x2={xScale(i)}
                    y2={height - padding.bottom}
                    stroke="#6b7280"
                    strokeDasharray="4"
                  />
                ) : null
              )}
            </>
          )}

          {/* X axis labels */}
          {chartData.length <= 12 &&
            chartData.map((d, i) => (
              <text
                key={i}
                x={xScale(i)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {d.date}
              </text>
            ))}

          {/* Legend */}
          <g transform={`translate(${chartWidth - padding.right + 10}, ${padding.top})`}>
            <rect
              x="0"
              y="-5"
              width="6"
              height="6"
              fill="#9ca3af"
            />
            <text x="12" y="0" className="text-xs fill-gray-600">
              Cash
            </text>

            {allSymbols.slice(0, 8).map((symbol, i) => (
              <g key={symbol} transform={`translate(0, ${(i + 1) * 16})`}>
                <rect
                  x="0"
                  y="-5"
                  width="6"
                  height="6"
                  fill={symbolColors[symbol]}
                />
                <text x="12" y="0" className="text-xs fill-gray-600">
                  {symbol}
                </text>
              </g>
            ))}

            {allSymbols.length > 8 && (
              <text
                x="0"
                y={(8 + 1) * 16}
                className="text-xs fill-gray-400"
              >
                +{allSymbols.length - 8} more
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* Hover tooltip */}
      {hoveredData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{hoveredDate}</span>
            <span className="text-gray-600">
              Total: ${hoveredData.totalValue.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#9ca3af' }}
              />
              <span className="text-sm">
                Cash: {hoveredData.cashWeight.toFixed(1)}%
              </span>
            </div>
            {allSymbols
              .filter((s) => hoveredData.positions[s] > 0)
              .slice(0, 7)
              .map((symbol) => (
                <div key={symbol} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: symbolColors[symbol] }}
                  />
                  <span className="text-sm">
                    {symbol}: {hoveredData.positions[symbol].toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionHistoryChart;
