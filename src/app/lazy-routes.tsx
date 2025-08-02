/**
 * Unified Lazy-Route System – Final & Comprehensive
 * ------------------------------------------------
 * Covers every module shown in the project architecture.
 * • All domains (auth, property, trust, user, search, etc.)
 * • All utility pages (legal, help, docs, dev-tools)
 * • All coming-soon placeholders
 * • All solution-specific pages
 * • All admin / monitoring / dev routes
 */

import { lazy, ComponentType } from "react";

import {
  performanceTracker,
  logger,
  trackRoutePerformance,
} from "./route-performance";

/* ---------------------------------- */
/* 1. CONSTANTS                       */
/* ---------------------------------- */
const COMING_SOON_LABEL = "Coming Soon";

/* ---------------------------------- */
/* 2. GLOBAL TYPE EXTENSIONS          */
/* ---------------------------------- */
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

/* ---------------------------------- */
/* 2. TYPES                           */
/* ---------------------------------- */
interface LazyRouteConfiguration {
  readonly routePath?: string;
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly preloadPriority?: PreloadPriority;
}
type LazyComponent = ComponentType<Record<string, unknown>>;
type ModuleWithDefault<T = ComponentType<Record<string, unknown>>> = {
  readonly default: T;
};
type PreloadPriority = "high" | "normal" | "low";

/* ---------------------------------- */
/* 3. INTERNAL UTILS                  */
/* ---------------------------------- */
const isRetryableNetworkError = (err: unknown): boolean =>
  err instanceof Error &&
  /loading chunk|chunkloaderror|fetch|network/i.test(err.message);

async function retryImport(
  fn: () => Promise<ModuleWithDefault>,
  routePath?: string,
  maxRetries = 2
): Promise<ModuleWithDefault> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt < maxRetries && isRetryableNetworkError(e)) {
        logger.warn(`Retrying load (${attempt + 1}) for ${routePath ?? "?"}`);
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Unreachable");
}

function validateModule(
  mod: unknown,
  routePath?: string
): asserts mod is ModuleWithDefault {
  if (!mod || typeof mod !== "object" || !("default" in mod)) {
    throw new Error(
      `Invalid module at ${routePath ?? "unknown"}: missing default export`
    );
  }
}

async function loadModuleWithRetry(
  fn: () => Promise<ModuleWithDefault>,
  routePath?: string
): Promise<ModuleWithDefault> {
  const mod = await retryImport(fn, routePath);
  validateModule(mod, routePath);
  return mod;
}

async function loadFallbackModule(
  title: string,
  description: string,
  originalError: unknown
): Promise<ModuleWithDefault> {
  try {
    const m = await import("../shared/pages/ComingSoon");
    validateModule(m);
    return {
      default: () =>
        m.default({
          title,
          description,
          expectedLaunch: COMING_SOON_LABEL,
          features: [],
        }),
    };
  } catch {
    throw originalError;
  }
}

async function handleRouteLoadError(
  e: unknown,
  routePath?: string,
  fallbackTitle?: string,
  fallbackDescription?: string
) {
  logger.error(`Route load failed: ${routePath ?? "unknown"}`, e);
  if (fallbackTitle && fallbackDescription) {
    return loadFallbackModule(fallbackTitle, fallbackDescription, e);
  }
  throw e;
}

/* ---------------------------------- */
/* 4. CREATOR FACTORIES               */
/* ---------------------------------- */
const createLazyRoute = (
  importFn: () => Promise<ModuleWithDefault>,
  cfg: LazyRouteConfiguration = {}
): LazyComponent => {
  const { routePath, fallbackTitle, fallbackDescription, preloadPriority } =
    cfg;
  return lazy(async () => {
    const t0 = performanceTracker.now();
    try {
      logger.info(`Loading ${routePath ?? "unknown"}`);
      const mod = await loadModuleWithRetry(importFn, routePath);
      trackRoutePerformance(t0, routePath, preloadPriority);
      logger.info(`Loaded ${routePath ?? "unknown"}`);
      return mod;
    } catch (e) {
      return handleRouteLoadError(
        e,
        routePath,
        fallbackTitle,
        fallbackDescription
      );
    }
  });
};

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
        default: () =>
          module.default({
            title,
            description,
            expectedLaunch: COMING_SOON_LABEL,
            features: [],
          }),
      };
    } catch (error) {
      logger.error("Failed to load ComingSoon component:", error);
      throw error;
    }
  });
};

