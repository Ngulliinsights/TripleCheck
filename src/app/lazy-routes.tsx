import { lazy, ComponentType } from "react";

// Enhanced global type declarations with better browser API coverage
declare global {
  interface Window {
    performance: Performance;
    console: Console;
    gtag?: (
      command: string,
      eventName: string,
      parameters: Record<string, unknown>
    ) => void;
  }
}

// Refined console interface to match actual browser Console API
interface Console {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}

// Enhanced performance interface with additional useful methods
interface Performance {
  now(): number;
  getEntriesByType(type: string): PerformanceEntry[];
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
}

// More descriptive and type-safe configuration interface
interface LazyRouteConfiguration {
  readonly routePath?: string;
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly preloadPriority?: "high" | "normal" | "low";
}

// Improved type definitions with better constraints
type LazyComponent = ComponentType<Record<string, unknown>>;
type ModuleWithDefault<T = ComponentType<Record<string, unknown>>> = {
  readonly default: T;
};

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
    // Added method to check if we can safely use performance APIs
    canTrack: (): boolean =>
      hasPerformanceAPI && process.env.NODE_ENV === "development",
  } as const;
};

// Create singleton instance to avoid recreation on each use
const performanceTracker = createPerformanceTracker();

// Centralized logging utility that respects ESLint preferences
const createLogger = () => {
  const canLog =
    typeof window !== "undefined" &&
    window.console &&
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

const logger = createLogger();

// Enhanced lazy loading with chunk splitting optimization and performance tracking
const createLazyRoute = (
  importFunction: () => Promise<ModuleWithDefault>,
  configuration: LazyRouteConfiguration = {}
): LazyComponent => {
  const { routePath, fallbackTitle, fallbackDescription, preloadPriority } = configuration;

  return lazy(async (): Promise<ModuleWithDefault> => {
    const startTime = performanceTracker.now();

    try {
      // Add chunk name for better webpack optimization
      const chunkName = routePath ? 
        `route-${routePath.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '')}` : 
        'unknown-route';

      // Enhanced module loading with retry mechanism for network failures
      let module: ModuleWithDefault;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          module = await importFunction();
          break;
        } catch (loadError) {
          retryCount++;
          
          // Only retry on network-related errors
          const isNetworkError = loadError instanceof Error && (
            loadError.message.includes('Loading chunk') ||
            loadError.message.includes('ChunkLoadError') ||
            loadError.message.includes('fetch')
          );

          if (retryCount <= maxRetries && isNetworkError) {
            logger.warn(`Route load attempt ${retryCount} failed for ${routePath}, retrying...`);
            // Exponential backoff delay
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
            continue;
          }
          
          throw loadError;
        }
      }

      // Validate module structure to prevent runtime failures
      if (!module || typeof module !== "object" || !module.default) {
        throw new Error(
          `Invalid module structure at ${routePath || "unknown route"}: missing default export`
        );
      }

      // Enhanced performance tracking with conditional execution
      if (performanceTracker.canTrack() && routePath) {
        const loadTime = Math.round(performanceTracker.now() - startTime);
        const priority = preloadPriority || 'normal';
        logger.info(`Route loaded: ${routePath} (${loadTime}ms, priority: ${priority}, chunk: ${chunkName})`);
        
        // Track performance metrics for optimization
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'route_chunk_load', {
            event_category: 'Performance',
            event_label: routePath,
            value: loadTime,
            custom_map: {
              chunk_name: chunkName,
              priority: priority,
              retry_count: retryCount,
            },
          });
        }
      }

      return module;
    } catch (originalError) {
      const errorMessage =
        originalError instanceof Error ?
          originalError.message
        : String(originalError);
      logger.error(
        `Failed to load route: ${routePath || "unknown"}`,
        errorMessage
      );

      // Improved fallback mechanism with better error recovery
      if (fallbackTitle && fallbackDescription) {
        try {
          const comingSoonModule = await import(
            /* webpackChunkName: "fallback-coming-soon" */
            "../shared/pages/ComingSoon"
          );

          // Validate fallback module structure
          if (!comingSoonModule?.default) {
            throw new Error(
              "ComingSoon component does not have a default export"
            );
          }

          return {
            default: () =>
              comingSoonModule.default({
                title: fallbackTitle,
                description: fallbackDescription,
              }),
          };
        } catch (fallbackError) {
          logger.error(
            "Fallback component failed to load:",
            fallbackError instanceof Error ?
              fallbackError.message
            : String(fallbackError)
          );
          // Re-throw original error to maintain error context
          throw originalError;
        }
      }

      throw originalError;
    }
  });
};

