/**
 * TradePilot Lab — Task Pool (Phase 3)
 *
 * Bounded-concurrency, cancellable, order-preserving task pool for
 * sweep / walk-forward execution (spec §3.2: "a worker pool
 * (navigator.hardwareConcurrency - 1) processes sweep combinations in
 * parallel").
 *
 * Generic over the task/result types so it can drive
 * runBacktestInWorker() in the browser and plain async functions in
 * tests — the pool itself never touches Worker APIs.
 *
 * Semantics:
 * - Results land at the same index as their task (order-preserving).
 * - A rejected task yields `null` in its slot plus an entry in `errors`;
 *   the pool keeps going.
 * - cancel() stops DISPATCHING new tasks; in-flight tasks run to
 *   completion (their results are kept). Never-started tasks resolve to
 *   `null` with no error entry. The same `signal` object is passed to
 *   every worker call so long-running tasks can observe `cancelled` and
 *   bail early if they choose to.
 */

/** Cancellation signal shared by the pool and every worker invocation. */
export interface PoolSignal {
  cancelled: boolean;
}

/** A task that rejected: its slot index and the error message. */
export interface PoolError {
  index: number;
  message: string;
}

/** Final pool outcome: per-slot results plus the collected errors. */
export interface PoolOutcome<TResult> {
  /** results[i] corresponds to tasks[i]; null = rejected or never started. */
  results: (TResult | null)[];
  /** One entry per rejected task, ordered by index. */
  errors: PoolError[];
}

export interface PoolOptions {
  /** Max tasks in flight at once. Default: {@link defaultConcurrency}. */
  concurrency?: number;
  /** Called after each task settles (fulfilled or rejected). */
  onProgress?: (done: number, total: number) => void;
}

export interface PoolHandle<TResult> {
  /** Resolves once all dispatched tasks have settled. Never rejects. */
  promise: Promise<PoolOutcome<TResult>>;
  /** Stop dispatching new tasks; in-flight tasks finish normally. */
  cancel: () => void;
}

/**
 * Pool width for the current machine: hardwareConcurrency - 1, floor 1.
 * Falls back to 4 logical cores when `navigator` is unavailable (Node
 * < 21 test environments) or reports nothing.
 */
export function defaultConcurrency(): number {
  const cores =
    typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4;
  return Math.max(1, cores - 1);
}

/**
 * Create a task pool and start it immediately.
 *
 * @param tasks Task inputs; results are returned in the same order.
 * @param worker Async function run for each task. Receives the shared
 *   cancellation signal (read `signal.cancelled` to bail early).
 * @param opts Concurrency and progress reporting.
 * @returns A handle with the outcome promise and a cancel() function.
 */
export function createPool<TTask, TResult>(
  tasks: TTask[],
  worker: (task: TTask, signal: PoolSignal) => Promise<TResult>,
  opts: PoolOptions = {},
): PoolHandle<TResult> {
  const total = tasks.length;
  const concurrency = Math.max(1, Math.floor(opts.concurrency ?? defaultConcurrency()));
  const signal: PoolSignal = { cancelled: false };
  const results: (TResult | null)[] = new Array<TResult | null>(total).fill(null);
  const errors: PoolError[] = [];
  let nextIndex = 0;
  let done = 0;

  const runner = async (): Promise<void> => {
    while (!signal.cancelled && nextIndex < total) {
      const index = nextIndex++;
      try {
        results[index] = await worker(tasks[index]!, signal);
      } catch (err) {
        results[index] = null;
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
      done++;
      opts.onProgress?.(done, total);
    }
  };

  const promise = (async (): Promise<PoolOutcome<TResult>> => {
    const width = Math.min(concurrency, total);
    await Promise.all(Array.from({ length: width }, () => runner()));
    errors.sort((a, b) => a.index - b.index);
    return { results, errors };
  })();

  return {
    promise,
    cancel: () => {
      signal.cancelled = true;
    },
  };
}

/**
 * Convenience wrapper for callers that don't need cancellation:
 * runs the pool to completion and resolves with the outcome.
 */
export function runPool<TTask, TResult>(
  tasks: TTask[],
  worker: (task: TTask, signal: PoolSignal) => Promise<TResult>,
  opts: PoolOptions = {},
): Promise<PoolOutcome<TResult>> {
  return createPool(tasks, worker, opts).promise;
}
