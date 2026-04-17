/**
 * Sentry Error Tracking Integration
 *
 * Provides error tracking, performance monitoring, and session replay.
 * Only initialize in production environments.
 */

// Sentry configuration
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

// Get environment variables
const SENTRY_DSN = import.meta.env?.PUBLIC_SENTRY_DSN ?? '';
const ENVIRONMENT = import.meta.env?.MODE ?? 'development';
const RELEASE = import.meta.env?.PUBLIC_RELEASE_VERSION ?? 'unknown';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if Sentry should be enabled
const shouldEnableSentry = isBrowser && SENTRY_DSN && ENVIRONMENT === 'production';

/**
 * Error context for better debugging
 */
export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Transaction context for performance monitoring
 */
export interface TransactionContext {
  name: string;
  op: string;
  description?: string;
  data?: Record<string, unknown>;
}

// Sentry SDK placeholder (dynamically imported)
let Sentry: typeof import('@sentry/browser') | null = null;

/**
 * Initialize Sentry SDK
 *
 * This should be called as early as possible in your app.
 */
export async function initSentry(): Promise<void> {
  if (!shouldEnableSentry) {
    console.info('Sentry disabled: Not in production or missing DSN');
    return;
  }

  try {
    // Dynamically import Sentry to keep bundle small when not used
    Sentry = await import('@sentry/browser');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: RELEASE,

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Session replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter out common non-actionable errors
      ignoreErrors: [
        // Browser extensions
        /^chrome-extension:/,
        /^moz-extension:/,
        // Network errors
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        // User-cancelled requests
        'AbortError',
        // Third-party scripts
        /^Script error\.?$/,
      ],

      // Don't send errors from development
      beforeSend(event) {
        if (ENVIRONMENT === 'development') {
          return null;
        }
        return event;
      },

      integrations: [
        // Browser tracing for performance
        Sentry.browserTracingIntegration(),
      ],
    });

    console.info('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Capture an exception with optional context
 */
export function captureException(error: Error, context?: ErrorContext): void {
  if (!shouldEnableSentry || !Sentry) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message with optional context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Omit<ErrorContext, 'level'>
): void {
  if (!shouldEnableSentry || !Sentry) {
    console.log(`[${level}] ${message}`, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for all future events
 */
export function setUser(user: ErrorContext['user'] | null): void {
  if (!shouldEnableSentry || !Sentry) return;

  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  if (!shouldEnableSentry || !Sentry) return;

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level,
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(context: TransactionContext): {
  finish: () => void;
  setData: (key: string, value: unknown) => void;
  setStatus: (status: 'ok' | 'error' | 'unknown') => void;
} {
  if (!shouldEnableSentry || !Sentry) {
    return {
      finish: () => {},
      setData: () => {},
      setStatus: () => {},
    };
  }

  const transaction = Sentry.startInactiveSpan({
    name: context.name,
    op: context.op,
    forceTransaction: true,
  });

  return {
    finish: () => transaction?.end(),
    setData: (key: string, value: unknown) => transaction?.setAttribute(key, value as string),
    setStatus: (status: 'ok' | 'error' | 'unknown') => {
      // Status is set automatically in newer Sentry versions
    },
  };
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Omit<ErrorContext, 'user'>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        captureException(error, context);
      }
      throw error;
    }
  };
}

/**
 * React Error Boundary helper
 */
export function captureReactError(
  error: Error,
  componentStack: string,
  context?: ErrorContext
): void {
  captureException(error, {
    ...context,
    extra: {
      ...context?.extra,
      componentStack,
    },
    tags: {
      ...context?.tags,
      errorType: 'react-boundary',
    },
  });
}

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  withErrorTracking,
  captureReactError,
};
