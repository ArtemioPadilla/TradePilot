/**
 * Performance Monitoring
 *
 * Tracks Core Web Vitals and other performance metrics.
 * Reports to analytics when degradation is detected.
 */

import { logger } from './services/logger';

// Core Web Vitals thresholds (based on Google's recommendations)
const CWV_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
};

type MetricName = keyof typeof CWV_THRESHOLDS;

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceObserver {
  onMetric?: (metric: PerformanceMetric) => void;
  onDegradation?: (metric: PerformanceMetric) => void;
}

// Store for collected metrics
const metrics: Map<string, PerformanceMetric[]> = new Map();

// Observers for metric updates
const observers: PerformanceObserver[] = [];

/**
 * Rate a metric value against thresholds
 */
function rateMetric(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = CWV_THRESHOLDS[name];

  if (value <= thresholds.good) {
    return 'good';
  }

  if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  }

  return 'poor';
}

/**
 * Record a performance metric
 */
function recordMetric(name: string, value: number): void {
  const metricName = name as MetricName;
  const rating = CWV_THRESHOLDS[metricName]
    ? rateMetric(metricName, value)
    : 'good';

  const metric: PerformanceMetric = {
    name,
    value,
    rating,
    timestamp: Date.now(),
  };

  // Store metric
  if (!metrics.has(name)) {
    metrics.set(name, []);
  }
  metrics.get(name)!.push(metric);

  // Limit stored metrics
  const storedMetrics = metrics.get(name)!;
  if (storedMetrics.length > 100) {
    storedMetrics.shift();
  }

  // Notify observers
  for (const observer of observers) {
    observer.onMetric?.(metric);

    if (rating === 'poor') {
      observer.onDegradation?.(metric);
    }
  }

  // Log poor metrics
  if (rating === 'poor') {
    logger.warn(`Performance degradation detected: ${name}`, {
      value,
      rating,
      threshold: CWV_THRESHOLDS[metricName]?.needsImprovement,
    });
  }
}

/**
 * Initialize Core Web Vitals tracking
 */
export async function initPerformanceMonitoring(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Dynamically import web-vitals
    const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');

    onCLS((metric) => recordMetric('CLS', metric.value));
    onFID((metric) => recordMetric('FID', metric.value));
    onLCP((metric) => recordMetric('LCP', metric.value));
    onFCP((metric) => recordMetric('FCP', metric.value));
    onTTFB((metric) => recordMetric('TTFB', metric.value));
    onINP((metric) => recordMetric('INP', metric.value));

    logger.info('Performance monitoring initialized');
  } catch (error) {
    logger.warn('Failed to initialize web-vitals', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Add a performance observer
 */
export function addPerformanceObserver(observer: PerformanceObserver): () => void {
  observers.push(observer);

  return () => {
    const index = observers.indexOf(observer);
    if (index > -1) {
      observers.splice(index, 1);
    }
  };
}

/**
 * Get current metrics summary
 */
export function getMetricsSummary(): Record<string, {
  latest: number;
  average: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}> {
  const summary: Record<string, {
    latest: number;
    average: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }> = {};

  for (const [name, values] of metrics.entries()) {
    if (values.length === 0) continue;

    const latest = values[values.length - 1];
    const average = values.reduce((sum, m) => sum + m.value, 0) / values.length;

    summary[name] = {
      latest: latest.value,
      average,
      rating: latest.rating,
    };
  }

  return summary;
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (typeof performance === 'undefined') return;

  try {
    performance.mark(name);
  } catch (error) {
    // Ignore errors in non-browser environments
  }
}

/**
 * Measure time between two marks
 */
export function measure(name: string, startMark: string, endMark?: string): number | null {
  if (typeof performance === 'undefined') return null;

  try {
    const measureName = `measure-${name}`;

    if (endMark) {
      performance.measure(measureName, startMark, endMark);
    } else {
      performance.measure(measureName, startMark);
    }

    const entries = performance.getEntriesByName(measureName);
    const entry = entries[entries.length - 1];

    if (entry) {
      recordMetric(name, entry.duration);
      return entry.duration;
    }
  } catch (error) {
    // Ignore errors in non-browser environments
  }

  return null;
}

/**
 * Time an async operation
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  mark(startMark);

  try {
    const result = await fn();
    mark(endMark);
    measure(name, startMark, endMark);
    return result;
  } catch (error) {
    mark(endMark);
    measure(name, startMark, endMark);
    throw error;
  }
}

/**
 * Time a sync operation
 */
export function timeSync<T>(name: string, fn: () => T): T {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  mark(startMark);

  try {
    const result = fn();
    mark(endMark);
    measure(name, startMark, endMark);
    return result;
  } catch (error) {
    mark(endMark);
    measure(name, startMark, endMark);
    throw error;
  }
}

/**
 * Report metrics to analytics
 */
export function reportToAnalytics(endpoint?: string): void {
  const summary = getMetricsSummary();

  if (Object.keys(summary).length === 0) return;

  const url = endpoint || '/api/analytics/performance';

  // Use sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify(summary));
  } else {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(summary),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Ignore errors - best effort reporting
    });
  }
}

/**
 * Clear stored metrics
 */
export function clearMetrics(): void {
  metrics.clear();
}

export default {
  init: initPerformanceMonitoring,
  addObserver: addPerformanceObserver,
  getSummary: getMetricsSummary,
  mark,
  measure,
  timeAsync,
  timeSync,
  reportToAnalytics,
  clearMetrics,
};
