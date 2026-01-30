/**
 * SymbolDropdown Component
 *
 * Dropdown container with categorized sections for symbol search results.
 */

import { useMemo } from 'react';
import type { SymbolDropdownProps } from './types';
import { CategoryFilters } from './CategoryFilters';
import { SymbolOption } from './SymbolOption';
import type { AssetCategory, SymbolSearchResult } from '../../../types/markets';

// Section configuration
const SECTIONS = [
  { key: 'watchlist', title: 'Your Watchlist', icon: 'star' },
  { key: 'holdings', title: 'Your Holdings', icon: 'portfolio' },
  { key: 'recent', title: 'Recent Trades', icon: 'clock' },
  { key: 'search', title: 'All Results', icon: 'search' },
] as const;

/**
 * Get icon SVG for section
 */
function SectionIcon({ type }: { type: string }) {
  switch (type) {
    case 'star':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    case 'portfolio':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
      );
    case 'search':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      );
    default:
      return null;
  }
}

export function SymbolDropdown({
  results,
  highlightedIndex,
  selectedCategory,
  onCategoryChange,
  onSelect,
  onHighlight,
  isLoading,
  query,
}: SymbolDropdownProps) {
  // Calculate available categories from all results
  const availableCategories = useMemo((): AssetCategory[] => {
    const categories = new Set<AssetCategory>();
    const allResults = [
      ...results.watchlist,
      ...results.holdings,
      ...results.recent,
      ...results.search,
    ];
    for (const result of allResults) {
      categories.add(result.category);
    }
    return Array.from(categories);
  }, [results]);

  // Flatten all results for index tracking
  const flatResults = useMemo((): SymbolSearchResult[] => {
    return [
      ...results.watchlist,
      ...results.holdings,
      ...results.recent,
      ...results.search,
    ];
  }, [results]);

  // Calculate section start indices
  const sectionIndices = useMemo(() => {
    let index = 0;
    return {
      watchlist: { start: index, end: index += results.watchlist.length },
      holdings: { start: index, end: index += results.holdings.length },
      recent: { start: index, end: index += results.recent.length },
      search: { start: index, end: index += results.search.length },
    };
  }, [results]);

  // Check if there are any results
  const hasResults = results.total > 0;

  return (
    <div
      className="symbol-dropdown"
      role="listbox"
      aria-label="Symbol suggestions"
    >
      {/* Category Filters */}
      <CategoryFilters
        selected={selectedCategory}
        onChange={onCategoryChange}
        availableCategories={availableCategories}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="dropdown-loading">
          <div className="loading-spinner" />
          <span>Loading symbols...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasResults && query && (
        <div className="dropdown-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <span>No symbols found for "{query}"</span>
        </div>
      )}

      {/* Results Sections */}
      {!isLoading && hasResults && (
        <div className="dropdown-results">
          {SECTIONS.map(section => {
            const sectionResults = results[section.key];
            if (sectionResults.length === 0) return null;

            const indices = sectionIndices[section.key];

            return (
              <div key={section.key} className="dropdown-section">
                <div className="section-header">
                  <SectionIcon type={section.icon} />
                  <span>{section.title}</span>
                </div>
                <div className="section-items">
                  {sectionResults.map((result, idx) => {
                    const globalIndex = indices.start + idx;
                    return (
                      <SymbolOption
                        key={result.symbol}
                        result={result}
                        isHighlighted={highlightedIndex === globalIndex}
                        onClick={() => onSelect(result.symbol)}
                        onMouseEnter={() => onHighlight(globalIndex)}
                        query={query}
                        index={globalIndex}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyboard Hints */}
      {hasResults && (
        <div className="dropdown-hints">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      )}

      <style>{`
        .symbol-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 0.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          max-height: 400px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dropdown-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dropdown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem 1rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .dropdown-results {
          overflow-y: auto;
          flex: 1;
        }

        .dropdown-section {
          border-bottom: 1px solid var(--border);
        }

        .dropdown-section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--bg-tertiary);
        }

        .section-items {
          /* Items are rendered directly */
        }

        .dropdown-hints {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 0.5rem;
          border-top: 1px solid var(--border);
          background: var(--bg-tertiary);
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .dropdown-hints span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .dropdown-hints kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.125rem 0.25rem;
          font-family: inherit;
          font-size: 0.625rem;
          font-weight: 500;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}

export default SymbolDropdown;
