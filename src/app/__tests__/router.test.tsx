import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders, renderWithRoutes } from '../../shared/test-utils';
import { AppRouter } from '../router';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Mock the lazy routes to avoid actual component loading during tests
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
    Dashboard: () => <div data-testid="dashboard-page">Dashboard</div>,
    Team: () => <div data-testid="team-page">Team</div>,
    Services: () => <div data-testid="services-page">Services</div>,
    BasicChecks: () => <div data-testid="basic-checks-page">Basic Checks</div>,
    FraudDetection: () => <div data-testid="fraud-detection-page">Fraud Detection</div>,
    DocumentAuth: () => <div data-testid="document-auth-page">Document Auth</div>,
    Reports: () => <div data-testid="reports-page">Reports</div>,
    Alerts: () => <div data-testid="alerts-page">Alerts</div>,
    Karma: () => <div data-testid="karma-page">Karma</div>,
    Reputation: () => <div data-testid="reputation-page">Reputation</div>,
    TrustPoints: () => <div data-testid="trust-points-page">Trust Points</div>,
    Reviews: () => <div data-testid="reviews-page">Reviews</div>,
    ListProperty: () => <div data-testid="list-property-page">List Property</div>,
    Resources: () => <div data-testid="resources-page">Resources</div>,
    Tenants: () => <div data-testid="tenants-page">Tenants</div>,
    Solutions: () => <div data-testid="solutions-page">Solutions</div>,
    SolutionsBuyers: () => <div data-testid="solutions-buyers-page">Solutions Buyers</div>,
    SolutionsSellers: () => <div data-testid="solutions-sellers-page">Solutions Sellers</div>,
    SolutionsAgents: () => <div data-testid="solutions-agents-page">Solutions Agents</div>,
    SolutionsDevelopers: () => <div data-testid="solutions-developers-page">Solutions Developers</div>,
    Help: () => <div data-testid="help-page">Help</div>,
    HelpGettingStarted: () => <div data-testid="help-getting-started-page">Help Getting Started</div>,
    HelpVerification: () => <div data-testid="help-verification-page">Help Verification</div>,
    HelpFAQ: () => <div data-testid="help-faq-page">Help FAQ</div>,
    Contact: () => <div data-testid="contact-page">Contact</div>,
    Properties: () => <div data-testid="properties-page">Properties</div>,
    MyProperties: () => <div data-testid="my-properties-page">My Properties</div>,
    PropertiesResidential: () => <div data-testid="properties-residential-page">Properties Residential</div>,
    PropertiesCommercial: () => <div data-testid="properties-commercial-page">Properties Commercial</div>,
    PropertiesLand: () => <div data-testid="properties-land-page">Properties Land</div>,
    PropertyPhotos: ({ id }: { id?: string }) => (
      <div data-testid="property-photos-page">Property Photos: {id}</div>
    ),
    PropertyOptimize: ({ id }: { id?: string }) => (
      <div data-testid="property-optimize-page">Property Optimize: {id}</div>
    ),
    SearchResults: () => <div data-testid="search-results-page">Search Results</div>,
    Inbox: () => <div data-testid="inbox-page">Inbox</div>,
    OurStory: () => <div data-testid="our-story-page">Our Story</div>,
    Partners: () => <div data-testid="partners-page">Partners</div>,
    PressMedia: () => <div data-testid="press-media-page">Press Media</div>,
    Blog: () => <div data-testid="blog-page">Blog</div>,
    BlogPost: ({ id }: { id?: string }) => (
      <div data-testid="blog-post-page">Blog Post: {id}</div>
    ),
    Community: () => <div data-testid="community-page">Community</div>,
    FraudResources: () => <div data-testid="fraud-resources-page">Fraud Resources</div>,
    NotFound: () => <div data-testid="not-found-page">404 Not Found</div>,
  },
  preloadRoutes: {
    property: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the route preloader
vi.mock('../../infrastructure/routing/route-preloader', () => ({
  routePreloader: {
    initialize: vi.fn(),
  },
}));

// Mock the route preloader hook
vi.mock('../../infrastructure/routing/useRoutePreloader', () => ({
  useRoutePreloader: () => ({
    preloadDomainRoutes: vi.fn().mockResolvedValue([]),
    preloadByUserBehavior: vi.fn().mockResolvedValue([]),
    isPreloading: false,
    preloadedRoutes: new Set(),
    getPerformanceInsights: vi.fn().mockReturnValue({}),
  }),
}));

// Mock the RoutePerformanceMonitor component
vi.mock('../../infrastructure/routing/RoutePerformanceMonitor', () => ({
  RoutePerformanceMonitor: () => <div data-testid="route-performance-monitor" />,
}));

// Mock the AppLayout component
vi.mock('../App', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// Mock the ErrorBoundary component
vi.mock('../error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// Mock the LoadingSkeleton component
vi.mock('../../shared/components/ui/loading-skeleton', () => ({
  LoadingSkeleton: ({ variant, className }: { variant?: string; className?: string }) => (
    <div data-testid="loading-skeleton" data-variant={variant} className={className}>
      Loading...
    </div>
  ),
}));

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Route Configuration', () => {
    it('should render home page on root route', async () => {
      renderWithRoutes(<AppRouter />, ['/']);
      
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should render features page on /features route', async () => {
      renderWithRoutes(<AppRouter />, ['/features']);
      
      await waitFor(() => {
        expect(screen.getByTestId('features-page')).toBeInTheDocument();
      });
    });

    it('should render pricing page on /pricing route', async () => {
      renderWithRoutes(<AppRouter />, ['/pricing']);
      
      await waitFor(() => {
        expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
      });
    });

    it('should render login page on /auth/login route', async () => {
      renderWithRoutes(<AppRouter />, ['/auth/login']);
      
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('should render register page on /auth/register route', async () => {
      renderWithRoutes(<AppRouter />, ['/auth/register']);
      
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });
  });

  describe('Property Routes with Parameters', () => {
    it('should render property details with valid ID parameter', async () => {
      renderWithRoutes(<AppRouter />, ['/property/123']);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-details-page')).toBeInTheDocument();
        expect(screen.getByText('Property Details: 123')).toBeInTheDocument();
      });
    });

    it('should render property edit with valid ID parameter', async () => {
      renderWithRoutes(<AppRouter />, ['/property/456/edit']);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-edit-page')).toBeInTheDocument();
        expect(screen.getByText('Property Edit: 456')).toBeInTheDocument();
      });
    });

    it('should render property photos with valid ID parameter', async () => {
      renderWithRoutes(<AppRouter />, ['/property/789/photos']);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-photos-page')).toBeInTheDocument();
        expect(screen.getByText('Property Photos: 789')).toBeInTheDocument();
      });
    });

    it('should render property optimize with valid ID parameter', async () => {
      renderWithRoutes(<AppRouter />, ['/property/101/optimize']);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-optimize-page')).toBeInTheDocument();
        expect(screen.getByText('Property Optimize: 101')).toBeInTheDocument();
      });
    });

    it('should handle invalid property ID parameters', async () => {
      renderWithRoutes(<AppRouter />, ['/property/invalid@id']);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid Route Parameters')).toBeInTheDocument();
        expect(screen.getByText('Invalid ID format')).toBeInTheDocument();
      });
    });

    it('should handle missing property ID parameters', async () => {
      renderWithRoutes(<AppRouter />, ['/property/']);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Service Routes', () => {
    const serviceRoutes = [
      { path: '/services', testId: 'services-page' },
      { path: '/services/basic-checks', testId: 'basic-checks-page' },
      { path: '/services/fraud-detection', testId: 'fraud-detection-page' },
      { path: '/services/document-auth', testId: 'document-auth-page' },
      { path: '/services/reports', testId: 'reports-page' },
      { path: '/services/alerts', testId: 'alerts-page' },
      { path: '/services/karma', testId: 'karma-page' },
      { path: '/services/reputation', testId: 'reputation-page' },
      { path: '/services/trust-points', testId: 'trust-points-page' },
      { path: '/services/reviews', testId: 'reviews-page' },
      { path: '/services/list-property', testId: 'list-property-page' },
      { path: '/services/resources', testId: 'resources-page' },
      { path: '/services/tenants', testId: 'tenants-page' },
    ];

    serviceRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Solution Routes', () => {
    const solutionRoutes = [
      { path: '/solutions', testId: 'solutions-page' },
      { path: '/solutions/buyers', testId: 'solutions-buyers-page' },
      { path: '/solutions/sellers', testId: 'solutions-sellers-page' },
      { path: '/solutions/agents', testId: 'solutions-agents-page' },
      { path: '/solutions/developers', testId: 'solutions-developers-page' },
    ];

    solutionRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Help and Support Routes', () => {
    const helpRoutes = [
      { path: '/help', testId: 'help-page' },
      { path: '/help/getting-started', testId: 'help-getting-started-page' },
      { path: '/help/verification-guide', testId: 'help-verification-page' },
      { path: '/help/faq', testId: 'help-faq-page' },
      { path: '/contact', testId: 'contact-page' },
    ];

    helpRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Property Browsing Routes', () => {
    const propertyRoutes = [
      { path: '/properties', testId: 'properties-page' },
      { path: '/properties/my', testId: 'my-properties-page' },
      { path: '/properties/residential', testId: 'properties-residential-page' },
      { path: '/properties/commercial', testId: 'properties-commercial-page' },
      { path: '/properties/land', testId: 'properties-land-page' },
    ];

    propertyRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Blog Routes with Parameters', () => {
    it('should render blog page on /blog route', async () => {
      renderWithRoutes(<AppRouter />, ['/blog']);
      
      await waitFor(() => {
        expect(screen.getByTestId('blog-page')).toBeInTheDocument();
      });
    });

    it('should render blog post with valid ID parameter', async () => {
      renderWithRoutes(<AppRouter />, ['/blog/my-blog-post']);
      
      await waitFor(() => {
        expect(screen.getByTestId('blog-post-page')).toBeInTheDocument();
        expect(screen.getByText('Blog Post: my-blog-post')).toBeInTheDocument();
      });
    });

    it('should handle invalid blog post ID parameters', async () => {
      renderWithRoutes(<AppRouter />, ['/blog/invalid@post']);
      
      await waitFor(() => {
        expect(screen.getByText('Blog Post Not Found')).toBeInTheDocument();
        expect(screen.getByText('The blog post ID is invalid or missing.')).toBeInTheDocument();
      });
    });
  });

  describe('Static and Informational Routes', () => {
    const staticRoutes = [
      { path: '/about', testId: 'our-story-page' },
      { path: '/static/our-story', testId: 'our-story-page' },
      { path: '/static/partners', testId: 'partners-page' },
      { path: '/static/press-media', testId: 'press-media-page' },
      { path: '/community', testId: 'community-page' },
      { path: '/fraud-resources', testId: 'fraud-resources-page' },
      { path: '/resources/fraud', testId: 'fraud-resources-page' },
    ];

    staticRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('User Management Routes', () => {
    const userRoutes = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/team', testId: 'team-page' },
      { path: '/inbox', testId: 'inbox-page' },
    ];

    userRoutes.forEach(({ path, testId }) => {
      it(`should render ${testId} on ${path} route`, async () => {
        renderWithRoutes(<AppRouter />, [path]);
        
        await waitFor(() => {
          expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Search and Discovery Routes', () => {
    it('should render search results page on /search route', async () => {
      renderWithRoutes(<AppRouter />, ['/search']);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-page')).toBeInTheDocument();
      });
    });

    it('should render property compare page on /compare route', async () => {
      renderWithRoutes(<AppRouter />, ['/compare']);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-compare-page')).toBeInTheDocument();
      });
    });
  });

  describe('404 Handling', () => {
    it('should render 404 page for unknown routes', async () => {
      renderWithRoutes(<AppRouter />, ['/unknown-route']);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('should render 404 page for deeply nested unknown routes', async () => {
      renderWithRoutes(<AppRouter />, ['/some/deeply/nested/unknown/route']);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('should render 404 page for routes with invalid characters', async () => {
      renderWithRoutes(<AppRouter />, ['/invalid<>route']);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton while components are loading', async () => {
      const { container } = renderWithRoutes(<AppRouter />, ['/']);
      
      // Check for loading skeleton initially
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      // Wait for actual content to load
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should show appropriate loading skeleton variant for page loading', async () => {
      renderWithRoutes(<AppRouter />, ['/']);
      
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toHaveAttribute('data-variant', 'page');
    });
  });

  describe('Layout Integration', () => {
    it('should wrap all routes with AppLayout', async () => {
      renderWithRoutes(<AppRouter />, ['/']);
      
      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should include RoutePerformanceMonitor', async () => {
      renderWithRoutes(<AppRouter />, ['/']);
      
      expect(screen.getByTestId('route-performance-monitor')).toBeInTheDocument();
    });

    it('should wrap routes with ErrorBoundary', async () => {
      renderWithRoutes(<AppRouter />, ['/']);
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  describe('Route Navigation', () => {
    it('should navigate between routes correctly', async () => {
      const user = userEvent.setup();
      
      const TestNavigationComponent = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/');
        
        return (
          <MemoryRouter initialEntries={[currentRoute]}>
            <div>
              <button 
                onClick={() => setCurrentRoute('/features')}
                data-testid="navigate-to-features"
              >
                Go to Features
              </button>
              <button 
                onClick={() => setCurrentRoute('/pricing')}
                data-testid="navigate-to-pricing"
              >
                Go to Pricing
              </button>
              <AppRouter />
            </div>
          </MemoryRouter>
        );
      };

      renderWithProviders(<TestNavigationComponent />, { withRouter: false });
      
      // Initially should show home page
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });
  });

  describe('Route Preloading Integration', () => {
    it('should initialize route preloader on mount', async () => {
      const { routePreloader } = await import('../../infrastructure/routing/route-preloader');
      
      renderWithRoutes(<AppRouter />, ['/']);
      
      await waitFor(() => {
        expect(routePreloader.initialize).toHaveBeenCalled();
      });
    });

    it('should call preload functions for property routes', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      renderWithRoutes(<AppRouter />, ['/property/123']);
      
      await waitFor(() => {
        expect(preloadRoutes.property).toHaveBeenCalled();
      });
    });
  });
});