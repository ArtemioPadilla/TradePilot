import { useStore } from '@nanostores/react';
import { $user } from '../../stores/auth';
import { LayoutDashboard, TrendingUp, FlaskConical, Building2 } from 'lucide-react';
import { appPath } from '../../lib/utils/paths';

export function HomePage() {
  const user = useStore($user);

  return (
    <div className="home-page">
      <h1 className="home-title">
        Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
      </h1>
      <p className="home-subtitle">What would you like to do today?</p>

      <div className="quick-actions">
        <a href={appPath('/dashboard')} className="action-card">
          <span className="action-icon">
            <LayoutDashboard size={32} strokeWidth={1.5} />
          </span>
          <span className="action-label">Dashboard</span>
          <span className="action-description">View your portfolio overview</span>
        </a>
        <a href={appPath('/dashboard/trading')} className="action-card">
          <span className="action-icon">
            <TrendingUp size={32} strokeWidth={1.5} />
          </span>
          <span className="action-label">Trading</span>
          <span className="action-description">Execute trades and manage orders</span>
        </a>
        <a href={appPath('/dashboard/backtest')} className="action-card">
          <span className="action-icon">
            <FlaskConical size={32} strokeWidth={1.5} />
          </span>
          <span className="action-label">Backtesting</span>
          <span className="action-description">Test your trading strategies</span>
        </a>
        <a href={appPath('/dashboard/accounts')} className="action-card">
          <span className="action-icon">
            <Building2 size={32} strokeWidth={1.5} />
          </span>
          <span className="action-label">Accounts</span>
          <span className="action-description">Manage your linked accounts</span>
        </a>
      </div>

      <style>{`
        .home-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .home-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
          margin: 0 0 0.5rem;
        }

        .home-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted, #888);
          margin: 0 0 2rem;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background: var(--card-bg, #1a1a2e);
          border: 1px solid var(--border, #2a2a40);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          background: var(--card-bg-hover, #242440);
          border-color: var(--accent, #6366f1);
          transform: translateY(-2px);
        }

        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: var(--accent-muted, rgba(99, 102, 241, 0.1));
          color: var(--accent, #6366f1);
        }

        .action-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .action-description {
          font-size: 0.875rem;
          color: var(--text-muted, #888);
          text-align: center;
        }

        @media (max-width: 768px) {
          .home-page {
            padding: 1.5rem 1rem;
          }

          .home-title {
            font-size: 1.5rem;
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-card {
            padding: 1rem;
          }

          .action-icon {
            width: 48px;
            height: 48px;
          }

          .action-icon svg {
            width: 24px;
            height: 24px;
          }

          .action-description {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
