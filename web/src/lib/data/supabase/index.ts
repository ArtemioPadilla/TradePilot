/**
 * Supabase implementation of the adapter-layer contracts.
 *
 * The only module (besides supabaseClient) that touches the SDK. Islands use
 * `provideRepos()` and the interfaces from `../contracts` exclusively.
 */
import type { Session } from '@supabase/supabase-js';
import { requireSupabase } from '../supabaseClient';
import { withBase } from '@/lib/href';
import type {
  AuthProvider,
  AuthSession,
  Repos,
  Profile,
  ProfilePatch,
  Account,
  NewAccount,
  AccountPatch,
  Holding,
  NewHolding,
  HoldingPatch,
  Transaction,
  NewTransaction,
  Strategy,
  NewStrategy,
  StrategyPatch,
  Backtest,
  NewBacktest,
  Watchlist,
  NewWatchlist,
  WatchlistPatch,
  Alert,
  NewAlert,
  AlertPatch,
} from '../contracts';

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session?.user) return null;
  return { userId: session.user.id, email: session.user.email ?? null };
}

/** Every mutation/select funnels through this to normalize SDK errors. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) {
    throw new Error('Supabase returned no data.');
  }
  return result.data;
}

const auth: AuthProvider = {
  async signUp({ email, password }, opts) {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: opts?.name ? { name: opts.name } : undefined,
        emailRedirectTo: `${location.origin}${withBase('/auth/callback/')}`,
      },
    });
    if (error) throw new Error(error.message);
    return toAuthSession(data.session);
  },

  async signInWithPassword({ email, password }) {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const session = toAuthSession(data.session);
    if (!session) throw new Error('Sign-in returned no session.');
    return session;
  },

  async signInWithGoogle() {
    const sb = requireSupabase();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}${withBase('/auth/callback/')}` },
    });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    const sb = requireSupabase();
    const { error } = await sb.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const sb = requireSupabase();
    const { data } = await sb.auth.getSession();
    return toAuthSession(data.session);
  },

  onSession(cb) {
    const sb = requireSupabase();
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(toAuthSession(session)));
    return () => data.subscription.unsubscribe();
  },
};

function makeRepos(): Repos {
  const sb = () => requireSupabase();

  return {
    auth,

    profiles: {
      async get(userId): Promise<Profile | null> {
        const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      async update(userId, patch: ProfilePatch): Promise<Profile> {
        return unwrap(await sb().from('profiles').update(patch).eq('id', userId).select().single());
      },
    },

    accounts: {
      async list(): Promise<Account[]> {
        return unwrap(await sb().from('accounts').select('*').order('created_at'));
      },
      async create(account: NewAccount): Promise<Account> {
        return unwrap(await sb().from('accounts').insert(account).select().single());
      },
      async update(id, patch: AccountPatch): Promise<Account> {
        return unwrap(await sb().from('accounts').update(patch).eq('id', id).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('accounts').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    holdings: {
      async listByAccount(accountId): Promise<Holding[]> {
        return unwrap(
          await sb().from('holdings').select('*').eq('account_id', accountId).order('symbol'),
        );
      },
      async create(holding: NewHolding): Promise<Holding> {
        return unwrap(await sb().from('holdings').insert(holding).select().single());
      },
      async update(id, patch: HoldingPatch): Promise<Holding> {
        return unwrap(await sb().from('holdings').update(patch).eq('id', id).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('holdings').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    transactions: {
      async listByAccount(accountId): Promise<Transaction[]> {
        return unwrap(
          await sb()
            .from('transactions')
            .select('*')
            .eq('account_id', accountId)
            .order('executed_at', { ascending: false }),
        );
      },
      async create(tx: NewTransaction): Promise<Transaction> {
        return unwrap(await sb().from('transactions').insert(tx).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('transactions').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    strategies: {
      async list(): Promise<Strategy[]> {
        // RLS already scopes to own + public; filter to own via user_id match
        // client-side is unnecessary — own rows are the non-public ones the
        // policy admits plus any public rows the user owns.
        const session = await auth.getSession();
        if (!session) return [];
        return unwrap(
          await sb().from('strategies').select('*').eq('user_id', session.userId).order('updated_at', { ascending: false }),
        );
      },
      async listPublic(): Promise<Strategy[]> {
        return unwrap(
          await sb().from('strategies').select('*').eq('is_public', true).order('updated_at', { ascending: false }),
        );
      },
      async get(id): Promise<Strategy | null> {
        const { data, error } = await sb().from('strategies').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      async create(strategy: NewStrategy): Promise<Strategy> {
        return unwrap(await sb().from('strategies').insert(strategy).select().single());
      },
      async update(id, patch: StrategyPatch): Promise<Strategy> {
        return unwrap(await sb().from('strategies').update(patch).eq('id', id).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('strategies').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    backtests: {
      async list(): Promise<Backtest[]> {
        const session = await auth.getSession();
        if (!session) return [];
        return unwrap(
          await sb().from('backtests').select('*').eq('user_id', session.userId).order('created_at', { ascending: false }),
        );
      },
      async listPublic(): Promise<Backtest[]> {
        return unwrap(
          await sb().from('backtests').select('*').eq('is_public', true).order('created_at', { ascending: false }),
        );
      },
      async get(id): Promise<Backtest | null> {
        const { data, error } = await sb().from('backtests').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      async create(backtest: NewBacktest): Promise<Backtest> {
        return unwrap(await sb().from('backtests').insert(backtest).select().single());
      },
      async setPublic(id, isPublic): Promise<Backtest> {
        return unwrap(
          await sb().from('backtests').update({ is_public: isPublic }).eq('id', id).select().single(),
        );
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('backtests').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    watchlists: {
      async list(): Promise<Watchlist[]> {
        return unwrap(await sb().from('watchlists').select('*').order('created_at'));
      },
      async create(watchlist: NewWatchlist): Promise<Watchlist> {
        return unwrap(await sb().from('watchlists').insert(watchlist).select().single());
      },
      async update(id, patch: WatchlistPatch): Promise<Watchlist> {
        return unwrap(await sb().from('watchlists').update(patch).eq('id', id).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('watchlists').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },

    alerts: {
      async list(): Promise<Alert[]> {
        return unwrap(await sb().from('alerts').select('*').order('created_at'));
      },
      async create(alert: NewAlert): Promise<Alert> {
        return unwrap(await sb().from('alerts').insert(alert).select().single());
      },
      async update(id, patch: AlertPatch): Promise<Alert> {
        return unwrap(await sb().from('alerts').update(patch).eq('id', id).select().single());
      },
      async remove(id): Promise<void> {
        const { error } = await sb().from('alerts').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
  };
}

let repos: Repos | null = null;

/** Factory the islands/hooks call. Lazy so import alone never throws. */
export function provideRepos(): Repos {
  repos ??= makeRepos();
  return repos;
}
