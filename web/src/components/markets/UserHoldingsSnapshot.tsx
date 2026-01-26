/**
 * UserHoldingsSnapshot Component
 *
 * Quick view of user's portfolio performance today.
 */

import { Briefcase, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import type { HoldingSnapshotItem } from '../../types/markets';
import { formatCurrency, formatPercent } from '../../lib/utils';

interface UserHoldingsSnapshotProps {
  holdings: HoldingSnapshotItem[];
  totalValue?: number;
  totalDayChange?: number;
  totalDayChangePercent?: number;
  isLoading?: boolean;
  onViewAll?: () => void;
  onAssetClick?: (symbol: string) => void;
}

export default function UserHoldingsSnapshot({
  holdings,
  totalValue = 0,
  totalDayChange = 0,
  totalDayChangePercent = 0,
  isLoading = false,
  onViewAll,
  onAssetClick,
}: UserHoldingsSnapshotProps) {
  const isPositiveTotal = totalDayChange >= 0;

  return (
    <div className="holdings-snapshot">
      <div className="card-header">
        <div className="header-left">
          <Briefcase className="header-icon" size={20} />
          <h3>My Holdings</h3>
        </div>
        {onViewAll && (
          <button className="view-all-btn" onClick={onViewAll}>
            View All
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card-content">
          <div className="loading-state">
            <div className="skeleton-summary" />
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        </div>
      ) : holdings.length === 0 ? (
        <div className="card-content">
          <div className="empty-state">
            <Briefcase className="empty-icon" size={32} />
            <p className="empty-title">No holdings yet</p>
            <p className="empty-description">
              Connect your brokerage or add holdings manually
            </p>
            <a href="/dashboard/accounts" className="action-link">
              Add Holdings
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="portfolio-summary">
            <div className="summary-main">
              <span className="summary-label">Portfolio Value</span>
              <span className="summary-value">{formatCurrency(totalValue)}</span>
            </div>
            <div className={`summary-change ${isPositiveTotal ? 'positive' : 'negative'}`}>
              <span className="change-icon">
                {isPositiveTotal ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </span>
              <span className="change-amount">
                {isPositiveTotal ? '+' : ''}
                {formatCurrency(totalDayChange)}
              </span>
              <span className="change-percent">
                ({formatPercent(totalDayChangePercent)})
              </span>
              <span className="change-period">Today</span>
            </div>
          </div>

          <div className="card-content">
            <div className="holdings-list">
              {holdings.slice(0, 5).map(holding => {
                const isPositive = holding.dayChange >= 0;

                return (
                  <div
                    key={holding.symbol}
                    className="holding-item"
                    onClick={() => onAssetClick?.(holding.symbol)}
                  >
                    <div className="holding-info">
                      <div className="holding-main">
                        <span className="symbol">{holding.symbol}</span>
                        <span className="quantity">{holding.quantity} shares</span>
                      </div>
                      <span className="name">{holding.name}</span>
                    </div>

                    <div className="holding-value">
                      <span className="value">{formatCurrency(holding.currentValue)}</span>
                      <div className={`day-change ${isPositive ? 'positive' : 'negative'}`}>
                        <span>
                          {isPositive ? '+' : ''}
                          {formatCurrency(holding.dayChange)}
                        </span>
                        <span>({formatPercent(holding.dayChangePercent)})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {holdings.length > 5 && (
              <div className="more-holdings">
                +{holdings.length - 5} more holdings
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .holdings-snapshot {
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
          color: #f59e0b;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
        }

        .view-all-btn:hover {
          background-color: rgba(var(--accent-rgb), 0.1);
        }

        .portfolio-summary {
          padding: 1.25rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
        }

        .summary-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .summary-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .summary-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .summary-change.positive {
          color: var(--positive);
        }

        .summary-change.negative {
          color: var(--negative);
        }

        .change-icon {
          display: flex;
          align-items: center;
        }

        .change-amount {
          font-family: var(--font-mono);
        }

        .change-percent {
          font-family: var(--font-mono);
        }

        .change-period {
          color: var(--text-muted);
          font-weight: 400;
        }

        .card-content {
          padding: 0.75rem 1.25rem 1.25rem;
        }

        .holdings-list {
          display: flex;
          flex-direction: column;
        }

        .holding-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.15s ease;
          margin: 0 -0.5rem;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          border-radius: var(--radius-sm);
        }

        .holding-item:hover {
          background-color: var(--bg-tertiary);
        }

        .holding-item:last-child {
          border-bottom: none;
        }

        .holding-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .holding-main {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .symbol {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .quantity {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .name {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .holding-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .day-change {
          display: flex;
          gap: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 500;
          font-family: var(--font-mono);
        }

        .day-change.positive {
          color: var(--positive);
        }

        .day-change.negative {
          color: var(--negative);
        }

        .more-holdings {
          text-align: center;
          padding-top: 0.75rem;
          font-size: 0.75rem;
          color: var(--text-muted);
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
          margin: 0 0 1rem 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .action-link {
          font-size: 0.875rem;
          color: var(--accent);
          text-decoration: none;
        }

        .action-link:hover {
          text-decoration: underline;
        }

        .loading-state {
          padding: 0.5rem 0;
        }

        .skeleton-summary {
          height: 80px;
          background: linear-gradient(
            90deg,
            var(--bg-tertiary) 25%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }

        .skeleton-row {
          height: 48px;
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

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
