/**
 * Advanced route preloading system with multiple strategies
 * Implements immediate, hover, idle, and on-demand loading patterns
 * Aligned with domain-driven architecture for optimal code splitting
 */

import { ComponentType } from "react";

export type PreloadStrategy =
  | "immediate"
  | "hover"
  | "idle"
  | "on-demand"
  | "viewport";
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
  readonly estimatedSize?: number; // in KB
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

interface IdleCallbackOptions {
  timeout?: number;
}

interface IdleCallbackDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type IdleCallback = (deadline: IdleCallbackDeadline) => void;

declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleCallback,
      options?: IdleCallbackOptions
    ) => number;
    cancelIdleCallback: (id: number) => void;
  }
}

// Constants
const IDLE_TIMEOUT = 2000; // 2 seconds of inactivity
const HOVER_DELAY = 100; // 100ms hover delay
const VIEWPORT_MARGIN = "100px";
const VIEWPORT_THRESHOLD = 0.1;
const MAX_METRICS_HISTORY = 1000;
const DEFAULT_COMPONENT_SIZE = 50; // KB
const IDLE_CALLBACK_TIMEOUT = 5000;

class RoutePreloader {
  private readonly preloadedRoutes = new Map<
    string,
    Promise<ComponentType<unknown>>
  >();
  private readonly preloadMetrics: PreloadMetrics[] = [];
  private readonly routeLoadingMetrics: RouteLoadingMetrics[] = [];
  private readonly preloadQueue = new Set<string>();
  private readonly hoverTimeouts = new Map<string, number>();

  private isIdle = false;
  private intersectionObserver?: IntersectionObserver;
  private idleTimer?: number;
  private isDestroyed = false;

  constructor() {
    // Don't initialize automatically - wait for explicit initialization
    // This prevents crashes when the constructor runs before DOM is ready
  }

  // Route configurations aligned with domain structure
  private readonly routeConfigs: readonly RouteConfig[] = [
    // Critical routes - immediate preload
    {
      path: "/",
      domain: "shared",
      component: "Home",
      strategy: "immediate",
      priority: "high",
      estimatedSize: 80,
    },
    {
      path: "/auth/login",
      domain: "auth",
      component: "Login",
      strategy: "immediate",
      priority: "high",
      estimatedSize: 45,
    },

    // Property domain - hover preload for high engagement
    {
      path: "/property/:id",
      domain: "property",
      component: "PropertyDetails",
      strategy: "hover",
      priority: "high",
      dependencies: ["PropertyCard", "TrustScore"],
      preloadData: true,
      estimatedSize: 120,
    },
    {
      path: "/properties",
      domain: "property",
      component: "Properties",
      strategy: "hover",
      priority: "medium",
      estimatedSize: 90,
    },
    {
      path: "/compare",
      domain: "property",
      component: "PropertyCompare",
      strategy: "idle",
      priority: "medium",
      estimatedSize: 75,
    },

    // User domain - idle preload after authentication
    {
      path: "/dashboard",
      domain: "user",
      component: "Dashboard",
      strategy: "idle",
      priority: "high",
      estimatedSize: 100,
    },
    {
      path: "/team",
      domain: "user",
      component: "Team",
      strategy: "on-demand",
      priority: "low",
      estimatedSize: 60,
    },

    // Trust domain - hover preload for services
    {
      path: "/services/basic-checks",
      domain: "trust",
      component: "BasicChecks",
      strategy: "hover",
      priority: "medium",
      estimatedSize: 70,
    },
    {
      path: "/services/fraud-detection",
      domain: "trust",
      component: "FraudDetection",
      strategy: "hover",
      priority: "medium",
      estimatedSize: 85,
    },

    // Search domain - immediate preload for core functionality
    {
      path: "/search",
      domain: "search",
      component: "SearchResults",
      strategy: "immediate",
      priority: "high",
      dependencies: ["PropertySearch"],
      estimatedSize: 95,
    },

    // Communication domain - idle preload
    {
      path: "/inbox",
      domain: "communication",
      component: "Inbox",
      strategy: "idle",
      priority: "medium",
      estimatedSize: 65,
    },

    // Shared domain - various strategies based on usage
    {
      path: "/features",
      domain: "shared",
      component: "Features",
      strategy: "hover",
      priority: "medium",
      estimatedSize: 55,
    },
    {
      path: "/pricing",
      domain: "shared",
      component: "Pricing",
      strategy: "hover",
      priority: "high",
      estimatedSize: 50,
    },
    {
      path: "/help",
      domain: "shared",
      component: "Help",
      strategy: "on-demand",
      priority: "low",
      estimatedSize: 40,
    },
    {
      path: "/community",
      domain: "shared",
      component: "Community",
      strategy: "hover",
      priority: "medium",
      estimatedSize: 85,
      preloadData: true,
    },
    {
      path: "/fraud-resources",
      domain: "shared",
      component: "Fraud-resources",
      strategy: "hover",
      priority: "high",
      estimatedSize: 95,
    },
    {
      path: "/resources/fraud",
      domain: "shared",
      component: "Fraud-resources",
      strategy: "hover",
      priority: "high",
      estimatedSize: 95,
    },
  ] as const;

