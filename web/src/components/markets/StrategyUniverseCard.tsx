import { appPath } from '../../lib/utils/paths';
/**
 * StrategyUniverseCard Component
 *
 * Shows assets in user's strategy universes with selector.
 */

import { useState, useMemo } from 'react';
import { Target, ChevronDown, ExternalLink, Play } from 'lucide-react';
import type { MarketAsset, AssetUniverse } from '../../types/markets';
import { formatCurrency, formatPercent } from '../../lib/utils';
import {
  getUniverseSymbols,
  UNIVERSE_DISPLAY_NAMES,
  UNIVERSE_DESCRIPTIONS,
} from '../../data/universes';

interface Strategy {
  id: string;
  name: string;
  universe: AssetUniverse;
  customSymbols?: string[];
  type: string;
}

interface StrategyUniverseCardProps {
  strategies: Strategy[];
  marketData: Map<string, MarketAsset>;
  watchlistSymbols?: string[];
  selectedStrategyId?: string;
  onStrategySelect: (strategyId: string) => void;
  onViewStrategy?: (strategyId: string) => void;
  onRunBacktest?: (strategyId: string) => void;
  onAssetClick?: (symbol: string) => void;
  isLoading?: boolean;
}

export default function StrategyUniverseCard({
  strategies,
  marketData,
  watchlistSymbols = [],
  selectedStrategyId,
  onStrategySelect,
  onViewStrategy,
  onRunBacktest,
  onAssetClick,
  isLoading = false,
}: StrategyUniverseCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const watchlistSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const universeAssets = useMemo(() => {
    if (!selectedStrategy) return [];

    let symbols: string[];
    if (selectedStrategy.universe === 'custom') {
      symbols = selectedStrategy.customSymbols || [];
    } else {
      symbols = getUniverseSymbols(selectedStrategy.universe);
    }

    // Get market data for these symbols
    const assets: MarketAsset[] = [];
    for (const symbol of symbols) {
      const asset = marketData.get(symbol.toUpperCase());
      if (asset) {
        assets.push(asset);
      }
    }

    // Sort by change percent descending
    return assets.sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  }, [selectedStrategy, marketData]);

  const matchingWatchlist = useMemo(() => {
    if (!selectedStrategy) return [];

    let symbols: string[];
    if (selectedStrategy.universe === 'custom') {
      symbols = selectedStrategy.customSymbols || [];
    } else {
      symbols = getUniverseSymbols(selectedStrategy.universe);
    }

    return symbols.filter(s => watchlistSet.has(s.toUpperCase()));
  }, [selectedStrategy, watchlistSet]);

  return (
    <div className="strategy-universe-card">
      <div className="card-header">
        <div className="header-left">
          <Target className="header-icon" size={20} />
          <h3>Strategy Universe</h3>
        </div>

        {strategies.length > 0 && (
          <div className="strategy-selector">
            <button
              className="selector-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{selectedStrategy?.name || 'Select strategy'}</span>
              <ChevronDown
                size={16}
                className={isDropdownOpen ? 'rotated' : ''}
              />
            </button>
            {isDropdownOpen && (
              <div className="selector-dropdown">
                {strategies.map(strategy => (
                  <button
                    key={strategy.id}
                    className={`dropdown-item ${
                      strategy.id === selectedStrategyId ? 'active' : ''
                    }`}
                    onClick={() => {
                      onStrategySelect(strategy.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="strategy-name">{strategy.name}</span>
                    <span className="strategy-type">{strategy.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-state">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : strategies.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-icon" size={32} />
            <p className="empty-title">No strategies yet</p>
            <p className="empty-description">
              Create a strategy to see which assets it would select
            </p>
            <a href={appPath("/dashboard/strategies")} className="create-link">
              Create Strategy
            </a>
          </div>
        ) : !selectedStrategy ? (
          <div className="empty-state">
            <p className="empty-title">Select a strategy</p>
            <p className="empty-description">
              Choose a strategy to preview its universe
            </p>
          </div>
        ) : (
          <>
            <div className="universe-info">
              <div className="universe-name">
                {UNIVERSE_DISPLAY_NAMES[selectedStrategy.universe]}
              </div>
              <div className="universe-description">
                {UNIVERSE_DESCRIPTIONS[selectedStrategy.universe]}
              </div>
              {matchingWatchlist.length > 0 && (
                <div className="watchlist-match">
                  <span className="match-count">{matchingWatchlist.length}</span>
                  watchlist items in this universe
                </div>
              )}
            </div>

            <div className="universe-assets">
              <div className="assets-header">
                <span>Top performers in universe</span>
              </div>
              <div className="assets-list">
                {universeAssets.map(asset => {
                  const isPositive = asset.change >= 0;
                  const isInWatchlist = watchlistSet.has(
                    asset.symbol.toUpperCase()
                  );

                  return (
                    <div
                      key={asset.symbol}
                      className={`asset-row ${isInWatchlist ? 'in-watchlist' : ''}`}
                      onClick={() => onAssetClick?.(asset.symbol)}
                    >
                      <div className="asset-info">
                        <span className="symbol">{asset.symbol}</span>
                        <span className="name">{asset.name}</span>
                      </div>
                      <div className="asset-price">
                        <span className="price">
                          {formatCurrency(asset.price)}
                        </span>
                        <span
                          className={`change ${isPositive ? 'positive' : 'negative'}`}
                        >
                          {formatPercent(asset.changePercent)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-actions">
              {onViewStrategy && (
                <button
                  className="action-btn"
                  onClick={() => onViewStrategy(selectedStrategy.id)}
                >
                  <ExternalLink size={14} />
                  View Strategy
                </button>
              )}
              {onRunBacktest && (
                <button
                  className="action-btn primary"
                  onClick={() => onRunBacktest(selectedStrategy.id)}
                >
                  <Play size={14} />
                  Run Backtest
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .strategy-universe-card {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          color: var(--accent);
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .strategy-selector {
          position: relative;
        }

        .selector-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .selector-trigger:hover {
          border-color: var(--accent);
        }

        .selector-trigger svg {
          transition: transform 0.15s ease;
        }

        .selector-trigger svg.rotated {
          transform: rotate(180deg);
        }

        .selector-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 0.25rem);
          min-width: 200px;
          background-color: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          padding: 0.375rem;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          text-align: left;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .dropdown-item:hover {
          background-color: var(--bg-tertiary);
        }

        .dropdown-item.active {
          background-color: rgba(var(--accent-rgb), 0.1);
        }

        .strategy-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .strategy-type {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .card-content {
          padding: 1rem 1.25rem;
        }

        .universe-info {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .universe-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .universe-description {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .watchlist-match {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .match-count {
          font-weight: 600;
          color: var(--accent);
          margin-right: 0.25rem;
        }

        .assets-header {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .asset-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0.75rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .asset-row:hover {
          background-color: var(--bg-primary);
        }

        .asset-row.in-watchlist {
          border-left: 2px solid var(--accent);
        }

        .asset-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .symbol {
          font-weight: 600;
          font-size: 0.8125rem;
          color: var(--text-primary);
        }

        .name {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .asset-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .price {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .change {
          font-size: 0.6875rem;
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .change.positive {
          color: var(--positive);
        }

        .change.negative {
          color: var(--negative);
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .action-btn.primary {
          background-color: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .action-btn.primary:hover {
          filter: brightness(1.1);
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          opacity: 0.5;
        }

        .empty-title {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .empty-description {
          margin: 0 0 1rem 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .create-link {
          font-size: 0.875rem;
          color: var(--accent);
          text-decoration: none;
        }

        .create-link:hover {
          text-decoration: underline;
        }

        .loading-state {
          padding: 0.5rem 0;
        }

        .skeleton-row {
          height: 48px;
          background: linear-gradient(
            90deg,
            var(--bg-tertiary) 25%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
