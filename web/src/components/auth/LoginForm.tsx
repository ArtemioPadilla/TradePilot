import { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from '../../lib/firebase';
import { setAuthError } from '../../stores/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // Uses popup - returns result directly (no redirect)
      const result = await signInWithGoogle();

      // Popup completed successfully
      // AuthInitializer (already running via MainLayout) will detect the auth change
      // and redirect to /dashboard automatically - no manual redirect needed
      if (result.user) {
        console.log('[LoginForm] Google sign-in successful, AuthInitializer will redirect');
        // Keep googleLoading=true to show spinner while AuthInitializer redirects
        return; // Don't reset loading state
      }
    } catch (err: any) {
      console.error('[LoginForm] Google sign-in error:', err.code, err.message);
      const errorMessage = getGoogleErrorMessage(err.code);
      setError(errorMessage);
      setAuthError(errorMessage);
    }
    // Only reset loading on error, not on success (redirect handles it)
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      // Redirect will happen via auth state change
      window.location.href = '/dashboard';
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <button
        type="button"
        className="btn btn-google btn-full"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <span className="btn-loading">
            <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="label" htmlFor="password">Password</label>
            <a href="/auth/forgot-password" className="forgot-link">Forgot password?</a>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            className="input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={6}
          />
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading || googleLoading}>
          {loading ? (
            <span className="btn-loading">
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </span>
          ) : (
            <span className="btn-text">Log in</span>
          )}
        </button>
      </form>
    </div>
  );
}

function getGoogleErrorMessage(code: string): string {
  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Try signing in with email/password';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups for this site and try again';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support';
    default:
      return 'Failed to sign in with Google. Please try again';
  }
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}

export default LoginForm;
