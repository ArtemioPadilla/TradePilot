/**
 * Holding schema — Spec-DD layer. Mirrors the `holdings` table (symbol, qty,
 * cost_basis). `cost_basis` is interpreted as PER-SHARE cost (labelled as
 * such in the UI); unrealized P/L = (live price − cost_basis) × qty.
 *
 * DESTINATION: web/src/schemas/holding.ts
 */
import { z } from 'zod';

import { SymbolSchema } from './watchlist';

/** '' / null → null, anything else coerced to a non-negative number. */
const OptionalMoney = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().nonnegative('Must be zero or more.').finite().nullable(),
);

export const HoldingFormSchema = z.object({
  symbol: SymbolSchema,
  qty: z.coerce.number().positive('Quantity must be positive.').finite(),
  cost_basis: OptionalMoney,
});

export type HoldingFormValues = z.output<typeof HoldingFormSchema>;
/** Raw form state before zod coercion (numbers arrive as strings). */
export type HoldingFormInput = z.input<typeof HoldingFormSchema>;
