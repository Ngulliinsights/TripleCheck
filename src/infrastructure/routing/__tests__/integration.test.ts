/**
 * Integration test for route preloading optimization
 * Tests the complete system working together
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { routePreloader } from '../route-preloader'

describe('Route Preloading Integration', () => {
  beforeEach(() => {
    // Reset the preloader state
    routePreloader['preloadedRoutes'].clear();
    routePreloader['preloadMetrics'] = [];
    routePreloader['routeLoadingMetrics'] = [];
  });

  it('should initialize and track basic metrics', () => {
    const metrics = routePreloader.getMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.summary).toBeDefined();
    expect(metrics.summary.totalPreloads).toBeGreaterThanOrEqual(0);
    expect(metrics.summary.strategySummary).toBeDefined();
  });

  it('should identify route configurations correctly', () => {
    const homeConfig = routePreloader['getRouteConfig']('/');
    const propertyConfig = routePreloader['getRouteConfig']('/property/123');
    
    expect(homeConfig).toBeDefined();
    expect(homeConfig?.domain).toBe('shared');
    expect(homeConfig?.component).toBe('Home');
    
    expect(propertyConfig).toBeDefined();
    expect(propertyConfig?.domain).toBe('property');
    expect(propertyConfig?.component).toBe('PropertyDetails');
  });

  it('should handle route data endpoint mapping', () => {
    const propertyEndpoints = routePreloader['getRouteDataEndpoints']('/property/123');
    const dashboardEndpoints = routePreloader['getRouteDataEndpoints']('/dashboard');
    
    expect(propertyEndpoints).toContain('/api/properties/123');
    expect(propertyEndpoints).toContain('/api/trust-scores/123');
    
    expect(dashboardEndpoints).toContain('/api/user/profile');
    expect(dashboardEndpoints).toContain('/api/user/properties');
  });

  it('should track preload attempts', async () => {
    const initialMetrics = routePreloader.getMetrics();
    const initialCount = initialMetrics.summary.totalPreloads;
    
    // Attempt to preload a route (will fail in test environment, but should be tracked)
    await routePreloader.preloadRoute('/test-route', 'immediate');
    
    const updatedMetrics = routePreloader.getMetrics();
    expect(updatedMetrics.summary.totalPreloads).toBeGreaterThan(initialCount);
    
    const testRouteMetrics = updatedMetrics.preloadMetrics.find(m => m.route === '/test-route');
    expect(testRouteMetrics).toBeDefined();
    expect(testRouteMetrics?.strategy).toBe('immediate');
  });

  it('should prevent duplicate preloading', async () => {
    // First preload attempt
    await routePreloader.preloadRoute('/duplicate-test', 'immediate');
    
    const firstMetrics = routePreloader.getMetrics();
    const firstCount = firstMetrics.summary.totalPreloads;
    
    // Second preload attempt of same route
    await routePreloader.preloadRoute('/duplicate-test', 'hover');
    
    const secondMetrics = routePreloader.getMetrics();
    
    // Should have one more metric (for the second attempt) but route should be cached
    expect(secondMetrics.summary.totalPreloads).toBe(firstCount + 1);
    
    const duplicateMetrics = secondMetrics.preloadMetrics.filter(m => m.route === '/duplicate-test');
    expect(duplicateMetrics).toHaveLength(2);
    expect(duplicateMetrics[1].cacheHit).toBe(true);
  });

  it('should calculate performance metrics correctly', () => {
    // Add some test metrics
    routePreloader['preloadMetrics'] = [
      {
        route: '/route1',
        strategy: 'immediate',
        loadTime: 100,
        cacheHit: false,
        timestamp: Date.now(),
        success: true,
      },
      {
        route: '/route1',
        strategy: 'hover',
        loadTime: 10,
        cacheHit: true,
        timestamp: Date.now(),
        success: true,
      },
      {
        route: '/route2',
        strategy: 'idle',
        loadTime: 150,
        cacheHit: false,
        timestamp: Date.now(),
        success: false,
        error: 'Test error',
      },
    ];

    const metrics = routePreloader.getMetrics();
    
    expect(metrics.summary.totalPreloads).toBe(3);
    expect(metrics.summary.successfulPreloads).toBe(2);
    expect(metrics.summary.cacheHitRate).toBeCloseTo(33.33, 1);
    expect(metrics.summary.averageLoadTime).toBeCloseTo(86.67, 1);
    
    expect(metrics.summary.strategySummary).toEqual({
      immediate: 1,
      hover: 1,
      idle: 1,
    });
  });

  it('should provide cleanup functionality', () => {
    // Add some test data
    routePreloader['preloadedRoutes'].set('/test1', Promise.resolve(() => null));
    routePreloader['preloadedRoutes'].set('/test2', Promise.resolve(() => null));
    routePreloader['preloadQueue'].add('/test3');
    
    expect(routePreloader['preloadedRoutes'].size).toBe(2);
    expect(routePreloader['preloadQueue'].size).toBe(1);
    
    routePreloader.destroy();
    
    expect(routePreloader['preloadedRoutes'].size).toBe(0);
    expect(routePreloader['preloadQueue'].size).toBe(0);
  });
});