/* ---------------------------------- */
/* 5. ROUTE DEFINITIONS               */
/* ---------------------------------- */
export const LazyRoutes = {
  /* --- Core / Shared --- */
  Home: createLazyRoute(() => import("../shared/pages/Home"), {
    routePath: "/",
    preloadPriority: "high",
  }),
  Features: createLazyRoute(() => import("../shared/pages/Features"), {
    routePath: "/features",
    preloadPriority: "high",
  }),
  Pricing: createLazyRoute(() => import("../shared/pages/Pricing"), {
    routePath: "/pricing",
    preloadPriority: "high",
  }),
  About: createLazyRoute(() => import("../shared/pages/About"), {
    routePath: "/about",
    preloadPriority: "normal",
  }),
  Services: createLazyRoute(() => import("../shared/pages/Services"), {
    routePath: "/services",
    preloadPriority: "normal",
  }),
  Solutions: createLazyRoute(() => import("../shared/pages/Solutions"), {
    routePath: "/solutions",
    preloadPriority: "normal",
  }),
  Blog: createLazyRoute(() => import("../shared/pages/Blog"), {
    routePath: "/blog",
    preloadPriority: "low",
  }),
  BlogPost: createLazyRoute(() => import("../shared/pages/BlogPost"), {
    routePath: "/blog/:slug",
    preloadPriority: "low",
  }),
  Resources: createLazyRoute(() => import("../shared/pages/Resources"), {
    routePath: "/resources",
    preloadPriority: "low",
  }),
  Community: createLazyRoute(() => import("../shared/pages/Community"), {
    routePath: "/community",
    preloadPriority: "normal",
  }),
  CommunityAndResources: createLazyRoute(
    () => import("../shared/pages/CommunityAndResources"),
    { routePath: "/community-resources", preloadPriority: "normal" }
  ),
  FraudResources: createLazyRoute(
    () => import("../shared/pages/Fraud-resources"),
    { routePath: "/fraud-resources", preloadPriority: "high" }
  ),
  OurStory: createLazyRoute(() => import("../shared/pages/OurStory"), {
    routePath: "/our-story",
    preloadPriority: "low",
  }),
  Partners: createLazyRoute(() => import("../shared/pages/Partners"), {
    routePath: "/partners",
    preloadPriority: "low",
  }),
  PressMedia: createLazyRoute(() => import("../shared/pages/PressMedia"), {
    routePath: "/press",
    preloadPriority: "low",
  }),

  /* --- Auth --- */
  Login: createLazyRoute(() => import("../auth/pages/Login"), {
    routePath: "/auth/login",
    preloadPriority: "high",
  }),
  Register: createLazyRoute(() => import("../auth/pages/Register"), {
    routePath: "/auth/register",
    preloadPriority: "high",
  }),
  ForgotPassword: createComingSoonRoute(
    "Forgot Password",
    "Reset your password securely with email verification."
  ),

  /* --- User --- */
  Dashboard: createLazyRoute(() => import("../user/pages/Dashboard"), {
    routePath: "/dashboard",
    preloadPriority: "high",
  }),
  UserProfile: createLazyRoute(() => import("../user/pages/UserProfile"), {
    routePath: "/profile",
    preloadPriority: "normal",
  }),
  UserSettings: createLazyRoute(() => import("../user/pages/UserSettings"), {
    routePath: "/settings",
    preloadPriority: "normal",
  }),
  Team: createLazyRoute(() => import("../user/pages/Team"), {
    routePath: "/team",
    preloadPriority: "low",
  }),
  Tenants: createLazyRoute(() => import("../user/pages/Tenants"), {
    routePath: "/tenants",
    preloadPriority: "normal",
  }),

  /* --- Property --- */
  Properties: createLazyRoute(() => import("../shared/pages/Properties"), {
    routePath: "/properties",
    preloadPriority: "high",
  }),
  PropertyDetails: createLazyRoute(
    () => import("../property/pages/PropertyDetails"),
    { routePath: "/property/:id", preloadPriority: "high" }
  ),
  PropertyEdit: createLazyRoute(
    () => import("../property/pages/PropertyEdit"),
    { routePath: "/property/:id/edit", preloadPriority: "normal" }
  ),
  PropertyCompare: createLazyRoute(
    () => import("../property/pages/PropertyCompare"),
    { routePath: "/compare", preloadPriority: "normal" }
  ),
  ListProperty: createLazyRoute(
    () => import("../property/pages/ListProperty"),
    {
      routePath: "/list-property",
      preloadPriority: "normal",
    }
  ),
  PropertyWizard: createLazyRoute(
    () => import("../property/pages/PropertyWizard"),
    { routePath: "/property/wizard", preloadPriority: "normal" }
  ),
  PropertyMap: createLazyRoute(() => import("../property/pages/PropertyMap"), {
    routePath: "/property/map",
    preloadPriority: "normal",
  }),
  PropertyPhotos: createLazyRoute(
    () => import("../property/pages/PropertyPhotos"),
    { routePath: "/property/photos", preloadPriority: "low" }
  ),
  PropertyOptimize: createLazyRoute(
    () => import("../property/pages/PropertyOptimize"),
    { routePath: "/property/optimize", preloadPriority: "low" }
  ),
  PropertyVerification: createLazyRoute(
    () => import("../property/pages/PropertyVerification"),
    { routePath: "/property/verification", preloadPriority: "normal" }
  ),
  VerifyProperty: createLazyRoute(
    () => import("../property/pages/VerifyProperty"),
    { routePath: "/verify-property", preloadPriority: "normal" }
  ),
  PropertiesResidential: createLazyRoute(
    () => import("../property/pages/PropertiesResidential"),
    { routePath: "/properties/residential", preloadPriority: "normal" }
  ),
  PropertiesCommercial: createLazyRoute(
    () => import("../property/pages/CommercialProperties"),
    { routePath: "/properties/commercial", preloadPriority: "normal" }
  ),
  Lands: createLazyRoute(() => import("../property/pages/Lands"), {
    routePath: "/properties/land",
    preloadPriority: "normal",
  }),
  LandDetails: createLazyRoute(() => import("../property/pages/LandDetails"), {
    routePath: "/land/:id",
    preloadPriority: "normal",
  }),
  ImageGallery: createLazyRoute(
    () => import("../property/pages/ImageGallery"),
    {
      routePath: "/property/gallery",
      preloadPriority: "low",
    }
  ),

  /* --- Land Verification (Kenya) --- */
  LandVerification: createLazyRoute(
    () => import("../land-verification/pages/LandVerificationPage"),
    { routePath: "/land-verification", preloadPriority: "normal" }
  ),
  LandVerificationDashboard: createLazyRoute(
    () => import("../land-verification/pages/LandVerificationDashboardPage"),
    { routePath: "/land-verification/dashboard", preloadPriority: "normal" }
  ),
  NewLandVerification: createLazyRoute(
    () => import("../land-verification/pages/NewVerificationPage"),
    { routePath: "/land-verification/new", preloadPriority: "normal" }
  ),

  /* --- Trust & Fraud --- */
  BasicChecks: createLazyRoute(() => import("../trust/pages/BasicChecks"), {
    routePath: "/trust/basic-checks",
    preloadPriority: "normal",
  }),
  FraudDetection: createLazyRoute(
    () => import("../trust/pages/FraudDetection"),
    { routePath: "/trust/fraud-detection", preloadPriority: "normal" }
  ),
  DocumentAuth: createLazyRoute(() => import("../trust/pages/DocumentAuth"), {
    routePath: "/trust/document-auth",
    preloadPriority: "normal",
  }),
  TrustReports: createLazyRoute(() => import("../trust/pages/Reports"), {
    routePath: "/trust/reports",
    preloadPriority: "normal",
  }),
  TrustAlerts: createLazyRoute(() => import("../trust/pages/Alerts"), {
    routePath: "/trust/alerts",
    preloadPriority: "normal",
  }),
  TrustKarma: createLazyRoute(() => import("../trust/pages/Karma"), {
    routePath: "/trust/karma",
    preloadPriority: "low",
  }),
  TrustReputation: createLazyRoute(() => import("../trust/pages/Reputation"), {
    routePath: "/trust/reputation",
    preloadPriority: "low",
  }),
  TrustPoints: createLazyRoute(() => import("../trust/pages/TrustPoints"), {
    routePath: "/trust/points",
    preloadPriority: "low",
  }),
  TrustReviews: createLazyRoute(() => import("../trust/pages/Reviews"), {
    routePath: "/trust/reviews",
    preloadPriority: "normal",
  }),
  FraudProtectionInfo: createLazyRoute(
    () => import("../trust/pages/FraudProtectionInfo"),
    { routePath: "/trust/fraud-protection", preloadPriority: "normal" }
  ),

  /* --- Communication --- */
  Inbox: createLazyRoute(() => import("../communication/pages/Inbox"), {
    routePath: "/inbox",
    preloadPriority: "normal",
  }),

  /* --- Search & Discovery --- */
  SearchResults: createLazyRoute(
    () => import("../search/pages/SearchResults"),
    { routePath: "/search", preloadPriority: "normal" }
  ),

  /* --- Legal & Support --- */
  Help: createLazyRoute(() => import("../shared/pages/Help"), {
    routePath: "/help",
    preloadPriority: "normal",
  }),
  Contact: createLazyRoute(() => import("../shared/pages/Contact"), {
    routePath: "/contact",
    preloadPriority: "normal",
  }),
  Privacy: createLazyRoute(() => import("../shared/pages/Privacy"), {
    routePath: "/privacy",
    preloadPriority: "low",
  }),
  Terms: createLazyRoute(() => import("../shared/pages/Terms"), {
    routePath: "/terms",
    preloadPriority: "low",
  }),
  Cookies: createLazyRoute(() => import("../shared/pages/Cookies"), {
    routePath: "/cookies",
    preloadPriority: "low",
  }),
  Security: createLazyRoute(() => import("../shared/pages/Security"), {
    routePath: "/security",
    preloadPriority: "low",
  }),

  /* --- Developer & Admin --- */
  DeveloperDashboard: createLazyRoute(
    () => import("../shared/pages/DeveloperDashboard"),
    { routePath: "/dev", preloadPriority: "low" }
  ),
  AdminDashboard: createComingSoonRoute(
    "Admin Dashboard",
    "Administrative tools for system management and oversight."
  ),
  SystemMonitoring: createComingSoonRoute(
    "System Monitoring",
    "Real-time system health and performance monitoring."
  ),

  /* --- Demo & Utility --- */
  MVPDemo: createLazyRoute(() => import("../shared/pages/MVP-Demo"), {
    routePath: "/demo",
    preloadPriority: "high",
  }),
  NavigationTest: createLazyRoute(() => import("../shared/pages/NavigationTest"), {
    routePath: "/nav-test",
    preloadPriority: "low",
  }),
  ApiDemo: createLazyRoute(() => import("../shared/pages/ApiDemo"), {
    routePath: "/api-demo",
    preloadPriority: "normal",
  }),
  ContactSales: createLazyRoute(() => import("../shared/pages/ContactSales"), {
    routePath: "/contact-sales",
    preloadPriority: "normal",
  }),

  /* --- Documents & File Handling --- */
  DocumentsPage: createComingSoonRoute(
    "Documents",
    "Manage and organize your property documents securely."
  ),
  DocumentUpload: createComingSoonRoute(
    "Document Upload",
    "Upload and verify property documents with AI assistance."
  ),
  DocumentViewer: createComingSoonRoute(
    "Document Viewer",
    "View and analyze property documents with advanced tools."
  ),

  /* --- Location Services --- */
  LocationServices: createComingSoonRoute(
    "Location Services",
    "Advanced location-based property services and mapping."
  ),

  /* --- Error & Fallback --- */
  NotFound: createLazyRoute(() => import("../shared/pages/NotFound"), {
    routePath: "/404",
    preloadPriority: "normal",
  }),
  ComingSoon: createComingSoonRoute(
    COMING_SOON_LABEL,
    "This feature is coming soon. Stay tuned for updates!"
  ),

  /* --- Coming-Soon Placeholders --- */
  AdvancedSearch: createComingSoonRoute(
    "Advanced Search",
    "Powerful search tools with AI-powered recommendations."
  ),
  Notifications: createComingSoonRoute(
    "Notifications Center",
    "Manage all your notifications in one place."
  ),
  MessageCenter: createComingSoonRoute(
    "Message Center",
    "Secure messaging platform for property stakeholders."
  ),
  ExpertCoordination: createComingSoonRoute(
    "Expert Coordination",
    "Connect with legal experts, surveyors, and local authorities."
  ),
  PhysicalVerification: createComingSoonRoute(
    "Physical Verification",
    "Schedule on-ground property inspections with certified experts."
  ),
  CommunityIntelligence: createComingSoonRoute(
    "Community Intelligence",
    "Leverage community insights for better verification decisions."
  ),
  HelpGettingStarted: createComingSoonRoute(
    "Getting Started Guide",
    "Comprehensive guide to using TripleCheck effectively."
  ),
  HelpVerification: createComingSoonRoute(
    "Verification Guide",
    "Step-by-step guide to the property verification process."
  ),
  HelpFAQ: createComingSoonRoute(
    "Frequently Asked Questions",
    "Quick answers to the most common questions."
  ),
  SearchFilters: createComingSoonRoute(
    "Search Filters",
    "Customize and save search preferences."
  ),

  /* --- Solution Segments --- */
  SolutionsBuyers: createLazyRoute(
    () => import("../shared/pages/solutions/PropertyBuyers"),
    { routePath: "/solutions/buyers", preloadPriority: "normal" }
  ),
  SolutionsSellers: createLazyRoute(
    () => import("../shared/pages/solutions/PropertySellers"),
    { routePath: "/solutions/sellers", preloadPriority: "normal" }
  ),
  SolutionsAgents: createLazyRoute(
    () => import("../shared/pages/solutions/RealEstateAgents"),
    { routePath: "/solutions/agents", preloadPriority: "normal" }
  ),
  SolutionsDevelopers: createLazyRoute(
    () => import("../shared/pages/solutions/PropertyDevelopers"),
    { routePath: "/solutions/developers", preloadPriority: "normal" }
  ),
  SolutionsLegalExperts: createLazyRoute(
    () => import("../shared/pages/solutions/LegalExperts"),
    { routePath: "/solutions/legal-experts", preloadPriority: "normal" }
  ),
} as const;

