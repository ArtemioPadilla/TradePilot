/**
 * $session — the single cross-island auth state (spec §2: replaces
 * per-component auth listeners).
 *
 * Islands read it with `useStore($session)`. Exactly one island per page
 * (AuthGuard or AuthNav — whichever hydrates first) calls
 * `startSessionSync()`; repeated calls are no-ops so double-mounting is safe.
 */
import { atom } from 'nanostores';
import { supabase } from '@/lib/data/supabaseClient';
import type { GuardUser } from '@/lib/route-guard';

export type SessionStatus = 'loading' | 'signed-in' | 'signed-out';

export interface SessionState {
  status: SessionStatus;
  userId: string | null;
  email: string | null;
}

const SIGNED_OUT: SessionState = { status: 'signed-out', userId: null, email: null };

export const $session = atom<SessionState>(
  supabase ? { status: 'loading', userId: null, email: null } : SIGNED_OUT,
);

let unsubscribe: (() => void) | null = null;

/**
 * Begin syncing $session with Supabase auth. Idempotent. Returns a disposer
 * (used by tests; page islands intentionally keep the sync alive for the
 * lifetime of the page).
 */
export function startSessionSync(): () => void {
  if (!supabase) return () => {};
  if (unsubscribe) return unsubscribe;

  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    $session.set(
      user
        ? { status: 'signed-in', userId: user.id, email: user.email ?? null }
        : SIGNED_OUT,
    );
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    $session.set(
      user
        ? { status: 'signed-in', userId: user.id, email: user.email ?? null }
        : SIGNED_OUT,
    );
  });

  unsubscribe = () => {
    data.subscription.unsubscribe();
    unsubscribe = null;
  };
  return unsubscribe;
}

/**
 * Adapt the session to the gating module's GuardUser — the ONE place the
 * provider shape crosses into `route-guard` (CLAUDE.md auth gating rules).
 * Roles/flags stay empty until the backend grants them; deny-by-default.
 */
export function toGuardUser(state: SessionState): GuardUser | null {
  if (state.status !== 'signed-in' || !state.userId) return null;
  return { id: state.userId };
}
