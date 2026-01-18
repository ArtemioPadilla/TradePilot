/**
 * NotificationCenter Component
 *
 * Displays notifications in a dropdown panel with bell icon badge.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Notification, NotificationSeverity } from '../../types/alerts';

interface NotificationCenterProps {
  /** List of notifications */
  notifications: Notification[];
  /** Unread count (can be passed separately for efficiency) */
  unreadCount?: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when a notification is clicked */
  onNotificationClick?: (notification: Notification) => void;
  /** Callback to mark notification as read */
  onMarkAsRead?: (notificationId: string) => void;
  /** Callback to mark all as read */
  onMarkAllAsRead?: () => void;
  /** Callback to delete a notification */
  onDeleteNotification?: (notificationId: string) => void;
  /** Callback to clear all read notifications */
  onClearRead?: () => void;
}

// Severity colors
const SEVERITY_COLORS: Record<NotificationSeverity, { bg: string; border: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
};

// Severity icons
function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const colorClass = SEVERITY_COLORS[severity].icon;

  switch (severity) {
    case 'success':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'error':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotificationCenter({
  notifications,
  unreadCount,
  isLoading = false,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearRead,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate unread count
  const actualUnreadCount = unreadCount ?? notifications.filter((n) => !n.read).length;

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        onMarkAsRead?.(notification.id);
      }
      onNotificationClick?.(notification);
      if (notification.link) {
        setIsOpen(false);
      }
    },
    [onMarkAsRead, onNotificationClick]
  );

  return (
    <div className="relative" ref={panelRef} data-testid="notification-center">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        data-testid="notification-bell"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {actualUnreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full"
            data-testid="notification-badge"
          >
            {actualUnreadCount > 99 ? '99+' : actualUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
          data-testid="notification-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {actualUnreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="mark-all-read"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[360px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <SeverityIcon severity={notification.severity} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification?.(notification.id);
                            }}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded"
                            aria-label="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              {onClearRead && notifications.some((n) => n.read) && (
                <button
                  onClick={onClearRead}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  data-testid="clear-read"
                >
                  Clear read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
