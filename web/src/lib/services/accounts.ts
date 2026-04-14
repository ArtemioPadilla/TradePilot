// TODO: implement with real Firebase/API calls

import type { Account } from '../../types/portfolio';

/**
 * Create a new account for a user.
 * Returns the generated account ID.
 */
export async function createAccount(
  userId: string,
  data: { name: string; type: string; institution?: string }
): Promise<string> {
  // TODO: write to Firestore users/{userId}/accounts collection
  console.warn('[accounts] createAccount is a stub');
  return 'mock-account-id';
}

/**
 * Retrieve all accounts for a user.
 */
export async function getAccounts(userId: string): Promise<Account[]> {
  // TODO: query Firestore users/{userId}/accounts
  console.warn('[accounts] getAccounts is a stub');
  return [];
}

/**
 * Retrieve a single account by ID.
 */
export async function getAccount(
  userId: string,
  accountId: string
): Promise<Account | null> {
  // TODO: read Firestore users/{userId}/accounts/{accountId}
  console.warn('[accounts] getAccount is a stub');
  return null;
}

/**
 * Delete an account and its associated holdings.
 */
export async function deleteAccount(
  userId: string,
  accountId: string
): Promise<void> {
  // TODO: delete Firestore document and subcollections
  console.warn('[accounts] deleteAccount is a stub');
}

/**
 * Update the status of an account (active, inactive, closed).
 */
export async function updateAccountStatus(
  userId: string,
  accountId: string,
  status: string
): Promise<void> {
  // TODO: update Firestore document status field
  console.warn('[accounts] updateAccountStatus is a stub');
}
