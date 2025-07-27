/**
 * Performance Testing Utilities
 * Comprehensive utilities for testing page load times, Core Web Vitals, 
 * component performance, and bundle analysis
 */

import { vi } from 'vitest';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Core Web Vitals interfaces
export interface WebVitalsMetrics {
  cls: number;
  fcp: number;
  fid: number;
  lcp: number;
  ttfb: number;
}

export interface ComponentPerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  componentName: string;
  timestamp: number;
}

export interface PageLoadMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

export interface BundleAnalysisMetrics {
  totalSize: number;
  gzippedSize: number;
  chunkSizes: Record<string, number>;
  unusedCode: number;
  duplicateCode: number;
}

/**
 * Core Web Vitals Testing Utilities
 */
export class WebVitalsTestUtils {
  private static metrics: Partial<WebVitalsMetrics> = {};
  private static listeners: Array<(metrics: Partial<WebVitalsMetrics>) => void> = [];

  static async measureWebVitals(): Promise<WebVitalsMetrics> {
    return new Promise((resolve) => {
      const metrics: Partial<WebVitalsMetrics> = {};
      let metricsCollected = 0;
      const totalMetrics = 5;

      const checkComplete = () => {
        if (metricsCollected === totalMetrics) {
          resolve(metrics as WebVitalsMetrics);
        }
      };

      // Collect CLS (Cumulative Layout Shift)
      onCLS((metric: any) => {
        metrics.cls = metric.value;
        metricsCollected++;
        checkComplete();
      });

      // Collect FCP (First Contentful Paint)
      onFCP((metric: any) => {
        metrics.fcp = metric.value;
        metricsCollected++;
        checkComplete();
      });

      // Collect INP (Interaction to Next Paint) - replaces FID in web-vitals v3+
      onINP((metric: any) => {
        metrics.fid = metric.value; // Keep as fid for backward compatibility
        metricsCollected++;
        checkComplete();
      });

      // Collect LCP (Largest Contentful Paint)
      onLCP((metric: any) => {
        metrics.lcp = metric.value;
        metricsCollected++;
        checkComplete();
      });

      // Collect TTFB (Time to First Byte)
      onTTFB((metric: any) => {
        metrics.ttfb = metric.value;
        metricsCollected++;
        checkComplete();
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        resolve(metrics as WebVitalsMetrics);
      }, 10000);
    });
  }

  static mockWebVitals(mockMetrics: Partial<WebVitalsMetrics> = {}) {
    const defaultMetrics: WebVitalsMetrics = {
      cls: mockMetrics.cls ?? 0.05,
      fcp: mockMetrics.fcp ?? 1200,
      fid: mockMetrics.fid ?? 50,
      lcp: mockMetrics.lcp ?? 2000,
      ttfb: mockMetrics.ttfb ?? 300,
    };

    this.metrics = defaultMetrics;
    return defaultMetrics;
  }

  static getMetrics(): Partial<WebVitalsMetrics> {
    return this.metrics;
  }

  static addListener(callback: (metrics: Partial<WebVitalsMetrics>) => void) {
    this.listeners.push(callback);
  }

  static removeAllListeners() {
    this.listeners = [];
  }

  static validateWebVitals(metrics: WebVitalsMetrics, thresholds?: Partial<WebVitalsMetrics>) {
    const defaultThresholds: WebVitalsMetrics = {
      cls: 0.1,      // Good: ≤ 0.1
      fcp: 1800,     // Good: ≤ 1.8s
      fid: 100,      // Good: ≤ 100ms
      lcp: 2500,     // Good: ≤ 2.5s
      ttfb: 800,     // Good: ≤ 800ms
    };

    const finalThresholds = { ...defaultThresholds, ...thresholds };
    const violations: string[] = [];

    if (metrics.cls > finalThresholds.cls) {
      violations.push(`CLS: ${metrics.cls} > ${finalThresholds.cls}`);
    }
    if (metrics.fcp > finalThresholds.fcp) {
      violations.push(`FCP: ${metrics.fcp}ms > ${finalThresholds.fcp}ms`);
    }
    if (metrics.fid > finalThresholds.fid) {
      violations.push(`FID: ${metrics.fid}ms > ${finalThresholds.fid}ms`);
    }
    if (metrics.lcp > finalThresholds.lcp) {
      violations.push(`LCP: ${metrics.lcp}ms > ${finalThresholds.lcp}ms`);
    }
    if (metrics.ttfb > finalThresholds.ttfb) {
      violations.push(`TTFB: ${metrics.ttfb}ms > ${finalThresholds.ttfb}ms`);
    }

    return {
      passed: violations.length === 0,
      violations,
      metrics,
      thresholds: finalThresholds,
    };
  }
}

