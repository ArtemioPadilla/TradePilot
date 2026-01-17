import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber, cn } from '../../src/lib/utils';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large numbers correctly', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages correctly', () => {
    expect(formatPercent(0.1234)).toBe('+12.34%');
  });

  it('formats negative percentages correctly', () => {
    expect(formatPercent(-0.1234)).toBe('-12.34%');
  });

  it('formats zero correctly', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });
});

describe('formatNumber', () => {
  it('formats numbers with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('respects decimal places', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
  });
});

describe('cn (classnames utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });
});
