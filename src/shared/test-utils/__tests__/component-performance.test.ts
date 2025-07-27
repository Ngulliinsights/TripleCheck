/**
 * Component Performance Tests
 * Tests for measuring and validating component rendering performance,
 * memory usage, and re-render optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState, useEffect, useMemo } from 'react';
import { 
  ComponentPerformanceTestUtils,
  PerformanceTestHelpers 
} from '../performance-testing';

// Mock heavy computation component
const HeavyComputationComponent = ({ data }: { data: number[] }) => {
  const expensiveCalculation = useMemo(() => {
    // Simulate expensive calculation
    return data.reduce((sum, num) => {
      for (let i = 0; i < 1000; i++) {
        sum += Math.sqrt(num * i);
      }
      return sum;
    }, 0);
  }, [data]);

  return (
    <div data-testid="heavy-component">
      Result: {expensiveCalculation.toFixed(2)}
    </div>
  );
};

// Mock list component with many items
const LargeListComponent = ({ items }: { items: string[] }) => {
  return (
    <div data-testid="large-list">
      {items.map((item, index) => (
        <div key={index} className="list-item">
          {item}
        </div>
      ))}
    </div>
  );
};

// Mock component with frequent re-renders
const FrequentReRenderComponent = () => {
  const [count, setCount] = useState(0);
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div data-testid="frequent-rerender">
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <div>Timestamp: {timestamp}</div>
    </div>
  );
};

// Mock image gallery component
const ImageGalleryComponent = ({ images }: { images: string[] }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => new Set([...prev, src]));
  };

  return (
    <div data-testid="image-gallery">
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Image ${index}`}
          onLoad={() => handleImageLoad(src)}
          style={{ width: '200px', height: '150px' }}
        />
      ))}
      <div>Loaded: {loadedImages.size}/{images.length}</div>
    </div>
  );
};

// Mock form component with validation
const ComplexFormComponent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Invalid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!/^\d{10}$/.test(value)) {
          newErrors.phone = 'Invalid phone';
        } else {
          delete newErrors.phone;
        }
        break;
      default:
        if (!value.trim()) {
          newErrors[name] = 'Required field';
        } else {
          delete newErrors[name];
        }
    }
    
    setErrors(newErrors);
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  return (
    <form data-testid="complex-form">
      {Object.keys(formData).map(field => (
        <div key={field}>
          <input
            type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
            placeholder={field}
            value={formData[field as keyof typeof formData]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
          {errors[field] && <span className="error">{errors[field]}</span>}
        </div>
      ))}
    </form>
  );
};

describe('Component Performance Tests', () => {
  beforeEach(() => {
    ComponentPerformanceTestUtils.clearPerformanceEntries();
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Heavy Computation Component Performance', () => {
    it('should render heavy computation component within time threshold', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) => i);
      
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'HeavyComputationComponent',
        () => render(<HeavyComputationComponent data={largeDataSet} />)
      );

      expect(metrics.renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(metrics.componentName).toBe('HeavyComputationComponent');
    });

    it('should optimize re-renders with memoization', () => {
      const data = [1, 2, 3, 4, 5];
      
      // First render
      const { rerender } = render(<HeavyComputationComponent data={data} />);
      
      // Measure re-render with same data (should be fast due to memoization)
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'HeavyComputationComponent-Rerender',
        () => rerender(<HeavyComputationComponent data={data} />)
      );

      expect(metrics.renderTime).toBeLessThan(100); // Re-render should be much faster
    });

    it('should benchmark heavy computation performance', async () => {
      const data = Array.from({ length: 50 }, (_, i) => i);
      
      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Heavy Computation Render',
        () => render(<HeavyComputationComponent data={data} />),
        5
      );

      expect(benchmark.averageTime).toBeLessThan(500);
      expect(benchmark.maxTime).toBeLessThan(1000);
      
      // Check consistency
      const consistencyRatio = benchmark.maxTime / benchmark.averageTime;
      expect(consistencyRatio).toBeLessThan(2);
    });
  });

  describe('Large List Component Performance', () => {
    it('should render large list efficiently', () => {
      const largeItemList = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'LargeListComponent',
        () => render(<LargeListComponent items={largeItemList} />)
      );

      expect(metrics.renderTime).toBeLessThan(2000); // Should render 1000 items within 2 seconds
      expect(screen.getByTestId('large-list')).toBeInTheDocument();
    });

    it('should handle list updates efficiently', () => {
      const initialItems = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { rerender } = render(<LargeListComponent items={initialItems} />);
      
      // Add more items
      const updatedItems = [...initialItems, ...Array.from({ length: 50 }, (_, i) => `New Item ${i}`)];
      
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'LargeListComponent-Update',
        () => rerender(<LargeListComponent items={updatedItems} />)
      );

      expect(metrics.renderTime).toBeLessThan(500); // Update should be fast
    });

    it('should measure memory usage for large lists', () => {
      const veryLargeList = Array.from({ length: 5000 }, (_, i) => `Item ${i}`);
      
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'VeryLargeListComponent',
        () => render(<LargeListComponent items={veryLargeList} />)
      );

      // Memory usage should be reasonable (less than 10MB for 5000 items)
      expect(metrics.memoryUsage).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Frequent Re-render Component Performance', () => {
    it('should handle frequent re-renders efficiently', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'FrequentReRenderComponent',
        () => render(<FrequentReRenderComponent />)
      );

      expect(metrics.renderTime).toBeLessThan(200); // Initial render should be fast
    });

    it('should measure re-render performance', () => {
      const metrics = ComponentPerformanceTestUtils.measureReRenders(
        'FrequentReRenderComponent',
        10
      );

      expect(metrics.averageRenderTime).toBeLessThan(50); // Each re-render should be under 50ms
      expect(metrics.reRenderCount).toBe(10);
    });

    it('should test user interaction performance', async () => {
      const { container } = render(<FrequentReRenderComponent />);
      const button = screen.getByRole('button');

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Button Click Performance',
        () => {
          fireEvent.click(button);
        },
        { maxTime: 100 } // Click should respond within 100ms
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });
  });

  describe('Image Gallery Component Performance', () => {
    it('should render image gallery efficiently', () => {
      const imageUrls = Array.from({ length: 20 }, (_, i) => `image-${i}.jpg`);
      
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'ImageGalleryComponent',
        () => render(<ImageGalleryComponent images={imageUrls} />)
      );

      expect(metrics.renderTime).toBeLessThan(500); // Should render quickly
      expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
    });

    it('should handle image loading state updates efficiently', async () => {
      const imageUrls = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { container } = render(<ImageGalleryComponent images={imageUrls} />);
      
      const images = container.querySelectorAll('img');
      
      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Image Load State Update',
        () => {
          // Simulate image load
          fireEvent.load(images[0]);
        },
        { maxTime: 50 } // State update should be very fast
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });
  });

  describe('Complex Form Component Performance', () => {
    it('should render complex form efficiently', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'ComplexFormComponent',
        () => render(<ComplexFormComponent />)
      );

      expect(metrics.renderTime).toBeLessThan(300);
      expect(screen.getByTestId('complex-form')).toBeInTheDocument();
    });

    it('should handle form input changes efficiently', async () => {
      const { container } = render(<ComplexFormComponent />);
      const nameInput = container.querySelector('input[placeholder="name"]') as HTMLInputElement;

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Form Input Change',
        () => {
          fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        },
        { maxTime: 100 } // Input change should be very responsive
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });

    it('should handle validation efficiently', async () => {
      const { container } = render(<ComplexFormComponent />);
      const emailInput = container.querySelector('input[placeholder="email"]') as HTMLInputElement;

      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Form Validation',
        () => {
          fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        },
        { maxTime: 50 } // Validation should be instant
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
    });

    it('should benchmark form performance across multiple interactions', async () => {
      const { container } = render(<ComplexFormComponent />);
      const inputs = container.querySelectorAll('input');

      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Form Interaction Benchmark',
        () => {
          inputs.forEach((input, index) => {
            fireEvent.change(input, { target: { value: `test-value-${index}` } });
          });
        },
        5
      );

      expect(benchmark.averageTime).toBeLessThan(200); // All form interactions under 200ms
      expect(benchmark.maxTime).toBeLessThan(400);
    });
  });

  describe('Component Performance Analysis', () => {
    it('should analyze component performance across multiple renders', () => {
      // Generate performance data for multiple components
      ComponentPerformanceTestUtils.measureComponentRender('ComponentA', () => render(<div>A</div>));
      ComponentPerformanceTestUtils.measureComponentRender('ComponentA', () => render(<div>A</div>));
      ComponentPerformanceTestUtils.measureComponentRender('ComponentB', () => render(<div>B</div>));

      const analysisA = ComponentPerformanceTestUtils.analyzeComponentPerformance('ComponentA');
      const analysisAll = ComponentPerformanceTestUtils.analyzeComponentPerformance();

      expect(analysisA).toBeDefined();
      expect(analysisA!.totalRenders).toBe(2);
      expect(analysisA!.componentName).toBe('ComponentA');

      expect(analysisAll).toBeDefined();
      expect(analysisAll!.totalRenders).toBe(3);
      expect(analysisAll!.componentName).toBe('All Components');
    });

    it('should identify performance bottlenecks', () => {
      // Simulate slow component
      const slowRender = () => {
        const start = performance.now();
        while (performance.now() - start < 100) {
          // Simulate slow work
        }
        return render(<div>Slow Component</div>);
      };

      ComponentPerformanceTestUtils.measureComponentRender('SlowComponent', slowRender);
      ComponentPerformanceTestUtils.measureComponentRender('FastComponent', () => render(<div>Fast</div>));

      const slowAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('SlowComponent');
      const fastAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('FastComponent');

      expect(slowAnalysis!.averageRenderTime).toBeGreaterThan(fastAnalysis!.averageRenderTime);
    });

    it('should track memory usage patterns', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => i);
      
      ComponentPerformanceTestUtils.measureComponentRender(
        'MemoryIntensiveComponent',
        () => render(<HeavyComputationComponent data={largeData} />)
      );

      const analysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('MemoryIntensiveComponent');
      
      expect(analysis).toBeDefined();
      expect(analysis!.averageMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(analysis!.totalMemoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect render time regressions', () => {
      // Baseline performance
      ComponentPerformanceTestUtils.measureComponentRender(
        'BaselineComponent',
        () => render(<div>Baseline</div>)
      );

      // Simulate regression (slower render)
      const slowRender = () => {
        const start = performance.now();
        while (performance.now() - start < 200) {
          // Simulate regression
        }
        return render(<div>Regressed</div>);
      };

      ComponentPerformanceTestUtils.measureComponentRender('RegressedComponent', slowRender);

      const baselineAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('BaselineComponent');
      const regressedAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('RegressedComponent');

      expect(regressedAnalysis!.averageRenderTime).toBeGreaterThan(baselineAnalysis!.averageRenderTime);
    });

    it('should detect memory usage regressions', () => {
      const smallData = [1, 2, 3];
      const largeData = Array.from({ length: 1000 }, (_, i) => i);

      ComponentPerformanceTestUtils.measureComponentRender(
        'SmallDataComponent',
        () => render(<HeavyComputationComponent data={smallData} />)
      );

      ComponentPerformanceTestUtils.measureComponentRender(
        'LargeDataComponent',
        () => render(<HeavyComputationComponent data={largeData} />)
      );

      const smallAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('SmallDataComponent');
      const largeAnalysis = ComponentPerformanceTestUtils.analyzeComponentPerformance('LargeDataComponent');

      expect(largeAnalysis!.averageMemoryUsage).toBeGreaterThan(smallAnalysis!.averageMemoryUsage);
    });
  });
});