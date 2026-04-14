import { useState, useRef, useEffect } from 'react';
import { appPath } from '../../lib/utils/paths';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="notification-container" ref={menuRef}>
      <button
        className="icon-btn"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? '' : 'unread'}`}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <a href={appPath('/dashboard/alerts')} className="notification-footer">
            View all alerts
          </a>
        </div>
      )}

      <style>{`
        .notification-container {
          position: relative;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background-color: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
        }

        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .notification-header h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.75rem;
          cursor: pointer;
        }

        .mark-read-btn:hover {
          text-decoration: underline;
        }

        .notification-list {
          max-height: 320px;
          overflow-y: auto;
        }

        .notification-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
          gap: 0.75rem;
        }

        .notification-empty p {
          margin: 0;
          font-size: 0.875rem;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background-color: var(--bg-tertiary);
        }

        .notification-item.unread {
          background-color: var(--bg-tertiary);
        }

        .notification-content h4 {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 0.25rem;
        }

        .notification-content p {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0 0 0.5rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .notification-footer {
          display: block;
          padding: 0.75rem;
          text-align: center;
          color: var(--accent);
          font-size: 0.8125rem;
          text-decoration: none;
          border-top: 1px solid var(--border);
        }

        .notification-footer:hover {
          background-color: var(--bg-tertiary);
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: 100vw;
            right: -1rem;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default NotificationBell;
