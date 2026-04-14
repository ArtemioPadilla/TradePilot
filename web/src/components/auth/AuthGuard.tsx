import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $user, $authLoading, $isAuthenticated, $isActive, $isPending, $isAdmin, $hasCachedAuth } from '../../stores/auth';
import { appPath } from '../../lib/utils/paths';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const AUTH_TIMEOUT_MS = 30000;       // 30 seconds - generous timeout
const SLOW_THRESHOLD_MS = 3000;      // Show "still connecting" after 3s
const VERY_SLOW_THRESHOLD_MS = 8000; // Show "taking longer than usual" after 8s

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const user = useStore($user);
  const authLoading = useStore($authLoading);
  const isAuthenticated = useStore($isAuthenticated);
  const isActive = useStore($isActive);
  const isPending = useStore($isPending);
  const isAdmin = useStore($isAdmin);
  const hasCachedAuth = useStore($hasCachedAuth);

  const [mounted, setMounted] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verifying your session...');
  const [timedOut, setTimedOut] = useState(false);
  const hasRedirectedRef = useRef(false);

  // If we have cached auth, show content optimistically while Firebase initializes
  const showContentOptimistically = hasCachedAuth && authLoading && !requireAdmin;

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Progressive loading messages and timeout (only when not showing content optimistically)
  useEffect(() => {
    if (!mounted || !authLoading || showContentOptimistically) return;

    const slowTimer = setTimeout(() => {
      setLoadingMessage('Still connecting...');
    }, SLOW_THRESHOLD_MS);

    const verySlowTimer = setTimeout(() => {
      setLoadingMessage('Taking longer than usual...');
    }, VERY_SLOW_THRESHOLD_MS);

    const timeoutTimer = setTimeout(() => {
      console.error('Auth check timed out after 30 seconds');
      setTimedOut(true);
    }, AUTH_TIMEOUT_MS);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      clearTimeout(timeoutTimer);
    };
  }, [mounted, authLoading, showContentOptimistically]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!mounted || authLoading || hasRedirectedRef.current) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      hasRedirectedRef.current = true;
      window.location.href = appPath('/auth/login');
      return;
    }

    // User is pending approval
    if (isPending) {
      hasRedirectedRef.current = true;
      window.location.href = appPath('/auth/pending');
      return;
    }

    // User is suspended
    if (user?.status === 'suspended') {
      hasRedirectedRef.current = true;
      window.location.href = appPath('/auth/suspended');
      return;
    }

    // Require admin but user is not admin
    if (requireAdmin && !isAdmin) {
      hasRedirectedRef.current = true;
      window.location.href = appPath('/dashboard');
      return;
    }

    // Auth successful - reveal the app container
    document.getElementById('app-container')?.classList.add('authenticated');
  }, [mounted, authLoading, isAuthenticated, isPending, isAdmin, user, requireAdmin]);

  // Reveal app container immediately when showing content optimistically
  useEffect(() => {
    if (mounted && showContentOptimistically) {
      document.getElementById('app-container')?.classList.add('authenticated');
    }
  }, [mounted, showContentOptimistically]);

  // Server-side or not mounted yet
  if (!mounted) {
    return null;
  }

  // Timed out
  if (timedOut) {
    return (
      <div className="auth-guard-error">
        <div className="error-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Something went wrong</h2>
          <p>Connection timed out. Please check your internet connection and try again.</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => window.location.href = appPath('/auth/login')} className="btn btn-ghost">
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

  // Show content optimistically while auth loads (for cached users)
  // This provides instant page loads for returning users
  if (showContentOptimistically) {
    return <>{children}</>;
  }

  // Still loading - show spinner
  if (authLoading) {
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
          <p>{loadingMessage}</p>
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

  // Not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Pending or suspended (will redirect via useEffect)
  if (isPending || user?.status === 'suspended') {
    return null;
  }

  // Not admin when required (will redirect via useEffect)
  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
