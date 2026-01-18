/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 */

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" data-testid="error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened. Please try again.</p>
            {this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button className="retry-button" onClick={this.handleRetry}>
              Try Again
            </button>
          </div>
          <style>{styles}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = `
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-icon {
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .error-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.5rem 0;
  }

  .error-content p {
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  .error-details {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .error-details summary {
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .error-details pre {
    background-color: var(--bg-secondary, #f8f9fa);
    padding: 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.75rem;
    overflow-x: auto;
    color: #dc2626;
    margin: 0;
  }

  .retry-button {
    padding: 0.625rem 1.25rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }
`;

export default ErrorBoundary;