/**
 * Component Performance Testing Utilities
 */
export class ComponentPerformanceTestUtils {
  private static performanceEntries: ComponentPerformanceMetrics[] = [];

  static measureComponentRender<T>(
    componentName: string,
    renderFunction: () => T
  ): { result: T; metrics: ComponentPerformanceMetrics } {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const result = renderFunction();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: ComponentPerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      reRenderCount: 1,
      componentName,
      timestamp: Date.now(),
    };

    this.performanceEntries.push(metrics);
    return { result, metrics };
  }

  static async measureAsyncComponentRender<T>(
    componentName: string,
    renderFunction: () => Promise<T>
  ): Promise<{ result: T; metrics: ComponentPerformanceMetrics }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const result = await renderFunction();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: ComponentPerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      reRenderCount: 1,
      componentName,
      timestamp: Date.now(),
    };

    this.performanceEntries.push(metrics);
    return { result, metrics };
  }

  static measureReRenders(componentName: string, renderCount: number = 10) {
    const measurements: number[] = [];
    let totalMemoryDelta = 0;

    for (let i = 0; i < renderCount; i++) {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      // Simulate re-render
      this.simulateReRender();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      measurements.push(endTime - startTime);
      totalMemoryDelta += endMemory - startMemory;
    }

    const avgRenderTime = measurements.reduce((sum, time) => sum + time, 0) / renderCount;
    const avgMemoryUsage = totalMemoryDelta / renderCount;

    const metrics: ComponentPerformanceMetrics = {
      renderTime: avgRenderTime,
      memoryUsage: avgMemoryUsage,
      reRenderCount: renderCount,
      componentName,
      timestamp: Date.now(),
    };

    this.performanceEntries.push(metrics);
    return metrics;
  }

  private static simulateReRender() {
    // Simulate component re-render work
    const iterations = 1000;
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.random();
    }
    return result;
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  static getPerformanceEntries(): ComponentPerformanceMetrics[] {
    return [...this.performanceEntries];
  }

  static clearPerformanceEntries() {
    this.performanceEntries = [];
  }

  static analyzeComponentPerformance(componentName?: string) {
    const entries = componentName 
      ? this.performanceEntries.filter(entry => entry.componentName === componentName)
      : this.performanceEntries;

    if (entries.length === 0) {
      return null;
    }

    const renderTimes = entries.map(entry => entry.renderTime);
    const memoryUsages = entries.map(entry => entry.memoryUsage);

    return {
      componentName: componentName || 'All Components',
      totalRenders: entries.length,
      averageRenderTime: renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length,
      minRenderTime: Math.min(...renderTimes),
      maxRenderTime: Math.max(...renderTimes),
      averageMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length,
      totalMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0),
    };
  }
}

/**
 * Page Load Performance Testing Utilities
 */
