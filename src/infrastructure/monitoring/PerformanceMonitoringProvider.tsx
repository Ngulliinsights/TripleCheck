/**
 * Performance Monitoring Provider Component
 * Provides performance monitoring context to the entire application
 *
 * This component serves as the central hub for performance monitoring,
 * handling initialization, configuration, and development-time debugging.
 */

import React, {
  useEffect,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

import { MetricRating } from "./core-web-vitals";
import {
  usePerformanceMonitoring,
  PerformanceMonitoringContext,
  PerformanceReport,
} from "./usePerformanceMonitoring";

// Type definitions for better type safety and clarity
interface CriticalAssets {
  readonly fonts?: readonly string[];
  readonly images?: readonly string[];
  readonly scripts?: readonly string[];
  readonly styles?: readonly string[];
}

interface PerformanceConfig {
  readonly enableAutoPreloading?: boolean;
  readonly preconnectOrigins?: readonly string[];
  readonly criticalAssets?: CriticalAssets;
  readonly performanceThreshold?: number; // Overall performance score threshold
  readonly documentIntelligenceThreshold?: {
    readonly maxProcessingTime?: number;
    readonly maxErrorRate?: number;
  };
}

interface PerformanceMonitoringProviderProps {
  readonly children: React.ReactNode;
  readonly config?: PerformanceConfig;
}

// Enhanced type definition for document intelligence to avoid 'any' usage
interface DocumentIntelligenceMetrics {
  readonly averageProcessingTime: number;
  readonly errorRate: number;
}

// Type-safe extension of PerformanceReport to include document intelligence
interface ExtendedPerformanceReport extends PerformanceReport {
  readonly documentIntelligence?: DocumentIntelligenceMetrics;
}

// Constants moved outside component to prevent recreation on each render
const DEFAULT_PERFORMANCE_THRESHOLD = 70;
const DEFAULT_PROCESSING_TIME_THRESHOLD = 5000;
const DEFAULT_ERROR_RATE_THRESHOLD = 0.05;
const PERFORMANCE_CHECK_DELAY = 5000;

// Common external origins that most applications will benefit from preconnecting to
const COMMON_PRECONNECT_ORIGINS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://api.openai.com",
  "https://maps.googleapis.com",
] as const;

// Type-safe asset keys to prevent object injection vulnerabilities

/**
 * Transforms readonly critical assets config into a mutable format
 * This function uses explicit property access to prevent security issues
 */
const transformCriticalAssets = (criticalAssets: CriticalAssets) => {
  const mutableAssets: {
    fonts?: string[];
    images?: string[];
    scripts?: string[];
    styles?: string[];
  } = {};

  // Using explicit property checks instead of dynamic access for security
  if (criticalAssets.fonts && criticalAssets.fonts.length > 0) {
    mutableAssets.fonts = [...criticalAssets.fonts];
  }
  if (criticalAssets.images && criticalAssets.images.length > 0) {
    mutableAssets.images = [...criticalAssets.images];
  }
  if (criticalAssets.scripts && criticalAssets.scripts.length > 0) {
    mutableAssets.scripts = [...criticalAssets.scripts];
  }
  if (criticalAssets.styles && criticalAssets.styles.length > 0) {
    mutableAssets.styles = [...criticalAssets.styles];
  }

  return mutableAssets;
};

