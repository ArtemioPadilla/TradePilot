/**
 * TradePilot Engine — Backtest Runner (Phase 2)
 *
 * Main-thread helpers around the backtest worker:
 * - runBacktestInWorker(): off-main-thread run with progress reporting.
 * - runBacktest(): synchronous fallback for tests / Node (no Worker).
 */

import { BacktestEngine } from './simulator';
import type {
  BacktestConfig,
  BacktestResultV2,
  PriceData,
  WorkerResponse,
  WorkerRunMessage,
} from './types';

/** Accepted price-map shapes: engine-native Map or JSON-friendly record. */
export type PriceMapInput = Map<string, PriceData> | Record<string, PriceData>;

function toPriceMap(input: PriceMapInput): Map<string, PriceData> {
  return input instanceof Map ? input : new Map(Object.entries(input));
}

function toPriceRecord(input: PriceMapInput): Record<string, PriceData> {
  return input instanceof Map ? Object.fromEntries(input) : input;
}

/**
 * Run a backtest synchronously on the current thread.
 * Fallback for tests and Node environments without Worker support.
 */
export function runBacktest(
  config: BacktestConfig,
  priceMap: PriceMapInput,
  onProgress?: (fraction: number) => void,
): BacktestResultV2 {
  const engine = new BacktestEngine(config, toPriceMap(priceMap));
  return engine.run(onProgress);
}

/**
 * Run a backtest in a module web worker, keeping the main thread free.
 *
 * @param config Backtest configuration.
 * @param priceMap Symbol -> PriceData (Map or plain record).
 * @param onProgress Optional progress callback with fraction in (0, 1].
 * @returns Promise resolving to the BacktestResultV2; the worker is
 *   terminated once the promise settles.
 */
export function runBacktestInWorker(
  config: BacktestConfig,
  priceMap: PriceMapInput,
  onProgress?: (fraction: number) => void,
): Promise<BacktestResultV2> {
  return new Promise<BacktestResultV2>((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });

    const settle = (finish: () => void): void => {
      worker.terminate();
      finish();
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.fraction);
      } else if (msg.type === 'result') {
        settle(() => resolve(msg.result));
      } else if (msg.type === 'error') {
        settle(() => reject(new Error(msg.message)));
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      settle(() => reject(new Error(event.message || 'Backtest worker failed')));
    };

    const message: WorkerRunMessage = {
      type: 'run',
      config,
      priceMap: toPriceRecord(priceMap),
    };
    worker.postMessage(message);
  });
}
