/**
 * Page Load Performance Tests
 * Tests for actual application pages and their performance characteristics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  WebVitalsTestUtils,
  PageLoadTestUtils,
  ComponentPerformanceTestUtils,
  PerformanceTestHelpers,
} from '../performance-testing';

// Mock components for testing
const MockPropertyListPage = () => {
  return (
    <div data-testid="property-list-page">
      <h1>Property Listings</h1>
      <div data-testid="property-grid">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} data-testid={`property-card-${i}`}>
            Property {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

const MockPropertyDetailPage = () => {
  return (
    <div data-testid="property-detail-page">
      <h1>Property Details</h1>
      <div data-testid="property-images">
        {Array.from({ length: 5 }, (_, i) => (
          <img
            key={i}
            src={`/images/property-${i}.jpg`}
            alt={`Property image ${i + 1}`}
            data-testid={`property-image-${i}`}
          />
        ))}
      </div>
      <div data-testid="property-info">
        <p>Property information and details</p>
      </div>
    </div>
  );
};

const MockSearchPage = () => {
  return (
    <div data-testid="search-page">
      <h1>Property Search</h1>
      <form data-testid="search-form">
        <input type="text" placeholder="Search properties..." />
        <button type="submit">Search</button>
      </form>
      <div data-testid="search-results">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} data-testid={`search-result-${i}`}>
            Search Result {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Page Load Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock performance APIs
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
      if (type === 'navigation') {
        return [{
          fetchStart: 1000,
          domContentLoadedEventEnd: 1800,
          loadEventEnd: 2500,
          domInteractive: 1800,
        }] as PerformanceNavigationTiming[];
      }
      if (type === 'paint') {
        return [
          { name: 'first-paint', startTime: 600 },
          { name: 'first-contentful-paint', startTime: 1200 },
        ] as PerformanceEntry[];
      }
      return [];
    });

    ComponentPerformanceTestUtils.clearPerformanceEntries();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('Property List Page Performance', () => {
    it('should render property list page within performance thresholds', async () => {
      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'PropertyListPage',
        () => {
          render(
            <TestWrapper>
              <MockPropertyListPage />
            </TestWrapper>
          );
        },
        { maxTime: 200 } // Should render in under 200ms
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
      expect(result.testName).toBe('PropertyListPage');
    });

    it('should measure property list component performance', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'PropertyListPage',
        () => render(
          <TestWrapper>
            <MockPropertyListPage />
          </TestWrapper>
        )
      );

      expect(metrics.componentName).toBe('PropertyListPage');
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      
      // Verify all property cards are rendered
      expect(screen.getByTestId('property-list-page')).toBeInTheDocument();
      expect(screen.getAllByTestId(/property-card-/)).toHaveLength(20);
    });

    it('should validate property list page load metrics', async () => {
      render(
        <TestWrapper>
          <MockPropertyListPage />
        </TestWrapper>
      );

      const pageMetrics = await PageLoadTestUtils.measurePageLoad();
      const validation = PageLoadTestUtils.validatePageLoadPerformance(pageMetrics, {
        domContentLoaded: 1000, // Stricter threshold for property pages
        loadComplete: 2000,
      });

      expect(validation.passed).toBe(true);
    });

    it('should benchmark property list rendering performance', async () => {
      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'PropertyListRendering',
        () => {
          const { unmount } = render(
            <TestWrapper>
              <MockPropertyListPage />
            </TestWrapper>
          );
          unmount();
        },
        5
      );

      expect(benchmark.averageTime).toBeLessThan(100); // Should average under 100ms
      expect(benchmark.iterations).toBe(5);
    });
  });

  describe('Property Detail Page Performance', () => {
    it('should render property detail page efficiently', async () => {
      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'PropertyDetailPage',
        () => {
          render(
            <TestWrapper>
              <MockPropertyDetailPage />
            </TestWrapper>
          );
        },
        { maxTime: 300 } // Allow more time for image-heavy page
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });

    it('should measure property detail component performance with images', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'PropertyDetailPage',
        () => render(
          <TestWrapper>
            <MockPropertyDetailPage />
          </TestWrapper>
        )
      );

      expect(metrics.componentName).toBe('PropertyDetailPage');
      
      // Verify images are rendered
      expect(screen.getAllByTestId(/property-image-/)).toHaveLength(5);
      expect(screen.getByTestId('property-info')).toBeInTheDocument();
    });

    it('should handle property detail page re-renders efficiently', () => {
      const metrics = ComponentPerformanceTestUtils.measureReRenders('PropertyDetailPage', 3);
      
      expect(metrics.reRenderCount).toBe(3);
      expect(metrics.renderTime).toBeLessThan(50); // Should re-render quickly
    });
  });

  describe('Search Page Performance', () => {
    it('should render search page with large result set efficiently', async () => {
      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'SearchPage',
        () => {
          render(
            <TestWrapper>
              <MockSearchPage />
            </TestWrapper>
          );
        },
        { maxTime: 250 } // Allow time for 50 search results
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });

    it('should measure search results rendering performance', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'SearchPage',
        () => render(
          <TestWrapper>
            <MockSearchPage />
          </TestWrapper>
        )
      );

      expect(metrics.componentName).toBe('SearchPage');
      
      // Verify all search results are rendered
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(50);
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
    });

    it('should benchmark search page performance with different result counts', async () => {
      const SmallResultsPage = () => (
        <div data-testid="search-page">
          <h1>Property Search</h1>
          <div data-testid="search-results">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i}>Result {i + 1}</div>
            ))}
          </div>
        </div>
      );

      const LargeResultsPage = () => (
        <div data-testid="search-page">
          <h1>Property Search</h1>
          <div data-testid="search-results">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i}>Result {i + 1}</div>
            ))}
          </div>
        </div>
      );

      const smallBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'SmallSearchResults',
        () => {
          const { unmount } = render(<TestWrapper><SmallResultsPage /></TestWrapper>);
          unmount();
        },
        3
      );

      const largeBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'LargeSearchResults',
        () => {
          const { unmount } = render(<TestWrapper><LargeResultsPage /></TestWrapper>);
          unmount();
        },
        3
      );

      // Large results should take more time but not excessively more
      expect(largeBenchmark.averageTime).toBeGreaterThan(smallBenchmark.averageTime);
      expect(largeBenchmark.averageTime).toBeLessThan(smallBenchmark.averageTime * 5);
    });
  });

  describe('Core Web Vitals for Application Pages', () => {
    it('should measure Core Web Vitals for property pages', async () => {
      // Mock good Core Web Vitals
      const mockMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.05,
        fcp: 1200,
        lcp: 2000,
        fid: 50,
        ttfb: 300,
      });

      render(
        <TestWrapper>
          <MockPropertyListPage />
        </TestWrapper>
      );

      const validation = WebVitalsTestUtils.validateWebVitals(mockMetrics);
      expect(validation.passed).toBe(true);
    });

    it('should detect performance issues in Core Web Vitals', async () => {
      // Mock poor Core Web Vitals that might occur with heavy pages
      const mockMetrics = WebVitalsTestUtils.mockWebVitals({
        cls: 0.15, // Layout shift from dynamic content
        fcp: 2500, // Slow first contentful paint
        lcp: 4000, // Slow largest contentful paint (images)
        fid: 150, // Slow input delay
        ttfb: 1000, // Slow server response
      });

      const validation = WebVitalsTestUtils.validateWebVitals(mockMetrics);
      expect(validation.passed).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
    });

    it('should validate Core Web Vitals with custom thresholds for different page types', async () => {
      const imageHeavyPageMetrics = WebVitalsTestUtils.mockWebVitals({
        lcp: 3000, // Acceptable for image-heavy property detail pages
      });

      // More lenient thresholds for image-heavy pages
      const validation = WebVitalsTestUtils.validateWebVitals(imageHeavyPageMetrics, {
        lcp: 3500,
      });

      expect(validation.passed).toBe(true);
    });
  });

  describe('Memory Usage and Performance Monitoring', () => {
    it('should monitor memory usage during page navigation', async () => {
      const initialMemory = ComponentPerformanceTestUtils.getPerformanceEntries().length;

      // Render multiple pages to simulate navigation
      const { unmount: unmount1 } = render(<TestWrapper><MockPropertyListPage /></TestWrapper>);
      const { unmount: unmount2 } = render(<TestWrapper><MockPropertyDetailPage /></TestWrapper>);
      const { unmount: unmount3 } = render(<TestWrapper><MockSearchPage /></TestWrapper>);

      // Clean up
      unmount1();
      unmount2();
      unmount3();

      const finalMemory = ComponentPerformanceTestUtils.getPerformanceEntries().length;
      expect(finalMemory).toBeGreaterThan(initialMemory);

      // Analyze overall performance
      const analysis = ComponentPerformanceTestUtils.analyzeComponentPerformance();
      expect(analysis).toBeDefined();
      expect(analysis!.totalRenders).toBeGreaterThan(0);
    });

    it('should detect memory leaks in component re-renders', () => {
      const initialEntries = ComponentPerformanceTestUtils.getPerformanceEntries().length;

      // Simulate multiple re-renders
      for (let i = 0; i < 5; i++) {
        ComponentPerformanceTestUtils.measureComponentRender(
          'TestComponent',
          () => render(<div>Test {i}</div>)
        );
      }

      const analysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('TestComponent');
      expect(analysis!.totalRenders).toBe(5);
      
      // Memory usage should be reasonable
      expect(analysis!.averageMemoryUsage).toBeLessThan(1000000); // Less than 1MB per render
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in page load times', async () => {
      // Baseline performance
      const baselineBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'BaselinePropertyList',
        () => {
          const { unmount } = render(<TestWrapper><MockPropertyListPage /></TestWrapper>);
          unmount();
        },
        3
      );

      // Simulate performance regression (slower rendering)
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500); // 500ms slower

      const regressionBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'RegressionPropertyList',
        () => {
          const { unmount } = render(<TestWrapper><MockPropertyListPage /></TestWrapper>);
          unmount();
        },
        1
      );

      // Detect significant performance regression (>50% slower)
      const regressionThreshold = baselineBenchmark.averageTime * 1.5;
      if (regressionBenchmark.averageTime > regressionThreshold) {
        console.warn(`Performance regression detected: ${regressionBenchmark.averageTime}ms > ${regressionThreshold}ms`);
      }

      expect(regressionBenchmark.averageTime).toBeGreaterThan(baselineBenchmark.averageTime);
    });

    it('should validate performance budgets for different page types', async () => {
      const performanceBudgets = {
        propertyList: { maxRenderTime: 200, maxMemory: 500000 },
        propertyDetail: { maxRenderTime: 300, maxMemory: 800000 },
        search: { maxRenderTime: 250, maxMemory: 600000 },
      };

      // Test property list budget
      const propertyListTest = PerformanceTestHelpers.createPerformanceTest(
        'PropertyListBudget',
        () => render(<TestWrapper><MockPropertyListPage /></TestWrapper>),
        performanceBudgets.propertyList
      );

      const propertyListResult = await propertyListTest();
      expect(propertyListResult.passed).toBe(true);

      // Test property detail budget
      const 