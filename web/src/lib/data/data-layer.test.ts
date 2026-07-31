/**
 * Adapter-layer contract tests for unconfigured builds: importing and
 * constructing repos must never throw (islands import at module scope);
 * only *using* them without env config fails, with an actionable message.
 */
import { describe, expect, it } from 'vitest';
import { isSupabaseConfigured, supabase, requireSupabase } from './supabaseClient';
import { provideRepos } from './supabase';

describe('supabaseClient (unconfigured build)', () => {
  it('exposes a null client and a false flag', () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  it('requireSupabase throws with the env var names in the message', () => {
    expect(() => requireSupabase()).toThrow(/PUBLIC_SUPABASE_URL/);
  });
});

describe('provideRepos', () => {
  it('constructs without throwing and is memoized', () => {
    const a = provideRepos();
    const b = provideRepos();
    expect(a).toBe(b);
    expect(a.auth).toBeDefined();
    expect(a.strategies).toBeDefined();
    expect(a.backtests).toBeDefined();
  });

  it('repo calls without config reject with the config error', async () => {
    await expect(provideRepos().accounts.list()).rejects.toThrow(/PUBLIC_SUPABASE_URL/);
    await expect(provideRepos().auth.getSession()).rejects.toThrow(/PUBLIC_SUPABASE_URL/);
  });
});
