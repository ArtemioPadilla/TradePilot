import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $user, $isAuthenticated } from '../../stores/auth';
import { appPath } from '../../lib/utils/paths';

export function LandingNav() {
  const user = useStore($user);
  const isAuthenticated = useStore($isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect logged-in users to /home
  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      window.location.href = appPath('/home');
    }
  }, [mounted, isAuthenticated, user]);

  // SSR: render nothing until mounted
  if (!mounted) {
    return null;
  }

  // Don't block on auth - show default login/register buttons immediately
  // If user becomes authenticated, the redirect effect will kick in
  return (
    <div className="nav-links">
      <a href={appPath('/auth/login')} className="btn btn-ghost">Log in</a>
      <a href={appPath('/auth/register')} className="btn btn-primary">Get Started</a>
    </div>
  );
}

export default LandingNav;