// Simplified coming soon route creator with better error handling
const createComingSoonRoute = (
  title: string,
  description: string
): LazyComponent => {
  return lazy(async (): Promise<ModuleWithDefault> => {
    try {
      const module = await import("../shared/pages/ComingSoon");

      if (!module?.default) {
        throw new Error("ComingSoon component is not properly exported");
      }

      return {
        default: () => module.default({ title, description }),
      };
    } catch (error) {
      logger.error("Failed to load ComingSoon component:", error);
      throw error;
    }
  });
};

// Enhanced route creation with more sophisticated fallback handling
const createRouteWithFallback = (
  primaryImportFunction: () => Promise<ModuleWithDefault>,
  fallbackTitle: string,
  fallbackDescription: string,
  routePath?: string
): LazyComponent => {
  return createLazyRoute(
    async (): Promise<ModuleWithDefault> => {
      try {
        const module = await primaryImportFunction();

        // Validate primary module before returning
        if (!module?.default) {
          throw new Error(
            `Primary module at ${routePath} has invalid export structure`
          );
        }

        return module;
      } catch (primaryError) {
        logger.warn(
          `Primary import failed for ${routePath || "unknown route"}, attempting fallback:`,
          primaryError instanceof Error ?
            primaryError.message
          : String(primaryError)
        );

        // Load fallback with proper error handling
        try {
          const comingSoonModule = await import("../shared/pages/ComingSoon");

          if (!comingSoonModule?.default) {
            throw new Error(
              "Fallback ComingSoon component is not properly exported"
            );
          }

          return {
            default: () =>
              comingSoonModule.default({
                title: fallbackTitle,
                description: fallbackDescription,
              }),
          };
        } catch (fallbackError) {
          logger.error(
            "Fallback component loading failed:",
            fallbackError instanceof Error ?
              fallbackError.message
            : String(fallbackError)
          );
          // Preserve the original error for better debugging
          throw primaryError;
        }
      }
    },
    { routePath, fallbackTitle, fallbackDescription }
  );
};

