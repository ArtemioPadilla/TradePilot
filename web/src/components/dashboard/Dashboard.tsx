/**
 * Dashboard Component
 *
 * Unified dashboard that manages a single usePortfolio() subscription
 * and passes data to all child widgets as props.
 *
 * This consolidates what was previously 6 separate React islands into
 * a single component to avoid duplicate Firestore subscriptions.
 */

import { useState } from 'react';
import { appPath } from '../../lib/utils/paths';
import { usePortfolio } from '../../hooks/usePortfolio';
import type { UsePortfolioOptions } from '../../hooks/usePortfolio';
import PortfolioSummary from './PortfolioSummary';
import HoldingsTable from './HoldingsTable';
import PerformanceChart from './PerformanceChart';
import AllocationChart from './AllocationChart';
import RecentActivity from './RecentActivity';
import WatchlistWidget from './WatchlistWidget';

type HistoryPeriod = '1D' | '1W' | '1M' | '3M' | '1A' | 'all';

export default function Dashboard() {
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('1M');

  // Single subscription for all widgets
  const portfolioOptions: UsePortfolioOptions = {
    includeHistory: true,
    historyPeriod,
    refreshInterval: 0, // Disable auto-refresh - Firestore onSnapshot() provides real-time updates
  };

  const portfolio = usePortfolio(portfolioOptions);

  const handlePeriodChange = (period: HistoryPeriod) => {
    setHistoryPeriod(period);
  };

  return (
    <div className="dashboard-grid">
      <div className="widget widget-summary">
        <PortfolioSummary
          totalValue={portfolio.totalValue}
          totalCostBasis={portfolio.totalCostBasis}
          totalGainLoss={portfolio.totalGainLoss}
          totalGainLossPercent={portfolio.totalGainLossPercent}
          dailyChange={portfolio.dailyChange}
          dailyChangePercent={portfolio.dailyChangePercent}
          isLoading={portfolio.isLoading}
          hasIntegrations={portfolio.hasIntegrations}
        />
      </div>

      <div className="widget widget-chart">
        <div className="widget-header">
          <h3>Performance</h3>
          <div className="widget-actions">
            {(['1W', '1M', '3M', '1A', 'all'] as const).map((period) => (
              <button
                key={period}
                className={`btn btn-ghost btn-sm ${historyPeriod === period ? 'active' : ''}`}
                onClick={() => handlePeriodChange(period)}
              >
                {period === '1A' ? '1Y' : period === 'all' ? 'ALL' : period}
              </button>
            ))}
          </div>
        </div>
        <PerformanceChart
          portfolioHistory={portfolio.portfolioHistory}
          isLoading={portfolio.isLoading}
          hasIntegrations={portfolio.hasIntegrations}
        />
      </div>

      <div className="widget widget-allocation">
        <div className="widget-header">
          <h3>Asset Allocation</h3>
        </div>
        <AllocationChart
          holdings={portfolio.holdings}
          isLoading={portfolio.isLoading}
          hasIntegrations={portfolio.hasIntegrations}
        />
      </div>

      <div className="widget widget-holdings">
        <div className="widget-header">
          <h3>Holdings</h3>
          <a href={appPath('/dashboard/accounts')} className="btn btn-ghost btn-sm">View All</a>
        </div>
        <HoldingsTable
          holdings={portfolio.holdings}
          isLoading={portfolio.isLoading}
          hasIntegrations={portfolio.hasIntegrations}
        />
      </div>

      <div className="widget widget-activity">
        <div className="widget-header">
          <h3>Recent Activity</h3>
        </div>
        <RecentActivity
          integrations={portfolio.integrations}
          userId={portfolio.userId}
          isLoading={portfolio.isLoading}
          hasIntegrations={portfolio.hasIntegrations}
        />
      </div>

      <div className="widget widget-watchlist">
        <div className="widget-header">
          <h3>Watchlist</h3>
          <button className="btn btn-ghost btn-sm">Edit</button>
        </div>
        <WatchlistWidget />
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: calc(1.5rem * var(--spacing-density));
        }

        .widget {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: calc(1.25rem * var(--spacing-density));
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: calc(1rem * var(--spacing-density));
        }

        .widget-header h3 {
          font-size: 1rem;
          font-weight: 600;
        }

        .widget-actions {
          display: flex;
          gap: 0.25rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          text-decoration: none;
        }

        .btn-ghost {
          background-color: transparent;
          color: var(--text-secondary);
        }

        .btn-ghost:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .btn-sm.active {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .widget-summary {
          grid-column: span 12;
        }

        .widget-chart {
          grid-column: span 8;
          min-height: 350px;
        }

        .widget-allocation {
          grid-column: span 4;
          min-height: 350px;
        }

        .widget-holdings {
          grid-column: span 8;
        }

        .widget-activity {
          grid-column: span 4;
        }

        .widget-watchlist {
          grid-column: span 4;
        }

        @media (max-width: 1200px) {
          .widget-chart,
          .widget-holdings {
            grid-column: span 12;
          }

          .widget-allocation,
          .widget-activity,
          .widget-watchlist {
            grid-column: span 6;
          }
        }

        @media (max-width: 768px) {
          .widget-allocation,
          .widget-activity,
          .widget-watchlist {
            grid-column: span 12;
          }
        }
      `}</style>
    </div>
  );
}
