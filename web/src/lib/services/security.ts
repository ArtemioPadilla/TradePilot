// TODO: implement with real Firebase/API calls

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
}

/**
 * Change the current user's password.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // TODO: reauthenticate then updatePassword via Firebase Auth
  console.warn('[security] changePassword is a stub');
}

/**
 * Retrieve security settings for a user.
 */
export async function getSecuritySettings(userId: string): Promise<SecuritySettings> {
  // TODO: read from Firestore users/{userId}/settings/security
  console.warn('[security] getSecuritySettings is a stub');
  return {
    twoFactorEnabled: false,
    loginNotifications: false,
    sessionTimeout: 30,
  };
}

/**
 * Calculate a password strength score from 0 to 100.
 * Evaluates length, character variety, and common patterns.
 */
export function calculatePasswordStrength(password: string): number {
  // TODO: implement robust strength algorithm (zxcvbn or similar)
  console.warn('[security] calculatePasswordStrength is a stub');
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

/**
 * Sign out from all devices by revoking refresh tokens.
 */
export async function signOutAllDevices(userId: string): Promise<void> {
  // TODO: call Firebase Admin SDK revokeRefreshTokens via Cloud Function
  console.warn('[security] signOutAllDevices is a stub');
}

/**
 * Check whether the current user can change their password.
 * Returns false for OAuth-only accounts (e.g., Google sign-in without password).
 */
export function canChangePassword(): boolean {
  // TODO: inspect Firebase Auth currentUser.providerData for 'password' provider
  console.warn('[security] canChangePassword is a stub');
  return true;
}