// Comprehensive route definitions with improved organization and webpack chunk optimization
export const WorkingRoutes = {
  // Core application pages with high-priority loading and optimized chunks
  Home: createLazyRoute(() => import(
    /* webpackChunkName: "page-home" */
    /* webpackPreload: true */
    "../shared/pages/Home"
  ), {
    routePath: "/",
    preloadPriority: "high",
  }),

  Features: createLazyRoute(() => import(
    /* webpackChunkName: "page-features" */
    /* webpackPreload: true */
    "../shared/pages/Features"
  ), {
    routePath: "/features",
    preloadPriority: "high",
  }),

  Pricing: createLazyRoute(() => import(
    /* webpackChunkName: "page-pricing" */
    /* webpackPreload: true */
    "../shared/pages/Pricing"
  ), {
    routePath: "/pricing",
    preloadPriority: "high",
  }),

  Dashboard: createLazyRoute(() => import(
    /* webpackChunkName: "user-dashboard" */
    /* webpackPrefetch: true */
    "../user/pages/Dashboard"
  ), {
    routePath: "/dashboard",
    preloadPriority: "high",
  }),

  // Property management routes - essential business functionality
  PropertyDetails: createLazyRoute(
    () => import("../property/pages/PropertyDetails"),
    {
      routePath: "/property/details",
      preloadPriority: "high",
    }
  ),

  PropertyEdit: createLazyRoute(
    () => import("../property/pages/PropertyEdit"),
    {
      routePath: "/property/edit",
      preloadPriority: "normal",
    }
  ),

  PropertyCompare: createLazyRoute(
    () => import("../property/pages/PropertyCompare"),
    {
      routePath: "/property/compare",
      preloadPriority: "normal",
    }
  ),

  ListProperty: createLazyRoute(
    () => import("../property/pages/ListProperty"),
    {
      routePath: "/property/list",
      preloadPriority: "normal",
    }
  ),

  // Authentication routes - critical user experience paths
  Login: createLazyRoute(() => import("../auth/pages/Login"), {
    routePath: "/auth/login",
    preloadPriority: "high",
  }),

  Register: createLazyRoute(() => import("../auth/pages/Register"), {
    routePath: "/auth/register",
    preloadPriority: "high",
  }),

  // Trust and verification services - core business functionality
  BasicChecks: createLazyRoute(() => import("../trust/pages/BasicChecks"), {
    routePath: "/trust/basic-checks",
    preloadPriority: "normal",
  }),

  FraudDetection: createLazyRoute(
    () => import("../trust/pages/FraudDetection"),
    {
      routePath: "/trust/fraud-detection",
      preloadPriority: "normal",
    }
  ),

  DocumentAuth: createLazyRoute(() => import("../trust/pages/DocumentAuth"), {
    routePath: "/trust/document-auth",
    preloadPriority: "normal",
  }),

  Reports: createLazyRoute(() => import("../trust/pages/Reports"), {
    routePath: "/trust/reports",
    preloadPriority: "normal",
  }),

  Alerts: createLazyRoute(() => import("../trust/pages/Alerts"), {
    routePath: "/trust/alerts",
    preloadPriority: "normal",
  }),

  Karma: createLazyRoute(() => import("../trust/pages/Karma"), {
    routePath: "/trust/karma",
    preloadPriority: "low",
  }),

  Reputation: createLazyRoute(() => import("../trust/pages/Reputation"), {
    routePath: "/trust/reputation",
    preloadPriority: "low",
  }),

  TrustPoints: createLazyRoute(() => import("../trust/pages/TrustPoints"), {
    routePath: "/trust/points",
    preloadPriority: "low",
  }),

  Reviews: createLazyRoute(() => import("../trust/pages/Reviews"), {
    routePath: "/trust/reviews",
    preloadPriority: "normal",
  }),

  // Communication and user management features
  Inbox: createLazyRoute(() => import("../communication/pages/Inbox"), {
    routePath: "/communication/inbox",
    preloadPriority: "normal",
  }),

  Tenants: createLazyRoute(() => import("../user/pages/Tenants"), {
    routePath: "/user/tenants",
    preloadPriority: "normal",
  }),

  Team: createLazyRoute(() => import("../user/pages/Team"), {
    routePath: "/user/team",
    preloadPriority: "low",
  }),

  // Content and educational resources
  Resources: createLazyRoute(() => import("../shared/pages/Resources"), {
    routePath: "/resources",
    preloadPriority: "low",
  }),

  Blog: createLazyRoute(() => import("../shared/pages/Blog"), {
    routePath: "/blog",
    preloadPriority: "low",
  }),

  BlogPost: createLazyRoute(() => import("../shared/pages/BlogPost"), {
    routePath: "/blog/post",
    preloadPriority: "low",
  }),

  Community: createLazyRoute(() => import("../shared/pages/Community"), {
    routePath: "/community",
    preloadPriority: "low",
  }),

  FraudResources: createLazyRoute(
    () => import("../shared/pages/Fraud-resources"),
    {
      routePath: "/fraud-resources",
      preloadPriority: "low",
    }
  ),

  // Company and marketing pages
  OurStory: createLazyRoute(() => import("../shared/pages/OurStory"), {
    routePath: "/our-story",
    preloadPriority: "low",
  }),

  Partners: createLazyRoute(() => import("../shared/pages/Partners"), {
    routePath: "/partners",
    preloadPriority: "low",
  }),

  PressMedia: createLazyRoute(() => import("../shared/pages/PressMedia"), {
    routePath: "/press-media",
    preloadPriority: "low",
  }),

  // Search and discovery functionality
  SearchResults: createLazyRoute(
    () => import("../search/pages/SearchResults"),
    {
      routePath: "/search/results",
      preloadPriority: "normal",
    }
  ),

  // Error handling and fallback pages
  NotFound: createLazyRoute(() => import("../shared/pages/NotFound"), {
    routePath: "/404",
    preloadPriority: "normal",
  }),

  // Service pages with comprehensive fallback handling
  Services: createRouteWithFallback(
    () => import("../shared/pages/Services"),
    "Services",
    "Explore our comprehensive property verification services.",
    "/services"
  ),

  Properties: createRouteWithFallback(
    () => import("../shared/pages/Properties"),
    "Properties",
    "Browse verified properties across Africa.",
    "/properties"
  ),

  PropertiesResidential: createLazyRoute(
    () => import("../property/pages/PropertiesResidential"),
    {
      routePath: "/properties/residential",
      preloadPriority: "normal",
    }
  ),

  PropertiesCommercial: createLazyRoute(
    () => import("../property/pages/CommercialProperties"),
    {
      routePath: "/properties/commercial",
      preloadPriority: "normal",
    }
  ),

  PropertyPhotos: createLazyRoute(
    () => import("../property/pages/PropertyPhotos"),
    {
      routePath: "/property/photos",
      preloadPriority: "low",
    }
  ),

  PropertyOptimize: createLazyRoute(
    () => import("../property/pages/PropertyOptimize"),
    {
      routePath: "/property/optimize",
      preloadPriority: "low",
    }
  ),

  // Land Verification routes - Kenya-specific land verification system
  LandVerification: createLazyRoute(
    () => import("../land-verification/pages/LandVerificationPage"),
    {
      routePath: "/land-verification",
      preloadPriority: "normal",
    }
  ),

  LandVerificationDashboard: createLazyRoute(
    () => import("../land-verification/pages/LandVerificationDashboardPage"),
    {
      routePath: "/land-verification/dashboard",
      preloadPriority: "normal",
    }
  ),

  NewLandVerification: createLazyRoute(
    () => import("../land-verification/pages/NewVerificationPage"),
    {
      routePath: "/land-verification/new",
      preloadPriority: "normal",
    }
  ),

  // Coming soon routes with clear descriptions
  MyProperties: createComingSoonRoute(
    "My Properties",
    "Manage your property listings and verification status."
  ),

  PropertiesLand: createLazyRoute(
    () => import("../property/pages/Lands"),
    {
      routePath: "/properties/land",
      preloadPriority: "normal",
    }
  ),

  // Solution pages for different user segments
  Solutions: createRouteWithFallback(
    () => import("../shared/pages/Solutions"),
    "Solutions",
    "Tailored verification solutions for every user type.",
    "/solutions"
  ),

  SolutionsBuyers: createComingSoonRoute(
    "Solutions for Buyers",
    "Secure your property purchases with comprehensive verification services."
  ),

  SolutionsSellers: createComingSoonRoute(
    "Solutions for Sellers",
    "Increase buyer confidence with verified property listings and documentation."
  ),

  SolutionsAgents: createComingSoonRoute(
    "Solutions for Agents",
    "Professional verification tools and services for real estate professionals."
  ),

  SolutionsDevelopers: createComingSoonRoute(
    "Solutions for Developers",
    "Enterprise-grade verification services for property development projects."
  ),

  // Support and documentation with robust fallback handling
  Help: createRouteWithFallback(
    () => import("../shared/pages/Help"),
    "Help Center",
    "Get comprehensive support and find answers to your questions.",
    "/help"
  ),

  Contact: createRouteWithFallback(
    () => import("../shared/pages/Contact"),
    "Contact Us",
    "Get in touch with our dedicated support team.",
    "/contact"
  ),

  HelpGettingStarted: createComingSoonRoute(
    "Getting Started Guide",
    "Comprehensive guide to using TripleCheck effectively and efficiently."
  ),

  HelpVerification: createComingSoonRoute(
    "Verification Guide",
    "Complete step-by-step guide to the property verification process."
  ),

  HelpFAQ: createComingSoonRoute(
    "Frequently Asked Questions",
    "Find quick answers to the most commonly asked questions."
  ),
} as const;

