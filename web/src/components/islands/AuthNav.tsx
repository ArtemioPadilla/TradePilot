import * as React from 'react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { withBase } from '@/lib/href';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import { provideRepos } from '@/lib/data/supabase';
import { $session, startSessionSync } from '@/stores/session';

/**
 * Header session controls: "Sign in" link when signed out, email + sign-out
 * when signed in. Renders nothing until the session resolves (and nothing at
 * all on builds without Supabase) so the header never flashes.
 */
export default function AuthNav() {
  const session = useStore($session);

  React.useEffect(() => {
    startSessionSync();
  }, []);

  if (!isSupabaseConfigured || session.status === 'loading') return null;

  if (session.status === 'signed-out') {
    return (
      <a
        href={withBase('/auth/')}
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign in
      </a>
    );
  }

  async function signOut() {
    try {
      await provideRepos().auth.signOut();
      location.assign(withBase('/'));
    } catch {
      // Session listener will reconcile state; nothing actionable here.
    }
  }

  return (
    <span className="flex items-center gap-2">
      <a
        href={withBase('/app/')}
        className="hidden max-w-40 truncate font-mono text-xs text-muted-foreground transition-colors hover:text-foreground md:inline"
        title={session.email ?? undefined}
      >
        {session.email}
      </a>
      <Button type="button" variant="ghost" size="sm" onClick={signOut}>
        Sign out
      </Button>
    </span>
  );
}
