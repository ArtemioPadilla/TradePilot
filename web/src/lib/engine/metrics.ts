/**
 * TradePilot Engine — Financial Metrics
 *
 * Pure TypeScript port of tradepilot/metrics.py.
 * All functions operate on plain number arrays — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Standard deviation (population: ddof=0, sample: ddof=1). */
function std(arr: number[], ddof = 1): number {
  const n = arr.length;
  if (n <= ddof) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - ddof);
  return Math.sqrt(variance);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Rational approximation of the standard normal CDF.
 * Abramowitz & Stegun formula 26.2.17, max error ~1.5e-7.
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF (quantile function) via rational approximation.
 * Peter Acklam's algorithm, good to ~1.15e-9 in the central region.
 */
export function normalPPF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2,
    -2.759285104469687e2, 1.383577518672690e2,
    -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2,
    -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1,
    -2.400758277161838e0, -2.549732539343734e0,
    4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1,
    2.445134137142996e0, 3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

/**
 * Percentage returns from a price series.
 * R_t = (P_t - P_{t-1}) / P_{t-1}
 */
export function getReturns(prices: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    r.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return r;
}

/**
 * Returns from a 2D price matrix (rows=time, cols=assets).
 * Each column produces a return series.
 */
export function getReturnsMatrix(prices: number[][]): number[][] {
  if (prices.length < 2) return [];
  const result: number[][] = [];
  for (let t = 1; t < prices.length; t++) {
    const row: number[] = [];
    for (let j = 0; j < prices[0].length; j++) {
      row.push((prices[t][j] - prices[t - 1][j]) / prices[t - 1][j]);
    }
    result.push(row);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Annualized metrics
// ---------------------------------------------------------------------------

/**
 * Annualized compound return.
 * R_annual = (prod(1 + R_t))^(periodsPerYear/N) - 1
 */
export function annualizeReturns(returns: number[], periodsPerYear = 252): number {
  if (returns.length === 0) return 0;
  const compound = returns.reduce((acc, r) => acc * (1 + r), 1);
  return Math.pow(compound, periodsPerYear / returns.length) - 1;
}

/**
 * Annualized volatility.
 * sigma_annual = std(R) * sqrt(periodsPerYear)
 */
export function annualizeVol(returns: number[], periodsPerYear = 252): number {
  return std(returns) * Math.sqrt(periodsPerYear);
}

/**
 * Semideviation — std of negative returns only.
 * sigma_down = std(R | R < 0)
 */
export function semideviation(returns: number[]): number {
  const neg = returns.filter(r => r < 0);
  return neg.length > 0 ? std(neg) : 0;
}

/**
 * Annualized semideviation.
 */
export function annualizeSemideviation(returns: number[], periodsPerYear = 252): number {
  return semideviation(returns) * Math.sqrt(periodsPerYear);
}

// ---------------------------------------------------------------------------
// Risk-adjusted ratios
// ---------------------------------------------------------------------------

/**
 * Annualized Sharpe ratio.
 * SR = annualize(R - Rf_per_period) / annualizeVol(R)
 */
export function sharpeRatio(returns: number[], riskFreeRate: number, periodsPerYear = 252): number {
  const rfPerPeriod = Math.pow(1 + riskFreeRate, 1 / periodsPerYear) - 1;
  const excess = returns.map(r => r - rfPerPeriod);
  const annRet = annualizeReturns(excess, periodsPerYear);
  const annVol = annualizeVol(returns, periodsPerYear);
  return annVol === 0 ? 0 : annRet / annVol;
}

/**
 * Annualized Sortino ratio.
 * Sortino = annualize(R - Rf_per_period) / annualizeSemideviation(R)
 */
export function sortinoRatio(returns: number[], riskFreeRate: number, periodsPerYear = 252): number {
  const rfPerPeriod = Math.pow(1 + riskFreeRate, 1 / periodsPerYear) - 1;
  const excess = returns.map(r => r - rfPerPeriod);
  const annRet = annualizeReturns(excess, periodsPerYear);
  const annSemiDev = annualizeSemideviation(returns, periodsPerYear);
  return annSemiDev === 0 ? 0 : annRet / annSemiDev;
}

// ---------------------------------------------------------------------------
// Drawdown
// ---------------------------------------------------------------------------

/**
 * Drawdown series: (price - cumMax) / cumMax.
 * Always <= 0.
 */
export function getDrawdown(prices: number[]): number[] {
  const dd: number[] = [];
  let peak = -Infinity;
  for (const p of prices) {
    if (p > peak) peak = p;
    dd.push((p - peak) / peak);
  }
  return dd;
}

/**
 * Maximum drawdown (most negative value in drawdown series).
 */
export function maxDrawdown(prices: number[]): number {
  const dd = getDrawdown(prices);
  return dd.length === 0 ? 0 : Math.min(...dd);
}

// ---------------------------------------------------------------------------
// Momentum
// ---------------------------------------------------------------------------

/**
 * Price momentum: P_latest - P_{latest-t} for each asset column.
 * `prices` is a Map of symbol -> price array.
 */
export function momentum(prices: number[], t: number): number {
  if (prices.length < t) throw new Error('Not enough data to calculate momentum.');
  return prices[prices.length - 1] - prices[prices.length - t];
}

// ---------------------------------------------------------------------------
// Value at Risk
// ---------------------------------------------------------------------------

/**
 * Percentile (0-100 scale). Linear interpolation.
 */
function percentile(sorted: number[], level: number): number {
  const idx = (level / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Historic Value at Risk at a given percentile level.
 * Returns a positive number representing the loss threshold.
 *
 * @param returns Return series.
 * @param t       If > 0, only use the last t returns.
 * @param level   Percentile level (default 5).
 */
export function varHistoric(returns: number[], t = 0, level = 5): number {
  const data = t > 0 ? returns.slice(-t) : returns;
  const sorted = [...data].sort((a, b) => a - b);
  return -percentile(sorted, level);
}

/**
 * Parametric Gaussian VaR.
 * VaR = -(mu + z * sigma)
 *
 * If modified=true, applies Cornish-Fisher adjustment using observed
 * skewness and kurtosis.
 */
export function varGaussian(returns: number[], level = 5, modified = false): number {
  let z = normalPPF(level / 100);
  if (modified) {
    const s = skewness(returns);
    const k = kurtosis(returns); // raw kurtosis
    z = z
      + (z ** 2 - 1) * s / 6
      + (z ** 3 - 3 * z) * (k - 3) / 24
      - (2 * z ** 3 - 5 * z) * (s ** 2) / 36;
  }
  const mu = mean(returns);
  const sigma = std(returns, 0); // population std (ddof=0)
  return -(mu + z * sigma);
}

/**
 * Conditional VaR (Expected Shortfall).
 * Average loss beyond the VaR threshold.
 */
export function cvarHistoric(returns: number[], t = 0, level = 5): number {
  const var5 = varHistoric(returns, t, level);
  const tail = returns.filter(r => r <= -var5);
  return tail.length > 0 ? -mean(tail) : var5;
}

// ---------------------------------------------------------------------------
// Distribution shape
// ---------------------------------------------------------------------------

/**
 * Skewness: E[(R - mu)^3] / sigma^3
 */
export function skewness(returns: number[]): number {
  const n = returns.length;
  if (n === 0) return 0;
  const mu = mean(returns);
  const sigma = std(returns, 0);
  if (sigma === 0) return 0;
  const m3 = returns.reduce((acc, r) => acc + ((r - mu) / sigma) ** 3, 0) / n;
  return m3;
}

/**
 * Kurtosis (raw, not excess): E[(R - mu)^4] / sigma^4
 * Normal distribution = 3.
 */
export function kurtosis(returns: number[]): number {
  const n = returns.length;
  if (n === 0) return 0;
  const mu = mean(returns);
  const sigma = std(returns, 0);
  if (sigma === 0) return 0;
  const m4 = returns.reduce((acc, r) => acc + ((r - mu) / sigma) ** 4, 0) / n;
  return m4;
}

// ---------------------------------------------------------------------------
// Compounded return
// ---------------------------------------------------------------------------

/**
 * Compounded return: prod(1 + R_t) - 1
 */
export function getCompoundedReturn(returns: number[]): number {
  return returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
}

// ---------------------------------------------------------------------------
// Portfolio-level metrics
// ---------------------------------------------------------------------------

/**
 * Portfolio return: w^T * r
 */
export function portfolioReturn(weights: number[], returns: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i] * returns[i];
  }
  return sum;
}

/**
 * Portfolio volatility: sqrt(w^T * Cov * w)
 */
export function portfolioVol(weights: number[], covMatrix: number[][]): number {
  const n = weights.length;
  let vol2 = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      vol2 += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  return Math.sqrt(Math.max(vol2, 0));
}

/**
 * Alpha: excess return over the risk-free rate.
 */
export function alpha(portReturn: number, riskFreeRate: number): number {
  return portReturn - riskFreeRate;
}

// ---------------------------------------------------------------------------
// Covariance matrix
// ---------------------------------------------------------------------------

/**
 * Compute the sample covariance matrix from a returns matrix.
 * Input: rows = time periods, columns = assets.
 */
export function covarianceMatrix(returns: number[][]): number[][] {
  const T = returns.length;
  if (T < 2) return [];
  const nAssets = returns[0].length;

  // means
  const means: number[] = new Array(nAssets).fill(0);
  for (let t = 0; t < T; t++) {
    for (let j = 0; j < nAssets; j++) {
      means[j] += returns[t][j];
    }
  }
  for (let j = 0; j < nAssets; j++) means[j] /= T;

  // covariance
  const cov: number[][] = Array.from({ length: nAssets }, () => new Array(nAssets).fill(0));
  for (let i = 0; i < nAssets; i++) {
    for (let j = i; j < nAssets; j++) {
      let s = 0;
      for (let t = 0; t < T; t++) {
        s += (returns[t][i] - means[i]) * (returns[t][j] - means[j]);
      }
      cov[i][j] = s / (T - 1);
      cov[j][i] = cov[i][j];
    }
  }
  return cov;
}
