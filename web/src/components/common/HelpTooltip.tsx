/**
 * Help Tooltip Component
 *
 * Contextual help tooltips that appear on hover/click.
 * Links to relevant documentation when available.
 */

import { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  docsLink?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

export function HelpTooltip({
  content,
  title,
  docsLink,
  position = 'top',
  children,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.top - tooltip.height - 8;
          break;
        case 'bottom':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.bottom + 8;
          break;
        case 'left':
          x = trigger.left - tooltip.width - 8;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
        case 'right':
          x = trigger.right + 8;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
      }

      // Keep tooltip within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltip.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - tooltip.height - 8));

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleClick = () => setIsVisible(!isVisible);

  return (
    <>
      <button
        ref={triggerRef}
        className="help-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Help"
        data-testid="help-trigger"
      >
        {children || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`help-tooltip help-tooltip-${position}`}
          style={{ left: coords.x, top: coords.y }}
          role="tooltip"
          data-testid="help-tooltip"
        >
          {title && <div className="help-tooltip-title">{title}</div>}
          <div className="help-tooltip-content">{content}</div>
          {docsLink && (
            <a
              href={docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="help-tooltip-link"
            >
              Learn more
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      )}

      <style>{styles}</style>
    </>
  );
}

const styles = `
  .help-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: none;
    border: none;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: color 0.2s;
  }

  .help-trigger:hover {
    color: var(--accent, #6366f1);
  }

  .help-tooltip {
    position: fixed;
    z-index: 1000;
    max-width: 280px;
    padding: 0.75rem 1rem;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    animation: tooltipFadeIn 0.15s ease-out;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .help-tooltip-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin-bottom: 0.375rem;
  }

  .help-tooltip-content {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    line-height: 1.5;
  }

  .help-tooltip-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--accent, #6366f1);
    text-decoration: none;
    transition: color 0.2s;
  }

  .help-tooltip-link:hover {
    color: var(--accent-hover, #4f46e5);
    text-decoration: underline;
  }

  /* Arrow indicators */
  .help-tooltip::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    transform: rotate(45deg);
  }

  .help-tooltip-top::before {
    bottom: -5px;
    left: 50%;
    margin-left: -4px;
    border-top: none;
    border-left: none;
  }

  .help-tooltip-bottom::before {
    top: -5px;
    left: 50%;
    margin-left: -4px;
    border-bottom: none;
    border-right: none;
  }

  .help-tooltip-left::before {
    right: -5px;
    top: 50%;
    margin-top: -4px;
    border-bottom: none;
    border-left: none;
  }

  .help-tooltip-right::before {
    left: -5px;
    top: 50%;
    margin-top: -4px;
    border-top: none;
    border-right: none;
  }
`;

export default HelpTooltip;
