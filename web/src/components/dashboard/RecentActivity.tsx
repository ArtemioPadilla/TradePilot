/**
 * RecentActivity Component
 *
 * Displays recent trading activity from Alpaca orders.
 */

import { useAlpacaData } from '../../hooks/useAlpacaData';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import type { AlpacaOrder } from '../../types/alpaca';

interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit';
  symbol?: string;
  amount: number;
  quantity?: number;
  timestamp: Date;
  status?: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'buy':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7-7 7 7" />
        </svg>
      );
    case 'sell':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7 7 7-7" />
        </svg>
      );
    case 'dividend':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M6 12h12" />
        </svg>
      );
    case 'deposit':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
        </svg>
      );
  }
};

const getActivityLabel = (activity: Activity) => {
  switch (activity.type) {
    case 'buy':
      return `Bought ${activity.quantity} ${activity.symbol}`;
    case 'sell':
      return `Sold ${activity.quantity} ${activity.symbol}`;
    case 'dividend':
      return `Dividend from ${activity.symbol}`;
    case 'deposit':
      return 'Deposit';
  }
};

/**
 * Convert Alpaca orders to activities
 */
function ordersToActivities(orders: AlpacaOrder[]): Activity[] {
  return orders
    .filter(order => order.status === 'filled' || order.status === 'partially_filled')
    .slice(0, 5)
    .map(order => ({
      id: order.id,
      type: order.side as 'buy' | 'sell',
      symbol: order.symbol,
      amount: (order.filledAvgPrice || 0) * (order.filledQty || order.qty || 0),
      quantity: order.filledQty || order.qty,
      timestamp: new Date(order.filledAt || order.submittedAt),
      status: order.status,
    }));
}

export default function RecentActivity() {
  const { orders, isLoading, isConnected } = useAlpacaData();

  // Convert orders to activities
  const activities = ordersToActivities(orders);

  if (!isConnected && !isLoading) {
    return (
      <div className="recent-activity">
        <div className="empty-state">
          <p>Connect to Alpaca to see your activity</p>
        </div>
        <style>{`
          .recent-activity {
            display: flex;
            flex-direction: column;
          }
          .empty-state {
            padding: 1rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="recent-activity">
        <div className="activity-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="activity-item loading">
              <div className="activity-icon skeleton" />
              <div className="activity-details">
                <span className="activity-label skeleton" />
                <span className="activity-time skeleton" />
              </div>
              <span className="activity-amount skeleton" />
            </div>
          ))}
        </div>
        <style>{`
          .recent-activity {
            display: flex;
            flex-direction: column;
          }
          .activity-list {
            display: flex;
            flex-direction: column;
            gap: calc(0.75rem * var(--spacing-density));
          }
          .activity-item {
            display: flex;
            align-items: center;
            gap: calc(0.75rem * var(--spacing-density));
            padding: calc(0.5rem * var(--spacing-density)) 0;
          }
          .skeleton {
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            animation: pulse 1.5s infinite;
          }
          .activity-icon.skeleton {
            width: 32px;
            height: 32px;
          }
          .activity-label.skeleton {
            width: 120px;
            height: 16px;
            display: block;
          }
          .activity-time.skeleton {
            width: 60px;
            height: 12px;
            display: block;
            margin-top: 4px;
          }
          .activity-amount.skeleton {
            width: 80px;
            height: 16px;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activity">
        <div className="empty-state">
          <p>No recent trades</p>
        </div>
        <style>{`
          .recent-activity {
            display: flex;
            flex-direction: column;
          }
          .empty-state {
            padding: 1rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className={`activity-icon ${activity.type}`}>{getActivityIcon(activity.type)}</div>
            <div className="activity-details">
              <span className="activity-label">{getActivityLabel(activity)}</span>
              <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
            </div>
            <span className={`activity-amount ${activity.type === 'sell' ? 'positive' : ''}`}>
              {activity.type === 'buy' ? '-' : '+'}
              {formatCurrency(activity.amount)}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .recent-activity {
          display: flex;
          flex-direction: column;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: calc(0.75rem * var(--spacing-density));
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: calc(0.75rem * var(--spacing-density));
          padding: calc(0.5rem * var(--spacing-density)) 0;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon.buy {
          background-color: var(--negative-bg);
          color: var(--negative);
        }

        .activity-icon.sell {
          background-color: var(--positive-bg);
          color: var(--positive);
        }

        .activity-icon.dividend {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .activity-icon.deposit {
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--positive);
        }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .activity-label {
          font-size: 0.875rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .activity-amount {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .activity-amount.positive {
          color: var(--positive);
        }
      `}</style>
    </div>
  );
}
