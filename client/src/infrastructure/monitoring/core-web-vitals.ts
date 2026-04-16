/**
 * Core Web Vitals tracking with real-time performance metrics
 * Implements comprehensive tracking for LCP, FID, CLS, FCP, and TTFB
 */

export interface CoreWebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional Performance Metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint (new metric)
  
  // Metadata
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  deviceMemory: number | null;
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

// Performance thresholds based on Core Web Vitals standards
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

class CoreWebVitalsTracker {
  private metrics: Partial<CoreWebVitalsMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private callbacks: Array<(metrics: CoreWebVitalsMetrics) => void> = [];
  private thresholds: PerformanceThresholds;
  private isTracking = false;

  constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
    };
  }

  private getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private getDeviceMemory(): number | null {
    if (typeof navigator === 'undefined') return null;
    return (navigator as any).deviceMemory || null;
  }

  public startTracking(): void {
    if (this.isTracking || typeof window === 'undefined') return;
    
    this.isTracking = true;
    this.trackTTFB();
    this.trackFCP();
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackINP();
  }

  public stopTracking(): void {
    this.isTracking = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private trackTTFB(): void {
    // Track Time to First Byte using Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        this.updateMetric('ttfb', entry.responseStart - entry.requestStart);
      }
    }
  }

  private trackFCP(): void {
    this.observePerformanceEntries('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('fcp', entry.startTime);
        }
      });
    });
  }

  private trackLCP(): void {
    this.observePerformanceEntries('largest-contentful-paint', (entries) => {
      entries.forEach((entry: any) => {
        this.updateMetric('lcp', entry.startTime);
      });
    });
  }

  private trackFID(): void {
    this.observePerformanceEntries('first-input', (entries) => {
      entries.forEach((entry: any) => {
        this.updateMetric('fid', entry.processingStart - entry.startTime);
      });
    });
  }

  private trackCLS(): void {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    this.observePerformanceEntries('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        // Only count layout shifts without recent input
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          // If the entry occurred less than 1 second after the previous entry and
          // less than 5 seconds after the first entry in the session, include it
          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          // If the current session value is larger than the current CLS value,
          // update CLS and the entries contributing to it.
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.updateMetric('cls', clsValue);
          }
        }
      });
    });
  }

  private trackINP(): void {
    // Track Interaction to Next Paint (experimental)
    if ('PerformanceEventTiming' in window) {
      this.observePerformanceEntries('event', (entries) => {
        entries.forEach((entry: any) => {
          if (entry.interactionId) {
            const inp = entry.processingEnd - entry.startTime;
            this.updateMetric('inp', inp);
          }
        });
      });
    }
  }

  private observePerformanceEntries(
    entryType: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type: entryType, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType} entries:`, error);
    }
  }

  private updateMetric(key: keyof CoreWebVitalsMetrics, value: number): void {
    this.metrics[key] = value as any;
    this.metrics.timestamp = Date.now();
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics as CoreWebVitalsMetrics);
      } catch (error) {
        console.error('Error in Core Web Vitals callback:', error);
      }
    });

    // Send to analytics
    this.sendToAnalytics(key, value);
  }

  private sendToAnalytics(metric: string, value: number): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Send to analytics service
    fetch('/api/analytics/core-web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric,
        value,
        rating: this.getMetricRating(metric as keyof PerformanceThresholds, value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
      }),
    }).catch(error => {
      console.warn('Failed to send Core Web Vitals to analytics:', error);
    });
  }

  public getMetricRating(metric: keyof PerformanceThresholds, value: number): MetricRating {
    const threshold = this.thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  public getMetrics(): Partial<CoreWebVitalsMetrics> {
    return { ...this.metrics };
  }

  public getMetricsWithRatings(): Record<string, { value: number | null; rating: MetricRating }> {
    const metrics = this.getMetrics();
    const result: Record<string, { value: number | null; rating: MetricRating }> = {};

    (['lcp', 'fid', 'cls', 'fcp', 'ttfb'] as const).forEach(key => {
      const value = metrics[key] ?? null;
      result[key] = {
        value,
        rating: value !== null ? this.getMetricRating(key, value) : 'good',
      };
    });

    return result;
  }

  public onMetricsUpdate(callback: (metrics: CoreWebVitalsMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public generateReport(): {
    summary: Record<string, { value: number | null; rating: MetricRating; threshold: { good: number; needsImprovement: number } }>;
    recommendations: string[];
    score: number;
  } {
    const metricsWithRatings = this.getMetricsWithRatings();
    const recommendations: string[] = [];
    let totalScore = 0;
    let metricCount = 0;

    const summary: Record<string, any> = {};

    Object.entries(metricsWithRatings).forEach(([key, { value, rating }]) => {
      if (key in this.thresholds) {
        const threshold = this.thresholds[key as keyof PerformanceThresholds];
        summary[key] = { value, rating, threshold };

        if (value !== null) {
          // Calculate score (0-100)
          let score = 100;
          if (rating === 'needs-improvement') score = 50;
          if (rating === 'poor') score = 0;
          
          totalScore += score;
          metricCount++;

          // Generate recommendations
          if (rating !== 'good') {
            recommendations.push(...this.getRecommendations(key as keyof PerformanceThresholds, value, rating));
          }
        }
      }
    });

    const overallScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;

    return {
      summary,
      recommendations,
      score: overallScore,
    };
  }

  private getRecommendations(metric: keyof PerformanceThresholds, value: number, rating: MetricRating): string[] {
    const recommendations: Record<keyof PerformanceThresholds, string[]> = {
      lcp: [
        'Optimize server response times',
        'Use a Content Delivery Network (CDN)',
        'Optimize and compress images',
        'Preload critical resources',
        'Remove unused JavaScript and CSS',
      ],
      fid: [
        'Minimize JavaScript execution time',
        'Remove unused JavaScript',
        'Break up long tasks',
        'Use web workers for heavy computations',
        'Optimize third-party scripts',
      ],
      cls: [
        'Include size attributes on images and video elements',
        'Reserve space for ad slots',
        'Add new UI elements below the fold',
        'Use CSS aspect-ratio for dynamic content',
        'Avoid inserting content above existing content',
      ],
      fcp: [
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Remove unused CSS',
        'Use efficient cache policies',
        'Minimize critical request depth',
      ],
      ttfb: [
        'Optimize server performance',
        'Use a CDN',
        'Cache resources',
        'Use service workers',
        'Minimize redirects',
      ],
    };

    return recommendations[metric] || [];
  }
}

// Singleton instance
export const coreWebVitalsTracker = new CoreWebVitalsTracker();

// Auto-start tracking when module loads
if (typeof window !== 'undefined') {
  // Start tracking after page load
  if (document.readyState === 'complete') {
    coreWebVitalsTracker.startTracking();
  } else {
    window.addEventListener('load', () => {
      coreWebVitalsTracker.startTracking();
    });
  }
}