import { lazy } from 'react';

// Working routes - referencing actual working components from client directory
export const WorkingRoutes = {
  // Core pages from client directory
  Home: lazy(() => 
    import('../../client/src/pages/home').then(module => ({
      default: module.default
    }))
  ),
  Features: lazy(() => 
    import('../../client/src/pages/features').then(module => ({
      default: module.default
    }))
  ),
  Pricing: lazy(() => 
    import('../../client/src/pages/pricing').then(module => ({
      default: module.default
    }))
  ),
  Dashboard: lazy(() => 
    import('../../client/src/pages/dashboard').then(module => ({
      default: module.default
    }))
  ),
  
  // Property pages
  PropertyDetails: lazy(() => 
    import('../../client/src/pages/property').then(module => ({
      default: module.default
    }))
  ),
  PropertyEdit: lazy(() => 
    import('../../client/src/pages/property-edit').then(module => ({
      default: module.default
    }))
  ),
  PropertyCompare: lazy(() => 
    import('../../client/src/pages/compare').then(module => ({
      default: module.default
    }))
  ),
  
  // Authentication pages
  Login: lazy(() => 
    import('../../client/src/pages/auth/login').then(module => ({
      default: module.default
    }))
  ),
  Register: lazy(() => 
    import('../../client/src/pages/auth/register').then(module => ({
      default: module.default
    }))
  ),
  
  // Service pages
  BasicChecks: lazy(() => 
    import('../../client/src/pages/services/basic-checks').then(module => ({
      default: module.default
    }))
  ),
  FraudDetection: lazy(() => 
    import('../../client/src/pages/services/fraud-detection').then(module => ({
      default: module.default
    }))
  ),
  DocumentAuth: lazy(() => 
    import('../../client/src/pages/services/document-auth').then(module => ({
      default: module.default
    }))
  ),
  Reports: lazy(() => 
    import('../../client/src/pages/services/reports').then(module => ({
      default: module.default
    }))
  ),
  Alerts: lazy(() => 
    import('../../client/src/pages/services/alerts').then(module => ({
      default: module.default
    }))
  ),
  Karma: lazy(() => 
    import('../../client/src/pages/services/karma').then(module => ({
      default: module.default
    }))
  ),
  Reputation: lazy(() => 
    import('../../client/src/pages/services/reputation').then(module => ({
      default: module.default
    }))
  ),
  TrustPoints: lazy(() => 
    import('../../client/src/pages/services/trust-points').then(module => ({
      default: module.default
    }))
  ),
  Reviews: lazy(() => 
    import('../../client/src/pages/services/reviews').then(module => ({
      default: module.default
    }))
  ),
  ListProperty: lazy(() => 
    import('../../client/src/pages/services/list-property').then(module => ({
      default: module.default
    }))
  ),
  Resources: lazy(() => 
    import('../../client/src/pages/services/resources').then(module => ({
      default: module.default
    }))
  ),
  Tenants: lazy(() => 
    import('../../client/src/pages/services/tenants').then(module => ({
      default: module.default
    }))
  ),
  
  // Static pages
  OurStory: lazy(() => 
    import('../../client/src/pages/our-story').then(module => ({
      default: module.default
    }))
  ),
  Partners: lazy(() => 
    import('../../client/src/pages/partners').then(module => ({
      default: module.default
    }))
  ),
  PressMedia: lazy(() => 
    import('../../client/src/pages/press-media').then(module => ({
      default: module.default
    }))
  ),
  Team: lazy(() => 
    import('../../client/src/pages/team').then(module => ({
      default: module.default
    }))
  ),
  
  // Other pages
  SearchResults: lazy(() => 
    import('../../client/src/pages/search-results').then(module => ({
      default: module.default
    }))
  ),
  Inbox: lazy(() => 
    import('../../client/src/pages/inbox').then(module => ({
      default: module.default
    }))
  ),
  Blog: lazy(() => 
    import('../../client/src/pages/blog').then(module => ({
      default: module.default
    }))
  ),
  BlogPost: lazy(() => 
    import('../../client/src/pages/blog').then(module => ({
      default: module.default
    }))
  ),
  NotFound: lazy(() => 
    import('../../client/src/pages/not-found').then(module => ({
      default: module.default
    }))
  ),
};

// Preloading utilities for performance optimization
export const preloadRoutes = {
  property: () => {
    // Preload property routes when user shows interest in properties
    import('../../client/src/pages/property');
    import('../../client/src/pages/compare');
    import('../../client/src/components/listing-card');
  },
  
  trust: () => {
    // Preload trust routes when user accesses services
    import('../../client/src/pages/services/basic-checks');
    import('../../client/src/pages/services/fraud-detection');
    import('../../client/src/components/trust-score');
  },
  
  user: () => {
    // Preload user routes after authentication
    import('../../client/src/pages/dashboard');
    import('../../client/src/pages/team');
  },
  
  communication: () => {
    // Preload communication routes when user has messages
    import('../../client/src/pages/inbox');
  },
  
  search: () => {
    // Preload search routes when user starts searching
    import('../../client/src/pages/search-results');
    import('../../client/src/components/property-search');
  },
  
  shared: () => {
    // Preload shared content routes
    import('../../client/src/pages/blog');
  },
};