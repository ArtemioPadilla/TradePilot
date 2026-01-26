/**
 * LowestPerformersCard Component
 *
 * Displays lowest performing assets (potential opportunities) by period.
 */

import { TrendingDown, Plus, Star, Target } from 'lucide-react';
import type { MarketAsset, PerformancePeriod } from '../../types/markets';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { PERIOD_LABELS } from '../../stores/markets';

interface LowestPerformersCardProps {
  assets: MarketAsset[];
  period: PerformancePeriod;
  onPeriodChange?: (period: PerformancePeriod) => void;
  onAssetClick?: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string, name: string) => void;
  watchlistSymbols?: string[];
  isLoading?: boolean;
}

export default function LowestPerformersCard({
  assets,
  period,
  onPeriodChange,
  onAssetClick,
  onAddToWatchlist,
  watchlistSymbols = [],
  isLoading = false,
}: LowestPerformersCardProps) {
  const watchlistSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));

  const getChangeByPeriod = (asset: MarketAsset): number => {
    switch (period) {
      case 'week':
        return asset.weekChangePercent ?? asset.changePercent;
      case 'month':
        return asset.monthChangePercent ?? asset.changePercent;
      default:
        return asset.changePercent;
    }
  };

  return (
    <div className="performers-card lowest-performers">
      <div className="card-header">
        <div className="header-left">
          <Target className="header-icon opportunity" size={20} />
          <div className="header-text">
            <h3>Potential Opportunities</h3>
            <span className="subtitle">Oversold assets</span>
          </div>
        </div>
        {onPeriodChange && (
          <div className="period-selector">
            {(['day', 'week', 'month'] as PerformancePeriod[]).map(p => (
              <button
                key={p}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => onPeriodChange(p)}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-state">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <p>No data available</p>
          </div>
        ) : (
          <div className="performers-list">
            {assets.map((asset, index) => {
              const change = getChangeByPeriod(asset);
              const isInWatchlist = watchlistSet.has(asset.symbol.toUpperCase());

              return (
                <div
                  key={asset.symbol}
                  className="performer-item"
                  onClick={() => onAssetClick?.(asset.symbol)}
                >
                  <div className="trend-indicator">
                    <TrendingDown size={16} className="negative" />
                  </div>
                  <div className="asset-info">
                    <span className="symbol">{asset.symbol}</span>
                    <span className="name">{asset.name}</span>
                  </div>
                  <div className="price-info">
                    <span className="price">{formatCurrency(asset.price)}</span>
                    <span className="change negative">
                      {formatPercent(change)}
                    </span>
                  </div>
                  <div className="actions">
                    {isInWatchlist ? (
                      <Star className="watchlist-icon filled" size={16} />
                    ) : (
                      <button
                        className="add-btn"
                        onClick={e => {
                          e.stopPropagation();
                          onAddToWatchlist?.(asset.symbol, asset.name);
                        }}
                        title="Add to Watchlist"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-footer">
        <p className="disclaimer">
          Past performance does not guarantee future results. Always do your own research.
        </p>
      </div>

      <style>{`
        .performers-card.lowest-performers {
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
          padding: 0.375rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .header-icon.opportunity {
          color: #f59e0b;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .period-selector {
          display: flex;
          gap: 0.25rem;
          background-color: var(--bg-tertiary);
          padding: 0.25rem;
          border-radius: var(--radius-md);
        }

        .period-btn {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .period-btn:hover {
          color: var(--text-primary);
        }

        .period-btn.active {
          background-color: var(--accent);
          color: white;
        }

        .card-content {
          padding: 0.5rem;
        }

        .performers-list {
          display: flex;
          flex-direction: column;
        }

        .performer-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .performer-item:hover {
          background-color: var(--bg-tertiary);
        }

        .trend-indicator {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-md);
        }

        .trend-indicator .negative {
          color: var(--negative);
        }

        .asset-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .symbol {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .name {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .price-info {
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

        .actions {
          display: flex;
          align-items: center;
        }

        .add-btn {
          padding: 0.375rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .add-btn:hover {
          background-color: var(--bg-primary);
          color: var(--accent);
        }

        .watchlist-icon {
          color: var(--accent);
        }

        .watchlist-icon.filled {
          fill: var(--accent);
        }

        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border);
          background-color: var(--bg-tertiary);
        }

        .disclaimer {
          margin: 0;
          font-size: 0.6875rem;
          color: var(--text-muted);
          font-style: italic;
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

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
        }

        @media (max-width: 480px) {
          .card-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }

          .period-selector {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
