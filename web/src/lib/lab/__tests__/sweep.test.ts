/**
 * Tests: sweep grid construction, range parsing, cell summaries.
 * All expectations hand-computed.
 */

import { describe, expect, it } from 'vitest';
import {
  MAX_RANGE_VALUES,
  SWEEP_BUDGET,
  buildSweepGrid,
  countCombinations,
  parseRange,
  sweepCellSummary,
} from '../sweep';
import type { SweepAxis } from '../sweep';
import { BASE_CONFIG, makeResult } from './fixtures';

describe('countCombinations', () => {
  it('multiplies axis lengths', () => {
    const axes: SweepAxis[] = [
      { param: 't', values: [5, 10, 15] },
      { param: 'topN', values: [3, 4, 5, 6] },
    ];
    expect(countCombinations(axes)).toBe(12);
  });

  it('returns the axis length for a single axis', () => {
    expect(countCombinations([{ param: 'window', values: [20, 60] }])).toBe(2);
  });

  it('returns 0 for no axes', () => {
    expect(countCombinations([])).toBe(0);
  });
});

describe('buildSweepGrid', () => {
  it('builds a 1-axis grid with aligned labels', () => {
    const { configs, labels } = buildSweepGrid(BASE_CONFIG, [
      { param: 't', values: [5, 10, 15] },
    ]);
    expect(configs).toHaveLength(3);
    expect(configs.map(c => c.t)).toEqual([5, 10, 15]);
    expect(labels).toEqual([['5'], ['10'], ['15']]);
    // Non-swept fields carried over from base.
    expect(configs[0]!.topN).toBe(BASE_CONFIG.topN);
    expect(configs[0]!.symbols).toEqual(BASE_CONFIG.symbols);
  });

  it('builds a 2-axis grid row-major (first axis slowest)', () => {
    const { configs, labels } = buildSweepGrid(BASE_CONFIG, [
      { param: 't', values: [5, 10] },
      { param: 'topN', values: [3, 4, 5] },
    ]);
    expect(configs).toHaveLength(6);
    expect(configs.map(c => [c.t, c.topN])).toEqual([
      [5, 3], [5, 4], [5, 5],
      [10, 3], [10, 4], [10, 5],
    ]);
    expect(labels).toEqual([
      ['5', '3'], ['5', '4'], ['5', '5'],
      ['10', '3'], ['10', '4'], ['10', '5'],
    ]);
  });

  it('does not mutate the base config and produces distinct objects', () => {
    const base = { ...BASE_CONFIG };
    const { configs } = buildSweepGrid(base, [{ param: 't', values: [1, 2] }]);
    expect(base).toEqual(BASE_CONFIG);
    expect(configs[0]).not.toBe(configs[1]);
    configs[0]!.t = 999;
    expect(configs[1]!.t).toBe(2);
  });

  it('throws when the grid exceeds the budget', () => {
    const axes: SweepAxis[] = [
      { param: 't', values: Array.from({ length: 20 }, (_, i) => i + 1) },
      { param: 'topN', values: Array.from({ length: 11 }, (_, i) => i + 1) },
    ];
    expect(countCombinations(axes)).toBe(220);
    expect(() => buildSweepGrid(BASE_CONFIG, axes)).toThrow(/220.*budget.*200/);
  });

  it(`allows exactly SWEEP_BUDGET (${SWEEP_BUDGET}) combinations`, () => {
    const axes: SweepAxis[] = [
      { param: 't', values: Array.from({ length: 20 }, (_, i) => i + 1) },
      { param: 'topN', values: Array.from({ length: 10 }, (_, i) => i + 1) },
    ];
    expect(buildSweepGrid(BASE_CONFIG, axes).configs).toHaveLength(200);
  });

  it('throws for 0 or 3 axes', () => {
    expect(() => buildSweepGrid(BASE_CONFIG, [])).toThrow(/1 or 2 axes/);
    const axis: SweepAxis = { param: 't', values: [1] };
    expect(() =>
      buildSweepGrid(BASE_CONFIG, [axis, { ...axis, param: 'topN' }, { ...axis, param: 'window' }]),
    ).toThrow(/1 or 2 axes/);
  });

  it('throws for duplicate params and empty axes', () => {
    expect(() =>
      buildSweepGrid(BASE_CONFIG, [
        { param: 't', values: [1] },
        { param: 't', values: [2] },
      ]),
    ).toThrow(/different parameters/);
    expect(() => buildSweepGrid(BASE_CONFIG, [{ param: 't', values: [] }])).toThrow(/no values/);
  });
});

describe('parseRange', () => {
  it('parses "5..30" with implicit step 1', () => {
    const values = parseRange('5..30');
    expect(values).toHaveLength(26);
    expect(values[0]).toBe(5);
    expect(values[25]).toBe(30);
  });

  it('parses "5..30:5" with explicit step', () => {
    expect(parseRange('5..30:5')).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('drops a partial final step: "5..12:5"', () => {
    expect(parseRange('5..12:5')).toEqual([5, 10]);
  });

  it('handles float steps without FP drift', () => {
    expect(parseRange('0.1..0.3:0.1')).toEqual([0.1, 0.2, 0.3]);
  });

  it('parses comma lists, trimming, sorting, and deduping', () => {
    expect(parseRange(' 8 , 3 ,3, 5 ')).toEqual([3, 5, 8]);
  });

  it('parses a single number as a one-element list', () => {
    expect(parseRange('7')).toEqual([7]);
  });

  it('allows exactly MAX_RANGE_VALUES values', () => {
    expect(parseRange('1..100')).toHaveLength(MAX_RANGE_VALUES);
  });

  it('rejects invalid specs', () => {
    expect(() => parseRange('')).toThrow(/empty/i);
    expect(() => parseRange('   ')).toThrow(/empty/i);
    expect(() => parseRange('abc')).toThrow(/invalid number/i);
    expect(() => parseRange('1,2,,3')).toThrow(/invalid number/i);
    expect(() => parseRange('30..5')).toThrow(/end must be >= start/i);
    expect(() => parseRange('5..10:0')).toThrow(/step must be positive/i);
    expect(() => parseRange('5..10:-1')).toThrow(/step must be positive/i);
    expect(() => parseRange('1..101')).toThrow(/max 100/);
  });
});

describe('sweepCellSummary', () => {
  it('extracts the three heatmap metrics', () => {
    const result = makeResult({ sharpeRatio: 1.25, annualizedReturn: 0.18, maxDrawdown: -0.31 });
    expect(sweepCellSummary(result)).toEqual({
      sharpe: 1.25,
      annualizedReturn: 0.18,
      maxDrawdown: -0.31,
    });
  });

  it('coerces non-finite values to 0', () => {
    const result = makeResult({
      sharpeRatio: Number.POSITIVE_INFINITY,
      annualizedReturn: Number.NaN,
      maxDrawdown: Number.NEGATIVE_INFINITY,
    });
    expect(sweepCellSummary(result)).toEqual({ sharpe: 0, annualizedReturn: 0, maxDrawdown: 0 });
  });
});
