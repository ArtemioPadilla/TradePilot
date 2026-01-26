/**
 * BacktestResults Component
 *
 * Displays comprehensive backtest results including:
 * - Equity curve chart
 * - Performance metrics
 * - Monthly returns heatmap
 * - Trade log
 * - Drawdown analysis
 */

import { useState, useMemo } from 'react';
import type {
  BacktestResult,
  PerformanceMetrics,
  MonthlyReturns,
  TradeRecord,
  DrawdownPeriod,
} from '../../types/backtest';

interface BacktestResultsProps {
  /** The backtest result to display */
  result: BacktestResult;
  /** Callback when user wants to run another backtest */
  onRunAnother?: () => void;
  /** Callback to save the result */
  onSave?: (result: BacktestResult) => void;
}

type Tab = 'overview' | 'equity' | 'monthly' | 'trades' | 'drawdowns';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'equity', label: 'Equity Curve' },
  { id: 'monthly', label: 'Monthly Returns' },
  { id: 'trades', label: 'Trade Log' },
  { id: 'drawdowns', label: 'Drawdowns' },
];

export function BacktestResults({
  result,
  onRunAnother,
  onSave,
}: BacktestResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" data-testid="backtest-error">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-red-800">Backtest Failed</h3>
            <p className="text-red-600 mt-1">{result.error || 'An unknown error occurred'}</p>
          </div>
        </div>
        {onRunAnother && (
          <button
            onClick={onRunAnother}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="backtest-results" data-testid="backtest-results">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{result.config.name}</h2>
          <p className="text-gray-500 mt-1">
            {result.config.strategy.name} | {' '}
            {new Date(result.config.startDate).toLocaleDateString()} - {' '}
            {new Date(result.config.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={() => onSave(result)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>
          )}
          {onRunAnother && (
            <button
              onClick={onRunAnother}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Another
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <OverviewTab result={result} />
        )}
        {activeTab === 'equity' && (
          <EquityCurveTab result={result} />
        )}
        {activeTab === 'monthly' && (
          <MonthlyReturnsTab returns={result.monthlyReturns} />
        )}
        {activeTab === 'trades' && (
          <TradeLogTab trades={result.trades} />
        )}
        {activeTab === 'drawdowns' && (
          <DrawdownsTab drawdowns={result.topDrawdowns} drawdownCurve={result.drawdownCurve} />
        )}
      </div>
    </div>
  );
}

// Helper functions for safe number formatting
function formatPercent(value: number | undefined | null, decimals = 2, showPlus = false): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  const prefix = showPlus && value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
}

function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

function formatInt(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return value.toString();
}

/**
 * Overview Tab - Key metrics and summary
 */
function OverviewTab({ result }: { result: BacktestResult }) {
  const { metrics, benchmarkMetrics } = result;

  // Guard against missing metrics
  if (!metrics) {
    return (
      <div data-testid="overview-tab" className="text-center py-8 text-gray-500">
        No metrics available for this backtest.
      </div>
    );
  }

  return (
    <div data-testid="overview-tab" className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Return"
          value={formatPercent(metrics.totalReturn, 2, true)}
          benchmark={benchmarkMetrics?.totalReturn}
          positive={(metrics.totalReturn ?? 0) >= 0}
        />
        <MetricCard
          label="CAGR"
          value={formatPercent(metrics.cagr, 2, true)}
          benchmark={benchmarkMetrics?.cagr}
          positive={(metrics.cagr ?? 0) >= 0}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={formatNumber(metrics.sharpeRatio)}
          benchmark={benchmarkMetrics?.sharpeRatio}
          positive={(metrics.sharpeRatio ?? 0) >= 1}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatPercent(metrics.maxDrawdown)}
          benchmark={benchmarkMetrics?.maxDrawdown}
          positive={false}
          invert
        />
      </div>

      {/* Detailed Metrics Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Return Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Return Metrics</h3>
          <dl className="space-y-3">
            <MetricRow label="Total Return" value={formatPercent(metrics.totalReturn)} />
            <MetricRow label="CAGR" value={formatPercent(metrics.cagr)} />
            <MetricRow label="Volatility (Ann.)" value={formatPercent(metrics.volatility)} />
            {metrics.alpha !== undefined && (
              <MetricRow label="Alpha" value={formatPercent(metrics.alpha)} />
            )}
            {metrics.beta !== undefined && (
              <MetricRow label="Beta" value={formatNumber(metrics.beta)} />
            )}
          </dl>
        </div>

        {/* Risk Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Risk Metrics</h3>
          <dl className="space-y-3">
            <MetricRow label="Sharpe Ratio" value={formatNumber(metrics.sharpeRatio)} />
            <MetricRow label="Sortino Ratio" value={formatNumber(metrics.sortinoRatio)} />
            <MetricRow label="Calmar Ratio" value={formatNumber(metrics.calmarRatio)} />
            <MetricRow label="Max Drawdown" value={formatPercent(metrics.maxDrawdown)} />
            <MetricRow label="Max DD Duration" value={`${formatInt(metrics.maxDrawdownDuration)} days`} />
            {metrics.informationRatio !== undefined && (
              <MetricRow label="Information Ratio" value={formatNumber(metrics.informationRatio)} />
            )}
          </dl>
        </div>

        {/* Trade Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Trade Metrics</h3>
          <dl className="space-y-3">
            <MetricRow label="Total Trades" value={formatInt(metrics.totalTrades)} />
            <MetricRow label="Win Rate" value={formatPercent(metrics.winRate, 1)} />
            <MetricRow label="Profit Factor" value={formatNumber(metrics.profitFactor)} />
            <MetricRow label="Avg Win" value={formatPercent(metrics.avgWin)} />
            <MetricRow label="Avg Loss" value={formatPercent(metrics.avgLoss)} />
          </dl>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Configuration</h3>
          <dl className="space-y-3">
            <MetricRow label="Strategy" value={result.config.strategy.name} />
            <MetricRow label="Initial Capital" value={`$${result.config.initialCapital.toLocaleString()}`} />
            <MetricRow label="Benchmark" value={result.config.benchmark} />
            <MetricRow
              label="Transaction Costs"
              value={result.config.includeTransactionCosts ? `${((result.config.transactionCost || 0) * 100).toFixed(2)}%` : 'None'}
            />
            <MetricRow
              label="Execution Time"
              value={`${(result.executionDuration / 1000).toFixed(1)}s`}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: string;
  benchmark?: number;
  positive: boolean;
  invert?: boolean;
}

function MetricCard({ label, value, benchmark, positive, invert = false }: MetricCardProps) {
  const colorClass = invert
    ? positive ? 'text-red-600' : 'text-green-600'
    : positive ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</dd>
      {benchmark !== undefined && (
        <dd className="text-sm text-gray-400 mt-1">
          vs benchmark: {benchmark.toFixed(2)}%
        </dd>
      )}
    </div>
  );
}

/**
 * Metric Row Component
 */
function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/**
 * Equity Curve Tab
 */
function EquityCurveTab({ result }: { result: BacktestResult }) {
  const { equityCurve, drawdownCurve } = result;

  // Calculate chart data bounds
  const maxValue = useMemo(() => {
    return Math.max(...equityCurve.map(p => Math.max(p.value, p.benchmark || 0)));
  }, [equityCurve]);

  const minValue = useMemo(() => {
    return Math.min(...equityCurve.map(p => Math.min(p.value, p.benchmark || Infinity)));
  }, [equityCurve]);

  const minDrawdown = useMemo(() => {
    return Math.min(...drawdownCurve.map(p => p.drawdown));
  }, [drawdownCurve]);

  // Simple SVG chart
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 40;

  const xScale = (index: number) =>
    padding + (index / (equityCurve.length - 1)) * (chartWidth - padding * 2);

  const yScale = (value: number) =>
    chartHeight - padding - ((value - minValue) / (maxValue - minValue)) * (chartHeight - padding * 2);

  const drawdownYScale = (value: number) =>
    padding + (Math.abs(value) / Math.abs(minDrawdown)) * (100 - padding);

  // Generate path data
  const strategyPath = equityCurve
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.value)}`)
    .join(' ');

  const benchmarkPath = equityCurve[0]?.benchmark !== undefined
    ? equityCurve
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.benchmark!)}`)
        .join(' ')
    : '';

  const drawdownPath = drawdownCurve
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${drawdownYScale(point.drawdown)}`)
    .join(' ');

  return (
    <div data-testid="equity-tab" className="space-y-6">
      {/* Equity Curve Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Equity Curve</h3>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[600px]">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding + pct * (chartHeight - padding * 2);
              return (
                <g key={pct}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="4"
                  />
                  <text x={padding - 5} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">
                    ${Math.round(maxValue - pct * (maxValue - minValue)).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Benchmark line */}
            {benchmarkPath && (
              <path
                d={benchmarkPath}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="4"
              />
            )}

            {/* Strategy line */}
            <path
              d={strategyPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {/* Legend */}
            <g transform={`translate(${chartWidth - 150}, ${padding})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke="#2563eb" strokeWidth="2" />
              <text x="25" y="4" className="text-xs fill-gray-600">Strategy</text>
              {benchmarkPath && (
                <>
                  <line x1="0" y1="20" x2="20" y2="20" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4" />
                  <text x="25" y="24" className="text-xs fill-gray-600">Benchmark</text>
                </>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Drawdown Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Drawdown</h3>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} 150`} className="w-full min-w-[600px]">
            {/* Zero line */}
            <line
              x1={padding}
              y1={padding}
              x2={chartWidth - padding}
              y2={padding}
              stroke="#e5e7eb"
            />

            {/* Drawdown area */}
            <path
              d={`${drawdownPath} L ${xScale(drawdownCurve.length - 1)} ${padding} L ${xScale(0)} ${padding} Z`}
              fill="rgba(239, 68, 68, 0.2)"
              stroke="none"
            />

            {/* Drawdown line */}
            <path
              d={drawdownPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
            />

            {/* Y-axis labels */}
            <text x={padding - 5} y={padding + 4} textAnchor="end" className="text-xs fill-gray-400">0%</text>
            <text x={padding - 5} y={100 + 4} textAnchor="end" className="text-xs fill-gray-400">
              {minDrawdown.toFixed(0)}%
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Monthly Returns Tab
 */
function MonthlyReturnsTab({ returns }: { returns: MonthlyReturns[] }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getColorClass = (value: number | null) => {
    if (value === null) return 'bg-gray-100';
    if (value >= 5) return 'bg-green-600 text-white';
    if (value >= 2) return 'bg-green-400 text-white';
    if (value > 0) return 'bg-green-200';
    if (value === 0) return 'bg-gray-100';
    if (value > -2) return 'bg-red-200';
    if (value > -5) return 'bg-red-400 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div data-testid="monthly-tab" className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-gray-500">Year</th>
            {months.map((month) => (
              <th key={month} className="p-2 text-center text-sm font-medium text-gray-500">
                {month}
              </th>
            ))}
            <th className="p-2 text-center text-sm font-medium text-gray-500">Year</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((row) => (
            <tr key={row.year}>
              <td className="p-2 font-medium">{row.year}</td>
              {row.months.map((value, i) => (
                <td key={i} className="p-1">
                  <div
                    className={`p-2 text-center text-sm rounded ${getColorClass(value)}`}
                    title={value !== null ? `${value.toFixed(2)}%` : 'N/A'}
                  >
                    {value !== null ? `${value.toFixed(1)}%` : '-'}
                  </div>
                </td>
              ))}
              <td className="p-1">
                <div
                  className={`p-2 text-center text-sm font-medium rounded ${getColorClass(row.yearTotal)}`}
                >
                  {row.yearTotal.toFixed(1)}%
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-center">
        <span className="text-sm text-gray-500">Returns:</span>
        <div className="flex gap-1">
          <span className="w-8 h-6 bg-red-600 rounded" title="< -5%"></span>
          <span className="w-8 h-6 bg-red-400 rounded" title="-5% to -2%"></span>
          <span className="w-8 h-6 bg-red-200 rounded" title="-2% to 0%"></span>
          <span className="w-8 h-6 bg-gray-100 rounded" title="0%"></span>
          <span className="w-8 h-6 bg-green-200 rounded" title="0% to 2%"></span>
          <span className="w-8 h-6 bg-green-400 rounded" title="2% to 5%"></span>
          <span className="w-8 h-6 bg-green-600 rounded" title="> 5%"></span>
        </div>
      </div>
    </div>
  );
}

/**
 * Trade Log Tab
 */
function TradeLogTab({ trades }: { trades: TradeRecord[] }) {
  const [page, setPage] = useState(1);
  const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const pageSize = 20;

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => sideFilter === 'all' || t.side === sideFilter);
  }, [trades, sideFilter]);

  const paginatedTrades = filteredTrades.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredTrades.length / pageSize);

  return (
    <div data-testid="trades-tab" className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Filter by side:</span>
        <div className="flex gap-2">
          {(['all', 'buy', 'sell'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => { setSideFilter(filter); setPage(1); }}
              className={`px-3 py-1 text-sm rounded-full ${
                sideFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">
          {filteredTrades.length} trades
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Symbol</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Side</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Value</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Commission</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map((trade, i) => (
              <tr
                key={`${trade.date}-${trade.symbol}-${i}`}
                className="border-b hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-sm">
                  {new Date(trade.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{trade.symbol}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      trade.side === 'buy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">{trade.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  ${trade.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ${trade.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500">
                  {trade.commission ? `$${trade.commission.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Drawdowns Tab
 */
function DrawdownsTab({
  drawdowns,
  drawdownCurve,
}: {
  drawdowns: DrawdownPeriod[];
  drawdownCurve: { date: Date; drawdown: number }[];
}) {
  return (
    <div data-testid="drawdowns-tab" className="space-y-6">
      {/* Top Drawdowns Table */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Top Drawdown Periods</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Start</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">End</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Recovery</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Depth</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Duration</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Recovery Time</th>
              </tr>
            </thead>
            <tbody>
              {drawdowns.slice(0, 10).map((dd, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{i + 1}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(dd.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(dd.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {dd.recoveryDate
                      ? new Date(dd.recoveryDate).toLocaleDateString()
                      : <span className="text-yellow-600">Ongoing</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                    {dd.depth.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {dd.duration} days
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {dd.recoveryDuration ? `${dd.recoveryDuration} days` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawdown Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dt className="text-sm text-gray-500">Max Drawdown</dt>
          <dd className="text-xl font-bold text-red-600">
            {drawdowns[0]?.depth.toFixed(2) || 0}%
          </dd>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dt className="text-sm text-gray-500">Avg Drawdown</dt>
          <dd className="text-xl font-bold text-gray-900">
            {(drawdowns.reduce((sum, d) => sum + d.depth, 0) / drawdowns.length || 0).toFixed(2)}%
          </dd>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dt className="text-sm text-gray-500">Max Duration</dt>
          <dd className="text-xl font-bold text-gray-900">
            {Math.max(...drawdowns.map(d => d.duration), 0)} days
          </dd>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dt className="text-sm text-gray-500">Avg Recovery</dt>
          <dd className="text-xl font-bold text-gray-900">
            {(drawdowns.filter(d => d.recoveryDuration).reduce((sum, d) => sum + (d.recoveryDuration || 0), 0) /
              drawdowns.filter(d => d.recoveryDuration).length || 0).toFixed(0)} days
          </dd>
        </div>
      </div>
    </div>
  );
}

export default BacktestResults;
