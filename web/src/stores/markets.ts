/**
 * Markets Store
 *
 * State management for market data, filtering, and sorting.
 */

import { atom, computed } from 'nanostores';
import type {
  MarketAsset,
  AssetCategory,
  PerformancePeriod,
  AssetSortConfig,
  MarketAssetWithContext,
} from '../types/markets';
import {
  getMarketAssets,
  getTopPerformers,
  getLowestPerformers,
} from '../lib/services/market-data';

// ============================================================================
// State atoms
// ============================================================================

/** All market assets loaded */
export const $marketAssets = atom<MarketAsset[]>([]);

/** Currently selected category filter */
export const $selectedCategory = atom<AssetCategory | 'all'>('stocks');

/** Selected performance period for top/lowest cards */
export const $performancePeriod = atom<PerformancePeriod>('day');

/** Search query for filtering */
export const $searchQuery = atom<string>('');

/** Sort configuration */
export const $sortConfig = atom<AssetSortConfig>({
  field: 'changePercent',
  direction: 'desc',
});

/** Loading state */
export const $marketDataLoading = atom<boolean>(false);

/** Last refresh timestamp */
export const $lastRefresh = atom<Date | null>(null);

/** Error state */
export const $marketDataError = atom<string | null>(null);

/** Top performers cache */
export const $topPerformers = atom<MarketAsset[]>([]);

/** Lowest performers cache */
export const $lowestPerformers = atom<MarketAsset[]>([]);

// ============================================================================
// Computed values
// ============================================================================

/** Assets filtered by category */
export const $assetsByCategory = computed(
  [$marketAssets, $selectedCategory],
  (assets, category) => {
    if (category === 'all') return assets;
    return assets.filter(asset => asset.category === category);
  }
);

/** Assets filtered by search query */
export const $filteredAssets = computed(
  [$assetsByCategory, $searchQuery],
  (assets, query) => {
    if (!query.trim()) return assets;
    const lowerQuery = query.toLowerCase();
    return assets.filter(
      asset =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        asset.name.toLowerCase().includes(lowerQuery)
    );
  }
);

/** Sorted and filtered assets */
export const $sortedAssets = computed(
  [$filteredAssets, $sortConfig],
  (assets, config) => {
    return [...assets].sort((a, b) => {
      const aValue = getFieldValue(a, config.field);
      const bValue = getFieldValue(b, config.field);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;

      return config.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }
);

/** Asset count by category */
export const $categoryAssetCounts = computed($marketAssets, assets => {
  const counts: Record<AssetCategory | 'all', number> = {
    all: assets.length,
    stocks: 0,
    etfs: 0,
    bonds: 0,
    'fixed-income': 0,
    commodities: 0,
    crypto: 0,
  };

  for (const asset of assets) {
    counts[asset.category]++;
  }

  return counts;
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Load market data from service
 */
export async function loadMarketData(): Promise<void> {
  $marketDataLoading.set(true);
  $marketDataError.set(null);

  try {
    const assets = await getMarketAssets();
    $marketAssets.set(assets);
    $lastRefresh.set(new Date());

    // Also refresh top/lowest performers
    await refreshPerformers();
  } catch (error) {
    console.error('Failed to load market data:', error);
    $marketDataError.set('Failed to load market data. Please try again.');
  } finally {
    $marketDataLoading.set(false);
  }
}

/**
 * Refresh top and lowest performers
 */
export async function refreshPerformers(): Promise<void> {
  const period = $performancePeriod.get();

  try {
    const [top, lowest] = await Promise.all([
      getTopPerformers(period, 5),
      getLowestPerformers(period, 5),
    ]);

    $topPerformers.set(top);
    $lowestPerformers.set(lowest);
  } catch (error) {
    console.error('Failed to refresh performers:', error);
  }
}

/**
 * Set the selected category
 */
export function setCategory(category: AssetCategory | 'all'): void {
  $selectedCategory.set(category);
}

/**
 * Set the search query
 */
export function setSearchQuery(query: string): void {
  $searchQuery.set(query);
}

/**
 * Set the performance period
 */
export function setPerformancePeriod(period: PerformancePeriod): void {
  $performancePeriod.set(period);
  // Refresh performers when period changes
  refreshPerformers();
}

/**
 * Set sort configuration
 */
export function setSortConfig(config: AssetSortConfig): void {
  $sortConfig.set(config);
}

/**
 * Toggle sort direction for a field
 */
export function toggleSort(field: AssetSortConfig['field']): void {
  const current = $sortConfig.get();

  if (current.field === field) {
    // Toggle direction
    $sortConfig.set({
      field,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    });
  } else {
    // New field, default to desc
    $sortConfig.set({
      field,
      direction: 'desc',
    });
  }
}

/**
 * Get an asset by symbol from current state
 */
export function getAssetFromState(symbol: string): MarketAsset | undefined {
  return $marketAssets.get().find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
}

// ============================================================================
// Helper functions
// ============================================================================

function getFieldValue(
  asset: MarketAsset,
  field: AssetSortConfig['field']
): string | number {
  switch (field) {
    case 'symbol':
      return asset.symbol;
    case 'name':
      return asset.name;
    case 'price':
      return asset.price;
    case 'change':
      return asset.change;
    case 'changePercent':
      return asset.changePercent;
    case 'volume':
      return asset.volume ?? 0;
    case 'marketCap':
      return asset.marketCap ?? 0;
    default:
      return 0;
  }
}

// ============================================================================
// Category metadata
// ============================================================================

export const CATEGORY_METADATA: Record<
  AssetCategory | 'all',
  { label: string; icon: string; description: string }
> = {
  all: {
    label: 'All',
    icon: 'layers',
    description: 'All asset classes',
  },
  stocks: {
    label: 'Stocks',
    icon: 'trending-up',
    description: 'Individual company shares',
  },
  etfs: {
    label: 'ETFs',
    icon: 'layers',
    description: 'Exchange-traded funds',
  },
  bonds: {
    label: 'Bonds',
    icon: 'shield',
    description: 'Fixed income securities',
  },
  'fixed-income': {
    label: 'Fixed Income',
    icon: 'percent',
    description: 'Short-term Treasury funds',
  },
  commodities: {
    label: 'Commodities',
    icon: 'gem',
    description: 'Gold, silver, oil, and more',
  },
  crypto: {
    label: 'Crypto',
    icon: 'bitcoin',
    description: 'Cryptocurrencies',
  },
};

export const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  day: '1D',
  week: '1W',
  month: '1M',
};
