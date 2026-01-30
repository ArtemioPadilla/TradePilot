/**
 * useSymbolSearch Hook
 *
 * Custom hook for symbol search with debouncing, caching, and multi-source aggregation.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $watchlist, $watchlistSymbolSet } from '../../../stores/watchlist';
import { searchAssets } from '../../../lib/services/market-data';
import type { AssetCategory, SymbolSearchResult, MarketAsset } from '../../../types/markets';
import type { GroupedSearchResults } from './types';

const DEBOUNCE_DELAY = 300;
const MAX_RESULTS_PER_SECTION = 5;
const CACHE_TTL = 60000; // 1 minute

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: MarketAsset[]; timestamp: number }>();

interface UseSymbolSearchOptions {
  /** User's current holdings (symbols they own) */
  holdings?: string[];
  /** Recent trade symbols */
  recentTrades?: string[];
}

interface UseSymbolSearchResult {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Selected category filter */
  selectedCategory: AssetCategory | null;
  /** Set the category filter */
  setSelectedCategory: (category: AssetCategory | null) => void;
  /** Grouped search results */
  results: GroupedSearchResults;
  /** Whether search is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Clear the search */
  clear: () => void;
  /** Available categories from current results */
  availableCategories: AssetCategory[];
}

/**
 * Convert MarketAsset to SymbolSearchResult
 */
function toSearchResult(
  asset: MarketAsset,
  source: SymbolSearchResult['source'],
  watchlistSymbols: Set<string>,
  holdingsSet: Set<string>,
  holdingsMap: Map<string, number>
): SymbolSearchResult {
  return {
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    price: asset.price,
    change: asset.change,
    changePercent: asset.changePercent,
    source,
    isInWatchlist: watchlistSymbols.has(asset.symbol.toUpperCase()),
    isOwned: holdingsSet.has(asset.symbol.toUpperCase()),
    ownedQuantity: holdingsMap.get(asset.symbol.toUpperCase()),
  };
}

/**
 * Create an empty grouped results object
 */
function createEmptyResults(): GroupedSearchResults {
  return {
    watchlist: [],
    holdings: [],
    recent: [],
    search: [],
    total: 0,
  };
}

/**
 * Get cached results if valid
 */
function getCachedResults(cacheKey: string): MarketAsset[] | null {
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  return null;
}

/**
 * Set cached results
 */
function setCachedResults(cacheKey: string, results: MarketAsset[]): void {
  searchCache.set(cacheKey, { results, timestamp: Date.now() });
}

