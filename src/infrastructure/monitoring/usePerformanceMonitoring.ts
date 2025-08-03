/**
 * React hook for comprehensive performance monitoring integration
 * Combines Core Web Vitals, bundle analysis, and resource hints
 */

import { useEffect, useState, useCallback, createContext, useContext } from 'react';

import { bundleAnalyzer, BundleMetrics } from './bundle-analyzer';
import { coreWebVitalsTracker, CoreWebVitalsMetrics, MetricRating } from './core-web-vitals';
import { resourceHintsManager, ResourceHintMetrics } from './resource-hints';

export interface PerformanceMonitoringState {
  coreWebVitals: Partial<CoreWebVitalsMetrics>;
  bundleMetrics: BundleMetrics | null;
  resourceHints: ResourceHintMetrics;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export interface PerformanceReport {
  overallScore: number;
  coreWebVitals: {
    metrics: Record<string, { value: number | null; rating: MetricRating }>;
    score: number;
    recommendations: string[];
  };
  bundleAnalysis: {
    summary: {
      totalSize: string;
      gzippedSize: string;
      compressionRatio: string;
      chunkCount: number;
      moduleCount: number;
      duplicateCount: number;
    };
    recommendations: Array<{
      type: string;
      priority: string;
      description: string;
      potentialSavings: number;
      implementation: string;
    }>;
    potentialSavings: string;
  } | null;
  resourceHints: {
    summary: {
      preloadedCount: number;
      prefetchedCount: number;
      preconnectedCount: number;
      hitRate: string;
      recommendations: string[];
    };
    details: {
      preloadedResources: string[];
      prefetchedResources: string[];
      preconnectedOrigins: string[];
    };
  };
}

export function usePerformanceMonitoring() {
  const [state, setState] = useState<PerformanceMonitoringState>({
    coreWebVitals: {},
    bundleMetrics: null,
    resourceHints: {
      preloaded: 0,
      prefetched: 0,
      preconnected: 0,
      hitRate: 0,
      loadTimeImprovement: 0,
      timestamp: Date.now(),
    },
    isLoading: true,
    lastUpdated: null,
  });

  // Initialize monitoring
  useEffect(() => {
    let unsubscribeCWV: (() => void) | null = null;

    const initializeMonitoring = async () => {
      try {
        // Start Core Web Vitals tracking
        coreWebVitalsTracker.startTracking();
        
        // Subscribe to Core Web Vitals updates
        unsubscribeCWV = coreWebVitalsTracker.onMetricsUpdate((metrics) => {
          setState(prev => ({
            ...prev,
            coreWebVitals: metrics,
            lastUpdated: new Date(),
          }));
        });

        // Get initial metrics
        const initialCWV = coreWebVitalsTracker.getMetrics();
        const initialResourceHints = resourceHintsManager.getMetrics();

        setState(prev => ({
          ...prev,
          coreWebVitals: initialCWV,
          resourceHints: initialResourceHints,
          isLoading: false,
          lastUpdated: new Date(),
        }));

        // Analyze bundle metrics (this might take a moment)
        setTimeout(async () => {
          try {
            const bundleMetrics = await bundleAnalyzer.analyzeBundleMetrics();
            setState(prev => ({
              ...prev,
              bundleMetrics,
              lastUpdated: new Date(),
            }));
          } catch (error) {
            console.warn('Failed to analyze bundle metrics:', error);
          }
        }, 2000);

      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeMonitoring();

    // Cleanup
    return () => {
      if (unsubscribeCWV) {
        unsubscribeCWV();
      }
      coreWebVitalsTracker.stopTracking();
    };
  }, []);

  // Update resource hints metrics periodically
  useEffect(() => {
    const updateResourceHints = () => {
      const metrics = resourceHintsManager.getMetrics();
      setState(prev => ({
        ...prev,
        resourceHints: metrics,
        lastUpdated: new Date(),
      }));
    };

    const interval = setInterval(updateResourceHints, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Generate comprehensive performance report
  const generateReport = useCallback(async (): Promise<PerformanceReport> => {
    const cwvReport = coreWebVitalsTracker.generateReport();
    const bundleReport = state.bundleMetrics ? await bundleAnalyzer.generateReport() : null;
    const resourceHintsReport = resourceHintsManager.generateReport();

    // Calculate overall score
    let totalScore = 0;
    let scoreCount = 0;

    // Core Web Vitals score (weighted heavily)
    totalScore += cwvReport.score * 0.5;
    scoreCount += 0.5;

    // Bundle optimization score
    if (bundleReport) {
      const bundleScore = calculateBundleScore(bundleReport);
      totalScore += bundleScore * 0.3;
      scoreCount += 0.3;
    }

    // Resource hints score
    const resourceHintsScore = calculateResourceHintsScore(resourceHintsReport);
    totalScore += resourceHintsScore * 0.2;
    scoreCount += 0.2;

    const overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return {
      overallScore,
      coreWebVitals: {
        metrics: coreWebVitalsTracker.getMetricsWithRatings(),
        score: cwvReport.score,
        recommendations: cwvReport.recommendations,
      },
      bundleAnalysis: bundleReport,
      resourceHints: resourceHintsReport,
    };
  }, [state.bundleMetrics]);

  // Preload critical resources for a route
  const preloadRouteAssets = useCallback((route: string) => {
    resourceHintsManager.preloadRouteAssets(route);
  }, []);

  // Setup preconnections for external domains
  const setupPreconnections = useCallback((origins: string[]) => {
    resourceHintsManager.setupPreconnections({
      origins,
      dns: [],
    });
  }, []);

  // Preload critical assets
  const preloadCriticalAssets = useCallback((config: {
    fonts?: string[];
    images?: string[];
    scripts?: string[];
    styles?: string[];
    critical?: string[];
  }) => {
    resourceHintsManager.preloadCriticalAssets({
      fonts: config.fonts || [],
      images: config.images || [],
      scripts: config.scripts || [],
      styles: config.styles || [],
      critical: config.critical || [],
    });
  }, []);

  // Get performance budget violations
  const checkPerformanceBudget = useCallback(() => {
    return coreWebVitalsTracker.generateReport();
  }, []);

  // Force refresh of all metrics
  const refreshMetrics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const cwvMetrics = coreWebVitalsTracker.getMetrics();
      const resourceHintsMetrics = resourceHintsManager.getMetrics();
      const bundleMetrics = await bundleAnalyzer.analyzeBundleMetrics();

      setState(prev => ({
        ...prev,
        coreWebVitals: cwvMetrics,
        resourceHints: resourceHintsMetrics,
        bundleMetrics,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    generateReport,
    preloadRouteAssets,
    setupPreconnections,
    preloadCriticalAssets,
    checkPerformanceBudget,
    refreshMetrics,
    
    // Utilities
    isPerformanceGood: state.coreWebVitals && Object.values(coreWebVitalsTracker.getMetricsWithRatings()).every(
      metric => metric.rating === 'good'
    ),
  };
}

// Helper function to calculate bundle optimization score
function calculateBundleScore(bundleReport: NonNullable<PerformanceReport['bundleAnalysis']>): number {
  let score = 100;

  // Deduct points for large bundle size
  const totalSizeKB = parseFloat(bundleReport.summary.totalSize.replace(/[^\d.]/g, ''));
  if (totalSizeKB > 1000) score -= 20; // > 1MB
  if (totalSizeKB > 2000) score -= 20; // > 2MB

  // Deduct points for poor compression
  const compressionRatio = parseFloat(bundleReport.summary.compressionRatio.replace('%', ''));
  if (compressionRatio > 80) score -= 15; // Poor compression

  // Deduct points for duplicates
  if (bundleReport.summary.duplicateCount > 0) {
    score -= Math.min(bundleReport.summary.duplicateCount * 5, 20);
  }

  // Deduct points for high-priority recommendations
  const highPriorityRecs = bundleReport.recommendations.filter(rec => rec.priority === 'high').length;
  score -= highPriorityRecs * 10;

  return Math.max(score, 0);
}

// Helper function to calculate resource hints score
function calculateResourceHintsScore(resourceHintsReport: PerformanceReport['resourceHints']): number {
  let score = 100;

  // Deduct points for low hit rate
  const hitRate = parseFloat(resourceHintsReport.summary.hitRate.replace('%', ''));
  if (hitRate < 50) score -= 30;
  if (hitRate < 25) score -= 20;

  // Deduct points for no preloading
  if (resourceHintsReport.summary.preloadedCount === 0) score -= 20;

  // Deduct points for no preconnections
  if (resourceHintsReport.summary.preconnectedCount === 0) score -= 10;

  // Deduct points for recommendations
  score -= Math.min(resourceHintsReport.summary.recommendations.length * 5, 20);

  return Math.max(score, 0);
}

// Performance monitoring context for app-wide usage
export const PerformanceMonitoringContext = createContext<ReturnType<typeof usePerformanceMonitoring> | null>(null);

export function usePerformanceMonitoringContext() {
  const context = useContext(PerformanceMonitoringContext);
  if (!context) {
    throw new Error('usePerformanceMonitoringContext must be used within a PerformanceMonitoringProvider');
  }
  return context;
}