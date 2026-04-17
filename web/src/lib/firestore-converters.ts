/**
 * Firestore Converters
 *
 * These converters provide type-safe reading and writing of documents to Firestore.
 * They handle the conversion between Firestore document data and TypeScript interfaces.
 */

import {
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type FirestoreDataConverter,
  type WithFieldValue,
  Timestamp,
} from 'firebase/firestore';
import type {
  Account,
  AccountFormData,
  Holding,
  HoldingFormData,
  Transaction,
  TransactionFormData,
  NetWorthSnapshot,
} from '../types/portfolio';

// ============================================================================
// Account Converter
// ============================================================================

export const accountConverter: FirestoreDataConverter<Account> = {
  toFirestore(account: WithFieldValue<Account>): DocumentData {
    return {
      userId: account.userId,
      name: account.name,
      type: account.type,
      institution: account.institution || null,
      accountNumberLast4: account.accountNumberLast4 || null,
      currency: account.currency,
      cashBalance: account.cashBalance || 0,
      status: account.status || 'active',
      notes: account.notes || null,
      isDefault: account.isDefault || false,
      sortOrder: account.sortOrder || 0,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Account {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      institution: data.institution || undefined,
      accountNumberLast4: data.accountNumberLast4 || undefined,
      currency: data.currency || 'USD',
      cashBalance: data.cashBalance || 0,
      status: data.status || 'active',
      notes: data.notes || undefined,
      isDefault: data.isDefault || false,
      sortOrder: data.sortOrder || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Convert form data to Firestore document data for creating an account
 */
export function accountFormToFirestore(
  userId: string,
  formData: AccountFormData
): Omit<Account, 'id'> {
  const now = Timestamp.now();
  return {
    userId,
    name: formData.name,
    type: formData.type,
    institution: formData.institution || undefined,
    accountNumberLast4: formData.accountNumberLast4 || undefined,
    currency: formData.currency,
    cashBalance: formData.cashBalance || 0,
    status: 'active',
    notes: formData.notes || undefined,
    isDefault: formData.isDefault || false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Holding Converter
// ============================================================================

export const holdingConverter: FirestoreDataConverter<Holding> = {
  toFirestore(holding: WithFieldValue<Holding>): DocumentData {
    return {
      userId: holding.userId,
      accountId: holding.accountId,
      symbol: holding.symbol,
      name: holding.name || null,
      assetType: holding.assetType,
      quantity: holding.quantity,
      costBasisPerShare: holding.costBasisPerShare,
      totalCostBasis: holding.totalCostBasis,
      currency: holding.currency,
      openDate: holding.openDate,
      notes: holding.notes || null,
      currentPrice: holding.currentPrice || null,
      marketValue: holding.marketValue || null,
      unrealizedPL: holding.unrealizedPL || null,
      unrealizedPLPercent: holding.unrealizedPLPercent || null,
      dailyChange: holding.dailyChange || null,
      dailyChangePercent: holding.dailyChangePercent || null,
      priceUpdatedAt: holding.priceUpdatedAt || null,
      createdAt: holding.createdAt,
      updatedAt: holding.updatedAt,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Holding {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      accountId: data.accountId,
      symbol: data.symbol,
      name: data.name || undefined,
      assetType: data.assetType || 'stock',
      quantity: data.quantity,
      costBasisPerShare: data.costBasisPerShare,
      totalCostBasis: data.totalCostBasis,
      currency: data.currency || 'USD',
      openDate: data.openDate,
      notes: data.notes || undefined,
      currentPrice: data.currentPrice || undefined,
      marketValue: data.marketValue || undefined,
      unrealizedPL: data.unrealizedPL || undefined,
      unrealizedPLPercent: data.unrealizedPLPercent || undefined,
      dailyChange: data.dailyChange || undefined,
      dailyChangePercent: data.dailyChangePercent || undefined,
      priceUpdatedAt: data.priceUpdatedAt || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Convert form data to Firestore document data for creating a holding
 */
export function holdingFormToFirestore(
  userId: string,
  formData: HoldingFormData
): Omit<Holding, 'id'> {
  const now = Timestamp.now();
  const totalCostBasis = formData.quantity * formData.costBasisPerShare;

  return {
    userId,
    accountId: formData.accountId,
    symbol: formData.symbol.toUpperCase(),
    name: formData.name,
    assetType: formData.assetType,
    quantity: formData.quantity,
    costBasisPerShare: formData.costBasisPerShare,
    totalCostBasis,
    currency: formData.currency || 'USD',
    openDate: formData.openDate
      ? Timestamp.fromDate(formData.openDate)
      : now,
    notes: formData.notes,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Transaction Converter
// ============================================================================

export const transactionConverter: FirestoreDataConverter<Transaction> = {
  toFirestore(transaction: WithFieldValue<Transaction>): DocumentData {
    return {
      userId: transaction.userId,
      accountId: transaction.accountId,
      holdingId: transaction.holdingId || null,
      type: transaction.type,
      symbol: transaction.symbol || null,
      quantity: transaction.quantity || null,
      pricePerShare: transaction.pricePerShare || null,
      amount: transaction.amount,
      currency: transaction.currency,
      fees: transaction.fees || 0,
      date: transaction.date,
      description: transaction.description || null,
      imported: transaction.imported || false,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Transaction {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      accountId: data.accountId,
      holdingId: data.holdingId || undefined,
      type: data.type,
      symbol: data.symbol || undefined,
      quantity: data.quantity || undefined,
      pricePerShare: data.pricePerShare || undefined,
      amount: data.amount,
      currency: data.currency || 'USD',
      fees: data.fees || 0,
      date: data.date,
      description: data.description || undefined,
      imported: data.imported || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Convert form data to Firestore document data for creating a transaction
 */
export function transactionFormToFirestore(
  userId: string,
  formData: TransactionFormData
): Omit<Transaction, 'id'> {
  const now = Timestamp.now();

  return {
    userId,
    accountId: formData.accountId,
    type: formData.type,
    symbol: formData.symbol?.toUpperCase(),
    quantity: formData.quantity,
    pricePerShare: formData.pricePerShare,
    amount: formData.amount,
    currency: formData.currency || 'USD',
    fees: formData.fees || 0,
    date: Timestamp.fromDate(formData.date),
    description: formData.description,
    imported: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Net Worth Snapshot Converter
// ============================================================================

export const netWorthSnapshotConverter: FirestoreDataConverter<NetWorthSnapshot> = {
  toFirestore(snapshot: WithFieldValue<NetWorthSnapshot>): DocumentData {
    return {
      date: snapshot.date,
      totalValue: snapshot.totalValue,
      accountValues: snapshot.accountValues || null,
    };
  },

  fromFirestore(
    docSnapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): NetWorthSnapshot {
    const data = docSnapshot.data(options);
    return {
      date: data.date,
      totalValue: data.totalValue,
      accountValues: data.accountValues || undefined,
    };
  },
};

// ============================================================================
// Collection Paths
// ============================================================================

/**
 * Get the Firestore collection path for accounts
 */
export function getAccountsPath(userId: string): string {
  return `users/${userId}/accounts`;
}

/**
 * Get the Firestore collection path for holdings
 */
export function getHoldingsPath(userId: string): string {
  return `users/${userId}/holdings`;
}

/**
 * Get the Firestore collection path for transactions
 */
export function getTransactionsPath(userId: string): string {
  return `users/${userId}/transactions`;
}

/**
 * Get the Firestore collection path for net worth snapshots
 */
export function getNetWorthPath(userId: string): string {
  return `users/${userId}/netWorth`;
}
