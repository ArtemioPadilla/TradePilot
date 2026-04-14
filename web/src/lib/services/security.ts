import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase';

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser?.email) throw new Error('Not authenticated');

  // Re-authenticate first
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);

  // Then update password
  await updatePassword(auth.currentUser, newPassword);
  console.log('[security] password changed successfully');
}

export async function getSecuritySettings(userId: string): Promise<SecuritySettings> {
  const db = getFirebaseDb();
  if (!db) {
    return { twoFactorEnabled: false, loginNotifications: false, sessionTimeout: 30 };
  }

  try {
    const ref = doc(db, 'users', userId, 'settings', 'security');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { twoFactorEnabled: false, loginNotifications: false, sessionTimeout: 30 };
    }
    return snap.data() as SecuritySettings;
  } catch (error) {
    console.error('[security] error fetching settings:', error);
    return { twoFactorEnabled: false, loginNotifications: false, sessionTimeout: 30 };
  }
}

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  return Math.min(score, 100);
}

export async function signOutAllDevices(userId: string): Promise<void> {
  // This requires Firebase Admin SDK — must be done via Cloud Function
  // For now, sign out the current session
  const auth = getFirebaseAuth();
  if (auth) {
    await auth.signOut();
    console.log('[security] signed out current session');
  }
}

export function canChangePassword(): boolean {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return false;
  return auth.currentUser.providerData.some((p) => p.providerId === 'password');
}
