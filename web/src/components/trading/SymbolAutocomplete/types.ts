/**
 * SymbolAutocomplete Component Types
 */

import type { AssetCategory, SymbolSearchResult, SymbolSearchSource } from '../../../types/markets';

/**
 * Props for the main SymbolAutocomplete component
 */
export interface SymbolAutocompleteProps {
  /** Current symbol value */
  value: string;
  /** Callback when symbol is selected */
  onChange: (symbol: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** User's current holdings (symbols they own) */
  holdings?: string[];
  /** Recent trade symbols */
  recentTrades?: string[];
  /** Optional class name */
  className?: string;
  /** Test ID for e2e tests */
  'data-testid'?: string;
}

/**
 * Props for the dropdown container
 */
export interface SymbolDropdownProps {
  /** Grouped search results */
  results: GroupedSearchResults;
  /** Currently highlighted index */
  highlightedIndex: number;
  /** Selected category filter */
  selectedCategory: AssetCategory | null;
  /** Callback when category is selected */
  onCategoryChange: (category: AssetCategory | null) => void;
  /** Callback when symbol is selected */
  onSelect: (symbol: string) => void;
  /** Callback when item is hovered */
  onHighlight: (index: number) => void;
  /** Whether results are loading */
  isLoading: boolean;
  /** Search query for highlighting */
  query: string;
}

/**
 * Props for individual symbol option
 */
export interface SymbolOptionProps {
  /** Search result data */
  result: SymbolSearchResult;
  /** Whether this option is highlighted */
  isHighlighted: boolean;
  /** Callback when clicked */
  onClick: () => void;
  /** Callback when hovered */
  onMouseEnter: () => void;
  /** Search query for text highlighting */
  query: string;
  /** Index for ARIA */
  index: number;
}

/**
 * Props for category filter pills
 */
export interface CategoryFiltersProps {
  /** Currently selected category */
  selected: AssetCategory | null;
  /** Callback when category changes */
  onChange: (category: AssetCategory | null) => void;
  /** Available categories from results */
  availableCategories: AssetCategory[];
}

/**
 * Grouped search results by source
 */
export interface GroupedSearchResults {
  watchlist: SymbolSearchResult[];
  holdings: SymbolSearchResult[];
  recent: SymbolSearchResult[];
  search: SymbolSearchResult[];
  total: number;
}

/**
 * Search state for the hook
 */
export interface SymbolSearchState {
  query: string;
  selectedCategory: AssetCategory | null;
  results: GroupedSearchResults;
  isLoading: boolean;
  error: string | null;
}

/**
 * Category filter option
 */
export interface CategoryOption {
  value: AssetCategory | null;
  label: string;
  count?: number;
}

/**
 * Default category options for filters
 */
export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: null, label: 'All' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'etfs', label: 'ETFs' },
  { value: 'crypto', label: 'Crypto' },
];
