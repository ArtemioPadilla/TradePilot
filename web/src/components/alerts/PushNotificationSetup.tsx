/**
 * Push Notification Setup Component
 *
 * Handles requesting push notification permissions and displaying status.
 */

import { useState, useEffect } from 'react';
import type { NotificationPermission } from '../../lib/services/push-notifications';

export interface PushNotificationSetupProps {
  onSetupComplete?: (result: { success: boolean; token?: string }) => void;
  showStatus?: boolean;
}

export function PushNotificationSetup({
  onSetupComplete,
  showStatus = true,
}: PushNotificationSetupProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check support and current permission on mount
    const checkSupport = async () => {
      try {
        const { isNotificationSupported, getNotificationPermission } = await import(
          '../../lib/services/push-notifications'
        );

        const supported = isNotificationSupported();
        setIsSupported(supported);

        if (supported) {
          setPermission(getNotificationPermission());
        }
      } catch (err) {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { initializePushNotifications } = await import(
        '../../lib/services/push-notifications'
      );

      const result = await initializePushNotifications();

      setPermission(result.permission);
      setIsInitialized(result.success);

      if (!result.success && result.error) {
        setError(result.error);
      }

      onSetupComplete?.({
        success: result.success,
        token: result.token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
      onSetupComplete?.({ success: false });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="push-notification-setup" data-testid="push-notification-setup">
        <div className="notification-status not-supported">
          <div className="status-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="status-content">
            <p className="status-title">Push notifications not supported</p>
            <p className="status-description">
              Your browser does not support push notifications. Try using a modern browser like
              Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="push-notification-setup" data-testid="push-notification-setup">
        <div className="notification-status denied">
          <div className="status-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
          <div className="status-content">
            <p className="status-title">Push notifications blocked</p>
            <p className="status-description">
              You have blocked push notifications. To enable them, click the lock icon in your
              browser's address bar and change the notification permission.
            </p>
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  if (permission === 'granted' && isInitialized && showStatus) {
    return (
      <div className="push-notification-setup" data-testid="push-notification-setup">
        <div className="notification-status enabled">
          <div className="status-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="status-content">
            <p className="status-title">Push notifications enabled</p>
            <p className="status-description">
              You will receive push notifications for alerts and important updates.
            </p>
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="push-notification-setup" data-testid="push-notification-setup">
      <div className="notification-prompt">
        <div className="prompt-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="prompt-content">
          <p className="prompt-title">Enable push notifications</p>
          <p className="prompt-description">
            Get instant alerts for price changes, trade executions, and portfolio updates even
            when the app is closed.
          </p>
        </div>
        <button
          className="enable-button"
          onClick={handleEnableNotifications}
          disabled={isLoading}
          data-testid="enable-notifications-button"
        >
          {isLoading ? (
            <span className="loading-spinner" />
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Enable Notifications
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .push-notification-setup {
    margin: 1rem 0;
  }

  .notification-prompt {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .prompt-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--accent-alpha, rgba(99, 102, 241, 0.1));
    border-radius: var(--radius-md, 0.375rem);
    color: var(--accent, #6366f1);
  }

  .prompt-content {
    flex: 1;
  }

  .prompt-title {
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
    font-size: 0.9375rem;
  }

  .prompt-description {
    color: var(--text-muted, #6b7280);
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .enable-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: var(--accent, #6366f1);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
  }

  .enable-button:hover:not(:disabled) {
    background-color: var(--accent-hover, #4f46e5);
  }

  .enable-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .notification-status {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--radius-lg, 0.5rem);
    border: 1px solid var(--border, #e5e7eb);
  }

  .notification-status.enabled {
    background-color: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
  }

  .notification-status.enabled .status-icon {
    color: #22c55e;
  }

  .notification-status.denied {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .notification-status.denied .status-icon {
    color: #ef4444;
  }

  .notification-status.not-supported {
    background-color: rgba(107, 114, 128, 0.1);
    border-color: rgba(107, 114, 128, 0.3);
  }

  .notification-status.not-supported .status-icon {
    color: #6b7280;
  }

  .status-icon {
    flex-shrink: 0;
  }

  .status-content {
    flex: 1;
  }

  .status-title {
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
    font-size: 0.9375rem;
  }

  .status-description {
    color: var(--text-muted, #6b7280);
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .error-message {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md, 0.375rem);
    color: #dc2626;
    font-size: 0.875rem;
  }

  @media (max-width: 640px) {
    .notification-prompt {
      flex-direction: column;
    }

    .enable-button {
      width: 100%;
      justify-content: center;
    }
  }
`;
