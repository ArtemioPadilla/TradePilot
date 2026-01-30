/**
 * CategoryFilters Component
 *
 * Filter pills for filtering symbols by category.
 */

import type { CategoryFiltersProps } from './types';
import { CATEGORY_OPTIONS } from './types';

export function CategoryFilters({
  selected,
  onChange,
  availableCategories,
}: CategoryFiltersProps) {
  // Only show categories that have results (plus "All")
  const visibleOptions = CATEGORY_OPTIONS.filter(
    option => option.value === null || availableCategories.includes(option.value!)
  );

  return (
    <div className="category-filters" role="tablist" aria-label="Filter by category">
      {visibleOptions.map(option => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value ?? 'all'}
            role="tab"
            aria-selected={isSelected}
            className={`filter-pill ${isSelected ? 'selected' : ''}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}

      <style>{`
        .category-filters {
          display: flex;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .category-filters::-webkit-scrollbar {
          display: none;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .filter-pill:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .filter-pill.selected {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .filter-pill:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default CategoryFilters;