// Enhanced preloading system with priority-based loading and better error recovery
interface PreloadFunction {
  (): Promise<SettledResult[]>;
}

interface PreloadRoutes {
  readonly property: PreloadFunction;
  readonly trust: PreloadFunction;
  readonly user: PreloadFunction;
  readonly communication: PreloadFunction;
  readonly search: PreloadFunction;
  readonly shared: PreloadFunction;
  readonly preloadMultiple: (
    categories: PreloadCategory[]
  ) => Promise<SettledResult[]>;
  readonly preloadByPriority: (
    priority: "high" | "normal" | "low"
  ) => Promise<SettledResult[]>;
}

type PreloadCategory = keyof Omit<
  PreloadRoutes,
  "preloadMultiple" | "preloadByPriority"
>;
type SettledResult = PromiseSettledResult<unknown>;

// Helper function to handle promise settlements with detailed reporting
const handleSettledResults = (
  results: SettledResult[],
  category: string
): SettledResult[] => {
  if (process.env.NODE_ENV === "development") {
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      logger.warn(
        `${failures.length} out of ${results.length} ${category} routes failed to preload`
      );

      // Log specific failures for debugging
      failures.forEach((failure, index) => {
        if (failure.status === "rejected") {
          logger.error(
            `${category} preload failure ${index + 1}:`,
            failure.reason
          );
        }
      });
    } else {
      logger.info(
        `Successfully preloaded ${results.length} ${category} routes`
      );
    }
  }

  return results;
};

