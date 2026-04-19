/**
 * Client-side Performance Monitoring
 * Uses web-vitals for Core Web Vitals collection and reporting
 *
 * @see https://web.dev/vitals/
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

type MetricRating = 'good' | 'needs-improvement' | 'poor';
type NavigationType = 'navigate' | 'reload' | 'back-forward' | 'prerender' | string;

interface PerformanceMetric {
  name: string;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: NavigationType;
  url: string;
  timestamp: number;
}

interface MetricSummary {
  name: string;
  value: number;
  rating: MetricRating;
  lastUpdated: number;
}

interface CustomTimingThresholds {
  good: number;       // ms — at or below this is 'good'
  needsImprovement: number; // ms — at or below this is 'needs-improvement'; above is 'poor'
}

const DEFAULT_CUSTOM_THRESHOLDS: CustomTimingThresholds = {
  good: 100,
  needsImprovement: 300,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rateCustomTiming(
  duration: number,
  thresholds: CustomTimingThresholds,
): MetricRating {
  if (duration <= thresholds.good) return 'good';
  if (duration <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

// ─── Class ────────────────────────────────────────────────────────────────────

class PerformanceMonitoring {
  /** Latest snapshot per metric name (keyed by metric.name) */
  private readonly metricMap = new Map<string, PerformanceMetric>();

  /** Full chronological event log */
  private readonly metricLog: PerformanceMetric[] = [];

  private readonly analyticsEndpoint: string;
  private initialized = false;

  constructor(analyticsEndpoint = '/api/analytics/vitals') {
    this.analyticsEndpoint = analyticsEndpoint;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  initialize(): void {
    if (this.initialized || !isBrowser()) return;
    this.initialized = true;

    /**
     * NOTE: onFID was removed in web-vitals v4 — INP is its successor.
     * Register only the stable, current set:
     *   CLS  — Cumulative Layout Shift
     *   INP  — Interaction to Next Paint  (replaces FID)
     *   LCP  — Largest Contentful Paint
     *   FCP  — First Contentful Paint
     *   TTFB — Time to First Byte
     */
    onCLS(this.handleMetric);
    onINP(this.handleMetric);
    onLCP(this.handleMetric);
    onFCP(this.handleMetric);
    onTTFB(this.handleMetric);

    logger.info('[Performance] Monitoring initialized');
  }

  // ── Core metric handler ────────────────────────────────────────────────────

  private readonly handleMetric = (metric: Metric): void => {
    const entry: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      // `navigationType` is present in web-vitals v3+; guard for older builds
      navigationType: (metric as Metric & { navigationType?: string }).navigationType ?? 'navigate',
      url: window.location.href,
      timestamp: Date.now(),
    };

    // Keep the latest snapshot per metric name (web-vitals may fire multiple times, e.g. CLS)
    this.metricMap.set(entry.name, entry);
    this.metricLog.push(entry);

    this.sendToAnalytics(entry);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[Performance] ${entry.name}`, {
        value: entry.value,
        rating: entry.rating,
        delta: entry.delta,
      });
    }
  };

  // ── Analytics transport ────────────────────────────────────────────────────

  private sendToAnalytics(metric: PerformanceMetric): void {
    if (!isBrowser() || !navigator.sendBeacon) return;

    try {
      const payload = JSON.stringify(metric);
      const queued = navigator.sendBeacon(this.analyticsEndpoint, payload);

      if (!queued && process.env.NODE_ENV === 'development') {
        logger.warn('[Performance] sendBeacon queue full — metric may be lost', metric.name);
      }
    } catch (error) {
      logger.warn('[Performance] Failed to send metric', error);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns the latest snapshot for every collected metric.
   * Because web-vitals can fire multiple updates (CLS in particular),
   * this always reflects the most recent value rather than the first.
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metricMap.values());
  }

  /**
   * Returns the full chronological event log, including intermediate updates.
   */
  getMetricLog(): readonly PerformanceMetric[] {
    return this.metricLog;
  }

  /**
   * Returns a keyed summary of the latest value for each metric.
   */
  getSummary(): Record<string, MetricSummary> {
    const summary: Record<string, MetricSummary> = {};

    for (const [name, metric] of this.metricMap) {
      summary[name] = {
        name,
        value: metric.value,
        rating: metric.rating,
        lastUpdated: metric.timestamp,
      };
    }

    return summary;
  }

  // ── Custom timing ──────────────────────────────────────────────────────────

  /**
   * Places a named mark in the Performance Timeline.
   * Call this before the operation you want to time.
   *
   * @example performanceMonitoring.mark('my-feature:start');
   */
  mark(name: string): void {
    try {
      performance.mark(name);
    } catch (error) {
      logger.warn('[Performance] Failed to set mark', error);
    }
  }

  /**
   * Measures the duration between two previously set marks and reports
   * the result as a custom metric.
   *
   * @param name     - Descriptive label (prefixed with `custom.` in the payload)
   * @param start    - Name of the start mark
   * @param end      - Name of the end mark
   * @param thresholds - Optional rating thresholds in milliseconds
   *
   * @example
   *   performanceMonitoring.mark('checkout:start');
   *   await processCheckout();
   *   performanceMonitoring.mark('checkout:end');
   *   performanceMonitoring.measureTiming('checkout', 'checkout:start', 'checkout:end');
   */
  measureTiming(
    name: string,
    start: string,
    end: string,
    thresholds: CustomTimingThresholds = DEFAULT_CUSTOM_THRESHOLDS,
  ): void {
    try {
      performance.measure(name, start, end);
      const [entry] = performance.getEntriesByName(name, 'measure');

      if (!entry) return;

      const duration = entry.duration;

      this.sendToAnalytics({
        name: `custom.${name}`,
        value: duration,
        rating: rateCustomTiming(duration, thresholds),
        delta: duration,
        id: `custom-${name}-${Date.now()}`,
        navigationType: 'navigate',
        url: window.location.href,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.warn('[Performance] Failed to measure timing', error);
    }
  }

  /**
   * Clears all browser performance marks/measures and resets collected metrics.
   * Useful between route navigations in SPAs.
   */
  clear(): void {
    try {
      performance.clearMarks();
      performance.clearMeasures();
      this.metricMap.clear();
      this.metricLog.length = 0;
    } catch (error) {
      logger.warn('[Performance] Failed to clear performance data', error);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const performanceMonitoring = new PerformanceMonitoring();

if (isBrowser()) {
  performanceMonitoring.initialize();
}

export default performanceMonitoring;