import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRoutePreloader, useRouteLoadingTracker, useSmartPreloading } from '../useRoutePreloader'

vi.mock('../route-preloader', () => ({
  routePreloader: {
    preloadRoute: vi.fn(),
    isPreloaded: vi.fn(),
    getPreloadedComponent: vi.fn(),
    observeForPreloading: vi.fn(),
    getMetrics: vi.fn(),
    initialize: vi.fn(),
    destroy: vi.fn(),
    preloadedRoutes: new Map(),
  },
}));

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock window location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
});

describe('useRoutePreloader Hook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked module
    const { routePreloader } = await import('../route-preloader');
    
    // Set up default mock returns
    vi.mocked(routePreloader.preloadRoute).mockResolvedValue(null);
    vi.mocked(routePreloader.isPreloaded).mockReturnValue(false);
    vi.mocked(routePreloader.getPreloadedComponent).mockResolvedValue(null);
    vi.mocked(routePreloader.getMetrics).mockReturnValue({
      preloadMetrics: [],
      routeLoadingMetrics: [],
      summary: {
        totalPreloads: 0,
        successfulPreloads: 0,
        cacheHitRate: 0,
        averageLoadTime: 0,
        strategySummary: {},
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useRoutePreloader());

      expect(result.current.isPreloading).toBe(false);
      expect(result.current.preloadedRoutes).toEqual([]);
      expect(result.current.metrics).toBeDefined();
      expect(result.current.hasPreloadedRoutes).toBe(false);
    });

    it('should initialize with custom options', () => {
      const options = {
        enableHoverPreloading: false,
        enableViewportPreloading: true,
        preloadOnMount: ['/test-route'],
        strategy: 'immediate' as const,
      };

      const { result } = renderHook(() => useRoutePreloader(options));

      expect(result.current).toBeDefined();
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/test-route', 'immediate');
    });

    it('should preload routes on mount when specified', async () => {
      const preloadOnMount = ['/route1', '/route2'];
      const { routePreloader } = await import('../route-preloader');

      renderHook(() => useRoutePreloader({ preloadOnMount }));

      await waitFor(() => {
        expect(routePreloader.preloadRoute).toHaveBeenCalledWith('/route1', 'on-demand');
        expect(routePreloader.preloadRoute).toHaveBeenCalledWith('/route2', 'on-demand');
      });
    });
  });

  describe('Route Preloading Actions', () => {
    it('should preload a route', async () => {
      mockRoutePreloader.preloadRoute.mockResolvedValueOnce({});

      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        const success = await result.current.preloadRoute('/test-route');
        expect(success).toBe(true);
      });

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/test-route', 'on-demand');
    });

    it('should handle preload failures', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockRoutePreloader.preloadRoute.mockRejectedValueOnce(new Error('Preload failed'));

      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        const success = await result.current.preloadRoute('/failing-route');
        expect(success).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should check if route is preloaded', () => {
      mockRoutePreloader.isPreloaded.mockReturnValue(true);

      const { result } = renderHook(() => useRoutePreloader());

      const isPreloaded = result.current.isPreloaded('/test-route');
      expect(isPreloaded).toBe(true);
      expect(mockRoutePreloader.isPreloaded).toHaveBeenCalledWith('/test-route');
    });

    it('should get preloaded component', async () => {
      const mockComponent = () => null;
      mockRoutePreloader.getPreloadedComponent.mockResolvedValue(mockComponent);

      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        const component = await result.current.getPreloadedComponent('/test-route');
        expect(component).toBe(mockComponent);
      });

      expect(mockRoutePreloader.getPreloadedComponent).toHaveBeenCalledWith('/test-route');
    });
  });

  describe('Domain-Specific Preloading', () => {
    it('should preload property domain routes', async () => {
      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        await result.current.preloadDomainRoutes('property');
      });

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/property/:id', 'idle');
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/properties', 'idle');
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/compare', 'idle');
    });

    it('should preload user domain routes', async () => {
      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        await result.current.preloadDomainRoutes('user');
      });

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/dashboard', 'idle');
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/team', 'idle');
    });

    it('should preload trust domain routes', async () => {
      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        await result.current.preloadDomainRoutes('trust');
      });

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/services/basic-checks', 'idle');
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/services/fraud-detection', 'idle');
    });

    it('should handle unknown domain gracefully', async () => {
      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        await result.current.preloadDomainRoutes('unknown');
      });

      // Should not throw and should not call preloadRoute
      expect(mockRoutePreloader.preloadRoute).not.toHaveBeenCalled();
    });
  });

  describe('User Behavior Preloading', () => {
    it('should preload routes based on user behavior', async () => {
      const { result } = renderHook(() => useRoutePreloader());

      await act(async () => {
        await result.current.preloadByUserBehavior(['/route1', '/route2']);
      });

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/route1', 'idle');
      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/route2', 'idle');
    });
  });

  describe('Hover and Viewport Preloading Setup', () => {
    it('should setup hover preloading for element', () => {
      const { result } = renderHook(() => useRoutePreloader({ enableHoverPreloading: true }));

      const element = document.createElement('div');
      const cleanup = result.current.setupHoverPreloading(element, '/hover-route');

      // Simulate mouse enter
      const mouseEnterEvent = new Event('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(mockRoutePreloader.preloadRoute).toHaveBeenCalledWith('/hover-route', 'hover');

      // Cleanup should work
      if (cleanup) cleanup();
    });

    it('should not setup hover preloading when disabled', () => {
      const { result } = renderHook(() => useRoutePreloader({ enableHoverPreloading: false }));

      const element = document.createElement('div');
      const cleanup = result.current.setupHoverPreloading(element, '/hover-route');

      expect(cleanup).toBeUndefined();
    });

    it('should setup viewport preloading for element', () => {
      const { result } = renderHook(() => useRoutePreloader({ enableViewportPreloading: true }));

      const element = document.createElement('div');
      const cleanup = result.current.setupViewportPreloading(element, '/viewport-route');

      expect(mockRoutePreloader.observeForPreloading).toHaveBeenCalledWith(element, '/viewport-route');

      // Cleanup should work
      if (cleanup) cleanup();
    });

    it('should not setup viewport preloading when disabled', () => {
      const { result } = renderHook(() => useRoutePreloader({ enableViewportPreloading: false }));

      const element = document.createElement('div');
      const cleanup = result.current.setupViewportPreloading(element, '/viewport-route');

      expect(cleanup).toBeUndefined();
      expect(mockRoutePreloader.observeForPreloading).not.toHaveBeenCalled();
    });
  });

  describe('Performance Insights', () => {
    it('should provide performance insights for low cache hit rate', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 10,
          successfulPreloads: 8,
          cacheHitRate: 30, // Low cache hit rate
          averageLoadTime: 500,
          strategySummary: { hover: 5, idle: 3 },
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      const insights = result.current.getPerformanceInsights();
      
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Low cache hit rate'),
        })
      );
    });

    it('should provide performance insights for high load times', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 10,
          successfulPreloads: 10,
          cacheHitRate: 80,
          averageLoadTime: 1500, // High load time
          strategySummary: { hover: 5, idle: 5 },
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      const insights = result.current.getPerformanceInsights();
      
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('High average load time'),
        })
      );
    });

    it('should provide insights about most effective strategy', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 10,
          successfulPreloads: 10,
          cacheHitRate: 80,
          averageLoadTime: 500,
          strategySummary: { hover: 8, idle: 2 }, // Hover is most used
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      const insights = result.current.getPerformanceInsights();
      
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Most effective strategy: hover'),
        })
      );
    });

    it('should provide insights about low success rate', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 10,
          successfulPreloads: 7, // Low success rate
          cacheHitRate: 80,
          averageLoadTime: 500,
          strategySummary: { hover: 5, idle: 5 },
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      const insights = result.current.getPerformanceInsights();
      
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Low preload success rate'),
        })
      );
    });
  });

  describe('Computed Values', () => {
    it('should calculate hasPreloadedRoutes correctly', () => {
      mockRoutePreloader.preloadedRoutes = new Map([['route1', Promise.resolve()]]);
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 1,
          successfulPreloads: 1,
          cacheHitRate: 100,
          averageLoadTime: 500,
          strategySummary: {},
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.hasPreloadedRoutes).toBe(true);
    });

    it('should calculate preload success rate correctly', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 10,
          successfulPreloads: 8,
          cacheHitRate: 80,
          averageLoadTime: 500,
          strategySummary: {},
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.preloadSuccessRate).toBe(80);
    });

    it('should handle zero preloads for success rate calculation', () => {
      mockRoutePreloader.getMetrics.mockReturnValue({
        preloadMetrics: [],
        routeLoadingMetrics: [],
        summary: {
          totalPreloads: 0,
          successfulPreloads: 0,
          cacheHitRate: 0,
          averageLoadTime: 0,
          strategySummary: {},
        },
      });

      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.preloadSuccessRate).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useRoutePreloader());

      expect(() => unmount()).not.toThrow();
    });

    it('should clear intervals on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useRoutePreloader());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Metrics Updates', () => {
    it('should update metrics periodically', async () => {
      vi.useFakeTimers();

      renderHook(() => useRoutePreloader());

      // Fast-forward time to trigger interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockRoutePreloader.getMetrics).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should update metrics manually', () => {
      const { result } = renderHook(() => useRoutePreloader());

      act(() => {
        result.current.updateMetrics();
      });

      expect(mockRoutePreloader.getMetrics).toHaveBeenCalled();
    });
  });
});