/* ---------------------------------- */
/* 6. PRE-LOADING SYSTEM              */
/* ---------------------------------- */
type PreloadCategory =
  | "core"
  | "auth"
  | "property"
  | "landVerification"
  | "trust"
  | "user"
  | "communication"
  | "search"
  | "analytics"
  | "content"
  | "legal"
  | "document"
  | "location";
type SettledResult = PromiseSettledResult<unknown>;

const handleSettled = (results: SettledResult[], cat: string) => {
  if (process.env.NODE_ENV !== "development") return results;
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    logger.warn(`${failed.length}/${results.length} ${cat} preloads failed`);
  } else {
    logger.info(`Preloaded ${results.length} ${cat} routes`);
  }
  return results;
};

export const preloadRoutes = {
  core: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../shared/pages/Home"),
        import("../shared/pages/Features"),
        import("../shared/pages/Pricing"),
        import("../shared/pages/About"),
      ]),
      "core"
    ),
  auth: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../auth/pages/Login"),
        import("../auth/pages/Register"),
      ]),
      "auth"
    ),
  property: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../property/pages/PropertyDetails"),
        import("../property/pages/PropertyCompare"),
        import("../property/pages/PropertyEdit"),
        import("../property/pages/ListProperty"),
        import("../property/pages/PropertyMap"),
        import("../property/pages/PropertyWizard"),
        import("../property/pages/Lands"),
        import("../property/pages/LandDetails"),
      ]),
      "property"
    ),
  landVerification: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../land-verification/pages/LandVerificationPage"),
        import("../land-verification/pages/LandVerificationDashboardPage"),
        import("../land-verification/pages/NewVerificationPage"),
      ]),
      "landVerification"
    ),
  trust: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../trust/pages/BasicChecks"),
        import("../trust/pages/FraudDetection"),
        import("../trust/pages/DocumentAuth"),
        import("../trust/pages/Reports"),
        import("../trust/pages/Alerts"),
        import("../trust/pages/Reviews"),
        import("../trust/pages/TrustPoints"),
      ]),
      "trust"
    ),
  user: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../user/pages/Dashboard"),
        import("../user/pages/Tenants"),
        import("../user/pages/Team"),
        import("../user/pages/UserProfile"),
        import("../user/pages/UserSettings"),
      ]),
      "user"
    ),
  communication: async () =>
    handleSettled(
      await Promise.allSettled([import("../communication/pages/Inbox")]),
      "communication"
    ),
  search: async () =>
    handleSettled(
      await Promise.allSettled([import("../search/pages/SearchResults")]),
      "search"
    ),
  analytics: async () =>
    handleSettled(
      await Promise.allSettled([import("../analytics/pages/Analytics")]),
      "analytics"
    ),
  content: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../shared/pages/Blog"),
        import("../shared/pages/Community"),
        import("../shared/pages/Resources"),
        import("../shared/pages/Services"),
        import("../shared/pages/Solutions"),
        import("../shared/pages/Help"),
      ]),
      "content"
    ),
  legal: async () =>
    handleSettled(
      await Promise.allSettled([
        import("../shared/pages/Help"),
        import("../shared/pages/Contact"),
        import("../shared/pages/Privacy"),
        import("../shared/pages/Terms"),
        import("../shared/pages/Security"),
      ]),
      "legal"
    ),
  document: async () => {
    // Document routes are coming soon placeholders, no preloading needed
    return [];
  },
  location: async () => {
    // Location services are coming soon placeholders, no preloading needed
    return [];
  },

  preloadMultiple: async (categories: PreloadCategory[]) => {
    const batches: Promise<SettledResult[]>[] = categories.map((c) =>
      preloadRoutes[c]()
    );
    return (await Promise.all(batches)).flat();
  },

  preloadByPriority: async (priority: PreloadPriority) => {
    const map = {
      high: [
        "core",
        "auth",
        "property",
        "landVerification",
      ] as PreloadCategory[],
      normal: [
        "trust",
        "user",
        "search",
        "communication",
        "document",
        "location",
      ] as PreloadCategory[],
      low: ["content", "analytics", "legal"] as PreloadCategory[],
    };
    return preloadRoutes.preloadMultiple(map[priority]);
  },
} as const;

/* ---------------------------------- */
/* 7. EXPORTS                         */
/* ---------------------------------- */
export type RouteNames = keyof typeof LazyRoutes;
export const getRouteComponent = (name: RouteNames) => {
  const C = LazyRoutes[name];
  if (!C) throw new Error(`Route "${name}" not found`);
  return C;
};

// Backward compatibility
export const WorkingRoutes = LazyRoutes;