export class PageLoadTestUtils {
  static async measurePageLoad(url?: string): Promise<PageLoadMetrics> {
    return new Promise((resolve) => {
      const metrics: Partial<PageLoadMetrics> = {};

      // Use Navigation Timing API
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        metrics.loadComplete = navigation.loadEventEnd - navigation.fetchStart;
        metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
      }

      // Use Paint Timing API
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      // Use LCP from web-vitals
      onLCP((metric: any) => {
        metrics.largestContentfulPaint = metric.value;
        
        resolve(metrics as PageLoadMetrics);
      });

      // Fallback timeout
      setTimeout(() => {
        resolve(metrics as PageLoadMetrics);
      }, 5000);
    });
  }

  static mockPageLoadMetrics(mockMetrics: Partial<PageLoadMetrics> = {}): PageLoadMetrics {
    return {
      domContentLoaded: mockMetrics.domContentLoaded ?? 800,
      loadComplete: mockMetrics.loadComplete ?? 1500,
      firstPaint: mockMetrics.firstPaint ?? 600,
      firstContentfulPaint: mockMetrics.firstContentfulPaint ?? 1200,
      largestContentfulPaint: mockMetrics.largestContentfulPaint ?? 2000,
      timeToInteractive: mockMetrics.timeToInteractive ?? 1800,
    };
  }

  static validatePageLoadPerformance(
    metrics: PageLoadMetrics,
    thresholds?: Partial<PageLoadMetrics>
  ) {
    const defaultThresholds: PageLoadMetrics = {
      domContentLoaded: 1500,
      loadComplete: 3000,
      firstPaint: 1000,
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      timeToInteractive: 3800,
    };

    const finalThresholds = { ...defaultThresholds, ...thresholds };
    const violations: string[] = [];

    Object.entries(metrics).forEach(([key, value]) => {
      const threshold = finalThresholds[key as keyof PageLoadMetrics];
      if (value > threshold) {
        violations.push(`${key}: ${value}ms > ${threshold}ms`);
      }
    });

    return {
      passed: violations.length === 0,
      violations,
      metrics,
      thresholds: finalThresholds,
    };
  }
}

/**
 * Image Loading and Lazy Loading Performance Testing
 */
export class ImagePerformanceTestUtils {
  static measureImageLoadTime(imageUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const img = new Image();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        resolve(loadTime);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  static async measureMultipleImageLoads(imageUrls: string[]): Promise<{
    averageLoadTime: number;
    totalLoadTime: number;
    individualTimes: number[];
    failedImages: string[];
  }> {
    const results = await Promise.allSettled(
      imageUrls.map(url => this.measureImageLoadTime(url))
    );

    const successfulTimes: number[] = [];
    const failedImages: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulTimes.push(result.value);
      } else {
        if (imageUrls[index]) {
          failedImages.push(imageUrls[index]);
        }
      }
    });

    const totalLoadTime = successfulTimes.reduce((sum, time) => sum + time, 0);
    const averageLoadTime = successfulTimes.length > 0 ? totalLoadTime / successfulTimes.length : 0;

    return {
      averageLoadTime,
      totalLoadTime,
      individualTimes: successfulTimes,
      failedImages,
    };
  }

  static testLazyLoadingEffectiveness(
    containerSelector: string,
    imageSelector: string
  ): Promise<{
    imagesInViewport: number;
    imagesLoaded: number;
    lazyLoadingWorking: boolean;
  }> {
    return new Promise((resolve) => {
      const container = document.querySelector(containerSelector);
      const images = document.querySelectorAll(imageSelector);

      if (!container || images.length === 0) {
        resolve({
          imagesInViewport: 0,
          imagesLoaded: 0,
          lazyLoadingWorking: false,
        });
        return;
      }

      let imagesInViewport = 0;
      let imagesLoaded = 0;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imagesInViewport++;
            const img = entry.target as HTMLImageElement;
            if (img.complete && img.naturalHeight !== 0) {
              imagesLoaded++;
            }
          }
        });

        // Check if lazy loading is working (not all images loaded immediately)
        const lazyLoadingWorking = imagesLoaded < images.length;

        resolve({
          imagesInViewport,
          imagesLoaded,
          lazyLoadingWorking,
        });

        observer.disconnect();
      });

      images.forEach((img) => observer.observe(img));

      // Timeout after 3 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve({
          imagesInViewport,
          imagesLoaded,
          lazyLoadingWorking: imagesLoaded < images.length,
        });
      }, 3000);
    });
  }

  static mockImageLoadTimes(count: number, avgTime: number = 500): number[] {
    return Array.from({ length: count }, () => {
      // Add some variance (±30%)
      const variance = avgTime * 0.3;
      return avgTime + (Math.random() - 0.5) * 2 * variance;
    });
  }
}

