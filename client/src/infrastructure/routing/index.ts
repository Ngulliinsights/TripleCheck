/**
 * Route preloading infrastructure exports
 * Provides centralized access to all route optimization functionality
 */

import { routePreloader as routePreloaderInstance } from './route-preloader'

export { routePreloader } from './route-preloader'
export type { 
  PreloadStrategy, 
  RouteConfig, 
  PreloadMetrics, 
  RouteLoadingMetrics 
} from './route-preloader'

export { 
  useRoutePreloader, 
  useRouteLoadingTracker, 
  useSmartPreloading 
} from './useRoutePreloader'
export type { 
  UseRoutePreloaderOptions, 
  RoutePreloaderState 
} from './useRoutePreloader'

// RoutePerformanceMonitor moved to tests/manual/components/ (Phase 8 infrastructure purity)

// Convenience re-exports for common use cases
export const preloadStrategies = {
  immediate: 'immediate' as const,
  hover: 'hover' as const,
  idle: 'idle' as const,
  onDemand: 'on-demand' as const,
  viewport: 'viewport' as const,
};

// Route preloading utilities
export const routeUtils = {
  /**
   * Preload critical routes immediately
   */
  preloadCritical: () => {
    // No-op for disabled preloader
  },
  
  /**
   * Check if route preloading is supported
   */
  isSupported: () => {
    return typeof window !== 'undefined' && 'requestIdleCallback' in window;
  },
  
  /**
   * Get current preloading metrics
   */
  getMetrics: () => {
    return routePreloaderInstance.getMetrics();
  },
  
  /**
   * Initialize route preloading with custom configuration
   */
  initialize: (config?: {
    enableHover?: boolean;
    enableIdle?: boolean;
    enableViewport?: boolean;
  }) => {
    const { enableHover = true, enableIdle = true, enableViewport = true } = config || {};
    
    if (enableHover) {
      // No-op for disabled preloader
    }
    
    if (enableIdle || enableViewport) {
      routePreloaderInstance.initialize();
    }
    
    console.log('🚀 Route preloading initialized with configuration:', config);
  },
};

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__routePreloadingUtils = {
    preloader: routePreloaderInstance,
    utils: routeUtils,
    getMetrics: () => routePreloaderInstance.getMetrics(),
    logMetrics: () => console.table(routePreloaderInstance.getMetrics().summary),
  };
}