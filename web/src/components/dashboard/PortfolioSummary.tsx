import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import {
  $accounts,
  $totalPortfolioValue,
  $totalCostBasis,
  $totalPnL,
  $totalPnLPercent,
  loadMockData,
} from '../../stores/portfolio';
import { formatCurrency, formatPercent } from '../../lib/utils';

export default function PortfolioSummary() {
  const accounts = useStore($accounts);
  const totalValue = useStore($totalPortfolioValue);
  const costBasis = useStore($totalCostBasis);
  const pnl = useStore($totalPnL);
  const pnlPercent = useStore($totalPnLPercent);

  useEffect(() => {
    // Load mock data on mount
    if (accounts.length === 0) {
      loadMockData();
    }
  }, []);

  const metrics = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      change: formatPercent(2.4),
      positive: true,
    },
    {
      label: 'Total Cost Basis',
      value: formatCurrency(costBasis),
      change: null,
      positive: null,
    },
    {
      label: 'Total P&L',
      value: formatCurrency(pnl),
      change: formatPercent(pnlPercent),
      positive: pnl >= 0,
    },
    {
      label: "Today's Change",
      value: formatCurrency(1250.32),
      change: formatPercent(1.2),
      positive: true,
    },
  ];

  return (
    <div className="portfolio-summary">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <span className="metric-label">{metric.label}</span>
          <span className="metric-value">{metric.value}</span>
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
