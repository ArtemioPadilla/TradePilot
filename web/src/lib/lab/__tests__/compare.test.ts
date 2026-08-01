/**
 * Tests: compare table rows (metric coercion, stable colors, label
 * fallback/dedupe) and curve alignment (union axis, forward-fill,
 * downsampling).
 */

import { describe, expect, it } from 'vitest';
import { COMPARE_METRICS, alignCurves, buildCompareRows } from '../compare';
import { makeResult } from './fixtures';

describe('buildCompareRows', () => {
  it('builds one row per successful result with all 8 headline metrics', () => {
    const a = makeResult({
      annualizedReturn: 0.12,
      annualizedVol: 0.2,
      sharpeRatio: 0.9,
      sortinoRatio: 1.3,
      maxDrawdown: -0.25,
      calmarRatio: 0.48,
      winRate: 0.6,
      profitFactor: 1.8,
    });
    const rows = buildCompareRows(['Momentum'], [a]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe('Momentum');
    expect(rows[0]!.color).toBe(0);
    expect(Object.keys(rows[0]!.metrics).sort()).toEqual([...COMPARE_METRICS].sort());
    expect(rows[0]!.metrics).toEqual({
      annualizedReturn: 0.12,
      annualizedVol: 0.2,
      sharpeRatio: 0.9,
      sortinoRatio: 1.3,
      maxDrawdown: -0.25,
      calmarRatio: 0.48,
      winRate: 0.6,
      profitFactor: 1.8,
    });
  });

  it('skips null results but keeps colors tied to original indices', () => {
    const rows = buildCompareRows(
      ['A', 'B', 'C'],
      [makeResult(), null, makeResult()],
    );
    expect(rows.map(r => r.label)).toEqual(['A', 'C']);
    expect(rows.map(r => r.color)).toEqual([0, 2]);
  });

  it('coerces Infinity profitFactor and NaN metrics to 0', () => {
    const rows = buildCompareRows(
      ['inf'],
      [makeResult({ profitFactor: Number.POSITIVE_INFINITY, sortinoRatio: Number.NaN })],
    );
    expect(rows[0]!.metrics['profitFactor']).toBe(0);
    expect(rows[0]!.metrics['sortinoRatio']).toBe(0);
    expect(rows[0]!.metrics['sharpeRatio']).toBe(0.8); // untouched fixture value
  });

  it('falls back to "Run N" for missing or blank labels and dedupes duplicates', () => {
    const rows = buildCompareRows(
      ['Same', 'Same', '  '],
      [makeResult(), makeResult(), makeResult()],
    );
    expect(rows.map(r => r.label)).toEqual(['Same', 'Same (2)', 'Run 3']);
  });
});

describe('alignCurves', () => {
  const curveA = {
    dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
    values: [100, 110, 120],
  };
  const curveB = {
    dates: ['2024-01-02', '2024-01-04'],
    values: [200, 240],
  };

  it('merges onto the union date axis with forward-fill', () => {
    const rows = alignCurves([makeResult({}, curveA), makeResult({}, curveB)], ['A', 'B']);
    expect(rows).toEqual([
      { date: '2024-01-01', A: 100 }, // B not yet started: key omitted
      { date: '2024-01-02', A: 110, B: 200 },
      { date: '2024-01-03', A: 120, B: 200 }, // B forward-filled
      { date: '2024-01-04', A: 120, B: 240 }, // A forward-filled
    ]);
  });

  it('skips null results entirely', () => {
    const rows = alignCurves([null, makeResult({}, curveA)], ['dead', 'live']);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ date: '2024-01-01', live: 100 });
    expect(Object.keys(rows[0]!)).not.toContain('dead');
  });

  it('downsamples evenly, keeping first and last dates', () => {
    const dates = Array.from({ length: 11 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);
    const values = dates.map((_, i) => 100 + i);
    const rows = alignCurves([makeResult({}, { dates, values })], ['S'], 5);
    // step = 10/4 = 2.5 → indices round(0, 2.5, 5, 7.5, 10) = 0, 3, 5, 8, 10
    expect(rows.map(r => r['date'])).toEqual([
      '2024-01-01',
      '2024-01-04',
      '2024-01-06',
      '2024-01-09',
      '2024-01-11',
    ]);
    expect(rows[0]!['S']).toBe(100);
    expect(rows[4]!['S']).toBe(110);
  });

  it('returns all rows when under maxPoints', () => {
    const rows = alignCurves([makeResult({}, curveA)], ['A'], 400);
    expect(rows).toHaveLength(3);
  });

  it('skips non-finite curve values instead of plotting them', () => {
    const rows = alignCurves(
      [makeResult({}, { dates: ['2024-01-01', '2024-01-02'], values: [100, Number.NaN] })],
      ['A'],
    );
    // NaN point dropped; date axis only includes dates with a real value.
    expect(rows).toEqual([{ date: '2024-01-01', A: 100 }]);
  });

  it('dedupes duplicate labels consistently with buildCompareRows', () => {
    const rows = alignCurves(
      [makeResult({}, curveA), makeResult({}, curveB)],
      ['X', 'X'],
    );
    expect(rows[1]).toEqual({ date: '2024-01-02', X: 110, 'X (2)': 200 });
  });
});
