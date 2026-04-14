import { registerWidget } from './registry';
import type { DashboardWidget } from './types';
import { PortfolioOverview } from '../../components/dashboard/PortfolioOverview';
import { PerformanceMetrics } from '../../components/dashboard/PerformanceMetrics';
import WatchlistWidget from '../../components/dashboard/WatchlistWidget';
import RecentActivity from '../../components/dashboard/RecentActivity';

const portfolioOverviewWidget: DashboardWidget = {
  id: 'portfolio-overview',
  name: 'Portfolio Overview',
  description: 'Summary of portfolio value, allocation, and diversity score',
  component: PortfolioOverview as any,
  defaultSize: { cols: 4, rows: 3 },
  minSize: { cols: 2, rows: 2 },
  category: 'portfolio',
};

const performanceMetricsWidget: DashboardWidget = {
  id: 'performance-metrics',
  name: 'Performance Metrics',
  description: 'Key performance indicators including Sharpe ratio, volatility, and drawdown',
  component: PerformanceMetrics as any,
  defaultSize: { cols: 4, rows: 2 },
  minSize: { cols: 2, rows: 2 },
  category: 'analytics',
};

const watchlistWidgetDef: DashboardWidget = {
  id: 'watchlist',
  name: 'Watchlist',
  description: 'Track prices and changes for watched symbols',
  component: WatchlistWidget as any,
  defaultSize: { cols: 2, rows: 2 },
  minSize: { cols: 1, rows: 2 },
  category: 'trading',
};

const recentActivityWidget: DashboardWidget = {
  id: 'recent-activity',
  name: 'Recent Activity',
  description: 'Latest trades and transactions from connected accounts',
  component: RecentActivity as any,
  defaultSize: { cols: 2, rows: 2 },
  minSize: { cols: 1, rows: 2 },
  category: 'trading',
};

export function registerDashboardWidgets(): void {
  registerWidget(portfolioOverviewWidget);
  registerWidget(performanceMetricsWidget);
  registerWidget(watchlistWidgetDef);
  registerWidget(recentActivityWidget);
}
