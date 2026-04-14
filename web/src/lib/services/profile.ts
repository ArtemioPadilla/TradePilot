// TODO: implement with real Firebase/API calls

/**
 * Get the user's last sign-in timestamp as an ISO string.
 */
export async function getLastSignInAt(userId: string): Promise<string | null> {
  // TODO: read from Firebase Auth user metadata
  console.warn('[profile] getLastSignInAt is a stub');
  return null;
}

/**
 * Get the user's account creation timestamp as an ISO string.
 */
export async function getAccountCreatedAt(userId: string): Promise<string | null> {
  // TODO: read from Firebase Auth user metadata
  console.warn('[profile] getAccountCreatedAt is a stub');
  return null;
}

/**
 * Update the user's display name in Firebase Auth and Firestore.
 */
export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  // TODO: update Firebase Auth profile and Firestore user doc
  console.warn('[profile] updateDisplayName is a stub');
}

/**
 * Upload a profile photo to Firebase Storage and update the user's photoURL.
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  // TODO: upload to Firebase Storage, update Auth photoURL
  console.warn('[profile] uploadProfilePhoto is a stub');
  return '';
}

/**
 * Delete the user's profile photo from Storage and clear photoURL.
 */
export async function deleteProfilePhoto(userId: string): Promise<void> {
  // TODO: delete from Firebase Storage, clear Auth photoURL
  console.warn('[profile] deleteProfilePhoto is a stub');
}

/**
 * Permanently delete the user's account and all associated data.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  // TODO: delete Firestore data, Storage files, then Auth account
  console.warn('[profile] deleteUserAccount is a stub');
}

/**
 * Re-authenticate a user with email/password before sensitive operations.
 */
export async function reauthenticateWithPassword(password: string): Promise<void> {
  // TODO: use Firebase Auth reauthenticateWithCredential
  console.warn('[profile] reauthenticateWithPassword is a stub');
}

/**
 * Re-authenticate a user via Google popup before sensitive operations.
 */
export async function reauthenticateWithGoogle(): Promise<void> {
  // TODO: use Firebase Auth reauthenticateWithPopup + GoogleAuthProvider
  console.warn('[profile] reauthenticateWithGoogle is a stub');
}

/**
 * Determine the primary auth provider for the current user.
 */
export function getAuthProvider(): 'password' | 'google.com' {
  // TODO: inspect Firebase Auth currentUser.providerData
  console.warn('[profile] getAuthProvider is a stub');
  return 'password';
}
