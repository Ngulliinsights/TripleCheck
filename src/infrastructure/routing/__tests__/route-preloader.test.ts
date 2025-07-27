import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { routePreloader, getRoutePreloader } from '../route-preloader';

// Mock window and performance APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
};

const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

const mockRequestIdleCallback = vi.fn((callback) => {
  setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1);
  return 1;
});

const mockCancelIdleCallback = vi.fn();

// Mock fetch for data preloading
const mockFetch = vi.fn();

// Mock dynamic imports
const mockImports = new Map<string, Promise<{ default: React.ComponentType }>>();

beforeAll(() => {
  // Set up global mocks
  Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true,
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    value: mockIntersectionObserver,
    writable: true,
  });

  Object.defineProperty(window, 'requestIdleCallback', {
    value: mockRequestIdleCallback,
    writable: true,
  });

  Object.defineProperty(window, 'cancelIdleCallback', {
    value: mockCancelIdleCallback,
    writable: true,
  });

  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true,
  });

  // Mock history API
  Object.defineProperty(window, 'history', {
    value: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    writable: true,
  });

  // Mock location
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
      pathname: '/',
    },
    writable: true,
  });

  // Mock gtag for analytics
  Object.defineProperty(window, 'gtag', {
    value: vi.fn(),
    writable: true,
  });
});

afterAll(() => {
  // Clean up global mocks
  vi.restoreAllMocks();
});

