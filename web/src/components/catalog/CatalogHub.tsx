import { useState } from 'react';

const CATALOG_SECTIONS = [
  {
    id: 'strategies',
    title: 'Trading Strategies',
    description: 'Momentum, Mean Reversion, and Smart Beta — explore how each strategy selects assets and generates signals.',
    count: 3,
    icon: '🎯',
    href: '/catalog/strategies',
    color: '#3b82f6',
  },
  {
    id: 'optimizers',
    title: 'Optimization Methods',
    description: 'Max Sharpe Ratio, Global Min Variance, and Equal Weight — portfolio weight allocation techniques.',
    count: 3,
    icon: '⚖️',
    href: '/catalog/optimizers',
    color: '#8b5cf6',
  },
  {
    id: 'rankings',
    title: 'Ranking Functions',
    description: 'Momentum, VaR, and Random ranking — how assets are scored and selected for portfolios.',
    count: 3,
    icon: '📊',
    href: '/catalog/rankings',
    color: '#06b6d4',
  },
  {
    id: 'metrics',
    title: 'Risk & Performance Metrics',
    description: 'Sharpe, Sortino, VaR, CVaR, drawdown, skewness, kurtosis, and more — understand every metric.',
    count: 14,
    icon: '📐',
    href: '/catalog/metrics',
    color: '#f59e0b',
  },
  {
    id: 'visualizations',
    title: 'Visualizations',
    description: 'Efficient frontier, drawdown charts, returns distribution, risk metrics, and portfolio allocation charts.',
    count: 8,
    icon: '📈',
    href: '/catalog/visualizations',
    color: '#22c55e',
  },
];

export function CatalogHub() {
  return (
    <div className="catalog-hub">
      <div className="catalog-header">
        <h1>Explore TradePilot</h1>
        <p>Interactive catalog of strategies, optimizers, metrics, and visualizations — with live demos using sample data.</p>
      </div>

      <div className="catalog-grid">
        {CATALOG_SECTIONS.map((section) => (
          <a key={section.id} href={section.href} className="catalog-card" style={{ '--card-accent': section.color } as React.CSSProperties}>
            <div className="card-icon">{section.icon}</div>
            <div className="card-content">
              <div className="card-title-row">
                <h2>{section.title}</h2>
                <span className="card-count">{section.count}</span>
              </div>
              <p>{section.description}</p>
            </div>
            <div className="card-arrow">→</div>
          </a>
        ))}
      </div>

      <div className="catalog-footer">
        <p>All demos use client-side generated sample data — no API calls or external services needed.</p>
      </div>

      <style>{`
        .catalog-hub {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .catalog-header {
          margin-bottom: 2.5rem;
        }

        .catalog-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .catalog-header p {
          color: var(--text-muted);
          font-size: 1rem;
          margin: 0;
          max-width: 600px;
        }

        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
        }

        .catalog-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--glass-bg, var(--bg-secondary));
          border: 1px solid var(--glass-border, var(--border));
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .catalog-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--card-accent);
          border-radius: 4px 0 0 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .catalog-card:hover {
          border-color: var(--card-accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .catalog-card:hover::before {
          opacity: 1;
        }

        .card-icon {
          font-size: 2rem;
          flex-shrink: 0;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #262638);
          border-radius: 12px;
        }

        .card-content {
          flex: 1;
          min-width: 0;
        }

        .card-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
        }

        .card-title-row h2 {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .card-count {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--card-accent);
          background: color-mix(in srgb, var(--card-accent) 15%, transparent);
          padding: 0.125rem 0.5rem;
          border-radius: 99px;
        }

        .card-content p {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .card-arrow {
          font-size: 1.25rem;
          color: var(--text-muted);
          transition: transform 0.2s, color 0.2s;
          flex-shrink: 0;
        }

        .catalog-card:hover .card-arrow {
          transform: translateX(4px);
          color: var(--card-accent);
        }

        .catalog-footer {
          margin-top: 2.5rem;
          text-align: center;
        }

        .catalog-footer p {
          color: var(--text-muted);
          font-size: 0.8rem;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .catalog-hub { padding: 1rem; }
          .catalog-grid { grid-template-columns: 1fr; }
          .catalog-header h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}

export default CatalogHub;
