// Client-side sample data generation for catalog demos — no API calls needed

export const SAMPLE_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'] as const;

export const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
};

// Seeded pseudo-random for reproducible demos
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function generateSamplePrices(
  symbols: string[] = [...SAMPLE_STOCKS],
  days: number = 252,
  seed: number = 42
): { dates: string[]; prices: Record<string, number[]> } {
  const rng = seededRandom(seed);
  const startDate = new Date('2023-01-03');
  const dates: string[] = [];
  const prices: Record<string, number[]> = {};

  // Starting prices that look realistic
  const startPrices: Record<string, number> = {
    AAPL: 130, MSFT: 240, GOOGL: 90, AMZN: 85, TSLA: 110,
  };

  for (const sym of symbols) {
    prices[sym] = [startPrices[sym] ?? 100];
  }

  dates.push(startDate.toISOString().split('T')[0]);

  for (let d = 1; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    // skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    dates.push(date.toISOString().split('T')[0]);

    for (const sym of symbols) {
      const prev = prices[sym][prices[sym].length - 1];
      // random walk with drift: mu=0.0003 (~7.5% annual), sigma=0.015-0.03
      const vol = sym === 'TSLA' ? 0.03 : 0.015;
      const drift = 0.0003;
      const change = drift + vol * (rng() + rng() + rng() - 1.5) * Math.sqrt(2);
      prices[sym].push(Math.max(prev * (1 + change), 1));
    }
  }

  return { dates, prices };
}

export function generateSampleReturns(prices: Record<string, number[]>): Record<string, number[]> {
  const returns: Record<string, number[]> = {};
  for (const [sym, p] of Object.entries(prices)) {
    returns[sym] = [];
    for (let i = 1; i < p.length; i++) {
      returns[sym].push((p[i] - p[i - 1]) / p[i - 1]);
    }
  }
  return returns;
}

// Generate covariance matrix from returns
export function computeCovMatrix(returns: Record<string, number[]>): { symbols: string[]; matrix: number[][] } {
  const symbols = Object.keys(returns);
  const n = symbols.length;
  const T = returns[symbols[0]].length;

  // means
  const means = symbols.map(s => returns[s].reduce((a, b) => a + b, 0) / T);

  // covariance
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      let cov = 0;
      for (let t = 0; t < T; t++) {
        cov += (returns[symbols[i]][t] - means[i]) * (returns[symbols[j]][t] - means[j]);
      }
      matrix[i][j] = cov / (T - 1);
    }
  }
  return { symbols, matrix };
}

// Annualized returns from daily returns
export function annualizeReturns(dailyReturns: number[], periodsPerYear = 252): number {
  const compound = dailyReturns.reduce((acc, r) => acc * (1 + r), 1);
  const n = dailyReturns.length;
  if (n === 0) return 0;
  return Math.pow(compound, periodsPerYear / n) - 1;
}

// Annualized volatility
export function annualizeVol(dailyReturns: number[], periodsPerYear = 252): number {
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (dailyReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

// Portfolio return: w^T * er
export function portfolioReturn(weights: number[], expectedReturns: number[]): number {
  return weights.reduce((acc, w, i) => acc + w * expectedReturns[i], 0);
}

// Portfolio volatility: sqrt(w^T * cov * w)
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

// Generate efficient frontier points
export function generateEfficientFrontier(
  expectedReturns: number[],
  covMatrix: number[][],
  nPoints = 50
): { volatility: number; expectedReturn: number }[] {
  const minRet = Math.min(...expectedReturns);
  const maxRet = Math.max(...expectedReturns);
  const n = expectedReturns.length;
  const points: { volatility: number; expectedReturn: number }[] = [];

  for (let i = 0; i < nPoints; i++) {
    const targetRet = minRet + (maxRet - minRet) * (i / (nPoints - 1));
    // Simple approximation: interpolate weights linearly between min-var and max-return
    // For demo purposes, use a heuristic that looks reasonable
    const t = i / (nPoints - 1);
    const weights = expectedReturns.map((er, idx) => {
      // Bias toward highest-return asset as t increases
      const base = 1 / n;
      const bias = (er - minRet) / (maxRet - minRet + 1e-10);
      const w = base * (1 - t) + bias * t;
      return w;
    });
    // Normalize
    const sum = weights.reduce((a, b) => a + b, 0);
    const normWeights = weights.map(w => w / sum);

    const vol = portfolioVol(normWeights, covMatrix) * Math.sqrt(252);
    const ret = portfolioReturn(normWeights, expectedReturns);
    points.push({ volatility: vol, expectedReturn: ret });
  }

  return points;
}

// Sample backtest result
export function generateSampleBacktest(seed = 42): {
  dates: string[];
  portfolioValues: number[];
  benchmarkValues: number[];
  annualReturn: number;
  sharpe: number;
  maxDrawdown: number;
} {
  const rng = seededRandom(seed);
  const days = 252;
  const startDate = new Date('2023-01-03');
  const dates: string[] = [];
  const portfolioValues: number[] = [100000];
  const benchmarkValues: number[] = [100000];

  for (let d = 1; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    dates.push(date.toISOString().split('T')[0]);

    const prevP = portfolioValues[portfolioValues.length - 1];
    const prevB = benchmarkValues[benchmarkValues.length - 1];
    portfolioValues.push(prevP * (1 + 0.0004 + 0.012 * (rng() + rng() - 1)));
    benchmarkValues.push(prevB * (1 + 0.0003 + 0.01 * (rng() + rng() - 1)));
  }

  // Calculate metrics
  const totalReturn = portfolioValues[portfolioValues.length - 1] / portfolioValues[0] - 1;
  const annualReturn = totalReturn; // ~1 year

  let maxDD = 0;
  let peak = portfolioValues[0];
  for (const v of portfolioValues) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  return {
    dates: dates.slice(0, portfolioValues.length),
    portfolioValues,
    benchmarkValues,
    annualReturn,
    sharpe: 1.45,
    maxDrawdown: maxDD,
  };
}

// Metric calculation helpers for the metrics catalog
export function calcVaRHistoric(returns: number[], level = 5): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * level / 100);
  return -sorted[idx];
}

export function calcVaRGaussian(returns: number[], level = 5): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length);
  // Approximate z-score for 5%: -1.645
  const z = -1.645;
  return -(mean + z * std);
}

export function calcMaxDrawdown(values: number[]): number {
  let maxDD = 0;
  let peak = values[0];
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcSharpe(returns: number[], rf = 0.04): number {
  const annRet = annualizeReturns(returns);
  const annVol = annualizeVol(returns);
  return annVol === 0 ? 0 : (annRet - rf) / annVol;
}

export function calcSortino(returns: number[], rf = 0.04): number {
  const annRet = annualizeReturns(returns);
  const negReturns = returns.filter(r => r < 0);
  if (negReturns.length === 0) return 0;
  const downVol = Math.sqrt(negReturns.reduce((acc, r) => acc + r ** 2, 0) / negReturns.length) * Math.sqrt(252);
  return downVol === 0 ? 0 : (annRet - rf) / downVol;
}

export function calcSkewness(returns: number[]): number {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / n);
  if (std === 0) return 0;
  return returns.reduce((acc, r) => acc + ((r - mean) / std) ** 3, 0) / n;
}

export function calcKurtosis(returns: number[]): number {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / n);
  if (std === 0) return 0;
  return returns.reduce((acc, r) => acc + ((r - mean) / std) ** 4, 0) / n;
}
