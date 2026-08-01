/**
 * TradePilot Engine — Analytics Tests (Phase 2)
 *
 * Hand-computed fixtures for every analytics.ts function.
 * The arithmetic for each expectation is shown in comments.
 */

import { describe, it, expect } from 'vitest';
import {
  winRate,
  profitFactor,
  calmarRatio,
  avgWinLoss,
  monthlyReturns,
  topDrawdowns,
} from '../analytics';

describe('winRate', () => {
  it('counts strictly positive periods', () => {
    // [0.01, -0.02, 0.03, 0] -> positives: 0.01, 0.03 (zero is NOT a win)
    // winRate = 2 / 4 = 0.5
    expect(winRate([0.01, -0.02, 0.03, 0])).toBe(0.5);
  });

  it('is 1 for an all-positive series', () => {
    // 3 positives / 3 = 1
    expect(winRate([0.01, 0.02, 0.005])).toBe(1);
  });

  it('is 0 for an all-negative series', () => {
    expect(winRate([-0.01, -0.02])).toBe(0);
  });

  it('returns 0 for an empty series', () => {
    expect(winRate([])).toBe(0);
  });
});

describe('profitFactor', () => {
  it('divides summed gains by absolute summed losses', () => {
    // gains  = 0.02 + 0.03 = 0.05
    // losses = |-0.01| + |-0.02| = 0.03
    // PF = 0.05 / 0.03 = 5/3 = 1.6666...
    expect(profitFactor([0.02, -0.01, 0.03, -0.02])).toBeCloseTo(5 / 3, 12);
  });

  it('returns +Infinity when there are gains but no losses (documented)', () => {
    // gains = 0.03 > 0, losses = 0 -> POSITIVE_INFINITY by contract
    expect(profitFactor([0.01, 0.02])).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns 0 when there are neither gains nor losses', () => {
    expect(profitFactor([])).toBe(0);
    expect(profitFactor([0, 0])).toBe(0);
  });

  it('returns 0 when there are only losses', () => {
    // gains = 0, losses = 0.01 -> 0 / 0.01 = 0
    expect(profitFactor([-0.01])).toBe(0);
  });
});

describe('calmarRatio', () => {
  it('divides annualized return by |max drawdown|', () => {
    // 0.12 / |-0.10| = 0.12 / 0.10 = 1.2
    expect(calmarRatio(0.12, -0.1)).toBeCloseTo(1.2, 12);
  });

  it('handles negative annualized return', () => {
    // -0.05 / |-0.25| = -0.2
    expect(calmarRatio(-0.05, -0.25)).toBeCloseTo(-0.2, 12);
  });

  it('returns 0 when max drawdown is 0', () => {
    expect(calmarRatio(0.1, 0)).toBe(0);
  });
});

describe('avgWinLoss', () => {
  it('averages wins and losses separately', () => {
    // wins:   0.02, 0.04       -> avgWin  = 0.06 / 2 = 0.03
    // losses: -0.01, -0.03     -> avgLoss = -0.04 / 2 = -0.02
    const { avgWin, avgLoss } = avgWinLoss([0.02, -0.01, 0.04, -0.03]);
    expect(avgWin).toBeCloseTo(0.03, 12);
    expect(avgLoss).toBeCloseTo(-0.02, 12);
  });

  it('ignores zero returns', () => {
    // wins: 0.02 -> avgWin = 0.02; no losses -> avgLoss = 0
    const { avgWin, avgLoss } = avgWinLoss([0.02, 0]);
    expect(avgWin).toBeCloseTo(0.02, 12);
    expect(avgLoss).toBe(0);
  });

  it('returns zeros for an empty series', () => {
    expect(avgWinLoss([])).toEqual({ avgWin: 0, avgLoss: 0 });
  });
});

