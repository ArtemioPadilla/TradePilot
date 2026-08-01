/**
 * Watchlist schema — Spec-DD layer. Mirrors the `watchlists` table shape
 * (name + symbols text[]).
 *
 * DESTINATION: web/src/schemas/watchlist.ts
 */
import { z } from 'zod';

/** Yahoo-style tickers: AAPL, BRK-B, ^GSPC, BTC-USD, EURUSD=X, 7203.T … */
export const SYMBOL_RE = /^[A-Z0-9^=][A-Z0-9.\-=^]{0,11}$/;

export const SymbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(SYMBOL_RE, 'Not a valid ticker symbol.');

export const WatchlistFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the watchlist a name.').max(60),
  symbols: z
    .array(SymbolSchema)
    .min(1, 'Add at least one symbol.')
    .max(30, 'Keep watchlists under 30 symbols.'),
});

export type WatchlistFormValues = z.output<typeof WatchlistFormSchema>;
/** Raw form state before zod normalization (symbols may arrive lower-case). */
export type WatchlistFormInput = z.input<typeof WatchlistFormSchema>;
