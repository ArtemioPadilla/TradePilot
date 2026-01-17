/**
 * Portfolio Data Models
 *
 * These interfaces define the core data structures for portfolio management.
 * They are used throughout the application for type safety and documentation.
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// Account Types
// ============================================================================

/**
 * Supported account types for categorization
 */
export type AccountType =
  | 'brokerage'    // Standard taxable brokerage account
  | '401k'         // Employer-sponsored retirement
  | 'ira'          // Individual Retirement Account
  | 'roth_ira'     // Roth IRA (post-tax)
  | 'crypto'       // Cryptocurrency exchange/wallet
  | 'bank'         // Bank account (for cash tracking)
  | 'other';       // Uncategorized

/**
 * Supported currencies
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'BTC' | 'ETH';

/**
 * Account status
 */
export type AccountStatus = 'active' | 'inactive' | 'closed';

/**
 * Represents a financial account (brokerage, retirement, crypto, etc.)
 */
export interface Account {
  /** Firestore document ID */
  id: string;

  /** User ID who owns this account */
  userId: string;

  /** Display name for the account */
  name: string;

  /** Type of account for categorization */
  type: AccountType;

  /** Institution name (e.g., "Fidelity", "Coinbase") */
  institution?: string;

  /** Account number (last 4 digits for display) */
  accountNumberLast4?: string;

  /** Base currency for the account */
  currency: Currency;

  /** Current cash balance in the account */
  cashBalance: number;

  /** Account status */
  status: AccountStatus;

  /** User notes about the account */
  notes?: string;

  /** Whether this is the default account for new positions */
  isDefault?: boolean;

  /** Display order for sorting */
  sortOrder?: number;

  /** When the account was created */
  createdAt: Timestamp;

  /** When the account was last updated */
  updatedAt: Timestamp;
}

/**
 * Form data for creating/updating an account (without server-generated fields)
 */
export interface AccountFormData {
  name: string;
  type: AccountType;
  institution?: string;
  accountNumberLast4?: string;
  currency: Currency;
  cashBalance?: number;
  notes?: string;
  isDefault?: boolean;
}

// ============================================================================
// Holding/Position Types
// ============================================================================

/**
 * Asset types for holdings
 */
export type AssetType =
  | 'stock'        // Common stock
  | 'etf'          // Exchange-traded fund
  | 'mutual_fund'  // Mutual fund
  | 'bond'         // Fixed income
  | 'crypto'       // Cryptocurrency
  | 'option'       // Options contract
  | 'cash'         // Cash position
  | 'other';       // Other asset type

/**
 * Represents a single holding/position in an account
 */
export interface Holding {
  /** Firestore document ID */
  id: string;

  /** User ID who owns this holding */
  userId: string;

  /** Account ID this holding belongs to */
  accountId: string;

  /** Ticker symbol (e.g., "AAPL", "BTC-USD") */
  symbol: string;

  /** Full name of the security */
  name?: string;

  /** Type of asset */
  assetType: AssetType;

  /** Number of shares/units held */
  quantity: number;

  /** Average cost per share (calculated from lots or entered manually) */
  costBasisPerShare: number;

  /** Total cost basis (quantity * costBasisPerShare) */
  totalCostBasis: number;

  /** Currency of the holding */
  currency: Currency;

  /** Date the position was opened (first purchase) */
  openDate: Timestamp;

  /** User notes about the holding */
  notes?: string;

  // === Computed fields (updated by price sync) ===

  /** Current price per share */
  currentPrice?: number;

  /** Current market value (quantity * currentPrice) */
  marketValue?: number;

  /** Unrealized P&L in dollars */
  unrealizedPL?: number;

  /** Unrealized P&L as percentage */
  unrealizedPLPercent?: number;

  /** Daily price change in dollars */
  dailyChange?: number;

  /** Daily price change as percentage */
  dailyChangePercent?: number;

  /** When prices were last updated */
  priceUpdatedAt?: Timestamp;

  /** When the holding was created */
  createdAt: Timestamp;

  /** When the holding was last updated */
  updatedAt: Timestamp;
}

/**
 * Form data for creating/updating a holding
 */