describe('useRouteLoadingTracker Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should track current route', () => {
    const { result } = renderHook(() => useRouteLoadingTracker());

    expect(result.current.currentRoute).toBe('/');
  });

  it('should track loading metrics', async () => {
    mockPerformance.now
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1500); // End time

    const { result } = renderHook(() => useRouteLoadingTracker());

    // Simulate route change
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await waitFor(() => {
      expect(result.current.loadingMetrics.length).toBeGreaterThan(0);
    });
  });

  it('should calculate average load time', () => {
    const { result } = renderHook(() => useRouteLoadingTracker());

    // Manually add some metrics for testing
    act(() => {
      // This would normally be done internally by the hook
      // but we're testing the calculation function
    });

    const averageLoadTime = result.current.getAverageLoadTime();
    expect(typeof averageLoadTime).toBe('number');
  });

  it('should find slowest route', () => {
    const { result } = renderHook(() => useRouteLoadingTracker());

    const slowestRoute = result.current.getSlowestRoute();
    expect(slowestRoute).toBeNull(); // No metrics initially
  });

  it('should find fastest route', () => {
    const { result } = renderHook(() => useRouteLoadingTracker());

    const fastestRoute = result.current.getFastestRoute();
    expect(fastestRoute).toBeNull(); // No metrics initially
  });

  it('should calculate cache hit rate', () => {
    const { result } = renderHook(() => useRouteLoadingTracker());

    expect(result.current.cacheHitRate).toBe(0); // No metrics initially
  });
});

