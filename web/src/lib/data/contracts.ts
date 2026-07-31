/**
 * Adapter-layer contracts (spec §2) — one repository interface per domain.
 *
 * Islands and hooks import THESE plus `provideRepos()` — never the Supabase
 * SDK directly. A future backend change (CyberEco Tenet #2, storage
 * agnosticism) is a new implementation of this file's interfaces, not a
 * rewrite of the UI.
 */
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// Domain row types — derived from generated DB types, single source of truth.
export type Profile = Tables<'profiles'>;
export type Account = Tables<'accounts'>;
export type Holding = Tables<'holdings'>;
export type Transaction = Tables<'transactions'>;
export type Strategy = Tables<'strategies'>;
export type Backtest = Tables<'backtests'>;
export type Watchlist = Tables<'watchlists'>;
export type Alert = Tables<'alerts'>;

export type NewStrategy = TablesInsert<'strategies'>;
export type StrategyPatch = TablesUpdate<'strategies'>;
export type NewBacktest = TablesInsert<'backtests'>;
export type NewAccount = TablesInsert<'accounts'>;
export type AccountPatch = TablesUpdate<'accounts'>;
export type NewHolding = TablesInsert<'holdings'>;
export type HoldingPatch = TablesUpdate<'holdings'>;
export type NewTransaction = TablesInsert<'transactions'>;
export type NewWatchlist = TablesInsert<'watchlists'>;
export type WatchlistPatch = TablesUpdate<'watchlists'>;
export type NewAlert = TablesInsert<'alerts'>;
export type AlertPatch = TablesUpdate<'alerts'>;
export type ProfilePatch = TablesUpdate<'profiles'>;

/** Session snapshot the auth provider hands to subscribers. */
export interface AuthSession {
  userId: string;
  email: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthProvider {
  /** PKCE email+password sign-up. Resolves to the session when email confirmation is off. */
  signUp(creds: AuthCredentials, opts?: { name?: string }): Promise<AuthSession | null>;
  signInWithPassword(creds: AuthCredentials): Promise<AuthSession>;
  /** Redirect-based OAuth (Google). Never resolves with a session — the page navigates away. */
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  /** Subscribe to session changes. Returns an unsubscribe function. */
  onSession(cb: (session: AuthSession | null) => void): () => void;
}

export interface ProfileRepo {
  get(userId: string): Promise<Profile | null>;
  update(userId: string, patch: ProfilePatch): Promise<Profile>;
}

export interface AccountRepo {
  list(): Promise<Account[]>;
  create(account: NewAccount): Promise<Account>;
  update(id: string, patch: AccountPatch): Promise<Account>;
  remove(id: string): Promise<void>;
}

export interface HoldingRepo {
  listByAccount(accountId: string): Promise<Holding[]>;
  create(holding: NewHolding): Promise<Holding>;
  update(id: string, patch: HoldingPatch): Promise<Holding>;
  remove(id: string): Promise<void>;
}

export interface TransactionRepo {
  listByAccount(accountId: string): Promise<Transaction[]>;
  create(tx: NewTransaction): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

export interface StrategyRepo {
  list(): Promise<Strategy[]>;
  listPublic(): Promise<Strategy[]>;
  get(id: string): Promise<Strategy | null>;
  create(strategy: NewStrategy): Promise<Strategy>;
  update(id: string, patch: StrategyPatch): Promise<Strategy>;
  remove(id: string): Promise<void>;
}

export interface BacktestRepo {
  list(): Promise<Backtest[]>;
  listPublic(): Promise<Backtest[]>;
  get(id: string): Promise<Backtest | null>;
  create(backtest: NewBacktest): Promise<Backtest>;
  setPublic(id: string, isPublic: boolean): Promise<Backtest>;
  remove(id: string): Promise<void>;
}

export interface WatchlistRepo {
  list(): Promise<Watchlist[]>;
  create(watchlist: NewWatchlist): Promise<Watchlist>;
  update(id: string, patch: WatchlistPatch): Promise<Watchlist>;
  remove(id: string): Promise<void>;
}

export interface AlertRepo {
  list(): Promise<Alert[]>;
  create(alert: NewAlert): Promise<Alert>;
  update(id: string, patch: AlertPatch): Promise<Alert>;
  remove(id: string): Promise<void>;
}

/** Everything an island can ask for, behind one factory. */
export interface Repos {
  auth: AuthProvider;
  profiles: ProfileRepo;
  accounts: AccountRepo;
  holdings: HoldingRepo;
  transactions: TransactionRepo;
  strategies: StrategyRepo;
  backtests: BacktestRepo;
  watchlists: WatchlistRepo;
  alerts: AlertRepo;
}