export interface HoldingFormData {
  accountId: string;
  symbol: string;
  name?: string;
  assetType: AssetType;
  quantity: number;
  costBasisPerShare: number;
  currency?: Currency;
  openDate?: Date;
  notes?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Types of transactions
 */
export type TransactionType =
  | 'buy'          // Purchase shares
  | 'sell'         // Sell shares
  | 'dividend'     // Dividend received
  | 'interest'     // Interest earned
  | 'deposit'      // Cash deposit
  | 'withdrawal'   // Cash withdrawal
  | 'transfer_in'  // Transfer from another account
  | 'transfer_out' // Transfer to another account
  | 'fee'          // Fee charged
  | 'split'        // Stock split
  | 'spinoff'      // Corporate spinoff
  | 'other';       // Other transaction

/**
 * Represents a transaction in an account
 */
export interface Transaction {
  /** Firestore document ID */
  id: string;

  /** User ID who owns this transaction */
  userId: string;

  /** Account ID this transaction belongs to */
  accountId: string;

  /** Holding ID if applicable (for buy/sell/dividend) */
  holdingId?: string;

  /** Type of transaction */
  type: TransactionType;

  /** Ticker symbol (for security transactions) */
  symbol?: string;

  /** Number of shares/units (for buy/sell) */
  quantity?: number;

  /** Price per share (for buy/sell) */
  pricePerShare?: number;

  /** Total amount of the transaction */
  amount: number;

  /** Currency of the transaction */
  currency: Currency;

  /** Fees associated with the transaction */
  fees?: number;

  /** Date of the transaction */
  date: Timestamp;

  /** Description or notes */
  description?: string;

  /** Whether this was imported from CSV */
  imported?: boolean;

  /** When the transaction was created */
  createdAt: Timestamp;

  /** When the transaction was last updated */
  updatedAt: Timestamp;
}

/**
 * Form data for creating a transaction
 */
export interface TransactionFormData {
  accountId: string;
  type: TransactionType;
  symbol?: string;
  quantity?: number;
  pricePerShare?: number;
  amount: number;
  currency?: Currency;
  fees?: number;
  date: Date;
  description?: string;
}

// ============================================================================
// Portfolio Aggregation Types
// ============================================================================

/**
 * Summary of a portfolio's key metrics
 */
export interface PortfolioSummary {
  /** Total market value across all accounts */
  totalValue: number;

  /** Total cash across all accounts */
  totalCash: number;

  /** Total invested (cost basis) */
  totalCostBasis: number;

  /** Total unrealized P&L */
  totalUnrealizedPL: number;

  /** Total unrealized P&L as percentage */
  totalUnrealizedPLPercent: number;

  /** Today's change in value */
  dailyChange: number;

  /** Today's change as percentage */
  dailyChangePercent: number;

  /** Number of accounts */
  accountCount: number;

  /** Number of holdings */
  holdingCount: number;

  /** When this summary was calculated */
  calculatedAt: Date;
}

/**
 * Asset allocation breakdown
 */
export interface AllocationItem {
  /** Category name (e.g., "Technology", "Stocks") */
  category: string;

  /** Market value in this category */
  value: number;

  /** Percentage of total portfolio */
  percentage: number;

  /** Number of holdings in this category */
  holdingCount: number;
}

/**
 * Historical net worth data point
 */
export interface NetWorthSnapshot {
  /** Date of the snapshot */
  date: Timestamp;

  /** Total portfolio value on this date */
  totalValue: number;

  /** Breakdown by account (optional) */
  accountValues?: Record<string, number>;
}

// ============================================================================
// CSV Import Types
// ============================================================================

/**
 * Supported CSV import formats
 */
export type CSVFormat =
  | 'generic'      // Generic format with standard columns
  | 'fidelity'     // Fidelity export format
  | 'schwab'       // Charles Schwab export format
  | 'vanguard'     // Vanguard export format
  | 'robinhood'    // Robinhood export format
  | 'coinbase';    // Coinbase export format

/**
 * A row from a CSV import (before validation)
 */
export interface CSVImportRow {
  symbol?: string;
  name?: string;
  quantity?: string | number;
  price?: string | number;
  costBasis?: string | number;
  date?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Result of validating a CSV import row
 */
export interface CSVValidationResult {
  row: number;
  valid: boolean;
  errors: string[];
  data?: HoldingFormData | TransactionFormData;
}

/**
 * Summary of a CSV import operation
 */
export interface CSVImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; message: string }>;
}
