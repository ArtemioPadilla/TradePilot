/**
 * Offline Indicator Component
 *
 * Shows a banner when the user is offline.
 */

import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner if offline on mount
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}
      role="alert"
      aria-live="polite"
      data-testid="offline-indicator"
    >
      {isOnline ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>You're back online</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span>You're offline. Some features may be unavailable.</span>
        </>
      )}
      <button
        className="dismiss-button"
        onClick={() => setShowBanner(false)}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .offline-indicator {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-lg, 0.5rem);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .offline-indicator.offline {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .offline-indicator.online {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }

  .dismiss-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    margin-left: 0.5rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm, 0.25rem);
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .dismiss-button:hover {
    opacity: 1;
  }

  @media (max-width: 640px) {
    .offline-indicator {
      left: 1rem;
      right: 1rem;
      transform: none;
      justify-content: center;
    }
  }
`;

export default OfflineIndicator;
