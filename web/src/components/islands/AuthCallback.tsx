import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { withBase } from '@/lib/href';
import { supabase } from '@/lib/data/supabaseClient';

/**
 * PKCE callback processor for /auth/callback. supabase-js (detectSessionInUrl)
 * exchanges the ?code automatically on load; this island waits for the result
 * and forwards to the app, or back to /auth with an error message.
 */
export default function AuthCallback() {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) {
      location.replace(withBase('/auth/'));
      return;
    }

    let done = false;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (done) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        supabase!.auth.getSession().then(({ data: s }) => {
          if (done) return;
          if (s.session) {
            done = true;
            location.replace(withBase('/app/'));
          }
        });
      }
    });

    // If nothing lands within 8s, the code was invalid/expired.
    const timer = setTimeout(() => {
      if (!done) setFailed(true);
    }, 8000);

    return () => {
      done = true;
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (failed) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-destructive">Could not complete sign-in.</p>
        <a href={withBase('/auth/')} className="text-sm font-semibold text-primary underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status" aria-live="polite">
      <Spinner />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