export const preloadRoutes: PreloadRoutes = {
  // Property-related route preloading with comprehensive modules
  property: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../property/pages/PropertyDetails"),
        import("../property/pages/PropertyCompare"),
        import("../property/pages/PropertyEdit"),
        import("../property/pages/ListProperty"),
        import("../property/components/PropertyCard"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "property");
    } catch (error) {
      logger.warn("Unexpected error during property route preloading:", error);
      return [];
    }
  },

  // Trust and verification service preloading
  trust: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../trust/pages/BasicChecks"),
        import("../trust/pages/FraudDetection"),
        import("../trust/pages/DocumentAuth"),
        import("../trust/pages/Reports"),
        import("../trust/components/TrustScore"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "trust");
    } catch (error) {
      logger.warn("Unexpected error during trust route preloading:", error);
      return [];
    }
  },

  // Land verification service preloading
  landVerification: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../land-verification/pages/LandVerificationPage"),
        import("../land-verification/pages/LandVerificationDashboardPage"),
        import("../land-verification/pages/NewVerificationPage"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "land-verification");
    } catch (error) {
      logger.warn("Unexpected error during land verification route preloading:", error);
      return [];
    }
  },

  // User management and dashboard preloading
  user: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../user/pages/Dashboard"),
        import("../user/pages/Tenants"),
        import("../user/pages/Team"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "user");
    } catch (error) {
      logger.warn("Unexpected error during user route preloading:", error);
      return [];
    }
  },

  // Communication system preloading
  communication: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [import("../communication/pages/Inbox")];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "communication");
    } catch (error) {
      logger.warn(
        "Unexpected error during communication route preloading:",
        error
      );
      return [];
    }
  },

  // Search and discovery functionality preloading
  search: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../search/pages/SearchResults"),
        import("../search/components/PropertySearch"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "search");
    } catch (error) {
      logger.warn("Unexpected error during search route preloading:", error);
      return [];
    }
  },

  // Shared content and informational page preloading
  shared: async (): Promise<SettledResult[]> => {
    try {
      const preloadPromises = [
        import("../shared/pages/Blog"),
        import("../shared/pages/Resources"),
        import("../shared/pages/Help"),
      ];

      const results = await Promise.allSettled(preloadPromises);
      return handleSettledResults(results, "shared");
    } catch (error) {
      logger.warn("Unexpected error during shared route preloading:", error);
      return [];
    }
  },

  // Enhanced utility for preloading multiple categories with detailed reporting
  preloadMultiple: async (
    categories: PreloadCategory[]
  ): Promise<SettledResult[]> => {
    try {
      // Limit concurrent preloads to prevent performance issues
      const maxConcurrent = 2;
      const results: SettledResult[] = [];

      for (let i = 0; i < categories.length; i += maxConcurrent) {
        const batch = categories.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((category) =>
          preloadRoutes[category]()
        );
        const batchResults = await Promise.allSettled(batchPromises);

        results.push(
          ...batchResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value : []
          )
        );

        // Small delay between batches to prevent overwhelming the browser
        if (i + maxConcurrent < categories.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info(`Completed preloading ${categories.length} route categories`);
      return results;
    } catch (error) {
      logger.warn(
        "Unexpected error during multiple category preloading:",
        error
      );
      return [];
    }
  },

  // Optimized priority-based preloading
  preloadByPriority: async (
    priority: "high" | "normal" | "low"
  ): Promise<SettledResult[]> => {
    const priorityRoutes = {
      high: ["property", "user"],
      normal: ["trust", "search"],
      low: ["shared", "communication"],
    };

    const categories = priorityRoutes[priority] as PreloadCategory[];
    return preloadRoutes.preloadMultiple(categories);
  },
};

