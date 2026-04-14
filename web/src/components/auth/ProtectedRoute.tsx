import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $user, $authLoading, $isAuthenticated, $isActive, $isPending, $isAdmin } from '../../stores/auth';
import { appPath } from '../../lib/utils/paths';

interface ProtectedRouteProps {
  children: ReactNode;
  requireActive?: boolean;
  requireAdmin?: boolean;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requireActive = true,
  requireAdmin = false,
  fallbackUrl = ''
}: ProtectedRouteProps) {
  const user = useStore($user);
  const authLoading = useStore($authLoading);
  const isAuthenticated = useStore($isAuthenticated);
  const isActive = useStore($isActive);
  const isPending = useStore($isPending);
  const isAdmin = useStore($isAdmin);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      window.location.href = fallbackUrl || appPath('/auth/login');
      return;
    }

    // Require active status
    if (requireActive && isPending) {
      window.location.href = appPath('/auth/pending');
      return;
    }

    // Require admin role
    if (requireAdmin && !isAdmin) {
      window.location.href = appPath('/dashboard');
      return;
    }

    // User is suspended
    if (user?.status === 'suspended') {
      window.location.href = appPath('/auth/suspended');
      return;
    }
  }, [mounted, authLoading, isAuthenticated, isActive, isPending, isAdmin, requireActive, requireAdmin, user, fallbackUrl]);

  // Don't render anything on server or while loading
  if (!mounted || authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">
          <svg width="40" height="40" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated or not authorized
  if (!isAuthenticated) {
    return null;
  }

  if (requireActive && !isActive) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
