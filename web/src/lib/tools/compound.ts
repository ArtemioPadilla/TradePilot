/**
 * DESTINATION: web/src/lib/tools/compound.ts
 *
 * Compound-growth projection for the public /tools calculators.
 *
 * Direct port of the old app's `calculateCompoundGrowth`
 * (old-app web/src/lib/utils/calculators.ts) with two changes:
 *   - inputs are sanitized/NaN-guarded here instead of trusting the caller
 *   - each yearly row also carries `cumulativeContributions` so charts can
 *     stack "money in" vs "growth" without recomputing.
 *
 * Semantics (identical to the old app): contributions are added at the START
 * of each compounding period, then the whole balance compounds once.
 */

export type CompoundingFrequency = 'monthly' | 'quarterly' | 'annually';

export interface CompoundGrowthInput {
  /** Starting lump sum, in dollars. Negative/non-finite → 0. */
  initialInvestment: number;
  /** Contribution per month, in dollars. Negative/non-finite → 0. */
  monthlyContribution: number;
  /** Expected annual return in PERCENT (7 = 7%). Clamped to [-100, 100]. */
  annualReturnRate: number;
  /** Projection horizon in whole years. Clamped to [0, 100]. */
  years: number;
  compoundingFrequency: CompoundingFrequency;
}

export interface CompoundGrowthYear {
  year: number;
  startBalance: number;
  /** Contributions made during this year. */
  contributions: number;
  /** Interest earned during this year. */
  interest: number;
  endBalance: number;
  /** Initial investment + all contributions made through the end of this year. */
  cumulativeContributions: number;
}

export interface CompoundGrowthResult {
  finalValue: number;
  totalContributions: number;
  totalInterestEarned: number;
  yearlyBreakdown: CompoundGrowthYear[];
}

const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalize raw (possibly user-typed) input into a safe, computable shape. */
export function sanitizeCompoundGrowthInput(input: CompoundGrowthInput): CompoundGrowthInput {
  return {
    initialInvestment: Math.max(finiteOr(input.initialInvestment, 0), 0),
    monthlyContribution: Math.max(finiteOr(input.monthlyContribution, 0), 0),
    annualReturnRate: clamp(finiteOr(input.annualReturnRate, 0), -100, 100),
    years: clamp(Math.floor(finiteOr(input.years, 0)), 0, 100),
    compoundingFrequency: input.compoundingFrequency,
  };
}

/**
 * Project investment growth with periodic contributions.
 * Never returns NaN/Infinity for sane (sanitized) inputs.
 */
export function projectCompoundGrowth(rawInput: CompoundGrowthInput): CompoundGrowthResult {
  const input = sanitizeCompoundGrowthInput(rawInput);
  const { initialInvestment, monthlyContribution, annualReturnRate, years } = input;

  const periodsPerYear = PERIODS_PER_YEAR[input.compoundingFrequency];
  const ratePerPeriod = annualReturnRate / 100 / periodsPerYear;
  const monthsPerPeriod = 12 / periodsPerYear;

  const yearlyBreakdown: CompoundGrowthYear[] = [];
  let balance = initialInvestment;
  let totalContributions = initialInvestment;

  for (let year = 1; year <= years; year++) {
    const startBalance = balance;
    let yearContributions = 0;

    for (let period = 0; period < periodsPerYear; period++) {
      const contribution = monthlyContribution * monthsPerPeriod;
      balance += contribution;
      yearContributions += contribution;
      balance *= 1 + ratePerPeriod;
    }

    totalContributions += yearContributions;

    yearlyBreakdown.push({
      year,
      startBalance,
      contributions: yearContributions,
      interest: balance - startBalance - yearContributions,
      endBalance: balance,
      cumulativeContributions: totalContributions,
    });
  }

  return {
    finalValue: balance,
    totalContributions,
    totalInterestEarned: balance - totalContributions,
    yearlyBreakdown,
  };
}

/**
 * Format a number as USD currency (ported unchanged from the old app —
 * keeps the negative sign OUTSIDE the currency symbol: "-$1,234.00").
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}
