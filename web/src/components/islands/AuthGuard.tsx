import * as React from 'react';
import { useStore } from '@nanostores/react';

import { Skeleton } from '@/components/ui/skeleton';
import { withBase } from '@/lib/href';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import { $session, startSessionSync } from '@/stores/session';
import ErrorBoundary from './ErrorBoundary';

/**
 * AuthGuard (spec §2) — static hosting has no server middleware, so protected
 * pages mount this island: skeleton while the session resolves, redirect to
 * /auth when signed out, children when signed in. Deny by default.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useStore($session);

  React.useEffect(() => {
    startSessionSync();
  }, []);

  React.useEffect(() => {
    if (session.status === 'signed-out') {
      location.replace(withBase('/auth/'));
    }
  }, [session.status]);

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Auth is not configured in this build; protected content is unavailable.
      </p>
    );
  }

  if (session.status !== 'signed-in') {
    // Also shown briefly while the signed-out redirect kicks in.
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return <ErrorBoundary name="AuthGuard">{children}</ErrorBoundary>;
}
