/**
 * Client-side Performance Monitoring with web-vitals
 * Replaces custom PerformanceService
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import { logger } from '../utils/logger'

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

class PerformanceMonitoring {
  private metrics: PerformanceMetric[] = [];
  private analyticsEndpoint = '/api/analytics/vitals';

  initialize() {
    // Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));

    logger.info('Performance monitoring initialized');
  }

  private handleMetric(metric: Metric) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    this.metrics.push(performanceMetric);

    // Send to analytics
    this.sendToAnalytics(performanceMetric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[Performance] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
      });
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return;
    }

    const body = JSON.stringify({
      ...metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability (works even if page is closing)
    navigator.sendBeacon(this.analyticsEndpoint, body);
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const summary: Record<string, any> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
        };
      }
    }

    return summary;
  }

  /**
   * Measure custom timing
   */
  measureTiming(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      if (measure) {
        this.sendToAnalytics({
          name: `custom.${name}`,
          value: measure.duration,
          rating: 'good',
          delta: measure.duration,
          id: `custom-${Date.now()}`,
          navigationType: 'navigate',
        });
      }
    } catch (error) {
      logger.warn('Failed to measure timing:', error);
    }
  }

  /**
   * Mark a performance point
   */
  mark(name: string) {
    try {
      performance.mark(name);
    } catch (error) {
      logger.warn('Failed to mark performance:', error);
    }
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    try {
      performance.clearMarks();
      performance.clearMeasures();
      this.metrics = [];
    } catch (error) {
      logger.warn('Failed to clear performance data:', error);
    }
  }
}

export const performanceMonitoring = new PerformanceMonitoring();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  performanceMonitoring.initialize();
}

export default performanceMonitoring;
