/**
 * Input Validation Module
 *
 * Validates user input before Firestore writes to prevent invalid data
 * from being stored in the database.
 */

import type {
  AccountFormData,
  HoldingFormData,
  TransactionFormData,
  AccountType,
  AssetType,
  Currency,
  TransactionType,
} from '../types/portfolio';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valid account types
 */
const VALID_ACCOUNT_TYPES: AccountType[] = [
  'brokerage',
  '401k',
  'ira',
  'roth_ira',
  'crypto',
  'bank',
  'other',
];

/**
 * Valid asset types
 */
const VALID_ASSET_TYPES: AssetType[] = [
  'stock',
  'etf',
  'mutual_fund',
  'bond',
  'crypto',
  'option',
  'cash',
  'other',
];

/**
 * Valid currencies
 */
const VALID_CURRENCIES: Currency[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'BTC',
  'ETH',
];

/**
 * Valid transaction types
 */
const VALID_TRANSACTION_TYPES: TransactionType[] = [
  'buy',
  'sell',
  'dividend',
  'interest',
  'deposit',
  'withdrawal',
  'transfer_in',
  'transfer_out',
  'fee',
  'split',
  'spinoff',
  'other',
];

/**
 * Symbol validation regex - allows letters, numbers, periods, and hyphens
 * Examples: AAPL, BRK.B, BTC-USD
 */
const SYMBOL_REGEX = /^[A-Z0-9][A-Z0-9.-]{0,19}$/;

/**
 * Account number last 4 regex - exactly 4 alphanumeric characters
 */
const ACCOUNT_NUMBER_LAST4_REGEX = /^[A-Z0-9]{4}$/i;

/**
 * Validate account form data
 */
