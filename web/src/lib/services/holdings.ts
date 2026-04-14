import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { Holding } from '../../types/portfolio';

function holdingsCollection(userId: string, accountId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'users', userId, 'accounts', accountId, 'holdings');
}

function holdingDoc(userId: string, accountId: string, holdingId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', userId, 'accounts', accountId, 'holdings', holdingId);
}

export async function createHolding(
  userId: string,
  accountId: string,
  data: any
): Promise<string> {
  const col = holdingsCollection(userId, accountId);
  const docRef = await addDoc(col, {
    userId,
    accountId,
    symbol: data.symbol,
    name: data.name || null,
    assetType: data.assetType || 'stock',
    quantity: data.quantity,
    costBasisPerShare: data.costBasisPerShare,
    totalCostBasis: data.quantity * data.costBasisPerShare,
    currency: data.currency || 'USD',
    openDate: data.openDate || serverTimestamp(),
    notes: data.notes || null,
    dataSource: data.dataSource || 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('[holdings] created holding:', docRef.id);
  return docRef.id;
}

export async function getHoldingBySymbol(
  userId: string,
  accountId: string,
  symbol: string
): Promise<Holding | null> {
  const col = holdingsCollection(userId, accountId);
  const q = query(col, where('symbol', '==', symbol.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Holding;
}

export async function addToPosition(
  userId: string,
  holdingId: string,
  data: any
): Promise<void> {
  // holdingId alone isn't enough to locate the doc; we need accountId
  // The caller should use updateHolding instead for full path
  console.warn('[holdings] addToPosition: use updateHolding with full path for production');
}

export async function getHoldingsByAccount(
  userId: string,
  accountId: string
): Promise<Holding[]> {
  const col = holdingsCollection(userId, accountId);
  const q = query(col, orderBy('symbol', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Holding));
}

export async function deleteHolding(
  userId: string,
  accountId: string,
  holdingId: string
): Promise<void> {
  const ref = holdingDoc(userId, accountId, holdingId);
  await deleteDoc(ref);
  console.log('[holdings] deleted holding:', holdingId);
}

export async function updateHolding(
  userId: string,
  accountId: string,
  holdingId: string,
  data: any
): Promise<void> {
  const ref = holdingDoc(userId, accountId, holdingId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  console.log('[holdings] updated holding:', holdingId);
}

export async function reducePosition(
  userId: string,
  accountId: string,
  holdingId: string,
  qty: number
): Promise<void> {
  const ref = holdingDoc(userId, accountId, holdingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Holding not found');

  const current = snap.data();
  const newQty = (current.quantity || 0) - qty;

  if (newQty <= 0) {
    await deleteDoc(ref);
    console.log('[holdings] closed position:', holdingId);
  } else {
    await updateDoc(ref, {
      quantity: newQty,
      totalCostBasis: newQty * (current.costBasisPerShare || 0),
      updatedAt: serverTimestamp(),
    });
    console.log('[holdings] reduced position:', holdingId, 'new qty:', newQty);
  }
}

export function subscribeToHoldings(
  userId: string,
  accountId: string,
  callback: (holdings: Holding[]) => void
): Unsubscribe {
  try {
    const col = holdingsCollection(userId, accountId);
    const q = query(col, orderBy('symbol', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const holdings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Holding));
      callback(holdings);
    }, (error) => {
      console.error('[holdings] subscription error:', error);
      callback([]);
    });
  } catch {
    console.error('[holdings] failed to subscribe');
    return () => {};
  }
}
