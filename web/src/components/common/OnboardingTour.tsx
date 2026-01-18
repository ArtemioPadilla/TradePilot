/**
 * Onboarding Tour Component
 *
 * Step-by-step guided tour for new users to discover features.
 * Highlights elements and provides contextual information.
 */

import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string;
}

export function OnboardingTour({
  steps,
  onComplete,
  onSkip,
  storageKey = 'tradepilot-tour-completed',
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Check if tour was already completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        // Delay start to allow page to render
        const timer = setTimeout(() => setIsActive(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey]);

  // Find and highlight the current target element
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position
      const position = step.position || 'bottom';
      let x = rect.left + rect.width / 2;
      let y = rect.bottom + 16;

      switch (position) {
        case 'top':
          y = rect.top - 16;
          break;
        case 'left':
          x = rect.left - 16;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 16;
          y = rect.top + rect.height / 2;
          break;
      }

      setTooltipPosition({ x, y });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStep, steps]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tour complete
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
      setIsActive(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, storageKey, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    setIsActive(false);
    onSkip?.();
  }, [storageKey, onSkip]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handlePrev, handleSkip]);

  if (!isActive || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const position = step.position || 'bottom';

  return (
    <>
      {/* Overlay */}
      <div className="tour-overlay" data-testid="tour-overlay">
        {/* Highlight cutout */}
        {targetRect && (
          <div
            className="tour-highlight"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className={`tour-tooltip tour-tooltip-${position}`}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform:
            position === 'top'
              ? 'translate(-50%, -100%)'
              : position === 'bottom'
              ? 'translate(-50%, 0)'
              : position === 'left'
              ? 'translate(-100%, -50%)'
              : 'translate(0, -50%)',
        }}
        role="dialog"
        aria-modal="true"
        data-testid="tour-tooltip"
      >
        <div className="tour-header">
          <span className="tour-step-indicator">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button className="tour-close" onClick={handleSkip} aria-label="Skip tour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-content">{step.content}</p>

        <div className="tour-footer">
          <div className="tour-dots">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`tour-dot ${index === currentStep ? 'active' : ''} ${
                  index < currentStep ? 'completed' : ''
                }`}
              />
            ))}
          </div>

          <div className="tour-buttons">
            {currentStep > 0 && (
              <button className="tour-btn tour-btn-secondary" onClick={handlePrev}>
                Back
              </button>
            )}
            <button className="tour-btn tour-btn-primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{styles}</style>
    </>
  );
}

// Predefined tour steps for the dashboard
export const dashboardTourSteps: TourStep[] = [
  {
    target: '.portfolio-summary, [data-testid="portfolio-summary"]',
    title: 'Portfolio Overview',
    content: 'See your total portfolio value, daily changes, and overall performance at a glance.',
    position: 'bottom',
  },
  {
    target: '.nav-item[href*="accounts"], [data-testid="nav-accounts"]',
    title: 'Manage Accounts',
    content: 'Add and manage your brokerage accounts. Connect to Alpaca for live trading.',
    position: 'right',
  },
  {
    target: '.nav-item[href*="strategies"], [data-testid="nav-strategies"]',
    title: 'Trading Strategies',
    content: 'Create, test, and deploy automated trading strategies.',
    position: 'right',
  },
  {
    target: '.nav-item[href*="backtest"], [data-testid="nav-backtest"]',
    title: 'Backtesting',
    content: 'Test your strategies against historical data before risking real money.',
    position: 'right',
  },
  {
    target: '.nav-item[href*="alerts"], [data-testid="nav-alerts"]',
    title: 'Price Alerts',
    content: 'Set up alerts to notify you when stocks reach target prices.',
    position: 'right',
  },
  {
    target: '.dark-mode-toggle, [data-testid="dark-mode-toggle"]',
    title: 'Dark Mode',
    content: 'Toggle between light and dark themes for comfortable viewing.',
    position: 'bottom',
  },
];

const styles = `
  .tour-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    pointer-events: none;
  }

  .tour-highlight {
    position: absolute;
    border-radius: var(--radius-md, 0.375rem);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
    animation: tourPulse 2s ease-in-out infinite;
  }

  @keyframes tourPulse {
    0%, 100% {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(99, 102, 241, 0.5);
    }
    50% {
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 8px rgba(99, 102, 241, 0.3);
    }
  }

  .tour-tooltip {
    position: fixed;
    z-index: 9999;
    width: 320px;
    max-width: calc(100vw - 32px);
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.5rem);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: tourFadeIn 0.3s ease-out;
    pointer-events: auto;
  }

  @keyframes tourFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .tour-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .tour-step-indicator {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--accent, #6366f1);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tour-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tour-close:hover {
    background-color: var(--bg-secondary, #f8f9fa);
    color: var(--text-primary, #111827);
  }

  .tour-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
    padding: 1rem 1rem 0.5rem;
  }

  .tour-content {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    line-height: 1.6;
    margin: 0;
    padding: 0 1rem;
  }

  .tour-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-top: 1px solid var(--border, #e5e7eb);
    margin-top: 1rem;
  }

  .tour-dots {
    display: flex;
    gap: 0.375rem;
  }

  .tour-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--bg-tertiary, #e5e7eb);
    transition: all 0.2s;
  }

  .tour-dot.active {
    background-color: var(--accent, #6366f1);
    transform: scale(1.25);
  }

  .tour-dot.completed {
    background-color: var(--accent, #6366f1);
    opacity: 0.5;
  }

  .tour-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .tour-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-md, 0.375rem);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tour-btn-primary {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .tour-btn-primary:hover {
    background-color: var(--accent-hover, #4f46e5);
  }

  .tour-btn-secondary {
    background-color: transparent;
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .tour-btn-secondary:hover {
    background-color: var(--bg-secondary, #f8f9fa);
  }

  @media (max-width: 480px) {
    .tour-tooltip {
      width: calc(100vw - 32px);
      left: 16px !important;
      transform: none !important;
    }

    .tour-tooltip-top,
    .tour-tooltip-bottom {
      top: auto !important;
      bottom: 16px !important;
    }
  }
`;

export default OnboardingTour;
