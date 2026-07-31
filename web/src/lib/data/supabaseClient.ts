/**
 * Supabase browser client — the ONLY place the SDK is instantiated.
 *
 * PKCE flow (static host, no server): session lives in localStorage and is
 * exposed to islands via the `$session` nanostore (src/stores/session.ts),
 * never via per-component listeners.
 *
 * The client is null when the PUBLIC_ env vars are absent (e.g. a fork built
 * without a Supabase project) — feature islands must degrade gracefully
 * through `isSupabaseConfigured` instead of crashing at import time.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured: boolean = Boolean(url && key);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url as string, key as string, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Narrowing helper for code paths that require a configured client. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