/**
 * Bundle Size and Code Splitting Performance Testing
 */
export class BundleAnalysisTestUtils {
  static async analyzeBundleSize(): Promise<BundleAnalysisMetrics> {
    // This would typically integrate with webpack-bundle-analyzer or similar
    // For testing purposes, we'll simulate the analysis
    
    const mockMetrics: BundleAnalysisMetrics = {
      totalSize: 2500000, // 2.5MB
      gzippedSize: 800000, // 800KB
      chunkSizes: {
        'main': 1200000,
        'vendor': 800000,
        'runtime': 50000,
        'property-pages': 300000,
        'shared-components': 150000,
      },
      unusedCode: 200000, // 200KB
      duplicateCode: 100000, // 100KB
    };

    return mockMetrics;
  }

  static validateBundleSize(
    metrics: BundleAnalysisMetrics,
    thresholds?: Partial<BundleAnalysisMetrics>
  ) {
    const defaultThresholds: BundleAnalysisMetrics = {
      totalSize: 3000000, // 3MB
      gzippedSize: 1000000, // 1MB
      chunkSizes: {
        'main': 1500000,
        'vendor': 1000000,
        'runtime': 100000,
      },
      unusedCode: 300000, // 300KB
      duplicateCode: 150000, // 150KB
    };

    const finalThresholds = { ...defaultThresholds, ...thresholds };
    const violations: string[] = [];

    if (metrics.totalSize > finalThresholds.totalSize) {
      violations.push(`Total bundle size: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB > ${(finalThresholds.totalSize / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.gzippedSize > finalThresholds.gzippedSize) {
      violations.push(`Gzipped size: ${(metrics.gzippedSize / 1024 / 1024).toFixed(2)}MB > ${(finalThresholds.gzippedSize / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.unusedCode > finalThresholds.unusedCode) {
      violations.push(`Unused code: ${(metrics.unusedCode / 1024).toFixed(0)}KB > ${(finalThresholds.unusedCode / 1024).toFixed(0)}KB`);
    }

    if (metrics.duplicateCode > finalThresholds.duplicateCode) {
      violations.push(`Duplicate code: ${(metrics.duplicateCode / 1024).toFixed(0)}KB > ${(finalThresholds.duplicateCode / 1024).toFixed(0)}KB`);
    }

    return {
      passed: violations.length === 0,
      violations,
      metrics,
      thresholds: finalThresholds,
    };
  }

  static measureCodeSplittingEffectiveness(): {
    totalChunks: number;
    averageChunkSize: number;
    largestChunk: { name: string; size: number };
    splittingScore: number;
  } {
    // Mock implementation - in real scenario, this would analyze actual chunks
    const chunks = {
      'main': 1200000,
      'vendor': 800000,
      'property-pages': 300000,
      'shared-components': 150000,
      'trust-pages': 200000,
      'user-pages': 180000,
    };

    const chunkSizes = Object.values(chunks);
    const totalChunks = chunkSizes.length;
    const averageChunkSize = chunkSizes.reduce((sum, size) => sum + size, 0) / totalChunks;
    
    const largestChunkEntry = Object.entries(chunks).reduce((largest, [name, size]) => 
      size > largest.size ? { name, size } : largest
    , { name: '', size: 0 });

    // Splitting score: lower is better (indicates more even distribution)
    const variance = chunkSizes.reduce((sum, size) => sum + Math.pow(size - averageChunkSize, 2), 0) / totalChunks;
    const splittingScore = Math.sqrt(variance) / averageChunkSize;

    return {
      totalChunks,
      averageChunkSize,
      largestChunk: largestChunkEntry,
      splittingScore,
    };
  }
}

/**
 * Virtualized Lists and Infinite Scrolling Performance Testing
 */
export class VirtualizationTestUtils {
  static measureVirtualizedListPerformance(
    listContainer: HTMLElement,
    itemCount: number,
    itemHeight: number
  ): Promise<{
    renderTime: number;
    memoryUsage: number;
    visibleItems: number;
    scrollPerformance: number;
  }> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      // Simulate virtualized list rendering
      const visibleItems = Math.ceil(listContainer.clientHeight / itemHeight);
      
      // Measure scroll performance
      let scrollStartTime = 0;
      let scrollEndTime = 0;
      
      const handleScrollStart = () => {
        scrollStartTime = performance.now();
      };
      
      const handleScrollEnd = () => {
        scrollEndTime = performance.now();
      };

      listContainer.addEventListener('scroll', handleScrollStart, { once: true });
      
      // Simulate scroll
      setTimeout(() => {
        listContainer.scrollTop = itemHeight * 10;
        handleScrollEnd();
        
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        resolve({
          renderTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          visibleItems,
          scrollPerformance: scrollEndTime - scrollStartTime,
        });
      }, 100);
    });
  }

