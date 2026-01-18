/**
 * BacktestHistory Component
 *
 * Displays a list of past backtests with filtering, sorting, and actions.
 */

import { useState, useEffect, useCallback } from 'react';
import type { BacktestHistoryEntry } from '../../lib/services/backtest-history';
import type { BacktestResult } from '../../types/backtest';

interface BacktestHistoryProps {
  /** User ID for fetching history */
  userId: string;
  /** Callback when a backtest is selected for viewing */
  onViewResult?: (result: BacktestResult) => void;
  /** Callback when re-running a backtest config */
  onRerun?: (config: BacktestHistoryEntry['config']) => void;
  /** Callback when comparing two backtests */
  onCompare?: (id1: string, id2: string) => void;
  /** Mock entries for testing */
  mockEntries?: BacktestHistoryEntry[];
}

type SortField = 'createdAt' | 'name' | 'totalReturn' | 'sharpeRatio';
type FilterStatus = 'all' | 'completed' | 'failed';

export function BacktestHistory({
  userId,
  onViewResult,
  onRerun,
  onCompare,
  mockEntries,
}: BacktestHistoryProps) {
  const [entries, setEntries] = useState<BacktestHistoryEntry[]>(mockEntries || []);
  const [loading, setLoading] = useState(!mockEntries);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selection for comparison
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load entries (mock implementation - would use backtest-history service)
  useEffect(() => {
    if (mockEntries) {
      setEntries(mockEntries);
      setLoading(false);
      return;
    }

    const loadEntries = async () => {
      try {
        setLoading(true);
        // In production, this would call getBacktestHistory from the service
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setEntries(generateMockEntries());
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
        setLoading(false);
      }
    };

    loadEntries();
  }, [userId, mockEntries]);

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) => {
      // Status filter
      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }

      // Strategy filter
      if (strategyFilter !== 'all' && entry.config.strategy.type !== strategyFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.name.toLowerCase().includes(query) ||
          entry.config.strategy.name.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalReturn':
          comparison = (a.result?.metrics.totalReturn || 0) - (b.result?.metrics.totalReturn || 0);
          break;
        case 'sharpeRatio':
          comparison = (a.result?.metrics.sharpeRatio || 0) - (b.result?.metrics.sharpeRatio || 0);
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

  // Toggle selection for comparison
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle compare button click
  const handleCompare = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 2 && onCompare) {
      onCompare(ids[0], ids[1]);
    }
  }, [selectedIds, onCompare]);

  // Toggle favorite (mock)
  const handleToggleFavorite = useCallback(async (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
  }, []);

  // Delete entry (mock)
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this backtest?')) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // Get unique strategy types for filter
  const strategyTypes = [...new Set(entries.map((e) => e.config.strategy.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" data-testid="history-loading">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading backtest history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg" data-testid="history-error">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="backtest-history" data-testid="backtest-history">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Backtest History</h2>
        <div className="flex items-center gap-2">
          {selectedIds.size === 2 && onCompare && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              data-testid="compare-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Selected
            </button>
          )}
          {selectedIds.size > 0 && selectedIds.size < 2 && (
            <span className="text-sm text-gray-500">
              Select {2 - selectedIds.size} more to compare
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search backtests..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="history-search"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="status-filter"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        {/* Strategy Filter */}
        <select
          value={strategyFilter}
          onChange={(e) => setStrategyFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="strategy-filter"
        >
          <option value="all">All Strategies</option>
          {strategyTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${sortField}-${sortDirection}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split('-') as [SortField, 'asc' | 'desc'];
            setSortField(field);
            setSortDirection(dir);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="sort-select"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="totalReturn-desc">Best Return</option>
          <option value="totalReturn-asc">Worst Return</option>
          <option value="sharpeRatio-desc">Best Sharpe</option>
          <option value="sharpeRatio-asc">Worst Sharpe</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        Showing {filteredEntries.length} of {entries.length} backtests
      </div>

      {/* Entry List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-500" data-testid="history-empty">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">No backtests found</p>
          <p className="mt-1">Run your first backtest to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              isSelected={selectedIds.has(entry.id)}
              onToggleSelect={() => toggleSelection(entry.id)}
              onView={onViewResult && entry.result ? () => onViewResult(entry.result!) : undefined}
              onRerun={onRerun ? () => onRerun(entry.config) : undefined}
              onToggleFavorite={() => handleToggleFavorite(entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single history entry row
 */
interface HistoryEntryProps {
  entry: BacktestHistoryEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView?: () => void;
  onRerun?: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function HistoryEntry({
  entry,
  isSelected,
  onToggleSelect,
  onView,
  onRerun,
  onToggleFavorite,
  onDelete,
}: HistoryEntryProps) {
  const [showActions, setShowActions] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      data-testid={`history-entry-${entry.id}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox for comparison */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          data-testid={`select-${entry.id}`}
        />

        {/* Favorite star */}
        <button
          onClick={onToggleFavorite}
          className={`${
            entry.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
          }`}
          title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{entry.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[entry.status]}`}>
              {entry.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{entry.config.strategy.name}</span>
            <span>
              {new Date(entry.config.startDate).toLocaleDateString()} -{' '}
              {new Date(entry.config.endDate).toLocaleDateString()}
            </span>
            <span>
              Created {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Metrics */}
        {entry.result && (
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Return</div>
              <div
                className={`font-medium ${
                  entry.result.metrics.totalReturn >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {entry.result.metrics.totalReturn >= 0 ? '+' : ''}
                {entry.result.metrics.totalReturn.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Sharpe</div>
              <div
                className={`font-medium ${
                  entry.result.metrics.sharpeRatio >= 1
                    ? 'text-green-600'
                    : 'text-gray-900'
                }`}
              >
                {entry.result.metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Max DD</div>
              <div className="font-medium text-red-600">
                {entry.result.metrics.maxDrawdown.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex items-center gap-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {onView && (
            <button
              onClick={onView}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="View Results"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onRerun && (
            <button
              onClick={onRerun}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
              title="Re-run"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex gap-2 mt-3 ml-9">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Generate mock entries for testing
 */
function generateMockEntries(): BacktestHistoryEntry[] {
  const strategies = [
    { type: 'momentum', name: 'Momentum 12-1' },
    { type: 'mean_reversion', name: 'Mean Reversion 20-day' },
    { type: 'risk_parity', name: 'Risk Parity' },
    { type: 'smart_beta', name: 'Quality Factor' },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const strategy = strategies[i % strategies.length];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - i * 3);

    return {
      id: `bt_${i}`,
      userId: 'user123',
      name: `${strategy.name} Backtest ${i + 1}`,
      config: {
        name: `${strategy.name} Backtest ${i + 1}`,
        strategy: {
          type: strategy.type as any,
          name: strategy.name,
        } as any,
        universe: 'sp500' as const,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2024-01-01'),
        initialCapital: 100000,
        benchmark: 'SPY' as const,
      },
      result: i % 5 !== 0 ? {
        id: `bt_${i}`,
        config: {} as any,
        executedAt: createdAt,
        executionDuration: 3000 + Math.random() * 5000,
        success: true,
        metrics: {
          totalReturn: (Math.random() - 0.3) * 100,
          cagr: (Math.random() - 0.2) * 25,
          volatility: 15 + Math.random() * 10,
          sharpeRatio: 0.5 + Math.random() * 1.5,
          sortinoRatio: 0.6 + Math.random() * 1.8,
          maxDrawdown: -(5 + Math.random() * 25),
          maxDrawdownDuration: Math.floor(20 + Math.random() * 100),
          winRate: 45 + Math.random() * 15,
          profitFactor: 1 + Math.random() * 0.8,
          avgWin: 2 + Math.random() * 3,
          avgLoss: -(1 + Math.random() * 2),
          totalTrades: 50 + Math.floor(Math.random() * 100),
          calmarRatio: 0.3 + Math.random() * 0.7,
        },
        equityCurve: [],
        drawdownCurve: [],
        monthlyReturns: [],
        trades: [],
        portfolioSnapshots: [],
        topDrawdowns: [],
      } : undefined,
      status: i % 5 === 0 ? 'failed' : 'completed',
      createdAt,
      completedAt: i % 5 !== 0 ? createdAt : undefined,
      isFavorite: i === 1 || i === 3,
      tags: i % 3 === 0 ? ['experiment', 'high-frequency'] : [],
    };
  });
}

export default BacktestHistory;
