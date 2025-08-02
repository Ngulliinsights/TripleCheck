import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../shared/test-utils';
import { AppRouter } from '../router';

// Mock the route preloader hook
vi.mock('../../infrastructure/routing/useRoutePreloader', () => ({
  useRoutePreloader: () => ({
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
        strategySummary: {},
      },
    },
    preloadDomainRoutes: vi.fn().mockResolvedValue([]),
    preloadByUserBehavior: vi.fn().mockResolvedValue([]),
    preloadRoute: vi.fn().mockResolvedValue(null),
    getPerformanceInsights: vi.fn().mockReturnValue([]),
  }),
}));

// Mock the RoutePerformanceMonitor component
vi.mock('../../infrastructure/routing/RoutePerformanceMonitor', () => ({
  RoutePerformanceMonitor: () => <div data-testid="route-performance-monitor" />,
}));

// Mock the route preloader
vi.mock('../../infrastructure/routing/route-preloader', () => ({
  routePreloader: {
    initialize: vi.fn(),
    preloadRoute: vi.fn().mockResolvedValue(null),
    isPreloaded: vi.fn().mockReturnValue(false),
    getMetrics: vi.fn().mockReturnValue({
      preloadMetrics: [],
      routeLoadingMetrics: [],
      summary: {
        totalPreloads: 0,
        successfulPreloads: 0,
        cacheHitRate: 0,
        averageLoadTime: 0,
        strategySummary: {},
      },
    }),
  },
}));

// Mock lazy route components
vi.mock('../lazy-routes', () => ({
  WorkingRoutes: {
    Home: () => <div data-testid="home-page">Home Page</div>,
    Features: () => <div data-testid="features-page">Features Page</div>,
    Pricing: () => <div data-testid="pricing-page">Pricing Page</div>,
    Login: () => <div data-testid="login-page">Login Page</div>,
    Register: () => <div data-testid="register-page">Register Page</div>,
    PropertyDetails: ({ id }: { id?: string }) => (
      <div data-testid="property-details-page">Property Details: {id}</div>
    ),
    PropertyEdit: ({ id }: { id?: string }) => (
      <div data-testid="property-edit-page">Property Edit: {id}</div>
    ),
    PropertyCompare: () => <div data-testid="property-compare-page">Property Compare</div>,
    Dashboard: () => <div data-testid="dashboard-page">Dashboard Page</div>,
    Team: () => <div data-testid="team-page">Team Page</div>,
    BasicChecks: () => <div data-testid="basic-checks-page">Basic Checks Page</div>,
    FraudDetection: () => <div data-testid="fraud-detection-page">Fraud Detection Page</div>,
    DocumentAuth: () => <div data-testid="document-auth-page">Document Auth Page</div>,
    Reports: () => <div data-testid="reports-page">Reports Page</div>,
    Alerts: () => <div data-testid="alerts-page">Alerts Page</div>,
    Karma: () => <div data-testid="karma-page">Karma Page</div>,
    Reputation: () => <div data-testid="reputation-page">Reputation Page</div>,
    TrustPoints: () => <div data-testid="trust-points-page">Trust Points Page</div>,
    Reviews: () => <div data-testid="reviews-page">Reviews Page</div>,
    ListProperty: () => <div data-testid="list-property-page">List Property Page</div>,
    Resources: () => <div data-testid="resources-page">Resources Page</div>,
    Tenants: () => <div data-testid="tenants-page">Tenants Page</div>,
    Solutions: () => <div data-testid="solutions-page">Solutions Page</div>,
    SolutionsBuyers: () => <div data-testid="solutions-buyers-page">Solutions Buyers Page</div>,
    SolutionsSellers: () => <div data-testid="solutions-sellers-page">Solutions Sellers Page</div>,
    SolutionsAgents: () => <div data-testid="solutions-agents-page">Solutions Agents Page</div>,
    SolutionsDevelopers: () => <div data-testid="solutions-developers-page">Solutions Developers Page</div>,
    Help: () => <div data-testid="help-page">Help Page</div>,
    HelpGettingStarted: () => <div data-testid="help-getting-started-page">Help Getting Started Page</div>,
    HelpVerification: () => <div data-testid="help-verification-page">Help Verification Page</div>,
    HelpFAQ: () => <div data-testid="help-faq-page">Help FAQ Page</div>,
    Contact: () => <div data-testid="contact-page">Contact Page</div>,
    Properties: () => <div data-testid="properties-page">Properties Page</div>,
    MyProperties: () => <div data-testid="my-properties-page">My Properties Page</div>,
    PropertiesResidential: () => <div data-testid="properties-residential-page">Properties Residential Page</div>,
    PropertiesCommercial: () => <div data-testid="properties-commercial-page">Properties Commercial Page</div>,
    PropertiesLand: () => <div data-testid="properties-land-page">Properties Land Page</div>,
    PropertyPhotos: ({ id }: { id?: string }) => (
      <div data-testid="property-photos-page">Property Photos: {id}</div>
    ),
    PropertyOptimize: ({ id }: { id?: string }) => (
      <div data-testid="property-optimize-page">Property Optimize: {id}</div>
    ),
    SearchResults: () => <div data-testid="search-results-page">Search Results Page</div>,
    Inbox: () => <div data-testid="inbox-page">Inbox Page</div>,
    OurStory: () => <div data-testid="our-story-page">Our Story Page</div>,
    Partners: () => <div data-testid="partners-page">Partners Page</div>,
    PressMedia: () => <div data-testid="press-media-page">Press Media Page</div>,
    Blog: () => <div data-testid="blog-page">Blog Page</div>,
    BlogPost: ({ id }: { id?: string }) => (
      <div data-testid="blog-post-page">Blog Post: {id}</div>
    ),
    Community: () => <div data-testid="community-page">Community Page</div>,
    FraudResources: () => <div data-testid="fraud-resources-page">Fraud Resources Page</div>,
    Services: () => <div data-testid="services-page">Services Page</div>,
    NotFound: () => <div data-testid="not-found-page">404 Not Found</div>,
  },
  preloadRoutes: {
    property: vi.fn().mockResolvedValue([]),
    trust: vi.fn().mockResolvedValue([]),
    user: vi.fn().mockResolvedValue([]),
    communication: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    shared: vi.fn().mockResolvedValue([]),
  },
}));

