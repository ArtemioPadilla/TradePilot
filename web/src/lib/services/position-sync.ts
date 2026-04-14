import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import {
  getAlpacaCredentials,
  fetchAlpacaPositions,
} from './alpaca';

interface SyncedPosition {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  currentPrice: number;
  avgEntryPrice: number;
  changeToday: number;
  assetClass: string;
}

interface PositionSyncResult {
  positions: SyncedPosition[];
  newPositions: string[];
  closedPositions: string[];
  syncedAt: Date;
}

export async function syncPositions(userId: string): Promise<PositionSyncResult | null> {
  const creds = await getAlpacaCredentials(userId);
  if (!creds) {
    console.warn('[position-sync] no Alpaca credentials for user');
    return null;
  }

  try {
    const rawPositions = await fetchAlpacaPositions(
      creds.apiKey,
      creds.apiSecret,
      creds.environment
    );

    const positions: SyncedPosition[] = rawPositions.map((p: any) => ({
      symbol: p.symbol,
      qty: parseFloat(p.qty),
      side: p.side,
      marketValue: parseFloat(p.market_value),
      costBasis: parseFloat(p.cost_basis),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
      currentPrice: parseFloat(p.current_price),
      avgEntryPrice: parseFloat(p.avg_entry_price),
      changeToday: parseFloat(p.change_today) * 100,
      assetClass: p.asset_class || 'us_equity',
    }));

    // Detect new and closed positions
    const previousSymbols = await getPreviousPositionSymbols(userId);
    const currentSymbols = new Set(positions.map((p) => p.symbol));

    const newPositions = positions
      .map((p) => p.symbol)
      .filter((s) => !previousSymbols.has(s));

    const closedPositions = Array.from(previousSymbols).filter(
      (s) => !currentSymbols.has(s)
    );

    // Save to Firestore
    await savePositionsToFirestore(userId, positions);

    // Update sync metadata
    const syncedAt = new Date();
    await saveSyncMetadata(userId, syncedAt);

    if (newPositions.length > 0) {
      console.log('[position-sync] new positions:', newPositions);
    }
    if (closedPositions.length > 0) {
      console.log('[position-sync] closed positions:', closedPositions);
    }

    return { positions, newPositions, closedPositions, syncedAt };
  } catch (err) {
    console.error('[position-sync] sync failed:', err);
    return null;
  }
}

export async function getLastSyncTime(userId: string): Promise<Date | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const ref = doc(db, 'users', userId, 'sync', 'positions');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return data.syncedAt?.toDate?.() || null;
}

export function isPositionSyncRunning(): boolean {
  return syncInProgress;
}

// Internal state
let syncInProgress = false;

async function getPreviousPositionSymbols(userId: string): Promise<Set<string>> {
  const db = getFirebaseDb();
  if (!db) return new Set();

  const colRef = collection(db, 'users', userId, 'positions');
  const snap = await getDocs(colRef);

  const symbols = new Set<string>();
  snap.forEach((doc) => {
    symbols.add(doc.id);
  });
  return symbols;
}

async function savePositionsToFirestore(
  userId: string,
  positions: SyncedPosition[]
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  syncInProgress = true;

  try {
    const batch = writeBatch(db);

    // Remove old positions that no longer exist
    const previousSymbols = await getPreviousPositionSymbols(userId);
    const currentSymbols = new Set(positions.map((p) => p.symbol));

    for (const symbol of previousSymbols) {
      if (!currentSymbols.has(symbol)) {
        const ref = doc(db, 'users', userId, 'positions', symbol);
        batch.delete(ref);
      }
    }

    // Write current positions
    for (const position of positions) {
      const ref = doc(db, 'users', userId, 'positions', position.symbol);
      batch.set(ref, {
        ...position,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } finally {
    syncInProgress = false;
  }
}

async function saveSyncMetadata(userId: string, syncedAt: Date): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const ref = doc(db, 'users', userId, 'sync', 'positions');
  await setDoc(ref, {
    syncedAt: serverTimestamp(),
    positionCount: 0, // will be updated by caller context
    updatedAt: serverTimestamp(),
  });
}

export type { SyncedPosition, PositionSyncResult };
