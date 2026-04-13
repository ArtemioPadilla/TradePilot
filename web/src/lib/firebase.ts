import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'AIzaSyPlaceholder',
  authDomain: 'tradepilot-827d1.firebaseapp.com',
  projectId: 'tradepilot-827d1',
  storageBucket: 'tradepilot-827d1.appspot.com',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_ID || '',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (typeof window === 'undefined') return null;
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not initialized');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not initialized');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not initialized');
  return firebaseSignOut(auth);
}

export async function sendPasswordReset(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not initialized');
  return sendPasswordResetEmail(auth, email);
}

export async function createUserProfile(
  uid: string,
  data: { displayName: string; email: string; inviteCode?: string | null },
) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Firestore not initialized');
  return setDoc(doc(db, 'users', uid), {
    ...data,
    role: 'user',
    status: 'pending',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export function onAuthStateChanged(
  callback: (user: User | null) => void,
): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}
