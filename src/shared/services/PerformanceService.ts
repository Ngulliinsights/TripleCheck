/**
 * Performance Service
 * Performance monitoring, optimization, and analytics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'resource' | 'custom' | 'vitals';
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageLoadTime: number;
    slowestResource: string;
    fastestResource: string;
    coreWebVitals: {
      lcp: number; // Largest Contentful Paint
      fid: number; // First Input Delay
      cls: number; // Cumulative Layout Shift
    };
  };
  recommendations: string[];
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  cached: boolean;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private vitalsObserver: PerformanceObserver | null = null;

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  constructor() {
    this.initializeObservers();
    this.collectInitialMetrics();
  }

  /**
   * Record custom performance metric
   */
  recordMetric(
    name: string, 
    value: number, 
    category: PerformanceMetric['category'] = 'custom',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      tags
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Start performance timing
   */
  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'custom', { type: 'timing' });
    };
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'custom', { type: 'async_function', status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'custom', { type: 'async_function', status: 'error' });
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measureSync<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'custom', { type: 'sync_function', status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'custom', { type: 'sync_function', status: 'error' });
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    const navigationMetrics = this.metrics.filter(m => m.category === 'navigation');
    const resourceMetrics = this.metrics.filter(m => m.category === 'resource');
    const vitalMetrics = this.metrics.filter(m => m.category === 'vitals');

    // Calculate averages
    const averageLoadTime = navigationMetrics.length > 0
      ? navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length
      : 0;

    // Find slowest and fastest resources
    const sortedResources = resourceMetrics.sort((a, b) => b.value - a.value);
    const slowestResource = sortedResources[0]?.name || 'N/A';
    const fastestResource = sortedResources[sortedResources.length - 1]?.name || 'N/A';

    // Core Web Vitals
    const lcpMetric = vitalMetrics.find(m => m.name === 'LCP');
    const fidMetric = vitalMetrics.find(m => m.name === 'FID');
    const clsMetric = vitalMetrics.find(m => m.name === 'CLS');

    const coreWebVitals = {
      lcp: lcpMetric?.value || 0,
      fid: fidMetric?.value || 0,
      cls: clsMetric?.value || 0
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(coreWebVitals, resourceMetrics);

    return {
      metrics: [...this.metrics],
      summary: {
        totalMetrics: this.metrics.length,
        averageLoadTime,
        slowestResource,
        fastestResource,
        coreWebVitals
      },
      recommendations
    };
  }

  /**
   * Get resource timing information
   */
  getResourceTiming(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name),
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0
    }));
  }

  /**
   * Get navigation timing
   */
  getNavigationTiming(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return {};

    return {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      tlsHandshake: navigation.secureConnectionStart > 0 
        ? navigation.connectEnd - navigation.secureConnectionStart 
        : 0,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      domComplete: navigation.domComplete - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.navigationStart
    };
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime, 'vitals');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('FID', (entry as any).processingStart - entry.startTime, 'vitals');
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID monitoring not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          this.recordMetric('CLS', clsValue, 'vitals');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS monitoring not supported:', error);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  getMemoryUsage(): Record<string, number> | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export performance data
   */
  exportData(): string {
    const report = this.getPerformanceReport();
    const resourceTiming = this.getResourceTiming();
    const navigationTiming = this.getNavigationTiming();
    const memoryUsage = this.getMemoryUsage();

    const exportData = {
      timestamp: new Date().toISOString(),
      report,
      resourceTiming,
      navigationTiming,
      memoryUsage,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Navigation timing observer
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric(entry.name, entry.duration, 'navigation');
        });
      });
      this.observer.observe({ entryTypes: ['navigation'] });

      // Resource timing observer
      this.resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric(entry.name, entry.duration, 'resource', {
            type: this.getResourceType(entry.name)
          });
        });
      });
      this.resourceObserver.observe({ entryTypes: ['resource'] });

      // Start Core Web Vitals monitoring
      this.monitorCoreWebVitals();
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * Collect initial performance metrics
   */
  private collectInitialMetrics(): void {
    // Wait for page load to complete
    if (document.readyState === 'complete') {
      this.collectNavigationMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectNavigationMetrics(), 0);
      });
    }
  }

  /**
   * Collect navigation performance metrics
   */
  private collectNavigationMetrics(): void {
    const navigationTiming = this.getNavigationTiming();
    
    Object.entries(navigationTiming).forEach(([name, value]) => {
      this.recordMetric(`navigation.${name}`, value, 'navigation');
    });
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'font';
    if (['json', 'xml'].includes(extension || '')) return 'xhr';
    
    return 'other';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    vitals: { lcp: number; fid: number; cls: number },
    resourceMetrics: PerformanceMetric[]
  ): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (vitals.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Consider optimizing images and reducing server response times.');
    }

    // FID recommendations
    if (vitals.fid > 100) {
      recommendations.push('First Input Delay is high. Consider reducing JavaScript execution time and using code splitting.');
    }

    // CLS recommendations
    if (vitals.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Ensure images and ads have defined dimensions.');
    }

    // Resource recommendations
    const slowResources = resourceMetrics.filter(m => m.value > 1000);
    if (slowResources.length > 0) {
      recommendations.push(`${slowResources.length} resources are loading slowly. Consider optimizing or lazy loading.`);
    }

    // Memory recommendations
    const memory = this.getMemoryUsage();
    if (memory && memory.usagePercentage > 80) {
      recommendations.push('High memory usage detected. Consider optimizing JavaScript and reducing memory leaks.');
    }

    return recommendations;
  }

  /**
   * Send metric to analytics service
   */
  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      console.warn('Failed to send performance metric to analytics:', error);
    }
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService;