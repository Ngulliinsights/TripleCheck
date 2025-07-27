/**
 * Route preloading infrastructure exports
 * Provides centralized access to all route optimization functionality
 */

export { routePreloader } from './route-preloader';
export type { 
  PreloadStrategy, 
  RouteConfig, 
  PreloadMetrics, 
  RouteLoadingMetrics 
} from './route-preloader';

export { 
  useRoutePreloader, 
  useRouteLoadingTracker, 
  useSmartPreloading 
} from './useRoutePreloader';
export type { 
  UseRoutePreloaderOptions, 
  RoutePreloaderState 
} from './useRoutePreloader';

export { 
  RoutePerformanceMonitor, 
  RoutePerformanceDashboard 
} from './RoutePerformanceMonitor';

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
    routePreloader.preloadImmediate();
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
    return routePreloader.getMetrics();
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
      routePreloader.setupHoverPreloading();
    }
    
    if (enableIdle || enableViewport) {
      routePreloader.initialize();
    }
    
    console.log('🚀 Route preloading initialized with configuration:', config);
  },
};

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__routePreloadingUtils = {
    preloader: routePreloader,
    utils: routeUtils,
    getMetrics: () => routePreloader.getMetrics(),
    logMetrics: () => console.table(routePreloader.getMetrics().summary),
  };
}