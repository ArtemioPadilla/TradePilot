/**
 * Alert schema — Spec-DD layer. Mirrors the `alerts` table: `symbol` +
 * `is_active` columns plus a JSONB `condition` ({ kind, price }). The
 * condition schema is also used to *parse* rows coming back from the DB, so
 * a malformed JSONB blob degrades gracefully in the UI instead of crashing.
 *
 * DESTINATION: web/src/schemas/alert.ts
 */
import { z } from 'zod';

import { SymbolSchema } from './watchlist';

export const ALERT_KINDS = ['above', 'below'] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

/** Shape stored in the alerts.condition JSONB column. */
export const AlertConditionSchema = z.object({
  kind: z.enum(ALERT_KINDS),
  price: z.coerce.number().positive('Price must be positive.').finite(),
});

export const AlertFormSchema = z.object({
  symbol: SymbolSchema,
  condition: AlertConditionSchema,
  is_active: z.boolean().default(true),
});

export type AlertCondition = z.output<typeof AlertConditionSchema>;
export type AlertFormValues = z.output<typeof AlertFormSchema>;
/** Raw form state before zod coercion (price arrives as a string). */
export type AlertFormInput = z.input<typeof AlertFormSchema>;

/** Parse a DB row's JSONB condition; returns null when malformed. */
export function parseAlertCondition(raw: unknown): AlertCondition | null {
  const result = AlertConditionSchema.safeParse(raw);
  return result.success ? result.data : null;
}
