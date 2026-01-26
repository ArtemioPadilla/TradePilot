/**
 * AssetTable Component
 *
 * Reusable table for displaying market assets with sorting and actions.
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Plus,
  Bell,
  LineChart,
  Star,
  StarOff,
} from 'lucide-react';
import type { MarketAsset, AssetSortConfig, AssetSortField } from '../../types/markets';
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils';

interface AssetTableProps {
  assets: MarketAsset[];
  sortConfig?: AssetSortConfig;
  onSort?: (field: AssetSortField) => void;
  showActions?: boolean;
  watchlistSymbols?: string[];
  ownedSymbols?: string[];
  onAddToWatchlist?: (symbol: string, name: string) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  onCreateAlert?: (symbol: string) => void;
  onViewChart?: (symbol: string) => void;
  onRowClick?: (symbol: string) => void;
  compact?: boolean;
  showVolume?: boolean;
  emptyMessage?: string;
}

export default function AssetTable({
  assets,
  sortConfig,
  onSort,
  showActions = true,
  watchlistSymbols = [],
  ownedSymbols = [],
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onCreateAlert,
  onViewChart,
  onRowClick,
  compact = false,
  showVolume = false,
  emptyMessage = 'No assets found',
}: AssetTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const watchlistSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));
  const ownedSet = new Set(ownedSymbols.map(s => s.toUpperCase()));

  const handleSort = (field: AssetSortField) => {
    if (onSort) {
      onSort(field);
    }
  };

  const renderSortIcon = (field: AssetSortField) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ChevronDown className="sort-icon inactive" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="sort-icon active" />
    ) : (
      <ChevronDown className="sort-icon active" />
    );
  };

  const toggleMenu = (symbol: string) => {
    setActiveMenu(activeMenu === symbol ? null : symbol);
  };

  const handleAction = (
    action: () => void,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    action();
    setActiveMenu(null);
  };

  if (assets.length === 0) {
    return (
      <div className="asset-table-empty">
        <p>{emptyMessage}</p>
        <style>{`
          .asset-table-empty {
            padding: 3rem;
            text-align: center;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="asset-table-container">
      <table className={`asset-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            <th
              className={onSort ? 'sortable' : ''}
              onClick={() => handleSort('symbol')}
            >
              Symbol {onSort && renderSortIcon('symbol')}
            </th>
            <th
              className={onSort ? 'sortable' : ''}
              onClick={() => handleSort('name')}
            >
              Name {onSort && renderSortIcon('name')}
            </th>
            <th
              className={`align-right ${onSort ? 'sortable' : ''}`}
              onClick={() => handleSort('price')}
            >
              Price {onSort && renderSortIcon('price')}
            </th>
            <th
              className={`align-right ${onSort ? 'sortable' : ''}`}
              onClick={() => handleSort('change')}
            >
              Change {onSort && renderSortIcon('change')}
            </th>
            <th
              className={`align-right ${onSort ? 'sortable' : ''}`}
              onClick={() => handleSort('changePercent')}
            >
              % Change {onSort && renderSortIcon('changePercent')}
            </th>
            {showVolume && (
              <th
                className={`align-right ${onSort ? 'sortable' : ''}`}
                onClick={() => handleSort('volume')}
              >
                Volume {onSort && renderSortIcon('volume')}
              </th>
            )}
            {showActions && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => {
            const isPositive = asset.change >= 0;
            const isInWatchlist = watchlistSet.has(asset.symbol.toUpperCase());
            const isOwned = ownedSet.has(asset.symbol.toUpperCase());

            return (
              <tr
                key={asset.symbol}
                className={`
                  ${onRowClick ? 'clickable' : ''}
                  ${isOwned ? 'owned' : ''}
                  ${isInWatchlist ? 'in-watchlist' : ''}
                `}
                onClick={() => onRowClick?.(asset.symbol)}
              >
                <td className="symbol-cell">
                  <span className="symbol">{asset.symbol}</span>
                  {isOwned && <span className="badge owned-badge">Owned</span>}
                  {isInWatchlist && !isOwned && (
                    <Star className="watchlist-indicator" size={12} />
                  )}
                </td>
                <td className="name-cell">{asset.name}</td>
                <td className="price-cell align-right">
                  {formatCurrency(asset.price)}
                </td>
                <td className={`change-cell align-right ${isPositive ? 'positive' : 'negative'}`}>
                  <span className="change-indicator">
                    {isPositive ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {isPositive ? '+' : ''}
                    {asset.change.toFixed(2)}
                  </span>
                </td>
                <td className={`percent-cell align-right ${isPositive ? 'positive' : 'negative'}`}>
                  {formatPercent(asset.changePercent)}
                </td>
                {showVolume && (
                  <td className="volume-cell align-right">
                    {asset.volume ? formatNumber(asset.volume) : '-'}
                  </td>
                )}
                {showActions && (
                  <td className="actions-cell" onClick={e => e.stopPropagation()}>
                    <div className="action-menu-container">
                      <button
                        className="action-menu-trigger"
                        onClick={() => toggleMenu(asset.symbol)}
                        aria-label="Asset actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === asset.symbol && (
                        <div className="action-menu">
                          {isInWatchlist ? (
                            <button
                              className="action-item"
                              onClick={e =>
                                handleAction(
                                  () => onRemoveFromWatchlist?.(asset.symbol),
                                  e
                                )
                              }
                            >
                              <StarOff size={14} />
                              Remove from Watchlist
                            </button>
                          ) : (
                            <button
                              className="action-item"
                              onClick={e =>
                                handleAction(
                                  () => onAddToWatchlist?.(asset.symbol, asset.name),
                                  e
                                )
                              }
                            >
                              <Plus size={14} />
                              Add to Watchlist
                            </button>
                          )}
                          <button
                            className="action-item"
                            onClick={e =>
                              handleAction(() => onCreateAlert?.(asset.symbol), e)
                            }
                          >
                            <Bell size={14} />
                            Create Alert
                          </button>
                          <button
                            className="action-item"
                            onClick={e =>
                              handleAction(() => onViewChart?.(asset.symbol), e)
                            }
                          >
                            <LineChart size={14} />
                            View Chart
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .asset-table-container {
          overflow-x: auto;
        }

        .asset-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .asset-table.compact {
          font-size: 0.8125rem;
        }

        .asset-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
          user-select: none;
        }

        .asset-table.compact th {
          padding: 0.5rem 0.75rem;
        }

        .asset-table th.sortable {
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .asset-table th.sortable:hover {
          color: var(--text-primary);
        }

        .asset-table th .sort-icon {
          display: inline-block;
          vertical-align: middle;
          margin-left: 0.25rem;
          width: 14px;
          height: 14px;
          opacity: 0.3;
        }

        .asset-table th .sort-icon.active {
          opacity: 1;
          color: var(--accent);
        }

        .asset-table td {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
        }

        .asset-table.compact td {
          padding: 0.625rem 0.75rem;
        }

        .asset-table tr.clickable {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .asset-table tr.clickable:hover {
          background-color: var(--bg-tertiary);
        }

        .asset-table tr.owned {
          background-color: rgba(var(--accent-rgb), 0.05);
        }

        .asset-table tr.in-watchlist .symbol-cell {
          position: relative;
        }

        .align-right {
          text-align: right;
        }

        .symbol-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .symbol {
          font-weight: 600;
          color: var(--accent);
        }

        .badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .owned-badge {
          background-color: rgba(var(--accent-rgb), 0.2);
          color: var(--accent);
        }

        .watchlist-indicator {
          color: var(--accent);
          fill: var(--accent);
        }

        .name-cell {
          color: var(--text-muted);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .price-cell {
          font-weight: 500;
          font-family: var(--font-mono);
        }

        .change-cell,
        .percent-cell {
          font-family: var(--font-mono);
          font-weight: 500;
        }

        .change-cell.positive,
        .percent-cell.positive {
          color: var(--positive);
        }

        .change-cell.negative,
        .percent-cell.negative {
          color: var(--negative);
        }

        .change-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .volume-cell {
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .actions-col {
          width: 60px;
          text-align: center;
        }

        .actions-cell {
          text-align: center;
        }

        .action-menu-container {
          position: relative;
          display: inline-block;
        }

        .action-menu-trigger {
          background: none;
          border: none;
          padding: 0.375rem;
          cursor: pointer;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .action-menu-trigger:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .action-menu {
          position: absolute;
          right: 0;
          top: 100%;
          z-index: 100;
          min-width: 180px;
          background-color: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 0.375rem;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: none;
          border: none;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
          text-align: left;
        }

        .action-item:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .asset-table th,
          .asset-table td {
            padding: 0.625rem 0.5rem;
          }

          .name-cell {
            max-width: 120px;
          }

          .volume-cell {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
