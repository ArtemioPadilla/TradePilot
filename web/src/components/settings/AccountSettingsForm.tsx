/**
 * Account Settings Form Component
 *
 * Manages user profile settings including display name, profile photo,
 * and account deletion.
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $user } from '../../stores/auth';
import {
  updateDisplayName,
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteUserAccount,
  reauthenticateWithPassword,
  reauthenticateWithGoogle,
  getAuthProvider,
  getAccountCreatedAt,
} from '../../lib/services/profile';

type ReauthMethod = 'password' | 'google' | null;

export function AccountSettingsForm() {
  const user = useStore($user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Loading/error states
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reauthMethod, setReauthMethod] = useState<ReauthMethod>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Get auth provider
  const authProvider = getAuthProvider();
  const createdAt = getAccountCreatedAt();

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSaveName = async () => {
    if (!user) return;

    setIsSavingName(true);
    setError(null);

    try {
      await updateDisplayName(user.uid, displayName);
      setIsEditingName(false);
      setSuccessMessage('Display name updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    setIsUploadingPhoto(true);
    setError(null);

    try {
      await uploadProfilePhoto(user.uid, file);
      setSuccessMessage('Profile photo updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setIsDeletingPhoto(true);
    setError(null);

    try {
      await deleteProfilePhoto(user.uid);
      setSuccessMessage('Profile photo removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleDeleteAccountStart = () => {
    setShowDeleteModal(true);
    setReauthMethod(null);
    setReauthPassword('');
    setDeleteConfirmText('');
    setError(null);
  };

  const handleReauthenticate = async () => {
    if (!user) return;

    setError(null);

    try {
      if (reauthMethod === 'password') {
        await reauthenticateWithPassword(reauthPassword);
      } else if (reauthMethod === 'google') {
        await reauthenticateWithGoogle();
      }

      // Proceed to confirmation step
      setReauthMethod(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify identity');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;

    setIsDeletingAccount(true);
    setError(null);

    try {
      await deleteUserAccount(user.uid);
      // User will be redirected by auth state change
    } catch (err) {
      if (err instanceof Error && err.message === 'REQUIRES_REAUTHENTICATION') {
        setReauthMethod(authProvider === 'google.com' ? 'google' : 'password');
        setError('Please verify your identity to continue');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      }
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="account-settings" data-testid="account-settings">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading account settings...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="account-settings" data-testid="account-settings">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="success-message" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMessage}
        </div>
      )}

      {error && !showDeleteModal && (
        <div className="error-message" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Profile Photo Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
          </svg>
          Profile Photo
        </h3>
        <p className="section-description">
          Choose a photo that represents you
        </p>

        <div className="photo-section">
          <div className="photo-preview">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <div className="photo-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>

          <div className="photo-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
              id="photo-input"
              data-testid="photo-input"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <>
                  <span className="btn-spinner" />
                  Uploading...
                </>
              ) : (
                'Upload photo'
              )}
            </button>
            {user.photoURL && (
              <button
                type="button"
                className="btn btn-text"
                onClick={handleDeletePhoto}
                disabled={isDeletingPhoto}
              >
                {isDeletingPhoto ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
          <p className="photo-hint">JPEG, PNG, GIF, or WebP. Max 5MB.</p>
        </div>
      </section>

      {/* Display Name Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Display Name
        </h3>
        <p className="section-description">
          This is how you'll appear to other users
        </p>

        <div className="name-field">
          {isEditingName ? (
            <div className="name-edit">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                data-testid="display-name-input"
              />
              <div className="name-edit-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditingName(false);
                    setDisplayName(user.displayName || '');
                  }}
                  disabled={isSavingName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveName}
                  disabled={isSavingName || !displayName.trim()}
                >
                  {isSavingName ? (
                    <>
                      <span className="btn-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="name-display">
              <span className="current-name">{user.displayName || 'Not set'}</span>
              <button
                type="button"
                className="btn btn-text"
                onClick={() => setIsEditingName(true)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Email Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Email Address
        </h3>
        <p className="section-description">
          Your email is used for sign-in and notifications
        </p>

        <div className="email-display">
          <span>{user.email}</span>
          {authProvider === 'google.com' && (
            <span className="provider-badge">
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </span>
          )}
        </div>
      </section>

      {/* Account Info Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Account Info
        </h3>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Account created</span>
            <span className="info-value">
              {createdAt ? createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : 'Unknown'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Account status</span>
            <span className={`info-value status-badge ${user.status}`}>
              {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Suspended'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Account type</span>
            <span className="info-value">{user.role === 'admin' ? 'Administrator' : user.role === 'premium' ? 'Premium' : 'Standard'}</span>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="settings-section danger-zone">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Danger Zone
        </h3>
        <p className="section-description">
          Irreversible actions that affect your account
        </p>

        <div className="danger-card">
          <div className="danger-info">
            <strong>Delete Account</strong>
            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteAccountStart}
            data-testid="delete-account-btn"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="delete-modal">
            <div className="modal-header">
              <h3>Delete Account</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

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

            {/* Reauthentication Step */}
            {reauthMethod === 'password' && (
              <div className="modal-content">
                <p>Please enter your password to verify your identity.</p>
                <div className="form-group">
                  <label htmlFor="reauth-password">Password</label>
                  <input
                    id="reauth-password"
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="Enter your password"
                    data-testid="reauth-password"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleReauthenticate}
                    disabled={!reauthPassword}
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {reauthMethod === 'google' && (
              <div className="modal-content">
                <p>Please sign in with Google to verify your identity.</p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary google-btn"
                    onClick={handleReauthenticate}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Step */}
            {!reauthMethod && (
              <div className="modal-content">
                <div className="warning-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <strong>This action is permanent</strong>
                    <p>All your data will be permanently deleted, including:</p>
                    <ul>
                      <li>Account information</li>
                      <li>Portfolios and holdings</li>
                      <li>Strategies and backtests</li>
                      <li>Alerts and notifications</li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-delete">
                    Type <strong>DELETE</strong> to confirm
                  </label>
                  <input
                    id="confirm-delete"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    data-testid="delete-confirm-input"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteAccountConfirm}
                    disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                    data-testid="confirm-delete-btn"
                  >
                    {isDeletingAccount ? (
                      <>
                        <span className="btn-spinner" />
                        Deleting...
                      </>
                    ) : (
                      'Delete My Account'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .account-settings {
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

  /* Photo Section */
  .photo-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .photo-preview {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 2px solid var(--border, #e5e7eb);
  }

  .photo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted, #6b7280);
  }

  .photo-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .photo-hint {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  /* Name Field */
  .name-field {
    margin-top: 0.5rem;
  }

  .name-display {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .current-name {
    font-size: 1rem;
    color: var(--text-primary, #111827);
    font-weight: 500;
  }

  .name-edit {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .name-edit input {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    background-color: var(--bg-primary, #ffffff);
    color: var(--text-primary, #111827);
  }

  .name-edit input:focus {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: -1px;
  }

  .name-edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* Email Display */
  .email-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-primary, #111827);
  }

  .provider-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #6b7280);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .status-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.active {
    background-color: rgba(22, 163, 74, 0.1);
    color: #16a34a;
  }

  .status-badge.pending {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .status-badge.suspended {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  /* Danger Zone */
  .danger-zone h3 {
    color: #dc2626;
  }

  .danger-zone h3 svg {
    color: #dc2626;
  }

  .danger-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: rgba(220, 38, 38, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .danger-info {
    flex: 1;
  }

  .danger-info strong {
    display: block;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
  }

  .danger-info p {
    font-size: 0.875rem;
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

  .btn-text {
    background: none;
    color: var(--accent, #6366f1);
    padding: 0.25rem 0.5rem;
  }

  .btn-text:hover:not(:disabled) {
    text-decoration: underline;
  }

  .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #b91c1c;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .google-btn {
    gap: 0.75rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 100;
  }

  .modal {
    background-color: var(--bg-primary, #ffffff);
    border-radius: var(--radius-lg, 0.5rem);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .modal-close {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
  }

  .modal-close:hover {
    color: var(--text-primary, #111827);
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-content p {
    margin: 0 0 1rem 0;
    color: var(--text-secondary, #4b5563);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .warning-box {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-md, 0.375rem);
    margin-bottom: 1.5rem;
  }

  .warning-box svg {
    flex-shrink: 0;
    color: #f59e0b;
  }

  .warning-box strong {
    display: block;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
  }

  .warning-box p {
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
  }

  .warning-box ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }

  .warning-box li {
    margin-bottom: 0.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
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

  @media (max-width: 640px) {
    .danger-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .photo-section {
      align-items: center;
    }

    .modal-actions {
      flex-direction: column;
    }

    .modal-actions .btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default AccountSettingsForm;
