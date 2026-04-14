import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import {
  getAlpacaCredentials,
} from './alpaca';

interface AccountData {
  accountNumber: string;
  status: string;
  currency: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  lastEquity: number;
  longMarketValue: number;
  shortMarketValue: number;
  daytradeCount: number;
  patternDayTrader: boolean;
  tradingBlocked: boolean;
  transfersBlocked: boolean;
  accountBlocked: boolean;
  syncedAt: Date;
}

type SyncCallback = (data: AccountData) => void;

const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets';
const ALPACA_LIVE_URL = 'https://api.alpaca.markets';

class AccountSyncService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private userId: string | null = null;
  private syncCallbacks: SyncCallback[] = [];
  private lastSyncTime: Date | null = null;

  async startSync(userId: string, intervalMs: number = 60000): Promise<void> {
    this.stopSync();
    this.userId = userId;

    // Run immediately, then on interval
    await this.forceSync();

    this.intervalId = setInterval(() => {
      this.forceSync().catch((err) => {
        console.error('[account-sync] periodic sync failed:', err);
      });
    }, intervalMs);

    console.log(`[account-sync] started for user ${userId}, interval ${intervalMs}ms`);
  }

  stopSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.userId = null;
    console.log('[account-sync] stopped');
  }

  async forceSync(): Promise<AccountData | null> {
    if (!this.userId) {
      console.warn('[account-sync] no user ID set');
      return null;
    }

    const creds = await getAlpacaCredentials(this.userId);
    if (!creds) {
      console.warn('[account-sync] no Alpaca credentials for user');
      return null;
    }

    const baseUrl = creds.environment === 'live' ? ALPACA_LIVE_URL : ALPACA_PAPER_URL;

    try {
      const response = await fetch(`${baseUrl}/v2/account`, {
        headers: {
          'APCA-API-KEY-ID': creds.apiKey,
          'APCA-API-SECRET-KEY': creds.apiSecret,
        },
      });

      if (!response.ok) {
        console.error('[account-sync] API error:', response.status);
        return null;
      }

      const raw = await response.json();

      const accountData: AccountData = {
        accountNumber: raw.account_number,
        status: raw.status,
        currency: raw.currency,
        buyingPower: parseFloat(raw.buying_power),
        cash: parseFloat(raw.cash),
        portfolioValue: parseFloat(raw.portfolio_value),
        equity: parseFloat(raw.equity),
        lastEquity: parseFloat(raw.last_equity),
        longMarketValue: parseFloat(raw.long_market_value),
        shortMarketValue: parseFloat(raw.short_market_value),
        daytradeCount: raw.daytrade_count,
        patternDayTrader: raw.pattern_day_trader,
        tradingBlocked: raw.trading_blocked,
        transfersBlocked: raw.transfers_blocked,
        accountBlocked: raw.account_blocked,
        syncedAt: new Date(),
      };

      // Save to Firestore
      await this.saveToFirestore(this.userId, accountData);

      this.lastSyncTime = accountData.syncedAt;

      // Notify callbacks
      for (const cb of this.syncCallbacks) {
        try {
          cb(accountData);
        } catch (err) {
          console.error('[account-sync] callback error:', err);
        }
      }

      console.log('[account-sync] synced account:', accountData.accountNumber);
      return accountData;
    } catch (err) {
      console.error('[account-sync] fetch error:', err);
      return null;
    }
  }

  onSync(callback: SyncCallback): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  private async saveToFirestore(userId: string, data: AccountData): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;

    const ref = doc(db, 'users', userId, 'sync', 'account');
    await setDoc(ref, {
      ...data,
      syncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Singleton
let instance: AccountSyncService | null = null;

export function getAccountSyncService(): AccountSyncService {
  if (!instance) {
    instance = new AccountSyncService();
  }
  return instance;
}

export async function getLastSync(userId: string): Promise<Date | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const ref = doc(db, 'users', userId, 'sync', 'account');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return data.syncedAt?.toDate?.() || null;
}

export type { AccountData, SyncCallback };
