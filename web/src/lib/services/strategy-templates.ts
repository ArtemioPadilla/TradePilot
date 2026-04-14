/**
 * Pre-built Strategy Templates
 *
 * Demo strategies that work without an API key.
 * Each template includes the strategy code, a description, and explanation.
 */

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  code: string;
  explanation: string;
}

export const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'momentum-crossover',
    name: 'Momentum Crossover',
    description: 'Buy when fast moving average crosses above slow moving average',
    prompt: 'Buy stocks where the 10-day moving average crosses above the 50-day moving average, ranking by crossover strength',
    code: `function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[] {
  const fast = params.fast || 10;
  const slow = params.slow || 50;
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < slow) continue;

    const fastMA = p.slice(-fast).reduce((a, b) => a + b, 0) / fast;
    const slowMA = p.slice(-slow).reduce((a, b) => a + b, 0) / slow;

    // Score = how far fast MA is above slow MA (as percentage)
    const crossoverStrength = (fastMA - slowMA) / slowMA;

    // Only include if fast MA is above slow MA (bullish crossover)
    if (fastMA > slowMA) {
      scores.push({ symbol, score: crossoverStrength });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}`,
    explanation: `**Momentum Crossover Strategy**

This strategy uses two moving averages (fast and slow) to detect momentum shifts:

1. **Fast MA (10-day)**: Reacts quickly to recent price changes
2. **Slow MA (50-day)**: Represents the longer-term trend
3. **Signal**: When the fast MA crosses above the slow MA, it indicates bullish momentum
4. **Ranking**: Stocks are ranked by crossover strength — how far above the slow MA the fast MA sits

This is a classic trend-following approach. Stocks with the strongest upward momentum crossover get the highest priority.`,
  },
  {
    id: 'rsi-mean-reversion',
    name: 'RSI Mean Reversion',
    description: 'Buy oversold stocks based on RSI, sell overbought ones',
    prompt: 'Buy stocks with RSI below 30 (oversold), rank by how oversold they are. Use a 14-day RSI.',
    code: `function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[] {
  const period = params.period || 14;
  const threshold = params.threshold || 30;
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < period + 1) continue;

    // Calculate RSI
    let gains = 0;
    let losses = 0;

    for (let i = p.length - period; i < p.length; i++) {
      const change = p[i] - p[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    // Lower RSI = more oversold = higher priority
    if (rsi < threshold) {
      scores.push({ symbol, score: -rsi });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}`,
    explanation: `**RSI Mean Reversion Strategy**

This strategy identifies oversold stocks using the Relative Strength Index (RSI):

1. **RSI Calculation**: Measures the ratio of recent gains to recent losses over 14 days
2. **Oversold Signal**: RSI below 30 indicates a stock may be oversold
3. **Ranking**: The most oversold stocks (lowest RSI) get the highest priority
4. **Mean Reversion**: The assumption is that oversold stocks will bounce back toward their average

This is a contrarian approach — buying when others are selling, expecting a reversion to the mean.`,
  },
  {
    id: 'volatility-breakout',
    name: 'Volatility Breakout',
    description: 'Buy stocks breaking out on expanding volatility',
    prompt: 'Find stocks where current price breaks above the upper Bollinger Band (20-day, 2 std dev), rank by breakout magnitude',
    code: `function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[] {
  const period = params.period || 20;
  const numStd = params.numStd || 2;
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < period) continue;

    const window = p.slice(-period);
    const sma = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((acc, v) => acc + (v - sma) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    const upperBand = sma + numStd * stdDev;
    const currentPrice = p[p.length - 1];

    // Only include if price is above the upper band (breakout)
    if (currentPrice > upperBand && stdDev > 0) {
      const breakoutMagnitude = (currentPrice - upperBand) / stdDev;
      scores.push({ symbol, score: breakoutMagnitude });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}`,
    explanation: `**Volatility Breakout Strategy**

This strategy uses Bollinger Bands to detect price breakouts:

1. **Bollinger Bands**: A 20-day moving average with bands at 2 standard deviations above and below
2. **Breakout Signal**: When price exceeds the upper band, it signals strong upward momentum
3. **Ranking**: Stocks are ranked by how far above the upper band they are (in standard deviations)
4. **Volatility Expansion**: Breakouts accompanied by expanding volatility tend to continue

This strategy captures strong momentum moves as prices break out of their normal trading range.`,
  },
  {
    id: 'pairs-relative-value',
    name: 'Relative Value',
    description: 'Rank stocks by their recent performance relative to the group average',
    prompt: 'Rank stocks by how much they outperform or underperform the group average over the last 20 days. Buy the worst relative performers expecting reversion.',
    code: `function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[] {
  const period = params.period || 20;
  const scores: { symbol: string; score: number }[] = [];

  // Calculate each stock's return over the period
  const returns: Map<string, number> = new Map();
  for (const [symbol, p] of prices) {
    if (p.length < period) continue;
    const ret = (p[p.length - 1] - p[p.length - period]) / p[p.length - period];
    returns.set(symbol, ret);
  }

  // Calculate average return across all stocks
  const allReturns = Array.from(returns.values());
  if (allReturns.length === 0) return [];
  const avgReturn = allReturns.reduce((a, b) => a + b, 0) / allReturns.length;

  // Score = how far below average (most underperforming = highest priority for mean reversion)
  for (const [symbol, ret] of returns) {
    const relativePerf = ret - avgReturn;
    scores.push({ symbol, score: -relativePerf });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}`,
    explanation: `**Relative Value Strategy**

This strategy identifies stocks that have underperformed their peers:

1. **Relative Performance**: Each stock's return is compared to the group average over 20 days
2. **Underperformers First**: Stocks that lagged the group the most are ranked highest
3. **Mean Reversion**: The assumption is that relative underperformers will catch up to the group
4. **Market Neutral Concept**: By focusing on relative performance, this approach is less sensitive to overall market direction

This is a pairs-trading-inspired strategy applied across the whole universe — buying laggards and expecting convergence.`,
  },
  {
    id: 'dual-momentum',
    name: 'Dual Momentum',
    description: 'Combine absolute and relative momentum for robust stock selection',
    prompt: 'Select stocks that have both positive absolute momentum (price above 200-day average) and strong relative momentum (top performers over 60 days)',
    code: `function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[] {
  const absolutePeriod = params.absolutePeriod || 200;
  const relativePeriod = params.relativePeriod || 60;
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < absolutePeriod) continue;

    // Absolute momentum: price must be above 200-day MA
    const longMA = p.slice(-absolutePeriod).reduce((a, b) => a + b, 0) / absolutePeriod;
    const currentPrice = p[p.length - 1];

    if (currentPrice <= longMA) continue; // Skip stocks in downtrend

    // Relative momentum: return over the shorter period
    const startPrice = p[p.length - relativePeriod];
    const relMomentum = startPrice > 0 ? (currentPrice - startPrice) / startPrice : 0;

    scores.push({ symbol, score: relMomentum });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}`,
    explanation: `**Dual Momentum Strategy**

This strategy combines two types of momentum for more robust stock selection:

1. **Absolute Momentum Filter**: Only considers stocks trading above their 200-day moving average (confirming uptrend)
2. **Relative Momentum Ranking**: Among qualifying stocks, ranks by 60-day return (strongest performers first)
3. **Dual Filter**: Requires both conditions — this avoids buying stocks with short-term bounces in long-term downtrends
4. **Risk Management**: The absolute momentum filter naturally reduces exposure during bear markets

This approach, popularized by Gary Antonacci, combines trend-following with relative strength for improved risk-adjusted returns.`,
  },
];

export function getTemplateById(id: string): StrategyTemplate | undefined {
  return strategyTemplates.find(t => t.id === id);
}
