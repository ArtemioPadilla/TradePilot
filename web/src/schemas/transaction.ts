/**
 * Transaction schema — Spec-DD layer. Mirrors the `transactions` table
 * (side, symbol, qty, price, executed_at). The DB requires a symbol on every
 * row; cash movements (deposit/withdrawal) default to the sentinel 'CASH'.
 *
 * DESTINATION: web/src/schemas/transaction.ts
 */
import { z } from 'zod';

import { SYMBOL_RE } from './watchlist';

export const TRANSACTION_SIDES = ['buy', 'sell', 'dividend', 'deposit', 'withdrawal'] as const;
export type TransactionSide = (typeof TRANSACTION_SIDES)[number];

export const TRANSACTION_SIDE_LABELS: Record<TransactionSide, string> = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

/** Sides that reference an actual instrument (symbol required). */
export function sideNeedsSymbol(side: TransactionSide): boolean {
  return side === 'buy' || side === 'sell' || side === 'dividend';
}

/** Sentinel symbol stored for cash movements (DB column is NOT NULL). */
export const CASH_SYMBOL = 'CASH';

const OptionalPrice = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().nonnegative('Must be zero or more.').finite().nullable(),
);

export const TransactionFormSchema = z
  .object({
    side: z.enum(TRANSACTION_SIDES),
    symbol: z.string().trim().toUpperCase().max(12).default(''),
    qty: z.coerce.number().positive('Quantity must be positive.').finite(),
    price: OptionalPrice,
    /** YYYY-MM-DD from an <input type="date">. */
    executed_at: z
      .string()
      .min(1, 'Pick a date.')
      .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Not a valid date.'),
  })
  .superRefine((v, ctx) => {
    if (sideNeedsSymbol(v.side) && !SYMBOL_RE.test(v.symbol)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['symbol'],
        message: 'A valid ticker symbol is required for this side.',
      });
    }
  });

export type TransactionFormValues = z.output<typeof TransactionFormSchema>;
/** Raw form state before zod coercion (numbers arrive as strings). */
export type TransactionFormInput = z.input<typeof TransactionFormSchema>;
