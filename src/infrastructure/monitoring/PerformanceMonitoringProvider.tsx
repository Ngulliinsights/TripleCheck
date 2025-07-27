/**
 * Performance Monitoring Provider Component
 * Provides performance monitoring context to the entire application
 */

import React from "react";

import { MetricRating } from "./core-web-vitals";
import {
  usePerformanceMonitoring,
  PerformanceMonitoringContext,
  PerformanceReport,
} from "./usePerformanceMonitoring";

interface PerformanceMonitoringProviderProps {
  readonly children: React.ReactNode;
  readonly config?: {
    readonly enableAutoPreloading?: boolean;
    readonly preconnectOrigins?: readonly string[];
    readonly criticalAssets?: {
      readonly fonts?: readonly string[];
      readonly images?: readonly string[];
      readonly scripts?: readonly string[];
      readonly styles?: readonly string[];
    };
  };
}

export function PerformanceMonitoringProvider({
  children,
  config = {},
}: PerformanceMonitoringProviderProps) {
  const performanceMonitoring = usePerformanceMonitoring();

  // Initialize performance optimizations based on config
  React.useEffect(() => {
    const { preconnectOrigins = [], criticalAssets = {} } = config;

    // Setup preconnections for external origins
    if (preconnectOrigins.length > 0) {
      performanceMonitoring.setupPreconnections([...preconnectOrigins]);
    }

    // Preload critical assets
    if (Object.keys(criticalAssets).length > 0) {
      const mutableAssets: {
        fonts?: string[];
        images?: string[];
        scripts?: string[];
        styles?: string[];
      } = {};

      if (criticalAssets.fonts) {
        mutableAssets.fonts = [...criticalAssets.fonts];
      }
      if (criticalAssets.images) {
        mutableAssets.images = [...criticalAssets.images];
      }
      if (criticalAssets.scripts) {
        mutableAssets.scripts = [...criticalAssets.scripts];
      }
      if (criticalAssets.styles) {
        mutableAssets.styles = [...criticalAssets.styles];
      }

      performanceMonitoring.preloadCriticalAssets(mutableAssets);
    }

    // Setup common preconnections for typical external services
    const commonOrigins = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://api.openai.com",
      "https://maps.googleapis.com",
    ];

    performanceMonitoring.setupPreconnections(commonOrigins);
  }, [performanceMonitoring, config]);

  // Log performance issues in development
  React.useEffect(() => {
    if (import.meta.env.MODE === "development") {
      const checkPerformance = async () => {
        try {
          const report = await performanceMonitoring.generateReport();

          // Log performance warnings
          if (report.overallScore < 70) {
            devLogger.warn("🚨 Performance Score Low:", report.overallScore);

            if (report.coreWebVitals.score < 70) {
              devLogger.warn(
                "Core Web Vitals Issues:",
                report.coreWebVitals.recommendations
              );
            }

            if (
              report.bundleAnalysis &&
              report.bundleAnalysis.recommendations.length > 0
            ) {
              devLogger.warn(
                "Bundle Optimization Opportunities:",
                report.bundleAnalysis.recommendations
              );
            }

            if (report.resourceHints.summary.recommendations.length > 0) {
              devLogger.warn(
                "Resource Hints Recommendations:",
                report.resourceHints.summary.recommendations
              );
            }
          } else {
            devLogger.log("✅ Performance Score Good:", report.overallScore);
          }
        } catch (error) {
          devLogger.warn("Failed to generate performance report:", error);
        }
      };

      // Check performance after initial load
      const timer = setTimeout(checkPerformance, 5000);
      return () => clearTimeout(timer);
    }

    // Always return a cleanup function to satisfy TypeScript
    return () => {};
  }, [performanceMonitoring]);

  return (
    <PerformanceMonitoringContext.Provider value={performanceMonitoring}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
}

// Performance debugging component for development

// Development-only logger
const devLogger = {
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]) => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (import.meta.env.MODE === "development") {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  },
};

// Helper functions for color determination
const getScoreColor = (score: number): string => {
  if (score >= 80) return "green";
  if (score >= 60) return "orange";
  return "red";
};

const getRatingColor = (rating: MetricRating): string => {
  switch (rating) {
    case "good":
      return "green";
    case "needs-improvement":
      return "orange";
    case "poor":
      return "red";
    default:
      return "black";
  }
};

export function PerformanceDebugger() {
  const performanceMonitoring = React.useContext(PerformanceMonitoringContext);
  const [report, setReport] = React.useState<PerformanceReport | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  if (!performanceMonitoring || process.env.NODE_ENV !== "development") {
    return null;
  }

  const generateReport = async () => {
    try {
      const newReport = await performanceMonitoring.generateReport();
      setReport(newReport);
      setIsVisible(true);
    } catch (error) {
      // Log error in development mode for debugging
      devLogger.error("Failed to generate performance report:", error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          type="button"
          onClick={generateReport}
          className="bg-blue-600 text-white border-0 rounded-full w-16 h-16 text-2xl cursor-pointer shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          title="Performance Report"
        >
          ⚡
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-5 right-5 w-96 max-h-[80vh] bg-white border border-gray-300 rounded-lg p-4 shadow-xl z-[9999] overflow-auto text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 font-semibold">Performance Report</h3>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="bg-transparent border-0 text-lg cursor-pointer hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {report && (
        <div>
          <div className="mb-4">
            <strong>Overall Score: </strong>
            <span
              className={`font-bold ${
                report.overallScore >= 80 ? "text-green-600" :
                report.overallScore >= 60 ? "text-orange-600" :
                "text-red-600"
              }`}
            >
              {report.overallScore}/100
            </span>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Core Web Vitals</h4>
            <div className="text-xs">
              {Object.entries(report.coreWebVitals.metrics).map(
                ([key, metric]: [
                  string,
                  { value: number | null; rating: MetricRating },
                ]) => (
                  <div key={key} className="mb-1">
                    <strong>{key.toUpperCase()}:</strong>{" "}
                    {metric.value !== null ? metric.value : "N/A"}
                    <span
                      className={`ml-2 ${
                        metric.rating === "good" ? "text-green-600" :
                        metric.rating === "needs-improvement" ? "text-orange-600" :
                        metric.rating === "poor" ? "text-red-600" :
                        "text-gray-600"
                      }`}
                    >
                      ({metric.rating})
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {report.bundleAnalysis && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Bundle Analysis</h4>
              <div className="text-xs">
                <div>Total Size: {report.bundleAnalysis.summary.totalSize}</div>
                <div>Gzipped: {report.bundleAnalysis.summary.gzippedSize}</div>
                <div>Chunks: {report.bundleAnalysis.summary.chunkCount}</div>
                <div>
                  Potential Savings: {report.bundleAnalysis.potentialSavings}
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Resource Hints</h4>
            <div className="text-xs">
              <div>
                Preloaded: {report.resourceHints.summary.preloadedCount}
              </div>
              <div>
                Prefetched: {report.resourceHints.summary.prefetchedCount}
              </div>
              <div>Hit Rate: {report.resourceHints.summary.hitRate}</div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={generateReport}
              className="bg-blue-600 text-white border-0 rounded px-4 py-2 cursor-pointer text-xs hover:bg-blue-700 transition-colors"
            >
              Refresh Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
