/**
 * Feedback Widget Component
 *
 * Floating button for users to submit feedback about the app.
 */

import { useState } from 'react';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  message: string;
  email?: string;
  page: string;
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackData>({
    type: 'general',
    message: '',
    email: '',
    page: typeof window !== 'undefined' ? window.location.pathname : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission - in production, send to backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Feedback submitted:', formData);

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
      setFormData({
        type: 'general',
        message: '',
        email: '',
        page: typeof window !== 'undefined' ? window.location.pathname : '',
      });
    }, 2000);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        className="feedback-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Send feedback"
        data-testid="feedback-trigger"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="feedback-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="feedback-modal"
            onClick={(e) => e.stopPropagation()}
            data-testid="feedback-modal"
          >
            <div className="feedback-header">
              <h3>Send Feedback</h3>
              <button
                className="close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {isSubmitted ? (
              <div className="feedback-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>Thank you!</h4>
                <p>Your feedback has been submitted.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Feedback Type</label>
                  <div className="type-buttons">
                    {(['bug', 'feature', 'general'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`type-button ${formData.type === type ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type })}
                      >
                        {type === 'bug' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        )}
                        {type === 'feature' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        )}
                        {type === 'general' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                        <span>{type === 'bug' ? 'Bug Report' : type === 'feature' ? 'Feature Request' : 'General'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="feedback-message">Message</label>
                  <textarea
                    id="feedback-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      formData.type === 'bug'
                        ? 'Describe the issue you encountered...'
                        : formData.type === 'feature'
                        ? 'Describe the feature you would like...'
                        : 'Share your thoughts...'
                    }
                    required
                    rows={4}
                    data-testid="feedback-message"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="feedback-email">Email (optional)</label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    data-testid="feedback-email"
                  />
                  <span className="hint">We'll only use this to follow up if needed</span>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting || !formData.message.trim()}
                  data-testid="feedback-submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Send Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </>
  );
}

const styles = `
  .feedback-trigger {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.2s;
    z-index: 50;
  }

  .feedback-trigger:hover {
    background-color: var(--accent-hover, #4f46e5);
    transform: scale(1.05);
  }

  .feedback-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .feedback-modal {
    width: 100%;
    max-width: 400px;
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.5rem);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .feedback-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
  }

  .close-button:hover {
    background-color: var(--bg-secondary, #f8f9fa);
    color: var(--text-primary, #111827);
  }

  .feedback-modal form {
    padding: 1.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #111827);
  }

  .type-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .type-button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-button:hover {
    border-color: var(--accent, #6366f1);
    color: var(--accent, #6366f1);
  }

  .type-button.active {
    background-color: rgba(99, 102, 241, 0.1);
    border-color: var(--accent, #6366f1);
    color: var(--accent, #6366f1);
  }

  .form-group textarea,
  .form-group input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    resize: vertical;
  }

  .form-group textarea:focus,
  .form-group input:focus {
    outline: none;
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  .hint {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.25rem;
  }

  .submit-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-button:hover:not(:disabled) {
    background-color: var(--accent-hover, #4f46e5);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
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

  .feedback-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 2rem;
    text-align: center;
    color: #16a34a;
  }

  .feedback-success h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: var(--text-primary, #111827);
  }

  .feedback-success p {
    margin: 0;
    color: var(--text-muted, #6b7280);
  }

  @media (max-width: 480px) {
    .feedback-trigger {
      bottom: 1rem;
      right: 1rem;
    }

    .type-buttons {
      flex-direction: column;
    }

    .type-button {
      flex-direction: row;
      justify-content: center;
    }
  }
`;

export default FeedbackWidget;
