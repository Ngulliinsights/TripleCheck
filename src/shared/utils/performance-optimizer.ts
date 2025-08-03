/**
 * Performance Optimization and Monitoring System
 * Provides intelligent performance optimization and real-time monitoring
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'network' | 'rendering' | 'memory' | 'user-interaction';
  threshold?: number;
  unit: string;
}

interface OptimizationSuggestion {
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

interface PerformanceReport {
  timestamp: number;
  overallScore: number;
  metrics: PerformanceMetric[];
  suggestions: OptimizationSuggestion[];
  webVitals: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
  };
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private webVitalsData: PerformanceReport['webVitals'] = {};
  private readonly MAX_METRICS = 500;

  private constructor() {
    this.initializePerformanceObserver();
    this.initializeWebVitals();
    this.startPeriodicOptimization();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize performance observer
   */
  private initializePerformanceObserver(): void {
    if (!window?.PerformanceObserver) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entry) => {
      this.webVitalsData.lcp = entry.startTime;
      this.addMetric({
        name: 'Largest Contentful Paint',
        value: entry.startTime,
        timestamp: Date.now(),
        category: 'rendering',
        threshold: 2500,
        unit: 'ms'
      });
    });

    // First Input Delay (FID)
    this.observeWebVital('first-input', (entry) => {
      this.webVitalsData.fid = entry.processingStart - entry.startTime;
      this.addMetric({
        name: 'First Input Delay',
        value: entry.processingStart - entry.startTime,
        timestamp: Date.now(),
        category: 'user-interaction',
        threshold: 100,
        unit: 'ms'
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observeWebVital('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.webVitalsData.cls = (this.webVitalsData.cls || 0) + entry.value;
        this.addMetric({
          name: 'Cumulative Layout Shift',
          value: this.webVitalsData.cls || 0,
          timestamp: Date.now(),
          category: 'rendering',
          threshold: 0.1,
          unit: 'score'
        });
      }
    });
  }

  /**
   * Observe specific web vital
   */
  private observeWebVital(type: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Process performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry);
        break;
      case 'measure':
        this.processMeasureEntry(entry);
        break;
    }
  }

  /**
   * Process navigation timing entry
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const ttfb = entry.responseStart - entry.requestStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - (entry.startTime || 0);
    const loadComplete = entry.loadEventEnd - (entry.startTime || 0);

    this.webVitalsData.ttfb = ttfb;

    this.addMetric({
      name: 'Time to First Byte',
      value: ttfb,
      timestamp: Date.now(),
      category: 'network',
      threshold: 600,
      unit: 'ms'
    });

    this.addMetric({
      name: 'DOM Content Loaded',
      value: domContentLoaded,
      timestamp: Date.now(),
      category: 'rendering',
      threshold: 1500,
      unit: 'ms'
    });

    this.addMetric({
      name: 'Load Complete',
      value: loadComplete,
      timestamp: Date.now(),
      category: 'rendering',
      threshold: 3000,
      unit: 'ms'
    });
  }

  /**
   * Process resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    
    // Only track slow resources
    if (duration > 1000) {
      this.addMetric({
        name: `Slow Resource: ${entry.name.split('/').pop() || 'unknown'}`,
        value: duration,
        timestamp: Date.now(),
        category: 'network',
        threshold: 1000,
        unit: 'ms'
      });
    }
  }

  /**
   * Process paint timing entry
   */
  private processPaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      this.webVitalsData.fcp = entry.startTime;
      this.addMetric({
        name: 'First Contentful Paint',
        value: entry.startTime,
        timestamp: Date.now(),
        category: 'rendering',
        threshold: 1800,
        unit: 'ms'
      });
    }
  }

  /**
   * Process measure entry
   */
  private processMeasureEntry(entry: PerformanceEntry): void {
    this.addMetric({
      name: entry.name,
      value: entry.duration,
      timestamp: Date.now(),
      category: 'rendering',
      unit: 'ms'
    });
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Check for performance issues
    if (metric.threshold && metric.value > metric.threshold) {
      this.handlePerformanceIssue(metric);
    }
  }

  /**
   * Handle performance issues
   */
  private handlePerformanceIssue(metric: PerformanceMetric): void {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ Performance issue detected: ${metric.name} (${metric.value}${metric.unit}) exceeds threshold (${metric.threshold}${metric.unit})`);
    }

    // Send alert in production
    if (process.env.NODE_ENV === "production") {
      this.sendPerformanceAlert(metric);
    }
  }

  /**
   * Send performance alert
   */
  private sendPerformanceAlert(metric: PerformanceMetric): void {
    try {
      fetch('/api/monitoring/performance-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance_threshold_exceeded',
          metric: metric.name,
          value: metric.value,
          threshold: metric.threshold,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.warn('Failed to send performance alert:', error);
      });
    } catch (error) {
      console.warn('Performance monitoring service unavailable:', error);
    }
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const recentMetrics = this.metrics.slice(-50); // Last 50 metrics

    // Check for slow TTFB
    const ttfbMetrics = recentMetrics.filter(m => m.name === 'Time to First Byte');
    if (ttfbMetrics.length > 0) {
      const avgTtfb = ttfbMetrics.reduce((sum, m) => sum + m.value, 0) / ttfbMetrics.length;
      if (avgTtfb > 600) {
        suggestions.push({
          type: 'warning',
          category: 'Network',
          title: 'Slow Server Response Time',
          description: `Average TTFB is ${Math.round(avgTtfb)}ms, which is above the recommended 600ms threshold.`,
          impact: 'high',
          implementation: 'Optimize server-side processing, implement caching, or consider using a CDN.'
        });
      }
    }

    // Check for large CLS
    if (this.webVitalsData.cls && this.webVitalsData.cls > 0.1) {
      suggestions.push({
        type: 'critical',
        category: 'Layout Stability',
        title: 'High Cumulative Layout Shift',
        description: `CLS score of ${this.webVitalsData.cls.toFixed(3)} exceeds the recommended 0.1 threshold.`,
        impact: 'high',
        implementation: 'Reserve space for images and ads, avoid inserting content above existing content, use CSS transforms for animations.'
      });
    }

    // Check for slow LCP
    if (this.webVitalsData.lcp && this.webVitalsData.lcp > 2500) {
      suggestions.push({
        type: 'warning',
        category: 'Loading Performance',
        title: 'Slow Largest Contentful Paint',
        description: `LCP of ${Math.round(this.webVitalsData.lcp)}ms exceeds the recommended 2.5s threshold.`,
        impact: 'high',
        implementation: 'Optimize images, preload critical resources, improve server response times, use efficient CSS.'
      });
    }

    // Check for slow resources
    const slowResources = recentMetrics.filter(m => m.name.includes('Slow Resource'));
    if (slowResources.length > 3) {
      suggestions.push({
        type: 'warning',
        category: 'Resource Loading',
        title: 'Multiple Slow Resources Detected',
        description: `${slowResources.length} resources are loading slowly, impacting overall performance.`,
        impact: 'medium',
        implementation: 'Optimize images, minify CSS/JS, implement lazy loading, use a CDN.'
      });
    }

    // Check memory usage if available
    if ((performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 80) {
        suggestions.push({
          type: 'critical',
          category: 'Memory Usage',
          title: 'High Memory Usage',
          description: `JavaScript heap usage is at ${Math.round(memoryUsagePercent)}% of the limit.`,
          impact: 'high',
          implementation: 'Review for memory leaks, optimize data structures, implement proper cleanup in components.'
        });
      }
    }

    return suggestions;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // Deduct points based on Web Vitals
    if (this.webVitalsData.lcp) {
      if (this.webVitalsData.lcp > 4000) score -= 30;
      else if (this.webVitalsData.lcp > 2500) score -= 15;
    }
    
    if (this.webVitalsData.fid) {
      if (this.webVitalsData.fid > 300) score -= 25;
      else if (this.webVitalsData.fid > 100) score -= 10;
    }
    
    if (this.webVitalsData.cls) {
      if (this.webVitalsData.cls > 0.25) score -= 25;
      else if (this.webVitalsData.cls > 0.1) score -= 10;
    }
    
    if (this.webVitalsData.fcp) {
      if (this.webVitalsData.fcp > 3000) score -= 20;
      else if (this.webVitalsData.fcp > 1800) score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      overallScore: this.calculatePerformanceScore(),
      metrics: this.metrics.slice(-100), // Last 100 metrics
      suggestions: this.generateOptimizationSuggestions(),
      webVitals: { ...this.webVitalsData }
    };
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.webVitalsData = {};
  }

  /**
   * Start periodic optimization checks
   */
  private startPeriodicOptimization(): void {
    // Run optimization checks every 30 seconds
    setInterval(() => {
      const suggestions = this.generateOptimizationSuggestions();
      
      if (suggestions.length > 0 && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log('🔧 Performance Optimization Suggestions:', suggestions);
      }
    }, 30000);
  }

  /**
   * Measure custom performance
   */
  measureCustom(name: string, fn: () => void | Promise<void>): Promise<number> {
    return new Promise(async (resolve) => {
      const startTime = performance.now();
      
      try {
        await fn();
      } catch (error) {
        console.error(`Error in custom measurement ${name}:`, error);
      }
      
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `Custom: ${name}`,
        value: duration,
        timestamp: Date.now(),
        category: 'rendering',
        unit: 'ms'
      });
      
      resolve(duration);
    });
  }

  /**
   * Destroy the optimizer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.clearMetrics();
  }
}

// Create and export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Development utilities
if (process.env.NODE_ENV === "development") {
  // Make optimizer available globally for debugging
  (window as any).performanceOptimizer = performanceOptimizer;
  
  // Log performance report every 60 seconds
  setInterval(() => {
    const report = performanceOptimizer.generatePerformanceReport();
    // eslint-disable-next-line no-console
    console.log('📊 Performance Report:', {
      score: report.overallScore,
      webVitals: report.webVitals,
      suggestionsCount: report.suggestions.length
    });
  }, 60000);
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    performanceOptimizer.destroy();
  });
}

export type { PerformanceMetric, OptimizationSuggestion, PerformanceReport };