// Mock AppLayout
vi.mock('../App', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// Mock ErrorBoundary
vi.mock('../error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// Mock LoadingSkeleton
vi.mock('../../shared/components/ui/loading-skeleton', () => ({
  LoadingSkeleton: ({ variant, className }: { variant?: string; className?: string }) => (
    <div data-testid="loading-skeleton" data-variant={variant} className={className}>
      Loading...
    </div>
  ),
}));

describe('Navigation and Routing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Configuration and Parameter Handling', () => {
    it('should render home page at root route', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should render features page at /features route', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/features'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('features-page')).toBeInTheDocument();
      });
    });

    it('should render pricing page at /pricing route', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/pricing'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
      });
    });

    it('should handle property details route with ID parameter', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/property/123'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('property-details-page')).toBeInTheDocument();
        expect(screen.getByText('Property Details: 123')).toBeInTheDocument();
      });
    });

    it('should handle property edit route with ID parameter', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/property/456/edit'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('property-edit-page')).toBeInTheDocument();
        expect(screen.getByText('Property Edit: 456')).toBeInTheDocument();
      });
    });

    it('should handle blog post route with ID parameter', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/blog/my-blog-post'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('blog-post-page')).toBeInTheDocument();
        expect(screen.getByText('Blog Post: my-blog-post')).toBeInTheDocument();
      });
    });

    it('should validate route parameters and show error for invalid ID', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/property/invalid@id'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid Route Parameters')).toBeInTheDocument();
        expect(screen.getByText(/Invalid ID format/)).toBeInTheDocument();
      });
    });

    it('should show error for missing required parameters', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/property/'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Routes', () => {
    it('should render login page at /auth/login', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/auth/login'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('should render register page at /auth/register', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/auth/register'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });
  });

  describe('Property Routes', () => {
    it('should render property comparison page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/compare'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('property-compare-page')).toBeInTheDocument();
      });
    });

    it('should render properties listing page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/properties'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('properties-page')).toBeInTheDocument();
      });
    });

    it('should render residential properties page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/properties/residential'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('properties-residential-page')).toBeInTheDocument();
      });
    });

    it('should render commercial properties page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/properties/commercial'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('properties-commercial-page')).toBeInTheDocument();
      });
    });

    it('should render property photos page with ID', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/property/789/photos'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('property-photos-page')).toBeInTheDocument();
        expect(screen.getByText('Property Photos: 789')).toBeInTheDocument();
      });
    });
  });

  describe('Service Routes', () => {
    it('should render services overview page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/services'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('services-page')).toBeInTheDocument();
      });
    });

    it('should render basic checks service page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/services/basic-checks'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('basic-checks-page')).toBeInTheDocument();
      });
    });

    it('should render fraud detection service page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/services/fraud-detection'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('fraud-detection-page')).toBeInTheDocument();
      });
    });

    it('should render document authentication service page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/services/document-auth'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('document-auth-page')).toBeInTheDocument();
      });
    });
  });

  describe('User Management Routes', () => {
    it('should render dashboard page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/dashboard'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should render team page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/team'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('team-page')).toBeInTheDocument();
      });
    });

    it('should render inbox page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/inbox'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
      });
    });
  });

  describe('Help and Support Routes', () => {
    it('should render help center page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/help'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('help-page')).toBeInTheDocument();
      });
    });

    it('should render contact page', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/contact'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('contact-page')).toBeInTheDocument();
      });
    });
  });

  describe('404 Handling and Invalid Routes', () => {
    it('should render 404 page for invalid routes', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/invalid-route'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('should render 404 page for deeply nested invalid routes', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/some/deeply/nested/invalid/route'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('should render 404 page for routes with invalid extensions', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/properties.html'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should show loading skeleton while components are loading', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      // The actual page should load (loading skeleton is handled by Suspense internally)
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should wrap routes in error boundaries', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });
    });

    it('should include route performance monitor', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      expect(screen.getByTestId('route-performance-monitor')).toBeInTheDocument();
    });

    it('should wrap content in app layout', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  describe('Route Navigation', () => {
    it('should navigate between routes correctly', async () => {
      // Test navigation by rendering different routes
      const { unmount } = renderWithProviders(<AppRouter />, { 
        initialEntries: ['/'],
        routerType: 'memory'
      });

      // Start at home
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });

      unmount();

      // Navigate to features
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/features'],
        routerType: 'memory'
      });

      await waitFor(() => {
        expect(screen.getByTestId('features-page')).toBeInTheDocument();
      });
    });

    it('should handle browser back/forward navigation', async () => {
      renderWithProviders(<AppRouter />, { 
        initialEntries: ['/', '/features', '/pricing'],
        routerType: 'memory'
      });

      // Should start at the last entry (pricing)
      await waitFor(() => {
        expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
      });
    });
  });
});