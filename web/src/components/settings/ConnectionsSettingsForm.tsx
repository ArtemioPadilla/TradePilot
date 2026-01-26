/**
 * Connections Settings Form Component
 *
 * Manages external service connections including Alpaca
 * and future brokerage integrations.
 */

import { AlpacaConnectionForm } from '../trading/AlpacaConnectionForm';

export function ConnectionsSettingsForm() {
  return (
    <div className="connections-settings" data-testid="connections-settings">
      {/* Alpaca Section */}
      <section className="settings-section">
        <div className="section-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Brokerage Connections
          </h3>
          <p className="section-description">
            Connect your brokerage accounts for automated trading and portfolio sync
          </p>
        </div>

        <AlpacaConnectionForm />
      </section>

      {/* Future Connections */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          More Connections Coming Soon
        </h3>
        <p className="section-description">
          Additional brokerage and service integrations are in development
        </p>

        <div className="coming-soon-grid">
          <div className="connection-card coming-soon">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="card-info">
              <span className="card-name">Interactive Brokers</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>

          <div className="connection-card coming-soon">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="card-info">
              <span className="card-name">TD Ameritrade</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>

          <div className="connection-card coming-soon">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="card-info">
              <span className="card-name">Coinbase</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Market Data Sources
        </h3>
        <p className="section-description">
          These data providers power your market data and analytics
        </p>

        <div className="data-sources">
          <div className="data-source">
            <div className="source-status connected">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="source-info">
              <span className="source-name">Yahoo Finance</span>
              <span className="source-description">Real-time market data and historical prices</span>
            </div>
          </div>

          <div className="data-source">
            <div className="source-status connected">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="source-info">
              <span className="source-name">Alpaca Markets</span>
              <span className="source-description">Real-time streaming data (when connected)</span>
            </div>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .connections-settings {
    max-width: 700px;
  }

  .settings-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .settings-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .section-header {
    margin-bottom: 1.5rem;
  }

  .settings-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.375rem 0;
  }

  .settings-section h3 svg {
    color: var(--text-muted, #6b7280);
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.25rem 0;
  }

  /* Coming Soon Grid */
  .coming-soon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .connection-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
    background-color: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .connection-card.coming-soon {
    opacity: 0.7;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: 50%;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.75rem;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-name {
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .coming-soon-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  /* Data Sources */
  .data-sources {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .data-source {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .source-status {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .source-status.connected {
    background-color: rgba(22, 163, 74, 0.1);
    color: #16a34a;
  }

  .source-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .source-name {
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .source-description {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
  }

  @media (max-width: 640px) {
    .coming-soon-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default ConnectionsSettingsForm;
