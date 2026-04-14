// TODO: implement with real Firebase/API calls

import type { Holding } from '../../types/portfolio';

/**
 * Create a new holding in an account.
 * Returns the generated holding ID.
 */
export async function createHolding(
  userId: string,
  accountId: string,
  data: any
): Promise<string> {
  // TODO: write to Firestore users/{userId}/accounts/{accountId}/holdings
  console.warn('[holdings] createHolding is a stub');
  return 'mock-holding-id';
}

/**
 * Look up a holding by its ticker symbol within an account.
 */
export async function getHoldingBySymbol(
  userId: string,
  accountId: string,
  symbol: string
): Promise<Holding | null> {
  // TODO: query Firestore where symbol == symbol
  console.warn('[holdings] getHoldingBySymbol is a stub');
  return null;
}

/**
 * Add shares to an existing position.
 */
export async function addToPosition(
  userId: string,
  holdingId: string,
  data: any
): Promise<void> {
  // TODO: update quantity and cost basis in Firestore
  console.warn('[holdings] addToPosition is a stub');
}

/**
 * Retrieve all holdings for a given account.
 */
export async function getHoldingsByAccount(
  userId: string,
  accountId: string
): Promise<Holding[]> {
  // TODO: query Firestore users/{userId}/accounts/{accountId}/holdings
  console.warn('[holdings] getHoldingsByAccount is a stub');
  return [];
}

/**
 * Delete a holding from an account.
 */
export async function deleteHolding(
  userId: string,
  accountId: string,
  holdingId: string
): Promise<void> {
  // TODO: delete Firestore document
  console.warn('[holdings] deleteHolding is a stub');
}

/**
 * Update arbitrary fields on a holding.
 */
export async function updateHolding(
  userId: string,
  accountId: string,
  holdingId: string,
  data: any
): Promise<void> {
  // TODO: merge-update Firestore document
  console.warn('[holdings] updateHolding is a stub');
}

/**
 * Reduce the quantity of a position (partial sell).
 */
export async function reducePosition(
  userId: string,
  accountId: string,
  holdingId: string,
  qty: number
): Promise<void> {
  // TODO: decrement quantity in Firestore, delete if zero
  console.warn('[holdings] reducePosition is a stub');
}
