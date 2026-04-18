/**
 * Unified Lazy-Route System – OPTIMIZED & COMPREHENSIVE
 * ------------------------------------------------
 * Covers every module shown in the project architecture with enhanced
 * TypeScript safety, error handling, and performance optimizations.
 * • All domains (auth, property, trust, user, search, etc.)
 * • All utility pages (legal, help, docs, dev-tools)
 * • All coming-soon placeholders
 * • All solution-specific pages
 * • All admin / monitoring / dev routes
 */

import { lazy, ComponentType } from 'react'

import {
  performanceTracker,
  logger,
  trackRoutePerformance,
} from './route-performance'

/* ---------------------------------- */
/* 1. CONSTANTS                       */
/* ---------------------------------- */
const COMING_SOON_LABEL = 'Coming Soon';
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_BASE = 100; // milliseconds

/* ---------------------------------- */
/* 2. GLOBAL TYPE EXTENSIONS          */
/* ---------------------------------- */
declare global {
  interface Window {
    performance: Performance;
    console: Console;
    gtag?: (...args: any[]) => void;
  }
}

/* ---------------------------------- */
/* 3. TYPES                           */
/* ---------------------------------- */
interface LazyRouteConfiguration {
  readonly routePath?: string;
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly preloadPriority?: PreloadPriority;
}

type LazyComponent = ComponentType<Record<string, unknown>>;

// Enhanced module type that handles both default and named exports
type ModuleWithDefault<T = ComponentType<Record<string, unknown>>> = {
  readonly default: T;
};

// Flexible module type that can handle components or named exports
type FlexibleModule<T = ComponentType<Record<string, unknown>>> = 
  | ModuleWithDefault<T>
  | T
  | { [key: string]: T };

type PreloadPriority = 'high' | 'normal' | 'low';

/* ---------------------------------- */
/* 4. ENHANCED UTILITIES              */
/* ---------------------------------- */

/**
 * Checks if an error is related to network issues that might benefit from retry
 * This includes chunk loading errors, network failures, and fetch problems
 */
const isRetryableNetworkError = (err: unknown): boolean =>
  err instanceof Error &&
  /loading chunk|chunkloaderror|fetch|network/i.test(err.message);

/**
 * Attempts to import a module with exponential backoff retry logic
 * This helps handle transient network issues during code splitting
 */
