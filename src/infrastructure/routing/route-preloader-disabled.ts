/**
 * Disabled route preloader - safe fallback to prevent crashes
 * This is a temporary measure while we fix navigation stability issues
 */

import { ComponentType } from "react";

export type PreloadStrategy = "immediate" | "hover" | "idle" | "on-demand" | "viewport";
export type Priority = "high" | "medium" | "low";
export type CacheStatus = "hit" | "miss" | "stale";

export interface RouteConfig {
  readonly path: string;
  readonly domain: string;
  readonly component: string;
  readonly strategy: PreloadStrategy;
  readonly priority: Priority;
  readonly dependencies?: readonly string[];
  readonly preloadData?: boolean;
  readonly estimatedSize?: number;
}

export interface PreloadMetrics {
  readonly route: string;
  readonly strategy: PreloadStrategy;
  readonly loadTime: number;
  readonly cacheHit: boolean;
  readonly timestamp: number;
  readonly success: boolean;
  readonly error?: string;
}

export interface RouteLoadingMetrics {
  readonly route: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly loadTime: number;
  readonly componentSize: number;
  readonly cacheStatus: CacheStatus;
  readonly preloadStrategy: PreloadStrategy;
  readonly success: boolean;
  readonly error?: Error;
}

export interface PreloadSummary {
  readonly totalPreloads: number;
  readonly successfulPreloads: number;
  readonly cacheHitRate: number;
  readonly averageLoadTime: number;
  readonly strategySummary: Readonly<Record<PreloadStrategy, number>>;
}

export interface MetricsReport {
  readonly preloadMetrics: readonly PreloadMetrics[];
  readonly routeLoadingMetrics: readonly RouteLoadingMetrics[];
  readonly summary: PreloadSummary;
}

/**
 * Disabled RoutePreloader class - all methods are no-ops to prevent crashes
 */
class DisabledRoutePreloader {
  private readonly emptyMetrics: MetricsReport = {
    preloadMetrics: [],
    routeLoadingMetrics: [],
    summary: {
      totalPreloads: 0,
      successfulPreloads: 0,
      cacheHitRate: 0,
      averageLoadTime: 0,
      strategySummary: {} as Record<PreloadStrategy, number>,
    },
  };

  // All methods are safe no-ops
  async preloadRoute(_route: string, _strategy: PreloadStrategy = "on-demand"): Promise<ComponentType<unknown> | null> {
    return null;
  }

  preloadImmediate(): void {
    // No-op
  }

  setupHoverPreloading(): void {
    // No-op
  }

  observeForPreloading(_element: HTMLElement, _route: string): void {
    // No-op
  }

  async getPreloadedComponent(_route: string): Promise<ComponentType<unknown> | null> {
    return null;
  }

  isPreloaded(_route: string): boolean {
    return false;
  }

  getMetrics(): MetricsReport {
    return this.emptyMetrics;
  }

  initialize(): void {
    console.warn('Route preloader is disabled for stability. Navigation will work normally without preloading.');
  }

  destroy(): void {
    // No-op
  }

  // Internal properties for compatibility
  get preloadedRoutes() {
    return new Map();
  }

  get preloadQueue() {
    return new Set();
  }

  getRouteConfig(_path: string) {
    return undefined;
  }

  getRouteDataEndpoints(_route: string) {
    return [];
  }
}

// Create singleton instance
const disabledPreloader = new DisabledRoutePreloader();

export const getRoutePreloader = (): DisabledRoutePreloader => {
  return disabledPreloader;
};

// Export for backward compatibility
export const routePreloader = {
  get instance() {
    return disabledPreloader;
  },
  
  async preloadRoute(route: string, strategy: PreloadStrategy = "on-demand") {
    return disabledPreloader.preloadRoute(route, strategy);
  },
  
  isPreloaded(route: string): boolean {
    return disabledPreloader.isPreloaded(route);
  },
  
  async getPreloadedComponent(route: string) {
    return disabledPreloader.getPreloadedComponent(route);
  },
  
  getMetrics() {
    return disabledPreloader.getMetrics();
  },
  
  observeForPreloading(element: HTMLElement, route: string): void {
    return disabledPreloader.observeForPreloading(element, route);
  },
  
  initialize(): void {
    return disabledPreloader.initialize();
  },
  
  destroy(): void {
    return disabledPreloader.destroy();
  },
  
  get preloadedRoutes() {
    return disabledPreloader.preloadedRoutes;
  },
  
  get preloadQueue() {
    return disabledPreloader.preloadQueue;
  },
  
  getRouteConfig(path: string) {
    return disabledPreloader.getRouteConfig(path);
  },
  
  getRouteDataEndpoints(route: string) {
    return disabledPreloader.getRouteDataEndpoints(route);
  }
};

// Remove development helper to prevent any potential issues
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  Object.defineProperty(window, '__routePreloader', {
    get: () => disabledPreloader,
    configurable: true
  });
}