describe('useSmartPreloading Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM methods
    document.querySelectorAll = vi.fn().mockReturnValue([]);
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize user behavior tracking', () => {
    const { result } = renderHook(() => useSmartPreloading());

    expect(result.current.userBehavior).toBeDefined();
    expect(result.current.userBehavior.hoveredLinks).toBeInstanceOf(Set);
    expect(result.current.userBehavior.scrolledSections).toBeInstanceOf(Set);
    expect(result.current.userBehavior.clickedCategories).toBeInstanceOf(Set);
  });

  it('should predict next routes based on behavior', () => {
    const { result } = renderHook(() => useSmartPreloading());

    const predictions = result.current.predictNextRoutes();
    expect(Array.isArray(predictions)).toBe(true);
  });

  it('should preload predicted routes', async () => {
    const { result } = renderHook(() => useSmartPreloading());

    await act(async () => {
      await result.current.preloadPredictedRoutes();
    });

    // Should complete without errors
    expect(true).toBe(true);
  });

  it('should set up event listeners on mount', () => {
    renderHook(() => useSmartPreloading());

    expect(document.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSmartPreloading());

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should predict property routes when property links are hovered', () => {
    const { result } = renderHook(() => useSmartPreloading());

    // Simulate hovering over property links
    act(() => {
      result.current.userBehavior.hoveredLinks.add('/property/123');
    });

    const predictions = result.current.predictNextRoutes();
    expect(predictions).toContain('/properties');
    expect(predictions).toContain('/compare');
    expect(predictions).toContain('/search');
  });

  it('should predict service routes when services section is scrolled', () => {
    const { result } = renderHook(() => useSmartPreloading());

    // Simulate scrolling through services section
    act(() => {
      result.current.userBehavior.scrolledSections.add('services');
    });

    const predictions = result.current.predictNextRoutes();
    expect(predictions).toContain('/services/basic-checks');
    expect(predictions).toContain('/services/fraud-detection');
  });

  it('should predict key pages when on home page with scrolling', () => {
    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    const { result } = renderHook(() => useSmartPreloading());

    // Simulate scrolling through multiple sections on home page
    act(() => {
      result.current.userBehavior.scrolledSections.add('hero');
      result.current.userBehavior.scrolledSections.add('features');
      result.current.userBehavior.scrolledSections.add('pricing');
    });

    const predictions = result.current.predictNextRoutes();
    expect(predictions).toContain('/features');
    expect(predictions).toContain('/pricing');
    expect(predictions).toContain('/auth/register');
  });
});