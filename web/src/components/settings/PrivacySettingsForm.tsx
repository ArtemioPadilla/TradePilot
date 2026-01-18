/**
 * Privacy Settings Form Component
 *
 * Manages user privacy settings for leaderboard, profile, and strategy sharing.
 */

import { useState, useEffect } from 'react';
import type { PrivacySettings } from '../../types/leaderboard';
import { getPrivacySettings, updatePrivacySettings } from '../../lib/services/leaderboard';

export function PrivacySettingsForm() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getPrivacySettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load privacy settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings) => {
    if (!settings) return;

    const newValue = !settings[key];
    const previousSettings = { ...settings };

    // Optimistic update
    setSettings({ ...settings, [key]: newValue });
    setSuccessMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      await updatePrivacySettings({ [key]: newValue });
      setSuccessMessage('Settings saved');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings);
      setError('Failed to save setting');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="privacy-settings" data-testid="privacy-settings">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading privacy settings...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="privacy-settings" data-testid="privacy-settings">
        <div className="error-state">
          <p>{error || 'Unable to load settings'}</p>
          <button onClick={loadSettings}>Retry</button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="privacy-settings" data-testid="privacy-settings">
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

      {/* Leaderboard Settings */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Leaderboard
        </h3>
        <p className="section-description">Control how your performance appears on the public leaderboard</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="leaderboard-opt-in">Participate in leaderboard</label>
            <span className="setting-description">Your ranking will be visible to other traders</span>
          </div>
          <button
            id="leaderboard-opt-in"
            type="button"
            role="switch"
            aria-checked={settings.leaderboardOptIn}
            className={`toggle ${settings.leaderboardOptIn ? 'on' : ''}`}
            onClick={() => handleToggle('leaderboardOptIn')}
            disabled={isSaving}
            data-testid="toggle-leaderboard-opt-in"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="leaderboard-anonymous">Appear as anonymous</label>
            <span className="setting-description">Hide your display name on the leaderboard</span>
          </div>
          <button
            id="leaderboard-anonymous"
            type="button"
            role="switch"
            aria-checked={settings.leaderboardAnonymous}
            className={`toggle ${settings.leaderboardAnonymous ? 'on' : ''}`}
            onClick={() => handleToggle('leaderboardAnonymous')}
            disabled={isSaving || !settings.leaderboardOptIn}
            data-testid="toggle-leaderboard-anonymous"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Profile Settings */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile Visibility
        </h3>
        <p className="section-description">Control what other users can see on your profile</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="show-profile">Public profile</label>
            <span className="setting-description">Allow other users to view your profile page</span>
          </div>
          <button
            id="show-profile"
            type="button"
            role="switch"
            aria-checked={settings.showProfile}
            className={`toggle ${settings.showProfile ? 'on' : ''}`}
            onClick={() => handleToggle('showProfile')}
            disabled={isSaving}
            data-testid="toggle-show-profile"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="show-performance">Show performance metrics</label>
            <span className="setting-description">Display your trading performance on your profile</span>
          </div>
          <button
            id="show-performance"
            type="button"
            role="switch"
            aria-checked={settings.showPerformance}
            className={`toggle ${settings.showPerformance ? 'on' : ''}`}
            onClick={() => handleToggle('showPerformance')}
            disabled={isSaving || !settings.showProfile}
            data-testid="toggle-show-performance"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="show-strategies">Show strategies</label>
            <span className="setting-description">Display your public strategies on your profile</span>
          </div>
          <button
            id="show-strategies"
            type="button"
            role="switch"
            aria-checked={settings.showStrategies}
            className={`toggle ${settings.showStrategies ? 'on' : ''}`}
            onClick={() => handleToggle('showStrategies')}
            disabled={isSaving || !settings.showProfile}
            data-testid="toggle-show-strategies"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Strategy Defaults */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Strategy Sharing Defaults
        </h3>
        <p className="section-description">Default settings for new strategies you create</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="default-public">Public by default</label>
            <span className="setting-description">New strategies will be public unless changed</span>
          </div>
          <button
            id="default-public"
            type="button"
            role="switch"
            aria-checked={settings.defaultStrategyPublic}
            className={`toggle ${settings.defaultStrategyPublic ? 'on' : ''}`}
            onClick={() => handleToggle('defaultStrategyPublic')}
            disabled={isSaving}
            data-testid="toggle-default-public"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="default-author-visible">Show author by default</label>
            <span className="setting-description">Your name will appear on public strategies</span>
          </div>
          <button
            id="default-author-visible"
            type="button"
            role="switch"
            aria-checked={settings.defaultAuthorVisible}
            className={`toggle ${settings.defaultAuthorVisible ? 'on' : ''}`}
            onClick={() => handleToggle('defaultAuthorVisible')}
            disabled={isSaving}
            data-testid="toggle-default-author"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="default-allow-copy">Allow copying by default</label>
            <span className="setting-description">Others can copy your public strategies</span>
          </div>
          <button
            id="default-allow-copy"
            type="button"
            role="switch"
            aria-checked={settings.defaultAllowCopy}
            className={`toggle ${settings.defaultAllowCopy ? 'on' : ''}`}
            onClick={() => handleToggle('defaultAllowCopy')}
            disabled={isSaving}
            data-testid="toggle-default-copy"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .privacy-settings {
    max-width: 600px;
  }

  .loading-state,
  .error-state {
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

  .error-state button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    cursor: pointer;
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

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-info {
    flex: 1;
    margin-right: 1rem;
  }

  .setting-info label {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    cursor: pointer;
  }

  .setting-description {
    display: block;
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.125rem;
  }

  .toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: var(--border, #e5e7eb);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .toggle:focus {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
  }

  .toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle.on {
    background-color: var(--accent, #6366f1);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  }

  .toggle.on .toggle-thumb {
    transform: translateX(20px);
  }

  @media (max-width: 640px) {
    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .setting-info {
      margin-right: 0;
    }
  }
`;

export default PrivacySettingsForm;
