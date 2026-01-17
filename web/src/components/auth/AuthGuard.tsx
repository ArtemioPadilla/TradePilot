import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const AUTH_TIMEOUT_MS = 10000; // 10 second timeout

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'pending' | 'suspended' | 'unauthorized' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isUnmounted = false;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!isUnmounted && status === 'loading') {
        console.error('Auth check timed out');
        setErrorMessage('Connection timed out. Please check your internet connection and try again.');
        setStatus('error');
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isUnmounted) return;

      if (!firebaseUser) {
        clearTimeout(timeoutId);
        setStatus('unauthenticated');
        window.location.href = '/auth/login';
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (isUnmounted) return;
        clearTimeout(timeoutId);

        if (!userDoc.exists()) {
          // User exists in Auth but not in Firestore - likely incomplete registration
          console.error('User document not found in Firestore');
          setErrorMessage('Your account setup is incomplete. Please contact support or register again.');
          setStatus('error');
          return;
        }

        const userData = userDoc.data();

        if (userData.status === 'pending') {
          setStatus('pending');
          window.location.href = '/auth/pending';
          return;
        }

        if (userData.status === 'suspended') {
          setStatus('suspended');
          window.location.href = '/auth/suspended';
          return;
        }

        if (requireAdmin && userData.role !== 'admin') {
          setStatus('unauthorized');
          window.location.href = '/dashboard';
          return;
        }

        setStatus('authenticated');
        // Reveal the hidden app container
        document.getElementById('app-container')?.classList.add('authenticated');
      } catch (error: any) {
        if (isUnmounted) return;
        clearTimeout(timeoutId);

        console.error('Auth check error:', error);

        // Provide helpful error messages
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          setErrorMessage('Unable to connect to the server. Please check your internet connection.');
        } else if (error.code === 'permission-denied') {
          setErrorMessage('Access denied. Please try logging in again.');
        } else {
          setErrorMessage('An error occurred while checking your account. Please try again.');
        }
        setStatus('error');
      }
    });

    return () => {
      isUnmounted = true;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [requireAdmin]);

  if (status === 'loading') {
    return (
      <div className="auth-guard-loading">
        <div className="loading-container">
          <svg width="48" height="48" viewBox="0 0 24 24" className="spinner">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="31.4"
              strokeLinecap="round"
            />
          </svg>
          <p>Loading...</p>
        </div>
        <style>{`
          .auth-guard-loading {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-primary, #0a0a1a);
            z-index: 9999;
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            color: var(--text-muted, #888);
          }
          .spinner {
            color: var(--accent, #00d4aa);
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-guard-error">
        <div className="error-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => window.location.href = '/auth/login'} className="btn btn-ghost">
              Back to Login
            </button>
          </div>
        </div>
        <style>{`
          .auth-guard-error {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-primary, #0a0a1a);
            z-index: 9999;
          }
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          .error-container svg {
            color: var(--negative, #ef4444);
          }
          .error-container h2 {
            color: var(--text-primary, #fff);
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
          }
          .error-container p {
            color: var(--text-muted, #888);
            margin: 0;
            line-height: 1.5;
          }
          .error-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 0.5rem;
          }
          .btn {
            padding: 0.625rem 1.25rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            font-size: 0.875rem;
          }
          .btn-primary {
            background-color: var(--accent, #3b82f6);
            color: white;
          }
          .btn-primary:hover {
            background-color: var(--accent-hover, #2563eb);
          }
          .btn-ghost {
            background-color: transparent;
            color: var(--text-secondary, #aaa);
            border: 1px solid var(--border, #333);
          }
          .btn-ghost:hover {
            background-color: var(--bg-secondary, #1a1a2e);
          }
        `}</style>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
