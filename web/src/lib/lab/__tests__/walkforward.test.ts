/**
 * Tests: walk-forward window construction (month-end clamping, leap
 * February, partial-window rule) and out-of-sample summary math.
 * All window boundaries hand-computed.
 */

import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  addMonthsISO,
  buildWalkForwardWindows,
  summarizeWalkForward,
} from '../walkforward';
import { makeResult } from './fixtures';

describe('addMonthsISO', () => {
  it('adds plain months', () => {
    expect(addMonthsISO('2020-01-01', 3)).toBe('2020-04-01');
    expect(addMonthsISO('2020-11-15', 2)).toBe('2021-01-15');
  });

  it('clamps month-end overflow into leap February', () => {
    expect(addMonthsISO('2020-01-31', 1)).toBe('2020-02-29');
  });

  it('clamps month-end overflow into non-leap February', () => {
    expect(addMonthsISO('2019-01-31', 1)).toBe('2019-02-28');
    expect(addMonthsISO('2020-01-31', 13)).toBe('2021-02-28');
  });

  it('clamps 31st into 30-day months', () => {
    expect(addMonthsISO('2020-03-31', 1)).toBe('2020-04-30');
  });

  it('rejects malformed and impossible dates', () => {
    expect(() => addMonthsISO('2020-1-01', 1)).toThrow(/invalid iso date/i);
    expect(() => addMonthsISO('2021-02-30', 1)).toThrow(/invalid calendar date/i);
  });
});

describe('addDaysISO', () => {
  it('crosses month and leap boundaries', () => {
    expect(addDaysISO('2020-03-01', -1)).toBe('2020-02-29');
    expect(addDaysISO('2019-03-01', -1)).toBe('2019-02-28');
    expect(addDaysISO('2020-12-31', 1)).toBe('2021-01-01');
  });
});

describe('buildWalkForwardWindows', () => {
  it('builds rolling 12m train / 3m test windows over 2 years', () => {
    const windows = buildWalkForwardWindows('2020-01-01', '2021-12-31', 12, 3);
    expect(windows).toHaveLength(4);
    expect(windows[0]).toEqual({
      trainStart: '2020-01-01',
      trainEnd: '2020-12-31',
      testStart: '2021-01-01',
      testEnd: '2021-03-31',
    });
    expect(windows[1]).toEqual({
      trainStart: '2020-04-01',
      trainEnd: '2021-03-31',
      testStart: '2021-04-01',
      testEnd: '2021-06-30',
    });
    expect(windows[3]).toEqual({
      trainStart: '2020-10-01',
      trainEnd: '2021-09-30',
      testStart: '2021-10-01',
      testEnd: '2021-12-31',
    });
  });

  it('keeps train and test adjacent and disjoint', () => {
    const windows = buildWalkForwardWindows('2020-01-01', '2021-12-31', 12, 3);
    for (const w of windows) {
      expect(addDaysISO(w.trainEnd, 1)).toBe(w.testStart);
      expect(w.trainStart < w.trainEnd).toBe(true);
      expect(w.testStart <= w.testEnd).toBe(true);
    }
  });

  it('anchors trainStart to the original startDate (no clamp drift)', () => {
    // Starting on Jan 31: every trainStart is startDate + i months,
    // clamped independently — not Feb 29 + 1 month (= Mar 29 drift).
    const windows = buildWalkForwardWindows('2020-01-31', '2020-06-30', 1, 1);
    expect(windows.map(w => w.trainStart)).toEqual([
      '2020-01-31',
      '2020-02-29', // leap-clamped from Jan 31 + 1m
      '2020-03-31', // back on the 31st — anchored to the original start
      '2020-04-30',
    ]);
    expect(windows[0]).toEqual({
      trainStart: '2020-01-31',
      trainEnd: '2020-02-28',
      testStart: '2020-02-29',
      testEnd: '2020-03-28',
    });
  });

  it('excludes a final partial test window shorter than half the span', () => {
    // Third window: test 2020-11-01..(nominal)2020-12-31, 61 nominal days.
    // With end 2020-11-30 only 30 days remain; 30*2 < 61 → dropped.
    const windows = buildWalkForwardWindows('2020-01-01', '2020-11-30', 6, 2);
    expect(windows).toHaveLength(2);
    expect(windows[1]!.testEnd).toBe('2020-10-31');
  });

  it('includes a final partial test window of at least half the span', () => {
    // Same third window with end 2020-12-01: 31 days; 31*2 >= 61 → kept.
    const windows = buildWalkForwardWindows('2020-01-01', '2020-12-01', 6, 2);
    expect(windows).toHaveLength(3);
    expect(windows[2]).toEqual({
      trainStart: '2020-05-01',
      trainEnd: '2020-10-31',
      testStart: '2020-11-01',
      testEnd: '2020-12-01',
    });
  });

  it('throws when fewer than 2 windows fit', () => {
    // 0 windows: first test would start past the end date.
    expect(() => buildWalkForwardWindows('2020-01-01', '2020-12-31', 12, 3)).toThrow(
      /at least 2 windows/,
    );
    // Exactly 1 window (6m train + 6m test fills the whole range).
    expect(() => buildWalkForwardWindows('2020-01-01', '2020-12-31', 6, 6)).toThrow(
      /at least 2 windows/,
    );
  });

  it('validates inputs', () => {
    expect(() => buildWalkForwardWindows('2020-01-01', '2021-01-01', 0, 3)).toThrow(
      /trainMonths/,
    );
    expect(() => buildWalkForwardWindows('2020-01-01', '2021-01-01', 12, 1.5)).toThrow(
      /testMonths/,
    );
    expect(() => buildWalkForwardWindows('2021-01-01', '2020-01-01', 6, 3)).toThrow(
      /before endDate/,
    );
    expect(() => buildWalkForwardWindows('2020/01/01', '2021-01-01', 6, 3)).toThrow(
      /invalid iso date/i,
    );
  });
});