export function validateAccount(data: AccountFormData): ValidationResult {
  const errors: string[] = [];

  // Required: name
  if (!data.name?.trim()) {
    errors.push('Account name is required');
  } else if (data.name.trim().length > 100) {
    errors.push('Account name must be 100 characters or less');
  }

  // Required: type (must be valid)
  if (!data.type) {
    errors.push('Account type is required');
  } else if (!VALID_ACCOUNT_TYPES.includes(data.type)) {
    errors.push(`Invalid account type: ${data.type}`);
  }

  // Required: currency (must be valid)
  if (!data.currency) {
    errors.push('Currency is required');
  } else if (!VALID_CURRENCIES.includes(data.currency)) {
    errors.push(`Invalid currency: ${data.currency}`);
  }

  // Optional: cashBalance (must be non-negative)
  if (data.cashBalance !== undefined && data.cashBalance < 0) {
    errors.push('Cash balance cannot be negative');
  }

  // Optional: institution (max length)
  if (data.institution && data.institution.length > 100) {
    errors.push('Institution name must be 100 characters or less');
  }

  // Optional: accountNumberLast4 (must be exactly 4 characters if provided)
  if (data.accountNumberLast4 && !ACCOUNT_NUMBER_LAST4_REGEX.test(data.accountNumberLast4)) {
    errors.push('Account number must be exactly 4 alphanumeric characters');
  }

  // Optional: notes (max length)
  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must be 1000 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate holding form data
 */
export function validateHolding(data: HoldingFormData): ValidationResult {
  const errors: string[] = [];

  // Required: accountId
  if (!data.accountId?.trim()) {
    errors.push('Account ID is required');
  }

  // Required: symbol (must be valid format)
  if (!data.symbol?.trim()) {
    errors.push('Symbol is required');
  } else {
    const upperSymbol = data.symbol.toUpperCase().trim();
    if (!SYMBOL_REGEX.test(upperSymbol)) {
      errors.push('Invalid symbol format. Use letters, numbers, periods, or hyphens (max 20 characters)');
    }
  }

  // Required: assetType (must be valid)
  if (!data.assetType) {
    errors.push('Asset type is required');
  } else if (!VALID_ASSET_TYPES.includes(data.assetType)) {
    errors.push(`Invalid asset type: ${data.assetType}`);
  }

  // Required: quantity (must be positive)
  if (data.quantity === undefined || data.quantity === null) {
    errors.push('Quantity is required');
  } else if (typeof data.quantity !== 'number' || isNaN(data.quantity)) {
    errors.push('Quantity must be a valid number');
  } else if (data.quantity <= 0) {
    errors.push('Quantity must be greater than zero');
  } else if (data.quantity > 1e12) {
    errors.push('Quantity exceeds maximum allowed value');
  }

  // Required: costBasisPerShare (must be non-negative)
  if (data.costBasisPerShare === undefined || data.costBasisPerShare === null) {
    errors.push('Cost basis per share is required');
  } else if (typeof data.costBasisPerShare !== 'number' || isNaN(data.costBasisPerShare)) {
    errors.push('Cost basis per share must be a valid number');
  } else if (data.costBasisPerShare < 0) {
    errors.push('Cost basis per share cannot be negative');
  } else if (data.costBasisPerShare > 1e9) {
    errors.push('Cost basis per share exceeds maximum allowed value');
  }

  // Optional: currency (must be valid if provided)
  if (data.currency && !VALID_CURRENCIES.includes(data.currency)) {
    errors.push(`Invalid currency: ${data.currency}`);
  }

  // Optional: name (max length)
  if (data.name && data.name.length > 200) {
    errors.push('Security name must be 200 characters or less');
  }

  // Optional: openDate (must be valid date, not in future)
  if (data.openDate) {
    if (!(data.openDate instanceof Date) || isNaN(data.openDate.getTime())) {
      errors.push('Open date must be a valid date');
    } else if (data.openDate > new Date()) {
      errors.push('Open date cannot be in the future');
    }
  }

  // Optional: notes (max length)
  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must be 1000 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate transaction form data
 */
export function validateTransaction(data: TransactionFormData): ValidationResult {
  const errors: string[] = [];

  // Required: accountId
  if (!data.accountId?.trim()) {
    errors.push('Account ID is required');
  }

  // Required: type (must be valid)
  if (!data.type) {
    errors.push('Transaction type is required');
  } else if (!VALID_TRANSACTION_TYPES.includes(data.type)) {
    errors.push(`Invalid transaction type: ${data.type}`);
  }

  // Required: amount
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount is required');
  } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.push('Amount must be a valid number');
  } else if (Math.abs(data.amount) > 1e12) {
    errors.push('Amount exceeds maximum allowed value');
  }

  // Required: date
  if (!data.date) {
    errors.push('Transaction date is required');
  } else if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
    errors.push('Transaction date must be a valid date');
  } else if (data.date > new Date()) {
    errors.push('Transaction date cannot be in the future');
  }

  // Conditional: symbol required for buy/sell/dividend transactions
  const symbolRequiredTypes: TransactionType[] = ['buy', 'sell', 'dividend', 'split', 'spinoff'];
  if (data.type && symbolRequiredTypes.includes(data.type)) {
    if (!data.symbol?.trim()) {
      errors.push(`Symbol is required for ${data.type} transactions`);
    } else {
      const upperSymbol = data.symbol.toUpperCase().trim();
      if (!SYMBOL_REGEX.test(upperSymbol)) {
        errors.push('Invalid symbol format');
      }
    }
  }

  // Conditional: quantity required for buy/sell transactions
  const quantityRequiredTypes: TransactionType[] = ['buy', 'sell'];
  if (data.type && quantityRequiredTypes.includes(data.type)) {
    if (data.quantity === undefined || data.quantity === null) {
      errors.push(`Quantity is required for ${data.type} transactions`);
    } else if (data.quantity <= 0) {
      errors.push('Quantity must be greater than zero');
    }
  }

  // Optional: pricePerShare (must be non-negative if provided)
  if (data.pricePerShare !== undefined && data.pricePerShare !== null) {
    if (data.pricePerShare < 0) {
      errors.push('Price per share cannot be negative');
    }
  }

  // Optional: fees (must be non-negative if provided)
  if (data.fees !== undefined && data.fees !== null) {
    if (data.fees < 0) {
      errors.push('Fees cannot be negative');
    }
  }

  // Optional: currency (must be valid if provided)
  if (data.currency && !VALID_CURRENCIES.includes(data.currency)) {
    errors.push(`Invalid currency: ${data.currency}`);
  }

  // Optional: description (max length)
  if (data.description && data.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate position update (for addToPosition/reducePosition)
 */
export function validatePositionUpdate(
  quantity: number,
  pricePerShare: number
): ValidationResult {
  const errors: string[] = [];

  if (typeof quantity !== 'number' || isNaN(quantity)) {
    errors.push('Quantity must be a valid number');
  } else if (quantity <= 0) {
    errors.push('Quantity must be greater than zero');
  } else if (quantity > 1e12) {
    errors.push('Quantity exceeds maximum allowed value');
  }

  if (typeof pricePerShare !== 'number' || isNaN(pricePerShare)) {
    errors.push('Price per share must be a valid number');
  } else if (pricePerShare < 0) {
    errors.push('Price per share cannot be negative');
  } else if (pricePerShare > 1e9) {
    errors.push('Price per share exceeds maximum allowed value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validation error class for throwing validation failures
 */
export class ValidationError extends Error {
  public readonly errors: string[];

  constructor(errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Helper to throw if validation fails
 */
export function assertValid(result: ValidationResult): void {
  if (!result.valid) {
    throw new ValidationError(result.errors);
  }
}
