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
  /** Current preferences */
  preferences: NotificationPreferences;
  /** Callback when preferences are saved */
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
}

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
  preferences,
  onSave,
  isLoading = false,
  isSaving = false,
}: NotificationPreferencesFormProps) {
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

    await onSave(newPreferences);
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
      <div className="flex items-center justify-center py-12" data-testid="preferences-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="notification-preferences-form" data-testid="notification-preferences-form">
      {/* Global Channel Settings */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notification Channels
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how you want to receive notifications.
        </p>

        <div className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-500">
                  Receive alerts on your device
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="push-enabled-toggle"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">
                  Receive alerts via email
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="email-enabled-toggle"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <div className="font-medium">In-App Notifications</div>
                <div className="text-sm text-gray-500">
                  See alerts in the notification center
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="inapp-enabled-toggle"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quiet Hours
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Pause push notifications during specified hours.
        </p>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">Enable Quiet Hours</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="quiet-hours-toggle"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="quiet-hours-start"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <select
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Email Digest
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Receive a summary of your alerts and activity.
        </p>

        <div className="grid grid-cols-3 gap-3">
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
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                emailDigestFrequency === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`digest-${option.value}`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Per-Type Preferences */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Alert Type Preferences
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Customize notifications for each alert type.
        </p>

        <div className="space-y-6">
          {ALERT_TYPE_GROUPS.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {group.category}
              </h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Alert Type
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Push
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        In-App
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.types.map((alertType) => (
                      <tr key={alertType} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-sm">
                          {ALERT_TYPE_LABELS[alertType]}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={getTypePreference(alertType, 'push')}
                            onChange={() => toggleTypePreference(alertType, 'push')}
                            disabled={!pushEnabled}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            data-testid={`type-${alertType}-push`}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={getTypePreference(alertType, 'email')}
                            onChange={() => toggleTypePreference(alertType, 'email')}
                            disabled={!emailEnabled}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            data-testid={`type-${alertType}-email`}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={getTypePreference(alertType, 'inApp')}
                            onChange={() => toggleTypePreference(alertType, 'inApp')}
                            disabled={!inAppEnabled}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            data-testid={`type-${alertType}-inapp`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700"
          data-testid="reset-preferences"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="save-preferences"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

export default NotificationPreferencesForm;