async function retryImport(
  importFunction: () => Promise<unknown>,
  routePath?: string,
  maxRetries = MAX_RETRY_ATTEMPTS
): Promise<unknown> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFunction();
    } catch (error) {
      if (attempt < maxRetries && isRetryableNetworkError(error)) {
        logger.warn(`Retrying load (${attempt + 1}) for ${routePath ?? 'unknown route'}`);
        await new Promise((resolve) => 
          setTimeout(resolve, RETRY_DELAY_BASE * (2 ** attempt))
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('Maximum retry attempts exceeded');
}

/**
 * Safely extracts a React component from various module export formats
 * Handles default exports, named exports, and direct component exports
 */
function extractComponent(
  module: unknown,
  routePath?: string
): ComponentType<Record<string, unknown>> {
  // Handle direct component (rare but possible)
  if (typeof module === 'function') {
    return module as ComponentType<Record<string, unknown>>;
  }

  // Handle object with default export
  if (module && typeof module === 'object' && 'default' in module) {
    const defaultExport = (module as { default: unknown }).default;
    if (typeof defaultExport === 'function') {
      return defaultExport as ComponentType<Record<string, unknown>>;
    }
  }

  // Handle named exports - try common component names
  if (module && typeof module === 'object') {
    const moduleObj = module as Record<string, unknown>;
    const commonNames = ['Component', 'default', routePath?.split('/').pop()];
    
    for (const name of commonNames) {
      if (name && typeof moduleObj[name] === 'function') {
        return moduleObj[name] as ComponentType<Record<string, unknown>>;
      }
    }
  }

  throw new Error(
    `Invalid module at ${routePath ?? 'unknown'}: no valid React component found`
  );
}

/**
 * Validates and processes a module after import
 * Ensures we have a valid React component regardless of export format
 */
function validateAndProcessModule(
  module: unknown,
  routePath?: string
): ModuleWithDefault {
  try {
    const component = extractComponent(module, routePath);
    return { default: component };
  } catch (error) {
    logger.error(`Module validation failed for ${routePath ?? 'unknown'}:`, error);
    throw new Error(
      `Invalid module at ${routePath ?? 'unknown'}: ${
        error instanceof Error ? error.message : 'unknown error'
      }`
    );
  }
}

/**
 * Main module loading function with retry and validation
 * This is the core function that handles all the complexity of dynamic imports
 */
async function loadModuleWithRetry(
  importFunction: () => Promise<unknown>,
  routePath?: string
): Promise<ModuleWithDefault> {
  const rawModule = await retryImport(importFunction, routePath);
  return validateAndProcessModule(rawModule, routePath);
}

/**
 * Creates a fallback component when the main module fails to load
 * Uses the ComingSoon component as a graceful degradation
 */
async function loadFallbackModule(
  title: string,
  description: string,
  originalError: unknown
): Promise<ModuleWithDefault> {
  try {
    const comingSoonModule = await import('../local/pages/ComingSoon');
    const ComingSoonComponent = extractComponent(comingSoonModule);
    
    return {
      default: () => {
        const Component = ComingSoonComponent as React.ComponentType<any>;
        return (
          <Component
            title={title}
            description={description}
            expectedLaunch={COMING_SOON_LABEL}
            features={[]}
          />
        );
      },
    };
  } catch (fallbackError) {
    logger.error('Failed to load fallback component:', fallbackError);
    throw originalError; // Return original error if fallback fails
  }
}

/**
 * Centralized error handling for route loading failures
 * Decides whether to show fallback or throw the error
 */
async function handleRouteLoadError(
  error: unknown,
  routePath?: string,
  fallbackTitle?: string,
  fallbackDescription?: string
): Promise<ModuleWithDefault> {
  logger.error(`Route load failed: ${routePath ?? 'unknown'}`, error);
  
  if (fallbackTitle && fallbackDescription) {
    return loadFallbackModule(fallbackTitle, fallbackDescription, error);
  }
  
  throw error;
}

/* ---------------------------------- */
/* 5. CREATOR FACTORIES               */
/* ---------------------------------- */

/**
 * Creates a lazy-loaded route component with comprehensive error handling
 * This is the main factory function for creating route components
 */
const createLazyRoute = (
  importFunction: () => Promise<unknown>,
  configuration: LazyRouteConfiguration = {}
): LazyComponent => {
  const { 
    routePath, 
    fallbackTitle, 
    fallbackDescription, 
    preloadPriority 
  } = configuration;

  return lazy(async (): Promise<ModuleWithDefault> => {
    const startTime = performanceTracker.now();
    
    try {
      logger.info(`Loading route: ${routePath ?? 'unknown'}`);
      
      const moduleResult = await loadModuleWithRetry(importFunction, routePath);
      
      trackRoutePerformance(startTime, routePath, preloadPriority);
      logger.info(`Successfully loaded route: ${routePath ?? 'unknown'}`);
      
      return moduleResult;
    } catch (error) {
      return handleRouteLoadError(
        error,
        routePath,
        fallbackTitle,
        fallbackDescription
      );
    }
  });
};

/**
 * Creates a standardized "Coming Soon" route component
 * Used for features that are planned but not yet implemented
 */
const createComingSoonRoute = (
  title: string,
  description: string
): LazyComponent => {
  return lazy(async (): Promise<ModuleWithDefault> => {
    try {
      const comingSoonModule = await import('../local/pages/ComingSoon');
      const ComingSoonComponent = extractComponent(comingSoonModule);
      
      return {
        default: () => {
          const Component = ComingSoonComponent as React.ComponentType<any>;
          return (
            <Component
              title={title}
              description={description}
              expectedLaunch={COMING_SOON_LABEL}
              features={[]}
            />
          );
        },
      };
    } catch (error) {
      logger.error('Failed to load ComingSoon component:', error);
      throw error;
    }
  });
};

/* ---------------------------------- */
/* 6. ROUTE DEFINITIONS               */
/* ---------------------------------- */
export const LazyRoutes = {
  /* --- Core / Shared Routes --- */
  Home: createLazyRoute(() => import('../local/pages/Home'), {
    routePath: '/',
    preloadPriority: 'high',
  }),
  Features: createLazyRoute(() => import('../local/pages/Features'), {
    routePath: '/features',
    preloadPriority: 'high',
  }),
  Pricing: createLazyRoute(() => import('../local/pages/Pricing'), {
    routePath: '/pricing',
    preloadPriority: 'high',
  }),
  About: createLazyRoute(() => import('../local/pages/About'), {
    routePath: '/about',
    preloadPriority: 'normal',
  }),
  Services: createLazyRoute(() => import('../local/pages/Services'), {
    routePath: '/services',
    preloadPriority: 'normal',
  }),
  Solutions: createLazyRoute(() => import('../local/pages/Solutions'), {
    routePath: '/solutions',
    preloadPriority: 'normal',
  }),
  Blog: createLazyRoute(() => import('../local/pages/Blog'), {
    routePath: '/blog',
    preloadPriority: 'low',
  }),
  BlogPost: createLazyRoute(() => import('../local/pages/BlogPost'), {
    routePath: '/blog/:slug',
    preloadPriority: 'low',
  }),
  BlogTest: createLazyRoute(() => import('../local/pages/BlogTest'), {
    routePath: '/blog-test',
    preloadPriority: 'low',
  }),
  Resources: createLazyRoute(() => import('../local/pages/Resources'), {
    routePath: '/resources',
    preloadPriority: 'low',
  }),
  Community: createLazyRoute(() => import('../local/pages/Community'), {
    routePath: '/community',
    preloadPriority: 'normal',
  }),
  CommunityAndResources: createLazyRoute(
    () => import('../local/pages/CommunityAndResources'),
    { routePath: '/community-resources', preloadPriority: 'normal' }
  ),
  FraudResources: createLazyRoute(
    () => import('../local/pages/Fraud-resources'),
    { routePath: '/fraud-resources', preloadPriority: 'high' }
  ),
  OurStory: createLazyRoute(() => import('../local/pages/OurStory'), {
    routePath: '/our-story',
    preloadPriority: 'low',
  }),
  Partners: createLazyRoute(() => import('../local/pages/Partners'), {
    routePath: '/partners',
    preloadPriority: 'low',
  }),
  PressMedia: createLazyRoute(() => import('../local/pages/PressMedia'), {
    routePath: '/press',
    preloadPriority: 'low',
  }),

  /* --- Authentication Routes --- */
  Login: createLazyRoute(() => import('../auth/pages/Login'), {
    routePath: '/auth/login',
    preloadPriority: 'high',
  }),
  Register: createLazyRoute(() => import('../auth/pages/Register'), {
    routePath: '/auth/register',
    preloadPriority: 'high',
  }),
  ForgotPassword: createLazyRoute(
    () => import('../auth/pages/ForgotPassword'),
    { routePath: '/forgot-password', preloadPriority: 'high' }
  ),

  /* --- User Management Routes --- */
  Dashboard: createLazyRoute(() => import('../user/pages/Dashboard'), {
    routePath: '/dashboard',
    preloadPriority: 'high',
  }),
  UserProfile: createLazyRoute(() => import('../user/pages/UserProfile'), {
    routePath: '/profile',
    preloadPriority: 'normal',
  }),
  UserSettings: createLazyRoute(() => import('../user/pages/UserSettings'), {
    routePath: '/settings',
    preloadPriority: 'normal',
  }),
  Team: createLazyRoute(() => import('../user/pages/Team'), {
    routePath: '/team',
    preloadPriority: 'low',
  }),
  Tenants: createLazyRoute(() => import('../user/pages/Tenants'), {
    routePath: '/tenants',
    preloadPriority: 'normal',
  }),
  Activity: createLazyRoute(() => import('../user/pages/Activity'), {
    routePath: '/activity',
    preloadPriority: 'normal',
  }),

  /* --- Property Management Routes --- */
  Properties: createLazyRoute(() => import('../local/pages/Properties'), {
    routePath: '/properties',
    preloadPriority: 'high',
  }),
  PropertyDetails: createLazyRoute(
    () => import('../property/pages/PropertyDetails'),
    { routePath: '/property/:id', preloadPriority: 'high' }
  ),
  PropertyEdit: createLazyRoute(
    () => import('../property/pages/PropertyEdit'),
    { routePath: '/property/:id/edit', preloadPriority: 'normal' }
  ),
  PropertyCompare: createLazyRoute(
    () => import('../property/pages/PropertyCompare'),
    { routePath: '/compare', preloadPriority: 'normal' }
  ),
  ListProperty: createLazyRoute(
    () => import('../property/pages/ListProperty'),
    {
      routePath: '/list-property',
      preloadPriority: 'normal',
    }
  ),
  PropertyWizard: createLazyRoute(
    () => import('../property/pages/PropertyWizard'),
    { routePath: '/property/wizard', preloadPriority: 'normal' }
  ),
  // Fixed: Enhanced handling for component exports that might not have default
  PropertyMap: createLazyRoute(
    () => import('../property/components/PropertyMap'),
    {
      routePath: '/property/map',
      preloadPriority: 'normal',
      fallbackTitle: 'Property Map',
      fallbackDescription: 'Interactive property mapping feature',
    }
  ),
  PropertyPhotos: createLazyRoute(
    () => import('../property/pages/PropertyPhotos'),
    { routePath: '/property/photos', preloadPriority: 'low' }
  ),
  PropertyOptimize: createLazyRoute(
    () => import('../property/pages/PropertyOptimize'),
    { routePath: '/property/optimize', preloadPriority: 'low' }
  ),
  PropertyVerification: createLazyRoute(
    () => import('../property/pages/PropertyVerification'),
    { routePath: '/property/verification', preloadPriority: 'normal' }
  ),
  PropertiesResidential: createLazyRoute(
    () => import('../property/pages/PropertiesResidential'),
    { routePath: '/properties/residential', preloadPriority: 'normal' }
  ),
  PropertiesCommercial: createLazyRoute(
    () => import('../property/pages/CommercialProperties'),
    { routePath: '/properties/commercial', preloadPriority: 'normal' }
  ),
  Lands: createLazyRoute(() => import('../property/pages/Lands'), {
    routePath: '/properties/land',
    preloadPriority: 'normal',
  }),
  LandDetails: createLazyRoute(() => import('../property/pages/LandDetails'), {
    routePath: '/land/:id',
    preloadPriority: 'normal',
  }),
  LandRedirect: createLazyRoute(() => import('../property/pages/LandRedirect'), {
    routePath: '/land/:id',
    preloadPriority: 'high',
  }),

  /* --- Land Verification Routes (Kenya) --- */
  LandVerification: createLazyRoute(
    () => import('../land-verification/pages/LandVerificationPage'),
    { routePath: '/land-verification', preloadPriority: 'normal' }
  ),
  LandVerificationDashboard: createLazyRoute(
    () => import('../land-verification/pages/LandVerificationDashboardPage'),
    { routePath: '/land-verification/dashboard', preloadPriority: 'normal' }
  ),
  NewLandVerification: createLazyRoute(
    () => import('../land-verification/pages/NewVerificationPage'),
    { routePath: '/land-verification/new', preloadPriority: 'normal' }
  ),

  /* --- Trust & Fraud Detection Routes --- */
  BasicChecks: createLazyRoute(() => import('../trust/pages/BasicChecks'), {
    routePath: '/trust/basic-checks',
    preloadPriority: 'normal',
  }),
  FraudDetection: createLazyRoute(
    () => import('../trust/pages/FraudDetection'),
    { routePath: '/trust/fraud-detection', preloadPriority: 'normal' }
  ),
  DocumentAuth: createLazyRoute(() => import('../trust/pages/DocumentAuth'), {
    routePath: '/trust/document-auth',
    preloadPriority: 'normal',
  }),
  TrustReports: createLazyRoute(() => import('../trust/pages/Reports'), {
    routePath: '/trust/reports',
    preloadPriority: 'normal',
  }),
  TrustAlerts: createLazyRoute(() => import('../trust/pages/Alerts'), {
    routePath: '/trust/alerts',
    preloadPriority: 'normal',
  }),
  TrustKarma: createLazyRoute(() => import('../trust/pages/Karma'), {
    routePath: '/trust/karma',
    preloadPriority: 'low',
  }),
  TrustReputation: createLazyRoute(
    () => import('../trust/pages/Reputation'),
    { routePath: '/trust/reputation', preloadPriority: 'low' }
  ),
  TrustPoints: createLazyRoute(() => import('../trust/pages/TrustPoints'), {
    routePath: '/trust/points',
    preloadPriority: 'low',
  }),
  TrustReviews: createLazyRoute(() => import('../trust/pages/Reviews'), {
    routePath: '/trust/reviews',
    preloadPriority: 'normal',
  }),
  FraudProtectionInfo: createLazyRoute(
    () => import('../trust/pages/FraudProtectionInfo'),
    { routePath: '/trust/fraud-protection', preloadPriority: 'normal' }
  ),
  VerificationDashboard: createLazyRoute(
    () => import('../trust/pages/VerificationDashboard'),
    { routePath: '/verification-dashboard', preloadPriority: 'normal' }
  ),

  /* --- Communication Routes --- */
  Inbox: createLazyRoute(() => import('../communication/pages/Inbox'), {
    routePath: '/inbox',
    preloadPriority: 'normal',
  }),

  /* --- Search & Discovery Routes --- */
  SearchResults: createLazyRoute(
    () => import('../search/pages/SearchResults'),
    { routePath: '/search', preloadPriority: 'normal' }
  ),

  /* --- Analytics Routes --- */
  // Fixed: Enhanced handling for component exports that might not have default
  Analytics: createLazyRoute(
    () => import('../analytics/components/AnalyticsDashboard'),
    { 
      routePath: '/analytics', 
      preloadPriority: 'normal',
      fallbackTitle: 'Analytics Dashboard',
      fallbackDescription: 'Comprehensive analytics and reporting',
    }
  ),

  /* --- Legal & Support Routes --- */
  Help: createLazyRoute(() => import('../local/pages/Help'), {
    routePath: '/help',
    preloadPriority: 'normal',
  }),
  GettingStarted: createLazyRoute(
    () => import('../local/pages/GettingStarted'),
    { routePath: '/help/getting-started', preloadPriority: 'normal' }
  ),
  Contact: createLazyRoute(() => import('../local/pages/Contact'), {
    routePath: '/contact',
    preloadPriority: 'normal',
  }),
  Privacy: createLazyRoute(() => import('../local/pages/Privacy'), {
    routePath: '/privacy',
    preloadPriority: 'low',
  }),
  Terms: createLazyRoute(() => import('../local/pages/Terms'), {
    routePath: '/terms',
    preloadPriority: 'low',
  }),
  Cookies: createLazyRoute(() => import('../local/pages/Cookies'), {
    routePath: '/cookies',
    preloadPriority: 'low',
  }),
  Security: createLazyRoute(() => import('../local/pages/Security'), {
    routePath: '/security',
    preloadPriority: 'low',
  }),

  /* --- Developer & Admin Routes --- */
  DeveloperDashboard: createLazyRoute(
    () => import('../local/pages/DeveloperDashboard'),
    { routePath: '/dev', preloadPriority: 'low' }
  ),
  AdminDashboard: createLazyRoute(
    () => import('../local/pages/AdminDashboard'),
    { routePath: '/admin', preloadPriority: 'low' }
  ),
  SystemMonitoring: createLazyRoute(
    () => import('../local/pages/SystemMonitoring'),
    { routePath: '/monitoring', preloadPriority: 'low' }
  ),

  /* --- Demo & Utility Routes --- */
  MVPDemo: createLazyRoute(() => import('../local/pages/MVP-Demo'), {
    routePath: '/mvp-demo',
    preloadPriority: 'high',
  }),
  Demo: createLazyRoute(() => import('../local/pages/Demo'), {
    routePath: '/demo',
    preloadPriority: 'high',
  }),
  NavigationTest: createLazyRoute(
    () => import('../local/pages/NavigationTest'),
    {
      routePath: '/nav-test',
      preloadPriority: 'low',
    }
  ),
  ApiDemo: createLazyRoute(() => import('../local/pages/ApiDemo'), {
    routePath: '/api-demo',
    preloadPriority: 'normal',
  }),

  ContactSales: createLazyRoute(
    () => import('../local/pages/ContactSales'),
    { routePath: '/contact-sales', preloadPriority: 'normal' }
  ),

  /* --- Document Management Routes --- */
  DocumentsPage: createLazyRoute(
    () => import('../local/pages/DocumentsPage'),
    { routePath: '/documents', preloadPriority: 'normal' }
  ),
  DocumentUpload: createLazyRoute(
    () => import('../local/pages/DocumentUpload'),
    { routePath: '/documents/upload', preloadPriority: 'normal' }
  ),
  DocumentViewer: createLazyRoute(
    () => import('../local/pages/DocumentViewer'),
    { routePath: '/documents/:id', preloadPriority: 'normal' }
  ),

  /* --- Location Services Routes --- */
  LocationServices: createLazyRoute(
    () => import('../local/pages/LocationServices'),
    { routePath: '/location', preloadPriority: 'normal' }
  ),

  /* --- Error & Fallback Routes --- */
  NotFound: createLazyRoute(() => import('../local/pages/NotFound'), {
    routePath: '/404',
    preloadPriority: 'normal',
  }),
  ComingSoon: createComingSoonRoute(
    COMING_SOON_LABEL,
    'This feature is coming soon. Stay tuned for updates!'
  ),

  /* --- Coming-Soon Placeholder Routes --- */
  AdvancedSearch: createLazyRoute(
    () => import('../search/pages/AdvancedSearch'),
    { routePath: '/advanced-search', preloadPriority: 'normal' }
  ),
  Notifications: createLazyRoute(
    () => import('../communication/pages/Notifications'),
    { routePath: '/notifications', preloadPriority: 'normal' }
  ),
  MessageCenter: createLazyRoute(
    () => import('../communication/pages/MessageCenter'),
    { routePath: '/messages', preloadPriority: 'normal' }
  ),
  ExpertCoordination: createLazyRoute(
    () => import('../local/pages/ExpertCoordination'),
    { routePath: '/expert-coordination', preloadPriority: 'normal' }
  ),
  PhysicalVerification: createLazyRoute(
    () => import('../local/pages/PhysicalVerification'),
    { routePath: '/physical-verification', preloadPriority: 'normal' }
  ),
  CommunityIntelligence: createLazyRoute(
    () => import('../local/pages/CommunityIntelligence'),
    { routePath: '/community-intelligence', preloadPriority: 'normal' }
  ),
  FindProfessionals: createLazyRoute(
    () => import('../local/pages/FindProfessionals'),
    {
      routePath: '/find-professionals',
      preloadPriority: 'normal',
    }
  ),
  
  /* --- Help System Coming Soon Routes --- */
  HelpGettingStarted: createComingSoonRoute(
    'Getting Started Guide',
    'Comprehensive guide to using TripleCheck effectively.'
  ),
  HelpVerification: createComingSoonRoute(
    'Verification Guide',
    'Step-by-step guide to the property verification process.'
  ),
  HelpFAQ: createComingSoonRoute(
    'Frequently Asked Questions',
    'Quick answers to the most common questions.'
  ),
  SearchFilters: createComingSoonRoute(
    'Search Filters',
    'Customize and save search preferences.'
  ),

  /* --- Solution Segment Routes --- */
  SolutionsBuyers: createLazyRoute(
    () => import('../local/pages/solutions/PropertyBuyers'),
    { routePath: '/solutions/buyers', preloadPriority: 'normal' }
  ),
  SolutionsSellers: createLazyRoute(
    () => import('../local/pages/solutions/PropertySellers'),
    { routePath: '/solutions/sellers', preloadPriority: 'normal' }
  ),
  SolutionsAgents: createLazyRoute(
    () => import('../local/pages/solutions/RealEstateAgents'),
    { routePath: '/solutions/agents', preloadPriority: 'normal' }
  ),
  SolutionsDevelopers: createLazyRoute(
    () => import('../local/pages/solutions/PropertyDevelopers'),
    { routePath: '/solutions/developers', preloadPriority: 'normal' }
  ),
  SolutionsLegalExperts: createLazyRoute(
    () => import('../local/pages/solutions/LegalExperts'),
    { routePath: '/solutions/legal-experts', preloadPriority: 'normal' }
  ),
} as const;

/* ---------------------------------- */
/* 7. ENHANCED PRE-LOADING SYSTEM    */
/* ---------------------------------- */

type PreloadCategory =
  | 'core'
  | 'auth'
  | 'property'
  | 'landVerification'
  | 'trust'
  | 'user'
  | 'communication'
  | 'search'
  | 'analytics'
  | 'content'
  | 'legal'
  | 'document'
  | 'location'
  | 'ai'
  | 'developer'
  | 'expert';

type SettledResult = PromiseSettledResult<unknown>;

/**
 * Handles the results of batch preloading operations
 * Provides useful logging in development mode for debugging
 */
const handleBatchResults = (results: SettledResult[], category: string): SettledResult[] => {
  if (process.env.NODE_ENV !== 'development') return results;
  
  const failed = results.filter((r) => r.status === 'rejected');
  const succeeded = results.filter((r) => r.status === 'fulfilled');
  
  if (failed.length > 0) {
    logger.warn(`${failed.length}/${results.length} ${category} preloads failed`);
    // Log specific failures in development
    failed.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.warn(`${category} preload ${index + 1} failed:`, result.reason);
      }
    });
  }
  
  if (succeeded.length > 0) {
    logger.info(`Successfully preloaded ${succeeded.length} ${category} routes`);
  }
  
  return results;
};

