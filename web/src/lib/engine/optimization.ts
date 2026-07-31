/**
 * TradePilot Engine — Portfolio Optimization
 *
 * Pure TypeScript port of tradepilot/optimization.py.
 * Implements MSR, GMV, EW, and efficient frontier computation.
 *
 * For constrained optimization (scipy.optimize.minimize equivalent),
 * we implement a projected gradient descent with box + equality constraints.
 */

import { portfolioReturn, portfolioVol } from './metrics';
import type { EfficientFrontierResult } from './types';

// ---------------------------------------------------------------------------
// Constrained optimizer (replaces scipy.optimize.minimize SLSQP)
// ---------------------------------------------------------------------------

/**
 * Project weights onto the feasible set:
 * - Clip to [minW, maxW]
 * - Normalize so sum = 1
 *
 * Uses iterative clipping + rescaling (converges quickly for small N).
 */
function projectWeights(w: number[], minW: number, maxW: number): number[] {
  const n = w.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = w[i];

  for (let iter = 0; iter < 50; iter++) {
    // Clip
    for (let i = 0; i < n; i++) {
      out[i] = Math.max(minW, Math.min(maxW, out[i]));
    }
    // Normalize
    let sum = 0;
    for (let i = 0; i < n; i++) sum += out[i];
    if (sum === 0) {
      for (let i = 0; i < n; i++) out[i] = 1 / n;
      break;
    }
    for (let i = 0; i < n; i++) out[i] /= sum;

    // Check feasibility
    let feasible = true;
    for (let i = 0; i < n; i++) {
      if (out[i] < minW - 1e-10 || out[i] > maxW + 1e-10) {
        feasible = false;
        break;
      }
    }
    if (feasible) break;
  }

  return Array.from(out);
}

/**
 * Numerical gradient of f with respect to weights.
 */
function numericalGradient(
  f: (w: number[]) => number,
  w: number[],
  eps = 1e-7,
): number[] {
  const n = w.length;
  const grad: number[] = new Array(n);
  const f0 = f(w);
  for (let i = 0; i < n; i++) {
    const wPlus = [...w];
    wPlus[i] += eps;
    grad[i] = (f(wPlus) - f0) / eps;
  }
  return grad;
}

/**
 * Minimise an objective function subject to:
 * - weights sum to 1
 * - minW <= w_i <= maxW
 *
 * Uses projected gradient descent with adaptive step size.
 */
function minimizeConstrained(
  objective: (w: number[]) => number,
  n: number,
  minW: number,
  maxW: number,
  maxIter = 500,
  tol = 1e-10,
): number[] {
  let w = new Array(n).fill(1 / n);
  let lr = 0.1;
  let prevObj = objective(w);

  for (let iter = 0; iter < maxIter; iter++) {
    const grad = numericalGradient(objective, w);

    // Step
    const wNew = w.map((wi, i) => wi - lr * grad[i]);

    // Project
    const wProj = projectWeights(wNew, minW, maxW);
    const newObj = objective(wProj);

    if (newObj < prevObj) {
      w = wProj;
      const improvement = Math.abs(prevObj - newObj);
      prevObj = newObj;
      lr *= 1.05; // accelerate
      if (improvement < tol) break;
    } else {
      lr *= 0.5; // shrink step
      if (lr < 1e-15) break;
    }
  }

  return projectWeights(w, minW, maxW);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maximum Sharpe Ratio (MSR) portfolio.
 *
 * max_w (w^T * mu - rf) / sqrt(w^T * Sigma * w)
 * s.t.  sum(w) = 1, minW <= w_i <= maxW
 *
 * @param riskFreeRate Annual risk-free rate.
 * @param expectedReturns Expected return per asset (annualized).
 * @param covMatrix Covariance matrix of returns.
 * @param minW Minimum weight per asset (default 0.01).
 * @param maxW Maximum weight per asset (default 0.95).
 * @returns Optimal weight vector.
 */
export function msr(
  riskFreeRate: number,
  expectedReturns: number[],
  covMatrix: number[][],
  minW = 0.01,
  maxW = 0.95,
): number[] {
  const n = expectedReturns.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  const negSharpe = (w: number[]): number => {
    const ret = portfolioReturn(w, expectedReturns);
    const vol = portfolioVol(w, covMatrix);
    if (vol < 1e-15) return 1e10;
    return -(ret - riskFreeRate) / vol;
  };

  return minimizeConstrained(negSharpe, n, minW, maxW);
}

/**
 * Global Minimum Variance (GMV) portfolio.
 *
 * min_w sqrt(w^T * Sigma * w)
 *
 * Uses the MSR trick: when all expected returns are equal,
 * maximising Sharpe = minimising variance.
 *
 * @param covMatrix Covariance matrix.
 * @param minW Minimum weight per asset.
 * @param maxW Maximum weight per asset.
 * @returns Minimum variance weight vector.
 */
export function gmv(
  covMatrix: number[][],
  minW = 0.01,
  maxW = 0.95,
): number[] {
  const n = covMatrix.length;
  const equalReturns = new Array(n).fill(1);
  return msr(0, equalReturns, covMatrix, minW, maxW);
}

/**
 * Equal Weight portfolio.
 *
 * w_i = 1/N for all i.
 *
 * @param n Number of assets.
 * @returns Equal weight vector.
 */
export function equalWeight(n: number): number[] {
  if (n <= 0) return [];
  return new Array(n).fill(1 / n);
}

/**
 * Minimise portfolio volatility for a target return.
 * Used to trace the efficient frontier.
 */
export function minimizeVol(
  targetReturn: number,
  expectedReturns: number[],
  covMatrix: number[][],
): number[] {
  const n = expectedReturns.length;

  const objective = (w: number[]): number => {
    const vol = portfolioVol(w, covMatrix);
    // Penalty for deviating from target return
    const retDiff = portfolioReturn(w, expectedReturns) - targetReturn;
    return vol + 100 * retDiff * retDiff;
  };

  return minimizeConstrained(objective, n, 0, 1, 1000, 1e-12);
}

/**
 * Compute the efficient frontier: a grid of portfolios
 * from the minimum-return asset to the maximum-return asset.
 *
 * @param expectedReturns Annualized expected returns per asset.
 * @param covMatrix Covariance matrix.
 * @param nPoints Number of points on the frontier.
 * @returns Arrays of returns, volatilities, and weight vectors.
 */
export function efficientFrontier(
  expectedReturns: number[],
  covMatrix: number[][],
  nPoints = 50,
): EfficientFrontierResult {
  const minR = Math.min(...expectedReturns);
  const maxR = Math.max(...expectedReturns);

  const rets: number[] = [];
  const vols: number[] = [];
  const weights: number[][] = [];

  for (let i = 0; i < nPoints; i++) {
    const targetRet = minR + (maxR - minR) * (i / (nPoints - 1));
    const w = minimizeVol(targetRet, expectedReturns, covMatrix);
    const actualRet = portfolioReturn(w, expectedReturns);
    const vol = portfolioVol(w, covMatrix);
    rets.push(actualRet);
    vols.push(vol);
    weights.push(w);
  }

  return { returns: rets, vols, weights };
}