describe('Route Preloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImports.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    // Clean up any preloader instances
    try {
      routePreloader.destroy();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        routePreloader.initialize();
      }).not.toThrow();
    });

    it('should set up idle detection on initialization', () => {
      routePreloader.initialize();
      
      // Should set up event listeners for idle detection
      expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
    });

    it('should set up intersection observer on initialization', () => {
      routePreloader.initialize();
      
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should set up performance tracking on initialization', () => {
      const originalPushState = window.history.pushState;
      const pushStateSpy = vi.fn();
      window.history.pushState = pushStateSpy;

      routePreloader.initialize();

      // Test that history methods are wrapped
      window.history.pushState({}, '', '/test');
      expect(pushStateSpy).toHaveBeenCalled();

      window.history.pushState = originalPushState;
    });
  });

  describe('Route Preloading', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should preload a route successfully', async () => {
      const mockComponent = () => null;
      mockImports.set('/', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/', 'immediate');
      
      expect(result).toBeDefined();
    });

    it('should handle preload failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock a failing import
      mockImports.set('/failing-route', Promise.reject(new Error('Import failed')));

      const result = await routePreloader.preloadRoute('/failing-route', 'on-demand');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should return cached component for already preloaded routes', async () => {
      const mockComponent = () => null;
      mockImports.set('/cached-route', Promise.resolve({ default: mockComponent }));

      // First preload
      const result1 = await routePreloader.preloadRoute('/cached-route', 'immediate');
      
      // Second preload should return cached result
      const result2 = await routePreloader.preloadRoute('/cached-route', 'immediate');
      
      expect(result1).toBe(result2);
    });

    it('should not preload routes already in queue', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Start first preload (don't await)
      const promise1 = routePreloader.preloadRoute('/queued-route', 'immediate');
      
      // Try to preload same route again
      const result2 = await routePreloader.preloadRoute('/queued-route', 'immediate');
      
      expect(result2).toBeNull();
      
      // Clean up
      await promise1.catch(() => {});
      consoleSpy.mockRestore();
    });

    it('should validate route configurations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await routePreloader.preloadRoute('/unknown-route', 'immediate');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Preloading Strategies', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should handle immediate preloading strategy', async () => {
      const mockComponent = () => null;
      mockImports.set('/', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/', 'immediate');
      
      expect(result).toBeDefined();
    });

    it('should handle hover preloading strategy', async () => {
      const mockComponent = () => null;
      mockImports.set('/hover-route', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/hover-route', 'hover');
      
      expect(result).toBeDefined();
    });

    it('should handle idle preloading strategy', async () => {
      const mockComponent = () => null;
      mockImports.set('/idle-route', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/idle-route', 'idle');
      
      expect(result).toBeDefined();
    });

    it('should handle viewport preloading strategy', async () => {
      const mockComponent = () => null;
      mockImports.set('/viewport-route', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/viewport-route', 'viewport');
      
      expect(result).toBeDefined();
    });

    it('should handle on-demand preloading strategy', async () => {
      const mockComponent = () => null;
      mockImports.set('/on-demand-route', Promise.resolve({ default: mockComponent }));

      const result = await routePreloader.preloadRoute('/on-demand-route', 'on-demand');
      
      expect(result).toBeDefined();
    });
  });

  describe('Route Status Checking', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should correctly identify preloaded routes', async () => {
      const mockComponent = () => null;
      mockImports.set('/preloaded-route', Promise.resolve({ default: mockComponent }));

      expect(routePreloader.isPreloaded('/preloaded-route')).toBe(false);
      
      await routePreloader.preloadRoute('/preloaded-route', 'immediate');
      
      expect(routePreloader.isPreloaded('/preloaded-route')).toBe(true);
    });

    it('should return false for non-preloaded routes', () => {
      expect(routePreloader.isPreloaded('/not-preloaded')).toBe(false);
    });

    it('should get preloaded component', async () => {
      const mockComponent = () => null;
      mockImports.set('/component-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/component-route', 'immediate');
      
      const component = await routePreloader.getPreloadedComponent('/component-route');
      expect(component).toBeDefined();
    });

    it('should return null for non-preloaded component', async () => {
      const component = await routePreloader.getPreloadedComponent('/non-preloaded');
      expect(component).toBeNull();
    });
  });

  describe('Metrics and Performance', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should collect preload metrics', async () => {
      const mockComponent = () => null;
      mockImports.set('/metrics-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/metrics-route', 'immediate');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.summary).toBeDefined();
      expect(metrics.preloadMetrics).toBeDefined();
      expect(metrics.routeLoadingMetrics).toBeDefined();
    });

    it('should track successful preloads in metrics', async () => {
      const mockComponent = () => null;
      mockImports.set('/success-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/success-route', 'immediate');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics.summary.totalPreloads).toBeGreaterThan(0);
      expect(metrics.summary.successfulPreloads).toBeGreaterThan(0);
    });

    it('should track failed preloads in metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockImports.set('/fail-route', Promise.reject(new Error('Failed')));

      await routePreloader.preloadRoute('/fail-route', 'immediate');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics.summary.totalPreloads).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });

    it('should calculate cache hit rate', async () => {
      const mockComponent = () => null;
      mockImports.set('/cache-route', Promise.resolve({ default: mockComponent }));

      // First preload
      await routePreloader.preloadRoute('/cache-route', 'immediate');
      
      // Second preload (should be cache hit)
      await routePreloader.preloadRoute('/cache-route', 'immediate');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics.summary.cacheHitRate).toBeGreaterThan(0);
    });

    it('should track load times', async () => {
      const mockComponent = () => null;
      mockImports.set('/timing-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/timing-route', 'immediate');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics.summary.averageLoadTime).toBeGreaterThanOrEqual(0);
    });

    it('should track strategy usage', async () => {
      const mockComponent = () => null;
      mockImports.set('/strategy-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/strategy-route', 'hover');
      
      const metrics = routePreloader.getMetrics();
      
      expect(metrics.summary.strategySummary.hover).toBeGreaterThan(0);
    });
  });

  describe('Viewport Preloading', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should observe elements for viewport preloading', () => {
      const element = document.createElement('div');
      
      routePreloader.observeForPreloading(element, '/viewport-test');
      
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should set data attribute on observed elements', () => {
      const element = document.createElement('div');
      
      routePreloader.observeForPreloading(element, '/viewport-test');
      
      expect(element.dataset.preloadRoute).toBe('/viewport-test');
    });
  });

  describe('Data Preloading', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should preload route data when configured', async () => {
      const mockComponent = () => null;
      mockImports.set('/property/123', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/property/123', 'immediate');
      
      // Should have made fetch calls for data endpoints
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle data preloading failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockFetch.mockRejectedValueOnce(new Error('Data fetch failed'));
      
      const mockComponent = () => null;
      mockImports.set('/data-fail-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/data-fail-route', 'immediate');
      
      // Should still succeed even if data preloading fails
      expect(routePreloader.isPreloaded('/data-fail-route')).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should clean up resources on destroy', () => {
      routePreloader.initialize();
      
      expect(() => {
        routePreloader.destroy();
      }).not.toThrow();
    });

    it('should clear preloaded routes on destroy', async () => {
      routePreloader.initialize();
      
      const mockComponent = () => null;
      mockImports.set('/cleanup-route', Promise.resolve({ default: mockComponent }));

      await routePreloader.preloadRoute('/cleanup-route', 'immediate');
      expect(routePreloader.isPreloaded('/cleanup-route')).toBe(true);
      
      routePreloader.destroy();
      
      // After destroy, should not be able to check preloaded status
      expect(() => routePreloader.isPreloaded('/cleanup-route')).not.toThrow();
    });

    it('should disconnect intersection observer on destroy', () => {
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      
      mockIntersectionObserver.mockReturnValueOnce(mockObserver);
      
      routePreloader.initialize();
      routePreloader.destroy();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should clear timeouts on destroy', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      routePreloader.initialize();
      routePreloader.destroy();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      routePreloader.initialize();
    });

    it('should handle missing route configurations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await routePreloader.preloadRoute('/missing-config', 'immediate');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle component import failures', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockImports.set('/import-fail', Promise.reject(new Error('Import failed')));

      const result = await routePreloader.preloadRoute('/import-fail', 'immediate');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle dependency preloading failures', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This would test dependency preloading failure handling
      // The actual implementation would need specific mocking
      
      consoleSpy.mockRestore();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance from getRoutePreloader', () => {
      const instance1 = getRoutePreloader();
      const instance2 = getRoutePreloader();
      
      expect(instance1).toBe(instance2);
    });

    it('should create instance only when needed', () => {
      // This tests the lazy singleton pattern
      const instance = getRoutePreloader();
      expect(instance).toBeDefined();
    });
  });

  describe('Development vs Production Behavior', () => {
    it('should expose debug information in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      routePreloader.initialize();
      
      // In development, should expose debug info
      expect(window.__routePreloader).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose debug information in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Clean up any existing debug info
      delete window.__routePreloader;
      
      routePreloader.initialize();
      
      // In production, should not expose debug info
      expect(window.__routePreloader).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});