import {
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase';

export async function getLastSignInAt(userId: string): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.metadata.lastSignInTime ?? null;
}

export async function getAccountCreatedAt(userId: string): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.metadata.creationTime ?? null;
}

export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not authenticated');

  // Update Firebase Auth profile
  await updateProfile(auth.currentUser, { displayName });

  // Update Firestore user doc
  const db = getFirebaseDb();
  if (db) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayName,
      updatedAt: serverTimestamp(),
    });
  }

  console.log('[profile] updated display name:', displayName);
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  // For now, convert to data URL since Firebase Storage isn't set up
  // In production, this should upload to Firebase Storage
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const photoURL = reader.result as string;
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        reject(new Error('Not authenticated'));
        return;
      }

      await updateProfile(auth.currentUser, { photoURL });

      const db = getFirebaseDb();
      if (db) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          photoURL,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('[profile] uploaded profile photo');
      resolve(photoURL);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function deleteProfilePhoto(userId: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not authenticated');

  await updateProfile(auth.currentUser, { photoURL: '' });

  const db = getFirebaseDb();
  if (db) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL: null,
      updatedAt: serverTimestamp(),
    });
  }

  console.log('[profile] deleted profile photo');
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  if (db) {
    // Delete user's accounts and their holdings
    const accountsCol = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(accountsCol);
    for (const accountDoc of accountsSnap.docs) {
      const holdingsCol = collection(db, 'users', userId, 'accounts', accountDoc.id, 'holdings');
      const holdingsSnap = await getDocs(holdingsCol);
      for (const holdingDocSnap of holdingsSnap.docs) {
        await deleteDoc(holdingDocSnap.ref);
      }
      await deleteDoc(accountDoc.ref);
    }

    // Delete user profile doc
    await deleteDoc(doc(db, 'users', userId));
  }

  // Delete Firebase Auth account
  if (auth?.currentUser) {
    await auth.currentUser.delete();
  }

  console.log('[profile] deleted user account:', userId);
}

export async function reauthenticateWithPassword(password: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser?.email) throw new Error('Not authenticated');

  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await reauthenticateWithCredential(auth.currentUser, credential);
  console.log('[profile] reauthenticated with password');
}

export async function reauthenticateWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not authenticated');

  const provider = new GoogleAuthProvider();
  await reauthenticateWithPopup(auth.currentUser, provider);
  console.log('[profile] reauthenticated with Google');
}

export function getAuthProvider(): 'password' | 'google.com' {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return 'password';

  const providers = auth.currentUser.providerData;
  if (providers.some((p) => p.providerId === 'google.com')) {
    return 'google.com';
  }
  return 'password';
}
