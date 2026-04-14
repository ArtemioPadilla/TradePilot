import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { signUpWithEmail, createUserProfile, signInWithGoogle } from '../../lib/firebase';
import { setAuthError, $isAuthenticated, $authLoading, $user } from '../../stores/auth';
import { appPath } from '../../lib/utils/paths';

interface RegisterFormProps {
  inviteCode?: string;
}

export function RegisterForm({ inviteCode }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watch auth state for redirect after Google sign-up
  const isAuthenticated = useStore($isAuthenticated);
  const authLoading = useStore($authLoading);
  const user = useStore($user);

  // Redirect authenticated users to appropriate page
  useEffect(() => {
    if (authLoading) return; // Wait for auth to settle

    if (isAuthenticated && user) {
      // Redirect based on user status
      if (user.status === 'pending') {
        window.location.href = appPath('/auth/pending');
      } else if (user.status === 'suspended') {
        window.location.href = appPath('/auth/suspended');
      } else {
        window.location.href = appPath('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, user]);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // Store invite code in sessionStorage so AuthInitializer can use it
      if (inviteCode) {
        sessionStorage.setItem('pendingInviteCode', inviteCode);
      }
      // This redirects to Google - the page will navigate away
      // After auth, user returns and AuthInitializer handles the result
      await signInWithGoogle();
      // Code below won't execute - browser navigates to Google
    } catch (err: any) {
      // Only reaches here if redirect fails to start
      const errorMessage = getGoogleErrorMessage(err.code);
      setError(errorMessage);
      setAuthError(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await signUpWithEmail(email, password);
      const user = userCredential.user;

      // Create Firestore user profile
      await createUserProfile(user.uid, {
        displayName: name,
        email: email,
        inviteCode: inviteCode || null,
      });

      // Redirect to pending approval page or dashboard
      window.location.href = appPath('/auth/pending');
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
        onClick={handleGoogleSignUp}
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
          <label className="label" htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="input"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

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
          <label className="label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="input"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            className="input"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {inviteCode && (
          <div className="invite-badge">
            <span>Invite code: {inviteCode}</span>
          </div>
        )}

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
            <span className="btn-text">Create account</span>
          )}
        </button>

        <p className="terms-text">
          By creating an account, you agree to our{' '}
          <a href={appPath('/terms')}>Terms of Service</a> and{' '}
          <a href={appPath('/privacy')}>Privacy Policy</a>.
        </p>
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
    case 'auth/redirect-cancelled-by-user':
      return 'Sign-in was cancelled';
    case 'auth/redirect-operation-pending':
      return 'A sign-in is already in progress';
    default:
      return 'Failed to start Google sign-in. Please try again';
  }
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}

export default RegisterForm;
