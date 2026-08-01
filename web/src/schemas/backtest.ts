/**
 * Backtest run configuration schema — Spec-DD layer for the run form.
 * Converts to the engine's BacktestConfig at the island boundary.
 */
import { z } from 'zod';

export const BacktestFormSchema = z
  .object({
    symbols: z
      .array(z.string().trim().toUpperCase().min(1).max(12))
      .min(2, 'Add at least two symbols.')
      .max(30, 'At most 30 symbols.'),
    strategy: z.enum(['momentum', 'meanReversion', 'smartBeta']),
    optimizer: z.enum(['MSR', 'GMV', 'EW']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
    initialCapital: z.coerce.number().min(100).max(1_000_000_000).default(10_000),
    rebalanceFreq: z.coerce.number().int().min(1).max(126).default(5),
    topN: z.coerce.number().int().min(1).max(30).default(5),
    window: z.coerce.number().int().min(5).max(504).default(60),
    t: z.coerce.number().int().min(2).max(252).default(10),
    riskFreeRate: z.coerce.number().min(0).max(0.25).default(0.04),
    costBps: z.coerce.number().min(0).max(200).default(0),
    slippageBps: z.coerce.number().min(0).max(200).default(0),
    withBenchmark: z.boolean().default(true),
  })
  .refine((v) => v.startDate < v.endDate, {
    message: 'Start date must be before end date.',
    path: ['endDate'],
  });

export type BacktestFormValues = z.output<typeof BacktestFormSchema>;
export type BacktestFormInput = z.input<typeof BacktestFormSchema>;
