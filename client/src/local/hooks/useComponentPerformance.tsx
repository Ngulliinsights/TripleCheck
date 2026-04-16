import React, { useCallback, useEffect, useRef } from "react"

// ------------------------------------------------------------------
// Types and Interfaces
// ------------------------------------------------------------------

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  propsCount: number;
  timestamp: number;
}

interface ComponentPerformanceOptions {
  componentName: string;
  enabled?: boolean | undefined;
  threshold?: number | undefined; // ms - log if render time exceeds this
  trackRenders?: boolean | undefined; // Whether to automatically track renders
}

interface ComponentPerformanceReturn {
  // Performance tracking
  trackApiCall: (data: unknown) => void;
  trackRender: () => void;

  // Stats and metrics
  getStats: () => PerformanceStats;
  renderCount: number;
  averageRenderTime: number;

  // Control
  reset: () => void;
}

interface PerformanceStats {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

// ------------------------------------------------------------------
// Enhanced Component Performance Hook (consolidated from usePerformanceMonitor)
// ------------------------------------------------------------------

/**
 * Enhanced component performance monitoring hook
 * Consolidates functionality from usePerformanceMonitor and useComponentPerformance
 *
 * @param options - Configuration options for performance monitoring
 * @returns Performance monitoring functions and metrics
 */
export const useComponentPerformance = (
  options: ComponentPerformanceOptions | string
): ComponentPerformanceReturn => {
  // Handle both old and new API signatures for backward compatibility
  const config =
    typeof options === "string" ?
      { 
        componentName: options, 
        trackRenders: true,
        enabled: process.env.NODE_ENV === "development",
        threshold: 16
      }
    : {
        trackRenders: true,
        enabled: process.env.NODE_ENV === "development",
        threshold: 16, // 16ms = 60fps
        ...options,
      };

  const { componentName, enabled = false, threshold = 16, trackRenders = true } = config;

  // Performance tracking refs
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);

  // Start timing at the beginning of render
  if (enabled && trackRenders && window?.performance) {
    renderStartTime.current = window.performance.now();
  }

  const logMetrics = useCallback(
    (metrics: PerformanceMetrics) => {
      if (!enabled) return;

      if (metrics.renderTime > threshold) {
        // eslint-disable-next-line no-console
        console.warn(`🐌 Slow render detected in ${metrics.componentName}:`, {
          renderTime: `${metrics.renderTime.toFixed(2)}ms`,
          propsCount: metrics.propsCount,
          timestamp: new Date(metrics.timestamp).toISOString(),
        });
      }

      // Log performance summary every 100 renders
      if (renderCount.current % 100 === 0 && renderCount.current > 0) {
        const avgRenderTime = totalRenderTime.current / renderCount.current;
        // eslint-disable-next-line no-console
        console.info(`📊 Performance summary for ${componentName}:`, {
          totalRenders: renderCount.current,
          averageRenderTime: `${avgRenderTime.toFixed(2)}ms`,
          totalTime: `${totalRenderTime.current.toFixed(2)}ms`,
        });
      }
    },
    [enabled, threshold, componentName]
  );

  // Track API calls with data
  const trackApiCall = useCallback(
    (data: unknown) => {
      if (!enabled) return;

      // eslint-disable-next-line no-console
      console.debug(`📡 API call tracked for ${componentName}:`, {
        timestamp: new Date().toISOString(),
        data:
          typeof data === "object" ?
            `${JSON.stringify(data).slice(0, 100)}...`
          : data,
      });
    },
    [enabled, componentName]
  );

  // Manually track renders
  const trackRender = useCallback(() => {
    if (!enabled || !window?.performance) return;

    const currentTime = window.performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    renderCount.current += 1;
    totalRenderTime.current += renderTime;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      propsCount: 0, // Could be enhanced to count actual props
      timestamp: Date.now(),
    };

    logMetrics(metrics);
  }, [enabled, componentName, logMetrics]);

  // Get current stats
  const getStats = useCallback(() => {
    return {
      componentName,
      renderCount: renderCount.current,
      totalRenderTime: totalRenderTime.current,
      averageRenderTime:
        renderCount.current > 0 ?
          totalRenderTime.current / renderCount.current
        : 0,
      lastRenderTime: lastRenderTime.current,
    };
  }, [componentName]);

  // Reset stats for this component
  const reset = useCallback(() => {
    renderCount.current = 0;
    totalRenderTime.current = 0;
    lastRenderTime.current = window?.performance ? window.performance.now() : 0;
  }, []);

  // Auto-track renders if enabled
  useEffect(() => {
    if (!enabled || !trackRenders || !window?.performance) return;

    const renderEndTime = window.performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    renderCount.current += 1;
    totalRenderTime.current += renderTime;
    lastRenderTime.current = renderEndTime;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      propsCount: 0, // Could be enhanced to count actual props
      timestamp: Date.now(),
    };

    logMetrics(metrics);
  });

  return {
    trackApiCall,
    trackRender,
    getStats,
    reset,
    renderCount: renderCount.current,
    averageRenderTime:
      renderCount.current > 0 ?
        totalRenderTime.current / renderCount.current
      : 0,
  };
};

// ------------------------------------------------------------------
// Higher-Order Component (consolidated from usePerformanceMonitor)
// ------------------------------------------------------------------

/**
 * Higher-order component to add performance monitoring to any component
 * Consolidated from usePerformanceMonitor for backward compatibility
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    useComponentPerformance({
      componentName:
        componentName || Component.displayName || Component.name || "Unknown",
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitor(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ------------------------------------------------------------------
// Compatibility Layer (for usePerformanceMonitor migration)
// ------------------------------------------------------------------

interface UsePerformanceMonitorOptions {
  componentName: string;
  enabled?: boolean | undefined;
  threshold?: number | undefined;
}

/**
 * Compatibility function for usePerformanceMonitor migration
 * Maps old usePerformanceMonitor API to new useComponentPerformance API
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const result = useComponentPerformance({
    componentName: options.componentName,
    enabled: options.enabled ?? process.env.NODE_ENV === "development",
    threshold: options.threshold ?? 16,
    trackRenders: true,
  });

  // Return API that matches old usePerformanceMonitor
  return {
    renderCount: result.renderCount,
    averageRenderTime: result.averageRenderTime,
  };
}

export default useComponentPerformance;
