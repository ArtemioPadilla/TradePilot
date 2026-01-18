import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  getPortfolioData,
  calculateDiversityScore,
} from '../../lib/services/portfolio';
import type { PortfolioSummary, AllocationItem } from '../../types/portfolio';

/**
 * Format currency value
 */
function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency with decimals
 */
function formatCurrencyPrecise(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

interface PortfolioOverviewProps {
  /** Base currency for display */
  baseCurrency?: 'USD' | 'EUR' | 'GBP';
}

export function PortfolioOverview({ baseCurrency = 'USD' }: PortfolioOverviewProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [allocationByType, setAllocationByType] = useState<AllocationItem[]>([]);
  const [allocationByAccount, setAllocationByAccount] = useState<AllocationItem[]>([]);
  const [diversityScore, setDiversityScore] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadPortfolioData();
  }, [userId, baseCurrency]);

  async function loadPortfolioData() {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getPortfolioData(userId, baseCurrency);

      setSummary(data.summary);
      setAllocationByType(data.allocationByType);
      setAllocationByAccount(data.allocationByAccount);
      setDiversityScore(data.diversityScore);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="portfolio-overview loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-overview error">
        <p>{error}</p>
        <button onClick={loadPortfolioData}>Retry</button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="portfolio-overview empty">
        <p>No portfolio data available</p>
        <a href="/dashboard/accounts">Add an account to get started</a>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Value',
      value: formatCurrency(summary.totalValue),
      change: null,
      positive: null,
      tooltip: 'Total market value of all holdings plus cash',
    },
    {
      label: 'Market Value',
      value: formatCurrency(summary.totalValue - summary.totalCash),
      subValue: `${summary.holdingCount} positions`,
      change: null,
      positive: null,
      tooltip: 'Total market value of all holdings',
    },
    {
      label: 'Cash',
      value: formatCurrency(summary.totalCash),
      subValue: `${summary.accountCount} accounts`,
      change: null,
      positive: null,
      tooltip: 'Total cash across all accounts',
    },
    {
      label: 'Unrealized P&L',
      value: formatCurrencyPrecise(summary.totalUnrealizedPL),
      change: formatPercent(summary.totalUnrealizedPLPercent),
      positive: summary.totalUnrealizedPL >= 0,
      tooltip: 'Total unrealized profit/loss',
    },
    {
      label: "Today's Change",
      value: formatCurrencyPrecise(summary.dailyChange),
      change: formatPercent(summary.dailyChangePercent),
      positive: summary.dailyChange >= 0,
      tooltip: 'Change in portfolio value today',
    },
    {
      label: 'Cost Basis',
      value: formatCurrency(summary.totalCostBasis),
      change: null,
      positive: null,
      tooltip: 'Total amount invested',
    },
  ];

  return (
    <div className="portfolio-overview">
      {/* Summary Metrics */}
      <div className="metrics-grid" data-testid="portfolio-metrics">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card" title={metric.tooltip}>
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
            {metric.subValue && (
              <span className="metric-subvalue">{metric.subValue}</span>
            )}
            {metric.change && (
              <span className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                {metric.change}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Diversity Score */}
      <div className="diversity-section">
        <div className="section-header">
          <h3>Portfolio Diversity</h3>
          <span className="diversity-score" title="Higher score = more diversified">
            {diversityScore}/100
          </span>
        </div>
        <div className="diversity-bar">
          <div
            className="diversity-fill"
            style={{ width: `${diversityScore}%` }}
          />
        </div>
        <p className="diversity-label">
          {diversityScore < 30 && 'Concentrated'}
          {diversityScore >= 30 && diversityScore < 60 && 'Moderate'}
          {diversityScore >= 60 && diversityScore < 80 && 'Diversified'}
          {diversityScore >= 80 && 'Well Diversified'}
        </p>
      </div>

      {/* Allocation by Asset Type */}
      {allocationByType.length > 0 && (
        <div className="allocation-section" data-testid="allocation-by-type">
          <h3>By Asset Type</h3>
          <div className="allocation-list">
            {allocationByType.map((item, index) => (
              <div key={index} className="allocation-item">
                <div className="allocation-info">
                  <span className="allocation-name">{item.category}</span>
                  <span className="allocation-count">{item.holdingCount} holdings</span>
                </div>
                <div className="allocation-bar-container">
                  <div
                    className="allocation-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="allocation-values">
                  <span className="allocation-percent">{item.percentage.toFixed(1)}%</span>
                  <span className="allocation-value">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocation by Account */}
      {allocationByAccount.length > 0 && (
        <div className="allocation-section" data-testid="allocation-by-account">
          <h3>By Account</h3>
          <div className="allocation-list">
            {allocationByAccount.map((item, index) => (
              <div key={index} className="allocation-item">
                <div className="allocation-info">
                  <span className="allocation-name">{item.category}</span>
                  <span className="allocation-count">{item.holdingCount} holdings</span>
                </div>
                <div className="allocation-bar-container">
                  <div
                    className="allocation-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="allocation-values">
                  <span className="allocation-percent">{item.percentage.toFixed(1)}%</span>
                  <span className="allocation-value">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .portfolio-overview {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .portfolio-overview.loading,
        .portfolio-overview.error,
        .portfolio-overview.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          min-height: 200px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .metric-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          cursor: help;
          transition: border-color 0.15s;
        }

        .metric-card:hover {
          border-color: var(--accent);
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .metric-subvalue {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .metric-change {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .metric-change.positive {
          color: var(--positive, #10b981);
        }

        .metric-change.negative {
          color: var(--negative, #ef4444);
        }

        .diversity-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .diversity-score {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent);
          cursor: help;
        }

        .diversity-bar {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .diversity-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--negative) 0%, var(--warning, #f59e0b) 50%, var(--positive) 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .diversity-label {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        .allocation-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }

        .allocation-section h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .allocation-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .allocation-item {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 1rem;
          align-items: center;
        }

        .allocation-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .allocation-name {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .allocation-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .allocation-bar-container {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .allocation-bar {
          height: 100%;
          background: var(--accent);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .allocation-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .allocation-percent {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .allocation-value {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .allocation-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .allocation-values {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default PortfolioOverview;
