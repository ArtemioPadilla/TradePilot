/**
 * SymbolAutocomplete Component
 *
 * Smart symbol search input with autocomplete dropdown.
 * Shows user preferences (watchlist, holdings, recent) first.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SymbolAutocompleteProps } from './types';
import { useSymbolSearch } from './useSymbolSearch';
import { SymbolDropdown } from './SymbolDropdown';

export function SymbolAutocomplete({
  value,
  onChange,
  placeholder = 'Search symbol...',
  disabled = false,
  error = false,
  errorMessage,
  holdings = [],
  recentTrades = [],
  className = '',
  'data-testid': testId = 'symbol-autocomplete',
}: SymbolAutocompleteProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search hook
  const {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    isLoading,
    error: searchError,
    clear,
    availableCategories,
  } = useSymbolSearch({ holdings, recentTrades });

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return [
      ...results.watchlist,
      ...results.holdings,
      ...results.recent,
      ...results.search,
    ];
  }, [results]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.toUpperCase();
      setQuery(newValue);
      onChange(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    },
    [onChange, setQuery]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handle symbol selection
  const handleSelect = useCallback(
    (symbol: string) => {
      onChange(symbol);
      setQuery(symbol);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, setQuery]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < flatResults.length) {
            handleSelect(flatResults[highlightedIndex].symbol);
          } else if (query) {
            // If no item highlighted, use the current query
            handleSelect(query);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;

        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, flatResults, highlightedIndex, query, handleSelect]
  );

  // Handle highlight on hover
  const handleHighlight = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync input with external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear button handler
  const handleClear = useCallback(() => {
    onChange('');
    clear();
    inputRef.current?.focus();
  }, [onChange, clear]);

  return (
    <div
      ref={containerRef}
      className={`symbol-autocomplete ${className}`}
      data-testid={testId}
    >
      <div className={`input-wrapper ${error ? 'has-error' : ''} ${isOpen ? 'is-open' : ''}`}>
        {/* Search Icon */}
        <svg
          className="input-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="symbol-dropdown"
          aria-activedescendant={
            highlightedIndex >= 0 ? `symbol-option-${highlightedIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-invalid={error}
          aria-describedby={errorMessage ? 'symbol-error' : undefined}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="symbol-input"
          data-testid={`${testId}-input`}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div id="symbol-error" className="error-text" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className="error-text" role="alert">
          {searchError}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <SymbolDropdown
          results={results}
          highlightedIndex={highlightedIndex}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onSelect={handleSelect}
          onHighlight={handleHighlight}
          isLoading={isLoading}
          query={query}
        />
      )}

      <style>{`
        .symbol-autocomplete {
          position: relative;
          width: 100%;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
        }

        .input-wrapper:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
        }

        .input-wrapper.has-error {
          border-color: var(--negative);
        }

        .input-wrapper.has-error:focus-within {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }

        .input-icon {
          flex-shrink: 0;
          color: var(--text-muted);
        }

        .symbol-input {
          flex: 1;
          padding: 0.625rem 0;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
        }

        .symbol-input::placeholder {
          color: var(--text-muted);
          font-weight: 400;
        }

        .symbol-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .clear-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-button:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .error-text {
          margin-top: 0.375rem;
          font-size: 0.75rem;
          color: var(--negative);
        }
      `}</style>
    </div>
  );
}

export default SymbolAutocomplete;
