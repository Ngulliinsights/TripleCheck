/**
 * React hook for route preloading integration
 * Optimized version with reduced re-renders and improved performance
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";

import {
  routePreloader,
  PreloadStrategy,
  PreloadMetrics,
  RouteLoadingMetrics,
} from "./route-preloader";

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

export function useRoutePreloader(options: UseRoutePreloaderOptions = {}) {
  const {
    enableHoverPreloading = true,
    enableViewportPreloading = false,
    preloadOnMount = [],
    strategy = "on-demand",
  } = options;

  // Memoize options to prevent effect re-runs when object reference changes
  const stableOptions = useMemo(
    () => ({
      enableHoverPreloading,
      enableViewportPreloading,
      preloadOnMount,
      strategy,
    }),
    [enableHoverPreloading, enableViewportPreloading, preloadOnMount, strategy]
  );

  const [state, setState] = useState<RoutePreloaderState>({
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
  });

  // Use refs to track state without causing re-renders
  const observedElements = useRef(new Set<HTMLElement>());
  const metricsUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastMetricsUpdateRef = useRef<number>(0);

  // Debounced metrics update to prevent excessive re-renders
  const debouncedUpdateMetrics = useCallback(() => {
    if (metricsUpdateTimeoutRef.current) {
      clearTimeout(metricsUpdateTimeoutRef.current);
    }

    metricsUpdateTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      // Prevent updates more frequent than every 1 second
      if (now - lastMetricsUpdateRef.current < 1000) return;

      lastMetricsUpdateRef.current = now;
      const metrics = routePreloader.getMetrics();
      const preloadedRoutes = Array.from(
        routePreloader["preloadedRoutes"].keys()
      ) as string[];

      setState((prev) => {
        // Only update if data actually changed to prevent unnecessary renders
        const routesChanged =
          JSON.stringify(prev.preloadedRoutes) !==
          JSON.stringify(preloadedRoutes);
        const metricsChanged =
          prev.metrics.summary.totalPreloads !== metrics.summary.totalPreloads;

        if (!routesChanged && !metricsChanged) return prev;

        return {
          ...prev,
          preloadedRoutes,
          metrics: {
            ...metrics,
            preloadMetrics: [...metrics.preloadMetrics], // Convert readonly to mutable
            routeLoadingMetrics: [...metrics.routeLoadingMetrics], // Convert readonly to mutable
          },
        };
      });
    }, 100); // 100ms debounce
  }, []);

  // Preload routes on mount - memoized to prevent re-runs
  useEffect(() => {
    if (stableOptions.preloadOnMount.length === 0) return;

    setState((prev) => ({ ...prev, isPreloading: true }));

    Promise.all(
      stableOptions.preloadOnMount.map((route) =>
        routePreloader.preloadRoute(route, stableOptions.strategy)
      )
    )
      .finally(() => {
        setState((prev) => ({ ...prev, isPreloading: false }));
        debouncedUpdateMetrics();
      })
      .catch((_error) => {
        // Error is handled by individual preload operations
      });
  }, [
    stableOptions.preloadOnMount,
    stableOptions.strategy,
    debouncedUpdateMetrics,
  ]);

  // Update metrics on mount and with longer intervals to reduce overhead
  useEffect(() => {
    debouncedUpdateMetrics();

    // Reduce update frequency from 5s to 10s to minimize re-renders
    const interval = setInterval(debouncedUpdateMetrics, 10000);
    return () => {
      clearInterval(interval);
      if (metricsUpdateTimeoutRef.current) {
        clearTimeout(metricsUpdateTimeoutRef.current);
      }
    };
  }, [debouncedUpdateMetrics]);

  /**
   * Preload a specific route - stable callback that won't cause re-renders
   */
  const preloadRoute = useCallback(
    async (
      route: string,
      preloadStrategy: PreloadStrategy = stableOptions.strategy
    ) => {
      // Check if already preloaded to avoid unnecessary work
      if (routePreloader.isPreloaded(route)) {
        return true;
      }

      setState((prev) => ({ ...prev, isPreloading: true }));

      try {
        await routePreloader.preloadRoute(route, preloadStrategy);
        debouncedUpdateMetrics();
        return true;
      } catch (error) {
        // Log error for debugging in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(`Failed to preload route ${route}:`, error);
        }
        return false;
      } finally {
        setState((prev) => ({ ...prev, isPreloading: false }));
      }
    },
    [stableOptions.strategy, debouncedUpdateMetrics]
  );

  /**
   * Check if a route is preloaded - memoized for performance
   */
  const isPreloaded = useCallback((route: string) => {
    return routePreloader.isPreloaded(route);
  }, []);

  /**
   * Get preloaded component for a route - stable callback
   */
  const getPreloadedComponent = useCallback(async (route: string) => {
    return await routePreloader.getPreloadedComponent(route);
  }, []);

  /**
   * Setup hover preloading for an element - memoized cleanup function
   */
  const setupHoverPreloading = useCallback(
    (element: HTMLElement, route: string) => {
      if (!stableOptions.enableHoverPreloading) return;

      const handleMouseEnter = () => {
        preloadRoute(route, "hover");
      };

      element.addEventListener("mouseenter", handleMouseEnter, {
        passive: true,
      });

      return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
      };
    },
    [stableOptions.enableHoverPreloading, preloadRoute]
  );

  /**
   * Setup viewport preloading for an element - optimized with cleanup tracking
   */
  const setupViewportPreloading = useCallback(
    (element: HTMLElement, route: string) => {
      if (!stableOptions.enableViewportPreloading) return;

      routePreloader.observeForPreloading(element, route);
      observedElements.current.add(element);

      return () => {
        observedElements.current.delete(element);
      };
    },
    [stableOptions.enableViewportPreloading]
  );

  /**
   * Preload routes based on user behavior patterns - optimized batch processing
   */
  const preloadByUserBehavior = useCallback(
    async (routes: string[]) => {
      // Filter out already preloaded routes to avoid unnecessary work
      const routesToPreload = routes.filter(
        (route) => !routePreloader.isPreloaded(route)
      );

      if (routesToPreload.length === 0) return;

      const promises = routesToPreload.map((route) =>
        preloadRoute(route, "idle")
      );
      await Promise.all(promises);
    },
    [preloadRoute]
  );

  /**
   * Preload critical routes for the current domain - memoized route mapping
   */
  const domainRoutes = useMemo(
    () => ({
      property: ["/property/:id", "/properties", "/compare"],
      user: ["/dashboard", "/team"],
      trust: ["/services/basic-checks", "/services/fraud-detection"],
      search: ["/search"],
      communication: ["/inbox"],
    }),
    []
  );

  const preloadDomainRoutes = useCallback(
    async (domain: string) => {
      const routes = domainRoutes[domain as keyof typeof domainRoutes] || [];
      const routesToPreload = routes.filter(
        (route) => !routePreloader.isPreloaded(route)
      );

      if (routesToPreload.length === 0) return;

      await Promise.all(
        routesToPreload.map((route) => preloadRoute(route, "idle"))
      );
    },
    [domainRoutes, preloadRoute]
  );

  /**
   * Get performance insights - memoized to prevent recalculation on every render
   */
  const getPerformanceInsights = useMemo(() => {
    const { metrics } = state;
    const insights = [];

    // Cache hit rate insights
    if (metrics.summary.cacheHitRate < 50) {
      insights.push({
        type: "warning" as const,
        message: `Low cache hit rate (${metrics.summary.cacheHitRate.toFixed(1)}%). Consider adjusting preloading strategies.`,
        recommendation:
          "Review which routes are being preloaded vs actually visited.",
      });
    }

    // Load time insights
    if (metrics.summary.averageLoadTime > 1000) {
      insights.push({
        type: "warning" as const,
        message: `High average load time (${metrics.summary.averageLoadTime.toFixed(0)}ms).`,
        recommendation: "Consider code splitting or reducing component size.",
      });
    }

    // Strategy effectiveness
    const { strategySummary } = metrics.summary;
    const [mostUsedStrategy] = Object.entries(strategySummary).sort(
      ([, a], [, b]) => b - a
    );

    if (mostUsedStrategy) {
      insights.push({
        type: "info" as const,
        message: `Most effective strategy: ${mostUsedStrategy[0]} (${mostUsedStrategy[1]} preloads)`,
        recommendation: "Consider using this strategy for similar routes.",
      });
    }

    // Success rate insights
    const successRate =
      metrics.summary.totalPreloads > 0 ?
        (metrics.summary.successfulPreloads / metrics.summary.totalPreloads) *
        100
      : 0;

    if (successRate < 90) {
      insights.push({
        type: "error" as const,
        message: `Low preload success rate (${successRate.toFixed(1)}%).`,
        recommendation: "Check for network issues or component loading errors.",
      });
    }

    return insights;
  }, [state]); // Include full state to satisfy dependency array

  /**
   * Cleanup function - stable reference
   */
  const cleanup = useCallback(() => {
    observedElements.current.clear();
    if (metricsUpdateTimeoutRef.current) {
      clearTimeout(metricsUpdateTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoize computed values to prevent recalculation
  const computedValues = useMemo(
    () => ({
      hasPreloadedRoutes: state.preloadedRoutes.length > 0,
      preloadSuccessRate:
        state.metrics.summary.totalPreloads > 0 ?
          (state.metrics.summary.successfulPreloads /
            state.metrics.summary.totalPreloads) *
          100
        : 0,
    }),
    [
      state.preloadedRoutes.length,
      state.metrics.summary.totalPreloads,
      state.metrics.summary.successfulPreloads,
    ]
  );

  // Return memoized object to prevent object recreation on every render
  return useMemo(
    () => ({
      // State
      ...state,

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
      updateMetrics: debouncedUpdateMetrics,
      cleanup,

      // Computed values
      ...computedValues,
    }),
    [
      state,
      preloadRoute,
      isPreloaded,
      getPreloadedComponent,
      setupHoverPreloading,
      setupViewportPreloading,
      preloadByUserBehavior,
      preloadDomainRoutes,
      getPerformanceInsights,
      debouncedUpdateMetrics,
      cleanup,
      computedValues,
    ]
  );
}

/**
 * Hook for tracking route loading performance - optimized version
 */
export function useRouteLoadingTracker() {
  const [currentRoute, setCurrentRoute] = useState<string>("");
  const [loadingMetrics, setLoadingMetrics] = useState<RouteLoadingMetrics[]>(
    []
  );
  const routeStartTime = useRef<number>(0);

  // Memoize computed values to prevent recalculation
  const computedMetrics = useMemo(() => {
    if (loadingMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        slowestRoute: null,
        fastestRoute: null,
        cacheHitRate: 0,
      };
    }

    const total = loadingMetrics.reduce(
      (sum, metric) => sum + metric.loadTime,
      0
    );
    const averageLoadTime = total / loadingMetrics.length;

    const slowestRoute =
      loadingMetrics.length > 0 ?
        loadingMetrics.reduce(
          (slowest, current) =>
            current.loadTime > slowest.loadTime ? current : slowest,
          loadingMetrics[0]!
        )
      : null;

    const fastestRoute =
      loadingMetrics.length > 0 ?
        loadingMetrics.reduce(
          (fastest, current) =>
            current.loadTime < fastest.loadTime ? current : fastest,
          loadingMetrics[0]!
        )
      : null;

    const cacheHitRate =
      (loadingMetrics.filter((m) => m.cacheStatus === "hit").length /
        loadingMetrics.length) *
      100;

    return {
      averageLoadTime,
      slowestRoute: slowestRoute || {
        route: "",
        loadTime: 0,
        cacheStatus: "miss" as const,
      },
      fastestRoute: fastestRoute || {
        route: "",
        loadTime: 0,
        cacheStatus: "miss" as const,
      },
      cacheHitRate,
    };
  }, [loadingMetrics]);

  useEffect(() => {
    const trackRouteChange = (route: string) => {
      // End previous route tracking
      if (currentRoute && routeStartTime.current > 0) {
        const endTime = window.performance.now();
        const metrics: RouteLoadingMetrics = {
          route: currentRoute,
          startTime: routeStartTime.current,
          endTime,
          loadTime: endTime - routeStartTime.current,
          componentSize: 0, // Would need to be calculated
          cacheStatus:
            routePreloader.isPreloaded(currentRoute) ? "hit" : "miss",
          preloadStrategy: "on-demand", // Would need to be tracked
          success: true,
        };

        setLoadingMetrics((prev) => [...prev.slice(-99), metrics]); // Keep last 100
      }

      // Start new route tracking
      setCurrentRoute(route);
      routeStartTime.current = window.performance.now();
    };

    // Track initial route
    trackRouteChange(window.location.pathname);

    // Listen for route changes
    const handlePopState = () => trackRouteChange(window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentRoute]);

  // Memoize callback functions to prevent unnecessary re-renders in consuming components
  const getAverageLoadTime = useCallback(
    () => computedMetrics.averageLoadTime,
    [computedMetrics.averageLoadTime]
  );
  const getSlowestRoute = useCallback(
    () => computedMetrics.slowestRoute,
    [computedMetrics.slowestRoute]
  );
  const getFastestRoute = useCallback(
    () => computedMetrics.fastestRoute,
    [computedMetrics.fastestRoute]
  );

  return useMemo(
    () => ({
      currentRoute,
      loadingMetrics,
      getAverageLoadTime,
      getSlowestRoute,
      getFastestRoute,
      cacheHitRate: computedMetrics.cacheHitRate,
    }),
    [
      currentRoute,
      loadingMetrics,
      getAverageLoadTime,
      getSlowestRoute,
      getFastestRoute,
      computedMetrics.cacheHitRate,
    ]
  );
}

/**
 * Hook for preloading routes based on user interactions - optimized version
 */
export function useSmartPreloading() {
  const { preloadRoute } = useRoutePreloader();
  const [userBehavior, setUserBehavior] = useState({
    hoveredLinks: new Set<string>(),
    scrolledSections: new Set<string>(),
    clickedCategories: new Set<string>(),
  });

  // Use refs to prevent excessive event listener updates
  const preloadTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  const lastScrollUpdate = useRef<number>(0);

  // Track user behavior with optimized event handlers
  useEffect(() => {
    // Capture ref value at effect creation time to avoid stale closure
    const timeouts = preloadTimeouts.current;
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && link.href.startsWith(window.location.origin)) {
        const route = new URL(link.href).pathname;

        // Avoid duplicate processing
        if (userBehavior.hoveredLinks.has(route)) return;

        setUserBehavior((prev) => ({
          ...prev,
          hoveredLinks: new Set([...prev.hoveredLinks, route]),
        }));

        // Clear existing timeout for this route
        const existingTimeout = preloadTimeouts.current.get(route);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Preload after short delay
        const timeout = setTimeout(() => {
          preloadRoute(route, "hover");
          preloadTimeouts.current.delete(route);
        }, 200);

        preloadTimeouts.current.set(route, timeout);
      }
    };

    const handleScroll = () => {
      // Throttle scroll updates to prevent excessive processing
      const now = Date.now();
      if (now - lastScrollUpdate.current < 100) return; // 100ms throttle
      lastScrollUpdate.current = now;

      // Track which sections user scrolls through
      const sections = document.querySelectorAll("[data-section]");
      const newSections = new Set<string>();

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const sectionName = section.getAttribute("data-section");
          if (sectionName) {
            newSections.add(sectionName);
          }
        }
      });

      // Only update if there are new sections to avoid unnecessary renders
      const hasNewSections = Array.from(newSections).some(
        (section) => !userBehavior.scrolledSections.has(section)
      );
      if (hasNewSections) {
        setUserBehavior((prev) => ({
          ...prev,
          scrolledSections: new Set([...prev.scrolledSections, ...newSections]),
        }));
      }
    };

    document.addEventListener("mouseover", handleLinkHover, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseover", handleLinkHover);
      window.removeEventListener("scroll", handleScroll);

      // Clear all pending timeouts using captured ref value
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [preloadRoute, userBehavior.hoveredLinks, userBehavior.scrolledSections]);

  // Predict next routes based on behavior - memoized for performance
  const predictNextRoutes = useCallback(() => {
    const predictions = [];

    // If user hovered over property links, preload property-related routes
    if (
      Array.from(userBehavior.hoveredLinks).some((link) =>
        link.includes("/property")
      )
    ) {
      predictions.push("/properties", "/compare", "/search");
    }

    // If user scrolled through services section, preload service routes
    if (userBehavior.scrolledSections.has("services")) {
      predictions.push("/services/basic-checks", "/services/fraud-detection");
    }

    // If user is on home page and scrolled, preload key pages
    if (
      window.location.pathname === "/" &&
      userBehavior.scrolledSections.size > 2
    ) {
      predictions.push("/features", "/pricing", "/auth/register");
    }

    return predictions;
  }, [userBehavior]);

  // Preload predicted routes with optimization to avoid duplicate work
  const preloadPredictedRoutes = useCallback(async () => {
    const routes = predictNextRoutes();
    const routesToPreload = routes.filter(
      (route) => !routePreloader.isPreloaded(route)
    );

    if (routesToPreload.length === 0) return;

    await Promise.all(
      routesToPreload.map((route) => preloadRoute(route, "idle"))
    );
  }, [predictNextRoutes, preloadRoute]);

  return useMemo(
    () => ({
      userBehavior,
      predictNextRoutes,
      preloadPredictedRoutes,
    }),
    [userBehavior, predictNextRoutes, preloadPredictedRoutes]
  );
}
