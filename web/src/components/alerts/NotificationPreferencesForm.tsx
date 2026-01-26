/**
 * NotificationPreferencesForm Component
 *
 * Form for managing notification preferences including channels,
 * quiet hours, and per-type settings.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  NotificationPreferences,
  AlertType,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../types/alerts';

interface NotificationPreferencesFormProps {
  /** Current preferences (optional - will use defaults if not provided) */
  preferences?: NotificationPreferences;
  /** Callback when preferences are saved */
  onSave?: (preferences: NotificationPreferences) => Promise<void>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
}

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  quietHoursStart: undefined,
  quietHoursEnd: undefined,
  emailDigestFrequency: 'daily',
  typePreferences: {},
};

// Alert type labels for display
const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  price_crosses: 'Price Crosses',
  percent_change: 'Percent Change',
  portfolio_value: 'Portfolio Value',
  position_gain: 'Position Gain',
  position_loss: 'Position Loss',
  drawdown: 'Drawdown',
  rebalance_due: 'Rebalance Due',
  trade_executed: 'Trade Executed',
  custom: 'Custom',
};

// Alert types grouped by category
const ALERT_TYPE_GROUPS: { category: string; types: AlertType[] }[] = [
  {
    category: 'Price Alerts',
    types: ['price_above', 'price_below', 'price_crosses', 'percent_change'],
  },
  {
    category: 'Portfolio Alerts',
    types: ['portfolio_value', 'position_gain', 'position_loss', 'drawdown'],
  },
  {
    category: 'Other Alerts',
    types: ['rebalance_due', 'trade_executed', 'custom'],
  },
];

