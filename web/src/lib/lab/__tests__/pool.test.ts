/**
 * Tests: pool ordering, concurrency bounds, cancellation semantics,
 * error slots, and progress reporting — all with fake async tasks and
 * fake timers (no real waiting).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPool, defaultConcurrency, runPool } from '../pool';
import type { PoolSignal } from '../pool';

/** Task that resolves with `value` after `ms` fake milliseconds. */
function delayed<T>(ms: number, value: T): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createPool ordering', () => {
  it('preserves input order regardless of completion order', async () => {
    const tasks = [
      { ms: 30, value: 'a' },
      { ms: 10, value: 'b' },
      { ms: 20, value: 'c' },
    ];
    const { promise } = createPool(tasks, t => delayed(t.ms, t.value), { concurrency: 3 });
    await vi.runAllTimersAsync();
    const { results, errors } = await promise;
    expect(results).toEqual(['a', 'b', 'c']);
    expect(errors).toEqual([]);
  });

  it('resolves immediately for an empty task list', async () => {
    const { promise } = createPool<number, number>([], async t => t);
    await expect(promise).resolves.toEqual({ results: [], errors: [] });
  });
});

describe('createPool concurrency', () => {
  it('never exceeds the configured concurrency', async () => {
    let active = 0;
    let maxActive = 0;
    const tasks = [1, 2, 3, 4, 5];
    const { promise } = createPool(
      tasks,
      async t => {
        active++;
        maxActive = Math.max(maxActive, active);
        const v = await delayed(10, t);
        active--;
        return v;
      },
      { concurrency: 2 },
    );
    await vi.runAllTimersAsync();
    const { results } = await promise;
    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(maxActive).toBe(2);
  });

  it('clamps concurrency 0 up to 1 (serial execution)', async () => {
    let active = 0;
    let maxActive = 0;
    const { promise } = createPool(
      [1, 2, 3],
      async t => {
        active++;
        maxActive = Math.max(maxActive, active);
        const v = await delayed(5, t);
        active--;
        return v;
      },
      { concurrency: 0 },
    );
    await vi.runAllTimersAsync();
    await promise;
    expect(maxActive).toBe(1);
  });

  it('defaultConcurrency is at least 1', () => {
    expect(defaultConcurrency()).toBeGreaterThanOrEqual(1);
  });
});

describe('createPool cancellation', () => {
  it('lets in-flight tasks finish, leaves never-started slots null', async () => {
    const progress: [number, number][] = [];
    const handle = createPool(
      [10, 20, 30],
      t => delayed(5, t * 2),
      {
        concurrency: 1,
        onProgress: (done, total) => {
          progress.push([done, total]);
          if (done === 1) handle.cancel();
        },
      },
    );
    await vi.runAllTimersAsync();
    const { results, errors } = await handle.promise;
    // Task 0 was in flight and finished; tasks 1 and 2 were never dispatched.
    expect(results).toEqual([20, null, null]);
    expect(errors).toEqual([]); // skipped ≠ failed
    expect(progress).toEqual([[1, 3]]);
  });

  it('cancel before any dispatch still lets the already-started task finish', async () => {
    // Runners start synchronously in createPool, so task 0 is in flight
    // by the time cancel() runs; it must complete and be kept.
    const seen: boolean[] = [];
    const handle = createPool(
      ['x', 'y', 'z'],
      async (t: string, signal: PoolSignal) => {
        const v = await delayed(10, t);
        seen.push(signal.cancelled); // in-flight task observes cancellation
        return v;
      },
      { concurrency: 1 },
    );
    handle.cancel();
    await vi.runAllTimersAsync();
    const { results } = await handle.promise;
    expect(results).toEqual(['x', null, null]);
    expect(seen).toEqual([true]);
  });

  it('cancel is idempotent', async () => {
    const handle = createPool([1], t => delayed(1, t), { concurrency: 1 });
    handle.cancel();
    handle.cancel();
    await vi.runAllTimersAsync();
    await expect(handle.promise).resolves.toEqual({ results: [1], errors: [] });
  });
});

describe('createPool errors', () => {
  it('records a rejection as null + error entry and continues', async () => {
    const { promise } = createPool(
      [1, 2, 3],
      async t => {
        const v = await delayed(5, t);
        if (v === 2) throw new Error('boom');
        return v;
      },
      { concurrency: 1 },
    );
    await vi.runAllTimersAsync();
    const { results, errors } = await promise;
    expect(results).toEqual([1, null, 3]);
    expect(errors).toEqual([{ index: 1, message: 'boom' }]);
  });

  it('stringifies non-Error rejections', async () => {
    const { promise } = createPool(
      [1],
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      () => Promise.reject('bad value'),
    );
    const { results, errors } = await promise;
    expect(results).toEqual([null]);
    expect(errors).toEqual([{ index: 0, message: 'bad value' }]);
  });

  it('sorts multiple errors by index', async () => {
    const { promise } = createPool(
      [40, 10, 20, 5],
      async ms => {
        await delayed(ms, null);
        throw new Error(`fail-${ms}`);
      },
      { concurrency: 4 },
    );
    await vi.runAllTimersAsync();
    const { errors } = await promise;
    expect(errors.map(e => e.index)).toEqual([0, 1, 2, 3]);
  });
});

describe('progress reporting', () => {
  it('reports (done, total) after every settle, including failures', async () => {
    const progress: [number, number][] = [];
    const { promise } = createPool(
      [1, 2, 3],
      async t => {
        const v = await delayed(5, t);
        if (v === 2) throw new Error('boom');
        return v;
      },
      { concurrency: 1, onProgress: (done, total) => progress.push([done, total]) },
    );
    await vi.runAllTimersAsync();
    await promise;
    expect(progress).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });
});

describe('runPool convenience wrapper', () => {
  it('resolves with the same outcome shape', async () => {
    const outcomePromise = runPool([2, 4], t => delayed(t, t * 10), { concurrency: 2 });
    await vi.runAllTimersAsync();
    await expect(outcomePromise).resolves.toEqual({ results: [20, 40], errors: [] });
  });
});
