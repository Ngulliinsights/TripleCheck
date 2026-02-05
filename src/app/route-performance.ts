/**
 * Route Performance Monitoring
 *
 * Responsibilities:
 * - Route loading performance tracking
 * - Performance metrics collection
 * - Route debugging utilities
 */

// Enhanced performance tracker with more robust feature detection
const createPerformanceTracker = () => {
  const isClient = typeof window !== "undefined";
  const hasPerformanceAPI =
    isClient &&
    typeof window.performance !== "undefined" &&
    typeof window.performance.now === "function";

  return {
    now: (): number =>
      hasPerformanceAPI ? window.performance.now() : Date.now(),
    isAvailable: hasPerformanceAPI,
    canTrack: (): boolean =>
      hasPerformanceAPI && process.env.NODE_ENV === "development",
  } as const;
};

// Create singleton instance to avoid recreation on each use
export const performanceTracker = createPerformanceTracker();

// Centralized logging utility that respects ESLint preferences
const createLogger = () => {
  const canLog =
    window?.console &&
    process.env.NODE_ENV === "development";

  return {
    info: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        window.console.log(`📊 ${message}`, ...args);
      }
    },
    error: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        window.console.error(`❌ ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        window.console.warn(`⚠️ ${message}`, ...args);
      }
    },
  } as const;
};

export const logger = createLogger();

// Helper function to track route performance
export function trackRoutePerformance(
  startTime: number,
  routePath: string | undefined,
  preloadPriority: "high" | "normal" | "low" | undefined
): void {
  if (!performanceTracker.canTrack() || !routePath) return;

  const loadTime = Math.round(performanceTracker.now() - startTime);
  const priority = preloadPriority || "normal";
  const chunkName = `route-${sanitizeRoutePath(routePath)}`;

  logger.info(
    `Route loaded: ${routePath} (${loadTime}ms, priority: ${priority}, chunk: ${chunkName})`
  );

  if (window?.gtag) {
    window.gtag("event", "route_chunk_load", {
      event_category: "Performance",
      event_label: routePath,
      value: loadTime,
      custom_map: {
        chunk_name: chunkName,
        priority: priority,
      },
    });
  }
}

// Helper function to sanitize route paths for chunk names
function sanitizeRoutePath(routePath: string): string {
  return routePath
    .replace(/^\//, "") // Remove leading slash
    .replace(/\//g, "-") // Replace slashes with hyphens
    .replace(/[^a-zA-Z0-9-]/g, "") // Remove special characters
    .toLowerCase();
}

// Route validation and debugging
export async function validateAndLogRoute(pathname: string): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  // eslint-disable-next-line no-console
  console.log("Router rendering, current path:", pathname);

  // Validate the current route
  const routeValidatorModule = await import("../shared/utils/route-validator");
  const routeValidation =
    routeValidatorModule.routeValidator.validateRoute(pathname);

  if (!routeValidation.isValid) {
    // eslint-disable-next-line no-console
    console.warn("Invalid route detected:", pathname, routeValidation.errors);
    if (routeValidation.warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.info("Route suggestions:", routeValidation.warnings);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log("Route validation passed for:", pathname);
  }
}
