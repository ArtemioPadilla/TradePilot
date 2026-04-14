import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $user } from '../../stores/auth';
import { signOut } from '../../lib/firebase';
import { appPath } from '../../lib/utils/paths';

export function UserMenu() {
  const user = useStore($user);
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = user?.displayName?.charAt(0).toUpperCase()
    || user?.email?.charAt(0).toUpperCase()
    || 'U';

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Reset image error when photoURL changes
  useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

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

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = appPath('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-menu-avatar">
          {user?.photoURL && !imageError ? (
            <img
              src={user.photoURL}
              alt={displayName}
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <span className="user-menu-name">{displayName}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div className={`user-menu-dropdown ${isOpen ? 'open' : ''}`}>
        <a href={appPath('/dashboard/settings')} className="user-menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="10" r="3"/>
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
          </svg>
          Profile
        </a>
        <a href={appPath('/dashboard/settings')} className="user-menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Settings
        </a>
        <div className="user-menu-divider"></div>
        <button onClick={handleLogout} className="user-menu-item user-menu-danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          Log out
        </button>
      </div>

      <style>{`
        .user-menu-container {
          position: relative;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          border-radius: var(--radius-md, 8px);
          transition: background-color 0.2s;
        }

        .user-menu-btn:hover {
          background-color: var(--bg-tertiary, rgba(255,255,255,0.1));
        }

        .user-menu-avatar {
          width: 32px;
          height: 32px;
          background-color: var(--accent, #3b82f6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-menu-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-menu-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background-color: var(--bg-elevated, #1a1a2e);
          border: 1px solid var(--border, #333);
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s;
          z-index: 1000;
          overflow: hidden;
        }

        .user-menu-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--text-secondary, #aaa);
          text-decoration: none;
          font-size: 0.875rem;
          transition: all 0.2s;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          text-align: left;
        }

        .user-menu-item:hover {
          background-color: var(--bg-tertiary, rgba(255,255,255,0.1));
          color: var(--text-primary, #fff);
        }

        .user-menu-danger {
          color: var(--negative, #ef4444) !important;
        }

        .user-menu-divider {
          height: 1px;
          background-color: var(--border, #333);
          margin: 0.5rem 0;
        }

        @media (max-width: 1024px) {
          .user-menu-name {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default UserMenu;
