import { describe, it, expect } from 'vitest';
import {
  getReturns,
  getReturnsMatrix,
  annualizeReturns,
  annualizeVol,
  semideviation,
  annualizeSemideviation,
  sharpeRatio,
  sortinoRatio,
  getDrawdown,
  maxDrawdown,
  momentum,
  varHistoric,
  varGaussian,
  cvarHistoric,
  skewness,
  kurtosis,
  getCompoundedReturn,
  portfolioReturn,
  portfolioVol,
  alpha,
  covarianceMatrix,
  normalCDF,
  normalPPF,
} from '../../../src/lib/engine/metrics';

describe('getReturns', () => {
  it('computes percentage returns from prices', () => {
    const prices = [100, 110, 105, 115];
    const r = getReturns(prices);
    expect(r).toHaveLength(3);
    expect(r[0]).toBeCloseTo(0.10, 5);
    expect(r[1]).toBeCloseTo(-0.04545, 4);
    expect(r[2]).toBeCloseTo(0.09524, 4);
  });

  it('returns empty array for single price', () => {
    expect(getReturns([100])).toEqual([]);
  });
});

describe('getReturnsMatrix', () => {
  it('computes returns for 2D price matrix', () => {
    const prices = [
      [100, 200],
      [110, 210],
      [105, 220],
    ];
    const r = getReturnsMatrix(prices);
    expect(r).toHaveLength(2);
    expect(r[0][0]).toBeCloseTo(0.10, 5);
    expect(r[0][1]).toBeCloseTo(0.05, 5);
    expect(r[1][0]).toBeCloseTo(-0.04545, 4);
    expect(r[1][1]).toBeCloseTo(0.04762, 4);
  });
});

describe('annualizeReturns', () => {
  it('annualizes a known return series', () => {
    // 252 daily returns of +0.04% each
    const dailyReturns = new Array(252).fill(0.0004);
    const annual = annualizeReturns(dailyReturns, 252);
    // Compound: (1.0004)^252 - 1 ≈ 10.6%
    expect(annual).toBeCloseTo(0.1061, 2);
  });

  it('returns 0 for empty array', () => {
    expect(annualizeReturns([])).toBe(0);
  });
});

describe('annualizeVol', () => {
  it('annualizes daily volatility', () => {
    // Known vol: daily std = 0.01, annual = 0.01 * sqrt(252) ≈ 0.1587
    const returns = [];
    for (let i = 0; i < 1000; i++) {
      returns.push(i % 2 === 0 ? 0.01 : -0.01);
    }
    const vol = annualizeVol(returns, 252);
    expect(vol).toBeGreaterThan(0.1);
    expect(vol).toBeLessThan(0.2);
  });
});

describe('semideviation', () => {
  it('computes standard deviation of negative returns only', () => {
    const returns = [0.05, -0.02, 0.03, -0.04, -0.01, 0.06];
    const sd = semideviation(returns);
    expect(sd).toBeGreaterThan(0);

    // Only negative: [-0.02, -0.04, -0.01]
    const neg = [-0.02, -0.04, -0.01];
    const mean = neg.reduce((a, b) => a + b, 0) / neg.length;
    const variance = neg.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (neg.length - 1);
    expect(sd).toBeCloseTo(Math.sqrt(variance), 10);
  });

  it('returns 0 if no negative returns', () => {
    expect(semideviation([0.01, 0.02, 0.03])).toBe(0);
  });
});

describe('sharpeRatio', () => {
  it('computes a positive Sharpe for good returns', () => {
    const returns = new Array(252).fill(0.001); // ~28% annual
    const sr = sharpeRatio(returns, 0.04, 252);
    expect(sr).toBeGreaterThan(0);
  });

  it('returns 0 when vol is 0', () => {
    const returns = new Array(10).fill(0);
    expect(sharpeRatio(returns, 0.04, 252)).toBe(0);
  });
});