export function PerformanceMonitoringProvider({
  children,
  config = {},
}: PerformanceMonitoringProviderProps) {
  const performanceMonitoring = usePerformanceMonitoring();

  // Memoize configuration values to prevent unnecessary re-initialization
  const {
    preconnectOrigins = [],
    criticalAssets = {},
    performanceThreshold = DEFAULT_PERFORMANCE_THRESHOLD,
    documentIntelligenceThreshold = {},
  } = useMemo(() => config, [config]);

  const {
    maxProcessingTime = DEFAULT_PROCESSING_TIME_THRESHOLD,
    maxErrorRate = DEFAULT_ERROR_RATE_THRESHOLD,
  } = documentIntelligenceThreshold;

  // Initialize performance optimizations based on configuration
  useEffect(() => {
    // Setup preconnections for user-specified external origins
    if (preconnectOrigins.length > 0) {
      performanceMonitoring.setupPreconnections([...preconnectOrigins]);
    }

    // Preload critical assets if any are specified
    if (Object.keys(criticalAssets).length > 0) {
      const mutableAssets = transformCriticalAssets(criticalAssets);
      performanceMonitoring.preloadCriticalAssets(mutableAssets);
    }

    // Setup common preconnections that benefit most applications
    // This is done separately so user-specified origins take priority
    performanceMonitoring.setupPreconnections([...COMMON_PRECONNECT_ORIGINS]);
  }, [performanceMonitoring, preconnectOrigins, criticalAssets]);

  // Development-only performance monitoring with configurable thresholds
  useEffect(() => {
    // Early return if not in development mode
    if (import.meta.env.MODE !== "development") {
      return;
    }

    const checkPerformance = async () => {
      try {
        // Use type-safe cast with proper typing instead of 'any'
        const report =
          (await performanceMonitoring.generateReport()) as ExtendedPerformanceReport;

        // Log performance warnings based on configurable threshold
        if (report.overallScore < performanceThreshold) {
          devLogger.warn("🚨 Performance Score Low:", report.overallScore);

          // Check Core Web Vitals performance
          if (report.coreWebVitals.score < performanceThreshold) {
            devLogger.warn(
              "Core Web Vitals Issues:",
              report.coreWebVitals.recommendations
            );
          }

          // Check bundle optimization opportunities
          if (
            report.bundleAnalysis &&
            report.bundleAnalysis.recommendations.length > 0
          ) {
            devLogger.warn(
              "Bundle Optimization Opportunities:",
              report.bundleAnalysis.recommendations
            );
          }

          // Check resource hints performance
          if (report.resourceHints.summary.recommendations.length > 0) {
            devLogger.warn(
              "Resource Hints Recommendations:",
              report.resourceHints.summary.recommendations
            );
          }
        } else {
          devLogger.log("✅ Performance Score Good:", report.overallScore);
        }

        // Monitor document intelligence performance with configurable thresholds
        // Now using proper destructuring as recommended by ESLint
        const { documentIntelligence } = report;
        if (documentIntelligence) {
          const { averageProcessingTime, errorRate } = documentIntelligence;

          if (averageProcessingTime > maxProcessingTime) {
            devLogger.warn(
              "⚠️ Document processing slow:",
              `${averageProcessingTime}ms (threshold: ${maxProcessingTime}ms)`
            );
          }
          if (errorRate > maxErrorRate) {
            devLogger.warn(
              "⚠️ Document processing error rate high:",
              `${(errorRate * 100).toFixed(1)}% (threshold: ${(maxErrorRate * 100).toFixed(1)}%)`
            );
          }
        }
      } catch (error) {
        devLogger.warn("Failed to generate performance report:", error);
      }
    };

    // Check performance after initial load with cleanup
    const timer = setTimeout(checkPerformance, PERFORMANCE_CHECK_DELAY);
    return () => clearTimeout(timer);
  }, [
    performanceMonitoring,
    performanceThreshold,
    maxProcessingTime,
    maxErrorRate,
  ]);

  return (
    <PerformanceMonitoringContext.Provider value={performanceMonitoring}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
}

/**
 * Development-only logger with consistent interface
 * Centralizes all console operations and provides type safety
 */
const devLogger = {
  warn: (message: string, ...args: unknown[]): void => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]): void => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]): void => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  },
} as const;

/**
 * Type-safe metric entry interface to prevent object injection issues
 * This ensures we only work with known metric types
 */
interface MetricEntry {
  readonly value: number | null;
  readonly rating: MetricRating;
}

/**
 * Determines the appropriate color class based on performance score
 * Uses a clear scoring system that matches web performance standards
 */
const getScoreColorClass = (score: number): string => {
  if (score >= 80) return "text-green-600"; // Good performance
  if (score >= 60) return "text-orange-600"; // Needs improvement
  return "text-red-600"; // Poor performance
};

/**
 * Maps metric ratings to their corresponding color classes
 * Provides visual consistency across all performance metrics
 */
