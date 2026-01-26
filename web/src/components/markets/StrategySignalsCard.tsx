/**
 * StrategySignalsCard Component
 *
 * Shows assets with strategy signal indicators (momentum, mean reversion, etc.)
 */

import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketAsset, StrategySignal, StrategySignalType } from '../../types/markets';
import { formatCurrency, formatPercent } from '../../lib/utils';

interface AssetWithSignal extends MarketAsset {
  signal: StrategySignal;
}

interface StrategySignalsCardProps {
  assets: AssetWithSignal[];
  signalType: StrategySignalType;
  onSignalTypeChange?: (type: StrategySignalType) => void;
  onAssetClick?: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string, name: string) => void;
  isLoading?: boolean;
}

const SIGNAL_TYPE_LABELS: Record<StrategySignalType, string> = {
  momentum: 'Momentum',
  mean_reversion: 'Mean Reversion',
  smart_beta: 'Smart Beta',
  equal_weight: 'Equal Weight',
  risk_parity: 'Risk Parity',
};

const SIGNAL_COLORS: Record<StrategySignal['signal'], string> = {
  strong_buy: '#22c55e',
  buy: '#86efac',
  neutral: '#94a3b8',
  sell: '#fca5a5',
  strong_sell: '#ef4444',
};

const SIGNAL_LABELS: Record<StrategySignal['signal'], string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  neutral: 'Neutral',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

export default function StrategySignalsCard({
  assets,
  signalType,
  onSignalTypeChange,
  onAssetClick,
  isLoading = false,
}: StrategySignalsCardProps) {
  const getSignalIcon = (signal: StrategySignal['signal']) => {
    switch (signal) {
      case 'strong_buy':
      case 'buy':
        return <TrendingUp size={14} />;
      case 'strong_sell':
      case 'sell':
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getSignalDetails = (signal: StrategySignal) => {
    switch (signal.type) {
      case 'momentum':
        return signal.details?.lookbackReturn !== undefined
          ? `${signal.details.lookbackReturn > 0 ? '+' : ''}${signal.details.lookbackReturn.toFixed(1)}% (30d)`
          : null;
      case 'mean_reversion':
        return signal.details?.zScore !== undefined
          ? `Z-Score: ${signal.details.zScore.toFixed(2)}`
          : null;
      case 'smart_beta':
        return signal.details?.factorScores
          ? `Factors: ${Object.keys(signal.details.factorScores).length}`
          : null;
      default:
        return null;
    }
  };

  return (
    <div className="strategy-signals-card">
      <div className="card-header">
        <div className="header-left">
          <Activity className="header-icon" size={20} />
          <h3>Strategy Signals</h3>
        </div>

        {onSignalTypeChange && (
          <select
            className="signal-type-select"
            value={signalType}
            onChange={e => onSignalTypeChange(e.target.value as StrategySignalType)}
          >
            {Object.entries(SIGNAL_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-state">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <Activity className="empty-icon" size={32} />
            <p className="empty-title">No signals available</p>
            <p className="empty-description">
              Select assets to calculate strategy signals
            </p>
          </div>
        ) : (
          <>
            <div className="signal-legend">
              {(['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell'] as const).map(
                signal => (
                  <div key={signal} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: SIGNAL_COLORS[signal] }}
                    />
                    <span className="legend-label">{SIGNAL_LABELS[signal]}</span>
                  </div>
                )
              )}
            </div>

            <div className="signals-list">
              {assets.map(asset => {
                const details = getSignalDetails(asset.signal);

                return (
                  <div
                    key={asset.symbol}
                    className="signal-item"
                    onClick={() => onAssetClick?.(asset.symbol)}
                  >
                    <div className="signal-indicator">
                      <div
                        className="signal-badge"
                        style={{ backgroundColor: SIGNAL_COLORS[asset.signal.signal] }}
                      >
                        {getSignalIcon(asset.signal.signal)}
                      </div>
                      <div className="signal-score">
                        <span className="score-value">{Math.round(asset.signal.score)}</span>
                        <span className="score-label">Score</span>
                      </div>
                    </div>

                    <div className="asset-info">
                      <div className="asset-main">
                        <span className="symbol">{asset.symbol}</span>
                        <span className="name">{asset.name}</span>
                      </div>
                      <div className="asset-details">
                        <span className="price">{formatCurrency(asset.price)}</span>
                        <span
                          className={`change ${asset.changePercent >= 0 ? 'positive' : 'negative'}`}
                        >
                          {formatPercent(asset.changePercent)}
                        </span>
                      </div>
                    </div>

                    <div className="signal-info">
                      <span
                        className="signal-label"
                        style={{ color: SIGNAL_COLORS[asset.signal.signal] }}
                      >
                        {SIGNAL_LABELS[asset.signal.signal]}
                      </span>
                      {details && <span className="signal-details">{details}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        .strategy-signals-card {
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
          color: #a855f7;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .signal-type-select {
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          outline: none;
        }

        .signal-type-select:focus {
          border-color: var(--accent);
        }

        .card-content {
          padding: 1rem 1.25rem;
        }

        .signal-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-label {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .signals-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .signal-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .signal-item:hover {
          background-color: var(--bg-primary);
        }

        .signal-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .signal-badge {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: white;
        }

        .signal-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 32px;
        }

        .score-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .score-label {
          font-size: 0.5rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .asset-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }

        .asset-main {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .symbol {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .name {
          font-size: 0.6875rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .asset-details {
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

        .signal-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
          min-width: 80px;
        }

        .signal-label {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .signal-details {
          font-size: 0.625rem;
          color: var(--text-muted);
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
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .loading-state {
          padding: 0.5rem 0;
        }

        .skeleton-row {
          height: 64px;
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

        @media (max-width: 640px) {
          .signal-legend {
            gap: 0.5rem;
          }

          .asset-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .asset-details {
            flex-direction: row;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
