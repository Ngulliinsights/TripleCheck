import React from 'react';

// Performance monitoring utilities for production optimization
export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
}

export interface RoutePerformance {
  route: string;
  loadTime: number;
  renderTime: number;
  componentCount: number;
  memoryDelta: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private routeMetrics: RoutePerformance[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.trackPageLoad();
  }

  private initializeObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.trackNavigationTiming(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.trackPaintTiming(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.trackLCP(entry as any);
        break;
      case 'layout-shift':
        this.trackCLS(entry as any);
        break;
      case 'first-input':
        this.trackFID(entry as any);
        break;
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics: Partial<PerformanceMetrics> = {
      pageLoadTime: entry.loadEventEnd - entry.fetchStart,
      timeToInteractive: entry.domInteractive - entry.fetchStart,
    };
    
    this.recordMetrics(metrics);
  }

  private trackPaintTiming(entry: PerformancePaintTiming) {
    if (entry.name === 'first-contentful-paint') {
      this.recordMetrics({ firstContentfulPaint: entry.startTime });
    }
  }

  private trackLCP(entry: any) {
    this.recordMetrics({ largestContentfulPaint: entry.startTime });
  }

  private trackCLS(entry: any) {
    if (!entry.hadRecentInput) {
      this.recordMetrics({ cumulativeLayoutShift: entry.value });
    }
  }

  private trackFID(entry: any) {
    this.recordMetrics({ firstInputDelay: entry.processingStart - entry.startTime });
  }

  private trackPageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Track memory usage
      if ('memory' in performance) {
        const {memory} = (performance as any);
        this.recordMetrics({
          memoryUsage: memory.usedJSHeapSize,
        });
      }

      // Track network requests
      const resourceEntries = performance.getEntriesByType('resource');
      this.recordMetrics({
        networkRequests: resourceEntries.length,
      });
    });
  }

  private recordMetrics(metrics: Partial<PerformanceMetrics>) {
    const timestamp = Date.now();
    const existingMetrics = this.metrics[this.metrics.length - 1] || {};
    
    this.metrics.push({
      ...existingMetrics,
      ...metrics,
    } as PerformanceMetrics);

    // Send to analytics if configured
    this.sendToAnalytics(metrics, timestamp);
  }

  // Track route-specific performance
  public trackRoutePerformance(route: string, startTime: number) {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Get memory usage if available
    let memoryDelta = 0;
    if ('memory' in performance) {
      const {memory} = (performance as any);
      memoryDelta = memory.usedJSHeapSize;
    }

    const routeMetric: RoutePerformance = {
      route,
      loadTime,
      renderTime: loadTime, // Simplified for now
      componentCount: this.estimateComponentCount(),
      memoryDelta,
      timestamp: new Date(),
    };

    this.routeMetrics.push(routeMetric);
    
    // Keep only last 100 route metrics
    if (this.routeMetrics.length > 100) {
      this.routeMetrics = this.routeMetrics.slice(-100);
    }

    return routeMetric;
  }

  private estimateComponentCount(): number {
    // Simple heuristic to estimate component count
    return document.querySelectorAll('[data-reactroot] *').length;
  }

  // Get performance summary
  public getPerformanceSummary() {
    const latest = this.metrics[this.metrics.length - 1];
    const routeStats = this.getRouteStats();

    return {
      coreWebVitals: {
        lcp: latest?.largestContentfulPaint || 0,
        fid: latest?.firstInputDelay || 0,
        cls: latest?.cumulativeLayoutShift || 0,
      },
      loadingMetrics: {
        pageLoadTime: latest?.pageLoadTime || 0,
        firstContentfulPaint: latest?.firstContentfulPaint || 0,
        timeToInteractive: latest?.timeToInteractive || 0,
      },
      resourceMetrics: {
        memoryUsage: latest?.memoryUsage || 0,
        networkRequests: latest?.networkRequests || 0,
      },
      routeMetrics: routeStats,
    };
  }

  private getRouteStats() {
    if (this.routeMetrics.length === 0) return null;

    const avgLoadTime = this.routeMetrics.reduce((sum, metric) => sum + metric.loadTime, 0) / this.routeMetrics.length;
    const slowestRoute = this.routeMetrics.reduce((slowest, current) => 
      current.loadTime > slowest.loadTime ? current : slowest
    );
    const fastestRoute = this.routeMetrics.reduce((fastest, current) => 
      current.loadTime < fastest.loadTime ? current : fastest
    );

    return {
      averageLoadTime: avgLoadTime,
      slowestRoute: slowestRoute.route,
      slowestLoadTime: slowestRoute.loadTime,
      fastestRoute: fastestRoute.route,
      fastestLoadTime: fastestRoute.loadTime,
      totalRoutes: this.routeMetrics.length,
    };
  }

  // Send metrics to analytics service
  private sendToAnalytics(metrics: Partial<PerformanceMetrics>, timestamp: number) {
    // Only send in production and if analytics is configured
    if (process.env.NODE_ENV !== 'production') return;

    try {
      // Send to your analytics service
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error);
      });
    } catch (error) {
      console.warn('Performance analytics error:', error);
    }
  }

  // Performance budget alerts
  public checkPerformanceBudget() {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    const budgets = {
      largestContentfulPaint: 2500, // 2.5s
      firstInputDelay: 100, // 100ms
      cumulativeLayoutShift: 0.1, // 0.1
      pageLoadTime: 3000, // 3s
    };

    const violations = [];

    if (latest.largestContentfulPaint > budgets.largestContentfulPaint) {
      violations.push(`LCP: ${latest.largestContentfulPaint}ms (budget: ${budgets.largestContentfulPaint}ms)`);
    }

    if (latest.firstInputDelay > budgets.firstInputDelay) {
      violations.push(`FID: ${latest.firstInputDelay}ms (budget: ${budgets.firstInputDelay}ms)`);
    }

    if (latest.cumulativeLayoutShift > budgets.cumulativeLayoutShift) {
      violations.push(`CLS: ${latest.cumulativeLayoutShift} (budget: ${budgets.cumulativeLayoutShift})`);
    }

    if (latest.pageLoadTime > budgets.pageLoadTime) {
      violations.push(`Page Load: ${latest.pageLoadTime}ms (budget: ${budgets.pageLoadTime}ms)`);
    }

    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
      
      // Send alert to monitoring service
      this.sendPerformanceAlert(violations);
    }

    return violations;
  }

  private sendPerformanceAlert(violations: string[]) {
    if (process.env.NODE_ENV !== 'production') return;

    fetch('/api/monitoring/performance-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        violations,
        timestamp: Date.now(),
        url: window.location.href,
      }),
    }).catch(error => {
      console.warn('Failed to send performance alert:', error);
    });
  }

  // Cleanup
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    trackRoute: (route: string, startTime: number) => 
      performanceMonitor.trackRoutePerformance(route, startTime),
    getSummary: () => performanceMonitor.getPerformanceSummary(),
    checkBudget: () => performanceMonitor.checkPerformanceBudget(),
  };
}

// HOC for route performance tracking
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  routeName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      performanceMonitor.trackRoutePerformance(routeName, startTime);
    }, []);

    return React.createElement(Component, props);
  };
}