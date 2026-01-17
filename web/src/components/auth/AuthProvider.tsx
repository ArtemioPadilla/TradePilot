import { useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { setUser, setAuthLoading, clearAuth, type User } from '../../stores/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              role: userData.role || 'user',
              status: userData.status || 'pending',
            };
            setUser(user);

            // Update last login
            await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          } else {
            // Create user profile if it doesn't exist (first login)
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              status: 'pending',
            };

            await setDoc(userDocRef, {
              ...newUser,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });

            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set basic user info if Firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'user',
            status: 'pending',
          });
        }
      } else {
        clearAuth();
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}

export default AuthProvider;
