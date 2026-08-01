/**
 * Strategy schema — Spec-DD layer. Mirrors the `strategies` table shape the
 * adapter persists (params JSONB keeps per-type knobs).
 */
import { z } from 'zod';

export const STRATEGY_TYPES = ['momentum', 'meanReversion', 'smartBeta', 'custom'] as const;
export type StrategyTypeId = (typeof STRATEGY_TYPES)[number];

export const StrategyParamsSchema = z.object({
  t: z.coerce.number().int().min(2).max(252).default(10),
  window: z.coerce.number().int().min(5).max(504).default(60),
  topN: z.coerce.number().int().min(1).max(50).default(5),
});

export const StrategyFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the strategy a name.').max(80),
  type: z.enum(STRATEGY_TYPES),
  params: StrategyParamsSchema,
  code: z.string().max(20_000).optional(),
  is_public: z.boolean().default(false),
});

export type StrategyFormValues = z.output<typeof StrategyFormSchema>;
/** Raw form state before zod coercion (number fields arrive as strings). */
export type StrategyFormInput = z.input<typeof StrategyFormSchema>;
export type StrategyParams = z.output<typeof StrategyParamsSchema>;
