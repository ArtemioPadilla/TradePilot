/**
 * SymbolAutocomplete Component Exports
 */

export { SymbolAutocomplete } from './SymbolAutocomplete';
export { SymbolDropdown } from './SymbolDropdown';
export { SymbolOption } from './SymbolOption';
export { CategoryFilters } from './CategoryFilters';
export { useSymbolSearch } from './useSymbolSearch';

export type {
  SymbolAutocompleteProps,
  SymbolDropdownProps,
  SymbolOptionProps,
  CategoryFiltersProps,
  GroupedSearchResults,
  SymbolSearchState,
} from './types';

// Re-export default
export { SymbolAutocomplete as default } from './SymbolAutocomplete';
