/**
 * Python ↔ TS engine parity (spec §3, permanent regression test).
 *
 * The fixture was produced by running the REAL Python package
 * (tradepilot/metrics.py) over deterministic synthetic prices — see
 * docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md §3.
 * Every TS metric must match Python within relative tolerance 1e-6.
 *
 * Regenerate the fixture only when the Python formulas intentionally change
 * (scratchpad script: seeded numpy walk, 260 points, seed 42).
 */
import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/python-parity.json';
import {
  getReturns,
  annualizeReturns,
  annualizeVol,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  semideviation,
  varHistoric,
  varGaussian,
  cvarHistoric,
  skewness,
  kurtosis,
  getCompoundedReturn,
  portfolioReturn,
  portfolioVol,
  covarianceMatrix,
  alpha,
} from './metrics';

const { prices, prices2, riskFreeRate, expected } = fixture;

/** Relative tolerance check (falls back to absolute near zero). */
function expectClose(actual: number, exp: number, rtol = 1e-6) {
  const scale = Math.max(Math.abs(exp), 1e-12);
  expect(Math.abs(actual - exp) / scale).toBeLessThan(rtol);
}

const r = getReturns(prices);
const r2 = getReturns(prices2);

describe('Python ↔ TS metric parity (rtol 1e-6)', () => {
  it('getReturns', () => {
    expect(r.length).toBe(expected.returnsLen);
    expected.returnsFirst5.forEach((v, i) => expectClose(r[i], v));
  });

  it('annualizeReturns', () => expectClose(annualizeReturns(r, 252), expected.annualizedReturn));
  it('annualizeVol', () => expectClose(annualizeVol(r, 252), expected.annualizedVol));
  it('sharpeRatio', () => expectClose(sharpeRatio(r, riskFreeRate, 252), expected.sharpeRatio));
  it('sortinoRatio', () => expectClose(sortinoRatio(r, riskFreeRate, 252), expected.sortinoRatio));
  it('maxDrawdown', () => expectClose(maxDrawdown(prices), expected.maxDrawdown));
  it('semideviation', () => expectClose(semideviation(r), expected.semideviation));
  it('varHistoric', () => expectClose(varHistoric(r), expected.varHistoric));
  it('varGaussian', () => expectClose(varGaussian(r), expected.varGaussian));
  it('varGaussian (Cornish-Fisher)', () =>
    expectClose(varGaussian(r, 5, true), expected.varGaussianModified));
  it('cvarHistoric', () => expectClose(cvarHistoric(r), expected.cvarHistoric));
  it('skewness', () => expectClose(skewness(r), expected.skewness));
  it('kurtosis', () => expectClose(kurtosis(r), expected.kurtosis));
  it('getCompoundedReturn', () =>
    expectClose(getCompoundedReturn(r), expected.compoundedReturn));
  it('alpha', () => expectClose(alpha(0.12, 0.04), expected.alpha));

  it('covarianceMatrix', () => {
    const returnsMatrix = r.map((v, i) => [v, r2[i]]);
    const cov = covarianceMatrix(returnsMatrix);
    expectClose(cov[0][0], expected.covariance[0][0]);
    expectClose(cov[0][1], expected.covariance[0][1]);
    expectClose(cov[1][1], expected.covariance[1][1]);
  });

  it('portfolioReturn + portfolioVol', () => {
    const w = [0.6, 0.4];
    const annualized = [annualizeReturns(r, 252), annualizeReturns(r2, 252)];
    expectClose(portfolioReturn(w, annualized), expected.portfolioReturn);
    const returnsMatrix = r.map((v, i) => [v, r2[i]]);
    expectClose(portfolioVol(w, covarianceMatrix(returnsMatrix)), expected.portfolioVol);
  });
});
