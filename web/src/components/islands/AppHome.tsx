import * as React from 'react';
import { useStore } from '@nanostores/react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { withBase } from '@/lib/href';
import { provideRepos } from '@/lib/data/supabase';
import type { Profile } from '@/lib/data/contracts';
import { $session } from '@/stores/session';
import AuthGuard from './AuthGuard';

/**
 * /app landing (Phase 1 "working login" proof): guarded, greets the signed-in
 * user, and round-trips the data layer by loading their profile row (created
 * by the on_auth_user_created trigger). Phases 2-4 replace this with the real
 * strategy/backtest/dashboard surfaces.
 */
function ProfileCard() {
  const session = useStore($session);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');

  React.useEffect(() => {
    if (!session.userId) return;
    let cancelled = false;
    provideRepos()
      .profiles.get(session.userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [session.userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {state === 'loading' && 'Loading your profile…'}
          {state === 'ready' && `Welcome${profile?.display_name ? `, ${profile.display_name}` : ''}!`}
          {state === 'error' && 'Profile unavailable'}
        </CardTitle>
        <CardDescription>
          {state === 'ready' && (session.email ?? 'Signed in')}
          {state === 'error' && 'Could not load your profile row. Try reloading.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>You are signed in. Jump into the trading tools:</p>
        <ul className="mt-3 space-y-1.5">
          <li>
            <a
              href={withBase('/app/strategies/')}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Strategies
            </a>{' '}
            — create momentum, mean-reversion, smart-beta, or custom-code strategies.
          </li>
          <li>
            <a
              href={withBase('/app/backtest/')}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Backtest
            </a>{' '}
            — run a real simulation in your browser and save the results.
          </li>
          <li>
            <a
              href={withBase('/app/lab/')}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Backtest Lab
            </a>{' '}
            — compare variants, sweep parameter grids, and walk-forward test.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

export default function AppHome() {
  return (
    <AuthGuard>
      <ProfileCard />
    </AuthGuard>
  );
}
