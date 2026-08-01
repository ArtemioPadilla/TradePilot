/**
 * DESTINATION: web/src/lib/tools/compound.test.ts
 * (or web/src/lib/tools/__tests__/compound.test.ts — match repo convention)
 *
 * Hand-verified fixtures for the compound-growth projection.
 */
import { describe, expect, it } from 'vitest';

import {
  formatCurrency,
  projectCompoundGrowth,
  sanitizeCompoundGrowthInput,
} from '@/lib/tools/compound';

describe('projectCompoundGrowth', () => {
  it('compounds a lump sum monthly with no contributions (1000 @ 12%/yr, 1yr = 1000·1.01¹²)', () => {
    const r = projectCompoundGrowth({
      initialInvestment: 1000,
      monthlyContribution: 0,
      annualReturnRate: 12,
      years: 1,
      compoundingFrequency: 'monthly',
    });
    // 1000 * 1.01^12 = 1126.82503013196...
    expect(r.finalValue).toBeCloseTo(1126.82503, 4);
    expect(r.totalContributions).toBe(1000);
    expect(r.totalInterestEarned).toBeCloseTo(126.82503, 4);
    expect(r.yearlyBreakdown).toHaveLength(1);
  });

  it('sums contributions exactly at 0% return', () => {
    const r = projectCompoundGrowth({
      initialInvestment: 0,
      monthlyContribution: 100,
      annualReturnRate: 0,
      years: 2,
      compoundingFrequency: 'monthly',
    });
    expect(r.finalValue).toBeCloseTo(2400, 10);
    expect(r.totalContributions).toBeCloseTo(2400, 10);
    expect(r.totalInterestEarned).toBeCloseTo(0, 10);
    expect(r.yearlyBreakdown[0]?.contributions).toBeCloseTo(1200, 10);
    expect(r.yearlyBreakdown[0]?.cumulativeContributions).toBeCloseTo(1200, 10);
    expect(r.yearlyBreakdown[1]?.cumulativeContributions).toBeCloseTo(2400, 10);
  });

  it('annual compounding adds the full year of contributions before compounding once', () => {
    // (1000 + 12·100) · 1.10 = 2420; interest = 2420 − 2200 = 220
    const r = projectCompoundGrowth({
      initialInvestment: 1000,
      monthlyContribution: 100,
      annualReturnRate: 10,
      years: 1,
      compoundingFrequency: 'annually',
    });
    expect(r.finalValue).toBeCloseTo(2420, 10);
    expect(r.totalInterestEarned).toBeCloseTo(220, 10);
  });

  it('quarterly compounding matches the hand-computed sequence', () => {
    // 300/quarter @ 2%/quarter:
    // Q1: 300·1.02 = 306
    // Q2: (306+300)·1.02 = 618.12
    // Q3: (618.12+300)·1.02 = 936.4824
    // Q4: (936.4824+300)·1.02 = 1261.212048
    const r = projectCompoundGrowth({
      initialInvestment: 0,
      monthlyContribution: 100,
      annualReturnRate: 8,
      years: 1,
      compoundingFrequency: 'quarterly',
    });
    expect(r.finalValue).toBeCloseTo(1261.212048, 6);
  });

  it('keeps yearly rows internally consistent (start + contributions + interest = end, rows chain)', () => {
    const r = projectCompoundGrowth({
      initialInvestment: 5000,
      monthlyContribution: 250,
      annualReturnRate: 7,
      years: 5,
      compoundingFrequency: 'monthly',
    });
    expect(r.yearlyBreakdown).toHaveLength(5);
    for (let i = 0; i < r.yearlyBreakdown.length; i++) {
      const row = r.yearlyBreakdown[i]!;
      expect(row.startBalance + row.contributions + row.interest).toBeCloseTo(row.endBalance, 8);
      const next = r.yearlyBreakdown[i + 1];
      if (next) expect(next.startBalance).toBeCloseTo(row.endBalance, 8);
    }
    const last = r.yearlyBreakdown[r.yearlyBreakdown.length - 1]!;
    expect(last.endBalance).toBeCloseTo(r.finalValue, 8);
    expect(last.cumulativeContributions).toBeCloseTo(r.totalContributions, 8);
  });

  it('never returns NaN for garbage input', () => {
    const r = projectCompoundGrowth({
      initialInvestment: Number.NaN,
      monthlyContribution: Number.NEGATIVE_INFINITY,
      annualReturnRate: Number.NaN,
      years: Number.NaN,
      compoundingFrequency: 'monthly',
    });
    expect(Number.isFinite(r.finalValue)).toBe(true);
    expect(r.finalValue).toBe(0);
    expect(r.yearlyBreakdown).toHaveLength(0);
  });

  it('zero years yields the initial investment untouched', () => {
    const r = projectCompoundGrowth({
      initialInvestment: 500,
      monthlyContribution: 100,
      annualReturnRate: 7,
      years: 0,
      compoundingFrequency: 'monthly',
    });
    expect(r.finalValue).toBe(500);
    expect(r.totalContributions).toBe(500);
    expect(r.totalInterestEarned).toBe(0);
  });
});

describe('sanitizeCompoundGrowthInput', () => {
  it('clamps and floors out-of-range values', () => {
    const s = sanitizeCompoundGrowthInput({
      initialInvestment: -100,
      monthlyContribution: -5,
      annualReturnRate: 500,
      years: 2.9,
      compoundingFrequency: 'quarterly',
    });
    expect(s.initialInvestment).toBe(0);
    expect(s.monthlyContribution).toBe(0);
    expect(s.annualReturnRate).toBe(100);
    expect(s.years).toBe(2);
    expect(s.compoundingFrequency).toBe('quarterly');
  });

  it('clamps years to 100 and rate to −100', () => {
    const s = sanitizeCompoundGrowthInput({
      initialInvestment: 1,
      monthlyContribution: 1,
      annualReturnRate: -250,
      years: 9999,
      compoundingFrequency: 'annually',
    });
    expect(s.annualReturnRate).toBe(-100);
    expect(s.years).toBe(100);
  });
});

describe('formatCurrency', () => {
  it('formats positive and negative USD with the sign outside the symbol', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(-1234.5)).toBe('-$1,234.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('renders a dash for non-finite values', () => {
    expect(formatCurrency(Number.NaN)).toBe('—');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
