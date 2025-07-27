/**
 * Core Web Vitals and Page Load Performance Tests
 * Tests for measuring and validating Core Web Vitals metrics and page load performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  WebVitalsTestUtils, 
  PageLoadTestUtils,
  PerformanceTestHelpers 
} from '../performance-testing';
import { renderWithProviders } from '../render';
import React from 'react';

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  getCLS: vi.fn((callback) => callback({ value: 0.05, name: 'CLS' })),
  getFCP: vi.fn((callback) => callback({ value: 1200, name: 'FCP' })),
  getFID: vi.fn((callback) => callback({ value: 50, name: 'FID' })),
  getLCP: vi.fn((callback) => callback({ value: 2000, name: 'LCP' })),
  getTTFB: vi.fn((callback) => callback({ value: 300, name: 'TTFB' })),
}));

// Mock performance API
const mockPerformanceEntries = {
  navigation: {
    fetchStart: 100,
    domContentLoadedEventEnd: 900,
    loadEventEnd: 1600,
    domInteractive: 1900,
  },
  paint: [
    { name: 'first-paint', startTime: 600 },
    { name: 'first-contentful-paint', startTime: 1200 },
  ],
};

Object.defineProperty(global, 'performance', {
  value: {
    ...performance,
    getEntriesByType: vi.fn((type) => {
      if (type === 'navigation') {
        return [mockPerformanceEntries.navigation];
      }
      if (type === 'paint') {
        return mockPerformanceEntries.paint;
      }
      return [];
    }),
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

describe('Core Web Vitals Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WebVitalsTestUtils.removeAllListeners();
  });

  afterEach(() => {
    WebVitalsTestUtils.removeAllListeners();
  });

  describe('Web Vitals Measurement', () => {
    it('should measure all Core Web Vitals metrics', async () => {
      const metrics = await WebVitalsTestUtils.measureWebVitals();

      expect(metrics).toEqual({
        cls: 0.05,
        fcp: 1200,
        fid: 50,
        lcp: 2000,
        ttfb: 300,
      });
    });

    it('should validate Web Vitals against good thresholds', () => {
      const metrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.05,
        fcp: 1200,
        fid: 50,
        lcp: 2000,
        ttfb: 300,
      });

      const validation = WebVitalsTestUtils.validateWebVitals(metrics);

      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect Web Vitals violations', () => {
      const metrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.15, // Poor: > 0.1
        fcp: 2500, // Poor: > 1.8s
        fid: 150,  // Poor: > 100ms
        lcp: 3000, // Poor: > 2.5s
        ttfb: 1000, // Poor: > 800ms
      });

      const validation = WebVitalsTestUtils.validateWebVitals(metrics);

      expect(validation.passed).toBe(false);
      expect(validation.violations).toHaveLength(5);
      expect(validation.violations).toContain('CLS: 0.15 > 0.1');
      expect(validation.violations).toContain('FCP: 2500ms > 1800ms');
      expect(validation.violations).toContain('FID: 150ms > 100ms');
      expect(validation.violations).toContain('LCP: 3000ms > 2500ms');
      expect(validation.violations).toContain('TTFB: 1000ms > 800ms');
    });

    it('should allow custom thresholds for Web Vitals validation', () => {
      const metrics = WebVitalsTestUtils.mockWebVitals({
        lcp: 3000,
      });

      const customThresholds = {
        lcp: 3500, // More lenient threshold
      };

      const validation = WebVitalsTestUtils.validateWebVitals(metrics, customThresholds);

      expect(validation.passed).toBe(true);
      expect(validation.thresholds.lcp).toBe(3500);
    });
  });

  describe('Page Load Performance Tests', () => {
    it('should measure page load metrics using Navigation Timing API', async () => {
      const metrics = await PageLoadTestUtils.measurePageLoad();

      expect(metrics.domContentLoaded).toBe(800); // 900 - 100
      expect(metrics.loadComplete).toBe(1500); // 1600 - 100
      expect(metrics.timeToInteractive).toBe(1800); // 1900 - 100
      expect(metrics.firstPaint).toBe(600);
      expect(metrics.firstContentfulPaint).toBe(1200);
      expect(metrics.largestContentfulPaint).toBe(2000);
    });

    it('should validate page load performance against thresholds', () => {
      const metrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 800,
        loadComplete: 1500,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2000,
        timeToInteractive: 1800,
      });

      const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);

      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect slow page load performance', () => {
      const metrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 2000, // Slow: > 1500ms
        loadComplete: 4000,     // Slow: > 3000ms
        firstContentfulPaint: 2500, // Slow: > 1800ms
        largestContentfulPaint: 3500, // Slow: > 2500ms
        timeToInteractive: 4500, // Slow: > 3800ms
      });

      const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);

      expect(validation.passed).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations).toContain('domContentLoaded: 2000ms > 1500ms');
      expect(validation.violations).toContain('loadComplete: 4000ms > 3000ms');
    });

    it('should support custom performance thresholds', () => {
      const metrics = PageLoadTestUtils.mockPageLoadMetrics({
        loadComplete: 3500,
      });

      const customThresholds = {
        loadComplete: 4000, // More lenient
      };

      const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics, customThresholds);

      expect(validation.passed).toBe(true);
    });
  });

  describe('Performance Test Helpers', () => {
    it('should create performance tests with time thresholds', async () => {
      const fastTest = PerformanceTestHelpers.createPerformanceTest(
        'Fast Test',
        () => {
          // Simulate fast operation
          for (let i = 0; i < 1000; i++) {
            Math.random();
          }
        },
        { maxTime: 100 }
      );

      const result = await fastTest();
      expect(result.passed).toBe(true);
      expect(result.testName).toBe('Fast Test');
      expect(result.executionTime).toBeLessThan(100);
    });

    it('should fail performance tests that exceed thresholds', async () => {
      const slowTest = PerformanceTestHelpers.createPerformanceTest(
        'Slow Test',
        async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 150));
        },
        { maxTime: 100 }
      );

      await expect(slowTest()).rejects.toThrow('Slow Test exceeded time threshold');
    });

    it('should run performance benchmarks', async () => {
      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Math Operations',
        () => {
          let result = 0;
          for (let i = 0; i < 10000; i++) {
            result += Math.sqrt(i);
          }
          return result;
        },
        5
      );

      expect(benchmark.name).toBe('Math Operations');
      expect(benchmark.iterations).toBe(5);
      expect(benchmark.averageTime).toBeGreaterThan(0);
      expect(benchmark.minTime).toBeLessThanOrEqual(benchmark.averageTime);
      expect(benchmark.maxTime).toBeGreaterThanOrEqual(benchmark.averageTime);
      expect(benchmark.totalTime).toBe(benchmark.averageTime * 5);
    });

    it('should provide frame and idle waiting utilities', async () => {
      const frameStart = performance.now();
      await PerformanceTestHelpers.waitForNextFrame();
      const frameEnd = performance.now();

      expect(frameEnd - frameStart).toBeGreaterThan(0);

      const idleStart = performance.now();
      await PerformanceTestHelpers.waitForIdle();
      const idleEnd = performance.now();

      expect(idleEnd - idleStart).toBeGreaterThanOrEqual(0);
    });

    it('should simulate slow network conditions', () => {
      const originalFetch = global.fetch;
      
      PerformanceTestHelpers.simulateSlowNetwork(500);
      
      expect(global.fetch).not.toBe(originalFetch);
      expect(vi.isMockFunction(global.fetch)).toBe(true);

      PerformanceTestHelpers.restoreNetwork();
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should measure performance of component rendering with providers', async () => {
      const TestComponent = () => <div>Performance Test Component</div>;

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Component Render',
        () => {
          renderWithProviders(<TestComponent />);
        },
        { maxTime: 50 }
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });

    it('should validate Core Web Vitals for a typical good page', () => {
      const goodPageMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.05,   // Good
        fcp: 1200,   // Good
        fid: 50,     // Good
        lcp: 2000,   // Good
        ttfb: 300,   // Good
      });

      const validation = WebVitalsTestUtils.validateWebVitals(goodPageMetrics);
      expect(validation.passed).toBe(true);
    });

    it('should validate Core Web Vitals for a typical poor page', () => {
      const poorPageMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.25,   // Poor
        fcp: 3000,   // Poor
        fid: 300,    // Poor
        lcp: 4000,   // Poor
        ttfb: 1200,  // Poor
      });

      const validation = WebVitalsTestUtils.validateWebVitals(poorPageMetrics);
      expect(validation.passed).toBe(false);
      expect(validation.violations.length).toBe(5);
    });

    it('should measure and validate page load for different page types', async () => {
      // Simulate different page load scenarios
      const scenarios = [
        { name: 'Landing Page', loadComplete: 1200, lcp: 1800 },
        { name: 'Property Listing', loadComplete: 2000, lcp: 2200 },
        { name: 'Property Details', loadComplete: 2500, lcp: 2800 },
        { name: 'Search Results', loadComplete: 1800, lcp: 2100 },
      ];

      for (const scenario of scenarios) {
        const metrics = PageLoadTestUtils.mockPageLoadMetrics({
          loadComplete: scenario.loadComplete,
          largestContentfulPaint: scenario.lcp,
        });

        const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);
        
        // All scenarios should pass with good performance
        expect(validation.passed).toBe(true);
      }
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should integrate with existing performance monitor', () => {
      // Test integration with the existing performance monitor
      const metrics = WebVitalsTestUtils.mockWebVitals();
      
      // Simulate sending metrics to performance monitor
      const mockSendMetrics = vi.fn();
      WebVitalsTestUtils.addListener(mockSendMetrics);

      // Trigger metrics update
      WebVitalsTestUtils.mockWebVitals({ lcp: 2500 });

      // Verify integration works
      expect(mockSendMetrics).toHaveBeenCalled();
    });

    it('should provide performance insights based on metrics', () => {
      const poorMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.15,
        lcp: 3000,
        fid: 200,
      });

      const validation = WebVitalsTestUtils.validateWebVitals(poorMetrics);
      
      // Should provide actionable insights
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations.some(v => v.includes('CLS'))).toBe(true);
      expect(validation.violations.some(v => v.includes('LCP'))).toBe(true);
      expect(validation.violations.some(v => v.includes('FID'))).toBe(true);
    });
  });
});