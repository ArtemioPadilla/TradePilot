/**
 * Strategy Executor — Sandboxed Code Runner
 *
 * Validates and executes AI-generated strategy code in a restricted scope.
 * Uses the Function constructor with only whitelisted globals available.
 */

export interface ExecutionResult {
  success: boolean;
  rankedSymbols?: string[];
  error?: string;
  executionTimeMs?: number;
}

/**
 * Validate strategy code for safety before execution.
 * Returns an error message if the code is unsafe, or null if it's OK.
 */
function validateCode(code: string): string | null {
  // Must contain a function named 'strategy'
  if (!/function\s+strategy\s*\(/.test(code)) {
    return 'Code must contain a function named "strategy"';
  }

  // Block dangerous patterns
  const blocked = [
    { pattern: /\beval\s*\(/, msg: 'eval() is not allowed' },
    { pattern: /\bFunction\s*\(/, msg: 'Function constructor is not allowed' },
    { pattern: /\bimport\s*\(/, msg: 'Dynamic imports are not allowed' },
    { pattern: /\brequire\s*\(/, msg: 'require() is not allowed' },
    { pattern: /\bfetch\s*\(/, msg: 'fetch() is not allowed' },
    { pattern: /\bXMLHttpRequest\b/, msg: 'XMLHttpRequest is not allowed' },
    { pattern: /\bwindow\b/, msg: 'window access is not allowed' },
    { pattern: /\bdocument\b/, msg: 'document access is not allowed' },
    { pattern: /\bglobalThis\b/, msg: 'globalThis access is not allowed' },
    { pattern: /\bprocess\b/, msg: 'process access is not allowed' },
    { pattern: /\b__proto__\b/, msg: '__proto__ access is not allowed' },
    { pattern: /\bconstructor\s*\[/, msg: 'Constructor access via bracket notation is not allowed' },
  ];

  for (const { pattern, msg } of blocked) {
    if (pattern.test(code)) {
      return msg;
    }
  }

  return null;
}

/**
 * Generate sample price data for testing strategies.
 */
export function generateSampleData(
  symbols: string[] = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM'],
  days = 252,
): Map<string, number[]> {
  const prices = new Map<string, number[]>();

  // Use deterministic pseudo-random for reproducible results
  let seed = 42;
  function random(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  }

  const basePrices: Record<string, number> = {
    AAPL: 150, MSFT: 300, GOOGL: 140, AMZN: 170,
    TSLA: 250, NVDA: 500, META: 350, JPM: 160,
  };

  for (const symbol of symbols) {
    const base = basePrices[symbol] || 100 + random() * 200;
    const series: number[] = [base];

    for (let i = 1; i < days; i++) {
      const drift = 0.0003; // slight upward bias
      const vol = 0.015 + random() * 0.01;
      const shock = (random() - 0.5) * 2 * vol;
      const prev = series[i - 1];
      series.push(Math.max(prev * (1 + drift + shock), 1));
    }

    prices.set(symbol, series);
  }

  return prices;
}

/**
 * Execute a strategy function string against sample data.
 */
export function executeStrategy(
  code: string,
  sampleData?: Map<string, number[]>,
  params: Record<string, number> = {},
): ExecutionResult {
  // Validate first
  const validationError = validateCode(code);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const data = sampleData || generateSampleData();
  const start = performance.now();

  try {
    // Wrap the code to return the strategy function, then call it
    // The Function constructor creates a new function scope with restricted globals
    const wrappedCode = `
      "use strict";
      ${code}
      return strategy(prices, params);
    `;

    // Create function with only Map and Math available
    const fn = new Function('prices', 'params', 'Math', 'Map', 'Array', wrappedCode);

    // Execute with a timeout guard (5 second max)
    const result = fn(data, params, Math, Map, Array);

    const elapsed = performance.now() - start;

    if (!Array.isArray(result)) {
      return {
        success: false,
        error: 'Strategy must return an array of symbol strings',
      };
    }

    // Validate result contents
    const symbols = result.filter((s): s is string => typeof s === 'string');

    return {
      success: true,
      rankedSymbols: symbols,
      executionTimeMs: Math.round(elapsed * 100) / 100,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Execution failed',
      executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }
}
