/**
 * Security Settings Form Component
 *
 * Manages security settings including password changes, 2FA setup,
 * and session management.
 */

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $user } from '../../stores/auth';
import {
  changePassword,
  getSecuritySettings,
  calculatePasswordStrength,
  signOutAllDevices,
  canChangePassword,
  type SecuritySettings,
} from '../../lib/services/security';
import { getLastSignInAt, getAccountCreatedAt } from '../../lib/services/profile';

export function SecuritySettingsForm() {
  const user = useStore($user);

  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Session management
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  // Derived state
  const passwordStrength = calculatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitPassword = currentPassword && newPassword && confirmPassword && passwordsMatch && passwordStrength.score >= 2;
  const isPasswordUser = canChangePassword();
  const lastSignIn = getLastSignInAt();
  const accountCreated = getAccountCreatedAt();

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
    }
  }, [user?.uid]);

  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadSecuritySettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const settings = await getSecuritySettings(user.uid);
      setSecuritySettings(settings);
    } catch (err) {
      console.error('Failed to load security settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitPassword) return;

    setIsChangingPassword(true);
    setError(null);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Reload settings to update lastPasswordChange
      loadSecuritySettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm('This will sign you out from all devices, including this one. Continue?')) {
      return;
    }

    setIsSigningOutAll(true);
    setError(null);

    try {
      await signOutAllDevices();
      // User will be redirected by auth state change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out from all devices');
      setIsSigningOutAll(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  if (!user) {
    return (
      <div className="security-settings" data-testid="security-settings">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading security settings...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="security-settings" data-testid="security-settings">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="success-message" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Password Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Password
        </h3>
        <p className="section-description">
          {isPasswordUser
            ? 'Update your password to keep your account secure'
            : 'Your account uses Google Sign-In for authentication'}
        </p>

        {isPasswordUser ? (
          <>
            {!showPasswordForm ? (
              <div className="password-info">
                <div className="info-row">
                  <span className="info-label">Last changed</span>
                  <span className="info-value">
                    {securitySettings?.lastPasswordChange
                      ? securitySettings.lastPasswordChange.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordForm(true)}
                  data-testid="change-password-btn"
                >
                  Change password
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="password-form">
                {/* Current Password */}
                <div className="form-group">
                  <label htmlFor="current-password">Current password</label>
                  <div className="password-input">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                      data-testid="current-password-input"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label htmlFor="new-password">New password</label>
                  <div className="password-input">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter a new password"
                      autoComplete="new-password"
                      data-testid="new-password-input"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="password-strength">
                      <div className="strength-bars">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`strength-bar ${i <= passwordStrength.score ? 'filled' : ''}`}
                            style={{
                              backgroundColor: i <= passwordStrength.score ? passwordStrength.color : undefined,
                            }}
                          />
                        ))}
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}

                  <ul className="password-requirements">
                    <li className={newPassword.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>One lowercase letter</li>
                    <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>One number</li>
                  </ul>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    data-testid="confirm-password-input"
                  />
                  {confirmPassword && !passwordsMatch && (
                    <span className="field-error">Passwords do not match</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelPasswordChange}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canSubmitPassword || isChangingPassword}
                    data-testid="submit-password-btn"
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="btn-spinner" />
                        Changing...
                      </>
                    ) : (
                      'Change password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="google-auth-notice">
            <div className="notice-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="notice-text">
              <strong>Google authentication</strong>
              <p>Your password is managed by Google. To change it, visit your Google Account settings.</p>
            </div>
          </div>
        )}
      </section>

      {/* Two-Factor Authentication */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Two-Factor Authentication
        </h3>
        <p className="section-description">
          Add an extra layer of security to your account
        </p>

        <div className="tfa-status">
          <div className="status-card">
            <div className="status-icon pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="status-info">
              <strong>Coming Soon</strong>
              <p>
                Two-factor authentication with authenticator apps (TOTP) will be available soon.
                This will protect your account even if your password is compromised.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Activity */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Account Activity
        </h3>
        <p className="section-description">
          Information about your account activity and sessions
        </p>

        <div className="activity-grid">
          <div className="activity-item">
            <span className="activity-label">Last sign in</span>
            <span className="activity-value">
              {lastSignIn
                ? lastSignIn.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Unknown'}
            </span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Account created</span>
            <span className="activity-value">
              {accountCreated
                ? accountCreated.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </span>
          </div>
        </div>

        <div className="session-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSignOutAllDevices}
            disabled={isSigningOutAll}
            data-testid="sign-out-all-btn"
          >
            {isSigningOutAll ? (
              <>
                <span className="btn-spinner" />
                Signing out...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out all devices
              </>
            )}
          </button>
          <p className="action-description">
            This will sign you out from all devices, including this one.
          </p>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .security-settings {
    max-width: 600px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: var(--text-muted, #6b7280);
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border, #e5e7eb);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 0.75rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .success-message,
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md, 0.375rem);
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .success-message {
    background-color: rgba(22, 163, 74, 0.1);
    color: #16a34a;
    border: 1px solid rgba(22, 163, 74, 0.2);
  }

  .error-message {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    border: 1px solid rgba(220, 38, 38, 0.2);
  }

  .settings-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .settings-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .settings-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.375rem 0;
  }

  .settings-section h3 svg {
    color: var(--text-muted, #6b7280);
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.25rem 0;
  }

  /* Password Info */
  .password-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-md, 0.375rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .info-label {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  /* Password Form */
  .password-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .form-group input {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    background-color: var(--bg-primary, #ffffff);
    color: var(--text-primary, #111827);
  }

  .form-group input:focus {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: -1px;
  }

  .password-input {
    position: relative;
  }

  .password-input input {
    width: 100%;
    padding-right: 2.5rem;
  }

  .toggle-visibility {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
  }

  .toggle-visibility:hover {
    color: var(--text-primary, #111827);
  }

  /* Password Strength */
  .password-strength {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .strength-bars {
    display: flex;
    gap: 4px;
  }

  .strength-bar {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    background-color: var(--border, #e5e7eb);
    transition: background-color 0.2s;
  }

  .strength-label {
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Password Requirements */
  .password-requirements {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    list-style: none;
  }

  .password-requirements li {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    padding: 0.125rem 0;
    position: relative;
  }

  .password-requirements li::before {
    content: '\\2022';
    position: absolute;
    left: -1rem;
  }

  .password-requirements li.met {
    color: #16a34a;
  }

  .password-requirements li.met::before {
    content: '\\2713';
    color: #16a34a;
  }

  .field-error {
    font-size: 0.75rem;
    color: #dc2626;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  /* Google Auth Notice */
  .google-auth-notice {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .notice-icon {
    flex-shrink: 0;
  }

  .notice-text strong {
    display: block;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
  }

  .notice-text p {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  /* TFA Status */
  .tfa-status {
    margin-top: 0.5rem;
  }

  .status-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .status-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .status-icon.pending {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .status-info strong {
    display: block;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
  }

  .status-info p {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
    line-height: 1.5;
  }

  /* Activity Grid */
  .activity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .activity-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-md, 0.375rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .activity-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #6b7280);
  }

  .activity-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .session-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-description {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--accent, #6366f1);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-secondary {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-primary, #111827);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--border, #e5e7eb);
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-secondary .btn-spinner {
    border-color: rgba(0, 0, 0, 0.1);
    border-top-color: var(--text-primary, #111827);
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .form-actions .btn {
      width: 100%;
      justify-content: center;
    }

    .google-auth-notice,
    .status-card {
      flex-direction: column;
      text-align: center;
    }

    .notice-icon,
    .status-icon {
      align-self: center;
    }
  }
`;

export default SecuritySettingsForm;