// Type-safe route management with enhanced validation
export type RouteNames = keyof typeof WorkingRoutes;

// Enhanced utility function with better error handling and validation
export const getRouteComponent = (routeName: RouteNames): LazyComponent => {
  // Validate route name at runtime for additional safety
  if (!routeName || typeof routeName !== "string") {
    throw new Error("Route name must be a non-empty string");
  }

  const component = WorkingRoutes[routeName];
  if (!component) {
    throw new Error(
      `Route component "${routeName}" not found in WorkingRoutes`
    );
  }

  return component;
};

// Enhanced performance monitoring with better analytics integration
interface AnalyticsWindow {
  gtag?: (
    command: string,
    eventName: string,
    parameters: Record<string, unknown>
  ) => void;
}

// More comprehensive route performance tracking system
export const routePerformance = {
  // Enhanced analytics integration with better error handling
  trackRouteLoad: (routeName: string, loadTime: number): void => {
    if (typeof window === "undefined") return;

    const analyticsWindow = window as typeof window & AnalyticsWindow;

    // Validate parameters before sending analytics
    if (!routeName || typeof loadTime !== "number" || loadTime < 0) {
      logger.warn("Invalid parameters for route load tracking:", {
        routeName,
        loadTime,
      });
      return;
    }

    if (analyticsWindow.gtag) {
      try {
        analyticsWindow.gtag("event", "route_load_time", {
          event_category: "Performance",
          event_label: routeName,
          value: Math.round(loadTime),
          custom_map: {
            route_name: routeName,
          },
        });
      } catch (error) {
        logger.warn("Failed to track route load time:", error);
      }
    }
  },

  // Enhanced performance metrics collection with validation
  getRouteMetrics: (): PerformanceEntry[] => {
    if (!performanceTracker.isAvailable) {
      return [];
    }

    try {
      const navigationEntries =
        window.performance.getEntriesByType("navigation");
      const resourceEntries = window.performance.getEntriesByType("resource");

      return [...navigationEntries, ...resourceEntries];
    } catch (error) {
      logger.warn("Failed to get performance metrics:", error);
      return [];
    }
  },

  // Enhanced route transition measurement with better callback handling
  measureRouteTransition: (
    routeName: string,
    callback: () => void | Promise<void>
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const handleCallback = async () => {
        if (!performanceTracker.isAvailable) {
          try {
            await callback();
            resolve();
          } catch (error) {
            reject(error);
          }
          return;
        }

        const startTime = performanceTracker.now();

        try {
          await callback();
          const endTime = performanceTracker.now();
          const transitionTime = endTime - startTime;

          routePerformance.trackRouteLoad(routeName, transitionTime);

          if (process.env.NODE_ENV === "development") {
            logger.info(
              `Route transition completed: ${routeName} (${Math.round(transitionTime)}ms)`
            );
          }

          resolve();
        } catch (error) {
          logger.error(`Route transition failed for ${routeName}:`, error);
          reject(error);
        }
      };

      handleCallback();
    });
  },

  // New utility for comprehensive performance analysis
  getPerformanceSummary: (): Record<string, unknown> => {
    if (!performanceTracker.isAvailable) {
      return { available: false };
    }

    try {
      const metrics = routePerformance.getRouteMetrics();
      const navigationMetrics = metrics.filter((entry) =>
        entry.name.includes("navigation")
      );

      return {
        available: true,
        totalMetrics: metrics.length,
        navigationCount: navigationMetrics.length,
        averageLoadTime:
          navigationMetrics.length > 0 ?
            Math.round(
              navigationMetrics.reduce(
                (sum, entry) => sum + entry.duration,
                0
              ) / navigationMetrics.length
            )
          : 0,
      };
    } catch (error) {
      logger.warn("Failed to generate performance summary:", error);
      return { available: true, error: "Failed to generate summary" };
    }
  },
};
