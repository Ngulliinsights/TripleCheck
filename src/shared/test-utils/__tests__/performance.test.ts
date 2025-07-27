/**
 * Performance Testing Suite
 * Tests for page load times, Core Web Vitals, component performance,
 * image loading optimization, bundle analysis, and virtualization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  WebVitalsTestUtils,
  ComponentPerformanceTestUtils,
  PageLoadTestUtils,
  ImagePerformanceTestUtils,
  BundleAnalysisTestUtils,
  VirtualizationTestUtils,
  PerformanceTestHelpers,
} from '../performance-testing';

// Mock web-vitals for testing
vi.mock('web-vitals', () => ({
  getCLS: vi.fn((callback) => callback({ value: 0.05 })),
  getFCP: vi.fn((callback) => callback({ value: 1200 })),
  getFID: vi.fn((callback) => callback({ value: 50 })),
  getLCP: vi.fn((callback) => callback({ value: 2000 })),
  getTTFB: vi.fn((callback) => callback({ value: 300 })),
}));

describe('Performance Testing Suite', () => {
  beforeEach(() => {
    // Reset performance utilities before each test
    ComponentPerformanceTestUtils.clearPerformanceEntries();
    WebVitalsTestUtils.removeAllListeners();
    
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    PerformanceTestHelpers.restoreNetwork();
  });

  describe('Core Web Vitals Testing', () => {
    it('should measure and validate Core Web Vitals', async () => {
      const metrics = await WebVitalsTestUtils.measureWebVitals();
      
      expect(metrics).toEqual({
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

    it('should detect Core Web Vitals violations', async () => {
      const poorMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.25, // Poor: > 0.1
        fcp: 3000, // Poor: > 1.8s
        lcp: 4000, // Poor: > 2.5s
      });

      const validation = WebVitalsTestUtils.validateWebVitals(poorMetrics);
      expect(validation.passed).toBe(false);
      expect(validation.violations).toContain('CLS: 0.25 > 0.1');
      expect(validation.violations).toContain('FCP: 3000ms > 1800ms');
      expect(validation.violations).toContain('LCP: 4000ms > 2500ms');
    });

    it('should allow custom thresholds for Web Vitals validation', async () => {
      const metrics = WebVitalsTestUtils.mockWebVitals({
        lcp: 3000,
      });

      const customThresholds = { lcp: 3500 };
      const validation = WebVitalsTestUtils.validateWebVitals(metrics, customThresholds);
      
      expect(validation.passed).toBe(true);
      expect(validation.thresholds.lcp).toBe(3500);
    });
  });

  describe('Component Performance Testing', () => {
    it('should measure component render performance', () => {
      const TestComponent = () => <div>Test Component</div>;
      
      const { result, metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'TestComponent',
        () => render(<TestComponent />)
      );

      expect(result).toBeDefined();
      expect(metrics.componentName).toBe('TestComponent');
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.reRenderCount).toBe(1);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('should measure async component render performance', async () => {
      const AsyncTestComponent = () => <div>Async Test Component</div>;
      
      const { result, metrics } = await ComponentPerformanceTestUtils.measureAsyncComponentRender(
        'AsyncTestComponent',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return render(<AsyncTestComponent />);
        }
      );

      expect(result).toBeDefined();
      expect(metrics.componentName).toBe('AsyncTestComponent');
      expect(metrics.renderTime).toBeGreaterThan(0);
    });

    it('should measure component re-render performance', () => {
      const metrics = ComponentPerformanceTestUtils.measureReRenders('TestComponent', 5);
      
      expect(metrics.componentName).toBe('TestComponent');
      expect(metrics.reRenderCount).toBe(5);
      expect(metrics.renderTime).toBeGreaterThan(0);
    });

    it('should analyze component performance across multiple renders', () => {
      // Generate some test data
      ComponentPerformanceTestUtils.measureComponentRender('ComponentA', () => render(<div>A</div>));
      ComponentPerformanceTestUtils.measureComponentRender('ComponentA', () => render(<div>A</div>));
      ComponentPerformanceTestUtils.measureComponentRender('ComponentB', () => render(<div>B</div>));

      const analysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('ComponentA');
      
      expect(analysis).toBeDefined();
      expect(analysis!.componentName).toBe('ComponentA');
      expect(analysis!.totalRenders).toBe(2);
      expect(analysis!.averageRenderTime).toBeGreaterThanOrEqual(0);
      expect(analysis!.minRenderTime).toBeGreaterThanOrEqual(0);
      expect(analysis!.maxRenderTime).toBeGreaterThanOrEqual(0);
    });

    it('should validate component performance against thresholds', () => {
      const slowRenderTime = 500; // 500ms - too slow
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1000 + slowRenderTime);

      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'SlowComponent',
        () => render(<div>Slow Component</div>)
      );

      expect(metrics.renderTime).toBe(slowRenderTime);
      
      // Component should render in under 200ms for good performance
      expect(metrics.renderTime).toBeGreaterThan(200);
    });
  });

  describe('Page Load Performance Testing', () => {
    it('should measure page load metrics', async () => {
      // Mock Navigation Timing API
      const mockNavigationEntry = {
        fetchStart: 1000,
        domContentLoadedEventEnd: 1800,
        loadEventEnd: 2500,
        domInteractive: 1800,
      };

      vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
        if (type === 'navigation') {
          return [mockNavigationEntry as PerformanceNavigationTiming];
        }
        if (type === 'paint') {
          return [
            { name: 'first-paint', startTime: 600 },
            { name: 'first-contentful-paint', startTime: 1200 },
          ] as PerformanceEntry[];
        }
        return [];
      });

      const metrics = await PageLoadTestUtils.measurePageLoad();
      
      expect(metrics.domContentLoaded).toBe(800);
      expect(metrics.loadComplete).toBe(1500);
      expect(metrics.firstPaint).toBe(600);
      expect(metrics.firstContentfulPaint).toBe(1200);
      expect(metrics.timeToInteractive).toBe(800);
    });

    it('should validate page load performance', () => {
      const metrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 2000, // Too slow
        loadComplete: 4000, // Too slow
      });

      const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);
      
      expect(validation.passed).toBe(false);
      expect(validation.violations).toContain('domContentLoaded: 2000ms > 1500ms');
      expect(validation.violations).toContain('loadComplete: 4000ms > 3000ms');
    });

    it('should pass validation with good page load metrics', () => {
      const metrics = PageLoadTestUtils.mockPageLoadMetrics({
        domContentLoaded: 800,
        loadComplete: 1500,
        firstContentfulPaint: 1200,
      });

      const validation = PageLoadTestUtils.validatePageLoadPerformance(metrics);
      
      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('Image Loading Performance Testing', () => {
    it('should measure single image load time', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      const loadTimePromise = ImagePerformanceTestUtils.measureImageLoadTime('test-image.jpg');
      
      // Simulate successful image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const loadTime = await loadTimePromise;
      expect(loadTime).toBe(500);
    });

    it('should handle image load failures', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

      const loadTimePromise = ImagePerformanceTestUtils.measureImageLoadTime('invalid-image.jpg');
      
      // Simulate image load error
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(loadTimePromise).rejects.toThrow('Failed to load image: invalid-image.jpg');
    });

    it('should measure multiple image load performance', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);
      vi.spyOn(performance, 'now')
        .mockReturnValue(1000)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1300)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1400);

      const imageUrls = ['image1.jpg', 'image2.jpg'];
      const resultsPromise = ImagePerformanceTestUtils.measureMultipleImageLoads(imageUrls);
      
      // Simulate successful loads
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const results = await resultsPromise;
      
      expect(results.individualTimes).toHaveLength(2);
      expect(results.averageLoadTime).toBeGreaterThan(0);
      expect(results.totalLoadTime).toBeGreaterThan(0);
      expect(results.failedImages).toHaveLength(0);
    });

    it('should test lazy loading effectiveness', async () => {
      // Mock DOM elements
      const mockContainer = document.createElement('div');
      const mockImage1 = document.createElement('img');
      const mockImage2 = document.createElement('img');
      
      mockImage1.complete = true;
      mockImage1.naturalHeight = 100;
      mockImage2.complete = false;
      
      document.body.appendChild(mockContainer);
      document.body.appendChild(mockImage1);
      document.body.appendChild(mockImage2);

      vi.spyOn(document, 'querySelector').mockReturnValue(mockContainer);
      vi.spyOn(document, 'querySelectorAll').mockReturnValue([mockImage1, mockImage2] as any);

      // Mock IntersectionObserver
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      vi.spyOn(window, 'IntersectionObserver').mockImplementation((callback) => {
        // Simulate intersection
        setTimeout(() => {
          callback([
            { target: mockImage1, isIntersecting: true },
            { target: mockImage2, isIntersecting: false },
          ] as any, mockObserver as any);
        }, 0);
        
        return mockObserver as any;
      });

      const result = await ImagePerformanceTestUtils.testLazyLoadingEffectiveness('.container', 'img');
      
      expect(result.imagesInViewport).toBe(1);
      expect(result.imagesLoaded).toBe(1);
      expect(result.lazyLoadingWorking).toBe(true);
      
      // Cleanup
      document.body.removeChild(mockContainer);
      document.body.removeChild(mockImage1);
      document.body.removeChild(mockImage2);
    });
  });

  describe('Bundle Analysis Testing', () => {
    it('should analyze bundle size metrics', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      
      expect(metrics.totalSize).toBeGreaterThan(0);
      expect(metrics.gzippedSize).toBeLessThan(metrics.totalSize);
      expect(metrics.chunkSizes).toBeDefined();
      expect(metrics.unusedCode).toBeGreaterThanOrEqual(0);
      expect(metrics.duplicateCode).toBeGreaterThanOrEqual(0);
    });

    it('should validate bundle size against thresholds', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      const validation = BundleAnalysisTestUtils.validateBundleSize(metrics);
      
      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect bundle size violations', async () => {
      const largeBundleMetrics = {
        totalSize: 5000000, // 5MB - too large
        gzippedSize: 1500000, // 1.5MB - too large
        chunkSizes: { main: 3000000 },
        unusedCode: 500000, // 500KB - too much
        duplicateCode: 300000, // 300KB - too much
      };

      const validation = BundleAnalysisTestUtils.validateBundleSize(largeBundleMetrics);
      
      expect(validation.passed).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations.some(v => v.includes('Total bundle size'))).toBe(true);
    });

    it('should measure code splitting effectiveness', () => {
      const effectiveness = BundleAnalysisTestUtils.measureCodeSplittingEffectiveness();
      
      expect(effectiveness.totalChunks).toBeGreaterThan(0);
      expect(effectiveness.averageChunkSize).toBeGreaterThan(0);
      expect(effectiveness.largestChunk.name).toBeDefined();
      expect(effectiveness.largestChunk.size).toBeGreaterThan(0);
      expect(effectiveness.splittingScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Virtualization Performance Testing', () => {
    it('should measure virtualized list performance', async () => {
      const mockContainer = document.createElement('div');
      mockContainer.style.height = '400px';
      mockContainer.clientHeight = 400;
      
      document.body.appendChild(mockContainer);

      const metrics = await VirtualizationTestUtils.measureVirtualizedListPerformance(
        mockContainer,
        1000,
        50
      );
      
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.visibleItems).toBe(8); // 400px / 50px = 8 items
      expect(metrics.scrollPerformance).toBeGreaterThanOrEqual(0);
      
      document.body.removeChild(mockContainer);
    });

    it('should test infinite scroll performance', async () => {
      const mockContainer = document.createElement('div');
      
      // Add initial items
      for (let i = 0; i < 10; i++) {
        const item = document.createElement('div');
        mockContainer.appendChild(item);
      }
      
      document.body.appendChild(mockContainer);

      const loadMoreCallback = async () => {
        // Simulate loading more items
        await new Promise(resolve => setTimeout(resolve, 100));
        for (let i = 0; i < 5; i++) {
          const item = document.createElement('div');
          mockContainer.appendChild(item);
        }
      };

      const metrics = await VirtualizationTestUtils.testInfiniteScrollPerformance(
        mockContainer,
        loadMoreCallback
      );
      
      expect(metrics.loadTime).toBeGreaterThan(0);
      expect(metrics.itemsLoaded).toBe(5);
      expect(metrics.memoryGrowth).toBeGreaterThanOrEqual(0);
      
      document.body.removeChild(mockContainer);
    });

    it('should generate mock virtualization metrics', () => {
      const metrics = VirtualizationTestUtils.mockVirtualizationMetrics(1000);
      
      expect(metrics.renderTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBe(1000 * 1024); // 1KB per item
      expect(metrics.visibleItems).toBe(8); // 400px / 50px
      expect(metrics.scrollPerformance).toBeGreaterThan(0);
    });
  });

  describe('Performance Test Helpers', () => {
    it('should create performance test with thresholds', async () => {
      const testFunction = () => {
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      };

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'TestFunction',
        testFunction,
        { maxTime: 1000 }
      );

      const result = await performanceTest();
      
      expect(result.testName).toBe('TestFunction');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.passed).toBe(true);
    });

    it('should fail performance test when exceeding thresholds', async () => {
      const slowTestFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      };

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'SlowTestFunction',
        slowTestFunction,
        { maxTime: 100 }
      );

      await expect(performanceTest()).rejects.toThrow(
        'SlowTestFunction exceeded time threshold'
      );
    });

    it('should run performance benchmark', async () => {
      const testFunction = () => {
        return Math.random();
      };

      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'RandomFunction',
        testFunction,
        5
      );
      
      expect(benchmark.name).toBe('RandomFunction');
      expect(benchmark.iterations).toBe(5);
      expect(benchmark.averageTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.minTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.maxTime).toBeGreaterThanOrEqual(benchmark.minTime);
      expect(benchmark.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should simulate slow network conditions', () => {
      PerformanceTestHelpers.simulateSlowNetwork(500);
      
      expect(global.fetch).toBeDefined();
      expect(vi.isMockFunction(global.fetch)).toBe(true);
      
      PerformanceTestHelpers.restoreNetwork();
    });

    it('should provide frame and idle utilities', async () => {
      // Test waitForNextFrame
      const framePromise = PerformanceTestHelpers.waitForNextFrame();
      expect(framePromise).toBeInstanceOf(Promise);
      await framePromise;

      // Test waitForIdle
      const idlePromise = PerformanceTestHelpers.waitForIdle();
      expect(idlePromise).toBeInstanceOf(Promise);
      await idlePromise;
    });
  });
});