  static testInfiniteScrollPerformance(
    container: HTMLElement,
    loadMoreCallback: () => Promise<void>
  ): Promise<{
    loadTime: number;
    memoryGrowth: number;
    itemsLoaded: number;
  }> {
    return new Promise(async (resolve) => {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();
      const initialItemCount = container.children.length;

      await loadMoreCallback();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      const finalItemCount = container.children.length;

      resolve({
        loadTime: endTime - startTime,
        memoryGrowth: endMemory - startMemory,
        itemsLoaded: finalItemCount - initialItemCount,
      });
    });
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  static mockVirtualizationMetrics(itemCount: number = 1000) {
    const itemHeight = 50;
    const containerHeight = 400;
    const visibleItems = Math.ceil(containerHeight / itemHeight);

    return {
      renderTime: Math.random() * 100 + 50, // 50-150ms
      memoryUsage: itemCount * 1024, // 1KB per item
      visibleItems,
      scrollPerformance: Math.random() * 16 + 8, // 8-24ms (target 60fps = 16.67ms)
    };
  }
}

/**
 * Performance Test Helpers and Utilities
 */
export class PerformanceTestHelpers {
  static createPerformanceTest(
    testName: string,
    testFunction: () => Promise<void> | void,
    thresholds: { maxTime?: number; maxMemory?: number } = {}
  ) {
    return async () => {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      await testFunction();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const executionTime = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      // Validate against thresholds
      if (thresholds.maxTime && executionTime > thresholds.maxTime) {
        throw new Error(`${testName} exceeded time threshold: ${executionTime}ms > ${thresholds.maxTime}ms`);
      }

      if (thresholds.maxMemory && memoryUsage > thresholds.maxMemory) {
        throw new Error(`${testName} exceeded memory threshold: ${memoryUsage} bytes > ${thresholds.maxMemory} bytes`);
      }

      return {
        testName,
        executionTime,
        memoryUsage,
        passed: true,
      };
    };
  }

  static async runPerformanceBenchmark<T>(
    name: string,
    testFunction: () => T,
    iterations: number = 10
  ): Promise<{
    name: string;
    iterations: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    averageMemory: number;
  }> {
    const times: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      await testFunction();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      times.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const averageMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0) / iterations;

    return {
      name,
      iterations,
      averageTime,
      minTime,
      maxTime,
      totalTime,
      averageMemory,
    };
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  static waitForNextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  static waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  static simulateSlowNetwork(delay: number = 1000): void {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalFetch.apply(this, args as any);
    });
  }

  static restoreNetwork(): void {
    if (vi.isMockFunction(global.fetch)) {
      (global.fetch as any).mockRestore?.();
    }
  }
}

// All utilities are already exported above as individual classes