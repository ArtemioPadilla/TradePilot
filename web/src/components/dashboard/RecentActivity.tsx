/**
 * RecentActivity Component
 *
 * Displays recent trading activity from connected sources.
 */

import { useState, useEffect } from 'react';
import { getIntegrationService } from '../../lib/services/integrations';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import type { ExternalOrder } from '../../lib/services/adapters/types';
import type { SourceIntegration } from '../../types/integrations';

interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit';
  symbol?: string;
  amount: number;
  quantity?: number;
  timestamp: Date;
  status?: string;
  source?: string;
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
 * Convert orders to activities
 */
function ordersToActivities(orders: ExternalOrder[]): Activity[] {
  return orders
    .filter(order => order.status === 'filled' || order.status === 'partially_filled')
    .slice(0, 5)
    .map(order => ({
      id: order.externalId,
      type: order.side as 'buy' | 'sell',
      symbol: order.symbol,
      amount: (order.avgFillPrice || 0) * (order.filledQuantity || order.quantity || 0),
      quantity: order.filledQuantity || order.quantity,
      timestamp: order.filledAt || order.submittedAt,
      status: order.status,
    }));
}

export interface RecentActivityProps {
  integrations: SourceIntegration[];
  userId: string | null;
  isLoading: boolean;
  hasIntegrations: boolean;
}

export default function RecentActivity({
  integrations,
  userId,
  isLoading,
  hasIntegrations,
}: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Create stable key for active integrations to avoid infinite loop
  const activeIntegrationKey = integrations
    .filter(i => i.status === 'active')
    .map(i => i.source)
    .sort()
    .join(',');

  // Load orders from connected adapters
  useEffect(() => {
    if (!userId || !hasIntegrations) {
      setActivities([]);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const loadOrders = async () => {
      setOrdersLoading(true);
      const integrationService = getIntegrationService();

      try {
        // Get active integrations
        const activeIntegrations = integrations.filter(i => i.status === 'active');

        // Fetch orders from all integrations in parallel
        const orderPromises = activeIntegrations.map(async (integration) => {
          try {
            const adapter = await integrationService.getConnectedAdapter(userId, integration.source);
            if (!adapter?.getOrders) return [];

            const orders = await adapter.getOrders(undefined, { status: 'all', limit: 10 });
            return ordersToActivities(orders).map(a => ({
              ...a,
              source: integration.source,
            }));
          } catch (err) {
            console.error(`Failed to load orders from ${integration.source}:`, err);
            return [];
          }
        });

        const results = await Promise.all(orderPromises);

        // Only update state if component is still mounted
        if (!isMounted) return;

        // Flatten, sort by timestamp descending, and take top 5
        const allActivities = results.flat();
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(allActivities.slice(0, 5));
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // Use activeIntegrationKey instead of integrations to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasIntegrations, activeIntegrationKey]);

  const loading = isLoading || ordersLoading;

  if (!hasIntegrations && !loading) {
    return (
      <div className="recent-activity">
        <div className="empty-state">
          <p>Connect an account to see your activity</p>
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

  if (loading) {
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
