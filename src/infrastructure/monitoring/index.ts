/**
 * Performance Monitoring Infrastructure
 * Exports all performance monitoring utilities and components
 */

// Core Web Vitals tracking
export {
  coreWebVitalsTracker,
  type CoreWebVitalsMetrics,
  type PerformanceThresholds,
  type MetricRating,
} from './core-web-vitals'

// Bundle analysis
export {
  bundleAnalyzer,
  type BundleMetrics,
  type ChunkInfo,
  type ModuleInfo,
  type DuplicateModule,
  type UnusedExport,
  type OptimizationRecommendation,
} from './bundle-analyzer'

// Resource hints management
export {
  resourceHintsManager,
  type ResourceHint,
  type PreloadConfig,
  type PrefetchConfig,
  type PreconnectConfig,
  type ResourceHintMetrics,
} from './resource-hints'

// React integration
export {
  usePerformanceMonitoring,
  usePerformanceMonitoringContext,
  PerformanceMonitoringContext,
  type PerformanceMonitoringState,
  type PerformanceReport,
} from './usePerformanceMonitoring'

// Provider component
export {
  PerformanceMonitoringProvider,
  PerformanceDebugger,
} from './PerformanceMonitoringProvider'

// Legacy performance monitor (enhanced)
export {
  performanceMonitor,
  type PerformanceMetric,
  type PerformanceRating,
} from '../../shared/services/performance-monitoring-service'

// Service worker utilities
export {
  serviceWorkerManager,
  useServiceWorker,
  useNetworkStatus,
  offlineStorage,
  type ServiceWorkerConfig,
} from '../service-worker/sw-registration'

// Utility functions for performance optimization
export const performanceUtils = {
  // Format bytes to human readable format
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'] as const;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    const formattedValue = parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2));
    return `${formattedValue} ${sizes[sizeIndex]}`;
  },

  // Calculate performance score based on Core Web Vitals
  calculateCWVScore: (metrics: {
    lcp?: number | null;
    fid?: number | null;
    cls?: number | null;
  }): number => {
    let score = 0;
    let count = 0;

    const calculateMetricScore = (value: number, goodThreshold: number, needsImprovementThreshold: number): number => {
      if (value <= goodThreshold) return 100;
      if (value <= needsImprovementThreshold) return 50;
      return 0;
    };

    if (metrics.lcp !== null && metrics.lcp !== undefined) {
      score += calculateMetricScore(metrics.lcp, 2500, 4000);
      count++;
    }

    if (metrics.fid !== null && metrics.fid !== undefined) {
      score += calculateMetricScore(metrics.fid, 100, 300);
      count++;
    }

    if (metrics.cls !== null && metrics.cls !== undefined) {
      score += calculateMetricScore(metrics.cls, 0.1, 0.25);
      count++;
    }

    return count > 0 ? Math.round(score / count) : 0;
  },

  // Get performance grade based on score
  getPerformanceGrade: (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  // Check if device has limited resources
  isLowEndDevice: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    
    const { connection, deviceMemory } = navigator as any;
    const cores = navigator.hardwareConcurrency;

    // Check for slow connection
    if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
      return true;
    }

    // Check for low memory or few CPU cores
    return (deviceMemory && deviceMemory <= 2) || (cores && cores <= 2) || false;
  },

  // Get connection speed estimate
  getConnectionSpeed: (): string => {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const { connection } = navigator as any;
    return connection?.effectiveType || 'unknown';
  },

  // Debounce function for performance-sensitive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance-sensitive operations
  throttle: <T extends (...args: any[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

// Performance monitoring configuration
export const performanceConfig = {
  // Core Web Vitals thresholds
  thresholds: {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 },
  },

  // Bundle size limits
  bundleLimits: {
    maxChunkSize: 500000, // 500KB
    maxVendorSize: 1000000, // 1MB
    maxTotalSize: 2000000, // 2MB
  },

  // Cache limits
  cacheLimits: {
    images: 50,
    api: 100,
    dynamic: 200,
  },

  // Performance budget
  budget: {
    javascript: 500000, // 500KB
    css: 100000, // 100KB
    images: 1000000, // 1MB
    fonts: 200000, // 200KB
  },
};