/**
 * AI Strategy Service
 *
 * Generates trading strategies from natural language descriptions.
 * Supports:
 * - Demo mode (pre-built templates, no API key needed)
 * - AWS Bedrock mode (requires credentials)
 */

import { strategyTemplates, type StrategyTemplate } from './strategy-templates';

export interface AIStrategyRequest {
  prompt: string;
  mode: 'demo' | 'bedrock';
  bedrockConfig?: BedrockConfig;
}

export interface BedrockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  modelId?: string;
}

export interface AIStrategyResponse {
  code: string;
  explanation: string;
  name: string;
  success: boolean;
  error?: string;
}

const SYSTEM_PROMPT = `You are a quantitative trading strategy developer for TradePilot. Generate TypeScript strategy functions based on user descriptions.

The function MUST follow this exact signature:
\`\`\`typescript
function strategy(prices: Map<string, number[]>, params: Record<string, number>): string[]
\`\`\`

Where:
- \`prices\`: Map of stock symbol -> array of historical closing prices (oldest first)
- \`params\`: Optional numeric parameters (e.g., { period: 20, threshold: 0.5 })
- Returns: Array of stock symbols sorted by preference (best candidates first)

Available data:
- Each symbol maps to a number[] of daily closing prices
- The last element is the most recent price
- You can compute returns, moving averages, volatility, etc. from the raw prices

Rules:
1. The function must be named \`strategy\`
2. Use only plain TypeScript — no imports, no external libraries
3. Always handle edge cases (insufficient data, division by zero)
4. Return symbols sorted by descending preference
5. Use the \`params\` object for configurable parameters with sensible defaults

Respond with ONLY the function code (no markdown fences, no explanation outside the code).
After the code, on a new line starting with "EXPLANATION:", provide a brief explanation of the strategy.
After the explanation, on a new line starting with "NAME:", provide a short name for the strategy.`;

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

  let bestMatch = strategyTemplates[0];
  let bestScore = 0;

  for (const [id, words] of Object.entries(keywords)) {
    const score = words.reduce((acc, w) => {
      return acc + (new RegExp(w, 'i').test(lower) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      const template = strategyTemplates.find(t => t.id === id);
      if (template) bestMatch = template;
    }
  }

  return bestMatch;
}

/**
 * Generate a strategy in demo mode (no API key needed).
 */
function generateDemoStrategy(prompt: string): AIStrategyResponse {
  const template = findBestTemplate(prompt);
  return {
    code: template.code,
    explanation: template.explanation,
    name: template.name,
    success: true,
  };
}

/**
 * Parse a Claude API response into structured strategy output.
 */
function parseAIResponse(text: string): { code: string; explanation: string; name: string } {
  const explanationIdx = text.indexOf('EXPLANATION:');
  const nameIdx = text.indexOf('NAME:');

  let code = text;
  let explanation = '';
  let name = 'AI Strategy';

  if (explanationIdx !== -1) {
    code = text.substring(0, explanationIdx).trim();
    if (nameIdx !== -1) {
      explanation = text.substring(explanationIdx + 12, nameIdx).trim();
      name = text.substring(nameIdx + 5).trim();
    } else {
      explanation = text.substring(explanationIdx + 12).trim();
    }
  }

  // Clean up code fences if present
  code = code.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```$/m, '').trim();

  return { code, explanation, name };
}

/**
 * Generate a strategy using AWS Bedrock (Claude) via REST API.
 * Uses fetch to avoid requiring the @aws-sdk dependency at build time.
 */
async function generateBedrockStrategy(
  prompt: string,
  config: BedrockConfig,
): Promise<AIStrategyResponse> {
  try {
    const modelId = config.modelId || 'us.anthropic.claude-sonnet-4-20250514';
    const endpoint = `https://bedrock-runtime.${config.region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a trading strategy based on this description:\n\n${prompt}`,
        },
      ],
    });

    // AWS Signature V4 signing would be needed here for production use.
    // For now, this endpoint requires a proxy or pre-signed URL.
    // Users should configure a proxy endpoint that handles AWS auth.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Bedrock API returned ${response.status}. Ensure you have a properly configured proxy or use demo mode.`);
    }

    const responseBody = await response.json();
    const text = responseBody.content?.[0]?.text || '';
    const parsed = parseAIResponse(text);

    return { ...parsed, success: true };
  } catch (error) {
    return {
      code: '',
      explanation: '',
      name: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to call Bedrock API',
    };
  }
}

/**
 * Main entry point: generate a strategy from a natural language prompt.
 */
export async function generateStrategy(request: AIStrategyRequest): Promise<AIStrategyResponse> {
  if (request.mode === 'demo') {
    return generateDemoStrategy(request.prompt);
  }

  if (!request.bedrockConfig) {
    return {
      code: '',
      explanation: '',
      name: '',
      success: false,
      error: 'Bedrock configuration is required for AI mode',
    };
  }

  return generateBedrockStrategy(request.prompt, request.bedrockConfig);
}
