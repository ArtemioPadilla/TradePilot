/**
 * PortfolioSummary Component
 *
 * Displays key portfolio metrics from Alpaca account data.
 */

import { useAlpacaData } from '../../hooks/useAlpacaData';
import { formatCurrency, formatPercent } from '../../lib/utils';

export default function PortfolioSummary() {
  const { account, positions, isLoading, isConnected } = useAlpacaData();

  // Calculate totals from positions
  const totalMarketValue = positions.reduce(
    (sum, pos) => sum + pos.marketValue,
    0
  );
  const totalCostBasis = positions.reduce(
    (sum, pos) => sum + Math.abs(pos.costBasis),
    0
  );
  const totalUnrealizedPL = positions.reduce(
    (sum, pos) => sum + pos.unrealizedPl,
    0
  );
  const totalUnrealizedPLPercent = totalCostBasis > 0
    ? (totalUnrealizedPL / totalCostBasis) * 100
    : 0;

  // Today's change from positions (calculated from price difference)
  const todayChange = positions.reduce(
    (sum, pos) => sum + (pos.currentPrice - pos.lastdayPrice) * pos.qty,
    0
  );
  const todayChangePercent = positions.reduce(
    (sum, pos) => sum + pos.changeToday,
    0
  ) / (positions.length || 1);

  // Total portfolio value = equity from account
  const portfolioValue = account?.portfolioValue || totalMarketValue;

  const metrics = [
    {
      label: 'Total Portfolio Value',
      value: isLoading ? '--' : formatCurrency(portfolioValue),
      change: isLoading ? null : formatPercent(todayChangePercent),
      positive: todayChangePercent >= 0,
    },
    {
      label: 'Total Cost Basis',
      value: isLoading ? '--' : formatCurrency(totalCostBasis),
      change: null,
      positive: null,
    },
    {
      label: 'Total P&L',
      value: isLoading ? '--' : formatCurrency(totalUnrealizedPL),
      change: isLoading ? null : formatPercent(totalUnrealizedPLPercent),
      positive: totalUnrealizedPL >= 0,
    },
    {
      label: "Today's Change",
      value: isLoading ? '--' : formatCurrency(todayChange),
      change: isLoading ? null : formatPercent(todayChangePercent),
      positive: todayChange >= 0,
    },
  ];

  if (!isConnected && !isLoading) {
    return (
      <div className="portfolio-summary">
        <div className="not-connected">
          <p>Connect to Alpaca to see your portfolio data</p>
          <a href="/dashboard/trading" className="connect-link">
            Connect Account
          </a>
        </div>
        <style>{`
          .portfolio-summary {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .not-connected {
            text-align: center;
            color: var(--text-secondary);
          }
          .connect-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: var(--accent);
            text-decoration: none;
          }
          .connect-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="portfolio-summary">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <span className="metric-label">{metric.label}</span>
          <span className={`metric-value ${isLoading ? 'loading' : ''}`}>
            {metric.value}
          </span>
          {metric.change && (
            <span className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
              {metric.change}
            </span>
          )}
        </div>
      ))}

      <style>{`
        .portfolio-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: calc(1.5rem * var(--spacing-density));
        }

        .metric-card {
          display: flex;
          flex-direction: column;
          gap: calc(0.25rem * var(--spacing-density));
        }

        .metric-label {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .metric-value.loading {
          opacity: 0.5;
        }

        .metric-change {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .metric-change.positive {
          color: var(--positive);
        }

        .metric-change.negative {
          color: var(--negative);
        }

        @media (max-width: 1024px) {
          .portfolio-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .portfolio-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
