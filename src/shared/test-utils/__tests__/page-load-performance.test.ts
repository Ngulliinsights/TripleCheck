/**
 * Page Load Performance Tests
 * Tests for measuring page load times, Core Web Vitals, and overall page performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  WebVitalsTestUtils,
  PageLoadTestUtils,
  PerformanceTestHelpers
} from '../performance-testing';

// Mock the Navigation Timing API
const mockNavigationTiming = {
  fetchStart: 100,
  domainLookupStart: 120,
  domainLookupEnd: 140,
  connectStart: 140,
  connectEnd: 180,
  requestStart: 200,
  responseStart: 350,
  responseEnd: 450,
  domLoading: 460,
  domInteractive: 800,
  domContentLoadedEventStart: 850,
  domContentLoadedEventEnd: 900,
  domComplete: 1200,
  loadEventStart: 1250,
  loadEventEnd: 1300,
};

// Mock the Paint Timing API
const mockPaintTiming = [
  { name: 'first-paint', startTime: 600 },
  { name: 'first-contentful-paint', startTime: 750 },
];

describe('Page Load Performance Tests', () => {
  beforeEach(() => {
    // Mock performance APIs
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [mockNavigationTiming as any];
      }
      if (type === 'paint') {
        return mockPaintTiming as any[];
      }
      return [];
    });

    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Web Vitals Measurement', () => {
    it('should measure all Core Web Vitals metrics', async () => {
      const metrics = await WebVitalsTestUtils.measureWebVitals();
      
      expect(metrics).toMatchObject({
        cls: expect.any(Number),
        fcp: expect.any(Number),
        fid: expect.any(Number),
        lcp: expect.any(Number),
        ttfb: expect.any(Number),
      });

      // Verify metrics are within reasonable ranges
      expect(metrics.cls).toBeGreaterThanOrEqual(0);
      expect(metrics.cls).toBeLessThan(1); // CLS should be less than 1
      expect(metrics.fcp).toBeGreaterThan(0);
      expect(metrics.fid).toBeGreaterThanOrEqual(0);
      expect(metrics.lcp).toBeGreaterThan(0);
      expect(metrics.ttfb).toBeGreaterThan(0);
    });

    it('should validate Core Web Vitals against performance thresholds', async () => {
      // Test with good metrics
      const goodMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.05,  // Good: ≤ 0.1
        fcp: 1500,  // Good: ≤ 1.8s
        fid: 80,    // Good: ≤ 100ms
        lcp: 2200,  // Good: ≤ 2.5s
        ttfb: 600,  // Good: ≤ 800ms
      });

      const validation = WebVitalsTestUtils.validateWebVitals(goodMetrics);
      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);

      // Test with poor metrics
      const poorMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.25,  // Poor: > 0.1
        fcp: 3000,  // Poor: > 1.8s
        fid: 200,   // Poor: > 100ms
        lcp: 4000,  // Poor: > 2.5s
        ttfb: 1200, // Poor: > 800ms
      });

      const poorValidation = WebVitalsTestUtils.validateWebVitals(poorMetrics);
      expect(poorValidation.passed).toBe(false);
      expect(poorValidation.violations.length).toBeGreaterThan(0);
      expect(poorValidation.violations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('CLS'),
          expect.stringContaining('FCP'),
          expect.stringContaining('FID'),
          expect.stringContaining('LCP'),
          expect.stringContaining('TTFB'),
        ])
      );
    });

    it('should support custom performance thresholds', async () => {
      const metrics = WebVitalsTestUtils.mockWebVitals({
        lcp: 3000, // Would fail default threshold (2500ms)
      });

      // Should fail with default thresholds
      const defaultValidation = WebVitalsTestUtils.validateWebVitals(metrics);
      expect(defaultValidation.passed).toBe(false);

      // Should pass with custom relaxed thresholds
      const customValidation = WebVitalsTestUtils.validateWebVitals(metrics, {
        lcp: 3500, // More lenient threshold
      });
      expect(customValidation.passed).toBe(true);
    });
  });

  describe('Page Load Timing Measurement', () => {
    it('should measure comprehensive page load metrics', async () => {
      const metrics = await PageLoadTestUtils.measurePageLoad();
      
      expect(metrics).toMatchObject({
        domContentLoaded: expect.any(Number),
        loadComplete: expect.any(Number),
        firstPaint: expect.any(Number),
        firstContentfulPaint: expect.any(Number),
        largestContentfulPaint: expect.any(Number),
        timeToInteractive: expect.any(Number),
      });

      // Verify timing relationships
      expect(metrics.firstPaint).toBeLessThan(metrics.firstContentfulPaint);
      expect(metrics.domContentLoaded).toBeLessThan(metrics.loadComplete);
      expect(metrics.timeToInteractive).toBeGreaterThan(0);
    });

    it('should validate page load performance against thresholds', async () => {
      const fastMetrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 800,   // Fast
        loadComplete: 1200,     // Fast
        firstPaint: 400,        // Fast
        firstContentfulPaint: 600, // Fast
        largestContentfulPaint: 1800, // Good
        timeToInteractive: 1500, // Good
      });

      const validation = PageLoadTestUtils.validatePageLoadPerformance(fastMetrics);
      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);

      const slowMetrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 3000,  // Slow
        loadComplete: 6000,     // Very slow
        firstPaint: 2000,       // Slow
        firstContentfulPaint: 3000, // Slow
        largestContentfulPaint: 5000, // Poor
        timeToInteractive: 8000, // Poor
      });

      const slowValidation = PageLoadTestUtils.validatePageLoadPerformance(slowMetrics);
      expect(slowValidation.passed).toBe(false);
      expect(slowValidation.violations.length).toBeGreaterThan(0);
    });

    it('should measure page load performance for different page types', async () => {
      // Simulate different page types with different performance characteristics
      const pageTypes = [
        {
          name: 'Homepage',
          metrics: PageLoadTestUtils.mockPageLoadMetrics({
            domContentLoaded: 1000,
            loadComplete: 2000,
            largestContentfulPaint: 1800,
          }),
        },
        {
          name: 'Property Listing',
          metrics: PageLoadTestUtils.mockPageLoadMetrics({
            domContentLoaded: 1500, // Slower due to more data
            loadComplete: 3000,
            largestContentfulPaint: 2500,
          }),
        },
        {
          name: 'Property Details',
          metrics: PageLoadTestUtils.mockPageLoadMetrics({
            domContentLoaded: 1200,
            loadComplete: 2500,
            largestContentfulPaint: 2200,
          }),
        },
      ];

      for (const pageType of pageTypes) {
        const validation = PageLoadTestUtils.validatePageLoadPerformance(pageType.metrics);
        
        console.log(`${pageType.name} Performance:`, {
          passed: validation.passed,
          violations: validation.violations.length,
          lcp: pageType.metrics.largestContentfulPaint,
        });

        // All page types should meet basic performance requirements
        expect(pageType.metrics.domContentLoaded).toBeLessThan(2000);
        expect(pageType.metrics.loadComplete).toBeLessThan(4000);
        expect(pageType.metrics.largestContentfulPaint).toBeLessThan(3000);
      }
    });
  });

  describe('Network Performance Impact', () => {
    it('should measure performance under different network conditions', async () => {
      const networkConditions = [
        { name: 'Fast 3G', delay: 100, bandwidth: 1.5 },
        { name: 'Slow 3G', delay: 300, bandwidth: 0.5 },
        { name: 'WiFi', delay: 20, bandwidth: 10 },
      ];

      for (const condition of networkConditions) {
        // Simulate network delay
        PerformanceTestHelpers.simulateSlowNetwork(condition.delay);

        const startTime = performance.now();
        
        // Simulate page load under network conditions
        await new Promise(resolve => setTimeout(resolve, condition.delay));
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        expect(loadTime).toBeGreaterThanOrEqual(condition.delay);
        
        // Adjust performance expectations based on network conditions
        const expectedThreshold = condition.name === 'WiFi' ? 1000 : 
                                condition.name === 'Fast 3G' ? 2000 : 4000;
        
        if (loadTime > expectedThreshold) {
          console.warn(`${condition.name} performance concern: ${loadTime}ms > ${expectedThreshold}ms`);
        }

        PerformanceTestHelpers.restoreNetwork();
      }
    });

    it('should test performance with resource loading failures', async () => {
      // Mock fetch to simulate resource loading failures
      const originalFetch = global.fetch;
      let failureCount = 0;

      global.fetch = vi.fn().mockImplementation(async (url) => {
        if (failureCount < 2) {
          failureCount++;
          throw new Error('Network error');
        }
        return new Response('Success');
      });

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Resource Loading with Failures',
        async () => {
          try {
            await fetch('/api/properties');
          } catch (error) {
            // Retry logic
            await new Promise(resolve => setTimeout(resolve, 100));
            await fetch('/api/properties');
          }
        },
        { maxTime: 1000 }
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
      expect(failureCount).toBe(2); // Should have retried twice

      global.fetch = originalFetch;
    });
  });

  describe('Performance Monitoring and Alerting', () => {
    it('should detect performance regressions over time', async () => {
      const baselineMetrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 1000,
        loadComplete: 2000,
        largestContentfulPaint: 1800,
      });

      const currentMetrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 1800, // 80% slower
        loadComplete: 3600,     // 80% slower
        largestContentfulPaint: 3200, // 78% slower
      });

      // Check for significant regression (>50% slower)
      const regressionThreshold = 0.5;
      const regressions: string[] = [];

      Object.entries(currentMetrics).forEach(([key, value]) => {
        const baselineValue = baselineMetrics[key as keyof typeof baselineMetrics];
        const regressionPercent = (value - baselineValue) / baselineValue;
        
        if (regressionPercent > regressionThreshold) {
          regressions.push(`${key}: ${(regressionPercent * 100).toFixed(1)}% slower`);
        }
      });

      expect(regressions.length).toBeGreaterThan(0);
      expect(regressions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('domContentLoaded'),
          expect.stringContaining('loadComplete'),
          expect.stringContaining('largestContentfulPaint'),
        ])
      );
    });

    it('should generate performance reports', async () => {
      const testResults = [];
      
      // Simulate multiple page load tests
      for (let i = 0; i < 5; i++) {
        const metrics = await PageLoadTestUtils.measurePageLoad();
        const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);
        
        testResults.push({
          timestamp: Date.now() + (i * 1000),
          metrics,
          validation,
        });
      }

      // Generate performance report
      const report = {
        testCount: testResults.length,
        passRate: testResults.filter(r => r.validation.passed).length / testResults.length,
        averageMetrics: {
          domContentLoaded: testResults.reduce((sum, r) => sum + r.metrics.domContentLoaded, 0) / testResults.length,
          loadComplete: testResults.reduce((sum, r) => sum + r.metrics.loadComplete, 0) / testResults.length,
          largestContentfulPaint: testResults.reduce((sum, r) => sum + r.metrics.largestContentfulPaint, 0) / testResults.length,
        },
        violations: testResults.flatMap(r => r.validation.violations),
      };

      expect(report.testCount).toBe(5);
      expect(report.passRate).toBeGreaterThan(0);
      expect(report.averageMetrics.domContentLoaded).toBeGreaterThan(0);
      expect(report.averageMetrics.loadComplete).toBeGreaterThan(0);
      expect(report.averageMetrics.largestContentfulPaint).toBeGreaterThan(0);

      console.log('Performance Report:', report);
    });
  });

  describe('Real User Monitoring (RUM) Simulation', () => {
    it('should simulate real user performance monitoring', async () => {
      const userSessions = [
        { userAgent: 'Chrome/91.0', connection: 'wifi', location: 'nairobi' },
        { userAgent: 'Safari/14.0', connection: '3g', location: 'mombasa' },
        { userAgent: 'Firefox/89.0', connection: '4g', location: 'kisumu' },
      ];

      const sessionResults = [];

      for (const session of userSessions) {
        // Simulate different performance based on user context
        const networkDelay = session.connection === 'wifi' ? 50 : 
                           session.connection === '4g' ? 200 : 500;

        const metrics = PageLoadTestUtils.mockPageLoadMetrics({
          domContentLoaded: 1000 + networkDelay,
          loadComplete: 2000 + networkDelay,
          largestContentfulPaint: 1800 + networkDelay,
        });

        const webVitals = WebVitalsTestUtils.mockWebVitals({
          lcp: metrics.largestContentfulPaint,
          fcp: metrics.firstContentfulPaint,
          ttfb: 200 + networkDelay / 2,
        });

        sessionResults.push({
          session,
          metrics,
          webVitals,
          performanceScore: this.calculatePerformanceScore(metrics, webVitals),
        });
      }

      // Analyze results across different user contexts
      const averageScore = sessionResults.reduce((sum, r) => sum + r.performanceScore, 0) / sessionResults.length;
      const wifiSessions = sessionResults.filter(r => r.session.connection === 'wifi');
      const mobileSessions = sessionResults.filter(r => r.session.connection !== 'wifi');

      expect(averageScore).toBeGreaterThan(0);
      expect(averageScore).toBeLessThan(100);

      if (wifiSessions.length > 0 && mobileSessions.length > 0) {
        const wifiAverage = wifiSessions.reduce((sum, r) => sum + r.performanceScore, 0) / wifiSessions.length;
        const mobileAverage = mobileSessions.reduce((sum, r) => sum + r.performanceScore, 0) / mobileSessions.length;
        
        // WiFi should generally perform better than mobile
        expect(wifiAverage).toBeGreaterThan(mobileAverage);
      }
    });

    // Helper method to calculate performance score
    calculatePerformanceScore(metrics: any, webVitals: any): number {
      // Simplified performance score calculation (0-100)
      const lcpScore = Math.max(0, 100 - (webVitals.lcp / 25)); // 2.5s = 100 points
      const fcpScore = Math.max(0, 100 - (webVitals.fcp / 18)); // 1.8s = 100 points
      const clsScore = Math.max(0, 100 - (webVitals.cls * 1000)); // 0.1 = 100 points
      
      return Math.round((lcpScore + fcpScore + clsScore) / 3);
    }
  });

  describe('Performance Budget Enforcement', () => {
    it('should enforce performance budgets', async () => {
      const performanceBudget = {
        domContentLoaded: 1500,
        loadComplete: 3000,
        largestContentfulPaint: 2500,
        firstContentfulPaint: 1800,
        totalSize: 2000000, // 2MB
        jsSize: 800000,     // 800KB
        cssSize: 200000,    // 200KB
        imageSize: 1000000, // 1MB
      };

      const currentMetrics = {
        ...PageLoadTestUtils.mockPageLoadMetrics(),
        totalSize: 2500000, // Exceeds budget
        jsSize: 900000,     // Exceeds budget
        cssSize: 150000,    // Within budget
        imageSize: 800000,  // Within budget
      };

      const budgetViolations: string[] = [];

      Object.entries(performanceBudget).forEach(([key, budget]) => {
        const current = currentMetrics[key as keyof typeof currentMetrics];
        if (current > budget) {
          const overage = ((current - budget) / budget * 100).toFixed(1);
          budgetViolations.push(`${key}: ${overage}% over budget`);
        }
      });

      expect(budgetViolations.length).toBeGreaterThan(0);
      expect(budgetViolations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('totalSize'),
          expect.stringContaining('jsSize'),
        ])
      );

      // Should not include violations for items within budget
      expect(budgetViolations.some(v => v.includes('cssSize'))).toBe(false);
      expect(budgetViolations.some(v => v.includes('imageSize'))).toBe(false);
    });
  });
});