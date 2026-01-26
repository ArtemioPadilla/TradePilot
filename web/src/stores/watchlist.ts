/**
 * Watchlist Store
 *
 * State management for user watchlist data.
 */

import { atom, computed } from 'nanostores';
import type { WatchlistItem, WatchlistFormData } from '../types/markets';
import {
  getWatchlist,
  addToWatchlist as addToWatchlistService,
  removeFromWatchlistBySymbol,
  subscribeToWatchlist as subscribeToWatchlistService,
  updateWatchlistItem as updateWatchlistItemService,
} from '../lib/services/watchlists';
import type { Unsubscribe } from 'firebase/firestore';

// ============================================================================
// State atoms
// ============================================================================

/** Watchlist items */
export const $watchlist = atom<WatchlistItem[]>([]);

/** Loading state */
export const $watchlistLoading = atom<boolean>(false);

/** Error state */
export const $watchlistError = atom<string | null>(null);

/** Current subscription unsubscribe function */
let currentUnsubscribe: Unsubscribe | null = null;

// ============================================================================
// Computed values
// ============================================================================

/** Watchlist symbols for quick lookup */
export const $watchlistSymbols = computed($watchlist, items =>
  items.map(item => item.symbol.toUpperCase())
);

/** Watchlist symbol set for O(1) lookup */
export const $watchlistSymbolSet = computed(
  $watchlistSymbols,
  symbols => new Set(symbols)
);

/** Watchlist count */
export const $watchlistCount = computed($watchlist, items => items.length);

/** Watchlist grouped by category */
export const $watchlistByCategory = computed($watchlist, items => {
  const grouped: Record<string, WatchlistItem[]> = {};

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  return grouped;
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Load watchlist from Firestore (one-time fetch)
 */
export async function loadWatchlist(userId: string): Promise<void> {
  $watchlistLoading.set(true);
  $watchlistError.set(null);

  try {
    const items = await getWatchlist(userId);
    $watchlist.set(items);
  } catch (error) {
    console.error('Failed to load watchlist:', error);
    $watchlistError.set('Failed to load watchlist');
  } finally {
    $watchlistLoading.set(false);
  }
}

/**
 * Subscribe to watchlist changes (real-time updates)
 */
export function subscribeToWatchlist(userId: string): void {
  // Unsubscribe from previous subscription
  unsubscribeFromWatchlist();

  $watchlistLoading.set(true);
  $watchlistError.set(null);

  currentUnsubscribe = subscribeToWatchlistService(
    userId,
    items => {
      $watchlist.set(items);
      $watchlistLoading.set(false);
    },
    error => {
      $watchlistError.set(error.message);
      $watchlistLoading.set(false);
    }
  );
}

/**
 * Unsubscribe from watchlist updates
 */
export function unsubscribeFromWatchlist(): void {
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }
}

/**
 * Add an item to the watchlist
 */
export async function addToWatchlist(
  userId: string,
  item: WatchlistFormData
): Promise<boolean> {
  $watchlistError.set(null);

  try {
    await addToWatchlistService(userId, item);

    // If not subscribed, manually add to state
    if (!currentUnsubscribe) {
      const newItem: WatchlistItem = {
        id: '', // Will be set by real-time update
        userId,
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        category: item.category,
        notes: item.notes,
        addedAt: new Date(),
      };
      $watchlist.set([newItem, ...$watchlist.get()]);
    }

    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add to watchlist';
    $watchlistError.set(message);
    return false;
  }
}

/**
 * Remove an item from the watchlist by symbol
 */
export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  $watchlistError.set(null);

  try {
    await removeFromWatchlistBySymbol(userId, symbol);

    // If not subscribed, manually remove from state
    if (!currentUnsubscribe) {
      const upperSymbol = symbol.toUpperCase();
      $watchlist.set(
        $watchlist.get().filter(item => item.symbol.toUpperCase() !== upperSymbol)
      );
    }

    return true;
  } catch (error) {
    console.error('Failed to remove from watchlist:', error);
    $watchlistError.set('Failed to remove from watchlist');
    return false;
  }
}

/**
 * Update a watchlist item
 */
export async function updateWatchlistItem(
  userId: string,
  itemId: string,
  updates: Partial<WatchlistFormData>
): Promise<boolean> {
  $watchlistError.set(null);

  try {
    await updateWatchlistItemService(userId, itemId, updates);
    return true;
  } catch (error) {
    console.error('Failed to update watchlist item:', error);
    $watchlistError.set('Failed to update watchlist item');
    return false;
  }
}

/**
 * Check if a symbol is in the watchlist
 */
export function isInWatchlist(symbol: string): boolean {
  return $watchlistSymbolSet.get().has(symbol.toUpperCase());
}

/**
 * Get watchlist item by symbol
 */
export function getWatchlistItem(symbol: string): WatchlistItem | undefined {
  const upperSymbol = symbol.toUpperCase();
  return $watchlist.get().find(item => item.symbol.toUpperCase() === upperSymbol);
}

/**
 * Clear watchlist state (on logout)
 */
export function clearWatchlistState(): void {
  unsubscribeFromWatchlist();
  $watchlist.set([]);
  $watchlistError.set(null);
  $watchlistLoading.set(false);
}

/**
 * Toggle watchlist (add if not present, remove if present)
 */
export async function toggleWatchlist(
  userId: string,
  item: WatchlistFormData
): Promise<boolean> {
  if (isInWatchlist(item.symbol)) {
    return removeFromWatchlist(userId, item.symbol);
  } else {
    return addToWatchlist(userId, item);
  }
}
