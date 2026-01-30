/**
 * PerformanceChart Component
 *
 * Displays portfolio performance over time using Alpaca portfolio history data.
 */

import { useEffect, useRef } from 'react';
import { useAlpacaData } from '../../hooks/useAlpacaData';
import { formatCurrency } from '../../lib/utils';

export default function PerformanceChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { portfolioHistory, isLoading, isConnected } = useAlpacaData();

  useEffect(() => {
    if (!chartRef.current) return;

    // Show loading state
    if (isLoading) {
      chartRef.current.innerHTML = `
        <div class="loading-state">
          <div class="skeleton-chart"></div>
        </div>
        <style>
          .loading-state {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .skeleton-chart {
            width: 100%;
            height: 200px;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        </style>
      `;
      return;
    }

    // Show not connected state
    if (!isConnected) {
      chartRef.current.innerHTML = `
        <div class="empty-state">
          <p>Connect to Alpaca to see your performance</p>
          <a href="/dashboard/trading" class="connect-link">Connect Account</a>
        </div>
        <style>
          .empty-state {
            height: 250px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--text-muted);
          }
          .connect-link {
            margin-top: 0.5rem;
            color: var(--accent);
            text-decoration: none;
          }
          .connect-link:hover {
            text-decoration: underline;
          }
        </style>
      `;
      return;
    }

    // Show no data state
    if (portfolioHistory.length === 0) {
      chartRef.current.innerHTML = `
        <div class="empty-state">
          <p>No performance data yet. Start trading to see your portfolio growth.</p>
        </div>
        <style>
          .empty-state {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.875rem;
          }
        </style>
      `;
      return;
    }

    // Render the chart with real data
    const width = chartRef.current.offsetWidth;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };

    const data = portfolioHistory;
    const values = data.map((d) => d.equity);
    const minValue = Math.min(...values) * 0.995;
    const maxValue = Math.max(...values) * 1.005;

    const xScale = (i: number) =>
      padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
    const yScale = (v: number) =>
      height -
      padding.bottom -
      ((v - minValue) / (maxValue - minValue)) * (height - padding.top - padding.bottom);

    const pathD = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.equity)}`)
      .join(' ');

    const areaD = `${pathD} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    const lastValue = data[data.length - 1].equity;
    const firstValue = data[0].equity;
    const isPositive = lastValue >= firstValue;
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;

    chartRef.current.innerHTML = `
      <svg width="${width}" height="${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        ${[0, 0.25, 0.5, 0.75, 1]
          .map((ratio) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            const value = maxValue - ratio * (maxValue - minValue);
            return `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-dasharray="4"/>
            <text x="${padding.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">
              ${formatCurrency(value)}
            </text>
          `;
          })
          .join('')}

        <!-- Area fill -->
        <path d="${areaD}" fill="url(#areaGradient)"/>

        <!-- Line -->
        <path d="${pathD}" fill="none" stroke="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stroke-width="2"/>

        <!-- End point -->
        <circle cx="${xScale(data.length - 1)}" cy="${yScale(lastValue)}" r="4" fill="${isPositive ? 'var(--positive)' : 'var(--negative)'}"/>

        <!-- Current value label -->
        <text x="${width - padding.right}" y="${padding.top}" fill="var(--text-primary)" font-size="14" font-weight="600" text-anchor="end">
          ${formatCurrency(lastValue)}
        </text>
        <text x="${width - padding.right}" y="${padding.top + 18}" fill="${isPositive ? 'var(--positive)' : 'var(--negative)'}" font-size="12" font-weight="500" text-anchor="end">
          ${isPositive ? '+' : ''}${changePercent.toFixed(2)}%
        </text>
      </svg>
    `;
  }, [portfolioHistory, isLoading, isConnected]);

  return (
    <div className="performance-chart">
      <div ref={chartRef} className="chart-container"></div>

      <style>{`
        .performance-chart {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chart-container {
          flex: 1;
          min-height: 250px;
        }
      `}</style>
    </div>
  );
}