describe('summarizeWalkForward', () => {
  const windows = buildWalkForwardWindows('2020-01-01', '2021-12-31', 12, 6);
  // 2 windows: tests 2021-01-01..06-30 and 2021-07-01..12-31.

  it('computes per-window metrics, OOS means, and degradation', () => {
    const inSample = [makeResult({ sharpeRatio: 1.0 }), makeResult({ sharpeRatio: 2.0 })];
    const outSample = [
      makeResult({ sharpeRatio: 0.5, annualizedReturn: 0.06, maxDrawdown: -0.1 }),
      makeResult({ sharpeRatio: 1.0, annualizedReturn: 0.1, maxDrawdown: -0.3 }),
    ];
    const summary = summarizeWalkForward(inSample, outSample, windows);

    expect(summary.windows).toHaveLength(2);
    expect(summary.windows[0]!.window).toEqual(windows[0]);
    expect(summary.windows[0]!.metrics).toEqual({
      sharpe: 0.5,
      annualizedReturn: 0.06,
      maxDrawdown: -0.1,
    });
    expect(summary.oosMean.sharpe).toBeCloseTo(0.75, 12);
    expect(summary.oosMean.annualizedReturn).toBeCloseTo(0.08, 12);
    // degradation = 1 - (0.75 / 1.5) = 0.5
    expect(summary.degradation).toBeCloseTo(0.5, 12);
  });

  it('falls back to degradation 0 when mean IS sharpe is zero or negative', () => {
    const outSample = [makeResult({ sharpeRatio: 0.5 }), makeResult({ sharpeRatio: 0.5 })];
    const zeroIS = [makeResult({ sharpeRatio: 0 }), makeResult({ sharpeRatio: 0 })];
    const negIS = [makeResult({ sharpeRatio: -1 }), makeResult({ sharpeRatio: -2 })];
    expect(summarizeWalkForward(zeroIS, outSample, windows).degradation).toBe(0);
    expect(summarizeWalkForward(negIS, outSample, windows).degradation).toBe(0);
  });

  it('finite-coerces non-finite sharpes before averaging', () => {
    const inSample = [
      makeResult({ sharpeRatio: Number.POSITIVE_INFINITY }),
      makeResult({ sharpeRatio: 2.0 }),
    ];
    const outSample = [
      makeResult({ sharpeRatio: Number.NaN }),
      makeResult({ sharpeRatio: 1.0 }),
    ];
    const summary = summarizeWalkForward(inSample, outSample, windows);
    // IS mean = (0 + 2) / 2 = 1; OOS mean = (0 + 1) / 2 = 0.5.
    expect(summary.oosMean.sharpe).toBeCloseTo(0.5, 12);
    expect(summary.degradation).toBeCloseTo(0.5, 12);
  });

  it('throws on length mismatches and empty windows', () => {
    const one = [makeResult()];
    const two = [makeResult(), makeResult()];
    expect(() => summarizeWalkForward(one, two, windows)).toThrow(/mismatch/);
    expect(() => summarizeWalkForward(two, one, windows)).toThrow(/mismatch/);
    expect(() => summarizeWalkForward([], [], [])).toThrow(/at least one window/);
  });
});
