/**
 * $session behavior in unconfigured builds (vitest has no PUBLIC_SUPABASE_*
 * env): the store must resolve to signed-out — never hang in 'loading' — and
 * the GuardUser adapter must deny by default.
 */
import { describe, expect, it } from 'vitest';
import { $session, startSessionSync, toGuardUser } from './session';

describe('$session (unconfigured build)', () => {
  it('starts signed-out when Supabase env is absent', () => {
    expect($session.get().status).toBe('signed-out');
    expect($session.get().userId).toBeNull();
  });

  it('startSessionSync is a safe no-op without a client', () => {
    const dispose = startSessionSync();
    expect(typeof dispose).toBe('function');
    expect(() => dispose()).not.toThrow();
    expect($session.get().status).toBe('signed-out');
  });
});

describe('toGuardUser', () => {
  it('returns null unless signed in (deny by default)', () => {
    expect(toGuardUser({ status: 'signed-out', userId: null, email: null })).toBeNull();
    expect(toGuardUser({ status: 'loading', userId: null, email: null })).toBeNull();
  });

  it('maps a signed-in session to a GuardUser with no roles or flags', () => {
    const user = toGuardUser({ status: 'signed-in', userId: 'u-1', email: 'a@b.co' });
    expect(user).toEqual({ id: 'u-1' });
    expect(user?.roles).toBeUndefined();
    expect(user?.flags).toBeUndefined();
  });
});
