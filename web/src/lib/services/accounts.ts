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
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { Account, AccountStatus } from '../../types/portfolio';

function accountsCollection(userId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'users', userId, 'accounts');
}

function accountDoc(userId: string, accountId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', userId, 'accounts', accountId);
}

export async function createAccount(
  userId: string,
  data: { name: string; type: string; institution?: string }
): Promise<string> {
  const col = accountsCollection(userId);
  const docRef = await addDoc(col, {
    userId,
    name: data.name,
    type: data.type,
    institution: data.institution || null,
    currency: 'USD',
    cashBalance: 0,
    status: 'active',
    source: 'manual',
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('[accounts] created account:', docRef.id);
  return docRef.id;
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const col = accountsCollection(userId);
  const q = query(col, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
}

export async function getAccount(
  userId: string,
  accountId: string
): Promise<Account | null> {
  const ref = accountDoc(userId, accountId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Account;
}

export async function deleteAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const ref = accountDoc(userId, accountId);
  await deleteDoc(ref);
  console.log('[accounts] deleted account:', accountId);
}

export async function updateAccountStatus(
  userId: string,
  accountId: string,
  status: string
): Promise<void> {
  const ref = accountDoc(userId, accountId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
  console.log('[accounts] updated account status:', accountId, status);
}

export function subscribeToAccounts(
  userId: string,
  callback: (accounts: Account[]) => void
): Unsubscribe {
  try {
    const col = accountsCollection(userId);
    const q = query(col, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
      callback(accounts);
    }, (error) => {
      console.error('[accounts] subscription error:', error);
      callback([]);
    });
  } catch {
    console.error('[accounts] failed to subscribe');
    return () => {};
  }
}
