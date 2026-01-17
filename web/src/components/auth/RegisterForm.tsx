import { useState } from 'react';
import { signUpWithEmail, createUserProfile } from '../../lib/firebase';
import { setAuthError } from '../../stores/auth';

interface RegisterFormProps {
  inviteCode?: string;
}

export function RegisterForm({ inviteCode }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = '/auth/pending';
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
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

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
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
        <a href="/terms">Terms of Service</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </form>
  );
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
