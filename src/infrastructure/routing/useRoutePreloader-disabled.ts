/**
 * Disabled useRoutePreloader hook - safe fallback to prevent crashes
 * This is a temporary measure while we fix navigation stability issues
 */

import { useMemo } from "react";

import {
  PreloadStrategy,
  PreloadMetrics,
  RouteLoadingMetrics,
} from "./route-preloader-disabled";

export interface UseRoutePreloaderOptions {
  enableHoverPreloading?: boolean;
  enableViewportPreloading?: boolean;
  preloadOnMount?: string[];
  strategy?: PreloadStrategy;
}

export interface RoutePreloaderState {
  isPreloading: boolean;
  preloadedRoutes: string[];
  metrics: {
    preloadMetrics: PreloadMetrics[];
    routeLoadingMetrics: RouteLoadingMetrics[];
    summary: {
      totalPreloads: number;
      successfulPreloads: number;
      cacheHitRate: number;
      averageLoadTime: number;
      strategySummary: Record<PreloadStrategy, number>;
    };
  };
}

/**
 * Disabled useRoutePreloader hook - all functionality is no-op to prevent crashes
 */
export function useRoutePreloader(_options: UseRoutePreloaderOptions = {}) {
  const emptyState: RoutePreloaderState = {
    isPreloading: false,
    preloadedRoutes: [],
    metrics: {
      preloadMetrics: [],
      routeLoadingMetrics: [],
      summary: {
        totalPreloads: 0,
        successfulPreloads: 0,
        cacheHitRate: 0,
        averageLoadTime: 0,
        strategySummary: {} as Record<PreloadStrategy, number>,
      },
    },
  };

  // All functions are safe no-ops
  const preloadRoute = async (_route: string, _strategy?: PreloadStrategy) => {
    return false;
  };

  const isPreloaded = (_route: string) => {
    return false;
  };

  const getPreloadedComponent = async (_route: string) => {
    return null;
  };

  const setupHoverPreloading = (_element: HTMLElement, _route: string) => {
    return () => {}; // Return empty cleanup function
  };

  const setupViewportPreloading = (_element: HTMLElement, _route: string) => {
    return () => {}; // Return empty cleanup function
  };

  const preloadByUserBehavior = async (_routes: string[]) => {
    // No-op
  };

  const preloadDomainRoutes = async (_domain: string) => {
    // No-op
  };

  const getPerformanceInsights = [];

  const updateMetrics = () => {
    // No-op
  };

  const cleanup = () => {
    // No-op
  };

  // Return memoized object to prevent object recreation
  return useMemo(
    () => ({
      // State
      ...emptyState,

      // Actions
      preloadRoute,
      isPreloaded,
      getPreloadedComponent,
      setupHoverPreloading,
      setupViewportPreloading,
      preloadByUserBehavior,
      preloadDomainRoutes,

      // Utilities
      getPerformanceInsights,
      updateMetrics,
      cleanup,

      // Computed values
      hasPreloadedRoutes: false,
      preloadSuccessRate: 0,
    }),
    []
  );
}

/**
 * Disabled useRouteLoadingTracker hook
 */
export function useRouteLoadingTracker() {
  return useMemo(
    () => ({
      currentRoute: "",
      loadingMetrics: [],
      getAverageLoadTime: () => 0,
      getSlowestRoute: () => null,
      getFastestRoute: () => null,
      cacheHitRate: 0,
    }),
    []
  );
}

/**
 * Disabled useSmartPreloading hook
 */
export function useSmartPreloading() {
  return useMemo(
    () => ({
      userBehavior: {
        hoveredLinks: new Set<string>(),
        scrolledSections: new Set<string>(),
        clickedCategories: new Set<string>(),
      },
      predictNextRoutes: () => [],
      preloadPredictedRoutes: async () => {},
    }),
    []
  );
}