const getRatingColorClass = (rating: MetricRating): string => {
  // Using explicit switch statement instead of object access for security
  switch (rating) {
    case "good":
      return "text-green-600";
    case "needs-improvement":
      return "text-orange-600";
    case "poor":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

/**
 * Performance debugging component for development environments
 *
 * This component provides a floating debug interface that allows developers
 * to generate and view performance reports in real-time during development.
 * It automatically hides itself in production builds.
 *
 * Note: All hooks are called before any conditional returns to comply with Rules of Hooks
 */
export function PerformanceDebugger() {
  const performanceMonitoring = useContext(PerformanceMonitoringContext);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Generates a new performance report with loading state management
   * This hook is called unconditionally to comply with Rules of Hooks
   */
  const generateReport = useCallback(async (): Promise<void> => {
    if (!performanceMonitoring) {
      devLogger.error("Performance monitoring is not available");
      return;
    }

    setIsLoading(true);
    try {
      const newReport = await performanceMonitoring.generateReport();
      setReport(newReport);
      setIsVisible(true);
    } catch (error) {
      devLogger.error("Failed to generate performance report:", error);
    } finally {
      setIsLoading(false);
    }
  }, [performanceMonitoring]);

  /**
   * Closes the performance report panel
   * This hook is called unconditionally to comply with Rules of Hooks
   */
  const closeReport = useCallback((): void => {
    setIsVisible(false);
  }, []);

  // Early return AFTER all hooks have been called
  // This ensures compliance with the Rules of Hooks
  if (!performanceMonitoring || process.env.NODE_ENV !== "development") {
    return null;
  }

  // Render floating action button when report is not visible
  if (!isVisible) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          type="button"
          onClick={generateReport}
          disabled={isLoading}
          className={`
            border-0 rounded-full w-16 h-16 text-2xl cursor-pointer shadow-lg 
            transition-all duration-200 flex items-center justify-center
            ${
              isLoading ?
                "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
            }
          `}
          title={isLoading ? "Generating Report..." : "Performance Report"}
          aria-label={
            isLoading ?
              "Generating Performance Report"
            : "Generate Performance Report"
          }
        >
          {isLoading ? "⏳" : "⚡"}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-5 right-5 w-96 max-h-[80vh] bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] overflow-hidden text-sm">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="m-0 font-semibold text-gray-800">Performance Report</h3>
        <button
          type="button"
          onClick={closeReport}
          className="bg-transparent border-0 text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close Performance Report"
        >
          ×
        </button>
      </div>

      {/* Report content with scrollable area */}
      <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)]">
        {report && (
          <div className="space-y-4">
            {/* Overall Score Section */}
            <div>
              <strong>Overall Score: </strong>
              <span
                className={`font-bold ${getScoreColorClass(report.overallScore)}`}
              >
                {report.overallScore}/100
              </span>
            </div>

            {/* Core Web Vitals Section */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-800">
                Core Web Vitals
              </h4>
              <div className="space-y-1 text-xs">
                {Object.entries(report.coreWebVitals.metrics).map(
                  ([key, metric]: [string, MetricEntry]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center"
                    >
                      <span>
                        <strong>{key.toUpperCase()}:</strong>{" "}
                        {metric.value !== null ? metric.value : "N/A"}
                      </span>
                      <span
                        className={`ml-2 font-medium ${getRatingColorClass(metric.rating)}`}
                      >
                        ({metric.rating})
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Bundle Analysis Section */}
            {report.bundleAnalysis && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">
                  Bundle Analysis
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.totalSize}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gzipped:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.gzippedSize}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chunks:</span>
                    <span className="font-mono">
                      {report.bundleAnalysis.summary.chunkCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Savings:</span>
                    <span className="font-mono text-orange-600">
                      {report.bundleAnalysis.potentialSavings}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Resource Hints Section */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-800">
                Resource Hints
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Preloaded:</span>
                  <span className="font-mono">
                    {report.resourceHints.summary.preloadedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Prefetched:</span>
                  <span className="font-mono">
                    {report.resourceHints.summary.prefetchedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hit Rate:</span>
                  <span className="font-mono text-green-600">
                    {report.resourceHints.summary.hitRate}
                  </span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={generateReport}
                disabled={isLoading}
                className={`
                  w-full border-0 rounded px-4 py-2 cursor-pointer text-xs 
                  transition-colors duration-200
                  ${
                    isLoading ?
                      "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                `}
              >
                {isLoading ? "Generating..." : "Refresh Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
