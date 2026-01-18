/**
 * Public Strategy Browser Component
 *
 * Browse and copy public strategies shared by other users.
 */

import { useState, useEffect } from 'react';
import type { PublicStrategy, StrategyType } from '../../types/strategies';
import { getStrategyTypeName, getRebalanceFrequencyName } from '../../types/strategies';
import {
  getPublicStrategies,
  copyPublicStrategy,
  incrementPublicStrategyViews,
} from '../../lib/services/strategies';

export interface PublicStrategyBrowserProps {
  onCopySuccess?: (strategyId: string) => void;
}

type SortOption = 'copyCount' | 'return' | 'sharpe' | 'recent';

export function PublicStrategyBrowser({ onCopySuccess }: PublicStrategyBrowserProps) {
  const [strategies, setStrategies] = useState<PublicStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<StrategyType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('copyCount');

  // Copy modal
  const [copyingStrategy, setCopyingStrategy] = useState<PublicStrategy | null>(null);
  const [copyName, setCopyName] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  // Detail view
  const [selectedStrategy, setSelectedStrategy] = useState<PublicStrategy | null>(null);

  useEffect(() => {
    loadStrategies();
  }, [sortBy, filterType]);

  const loadStrategies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getPublicStrategies({
        sortBy,
        type: filterType === 'all' ? undefined : filterType,
        maxResults: 50,
      });
      setStrategies(result);
    } catch (err) {
      setError('Failed to load public strategies');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStrategies = strategies.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const handleViewDetails = async (strategy: PublicStrategy) => {
    setSelectedStrategy(strategy);
    // Track view
    await incrementPublicStrategyViews(strategy.id).catch(() => {});
  };

  const handleStartCopy = (strategy: PublicStrategy) => {
    if (!strategy.allowCopy) return;
    setCopyingStrategy(strategy);
    setCopyName(`${strategy.name} (Copy)`);
  };

  const handleConfirmCopy = async () => {
    if (!copyingStrategy) return;

    setIsCopying(true);
    try {
      const newId = await copyPublicStrategy(copyingStrategy.id, copyName);
      setCopyingStrategy(null);
      setCopyName('');
      onCopySuccess?.(newId);
      // Refresh to update copy counts
      loadStrategies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy strategy');
    } finally {
      setIsCopying(false);
    }
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return '-';
    return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="browser-container" data-testid="public-strategy-browser">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading public strategies...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="browser-container" data-testid="public-strategy-browser">
      {/* Header */}
      <div className="browser-header">
        <div className="header-content">
          <h2>Strategy Marketplace</h2>
          <p>Browse and copy strategies shared by the community</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-public-strategies"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as StrategyType | 'all')}
          className="filter-select"
          data-testid="type-filter"
        >
          <option value="all">All Types</option>
          <option value="momentum">Momentum</option>
          <option value="mean_reversion">Mean Reversion</option>
          <option value="equal_weight">Equal Weight</option>
          <option value="risk_parity">Risk Parity</option>
          <option value="smart_beta">Smart Beta</option>
          <option value="buy_and_hold">Buy & Hold</option>
          <option value="custom">Custom</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="filter-select"
          data-testid="sort-select"
        >
          <option value="copyCount">Most Copied</option>
          <option value="return">Highest Return</option>
          <option value="sharpe">Best Sharpe</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={loadStrategies}>Retry</button>
        </div>
      )}

      {/* Strategy Grid */}
      {filteredStrategies.length === 0 ? (
        <div className="empty-state">
          {strategies.length === 0 ? (
            <>
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>No public strategies yet</h3>
              <p>Be the first to share a strategy with the community!</p>
            </>
          ) : (
            <>
              <p>No strategies match your search</p>
              <button onClick={() => setSearchQuery('')}>Clear Search</button>
            </>
          )}
        </div>
      ) : (
        <div className="strategy-grid">
          {filteredStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="strategy-card"
              data-testid={`public-strategy-${strategy.id}`}
            >
              <div className="card-header">
                <h3>{strategy.name}</h3>
                <span className="type-badge">
                  {getStrategyTypeName(strategy.type)}
                </span>
              </div>

              {strategy.authorVisible && strategy.authorName && (
                <p className="author-line">
                  by <span className="author-name">{strategy.authorName}</span>
                </p>
              )}

              <p className="description">{strategy.description}</p>

              <div className="metrics">
                <div className="metric">
                  <span className="metric-label">Return</span>
                  <span className={`metric-value ${(strategy.lastBacktestReturn || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatNumber(strategy.lastBacktestReturn)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Sharpe</span>
                  <span className="metric-value">
                    {strategy.lastBacktestSharpe?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Rebalance</span>
                  <span className="metric-value">
                    {getRebalanceFrequencyName(strategy.config.rebalanceFrequency)}
                  </span>
                </div>
              </div>

              <div className="tags">
                {strategy.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="card-footer">
                <div className="social-stats">
                  <span className="stat" title="Copies">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {strategy.copyCount}
                  </span>
                  <span className="stat" title="Views">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {strategy.viewCount}
                  </span>
                </div>

                <div className="card-actions">
                  <button
                    className="view-button"
                    onClick={() => handleViewDetails(strategy)}
                  >
                    Details
                  </button>
                  {strategy.allowCopy && (
                    <button
                      className="copy-button"
                      onClick={() => handleStartCopy(strategy)}
                      data-testid={`copy-strategy-${strategy.id}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copy Modal */}
      {copyingStrategy && (
        <div className="modal-overlay" onClick={() => setCopyingStrategy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Copy Strategy</h3>
            <p>
              Copy <strong>{copyingStrategy.name}</strong> to your strategies?
            </p>

            <div className="form-group">
              <label htmlFor="copy-name">Strategy Name</label>
              <input
                id="copy-name"
                type="text"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                placeholder="Enter a name for your copy"
                data-testid="copy-name-input"
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setCopyingStrategy(null)}
                disabled={isCopying}
              >
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={handleConfirmCopy}
                disabled={isCopying || !copyName.trim()}
                data-testid="confirm-copy"
              >
                {isCopying ? 'Copying...' : 'Copy Strategy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStrategy && (
        <div className="modal-overlay" onClick={() => setSelectedStrategy(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedStrategy(null)}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="detail-header">
              <h2>{selectedStrategy.name}</h2>
              <span className="type-badge large">
                {getStrategyTypeName(selectedStrategy.type)}
              </span>
            </div>

            {selectedStrategy.authorVisible && selectedStrategy.authorName && (
              <p className="detail-author">
                Created by <strong>{selectedStrategy.authorName}</strong>
              </p>
            )}

            <p className="detail-description">{selectedStrategy.description}</p>

            <div className="detail-section">
              <h4>Performance</h4>
              <div className="detail-metrics">
                <div className="detail-metric">
                  <span className="label">Return</span>
                  <span className={`value ${(selectedStrategy.lastBacktestReturn || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatNumber(selectedStrategy.lastBacktestReturn)}
                  </span>
                </div>
                <div className="detail-metric">
                  <span className="label">Sharpe Ratio</span>
                  <span className="value">
                    {selectedStrategy.lastBacktestSharpe?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="detail-metric">
                  <span className="label">Max Drawdown</span>
                  <span className="value negative">
                    {selectedStrategy.lastBacktestMaxDrawdown
                      ? `-${selectedStrategy.lastBacktestMaxDrawdown.toFixed(1)}%`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Configuration</h4>
              <dl className="config-list">
                <dt>Universe</dt>
                <dd>{selectedStrategy.config.universe.toUpperCase()}</dd>
                <dt>Rebalance</dt>
                <dd>{getRebalanceFrequencyName(selectedStrategy.config.rebalanceFrequency)}</dd>
              </dl>
            </div>

            <div className="detail-tags">
              {selectedStrategy.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="detail-stats">
              <span>{selectedStrategy.copyCount} copies</span>
              <span>{selectedStrategy.viewCount} views</span>
            </div>

            {selectedStrategy.allowCopy && (
              <button
                className="copy-button large"
                onClick={() => {
                  setSelectedStrategy(null);
                  handleStartCopy(selectedStrategy);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy This Strategy
              </button>
            )}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .browser-container {
    padding: 1rem;
  }

  .browser-header {
    margin-bottom: 1.5rem;
  }

  .browser-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
  }

  .browser-header p {
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  .filters-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 200px;
    position: relative;
  }

  .search-box svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted, #6b7280);
  }

  .search-box input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    background-color: var(--bg-primary, white);
    color: var(--text-primary, #111827);
  }

  .filter-select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    background-color: var(--bg-primary, white);
    color: var(--text-primary, #111827);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border-radius: var(--radius-md, 0.375rem);
    margin-bottom: 1rem;
  }

  .error-banner button {
    background: none;
    border: 1px solid currentColor;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm, 0.25rem);
    color: inherit;
    cursor: pointer;
  }

  .strategy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .strategy-card {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    padding: 1rem;
    transition: box-shadow 0.2s;
  }

  .strategy-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .card-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  .type-badge {
    padding: 0.125rem 0.5rem;
    background-color: rgba(99, 102, 241, 0.1);
    color: var(--accent, #6366f1);
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .type-badge.large {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }

  .author-line {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin: 0 0 0.75rem 0;
  }

  .author-name {
    color: var(--text-secondary, #4b5563);
    font-weight: 500;
  }

  .description {
    color: var(--text-secondary, #4b5563);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
  }

  .metric-label {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .metric-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .metric-value.positive { color: #16a34a; }
  .metric-value.negative { color: #dc2626; }

  .tags {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .tag {
    padding: 0.125rem 0.375rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    color: var(--text-secondary, #4b5563);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border, #e5e7eb);
  }

  .social-stats {
    display: flex;
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-muted, #6b7280);
    font-size: 0.8125rem;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .view-button,
  .copy-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-button {
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .view-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .copy-button {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .copy-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }

  .copy-button.large {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
    font-size: 0.9375rem;
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
  }

  .modal-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .modal-content p {
    color: var(--text-secondary, #4b5563);
    margin: 0 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
    color: var(--text-primary, #111827);
  }

  .form-group input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.9375rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .cancel-button,
  .confirm-button {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-button {
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .confirm-button {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .confirm-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Detail Modal */
  .detail-modal {
    position: relative;
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 1.5rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
  }

  .close-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    padding-right: 2rem;
  }

  .detail-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .detail-author {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0 0 1rem 0;
  }

  .detail-description {
    font-size: 0.9375rem;
    color: var(--text-secondary, #4b5563);
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
  }

  .detail-section {
    margin-bottom: 1.25rem;
  }

  .detail-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .detail-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-md, 0.375rem);
  }

  .detail-metric {
    text-align: center;
  }

  .detail-metric .label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.25rem;
  }

  .detail-metric .value {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .detail-metric .value.positive { color: #16a34a; }
  .detail-metric .value.negative { color: #dc2626; }

  .config-list {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    margin: 0;
  }

  .config-list dt {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
  }

  .config-list dd {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  .detail-tags {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .detail-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border, #e5e7eb);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    color: var(--text-muted, #6b7280);
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: var(--text-muted, #6b7280);
    margin: 0 0 1rem 0;
  }

  .empty-state button {
    padding: 0.5rem 1rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .filters-bar {
      flex-direction: column;
    }

    .strategy-grid {
      grid-template-columns: 1fr;
    }

    .metrics {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export default PublicStrategyBrowser;