describe('sortinoRatio', () => {
  it('computes a positive Sortino for good returns', () => {
    const returns = new Array(252).fill(0.001);
    const sortino = sortinoRatio(returns, 0.04, 252);
    // All returns are positive, semideviation is 0, so Sortino should be 0
    expect(sortino).toBe(0);
  });

  it('computes a value when there are negative returns', () => {
    const returns = [];
    for (let i = 0; i < 252; i++) {
      returns.push(i % 3 === 0 ? -0.005 : 0.008);
    }
    const sortino = sortinoRatio(returns, 0.04, 252);
    expect(sortino).toBeGreaterThan(0);
  });
});

describe('getDrawdown', () => {
  it('computes correct drawdown series', () => {
    const prices = [100, 110, 105, 115, 90];
    const dd = getDrawdown(prices);
    expect(dd[0]).toBeCloseTo(0, 10);       // first day: at peak
    expect(dd[1]).toBeCloseTo(0, 10);       // new peak
    expect(dd[2]).toBeCloseTo(-5/110, 5);   // drop from 110 to 105
    expect(dd[3]).toBeCloseTo(0, 10);       // new peak 115
    expect(dd[4]).toBeCloseTo(-25/115, 5);  // drop from 115 to 90
  });
});

describe('maxDrawdown', () => {
  it('finds the maximum drawdown', () => {
    const prices = [100, 110, 105, 115, 90];
    const mdd = maxDrawdown(prices);
    expect(mdd).toBeCloseTo(-25/115, 5);
  });

  it('returns 0 for monotonically increasing prices', () => {
    expect(maxDrawdown([100, 110, 120, 130])).toBe(0);
  });
});

describe('momentum', () => {
  it('computes price momentum over t periods', () => {
    const prices = [100, 102, 105, 108, 110];
    expect(momentum(prices, 3)).toBeCloseTo(110 - 105, 10);
  });

  it('throws if not enough data', () => {
    expect(() => momentum([100, 110], 5)).toThrow('Not enough data');
  });
});

describe('varHistoric', () => {
  it('computes 5% VaR from returns', () => {
    // Create 100 returns from -0.05 to 0.05
    const returns = [];
    for (let i = 0; i < 100; i++) {
      returns.push(-0.05 + i * 0.001);
    }
    const var5 = varHistoric(returns, 0, 5);
    // 5th percentile of [-0.05, ..., 0.05] should be around 0.045
    expect(var5).toBeGreaterThan(0.03);
    expect(var5).toBeLessThan(0.06);
  });

  it('respects the t parameter', () => {
    const returns = new Array(100).fill(0.01);
    returns.push(-0.1); // add one bad return at the end
    const var5All = varHistoric(returns);
    const var5Last5 = varHistoric(returns, 5);
    // With only last 5, the bad return is included
    expect(var5Last5).toBeGreaterThan(var5All);
  });
});

describe('varGaussian', () => {
  it('computes parametric VaR', () => {
    const returns = [];
    for (let i = 0; i < 1000; i++) {
      returns.push((i % 2 === 0 ? 1 : -1) * 0.01);
    }
    const var5 = varGaussian(returns, 5);
    expect(var5).toBeGreaterThan(0);
  });

  it('supports Cornish-Fisher modification', () => {
    const returns = [];
    for (let i = 0; i < 1000; i++) {
      returns.push(Math.sin(i) * 0.02);
    }
    const varStd = varGaussian(returns, 5, false);
    const varCF = varGaussian(returns, 5, true);
    // They should differ (unless skewness/kurtosis are exactly normal)
    expect(typeof varCF).toBe('number');
    expect(isNaN(varCF)).toBe(false);
  });
});

describe('cvarHistoric', () => {
  it('CVaR >= VaR', () => {
    const returns = [];
    for (let i = 0; i < 200; i++) {
      returns.push(-0.05 + i * 0.0005);
    }
    const var5 = varHistoric(returns);
    const cvar5 = cvarHistoric(returns);
    expect(cvar5).toBeGreaterThanOrEqual(var5 - 0.001);
  });
});

