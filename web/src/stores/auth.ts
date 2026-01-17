import { atom, computed } from 'nanostores';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'pending' | 'user' | 'premium' | 'admin';
  status: 'pending' | 'active' | 'suspended';
}

export const $user = atom<User | null>(null);
export const $authLoading = atom<boolean>(true);
export const $authError = atom<string | null>(null);

export const $isAuthenticated = computed($user, (user) => user !== null);
export const $isAdmin = computed($user, (user) => user?.role === 'admin');
export const $isActive = computed($user, (user) => user?.status === 'active');
export const $isPending = computed($user, (user) => user?.status === 'pending');

export function setUser(user: User | null) {
  $user.set(user);
  $authLoading.set(false);
}

export function setAuthLoading(loading: boolean) {
  $authLoading.set(loading);
}

export function setAuthError(error: string | null) {
  $authError.set(error);
}

export function clearAuth() {
  $user.set(null);
  $authError.set(null);
  $authLoading.set(false);
}
