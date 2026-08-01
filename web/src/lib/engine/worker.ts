/**
 * TradePilot Engine — Backtest Web Worker (Phase 2)
 *
 * Module-type worker entry. Receives a WorkerRunMessage, runs the
 * BacktestEngine off the main thread, and streams progress back.
 *
 * Engine only — no DOM, no network imports. Prices arrive as a plain
 * record (structured-clone friendly) and are converted to a Map here.
 *
 * Protocol (see types.ts):
 *   in:  { type: 'run', config, priceMap }
 *   out: { type: 'progress', fraction }*
 *        then { type: 'result', result } | { type: 'error', message }
 */

import { BacktestEngine } from './simulator';
import type { PriceData, WorkerRunMessage, WorkerResponse } from './types';

/** Minimal worker-global surface — avoids depending on the webworker lib. */
interface BacktestWorkerScope {
  onmessage: ((event: { data: WorkerRunMessage }) => void) | null;
  postMessage(message: WorkerResponse): void;
}

const ctx = self as unknown as BacktestWorkerScope;

ctx.onmessage = (event: { data: WorkerRunMessage }) => {
  const data = event.data;
  if (!data || data.type !== 'run') return;

  try {
    const priceMap = new Map<string, PriceData>(Object.entries(data.priceMap));
    const engine = new BacktestEngine(data.config, priceMap);

    const result = engine.run((fraction: number) => {
      ctx.postMessage({ type: 'progress', fraction });
    });

    ctx.postMessage({ type: 'result', result });
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