describe('monthlyReturns', () => {
  it('compounds within calendar months', () => {
    // dates:  Jan30    Jan31   Feb01   Feb02   Mar01
    // values: 100      102     101     103     110
    //
    // Period returns (attributed to the month of the LATER date):
    //   Jan: 102/100 - 1 = 0.02
    //   Feb: (101/102) * (103/101) - 1 = 103/102 - 1 = 0.00980392...
    //   Mar: 110/103 - 1 = 0.06796116...
    const dates = ['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02', '2024-03-01'];
    const values = [100, 102, 101, 103, 110];

    const result = monthlyReturns(dates, values);
    expect(result).toHaveLength(3);
    expect(result[0]!.month).toBe('2024-01');
    expect(result[0]!.return).toBeCloseTo(0.02, 12);
    expect(result[1]!.month).toBe('2024-02');
    expect(result[1]!.return).toBeCloseTo(103 / 102 - 1, 12);
    expect(result[2]!.month).toBe('2024-03');
    expect(result[2]!.return).toBeCloseTo(110 / 103 - 1, 12);
  });

  it('handles a single-month series', () => {
    // 100 -> 105 -> 110.25 all in Jan: 110.25/100 - 1 = 0.1025
    const dates = ['2024-01-02', '2024-01-03', '2024-01-04'];
    const values = [100, 105, 110.25];
    const result = monthlyReturns(dates, values);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ month: '2024-01', return: expect.closeTo(0.1025, 12) });
  });

  it('returns [] for fewer than 2 points', () => {
    expect(monthlyReturns(['2024-01-02'], [100])).toEqual([]);
    expect(monthlyReturns([], [])).toEqual([]);
  });
});

describe('topDrawdowns', () => {
  // Fixture (8 daily points):
  //   date:   01-01  01-02  01-03  01-04  01-05  01-06  01-07  01-08
  //   value:  100    90     95     105    100    92     96     103
  //
  // Episode A: peak 100 @ 01-01, trough 90 @ 01-02, recovers @ 01-04 (105 >= 100)
  //   depth = (90 - 100) / 100 = -0.10
  //   lengthDays = 01-04 minus 01-01 = 3
  // Episode B: peak 105 @ 01-04, trough 92 @ 01-06, never recovers (103 < 105)
  //   depth = (92 - 105) / 105 = -0.1238095...
  //   end = null; lengthDays = lastDate(01-08) minus 01-04 = 4
  //
  // Sorted by depth (deepest first): [B, A]
  const dates = [
    '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04',
    '2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08',
  ];
  const values = [100, 90, 95, 105, 100, 92, 96, 103];

  it('extracts peak/trough/recovery episodes sorted by depth', () => {
    const result = topDrawdowns(dates, values);
    expect(result).toHaveLength(2);

    // Deepest first: episode B (unrecovered)
    expect(result[0]).toEqual({
      start: '2024-01-04',
      trough: '2024-01-06',
      end: null,
      depth: expect.closeTo((92 - 105) / 105, 12),
      lengthDays: 4,
    });

    // Then episode A (recovered)
    expect(result[1]).toEqual({
      start: '2024-01-01',
      trough: '2024-01-02',
      end: '2024-01-04',
      depth: expect.closeTo(-0.1, 12),
      lengthDays: 3,
    });
  });

  it('respects the n limit', () => {
    const result = topDrawdowns(dates, values, 1);
    expect(result).toHaveLength(1);
    expect(result[0]!.start).toBe('2024-01-04'); // deepest only
  });

  it('returns [] for a monotonically rising series', () => {
    const d = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(topDrawdowns(d, [100, 101, 102])).toEqual([]);
  });

  it('returns [] for empty input', () => {
    expect(topDrawdowns([], [])).toEqual([]);
  });

  it('treats an exact retest of the peak as a recovery', () => {
    // 100 -> 95 -> 100: episode closes at the 100 retest (v >= peak)
    const d = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const result = topDrawdowns(d, [100, 95, 100]);
    expect(result).toHaveLength(1);
    expect(result[0]!.end).toBe('2024-01-03');
    expect(result[0]!.depth).toBeCloseTo(-0.05, 12);
    expect(result[0]!.lengthDays).toBe(2);
  });
});