// Time options for quiet hours
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function NotificationPreferencesForm({
  preferences: propPreferences,
  onSave,
  isLoading = false,
  isSaving = false,
}: NotificationPreferencesFormProps) {
  // Merge with defaults to ensure all properties exist
  const preferences = { ...DEFAULT_PREFERENCES, ...propPreferences };

  // Form state
  const [pushEnabled, setPushEnabled] = useState(preferences.pushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(preferences.emailEnabled);
  const [inAppEnabled, setInAppEnabled] = useState(preferences.inAppEnabled);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    !!preferences.quietHoursStart && !!preferences.quietHoursEnd
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    preferences.quietHoursStart || '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    preferences.quietHoursEnd || '08:00'
  );
  const [emailDigestFrequency, setEmailDigestFrequency] = useState(
    preferences.emailDigestFrequency
  );
  const [typePreferences, setTypePreferences] = useState(
    preferences.typePreferences
  );

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update hasChanges when form values change
  useEffect(() => {
    const currentPrefs: NotificationPreferences = {
      pushEnabled,
      emailEnabled,
      inAppEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      emailDigestFrequency,
      typePreferences,
    };

    const changed =
      pushEnabled !== preferences.pushEnabled ||
      emailEnabled !== preferences.emailEnabled ||
      inAppEnabled !== preferences.inAppEnabled ||
      quietHoursEnabled !== (!!preferences.quietHoursStart && !!preferences.quietHoursEnd) ||
      (quietHoursEnabled && quietHoursStart !== preferences.quietHoursStart) ||
      (quietHoursEnabled && quietHoursEnd !== preferences.quietHoursEnd) ||
      emailDigestFrequency !== preferences.emailDigestFrequency ||
      JSON.stringify(typePreferences) !== JSON.stringify(preferences.typePreferences);

    setHasChanges(changed);
  }, [
    pushEnabled,
    emailEnabled,
    inAppEnabled,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    emailDigestFrequency,
    typePreferences,
    preferences,
  ]);

  // Handle type preference toggle
  const toggleTypePreference = useCallback(
    (alertType: AlertType, channel: 'push' | 'email' | 'inApp') => {
      setTypePreferences((prev) => {
        const current = prev[alertType] || { push: true, email: true, inApp: true };
        return {
          ...prev,
          [alertType]: {
            ...current,
            [channel]: !current[channel],
          },
        };
      });
    },
    []
  );

  // Get type preference value
  const getTypePreference = (
    alertType: AlertType,
    channel: 'push' | 'email' | 'inApp'
  ): boolean => {
    return typePreferences[alertType]?.[channel] ?? true;
  };

  // Handle save
  const handleSave = useCallback(async () => {
    const newPreferences: NotificationPreferences = {
      pushEnabled,
      emailEnabled,
      inAppEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      emailDigestFrequency,
      typePreferences,
    };

    if (onSave) {
      await onSave(newPreferences);
    }
    setHasChanges(false);
  }, [
    pushEnabled,
    emailEnabled,
    inAppEnabled,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    emailDigestFrequency,
    typePreferences,
    onSave,
  ]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setPushEnabled(true);
    setEmailEnabled(true);
    setInAppEnabled(true);
    setQuietHoursEnabled(false);
    setQuietHoursStart('22:00');
    setQuietHoursEnd('08:00');
    setEmailDigestFrequency('daily');
    setTypePreferences({});
  }, []);

  if (isLoading) {
    return (
      <div className="notification-preferences" data-testid="preferences-loading">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading notification preferences...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="notification-preferences" data-testid="notification-preferences-form">
      {/* Global Channel Settings */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notification Channels
        </h3>
        <p className="section-description">
          Choose how you want to receive notifications.
        </p>

        <div className="channel-list">
          {/* Push Notifications */}
          <div className="channel-item">
            <div className="channel-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div>
                <label htmlFor="push-toggle">Push Notifications</label>
                <span className="channel-description">Receive alerts on your device</span>
              </div>
            </div>
            <button
              id="push-toggle"
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              className={`toggle ${pushEnabled ? 'on' : ''}`}
              onClick={() => setPushEnabled(!pushEnabled)}
              data-testid="push-enabled-toggle"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="channel-item">
            <div className="channel-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <label htmlFor="email-toggle">Email Notifications</label>
                <span className="channel-description">Receive alerts via email</span>
              </div>
            </div>
            <button
              id="email-toggle"
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              className={`toggle ${emailEnabled ? 'on' : ''}`}
              onClick={() => setEmailEnabled(!emailEnabled)}
              data-testid="email-enabled-toggle"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* In-App Notifications */}
          <div className="channel-item">
            <div className="channel-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <label htmlFor="inapp-toggle">In-App Notifications</label>
                <span className="channel-description">See alerts in the notification center</span>
              </div>
            </div>
            <button
              id="inapp-toggle"
              type="button"
              role="switch"
              aria-checked={inAppEnabled}
              className={`toggle ${inAppEnabled ? 'on' : ''}`}
              onClick={() => setInAppEnabled(!inAppEnabled)}
              data-testid="inapp-enabled-toggle"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Quiet Hours
        </h3>
        <p className="section-description">
          Pause push notifications during specified hours.
        </p>

        <div className="quiet-hours-card">
          <div className="setting-item">
            <div className="setting-info">
              <label htmlFor="quiet-hours-toggle">Enable Quiet Hours</label>
            </div>
            <button
              id="quiet-hours-toggle"
              type="button"
              role="switch"
              aria-checked={quietHoursEnabled}
              className={`toggle ${quietHoursEnabled ? 'on' : ''}`}
              onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              data-testid="quiet-hours-toggle"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {quietHoursEnabled && (
            <div className="time-selectors">
              <div className="time-field">
                <label htmlFor="quiet-start">Start Time</label>
                <select
                  id="quiet-start"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  data-testid="quiet-hours-start"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="time-field">
                <label htmlFor="quiet-end">End Time</label>
                <select
                  id="quiet-end"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  data-testid="quiet-hours-end"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Email Digest */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
          </svg>
          Email Digest
        </h3>
        <p className="section-description">
          Receive a summary of your alerts and activity.
        </p>

        <div className="digest-options">
          {[
            { value: 'none', label: 'None', description: 'No digest emails' },
            { value: 'daily', label: 'Daily', description: 'Every morning' },
            { value: 'weekly', label: 'Weekly', description: 'Every Monday' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setEmailDigestFrequency(option.value as 'none' | 'daily' | 'weekly')
              }
              className={`digest-option ${emailDigestFrequency === option.value ? 'selected' : ''}`}
              data-testid={`digest-${option.value}`}
            >
              <span className="digest-label">{option.label}</span>
              <span className="digest-description">{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Per-Type Preferences */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Alert Type Preferences
        </h3>
        <p className="section-description">
          Customize notifications for each alert type.
        </p>

        <div className="type-groups">
          {ALERT_TYPE_GROUPS.map((group) => (
            <div key={group.category} className="type-group">
              <h4>{group.category}</h4>
              <div className="type-table">
                <div className="type-table-header">
                  <span className="type-col">Alert Type</span>
                  <span className="channel-col">Push</span>
                  <span className="channel-col">Email</span>
                  <span className="channel-col">In-App</span>
                </div>
                {group.types.map((alertType) => (
                  <div key={alertType} className="type-row">
                    <span className="type-col">
                      {ALERT_TYPE_LABELS[alertType]}
                    </span>
                    <span className="channel-col">
                      <input
                        type="checkbox"
                        checked={getTypePreference(alertType, 'push')}
                        onChange={() => toggleTypePreference(alertType, 'push')}
                        disabled={!pushEnabled}
                        aria-label={`${ALERT_TYPE_LABELS[alertType]} push notification`}
                        data-testid={`type-${alertType}-push`}
                      />
                    </span>
                    <span className="channel-col">
                      <input
                        type="checkbox"
                        checked={getTypePreference(alertType, 'email')}
                        onChange={() => toggleTypePreference(alertType, 'email')}
                        disabled={!emailEnabled}
                        aria-label={`${ALERT_TYPE_LABELS[alertType]} email notification`}
                        data-testid={`type-${alertType}-email`}
                      />
                    </span>
                    <span className="channel-col">
                      <input
                        type="checkbox"
                        checked={getTypePreference(alertType, 'inApp')}
                        onChange={() => toggleTypePreference(alertType, 'inApp')}
                        disabled={!inAppEnabled}
                        aria-label={`${ALERT_TYPE_LABELS[alertType]} in-app notification`}
                        data-testid={`type-${alertType}-inapp`}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleReset}
          className="reset-btn"
          data-testid="reset-preferences"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="save-btn"
          data-testid="save-preferences"
        >
          {isSaving ? (
            <>
              <span className="btn-spinner" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .notification-preferences {
    max-width: 700px;
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

  .settings-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .settings-section:last-of-type {
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

  /* Channel List */
  .channel-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .channel-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .channel-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .channel-info svg {
    color: var(--text-muted, #6b7280);
    flex-shrink: 0;
  }

  .channel-info label {
    display: block;
    font-weight: 500;
    color: var(--text-primary, #111827);
    cursor: pointer;
  }

  .channel-description {
    display: block;
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.125rem;
  }

  /* Toggle Switch */
  .toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: var(--border, #e5e7eb);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
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

  /* Quiet Hours */
  .quiet-hours-card {
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
    padding: 1rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting-info label {
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .time-selectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e5e7eb);
  }

  .time-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.5rem;
  }

  .time-field select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    background-color: var(--bg-primary, #ffffff);
    color: var(--text-primary, #111827);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .time-field select:focus {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: -1px;
  }

  /* Digest Options */
  .digest-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .digest-option {
    padding: 1rem;
    background-color: var(--bg-secondary, #f9fafb);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .digest-option:hover {
    border-color: var(--text-muted, #6b7280);
  }

  .digest-option:focus {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
  }

  .digest-option.selected {
    border-color: var(--accent, #6366f1);
    background-color: rgba(99, 102, 241, 0.1);
  }

  .digest-label {
    display: block;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .digest-description {
    display: block;
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.25rem;
  }

  /* Type Preferences Table */
  .type-groups {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .type-group h4 {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6b7280);
    margin: 0 0 0.75rem 0;
  }

  .type-table {
    background-color: var(--bg-secondary, #f9fafb);
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
    overflow: hidden;
  }

  .type-table-header {
    display: grid;
    grid-template-columns: 1fr 60px 60px 60px;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .type-table-header span {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-transform: uppercase;
  }

  .type-row {
    display: grid;
    grid-template-columns: 1fr 60px 60px 60px;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .type-row:last-child {
    border-bottom: none;
  }

  .type-col {
    font-size: 0.875rem;
    color: var(--text-primary, #111827);
    display: flex;
    align-items: center;
  }

  .channel-col {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .channel-col input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
  }

  .channel-col input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #e5e7eb);
    margin-top: 2rem;
  }

  .reset-btn {
    background: none;
    border: none;
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    padding: 0.5rem 0;
  }

  .reset-btn:hover {
    color: var(--text-primary, #111827);
  }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: var(--accent, #6366f1);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .channel-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .channel-info {
      width: 100%;
    }

    .digest-options {
      grid-template-columns: 1fr;
    }

    .type-table-header,
    .type-row {
      grid-template-columns: 1fr 50px 50px 50px;
    }

    .form-actions {
      flex-direction: column;
      gap: 1rem;
    }

    .reset-btn {
      order: 1;
    }

    .save-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default NotificationPreferencesForm;
