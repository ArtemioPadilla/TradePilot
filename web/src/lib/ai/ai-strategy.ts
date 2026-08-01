/**
 * AI Strategy Service — natural-language strategy generation.
 *
 * Ported from the pre-rebuild app. Demo mode only for now: keyword-matches
 * the prompt against the curated template library — no network, no keys.
 * A BYOK LLM mode (the old app sketched an unsigned Bedrock call that could
 * not work from a static host) is deferred until there is a proxy to sign
 * requests; the interface keeps the seam.
 */

import { strategyTemplates, type StrategyTemplate } from './strategy-templates';

export interface AIStrategyRequest {
  prompt: string;
  mode: 'demo';
}

export interface AIStrategyResponse {
  code: string;
  explanation: string;
  name: string;
  success: boolean;
  error?: string;
}

/**
 * Find the best matching demo template for a given prompt.
 */
function findBestTemplate(prompt: string): StrategyTemplate {
  const lower = prompt.toLowerCase();
  const keywords: Record<string, string[]> = {
    'momentum-crossover': ['crossover', 'moving average', 'ma cross', 'fast.*slow', 'sma cross'],
    'rsi-mean-reversion': ['rsi', 'oversold', 'overbought', 'mean reversion', 'reversion'],
    'volatility-breakout': ['volatility', 'breakout', 'bollinger', 'band', 'expansion'],
    'pairs-relative-value': ['relative', 'pairs', 'underperform', 'laggard', 'spread'],
    'dual-momentum': ['dual momentum', 'absolute.*relative', 'trend.*momentum', '200.*day'],
  };

  let bestMatch = strategyTemplates[0]!; // constant non-empty template list
  let bestScore = 0;

  for (const [id, words] of Object.entries(keywords)) {
    const score = words.reduce((acc, w) => acc + (new RegExp(w, 'i').test(lower) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      const template = strategyTemplates.find((t) => t.id === id);
      if (template) bestMatch = template;
    }
  }

  return bestMatch;
}

/**
 * Main entry point: generate a strategy from a natural language prompt.
 */
export async function generateStrategy(request: AIStrategyRequest): Promise<AIStrategyResponse> {
  const template = findBestTemplate(request.prompt);
  return {
    code: template.code,
    explanation: template.explanation,
    name: template.name,
    success: true,
  };
}
