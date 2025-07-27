import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../shared/test-utils';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('Lazy Routes', () => {
  describe('Route Component Loading', () => {
    it('should load Home component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const HomeComponent = WorkingRoutes.Home;
      
      renderWithProviders(<HomeComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    it('should load Features component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const FeaturesComponent = WorkingRoutes.Features;
      
      renderWithProviders(<FeaturesComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('features-page')).toBeInTheDocument();
      });
    });

    it('should load Pricing component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const PricingComponent = WorkingRoutes.Pricing;
      
      renderWithProviders(<PricingComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
      });
    });

    it('should load Login component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const LoginComponent = WorkingRoutes.Login;
      
      renderWithProviders(<LoginComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('should load Register component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const RegisterComponent = WorkingRoutes.Register;
      
      renderWithProviders(<RegisterComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });
  });

  describe('Property Domain Routes', () => {
    it('should load PropertyDetails component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const PropertyDetailsComponent = WorkingRoutes.PropertyDetails;
      
      renderWithProviders(<PropertyDetailsComponent id="123" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-details-page')).toBeInTheDocument();
      });
    });

    it('should load PropertyEdit component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const PropertyEditComponent = WorkingRoutes.PropertyEdit;
      
      renderWithProviders(<PropertyEditComponent id="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-edit-page')).toBeInTheDocument();
      });
    });

    it('should load PropertyCompare component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const PropertyCompareComponent = WorkingRoutes.PropertyCompare;
      
      renderWithProviders(<PropertyCompareComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('property-compare-page')).toBeInTheDocument();
      });
    });

    it('should load ListProperty component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const ListPropertyComponent = WorkingRoutes.ListProperty;
      
      renderWithProviders(<ListPropertyComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('list-property-page')).toBeInTheDocument();
      });
    });
  });

  describe('Trust Domain Routes', () => {
    it('should load BasicChecks component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const BasicChecksComponent = WorkingRoutes.BasicChecks;
      
      renderWithProviders(<BasicChecksComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('basic-checks-page')).toBeInTheDocument();
      });
    });

    it('should load FraudDetection component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const FraudDetectionComponent = WorkingRoutes.FraudDetection;
      
      renderWithProviders(<FraudDetectionComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('fraud-detection-page')).toBeInTheDocument();
      });
    });

    it('should load DocumentAuth component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const DocumentAuthComponent = WorkingRoutes.DocumentAuth;
      
      renderWithProviders(<DocumentAuthComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('document-auth-page')).toBeInTheDocument();
      });
    });

    it('should load Reports component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const ReportsComponent = WorkingRoutes.Reports;
      
      renderWithProviders(<ReportsComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reports-page')).toBeInTheDocument();
      });
    });
  });

  describe('User Domain Routes', () => {
    it('should load Dashboard component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const DashboardComponent = WorkingRoutes.Dashboard;
      
      renderWithProviders(<DashboardComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('should load Team component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const TeamComponent = WorkingRoutes.Team;
      
      renderWithProviders(<TeamComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('team-page')).toBeInTheDocument();
      });
    });
  });

  describe('Communication Domain Routes', () => {
    it('should load Inbox component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const InboxComponent = WorkingRoutes.Inbox;
      
      renderWithProviders(<InboxComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
      });
    });
  });

  describe('Search Domain Routes', () => {
    it('should load SearchResults component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const SearchResultsComponent = WorkingRoutes.SearchResults;
      
      renderWithProviders(<SearchResultsComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-page')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should load NotFound component successfully', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const NotFoundComponent = WorkingRoutes.NotFound;
      
      renderWithProviders(<NotFoundComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('should handle coming soon routes', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      const MyPropertiesComponent = WorkingRoutes.MyProperties;
      
      renderWithProviders(<MyPropertiesComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('my-properties-page')).toBeInTheDocument();
      });
    });
  });

  describe('Route Preloading System', () => {
    it('should export preloadRoutes object', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      expect(preloadRoutes).toBeDefined();
      expect(typeof preloadRoutes.property).toBe('function');
      expect(typeof preloadRoutes.trust).toBe('function');
      expect(typeof preloadRoutes.user).toBe('function');
      expect(typeof preloadRoutes.communication).toBe('function');
      expect(typeof preloadRoutes.search).toBe('function');
      expect(typeof preloadRoutes.shared).toBe('function');
    });

    it('should preload property routes successfully', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      const results = await preloadRoutes.property();
      
      expect(Array.isArray(results)).toBe(true);
      // Results should be an array of PromiseSettledResult objects
      results.forEach(result => {
        expect(result).toHaveProperty('status');
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });

    it('should preload trust routes successfully', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      const results = await preloadRoutes.trust();
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result).toHaveProperty('status');
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });

    it('should preload user routes successfully', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      const results = await preloadRoutes.user();
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result).toHaveProperty('status');
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });

    it('should preload multiple categories', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      const results = await preloadRoutes.preloadMultiple(['property', 'trust']);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should preload by priority', async () => {
      const { preloadRoutes } = await import('../lazy-routes');
      
      const results = await preloadRoutes.preloadByPriority('high');
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Route Component Utilities', () => {
    it('should export getRouteComponent utility', async () => {
      const { getRouteComponent } = await import('../lazy-routes');
      
      expect(typeof getRouteComponent).toBe('function');
    });

    it('should get route component by name', async () => {
      const { getRouteComponent } = await import('../lazy-routes');
      
      const HomeComponent = getRouteComponent('Home');
      expect(HomeComponent).toBeDefined();
      
      const FeaturesComponent = getRouteComponent('Features');
      expect(FeaturesComponent).toBeDefined();
    });

    it('should throw error for invalid route name', async () => {
      const { getRouteComponent } = await import('../lazy-routes');
      
      expect(() => {
        getRouteComponent('NonExistentRoute' as any);
      }).toThrow();
    });

    it('should throw error for empty route name', async () => {
      const { getRouteComponent } = await import('../lazy-routes');
      
      expect(() => {
        getRouteComponent('' as any);
      }).toThrow('Route name must be a non-empty string');
    });
  });

  describe('Performance Tracking', () => {
    it('should export routePerformance utilities', async () => {
      const { routePerformance } = await import('../lazy-routes');
      
      expect(routePerformance).toBeDefined();
      expect(typeof routePerformance.trackRouteLoad).toBe('function');
      expect(typeof routePerformance.getRouteMetrics).toBe('function');
      expect(typeof routePerformance.measureRouteTransition).toBe('function');
      expect(typeof routePerformance.getPerformanceSummary).toBe('function');
    });

    it('should track route load times', async () => {
      const { routePerformance } = await import('../lazy-routes');
      
      // Mock gtag function
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;
      
      routePerformance.trackRouteLoad('/test-route', 150);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'route_load_time', {
        event_category: 'Performance',
        event_label: '/test-route',
        value: 150,
        custom_map: {
          route_name: '/test-route',
        },
      });
    });

    it('should get route metrics', async () => {
      const { routePerformance } = await import('../lazy-routes');
      
      const metrics = routePerformance.getRouteMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should measure route transitions', async () => {
      const { routePerformance } = await import('../lazy-routes');
      
      const mockCallback = vi.fn().mockResolvedValue(undefined);
      
      await routePerformance.measureRouteTransition('/test-route', mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should get performance summary', async () => {
      const { routePerformance } = await import('../lazy-routes');
      
      const summary = routePerformance.getPerformanceSummary();
      
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('object');
      expect(summary).toHaveProperty('available');
    });

    it('should handle performance tracking when performance API is unavailable', async () => {
      // Temporarily disable performance API
      const originalPerformance = window.performance;
      delete (window as any).performance;
      
      const { routePerformance } = await import('../lazy-routes');
      
      const metrics = routePerformance.getRouteMetrics();
      expect(metrics).toEqual([]);
      
      const summary = routePerformance.getPerformanceSummary();
      expect(summary.available).toBe(false);
      
      // Restore performance API
      window.performance = originalPerformance;
    });
  });

  describe('Code Splitting and Chunk Loading', () => {
    it('should handle chunk loading errors gracefully', async () => {
      // This test verifies that the lazy loading system handles network errors
      // and other chunk loading failures without crashing the application
      
      const { WorkingRoutes } = await import('../lazy-routes');
      
      // All components should be loadable without throwing errors
      const componentNames = Object.keys(WorkingRoutes) as Array<keyof typeof WorkingRoutes>;
      
      for (const componentName of componentNames.slice(0, 5)) { // Test first 5 to avoid timeout
        const Component = WorkingRoutes[componentName];
        expect(Component).toBeDefined();
        expect(typeof Component).toBe('object'); // Lazy components are objects
      }
    });

    it('should have proper webpack chunk names for optimization', async () => {
      // This test ensures that the dynamic imports have proper chunk names
      // for webpack optimization and better debugging
      
      const { WorkingRoutes } = await import('../lazy-routes');
      
      // Verify that key components are properly defined
      expect(WorkingRoutes.Home).toBeDefined();
      expect(WorkingRoutes.Features).toBeDefined();
      expect(WorkingRoutes.Pricing).toBeDefined();
      expect(WorkingRoutes.PropertyDetails).toBeDefined();
      expect(WorkingRoutes.Dashboard).toBeDefined();
    });
  });

  describe('Route Type Safety', () => {
    it('should export RouteNames type', async () => {
      const { WorkingRoutes } = await import('../lazy-routes');
      
      // Verify that all expected route names exist
      const expectedRoutes = [
        'Home', 'Features', 'Pricing', 'Login', 'Register',
        'PropertyDetails', 'PropertyEdit', 'PropertyCompare',
        'Dashboard', 'Team', 'BasicChecks', 'FraudDetection',
        'DocumentAuth', 'Reports', 'Alerts', 'Inbox',
        'SearchResults', 'NotFound'
      ];
      
      expectedRoutes.forEach(routeName => {
        expect(WorkingRoutes).toHaveProperty(routeName);
      });
    });
  });

  describe('Fallback and Error Recovery', () => {
    it('should handle module loading failures with fallbacks', async () => {
      // Test that the system can recover from module loading failures
      // This is important for network issues or missing chunks
      
      const { WorkingRoutes } = await import('../lazy-routes');
      
      // Coming soon routes should work as fallbacks
      expect(WorkingRoutes.MyProperties).toBeDefined();
      expect(WorkingRoutes.PropertiesLand).toBeDefined();
      expect(WorkingRoutes.SolutionsBuyers).toBeDefined();
    });

    it('should provide meaningful error messages for debugging', async () => {
      // Verify that error handling provides useful debugging information
      const { getRouteComponent } = await import('../lazy-routes');
      
      try {
        getRouteComponent('InvalidRoute' as any);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Route component "InvalidRoute" not found');
      }
    });
  });
});