  private initializeIdleDetection(): void {
    if (this.isDestroyed) return;

    const scheduleIdleWork = (callback: () => void): void => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => callback(), {
          timeout: IDLE_CALLBACK_TIMEOUT,
        });
      } else {
        setTimeout(callback, HOVER_DELAY);
      }
    };

    const resetIdleTimer = (): void => {
      if (this.isDestroyed) return;

      this.isIdle = false;
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }

      this.idleTimer = window.setTimeout(() => {
        if (!this.isDestroyed) {
          this.isIdle = true;
          this.processIdlePreloads();
        }
      }, IDLE_TIMEOUT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ] as const;
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    scheduleIdleWork(() => {
      if (!this.isDestroyed) {
        this.isIdle = true;
        this.processIdlePreloads();
      }
    });
  }

  private initializeViewportObserver(): void {
    if (!("IntersectionObserver" in window) || this.isDestroyed) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (this.isDestroyed) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const route = element.dataset.preloadRoute;
            if (route) {
              this.preloadRoute(route, "viewport").catch((_error) => {
                // Silently handle viewport preload failures
              });
            }
          }
        });
      },
      {
        rootMargin: VIEWPORT_MARGIN,
        threshold: VIEWPORT_THRESHOLD,
      }
    );
  }

  private setupPerformanceTracking(): void {
    if (this.isDestroyed) return;

    const trackNavigation = (path: string): void => {
      if (this.isDestroyed) return;
      this.trackRouteNavigation(path);
    };

    // Store original methods
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history
    );

    // Override history methods
    window.history.pushState = (data, title, url) => {
      const result = originalPushState(data, title, url);
      if (url && typeof url === "string") {
        trackNavigation(url);
      }
      return result;
    };

    window.history.replaceState = (data, title, url) => {
      const result = originalReplaceState(data, title, url);
      if (url && typeof url === "string") {
        trackNavigation(url);
      }
      return result;
    };

    // Track popstate events
    window.addEventListener("popstate", () => {
      trackNavigation(window.location.pathname);
    });
  }

  private trackRouteNavigation(path: string): void {
    if (this.isDestroyed) return;

    const startTime = window.performance.now();
    const cacheStatus: CacheStatus =
      this.preloadedRoutes.has(path) ? "hit" : "miss";

    setTimeout(() => {
      if (this.isDestroyed) return;

      const endTime = window.performance.now();
      const metrics: RouteLoadingMetrics = {
        route: path,
        startTime,
        endTime,
        loadTime: endTime - startTime,
        componentSize: this.estimateComponentSize(path),
        cacheStatus,
        preloadStrategy: this.getRouteStrategy(path),
        success: true,
      };

      this.routeLoadingMetrics.push(metrics);
      this.sendMetricsToAnalytics(metrics);
    }, HOVER_DELAY);
  }

  private estimateComponentSize(path: string): number {
    const routeConfig = this.getRouteConfig(path);
    return routeConfig?.estimatedSize ?? DEFAULT_COMPONENT_SIZE;
  }

  private getRouteStrategy(path: string): PreloadStrategy {
    const routeConfig = this.getRouteConfig(path);
    return routeConfig?.strategy ?? "on-demand";
  }

  private getRouteConfig(path: string): RouteConfig | undefined {
    return this.routeConfigs.find((config) => {
      // Handle exact matches first
      if (config.path === path) return true;

      // Handle parameterized routes like /property/:id
      if (config.path.includes(":")) {
        const pattern = config.path.replace(/:[\w]+/g, "[^/]+");
        return new RegExp(`^${pattern}$`).test(path);
      }

      // Handle prefix matches for nested routes (but not for root path)
      if (config.path !== "/" && path.startsWith(config.path)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Preload a route using the specified strategy
   */
  public async preloadRoute(
    route: string,
    strategy: PreloadStrategy = "on-demand"
  ): Promise<ComponentType<unknown> | null> {
    if (this.isDestroyed) return null;

    const startTime = window.performance.now();

    try {
      // Check if already preloaded
      const existingPromise = this.preloadedRoutes.get(route);
      if (existingPromise) {
        const component = await existingPromise;
        this.recordPreloadMetrics(route, strategy, startTime, true, true);
        return component;
      }

      // Check if already in queue
      if (this.preloadQueue.has(route)) {
        this.recordPreloadMetrics(
          route,
          strategy,
          startTime,
          false,
          false,
          "Already in queue"
        );
        return null;
      }

      // Add to queue
      this.preloadQueue.add(route);

      // Get route configuration
      const config = this.getRouteConfig(route);
      if (!config) {
        this.recordPreloadMetrics(
          route,
          strategy,
          startTime,
          false,
          false,
          "Route config not found"
        );
        this.preloadQueue.delete(route);
        return null;
      }

      // Create the import promise based on domain structure
      const importPromise = this.createDomainImport(config);

      // Store the promise
      this.preloadedRoutes.set(route, importPromise);

      // Preload dependencies if specified
      if (config.dependencies) {
        const dependencyPromises = config.dependencies.map((dep) =>
          this.preloadDependency(config.domain, dep)
        );
        await Promise.allSettled(dependencyPromises);
      }

      // Preload data if specified
      if (config.preloadData) {
        this.preloadRouteData(route).catch((_error) => {
          // Silently handle data preload failures
        });
      }

      // Wait for component to load
      const component = await importPromise;

      // Remove from queue
      this.preloadQueue.delete(route);

      this.recordPreloadMetrics(route, strategy, startTime, false, true);

      // Route preloaded successfully

      return component;
    } catch (error) {
      this.preloadQueue.delete(route);
      this.preloadedRoutes.delete(route);

      this.recordPreloadMetrics(
        route,
        strategy,
        startTime,
        false,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      // Failed to preload route - error handled by metrics
      return null;
    }
  }

  private createDomainImport(
    config: RouteConfig
  ): Promise<ComponentType<unknown>> {
    // Use the existing lazy routes instead of dynamic imports
    // This prevents crashes from missing components
    return new Promise((resolve, reject) => {
      try {
        // Map route configs to actual lazy route components
        const routeComponentMap: Record<string, () => Promise<{ default: ComponentType<unknown> }>> = {
          '/': () => import('../../shared/pages/Home'),
          '/auth/login': () => import('../../auth/pages/Login'),
          '/property/:id': () => import('../../property/pages/PropertyDetails'),
          '/properties': () => import('../../shared/pages/Properties'),
          '/compare': () => import('../../property/pages/PropertyCompare'),
          '/dashboard': () => import('../../user/pages/Dashboard'),
          '/team': () => import('../../user/pages/Team'),
          '/services/basic-checks': () => import('../../trust/pages/BasicChecks'),
          '/services/fraud-detection': () => import('../../trust/pages/FraudDetection').then(module => ({ default: module.default })),
          '/search': () => import('../../search/pages/SearchResults'),
          '/inbox': () => import('../../communication/pages/Inbox'),
          '/features': () => import('../../shared/pages/Features'),
          '/pricing': () => import('../../shared/pages/Pricing'),
          '/help': () => import('../../shared/pages/Help'),
          '/community': () => import('../../shared/pages/Community'),
          '/fraud-resources': () => import('../../shared/pages/Fraud-resources'),
          '/resources/fraud': () => import('../../shared/pages/Fraud-resources'),
        };

        const importFn = routeComponentMap[config.path];
        if (!importFn) {
          // Fallback to ComingSoon component for missing routes
          import('../../shared/pages/ComingSoon')
            .then(module => resolve(module.default))
            .catch(() => reject(new Error(`Route ${config.path} not found and ComingSoon fallback failed`)));
          return;
        }

        importFn()
          .then(module => {
            if (module.default) {
              resolve(module.default);
            } else {
              throw new Error(`Component ${config.component} does not have a default export`);
            }
          })
          .catch(error => {
            // Fallback to ComingSoon component
            import('../../shared/pages/ComingSoon')
              .then(module => resolve(module.default))
              .catch(() => reject(error));
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async preloadDependency(
    domain: string,
    component: string
  ): Promise<void> {
    if (this.isDestroyed) return;

    try {
      const importPath = `../../${domain}/components/${component}`;
      await import(/* @vite-ignore */ importPath);

      // Dependency preloaded successfully
    } catch (error) {
      // Failed to preload dependency - continue silently
    }
  }

  private async preloadRouteData(route: string): Promise<void> {
    if (this.isDestroyed) return;

    try {
      const dataEndpoints = this.getRouteDataEndpoints(route);

      const fetchPromises = dataEndpoints.map((endpoint) =>
        fetch(endpoint, {
          method: "GET",
          headers: { "X-Preload": "true" },
        }).catch((_error) => {
          // Silently handle data endpoint failures
        })
      );

      await Promise.allSettled(fetchPromises);

      // Route data preloaded successfully
    } catch (error) {
      // Failed to preload route data - continue silently
    }
  }

  private getRouteDataEndpoints(route: string): string[] {
    const dataEndpointMap: Readonly<Record<string, readonly string[]>> = {
      "/property/:id": ["/api/properties/:id", "/api/trust-scores/:id"],
      "/properties": ["/api/properties", "/api/search/filters"],
      "/dashboard": ["/api/user/profile", "/api/user/properties"],
      "/search": ["/api/search/filters", "/api/properties/featured"],
      "/inbox": ["/api/messages", "/api/notifications"],
    } as const;

    // Find matching pattern
    for (const [pattern, endpoints] of Object.entries(dataEndpointMap)) {
      const regex = new RegExp(`^${pattern.replace(":id", "[^/]+")}$`);
      if (regex.test(route)) {
        const routeParts = route.split("/");
        const id = routeParts[routeParts.length - 1] || "";

        return endpoints.map((endpoint) => endpoint.replace(":id", id));
      }
    }

    return [];
  }

  /**
   * Immediate preloading - load critical routes right away
   */
  public preloadImmediate(): void {
    if (this.isDestroyed) return;

    const immediateRoutes = this.routeConfigs
      .filter((config) => config.strategy === "immediate")
      .sort((a, _b) => (a.priority === "high" ? -1 : 1));

    immediateRoutes.forEach((config) => {
      this.preloadRoute(config.path, "immediate").catch((_error) => {
        // Silently handle immediate preload failures
      });
    });
  }

  /**
   * Hover preloading - preload when user hovers over links
   */
  public setupHoverPreloading(): void {
    if (typeof document === "undefined" || this.isDestroyed) return;

    const handleMouseOver = (event: Event): void => {
      if (this.isDestroyed) return;

      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLElement | null;

      const href = link?.getAttribute("href");
      if (!href?.startsWith(window.location.origin)) return;

      const url = new window.URL(href);
      const route = url.pathname;
      const config = this.getRouteConfig(route);

      if (config?.strategy === "hover") {
        // Debounce hover preloading
        const existingTimeout = this.hoverTimeouts.get(route);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
          if (!this.isDestroyed) {
            this.preloadRoute(route, "hover").catch((_error) => {
              // Silently handle hover preload failures
            });
            this.hoverTimeouts.delete(route);
          }
        }, HOVER_DELAY);

        this.hoverTimeouts.set(route, timeoutId);
      }
    };

    const handleMouseOut = (event: Event): void => {
      if (this.isDestroyed) return;

      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLElement | null;

      const href = link?.getAttribute("href");
      if (href) {
        try {
          const url = new window.URL(href);
          const route = url.pathname;
          const timeoutId = this.hoverTimeouts.get(route);

          if (timeoutId) {
            clearTimeout(timeoutId);
            this.hoverTimeouts.delete(route);
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });
  }

  /**
   * Idle preloading - preload when browser is idle
   */
  private processIdlePreloads(): void {
    if (!this.isIdle || this.isDestroyed) return;

    const idleRoutes = this.routeConfigs
      .filter((config) => config.strategy === "idle")
      .filter((config) => !this.preloadedRoutes.has(config.path))
      .sort((a, _b) => (a.priority === "high" ? -1 : 1));

    // Preload one route at a time during idle periods
    if (idleRoutes.length > 0) {
      const route = idleRoutes[0];

      this.preloadRoute(route.path, "idle")
        .then(() => {
          if (this.isDestroyed) return;

          // Schedule next idle preload
          if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
              if (!this.isDestroyed) {
                this.processIdlePreloads();
              }
            });
          }
        })
        .catch((_error) => {
          // Silently handle idle preload failures
        });
    }
  }

  /**
   * Viewport preloading - preload when elements come into view
   */
  public observeForPreloading(element: HTMLElement, route: string): void {
    if (!this.intersectionObserver || this.isDestroyed) return;

    element.dataset.preloadRoute = route;
    this.intersectionObserver.observe(element);
  }

  /**
   * Get a preloaded component
   */
  public async getPreloadedComponent(
    route: string
  ): Promise<ComponentType<unknown> | null> {
    if (this.isDestroyed) return null;

    const promise = this.preloadedRoutes.get(route);
    if (promise) {
      try {
        return await promise;
      } catch (error) {
        // Failed to get preloaded component - return null
        return null;
      }
    }
    return null;
  }

  /**
   * Check if a route is preloaded
   */
  public isPreloaded(route: string): boolean {
    return this.preloadedRoutes.has(route);
  }

  /**
   * Get preloading metrics
   */
  public getMetrics(): MetricsReport {
    const totalPreloads = this.preloadMetrics.length;
    const successfulPreloads = this.preloadMetrics.filter(
      (m) => m.success
    ).length;
    const cacheHits = this.preloadMetrics.filter((m) => m.cacheHit).length;
    const cacheHitRate =
      totalPreloads > 0 ? (cacheHits / totalPreloads) * 100 : 0;

    const totalLoadTime = this.preloadMetrics.reduce(
      (sum, m) => sum + m.loadTime,
      0
    );
    const averageLoadTime =
      totalPreloads > 0 ? totalLoadTime / totalPreloads : 0;

    const strategySummary = this.preloadMetrics.reduce(
      (acc, metric) => {
        acc[metric.strategy] = (acc[metric.strategy] || 0) + 1;
        return acc;
      },
      {} as Record<PreloadStrategy, number>
    );

    return {
      preloadMetrics: Object.freeze([...this.preloadMetrics]),
      routeLoadingMetrics: Object.freeze([...this.routeLoadingMetrics]),
      summary: {
        totalPreloads,
        successfulPreloads,
        cacheHitRate,
        averageLoadTime,
        strategySummary: Object.freeze(strategySummary),
      },
    };
  }

  private recordPreloadMetrics(
    route: string,
    strategy: PreloadStrategy,
    startTime: number,
    cacheHit: boolean,
    success: boolean,
    error?: string
  ): void {
    if (this.isDestroyed) return;

    const metrics: PreloadMetrics = {
      route,
      strategy,
      loadTime: window.performance.now() - startTime,
      cacheHit,
      timestamp: Date.now(),
      success,
      error,
    };

    this.preloadMetrics.push(metrics);

    // Keep only last MAX_METRICS_HISTORY metrics
    if (this.preloadMetrics.length > MAX_METRICS_HISTORY) {
      this.preloadMetrics.splice(
        0,
        this.preloadMetrics.length - MAX_METRICS_HISTORY
      );
    }
  }

  private sendMetricsToAnalytics(metrics: RouteLoadingMetrics): void {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production" ||
      this.isDestroyed
    ) {
      return;
    }

    const payload = {
      ...metrics,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };

    fetch("/api/analytics/route-performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((_error) => {
      // Silently handle analytics failures
    });
  }

  /**
   * Initialize all preloading strategies
   */
  public initialize(): void {
    if (this.isDestroyed || typeof window === "undefined") return;

    // Initialize core systems first
    this.initializeIdleDetection();
    this.initializeViewportObserver();
    this.setupPerformanceTracking();

    // Start immediate preloading
    this.preloadImmediate();

    // Setup hover preloading
    this.setupHoverPreloading();

    // Idle preloading is handled automatically
    // Route preloader initialized with all strategies
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Clear all timeouts
    this.hoverTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.hoverTimeouts.clear();

    // Clear idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

    // Clear preloaded routes
    this.preloadedRoutes.clear();
    this.preloadQueue.clear();

    // Route preloader destroyed and cleaned up
  }
}

// Lazy singleton instance - only create when needed
let _routePreloader: RoutePreloader | null = null;

export const getRoutePreloader = (): RoutePreloader => {
  if (!_routePreloader && typeof window !== "undefined") {
    _routePreloader = new RoutePreloader();
  }
  return _routePreloader!;
};

// Export for backward compatibility - proxy all methods to the lazy instance
export const routePreloader = {
  get instance() {
    return getRoutePreloader();
  },
  
  // Proxy all public methods to maintain API compatibility
  async preloadRoute(route: string, strategy: PreloadStrategy = "on-demand") {
    return getRoutePreloader().preloadRoute(route, strategy);
  },
  
  isPreloaded(route: string): boolean {
    return getRoutePreloader().isPreloaded(route);
  },
  
  async getPreloadedComponent(route: string) {
    return getRoutePreloader().getPreloadedComponent(route);
  },
  
  getMetrics() {
    return getRoutePreloader().getMetrics();
  },
  
  observeForPreloading(element: HTMLElement, route: string): void {
    return getRoutePreloader().observeForPreloading(element, route);
  },
  
  initialize(): void {
    return getRoutePreloader().initialize();
  },
  
  destroy(): void {
    return getRoutePreloader().destroy();
  },
  
  // Allow access to internal properties for the hook
  get preloadedRoutes() {
    return (getRoutePreloader() as any).preloadedRoutes;
  },
  
  get preloadQueue() {
    return (getRoutePreloader() as any).preloadQueue;
  },
  
  // Expose private methods for testing
  getRouteConfig(path: string) {
    return (getRoutePreloader() as any).getRouteConfig(path);
  },
  
  getRouteDataEndpoints(route: string) {
    return (getRoutePreloader() as any).getRouteDataEndpoints(route);
  }
};

// Development helper - only when actually accessed
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  Object.defineProperty(window, '__routePreloader', {
    get: () => getRoutePreloader(),
    configurable: true
  });
}
