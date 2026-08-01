/**
 * Account schema — Spec-DD layer. Mirrors the `accounts` table (name, broker,
 * currency, type). The DB stores currency/type as plain text; these enums are
 * the UI's supported set, not a DB constraint.
 *
 * DESTINATION: web/src/schemas/account.ts
 */
import { z } from 'zod';

export const ACCOUNT_TYPES = ['brokerage', 'retirement', 'crypto', 'cash', 'other'] as const;
export type AccountTypeId = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeId, string> = {
  brokerage: 'Brokerage',
  retirement: 'Retirement',
  crypto: 'Crypto',
  cash: 'Cash',
  other: 'Other',
};

/** Currencies the UI offers; Intl.NumberFormat handles all of them. */
export const CURRENCIES = ['USD', 'EUR', 'MXN', 'GBP', 'CAD', 'JPY'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const AccountFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the account a name.').max(80),
  // Empty string → null so the DB column stays NULL rather than ''.
  broker: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .default(null),
  currency: z.enum(CURRENCIES).default('USD'),
  type: z.enum(ACCOUNT_TYPES).default('brokerage'),
});

export type AccountFormValues = z.output<typeof AccountFormSchema>;
export type AccountFormInput = z.input<typeof AccountFormSchema>;
