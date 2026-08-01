import { describe, expect, it } from 'vitest';
import { generateStrategy } from './ai-strategy';
import { strategyTemplates } from './strategy-templates';
import { executeStrategy } from './strategy-executor';

describe('generateStrategy (demo mode)', () => {
  it('matches an RSI prompt to the mean-reversion template', async () => {
    const res = await generateStrategy({ prompt: 'buy oversold names using RSI', mode: 'demo' });
    expect(res.success).toBe(true);
    expect(res.name.toLowerCase()).toContain('rsi');
  });

  it('matches a crossover prompt to the momentum-crossover template', async () => {
    const res = await generateStrategy({
      prompt: 'fast moving average crossover over slow',
      mode: 'demo',
    });
    expect(res.success).toBe(true);
    expect(res.code).toContain('function strategy');
  });

  it('falls back to the first template on an unmatched prompt', async () => {
    const res = await generateStrategy({ prompt: 'zzz nothing matches', mode: 'demo' });
    expect(res.success).toBe(true);
    expect(res.name).toBe(strategyTemplates[0]!.name);
  });
});

describe('template code is executable by the sandbox', () => {
  const prices = new Map<string, number[]>([
    ['AAA', Array.from({ length: 250 }, (_, i) => 100 + i * 0.5)],
    ['BBB', Array.from({ length: 250 }, (_, i) => 100 - i * 0.1)],
    ['CCC', Array.from({ length: 250 }, (_, i) => 100 + Math.sin(i / 10) * 5)],
  ]);

  for (const template of strategyTemplates) {
    it(`${template.id} runs and ranks symbols`, () => {
      const result = executeStrategy(template.code, prices, {});
      expect(result.success, result.error).toBe(true);
      expect(Array.isArray(result.rankedSymbols)).toBe(true);
      expect(result.rankedSymbols!.length).toBeGreaterThan(0);
      for (const s of result.rankedSymbols!) {
        expect(['AAA', 'BBB', 'CCC']).toContain(s);
      }
    });
  }
});

describe('sandbox safety', () => {
  it('rejects code without a strategy function', () => {
    const r = executeStrategy('const x = 1;', new Map(), {});
    expect(r.success).toBe(false);
  });

  it('rejects fetch/eval/import attempts', () => {
    for (const bad of [
      'function strategy(){ return fetch("http://x") }',
      'function strategy(){ return eval("1") }',
      'function strategy(){ return import("x") }',
    ]) {
      const r = executeStrategy(bad, new Map(), {});
      expect(r.success, bad).toBe(false);
    }
  });
});
