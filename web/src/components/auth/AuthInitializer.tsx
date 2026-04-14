import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../../lib/firebase';
import { setUser, clearAuth, checkCachedAuth, getCachedAuth, $user, type User } from '../../stores/auth';
import { appPath } from '../../lib/utils/paths';

/**
 * AuthInitializer sets up the Firebase auth listener and populates the auth store.
 * It should be mounted once at the root of the app.
 * This is a non-rendering component that only sets up the auth subscription.
 *
 * Note: Google OAuth now uses popup (not redirect), so no redirect result processing needed.
 */
export function AuthInitializer() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    console.log('[AuthInit] Component mounting, path:', window.location.pathname);

    // Prevent double initialization in strict mode
    if (initializedRef.current) {
      console.log('[AuthInit] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;

    // Check cached auth immediately - this sets $hasCachedAuth for instant UI
    const hasCached = checkCachedAuth();
    console.log('[AuthInit] Cached auth check:', hasCached);

    // If we have cached auth, use it immediately for instant UI (avatar, name)
    // This prevents the "U" flash while waiting for Firebase Auth
    if (hasCached) {
      const cachedUser = getCachedAuth();
      if (cachedUser && cachedUser.uid && $user.get() === null) {
        console.log('[AuthInit] Using cached user data for instant UI:', cachedUser.displayName);
        // Set a temporary user with cached data - will be replaced by real data soon
        $user.set({
          uid: cachedUser.uid,
          email: cachedUser.email || null,
          displayName: cachedUser.displayName || null,
          photoURL: cachedUser.photoURL || null,
          role: 'user',      // Default, will be updated from Firestore
          status: 'active',  // Optimistic, will be verified from Firestore
        });
      }
    }

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    if (!auth || !db) {
      console.error('[AuthInit] Firebase not initialized');
      clearAuth(); // Set loading to false so UI doesn't hang
      return;
    }
    console.log('[AuthInit] Firebase initialized successfully');

    // Set up auth state listener
    // This handles both email/password login and Google popup login
    console.log('[AuthInit] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthInit] onAuthStateChanged fired:', firebaseUser ? firebaseUser.email : 'null');

      if (firebaseUser) {
        // PHASE 1: Instant - use Firebase Auth data immediately
        // This makes the UI responsive without waiting for Firestore
        const basicUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'user',        // Default, will update from Firestore
          status: 'active',    // Optimistic, will verify from Firestore
        };
        console.log('[AuthInit] Setting basic user (optimistic)');
        setUser(basicUser);  // This sets authLoading = false immediately

        // PHASE 2: Fetch real status/role from Firestore
        try {
          console.log('[AuthInit] Fetching Firestore profile for:', firebaseUser.uid);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          console.log('[AuthInit] Firestore doc exists:', userDoc.exists());

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('[AuthInit] Firestore data:', { status: userData.status, role: userData.role });

            // Update user with Firestore data
            const userStatus = userData.status || 'active';
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              role: userData.role || 'user',
              status: userStatus,
            });

            // Redirect authenticated users away from auth pages
            const currentPath = window.location.pathname;
            console.log('[AuthInit] Current path:', currentPath);
            console.log('[AuthInit] User status:', userStatus);

            if (currentPath.startsWith(appPath('/auth/login')) || currentPath.startsWith(appPath('/auth/register'))) {
              let targetUrl = appPath('/dashboard');
              if (userStatus === 'pending') {
                targetUrl = appPath('/auth/pending');
              } else if (userStatus === 'suspended') {
                targetUrl = appPath('/auth/suspended');
              }
              console.log('[AuthInit] Redirecting to:', targetUrl);
              window.location.href = targetUrl;
              return; // Stop processing - page is navigating
            } else {
              console.log('[AuthInit] Not on auth page, no redirect needed');
            }

            // Update last login (fire and forget)
            setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch(() => {});
          } else {
            console.log('[AuthInit] Creating user profile (first login)');
            // Create user profile if it doesn't exist (first login)
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              status: 'pending',
            };

            // Check for pending invite code from registration form
            const inviteCode = sessionStorage.getItem('pendingInviteCode');
            if (inviteCode) {
              sessionStorage.removeItem('pendingInviteCode');
            }

            await setDoc(userDocRef, {
              ...newUser,
              inviteCode: inviteCode || null,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });

            setUser(newUser);

            // Redirect new users to pending page
            const currentPath = window.location.pathname;
            if (currentPath.startsWith(appPath('/auth/login')) || currentPath.startsWith(appPath('/auth/register'))) {
              console.log('[AuthInit] New user, redirecting to /auth/pending');
              window.location.href = appPath('/auth/pending');
              return;
            }
          }
        } catch (error) {
          console.error('[AuthInit] Error fetching user profile:', error);
          // Keep basic user info - don't block on Firestore errors
          // Still redirect to dashboard (with optimistic 'active' status)
          const currentPath = window.location.pathname;
          if (currentPath.startsWith(appPath('/auth/login')) || currentPath.startsWith(appPath('/auth/register'))) {
            console.log('[AuthInit] Firestore error, redirecting to /dashboard');
            window.location.href = appPath('/dashboard');
          }
        }
      } else {
        console.log('[AuthInit] No user, clearing auth');
        clearAuth();
      }
    });

    return () => {
      console.log('[AuthInit] Cleanup - unsubscribing');
      unsubscribe();
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default AuthInitializer;
