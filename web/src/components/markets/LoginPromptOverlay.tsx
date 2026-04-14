import { appPath } from '../../lib/utils/paths';
/**
 * LoginPromptOverlay Component
 *
 * Overlay shown to unauthenticated users prompting them to log in.
 */

import { LogIn, Star, TrendingUp, Bell } from 'lucide-react';

interface LoginPromptOverlayProps {
  title?: string;
  description?: string;
  features?: string[];
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function LoginPromptOverlay({
  title = 'Sign in to unlock personalized features',
  description = 'Create an account to access your personal trading tools',
  features = [
    'Track your favorite assets',
    'Create price alerts',
    'Connect your strategies',
    'View your portfolio',
  ],
  onLogin,
  onRegister,
}: LoginPromptOverlayProps) {
  return (
    <div className="login-prompt-overlay">
      <div className="prompt-content">
        <div className="prompt-icons">
          <div className="icon-circle">
            <Star size={20} />
          </div>
          <div className="icon-circle">
            <TrendingUp size={20} />
          </div>
          <div className="icon-circle">
            <Bell size={20} />
          </div>
        </div>

        <h3>{title}</h3>
        <p className="description">{description}</p>

        <ul className="features-list">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>

        <div className="prompt-actions">
          <a
            href={appPath("/auth/login")}
            className="btn-primary"
            onClick={e => {
              if (onLogin) {
                e.preventDefault();
                onLogin();
              }
            }}
          >
            <LogIn size={16} />
            Sign In
          </a>
          <a
            href={appPath("/auth/register")}
            className="btn-secondary"
            onClick={e => {
              if (onRegister) {
                e.preventDefault();
                onRegister();
              }
            }}
          >
            Create Account
          </a>
        </div>
      </div>

      <style>{`
        .login-prompt-overlay {
          position: relative;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 2.5rem 2rem;
          text-align: center;
          overflow: hidden;
        }

        .login-prompt-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(var(--accent-rgb), 0.05) 0%,
            transparent 50%,
            rgba(var(--accent-rgb), 0.05) 100%
          );
          pointer-events: none;
        }

        .prompt-content {
          position: relative;
          z-index: 1;
          max-width: 360px;
          margin: 0 auto;
        }

        .prompt-icons {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .icon-circle {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-tertiary);
          border-radius: 50%;
          color: var(--accent);
          border: 1px solid var(--border);
        }

        .prompt-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .description {
          margin: 0 0 1.25rem 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
          text-align: left;
        }

        .features-list li {
          position: relative;
          padding: 0.5rem 0 0.5rem 1.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .features-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--positive);
          font-weight: bold;
        }

        .prompt-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: white;
          background-color: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover {
          filter: brightness(1.1);
        }

        .btn-secondary {
          padding: 0.75rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .login-prompt-overlay {
            padding: 2rem 1.5rem;
          }

          .prompt-icons {
            gap: 0.5rem;
          }

          .icon-circle {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
