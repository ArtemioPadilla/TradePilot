/**
 * Financial calculators for portfolio analysis.
 */

import type { CompoundGrowthInput, CompoundGrowthResult } from '../../types/reports';

/**
 * Format a number as USD currency (re-exported for convenience).
 */
export function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Calculate simple return given start and end values.
 */
export function calculateSimpleReturn(startValue: number, endValue: number): number {
  if (startValue === 0) return 0;
  return (endValue - startValue) / startValue;
}

/**
 * Calculate annualized return from a simple return and holding period in years.
 */
export function calculateAnnualizedReturn(totalReturn: number, years: number): number {
  if (years <= 0) return 0;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate portfolio volatility (annualized standard deviation of returns).
 * @param returns Array of periodic returns (e.g. daily or monthly).
 * @param periodsPerYear Number of periods in a year (252 for daily, 12 for monthly).
 */
export function calculateVolatility(returns: number[], periodsPerYear: number = 252): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(periodsPerYear);
}

/**
 * Calculate the Sharpe ratio.
 * @param portfolioReturn Annualized portfolio return.
 * @param riskFreeRate Annualized risk-free rate.
 * @param volatility Annualized portfolio volatility.
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown from an array of portfolio values.
 * Returns a negative number representing the worst peak-to-trough decline.
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = values[0];

  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
    }
    const drawdown = (values[i] - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate compound growth projection.
 */
export function calculateCompoundGrowth(input: CompoundGrowthInput): CompoundGrowthResult {
  const { initialInvestment, monthlyContribution, annualReturnRate, years, compoundingFrequency } =
    input;

  let periodsPerYear: number;
  switch (compoundingFrequency) {
    case 'monthly':
      periodsPerYear = 12;
      break;
    case 'quarterly':
      periodsPerYear = 4;
      break;
    case 'annually':
      periodsPerYear = 1;
      break;
  }

  const ratePerPeriod = annualReturnRate / 100 / periodsPerYear;
  const monthsPerPeriod = 12 / periodsPerYear;

  const yearlyBreakdown: CompoundGrowthResult['yearlyBreakdown'] = [];
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
    });
  }

  return {
    finalValue: balance,
    totalContributions,
    totalInterestEarned: balance - totalContributions,
    yearlyBreakdown,
  };
}