/**
 * Comprehensive preloading system organized by feature categories
 * This allows for strategic loading based on user behavior and application state
 */
export const preloadRoutes = {
  core: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/Home'),
        import('../local/pages/Features'),
        import('../local/pages/Pricing'),
        import('../local/pages/About'),
        import('../local/pages/Properties'),
      ]),
      'core'
    ),

  auth: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../auth/pages/Login'),
        import('../auth/pages/Register'),
        import('../auth/pages/ForgotPassword'),
      ]),
      'auth'
    ),

  property: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../property/pages/PropertyDetails'),
        import('../property/pages/PropertyCompare'),
        import('../property/pages/PropertyEdit'),
        import('../property/pages/ListProperty'),
        import('../property/components/PropertyMap'),
        import('../property/pages/PropertyWizard'),
        import('../property/pages/Lands'),
        import('../property/pages/LandDetails'),
      ]),
      'property'
    ),

  landVerification: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../land-verification/pages/LandVerificationPage'),
        import('../land-verification/pages/LandVerificationDashboardPage'),
        import('../land-verification/pages/NewVerificationPage'),
      ]),
      'landVerification'
    ),

  trust: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../trust/pages/BasicChecks'),
        import('../trust/pages/FraudDetection'),
        import('../trust/pages/DocumentAuth'),
        import('../trust/pages/Reports'),
        import('../trust/pages/Alerts'),
        import('../trust/pages/Reviews'),
        import('../trust/pages/TrustPoints'),
        import('../trust/pages/FraudProtectionInfo'),
      ]),
      'trust'
    ),

  user: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../user/pages/Dashboard'),
        import('../user/pages/Tenants'),
        import('../user/pages/Team'),
        import('../user/pages/UserProfile'),
        import('../user/pages/UserSettings'),
        import('../user/pages/Activity'),
      ]),
      'user'
    ),

  communication: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../communication/pages/Inbox'),
        import('../communication/pages/Notifications'),
        import('../communication/pages/MessageCenter'),
      ]),
      'communication'
    ),

  search: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../search/pages/SearchResults'),
        import('../search/pages/AdvancedSearch'),
      ]),
      'search'
    ),

  analytics: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../analytics/components/AnalyticsDashboard'),
      ]),
      'analytics'
    ),

  content: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/Blog'),
        import('../local/pages/Community'),
        import('../local/pages/Resources'),
        import('../local/pages/Services'),
        import('../local/pages/Solutions'),
        import('../local/pages/Help'),
        import('../local/pages/FindProfessionals'),
        import('../local/pages/CommunityAndResources'),
      ]),
      'content'
    ),

  legal: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/Help'),
        import('../local/pages/Contact'),
        import('../local/pages/Privacy'),
        import('../local/pages/Terms'),
        import('../local/pages/Security'),
        import('../local/pages/Cookies'),
      ]),
      'legal'
    ),

  document: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/DocumentsPage'),
        import('../local/pages/DocumentUpload'),
        import('../local/pages/DocumentViewer'),
      ]),
      'document'
    ),

  location: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/LocationServices'),
      ]),
      'location'
    ),

  ai: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        // Note: AI test components have been removed
      ]),
      'ai'
    ),

  developer: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/DeveloperDashboard'),
        import('../local/pages/AdminDashboard'),
        import('../local/pages/SystemMonitoring'),
        import('../local/pages/NavigationTest'),
        import('../local/pages/ApiDemo'),
      ]),
      'developer'
    ),

  expert: async (): Promise<SettledResult[]> =>
    handleBatchResults(
      await Promise.allSettled([
        import('../local/pages/ExpertCoordination'),
        import('../local/pages/PhysicalVerification'),
        import('../local/pages/CommunityIntelligence'),
      ]),
      'expert'
    ),

  /**
   * Preloads multiple categories in parallel
   * Useful for loading related functionality together
   */
  preloadMultiple: async (categories: PreloadCategory[]): Promise<SettledResult[]> => {
    const validCategories = categories.filter(category => 
      Object.prototype.hasOwnProperty.call(preloadRoutes, category) &&
      typeof preloadRoutes[category as keyof typeof preloadRoutes] === 'function'
    );

    if (validCategories.length === 0) {
      logger.warn('No valid categories provided for preloading');
      return [];
    }

    const batchPromises = validCategories.map(async (category) => {
      try {
        const preloadFunction = preloadRoutes[category as keyof typeof preloadRoutes];
        if (typeof preloadFunction === 'function') {
          return await (preloadFunction as () => Promise<SettledResult[]>)();
        }
        return [];
      } catch (error) {
        logger.error(`Failed to preload category ${category}:`, error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const flatResults = batchResults.flat();
    
    logger.info(`Preloaded ${validCategories.length} categories with ${flatResults.length} total routes`);
    return flatResults;
  },

  /**
   * Preloads routes based on their priority level
   * This enables progressive loading strategies
   */
  preloadByPriority: async (priority: PreloadPriority): Promise<SettledResult[]> => {
    const priorityMapping: Record<PreloadPriority, PreloadCategory[]> = {
      high: [
        'core',
        'auth',
        'property',
        'landVerification',
      ],
      normal: [
        'trust',
        'user',
        'search',
        'communication',
        'document',
        'location',
        'expert',
      ],
      low: [
        'content',
        'analytics',
        'legal',
        'ai',
        'developer',
      ],
    };

    const categories = priorityMapping[priority];
    if (!categories || categories.length === 0) {
      logger.warn(`No categories found for priority level: ${priority}`);
      return [];
    }

    logger.info(`Preloading ${priority} priority routes (${categories.length} categories)`);
    return preloadRoutes.preloadMultiple(categories);
  },

  /**
   * Preloads routes commonly needed after user authentication
   * Optimizes the post-login experience
   */
  preloadUserSession: async (): Promise<SettledResult[]> => {
    return preloadRoutes.preloadMultiple([
      'user',
      'property',
      'trust',
      'communication',
    ]);
  },

  /**
   * Preloads routes for anonymous users
   * Focuses on marketing and informational content
   */
  preloadAnonymous: async (): Promise<SettledResult[]> => {
    return preloadRoutes.preloadMultiple([
      'core',
      'content',
      'legal',
    ]);
  },
} as const;

/* ---------------------------------- */
/* 8. ROUTE UTILITIES & EXPORTS       */
/* ---------------------------------- */

export type RouteNames = keyof typeof LazyRoutes;

/**
 * Safely retrieves a route component by name
 * Provides better error handling and debugging information
 */
export const getRouteComponent = (name: RouteNames): LazyComponent => {
  if (!Object.prototype.hasOwnProperty.call(LazyRoutes, name)) {
    throw new Error(`Route "${name}" not found in LazyRoutes`);
  }
  
  const component = LazyRoutes[name as keyof typeof LazyRoutes];
  if (!component) {
    throw new Error(`Route "${name}" exists but is null or undefined`);
  }
  
  return component;
};

/**
 * Gets all available route names
 * Useful for debugging and dynamic route generation
 */
export const getAvailableRoutes = (): RouteNames[] => {
  return Object.keys(LazyRoutes) as RouteNames[];
};

/**
 * Checks if a route name exists in the system
 * Useful for validation before attempting to load
 */
export const isValidRoute = (name: string): name is RouteNames => {
  return Object.prototype.hasOwnProperty.call(LazyRoutes, name);
};

/**
 * Gets routes filtered by priority level
 * Useful for understanding and optimizing loading strategies
 */
export const getRoutesByPriority = (priority: PreloadPriority): RouteNames[] => {
  // This would require storing priority metadata, but for now we can use the preload categories
  const priorityMapping: Record<PreloadPriority, string[]> = {
    high: ['Home', 'Features', 'Pricing', 'Login', 'Register', 'Dashboard', 'Properties'],
    normal: ['About', 'Services', 'UserProfile', 'PropertyDetails', 'SearchResults'],
    low: ['Blog', 'Resources', 'Team', 'Analytics', 'DeveloperDashboard'],
  };
  
  return priorityMapping[priority].filter(isValidRoute) as RouteNames[];
};

// Backward compatibility export
export const WorkingRoutes = LazyRoutes;

/* ---------------------------------- */
/* 9. PERFORMANCE MONITORING         */
/* ---------------------------------- */

/**
 * Route performance metrics interface
 * Helps track loading performance across the application
 */
interface RouteMetrics {
  readonly routePath: string;
  readonly loadTime: number;
  readonly priority: PreloadPriority;
  readonly timestamp: number;
  readonly success: boolean;
}

/**
 * Simple performance tracking for route loading
 * Can be extended with more sophisticated analytics
 */
class RoutePerformanceTracker {
  private metrics: RouteMetrics[] = [];
  private readonly maxMetrics = 100; // Prevent memory leaks

  recordMetric(metric: RouteMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.metrics.length;
  }

  getSlowRoutes(threshold = 1000): RouteMetrics[] {
    return this.metrics.filter(metric => metric.loadTime > threshold);
  }

  getFailureRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const failures = this.metrics.filter(metric => !metric.success).length;
    return failures / this.metrics.length;
  }

  getMetricsSummary(): {
    totalRoutes: number;
    averageLoadTime: number;
    failureRate: number;
    slowRoutes: number;
  } {
    return {
      totalRoutes: this.metrics.length,
      averageLoadTime: this.getAverageLoadTime(),
      failureRate: this.getFailureRate(),
      slowRoutes: this.getSlowRoutes().length,
    };
  }
}

export const routePerformanceTracker = new RoutePerformanceTracker();

/* ---------------------------------- */
/* 10. INITIALIZATION HELPERS        */
/* ---------------------------------- */

/**
 * Initializes the lazy route system with optimal preloading
 * Call this early in your app lifecycle for best performance
 */
export const initializeLazyRoutes = async (
  userAuthenticated = false,
  priorityLevel: PreloadPriority = 'high'
): Promise<void> => {
  try {
    logger.info('Initializing lazy route system...');
    
    if (userAuthenticated) {
      await preloadRoutes.preloadUserSession();
    } else {
      await preloadRoutes.preloadAnonymous();
    }
    
    // Additionally preload by priority
    await preloadRoutes.preloadByPriority(priorityLevel);
    
    logger.info('Lazy route system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize lazy route system:', error);
    // Don't throw - the app should still work without preloading
  }
};

/**
 * Preloads routes based on the current application context
 * Can be called reactively when user state changes
 */
export const preloadContextualRoutes = async (context: {
  authenticated?: boolean;
  userRole?: string;
  currentSection?: string;
}): Promise<void> => {
  const { authenticated, userRole, currentSection } = context;
  
  try {
    const categoriesToPreload: PreloadCategory[] = [];
    
    if (authenticated) {
      categoriesToPreload.push('user', 'communication');
    }
    
    if (userRole === 'admin') {
      categoriesToPreload.push('developer', 'analytics');
    }
    
    if (currentSection === 'property') {
      categoriesToPreload.push('property', 'landVerification', 'trust');
    }
    
    if (categoriesToPreload.length > 0) {
      await preloadRoutes.preloadMultiple(categoriesToPreload);
    }
  } catch (error) {
    logger.warn('Contextual preloading failed:', error);
  }
};