export function useSymbolSearch(options: UseSymbolSearchOptions = {}): UseSymbolSearchResult {
  const { holdings = [], recentTrades = [] } = options;

  // State
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [allAssets, setAllAssets] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get watchlist from store
  const watchlist = useStore($watchlist);
  const watchlistSymbols = useStore($watchlistSymbolSet);

  // Create sets/maps for efficient lookup
  const holdingsSet = useMemo(() => new Set(holdings.map(s => s.toUpperCase())), [holdings]);
  const holdingsMap = useMemo(() => {
    // For now, we don't have quantity info passed in, just symbols
    // This could be enhanced to pass full position data
    const map = new Map<string, number>();
    holdings.forEach(s => map.set(s.toUpperCase(), 0));
    return map;
  }, [holdings]);
  const recentTradesSet = useMemo(
    () => new Set(recentTrades.map(s => s.toUpperCase())),
    [recentTrades]
  );

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch assets when debounced query changes
  useEffect(() => {
    async function fetchAssets() {
      // Always fetch all assets for filtering (they come from mock data, so it's fast)
      // In production, you'd want to search server-side
      const cacheKey = `all:${selectedCategory || 'all'}`;
      const cached = getCachedResults(cacheKey);

      if (cached) {
        setAllAssets(cached);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const assets = await searchAssets('', selectedCategory || undefined);
        setAllAssets(assets);
        setCachedResults(cacheKey, assets);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load symbols');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, [selectedCategory]);

  // Compute grouped results
  const results = useMemo((): GroupedSearchResults => {
    if (!debouncedQuery.trim()) {
      // Show suggestions when no query
      const result = createEmptyResults();

      // Show watchlist items
      const watchlistResults = watchlist
        .slice(0, MAX_RESULTS_PER_SECTION)
        .map(item => {
          const asset = allAssets.find(a => a.symbol.toUpperCase() === item.symbol.toUpperCase());
          return {
            symbol: item.symbol,
            name: item.name,
            category: item.category,
            price: asset?.price,
            change: asset?.change,
            changePercent: asset?.changePercent,
            source: 'watchlist' as const,
            isInWatchlist: true,
            isOwned: holdingsSet.has(item.symbol.toUpperCase()),
            ownedQuantity: holdingsMap.get(item.symbol.toUpperCase()),
          };
        })
        .filter(
          item => !selectedCategory || item.category === selectedCategory
        );

      // Show holdings
      const holdingsResults = holdings
        .slice(0, MAX_RESULTS_PER_SECTION)
        .map(symbol => {
          const asset = allAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
          const watchlistItem = watchlist.find(
            w => w.symbol.toUpperCase() === symbol.toUpperCase()
          );
          return {
            symbol: symbol.toUpperCase(),
            name: asset?.name || watchlistItem?.name || symbol,
            category: asset?.category || watchlistItem?.category || 'stocks',
            price: asset?.price,
            change: asset?.change,
            changePercent: asset?.changePercent,
            source: 'holdings' as const,
            isInWatchlist: watchlistSymbols.has(symbol.toUpperCase()),
            isOwned: true,
            ownedQuantity: holdingsMap.get(symbol.toUpperCase()),
          } as SymbolSearchResult;
        })
        .filter(
          item =>
            !watchlistResults.some(w => w.symbol === item.symbol) &&
            (!selectedCategory || item.category === selectedCategory)
        );

      // Show recent trades
      const recentResults = recentTrades
        .slice(0, MAX_RESULTS_PER_SECTION)
        .map(symbol => {
          const asset = allAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
          const watchlistItem = watchlist.find(
            w => w.symbol.toUpperCase() === symbol.toUpperCase()
          );
          return {
            symbol: symbol.toUpperCase(),
            name: asset?.name || watchlistItem?.name || symbol,
            category: asset?.category || watchlistItem?.category || 'stocks',
            price: asset?.price,
            change: asset?.change,
            changePercent: asset?.changePercent,
            source: 'recent' as const,
            isInWatchlist: watchlistSymbols.has(symbol.toUpperCase()),
            isOwned: holdingsSet.has(symbol.toUpperCase()),
            ownedQuantity: holdingsMap.get(symbol.toUpperCase()),
          } as SymbolSearchResult;
        })
        .filter(
          item =>
            !watchlistResults.some(w => w.symbol === item.symbol) &&
            !holdingsResults.some(h => h.symbol === item.symbol) &&
            (!selectedCategory || item.category === selectedCategory)
        );

      result.watchlist = watchlistResults;
      result.holdings = holdingsResults;
      result.recent = recentResults;
      result.total =
        watchlistResults.length + holdingsResults.length + recentResults.length;

      return result;
    }

    // Filter assets by query
    const lowerQuery = debouncedQuery.toLowerCase();
    const matchingAssets = allAssets.filter(
      asset =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        asset.name.toLowerCase().includes(lowerQuery)
    );

    // Group results by source
    const result = createEmptyResults();
    const addedSymbols = new Set<string>();

    // First, add matching watchlist items
    for (const asset of matchingAssets) {
      if (
        watchlistSymbols.has(asset.symbol.toUpperCase()) &&
        result.watchlist.length < MAX_RESULTS_PER_SECTION
      ) {
        result.watchlist.push(
          toSearchResult(asset, 'watchlist', watchlistSymbols, holdingsSet, holdingsMap)
        );
        addedSymbols.add(asset.symbol.toUpperCase());
      }
    }

    // Then, add matching holdings
    for (const asset of matchingAssets) {
      if (
        holdingsSet.has(asset.symbol.toUpperCase()) &&
        !addedSymbols.has(asset.symbol.toUpperCase()) &&
        result.holdings.length < MAX_RESULTS_PER_SECTION
      ) {
        result.holdings.push(
          toSearchResult(asset, 'holdings', watchlistSymbols, holdingsSet, holdingsMap)
        );
        addedSymbols.add(asset.symbol.toUpperCase());
      }
    }

    // Then, add matching recent trades
    for (const asset of matchingAssets) {
      if (
        recentTradesSet.has(asset.symbol.toUpperCase()) &&
        !addedSymbols.has(asset.symbol.toUpperCase()) &&
        result.recent.length < MAX_RESULTS_PER_SECTION
      ) {
        result.recent.push(
          toSearchResult(asset, 'recent', watchlistSymbols, holdingsSet, holdingsMap)
        );
        addedSymbols.add(asset.symbol.toUpperCase());
      }
    }

    // Finally, add remaining search results
    for (const asset of matchingAssets) {
      if (
        !addedSymbols.has(asset.symbol.toUpperCase()) &&
        result.search.length < MAX_RESULTS_PER_SECTION
      ) {
        result.search.push(
          toSearchResult(asset, 'search', watchlistSymbols, holdingsSet, holdingsMap)
        );
        addedSymbols.add(asset.symbol.toUpperCase());
      }
    }

    result.total =
      result.watchlist.length +
      result.holdings.length +
      result.recent.length +
      result.search.length;

    return result;
  }, [
    debouncedQuery,
    selectedCategory,
    allAssets,
    watchlist,
    watchlistSymbols,
    holdings,
    holdingsSet,
    holdingsMap,
    recentTrades,
    recentTradesSet,
  ]);

  // Get available categories from results
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

  // Clear function
  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedCategory(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    isLoading,
    error,
    clear,
    availableCategories,
  };
}

export default useSymbolSearch;
