import { formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit';
  symbol?: string;
  amount: number;
  quantity?: number;
  timestamp: Date;
}

const mockActivities: Activity[] = [
  { id: '1', type: 'buy', symbol: 'AAPL', amount: 1854.2, quantity: 10, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', type: 'sell', symbol: 'TSLA', amount: 2485.0, quantity: 10, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '3', type: 'dividend', symbol: 'VTI', amount: 45.32, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '4', type: 'buy', symbol: 'NVDA', amount: 721.28, quantity: 1, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  { id: '5', type: 'deposit', amount: 5000, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) },
];

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

export default function RecentActivity() {
  return (
    <div className="recent-activity">
      <div className="activity-list">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className={`activity-icon ${activity.type}`}>{getActivityIcon(activity.type)}</div>
            <div className="activity-details">
              <span className="activity-label">{getActivityLabel(activity)}</span>
              <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
            </div>
            <span className={`activity-amount ${activity.type === 'sell' || activity.type === 'dividend' || activity.type === 'deposit' ? 'positive' : ''}`}>
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
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
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
