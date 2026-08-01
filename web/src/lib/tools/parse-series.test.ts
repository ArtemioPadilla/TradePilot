/**
 * DESTINATION: web/src/lib/tools/parse-series.test.ts
 * (or web/src/lib/tools/__tests__/parse-series.test.ts — match repo convention)
 */
import { describe, expect, it } from 'vitest';

import { parseNumberList, parsePositiveSeries } from '@/lib/tools/parse-series';

describe('parseNumberList', () => {
  it('parses a simple comma list', () => {
    expect(parseNumberList('1, 2, 3')).toEqual({ values: [1, 2, 3], skipped: 0 });
  });

  it('accepts mixed separators: commas, semicolons, spaces, tabs, newlines', () => {
    expect(parseNumberList('0.01 -0.02;0.005\n0.03,\t0.001')).toEqual({
      values: [0.01, -0.02, 0.005, 0.03, 0.001],
      skipped: 0,
    });
  });

  it('converts % suffix tokens to decimals', () => {
    expect(parseNumberList('1.5%, -0.5%, 2')).toEqual({
      values: [0.015, -0.005, 2],
      skipped: 0,
    });
  });

  it('skips unparseable tokens and counts them, ignoring empty tokens', () => {
    // "abc" skipped; empty tokens from ", ," are separator noise, not skips
    expect(parseNumberList('abc, 1, ,')).toEqual({ values: [1], skipped: 1 });
  });

  it('counts a bare % as skipped (empty numeric part)', () => {
    expect(parseNumberList('%, 5%')).toEqual({ values: [0.05], skipped: 1 });
  });

  it('returns empty for empty or whitespace-only input', () => {
    expect(parseNumberList('')).toEqual({ values: [], skipped: 0 });
    expect(parseNumberList('  \n \t ')).toEqual({ values: [], skipped: 0 });
  });

  it('accepts scientific notation', () => {
    expect(parseNumberList('1e-2, -2.5e1')).toEqual({ values: [0.01, -25], skipped: 0 });
  });

  it('skips non-finite tokens like Infinity and NaN', () => {
    expect(parseNumberList('Infinity, -Infinity, NaN, 4')).toEqual({
      values: [4],
      skipped: 3,
    });
  });

  it('handles trailing separators and leading whitespace', () => {
    expect(parseNumberList('  7,\n')).toEqual({ values: [7], skipped: 0 });
  });
});

describe('parsePositiveSeries', () => {
  it('drops zero and negative values, counting them as skipped', () => {
    expect(parsePositiveSeries('100, -50, 0, 200')).toEqual({
      values: [100, 200],
      skipped: 2,
    });
  });

  it('combines parse skips with positivity skips', () => {
    expect(parsePositiveSeries('abc 100 -1')).toEqual({ values: [100], skipped: 2 });
  });

  it('passes through an all-positive series untouched', () => {
    expect(parsePositiveSeries('10 20 30')).toEqual({ values: [10, 20, 30], skipped: 0 });
  });
});
