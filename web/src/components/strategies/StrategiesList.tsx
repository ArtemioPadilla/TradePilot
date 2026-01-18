/**
 * Strategies List Component
 *
 * Displays a list of user's trading strategies with filtering and actions.
 */

import { useState, useEffect } from 'react';
import type {
  Strategy,
  StrategyStatus,
  StrategyType,
} from '../../types/strategies';
import {
  getStrategyTypeName,
  getStrategyStatusInfo,
  getRebalanceFrequencyName,
} from '../../types/strategies';

export interface StrategiesListProps {
  strategies?: Strategy[];
  isLoading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (strategy: Strategy) => void;
  onDuplicate?: (strategy: Strategy) => void;
  onDelete?: (strategy: Strategy) => void;
  onToggleFavorite?: (strategy: Strategy) => void;
  onStatusChange?: (strategy: Strategy, status: StrategyStatus) => void;
  onRunBacktest?: (strategy: Strategy) => void;
}

export function StrategiesList({
  strategies = [],
  isLoading = false,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onStatusChange,
  onRunBacktest,
}: StrategiesListProps) {
  const [filterStatus, setFilterStatus] = useState<StrategyStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<StrategyType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'performance'>('updated');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredStrategies = strategies
    .filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterType !== 'all' && s.config.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'performance') {
        return (b.lastBacktestReturn || 0) - (a.lastBacktestReturn || 0);
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const handleDelete = (strategy: Strategy) => {
    setShowDeleteConfirm(strategy.id);
  };

  const confirmDelete = (strategy: Strategy) => {
    onDelete?.(strategy);
    setShowDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="strategies-list" data-testid="strategies-list">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading strategies...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="strategies-list" data-testid="strategies-list">
      {/* Header */}
      <div className="list-header">
        <div className="header-left">
          <h2>My Strategies</h2>
          <span className="strategy-count">{strategies.length} strategies</span>
        </div>
        <button
          className="create-button"
          onClick={onCreateNew}
          data-testid="create-strategy-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Strategy
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
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
            data-testid="search-input"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StrategyStatus | 'all')}
          className="filter-select"
          data-testid="status-filter"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

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
          onChange={(e) => setSortBy(e.target.value as 'name' | 'updated' | 'performance')}
          className="filter-select"
          data-testid="sort-select"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name</option>
          <option value="performance">Performance</option>
        </select>
      </div>

      {/* Strategy Cards */}
      {filteredStrategies.length === 0 ? (
        <div className="empty-state">
          {strategies.length === 0 ? (
            <>
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <h3>No strategies yet</h3>
              <p>Create your first trading strategy to get started</p>
              <button className="create-button" onClick={onCreateNew}>
                Create Strategy
              </button>
            </>
          ) : (
            <>
              <p>No strategies match your filters</p>
              <button
                className="clear-filters-button"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterType('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="strategy-cards">
          {filteredStrategies.map((strategy) => {
            const statusInfo = getStrategyStatusInfo(strategy.status);
            return (
              <div
                key={strategy.id}
                className="strategy-card"
                data-testid={`strategy-card-${strategy.id}`}
              >
                <div className="card-header">
                  <div className="card-title-row">
                    <h3>{strategy.name}</h3>
                    <button
                      className={`favorite-button ${strategy.isFavorite ? 'active' : ''}`}
                      onClick={() => onToggleFavorite?.(strategy)}
                      aria-label={strategy.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={strategy.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>
                  <div className="card-meta">
                    <span className={`status-badge status-${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="type-badge">
                      {getStrategyTypeName(strategy.config.type)}
                    </span>
                    {strategy.isPublic && (
                      <span className="public-badge" title="Public strategy">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                <p className="card-description">
                  {strategy.description || 'No description'}
                </p>

                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Universe</span>
                    <span className="detail-value">{strategy.config.universe.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rebalance</span>
                    <span className="detail-value">
                      {getRebalanceFrequencyName(strategy.config.rebalanceFrequency)}
                    </span>
                  </div>
                  {strategy.lastBacktestReturn !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Return</span>
                      <span className={`detail-value ${strategy.lastBacktestReturn >= 0 ? 'positive' : 'negative'}`}>
                        {strategy.lastBacktestReturn >= 0 ? '+' : ''}{strategy.lastBacktestReturn.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {strategy.lastBacktestSharpe !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Sharpe</span>
                      <span className="detail-value">{strategy.lastBacktestSharpe.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {strategy.tags.length > 0 && (
                  <div className="card-tags">
                    {strategy.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {strategy.tags.length > 3 && (
                      <span className="tag more">+{strategy.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="card-footer">
                  <span className="updated-at">
                    Updated {formatRelativeTime(strategy.updatedAt)}
                  </span>
                  <div className="card-actions">
                    <button
                      className="action-button"
                      onClick={() => onRunBacktest?.(strategy)}
                      title="Run Backtest"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <button
                      className="action-button"
                      onClick={() => onEdit?.(strategy)}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="action-button"
                      onClick={() => onDuplicate?.(strategy)}
                      title="Duplicate"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDelete(strategy)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === strategy.id && (
                  <div className="delete-confirm-overlay">
                    <div className="delete-confirm-modal">
                      <p>Delete "{strategy.name}"?</p>
                      <div className="confirm-actions">
                        <button
                          className="cancel-button"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => confirmDelete(strategy)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const styles = `
  .strategies-list {
    padding: 1rem;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .list-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  .strategy-count {
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .create-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: var(--accent, #6366f1);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .create-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }

  .filters {
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

  .search-box input:focus {
    outline: none;
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

  .strategy-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .strategy-card {
    position: relative;
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
    margin-bottom: 0.75rem;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .card-title-row h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  .favorite-button {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    transition: color 0.2s;
  }

  .favorite-button:hover,
  .favorite-button.active {
    color: #f59e0b;
  }

  .card-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .status-badge,
  .type-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .status-badge.status-green {
    background-color: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .status-badge.status-yellow {
    background-color: rgba(234, 179, 8, 0.1);
    color: #ca8a04;
  }

  .status-badge.status-red {
    background-color: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  .status-badge.status-gray {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-muted, #6b7280);
  }

  .type-badge {
    background-color: rgba(99, 102, 241, 0.1);
    color: var(--accent, #6366f1);
  }

  .public-badge {
    color: var(--text-muted, #6b7280);
  }

  .card-description {
    color: var(--text-secondary, #4b5563);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .detail-value.positive {
    color: #16a34a;
  }

  .detail-value.negative {
    color: #dc2626;
  }

  .card-tags {
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

  .tag.more {
    color: var(--text-muted, #6b7280);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border, #e5e7eb);
  }

  .updated-at {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .card-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-primary, #111827);
  }

  .action-button.delete:hover {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .delete-confirm-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg, 0.5rem);
  }

  .delete-confirm-modal {
    text-align: center;
  }

  .delete-confirm-modal p {
    margin: 0 0 1rem 0;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .confirm-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .cancel-button,
  .delete-button {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button {
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .cancel-button:hover {
    background-color: var(--bg-secondary, #e5e7eb);
  }

  .delete-button {
    background-color: #ef4444;
    border: none;
    color: white;
  }

  .delete-button:hover {
    background-color: #dc2626;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px dashed var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .empty-icon {
    color: var(--text-muted, #6b7280);
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.5rem 0;
  }

  .clear-filters-button {
    padding: 0.5rem 1rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    color: var(--text-primary, #111827);
    cursor: pointer;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
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

  @media (max-width: 640px) {
    .list-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .create-button {
      justify-content: center;
    }

    .filters {
      flex-direction: column;
    }

    .search-box {
      width: 100%;
    }

    .filter-select {
      width: 100%;
    }

    .strategy-cards {
      grid-template-columns: 1fr;
    }
  }
`;
