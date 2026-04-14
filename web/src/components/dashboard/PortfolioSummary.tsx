import { appPath } from '../../lib/utils/paths';
/**
 * PortfolioSummary Component
 *
 * Displays key portfolio metrics from all connected sources.
 */

import { formatCurrency, formatPercent } from '../../lib/utils';

export interface PortfolioSummaryProps {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  isLoading: boolean;
  hasIntegrations: boolean;
}

export default function PortfolioSummary({
  totalValue,
  totalCostBasis,
  totalGainLoss,
  totalGainLossPercent,
  dailyChange,
  dailyChangePercent,
  isLoading,
  hasIntegrations,
}: PortfolioSummaryProps) {

  const metrics = [
    {
      label: 'Total Portfolio Value',
      value: isLoading ? '--' : formatCurrency(totalValue),
      change: isLoading ? null : formatPercent(dailyChangePercent),
      positive: dailyChangePercent >= 0,
    },
    {
      label: 'Total Cost Basis',
      value: isLoading ? '--' : formatCurrency(totalCostBasis),
      change: null,
      positive: null,
    },
    {
      label: 'Total P&L',
      value: isLoading ? '--' : formatCurrency(totalGainLoss),
      change: isLoading ? null : formatPercent(totalGainLossPercent),
      positive: totalGainLoss >= 0,
    },
    {
      label: "Today's Change",
      value: isLoading ? '--' : formatCurrency(dailyChange),
      change: isLoading ? null : formatPercent(dailyChangePercent),
      positive: dailyChange >= 0,
    },
  ];

  if (!hasIntegrations && !isLoading) {
    return (
      <div className="portfolio-summary">
        <div className="not-connected">
          <p>Connect an account to see your portfolio data</p>
          <a href={appPath("/dashboard/settings?tab=connections")} className="connect-link">
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
