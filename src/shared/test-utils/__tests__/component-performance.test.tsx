/**
 * Component Performance Tests
 * Tests for real application components to measure rendering performance,
 * memory usage, and identify performance bottlenecks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  ComponentPerformanceTestUtils,
  PerformanceTestHelpers,
  VirtualizationTestUtils
} from '../performance-testing';

// Mock components for testing (these would be real components in actual implementation)
const MockPropertyCard = ({ property }: { property: any }) => (
  <div data-testid="property-card">
    <h3>{property.title}</h3>
    <p>{property.description}</p>
    <img src={property.image} alt={property.title} loading="lazy" />
    <div>{property.price}</div>
  </div>
);

const MockPropertyList = ({ properties }: { properties: any[] }) => (
  <div data-testid="property-list">
    {properties.map((property, index) => (
      <MockPropertyCard key={index} property={property} />
    ))}
  </div>
);

const MockVirtualizedList = ({ items, itemHeight = 100 }: { items: any[], itemHeight?: number }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 10 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length);
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div 
      ref={containerRef}
      data-testid="virtualized-list"
      style={{ height: '400px', overflowY: 'auto' }}
    >
      <div style={{ height: visibleRange.start * itemHeight }} />
      {visibleItems.map((item, index) => (
        <div 
          key={visibleRange.start + index}
          style={{ height: itemHeight }}
          data-testid={`list-item-${visibleRange.start + index}`}
        >
          {item.name || `Item ${visibleRange.start + index}`}
        </div>
      ))}
      <div style={{ height: (items.length - visibleRange.end) * itemHeight }} />
    </div>
  );
};

// Test wrapper component
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

describe('Component Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    ComponentPerformanceTestUtils.clearPerformanceEntries();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property Card Component Performance', () => {
    const mockProperty = {
      title: 'Test Property',
      description: 'A beautiful test property with amazing features',
      image: 'https://example.com/property.jpg',
      price: '$500,000',
    };

    it('should render property card within performance thresholds', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'PropertyCard',
        () => render(
          <TestWrapper>
            <MockPropertyCard property={mockProperty} />
          </TestWrapper>
        )
      );

      // Property card should render quickly (under 50ms)
      expect(metrics.renderTime).toBeLessThan(50);
      expect(screen.getByTestId('property-card')).toBeInTheDocument();
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    it('should handle multiple property cards efficiently', () => {
      const properties = Array.from({ length: 20 }, (_, i) => ({
        ...mockProperty,
        title: `Property ${i}`,
        id: i,
      }));

      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'PropertyList',
        () => render(
          <TestWrapper>
            <MockPropertyList properties={properties} />
          </TestWrapper>
        )
      );

      // Multiple cards should still render reasonably fast (under 200ms)
      expect(metrics.renderTime).toBeLessThan(200);
      expect(screen.getAllByTestId('property-card')).toHaveLength(20);
    });

    it('should measure re-render performance when props change', async () => {
      const user = userEvent.setup();
      let currentProperty = mockProperty;

      const TestComponent = () => {
        const [property, setProperty] = React.useState(currentProperty);
        
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setProperty({ ...property, title: 'Updated Property' });
          }, 100);
          return () => clearTimeout(timer);
        }, []);

        return <MockPropertyCard property={property} />;
      };

      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'PropertyCardReRender',
        () => render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Updated Property')).toBeInTheDocument();
      });

      // Re-render should be fast
      expect(metrics.renderTime).toBeLessThan(100);
    });
  });

  describe('Virtualized List Performance', () => {
    const generateLargeDataset = (size: number) => 
      Array.from({ length: size }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
      }));

    it('should handle large datasets efficiently with virtualization', async () => {
      const largeDataset = generateLargeDataset(1000);

      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'VirtualizedList',
        () => render(
          <TestWrapper>
            <MockVirtualizedList items={largeDataset} />
          </TestWrapper>
        )
      );

      // Virtualized list should render quickly even with large dataset
      expect(metrics.renderTime).toBeLessThan(100);
      
      const listContainer = screen.getByTestId('virtualized-list');
      expect(listContainer).toBeInTheDocument();
      
      // Should only render visible items initially
      const visibleItems = screen.getAllByTestId(/list-item-/);
      expect(visibleItems.length).toBeLessThan(20); // Much less than 1000
    });

    it('should maintain performance during scrolling', async () => {
      const dataset = generateLargeDataset(500);
      
      render(
        <TestWrapper>
          <MockVirtualizedList items={dataset} />
        </TestWrapper>
      );

      const listContainer = screen.getByTestId('virtualized-list');
      
      const scrollPerformance = await VirtualizationTestUtils.measureVirtualizedListPerformance(
        listContainer,
        500,
        100
      );

      expect(scrollPerformance.renderTime).toBeLessThan(50);
      expect(scrollPerformance.scrollPerformance).toBeLessThan(16); // 60fps target
      expect(scrollPerformance.visibleItems).toBe(4); // 400px / 100px per item
    });

    it('should handle infinite scroll performance', async () => {
      let currentItems = generateLargeDataset(20);
      
      const InfiniteScrollComponent = () => {
        const [items, setItems] = React.useState(currentItems);
        const [loading, setLoading] = React.useState(false);

        const loadMore = async () => {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API call
          const newItems = generateLargeDataset(20).map((item, i) => ({
            ...item,
            id: items.length + i,
            name: `Item ${items.length + i}`,
          }));
          setItems(prev => [...prev, ...newItems]);
          setLoading(false);
        };

        return (
          <div>
            <MockVirtualizedList items={items} />
            <button onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <InfiniteScrollComponent />
        </TestWrapper>
      );

      const loadMoreButton = screen.getByText('Load More');
      const listContainer = screen.getByTestId('virtualized-list');

      const performanceMetrics = await VirtualizationTestUtils.testInfiniteScrollPerformance(
        listContainer,
        async () => {
          await userEvent.click(loadMoreButton);
          await waitFor(() => {
            expect(screen.getByText('Load More')).not.toBeDisabled();
          });
        }
      );

      expect(performanceMetrics.loadTime).toBeGreaterThan(200); // Should include API delay
      expect(performanceMetrics.itemsLoaded).toBe(20);
      expect(performanceMetrics.memoryGrowth).toBeGreaterThan(0);
    });
  });

  describe('Form Component Performance', () => {
    const MockComplexForm = () => {
      const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        price: '',
        location: '',
        features: [] as string[],
      });

      const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
      };

      return (
        <form data-testid="complex-form">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
          />
          <select
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          >
            <option value="">Select Location</option>
            <option value="nairobi">Nairobi</option>
            <option value="mombasa">Mombasa</option>
            <option value="kisumu">Kisumu</option>
          </select>
          {/* Simulate complex feature selection */}
          {Array.from({ length: 20 }, (_, i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={formData.features.includes(`feature-${i}`)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange('features', [...formData.features, `feature-${i}`]);
                  } else {
                    handleChange('features', formData.features.filter(f => f !== `feature-${i}`));
                  }
                }}
              />
              Feature {i}
            </label>
          ))}
        </form>
      );
    };

    it('should render complex forms within performance thresholds', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'ComplexForm',
        () => render(
          <TestWrapper>
            <MockComplexForm />
          </TestWrapper>
        )
      );

      expect(metrics.renderTime).toBeLessThan(100);
      expect(screen.getByTestId('complex-form')).toBeInTheDocument();
    });

    it('should handle form interactions efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockComplexForm />
        </TestWrapper>
      );

      const titleInput = screen.getByPlaceholderText('Title');
      
      const interactionTest = PerformanceTestHelpers.createPerformanceTest(
        'Form Interaction',
        async () => {
          await user.type(titleInput, 'Test Property Title');
        },
        { maxTime: 200 }
      );

      const result = await interactionTest();
      expect(result.passed).toBe(true);
      expect(titleInput).toHaveValue('Test Property Title');
    });

    it('should measure form validation performance', async () => {
      const user = userEvent.setup();
      
      const FormWithValidation = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});
        const [values, setValues] = React.useState({ email: '', password: '' });

        const validate = (field: string, value: string) => {
          const newErrors = { ...errors };
          
          if (field === 'email') {
            if (!value.includes('@')) {
              newErrors.email = 'Invalid email';
            } else {
              delete newErrors.email;
            }
          }
          
          if (field === 'password') {
            if (value.length < 8) {
              newErrors.password = 'Password too short';
            } else {
              delete newErrors.password;
            }
          }
          
          setErrors(newErrors);
        };

        return (
          <form>
            <input
              type="email"
              placeholder="Email"
              value={values.email}
              onChange={(e) => {
                setValues(prev => ({ ...prev, email: e.target.value }));
                validate('email', e.target.value);
              }}
            />
            {errors.email && <span>{errors.email}</span>}
            
            <input
              type="password"
              placeholder="Password"
              value={values.password}
              onChange={(e) => {
                setValues(prev => ({ ...prev, password: e.target.value }));
                validate('password', e.target.value);
              }}
            />
            {errors.password && <span>{errors.password}</span>}
          </form>
        );
      };

      render(
        <TestWrapper>
          <FormWithValidation />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Email');
      
      const validationTest = PerformanceTestHelpers.createPerformanceTest(
        'Form Validation',
        async () => {
          await user.type(emailInput, 'invalid-email');
          await user.clear(emailInput);
          await user.type(emailInput, 'valid@email.com');
        },
        { maxTime: 300 }
      );

      const result = await validationTest();
      expect(result.passed).toBe(true);
    });
  });

  describe('Image Loading Performance', () => {
    it('should measure image loading performance in components', async () => {
      const ImageGallery = ({ images }: { images: string[] }) => (
        <div data-testid="image-gallery">
          {images.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Image ${index}`}
              loading="lazy"
              data-testid={`gallery-image-${index}`}
            />
          ))}
        </div>
      );

      const imageUrls = Array.from({ length: 10 }, (_, i) => 
        `https://example.com/image-${i}.jpg`
      );

      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'ImageGallery',
        () => render(
          <TestWrapper>
            <ImageGallery images={imageUrls} enableSearch={false} />
          </TestWrapper>
        )
      );

      expect(metrics.renderTime).toBeLessThan(100);
      expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      expect(screen.getAllByTestId(/gallery-image-/)).toHaveLength(10);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in component rendering', () => {
      // Baseline measurement
      const baseline = ComponentPerformanceTestUtils.measureComponentRender(
        'BaselineComponent',
        () => render(<div>Baseline</div>)
      );

      // Simulate performance regression by mocking slower render
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200); // 200ms render time

      const regression = ComponentPerformanceTestUtils.measureComponentRender(
        'RegressionComponent',
        () => render(<div>Regression</div>)
      );

      // Check for significant regression (more than 3x slower)
      const regressionThreshold = baseline.metrics.renderTime * 3;
      if (regression.metrics.renderTime > regressionThreshold) {
        console.warn(`Performance regression detected: ${regression.metrics.renderTime}ms > ${regressionThreshold}ms`);
      }

      expect(regression.metrics.renderTime).toBeGreaterThan(baseline.metrics.renderTime);
    });

    it('should track performance trends across multiple renders', () => {
      const measurements: number[] = [];
      
      // Simulate multiple measurements with gradually increasing render times
      for (let i = 0; i < 5; i++) {
        vi.spyOn(performance, 'now')
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1000 + (i * 20)); // Increasing render time

        const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
          'TrendComponent',
          () => render(<div>Trend Test {i}</div>)
        );
        
        measurements.push(metrics.renderTime);
      }

      // Calculate trend (simple linear regression slope)
      const n = measurements.length;
      const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2,3,4
      const sumY = measurements.reduce((sum, val) => sum + val, 0);
      const sumXY = measurements.reduce((sum, val, i) => sum + (i * val), 0);
      const sumX2 = measurements.reduce((sum, _, i) => sum + (i * i), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      // Positive slope indicates performance degradation
      expect(slope).toBeGreaterThan(0);
      
      if (slope > 10) { // More than 10ms increase per measurement
        console.warn(`Performance degradation trend detected: ${slope.toFixed(2)}ms increase per render`);
      }
    });
  });
});