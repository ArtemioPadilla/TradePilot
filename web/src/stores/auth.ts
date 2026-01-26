import { atom, computed } from 'nanostores';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'pending' | 'user' | 'premium' | 'admin';
  status: 'pending' | 'active' | 'suspended';
}

// localStorage key for auth cache
const AUTH_CACHE_KEY = 'tradepilot_auth_cache';

export const $user = atom<User | null>(null);
export const $authLoading = atom<boolean>(true);
export const $authError = atom<string | null>(null);
// Has the auth listener fired at least once? (separate from loading state)
export const $authInitialized = atom<boolean>(false);
// Do we have a cached indication that user was logged in?
export const $hasCachedAuth = atom<boolean>(false);

export const $isAuthenticated = computed($user, (user) => user !== null);
export const $isAdmin = computed($user, (user) => user?.role === 'admin');
export const $isActive = computed($user, (user) => user?.status === 'active');
export const $isPending = computed($user, (user) => user?.status === 'pending');

// Cache auth state to localStorage for instant page loads
function cacheAuthState(user: User | null) {
  if (typeof window === 'undefined') return;

  try {
    if (user) {
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        // Don't cache role/status - always verify from Firestore
        timestamp: Date.now(),
      }));
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // localStorage might be unavailable
  }
}

// Read cached auth state - returns basic user info if cached
export function getCachedAuth(): Partial<User> | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    // Cache expires after 7 days
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
    };
  } catch {
    return null;
  }
}

// Check if we have cached auth (call this early to set $hasCachedAuth)
export function checkCachedAuth(): boolean {
  const cached = getCachedAuth();
  const hasCached = cached !== null;
  $hasCachedAuth.set(hasCached);
  return hasCached;
}

export function setUser(user: User | null) {
  console.log('[AuthStore] setUser:', user?.email || 'null', user?.status || '');
  $user.set(user);
  $authLoading.set(false);
  $authInitialized.set(true);
  cacheAuthState(user);
}

export function setAuthLoading(loading: boolean) {
  console.log('[AuthStore] setAuthLoading:', loading);
  $authLoading.set(loading);
}

export function setAuthError(error: string | null) {
  console.log('[AuthStore] setAuthError:', error);
  $authError.set(error);
}

export function clearAuth() {
  console.log('[AuthStore] clearAuth called');
  $user.set(null);
  $authError.set(null);
  $authLoading.set(false);
  $authInitialized.set(true);
  cacheAuthState(null);
  $hasCachedAuth.set(false);
}

/**
 * Update the current user's data without full re-authentication.
 * Useful for updating photoURL or displayName after profile changes.
 */
export function refreshUser(updates: Partial<User>) {
  const current = $user.get();
  if (current) {
    const updated = { ...current, ...updates };
    console.log('[AuthStore] refreshUser:', updates);
    $user.set(updated);
    cacheAuthState(updated);
  }
}