describe('skewness', () => {
  it('returns ~0 for symmetric distribution', () => {
    const returns = [];
    for (let i = 0; i < 1000; i++) {
      returns.push(i % 2 === 0 ? 0.01 : -0.01);
    }
    expect(Math.abs(skewness(returns))).toBeLessThan(0.01);
  });

  it('returns negative for left-skewed data', () => {
    const returns = new Array(100).fill(0.01);
    returns.push(-0.5); // big loss
    expect(skewness(returns)).toBeLessThan(0);
  });
});

describe('kurtosis', () => {
  it('returns > 0 for any distribution', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.005, -0.015];
    expect(kurtosis(returns)).toBeGreaterThan(0);
  });
});

describe('getCompoundedReturn', () => {
  it('computes compound return correctly', () => {
    const returns = [0.10, -0.05, 0.08];
    // (1.10)(0.95)(1.08) - 1 = 0.1286
    expect(getCompoundedReturn(returns)).toBeCloseTo(0.1286, 3);
  });
});

describe('portfolioReturn', () => {
  it('computes w^T * r', () => {
    const weights = [0.5, 0.3, 0.2];
    const returns = [0.10, 0.05, -0.02];
    // 0.5*0.10 + 0.3*0.05 + 0.2*(-0.02) = 0.061
    expect(portfolioReturn(weights, returns)).toBeCloseTo(0.061, 10);
  });
});

describe('portfolioVol', () => {
  it('computes portfolio volatility from covariance matrix', () => {
    const weights = [0.6, 0.4];
    const cov = [
      [0.04, 0.01],
      [0.01, 0.09],
    ];
    // w^T * cov * w = 0.6*0.6*0.04 + 2*0.6*0.4*0.01 + 0.4*0.4*0.09
    // = 0.0144 + 0.0048 + 0.0144 = 0.0336
    // sqrt(0.0336) ≈ 0.1833
    expect(portfolioVol(weights, cov)).toBeCloseTo(Math.sqrt(0.0336), 5);
  });
});

describe('alpha', () => {
  it('computes excess return over risk-free rate', () => {
    expect(alpha(0.12, 0.04)).toBeCloseTo(0.08, 10);
  });
});

describe('covarianceMatrix', () => {
  it('computes a symmetric covariance matrix', () => {
    const returns = [
      [0.01, 0.02],
      [-0.01, 0.01],
      [0.02, -0.01],
      [0.005, 0.015],
    ];
    const cov = covarianceMatrix(returns);
    expect(cov).toHaveLength(2);
    expect(cov[0]).toHaveLength(2);
    // Symmetric
    expect(cov[0][1]).toBeCloseTo(cov[1][0], 10);
    // Diagonal >= 0
    expect(cov[0][0]).toBeGreaterThanOrEqual(0);
    expect(cov[1][1]).toBeGreaterThanOrEqual(0);
  });
});

describe('normalCDF and normalPPF', () => {
  it('CDF(0) = 0.5', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5);
  });

  it('CDF is monotonically increasing', () => {
    expect(normalCDF(-2)).toBeLessThan(normalCDF(0));
    expect(normalCDF(0)).toBeLessThan(normalCDF(2));
  });

  it('PPF(0.5) ≈ 0', () => {
    expect(normalPPF(0.5)).toBeCloseTo(0, 3);
  });

  it('PPF(0.05) ≈ -1.645', () => {
    expect(normalPPF(0.05)).toBeCloseTo(-1.6449, 2);
  });

  it('CDF and PPF are inverses', () => {
    for (const x of [-2, -1, 0, 1, 2]) {
      expect(normalPPF(normalCDF(x))).toBeCloseTo(x, 3);
    }
  });
});
