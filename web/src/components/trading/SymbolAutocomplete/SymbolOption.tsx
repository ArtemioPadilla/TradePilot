/**
 * SymbolOption Component
 *
 * Individual symbol option in the autocomplete dropdown.
 * Shows symbol, name, price, change, and status icons.
 */

import type { JSX } from 'react';
import type { SymbolOptionProps } from './types';

/**
 * Highlight matching text in a string
 */
function highlightMatch(text: string, query: string): JSX.Element {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="highlight">{match}</mark>
      {after}
    </>
  );
}

/**
 * Format price with currency
 */
function formatPrice(price: number | undefined): string {
  if (price === undefined) return '--';
  return `$${price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format change percentage
 */
function formatChange(change: number | undefined): string {
  if (change === undefined) return '--';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function SymbolOption({
  result,
  isHighlighted,
  onClick,
  onMouseEnter,
  query,
  index,
}: SymbolOptionProps) {
  const isPositive = (result.changePercent ?? 0) >= 0;

  return (
    <div
      role="option"
      aria-selected={isHighlighted}
      id={`symbol-option-${index}`}
      className={`symbol-option ${isHighlighted ? 'highlighted' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="option-main">
        <div className="option-symbol-row">
          <span className="option-symbol">
            {highlightMatch(result.symbol, query)}
          </span>
          <div className="option-badges">
            {result.isInWatchlist && (
              <span className="badge badge-watchlist" title="In watchlist">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
            )}
            {result.isOwned && (
              <span className="badge badge-holdings" title="In portfolio">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </span>
            )}
          </div>
        </div>
        <span className="option-name">
          {highlightMatch(result.name, query)}
        </span>
      </div>

      <div className="option-price">
        <span className="price-value">{formatPrice(result.price)}</span>
        <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {formatChange(result.changePercent)}
        </span>
      </div>

      <style>{`
        .symbol-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0.75rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .symbol-option:hover,
        .symbol-option.highlighted {
          background: var(--bg-tertiary);
        }

        .option-main {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
          flex: 1;
        }

        .option-symbol-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .option-symbol {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .option-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .option-badges {
          display: flex;
          gap: 0.25rem;
        }

        .badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 4px;
        }

        .badge-watchlist {
          color: var(--warning);
          background: var(--warning-bg);
        }

        .badge-holdings {
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.15);
        }

        .option-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
          margin-left: 0.75rem;
        }

        .price-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .price-change {
          font-size: 0.75rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .price-change.positive {
          color: var(--positive);
        }

        .price-change.negative {
          color: var(--negative);
        }

        .highlight {
          background: rgba(var(--accent-rgb), 0.2);
          color: var(--accent);
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
}

export default SymbolOption;
