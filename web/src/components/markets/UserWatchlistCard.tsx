/**
 * UserWatchlistCard Component
 *
 * Displays the user's personalized watchlist with real-time market data.
 */

import { Star, Trash2, Bell, ExternalLink, Plus } from 'lucide-react';
import type { WatchlistItem, MarketAsset } from '../../types/markets';
import { formatCurrency, formatPercent } from '../../lib/utils';

interface UserWatchlistCardProps {
  items: WatchlistItem[];
  marketData: Map<string, MarketAsset>;
  isLoading?: boolean;
  onRemove: (symbol: string) => void;
  onCreateAlert?: (symbol: string) => void;
  onViewDetails?: (symbol: string) => void;
  onAddNew?: () => void;
}

export default function UserWatchlistCard({
  items,
  marketData,
  isLoading = false,
  onRemove,
  onCreateAlert,
  onViewDetails,
  onAddNew,
}: UserWatchlistCardProps) {
  const getMarketInfo = (symbol: string) => {
    return marketData.get(symbol.toUpperCase());
  };

  return (
    <div className="user-watchlist-card">
      <div className="card-header">
        <div className="header-left">
          <Star className="header-icon" size={20} />
          <h3>My Watchlist</h3>
          <span className="count">{items.length}</span>
        </div>
        {onAddNew && (
          <button className="add-btn" onClick={onAddNew}>
            <Plus size={16} />
            Add
          </button>
        )}
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-state">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Star className="empty-icon" size={32} />
            <p className="empty-title">No items in watchlist</p>
            <p className="empty-description">
              Add assets from the market table to track them here
            </p>
          </div>
        ) : (
          <div className="watchlist-items">
            {items.map(item => {
              const market = getMarketInfo(item.symbol);
              const isPositive = (market?.change ?? 0) >= 0;

              return (
                <div key={item.id} className="watchlist-item">
                  <div
                    className="item-main"
                    onClick={() => onViewDetails?.(item.symbol)}
                  >
                    <div className="item-info">
                      <span className="symbol">{item.symbol}</span>
                      <span className="name">{item.name}</span>
                      {item.notes && (
                        <span className="notes">{item.notes}</span>
                      )}
                    </div>
                    <div className="item-price">
                      {market ? (
                        <>
                          <span className="price">
                            {formatCurrency(market.price)}
                          </span>
                          <span
                            className={`change ${isPositive ? 'positive' : 'negative'}`}
                          >
                            {formatPercent(market.changePercent)}
                          </span>
                        </>
                      ) : (
                        <span className="price-loading">--</span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    {onCreateAlert && (
                      <button
                        className="action-btn"
                        onClick={() => onCreateAlert(item.symbol)}
                        title="Create Alert"
                      >
                        <Bell size={14} />
                      </button>
                    )}
                    {onViewDetails && (
                      <button
                        className="action-btn"
                        onClick={() => onViewDetails(item.symbol)}
                        title="View Details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                    <button
                      className="action-btn remove"
                      onClick={() => onRemove(item.symbol)}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .user-watchlist-card {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          color: var(--accent);
          fill: var(--accent);
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .count {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          background-color: var(--bg-tertiary);
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.1);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-btn:hover {
          background: rgba(var(--accent-rgb), 0.2);
        }

        .card-content {
          padding: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .watchlist-items {
          display: flex;
          flex-direction: column;
        }

        .watchlist-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          transition: background-color 0.15s ease;
        }

        .watchlist-item:hover {
          background-color: var(--bg-tertiary);
        }

        .item-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          cursor: pointer;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .symbol {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .name {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notes {
          font-size: 0.6875rem;
          color: var(--text-muted);
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .item-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .price {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .price-loading {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .change {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .change.positive {
          color: var(--positive);
        }

        .change.negative {
          color: var(--negative);
        }

        .item-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .watchlist-item:hover .item-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 0.375rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .action-btn.remove:hover {
          color: var(--negative);
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          opacity: 0.5;
        }

        .empty-title {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .empty-description {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .loading-state {
          padding: 0.5rem;
        }

        .skeleton-row {
          height: 56px;
          background: linear-gradient(
            90deg,
            var(--bg-tertiary) 25%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }

        .skeleton-row:last-child {
          margin-bottom: 0;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 480px) {
          .item-actions {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
