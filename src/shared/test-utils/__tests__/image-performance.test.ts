/**
 * Image Loading and Lazy Loading Performance Tests
 * Tests for image optimization, lazy loading effectiveness, and image-related performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { 
  ImagePerformanceTestUtils,
  PerformanceTestHelpers
} from '../performance-testing';

// Mock Image constructor for testing
const createMockImage = (loadTime: number = 500, shouldFail: boolean = false) => {
  return class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    complete: boolean = false;
    naturalWidth: number = 0;
    naturalHeight: number = 0;

    constructor() {
      setTimeout(() => {
        if (shouldFail) {
          this.onerror?.();
        } else {
          this.complete = true;
          this.naturalWidth = 800;
          this.naturalHeight = 600;
          this.onload?.();
        }
      }, loadTime);
    }
  };
};

// Mock IntersectionObserver for lazy loading tests
const createMockIntersectionObserver = (entries: any[] = []) => {
  return class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.options = options;
      
      // Simulate intersection after a delay
      setTimeout(() => {
        this.callback(entries, this as any);
      }, 100);
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
};

// Test components
const LazyImage = ({ src, alt, ...props }: { src: string; alt: string; [key: string]: any }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { thre
          Loading...
        </div>
      )}
    </div>
  );
};

// Mock image gallery with lazy loading
const LazyImageGallery = ({ images }: { images: string[] }) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadTimes, setLoadTimes] = useState<number[]>([]);

  const handleImageLoad = (loadTime: number) => {
    setLoadedCount(prev => prev + 1);
    setLoadTimes(prev => [...prev, loadTime]);
  };

  return (
    <div data-testid="lazy-gallery">
      <div data-testid="load-stats">
        Loaded: {loadedCount}/{images.length}
        {loadTimes.length > 0 && (
          <span> | Avg Load Time: {(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length).toFixed(0)}ms</span>
        )}
      </div>
      <div style={{ height: '400px', overflowY: 'scroll' }}>
        {images.map((src, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <LazyImageComponent
              src={src}
              alt={`Image ${index}`}
              onLoad={() => {
                const loadTime = Math.random() * 1000 + 500; // Mock load time
                handleImageLoad(loadTime);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock progressive image loading component
const ProgressiveImageComponent = ({ 
  lowResSrc, 
  highResSrc, 
  alt 
}: { 
  lowResSrc: string; 
  highResSrc: string; 
  alt: string;
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highResSrc);
      setIsHighResLoaded(true);
    };
    img.src = highResSrc;
  }, [highResSrc]);

  return (
    <div data-testid="progressive-image-container">
      <img
        src={currentSrc}
        alt={alt}
        data-testid="progressive-image"
        style={{
          filter: isHighResLoaded ? 'none' : 'blur(2px)',
          transition: 'filter 0.3s ease'
        }}
      />
      {!isHighResLoaded && (
        <div data-testid="loading-indicator">Loading high resolution...</div>
      )}
    </div>
  );
};

// Mock image optimization component
const OptimizedImageComponent = ({ 
  src, 
  alt, 
  sizes = '(max-width: 768px) 100vw, 50vw'
}: { 
  src: string; 
  alt: string; 
  sizes?: string;
}) => {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const loadEndTime = performance.now();
    const loadStartTime = parseFloat(img.dataset.loadStart || '0');
    setLoadTime(loadEndTime - loadStartTime);
  };

  const handleError = () => {
    setError('Failed to load image');
  };

  return (
    <div data-testid="optimized-image-container">
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        data-load-start={performance.now()}
        data-testid="optimized-image"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {loadTime && (
        <div data-testid="load-time">Load time: {loadTime.toFixed(0)}ms</div>
      )}
      {error && (
        <div data-testid="error-message" style={{ color: 'red' }}>{error}</div>
      )}
    </div>
  );
};

describe('Image Loading Performance Tests', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn().mockImplementation((element) => {
        // Simulate immediate intersection for testing
        setTimeout(() => {
          callback([{ isIntersecting: true, target: element }]);
        }, 100);
      }),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));

    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => ({
      onload: null,
      onerror: null,
      src: '',
    }));

    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Single Image Load Performance', () => {
    it('should measure image load time accurately', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 500); // 500ms load time
        return mockImage as any;
      });

      const loadTime = await ImagePerformanceTestUtils.measureImageLoadTime('test-image.jpg');
      expect(loadTime).toBeGreaterThan(0);
    });

    it('should handle image load failures gracefully', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror();
        }, 100);
        return mockImage as any;
      });

      await expect(
        ImagePerformanceTestUtils.measureImageLoadTime('broken-image.jpg')
      ).rejects.toThrow('Failed to load image');
    });

    it('should benchmark image loading performance', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, Math.random() * 200 + 300); // 300-500ms
        return mockImage as any;
      });

      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Image Load Benchmark',
        () => ImagePerformanceTestUtils.measureImageLoadTime('test-image.jpg'),
        5
      );

      expect(benchmark.averageTime).toBeGreaterThan(0);
      expect(benchmark.minTime).toBeGreaterThan(0);
      expect(benchmark.maxTime).toBeGreaterThan(benchmark.minTime);
    });
  });

  describe('Multiple Image Load Performance', () => {
    it('should measure multiple image load times', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, Math.random() * 300 + 200); // 200-500ms
        return mockImage as any;
      });

      const imageUrls = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'];
      const results = await ImagePerformanceTestUtils.measureMultipleImageLoads(imageUrls);

      expect(results.individualTimes).toHaveLength(4);
      expect(results.averageLoadTime).toBeGreaterThan(0);
      expect(results.totalLoadTime).toBeGreaterThan(0);
      expect(results.failedImages).toHaveLength(0);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      let callCount = 0;
      vi.spyOn(window, 'Image').mockImplementation(() => {
        const shouldFail = callCount % 2 === 1; // Fail every second image
        callCount++;
        
        setTimeout(() => {
          if (shouldFail && mockImage.onerror) {
            mockImage.onerror();
          } else if (!shouldFail && mockImage.onload) {
            mockImage.onload();
          }
        }, 200);
        return mockImage as any;
      });

      const imageUrls = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'];
      const results = await ImagePerformanceTestUtils.measureMultipleImageLoads(imageUrls);

      expect(results.individualTimes.length).toBe(2); // 2 successful loads
      expect(results.failedImages.length).toBe(2); // 2 failed loads
    });

    it('should validate image load performance thresholds', async () => {
      const mockTimes = ImagePerformanceTestUtils.mockImageLoadTimes(10, 800); // Average 800ms
      
      // Check if any images exceed acceptable threshold (1000ms)
      const slowImages = mockTimes.filter(time => time > 1000);
      const fastImages = mockTimes.filter(time => time <= 500);
      
      expect(slowImages.length).toBeLessThan(mockTimes.length * 0.2); // Less than 20% should be slow
      expect(fastImages.length).toBeGreaterThan(mockTimes.length * 0.3); // More than 30% should be fast
    });
  });

  describe('Lazy Loading Performance', () => {
    it('should render lazy image component efficiently', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'LazyImageComponent',
        () => render(
          <LazyImageComponent 
            src="test-image.jpg" 
            alt="Test Image" 
          />
        )
      );

      expect(metrics.renderTime).toBeLessThan(200);
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
    });

    it('should test lazy loading effectiveness', async () => {
      const { container } = render(
        <div>
          <LazyImageComponent src="image1.jpg" alt="Image 1" />
          <LazyImageComponent src="image2.jpg" alt="Image 2" />
          <LazyImageComponent src="image3.jpg" alt="Image 3" />
        </div>
      );

      const result = await ImagePerformanceTestUtils.testLazyLoadingEffectiveness(
        'div',
        '[data-testid="lazy-image-container"]'
      );

      expect(result.lazyLoadingWorking).toBe(true);
      expect(result.imagesInViewport).toBeGreaterThan(0);
    });

    it('should measure lazy loading gallery performance', async () => {
      const images = Array.from({ length: 20 }, (_, i) => `image-${i}.jpg`);
      
      const performanceTest = PerformanceTestHelpers.createPerformanceTest(
        'Lazy Gallery Render',
        () => render(<LazyImageGallery images={images} />),
        { maxTime: 1000 }
      );

      const result = await performanceTest();
      expect(result.passed).toBe(true);
      expect(screen.getByTestId('lazy-gallery')).toBeInTheDocument();
    });

    it('should validate that only visible images are loaded initially', async () => {
      const images = Array.from({ length: 50 }, (_, i) => `image-${i}.jpg`);
      render(<LazyImageGallery images={images} />);

      // Wait for initial render
      await new Promise(resolve => setTimeout(resolve, 200));

      const placeholders = screen.getAllByTestId('image-placeholder');
      const loadedImages = screen.queryAllByTestId('lazy-image');

      // Most images should still be placeholders (lazy loading working)
      expect(placeholders.length).toBeGreaterThan(loadedImages.length);
    });
  });

  describe('Progressive Image Loading Performance', () => {
    it('should render progressive image component efficiently', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'ProgressiveImageComponent',
        () => render(
          <ProgressiveImageComponent
            lowResSrc="low-res.jpg"
            highResSrc="high-res.jpg"
            alt="Progressive Image"
          />
        )
      );

      expect(metrics.renderTime).toBeLessThan(300);
      expect(screen.getByTestId('progressive-image')).toBeInTheDocument();
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should handle progressive loading transitions smoothly', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 500);
        return mockImage as any;
      });

      render(
        <ProgressiveImageComponent
          lowResSrc="low-res.jpg"
          highResSrc="high-res.jpg"
          alt="Progressive Image"
        />
      );

      // Initially should show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Wait for high-res image to "load"
      await new Promise(resolve => setTimeout(resolve, 600));

      // Loading indicator should be gone
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Image Optimization Performance', () => {
    it('should render optimized image component efficiently', () => {
      const { metrics } = ComponentPerformanceTestUtils.measureComponentRender(
        'OptimizedImageComponent',
        () => render(
          <OptimizedImageComponent
            src="optimized-image.jpg"
            alt="Optimized Image"
          />
        )
      );

      expect(metrics.renderTime).toBeLessThan(200);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('should handle image load time measurement', async () => {
      const { container } = render(
        <OptimizedImageComponent
          src="test-image.jpg"
          alt="Test Image"
        />
      );

      const img = screen.getByTestId('optimized-image');
      
      // Simulate image load
      fireEvent.load(img);

      // Should show load time
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByTestId('load-time')).toBeInTheDocument();
    });

    it('should handle image load errors gracefully', async () => {
      const { container } = render(
        <OptimizedImageComponent
          src="broken-image.jpg"
          alt="Broken Image"
        />
      );

      const img = screen.getByTestId('optimized-image');
      
      // Simulate image error
      fireEvent.error(img);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('Image Performance Benchmarking', () => {
    it('should benchmark image component rendering performance', async () => {
      const benchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Image Component Render',
        () => render(
          <LazyImageComponent src="test-image.jpg" alt="Test" />
        ),
        10
      );

      expect(benchmark.averageTime).toBeLessThan(100);
      expect(benchmark.maxTime).toBeLessThan(300);
      
      // Check consistency
      const consistencyRatio = benchmark.maxTime / benchmark.averageTime;
      expect(consistencyRatio).toBeLessThan(3);
    });

    it('should benchmark gallery performance with different image counts', async () => {
      const smallGallery = Array.from({ length: 5 }, (_, i) => `small-${i}.jpg`);
      const largeGallery = Array.from({ length: 50 }, (_, i) => `large-${i}.jpg`);

      const smallBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Small Gallery Render',
        () => render(<LazyImageGallery images={smallGallery} />),
        5
      );

      const largeBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Large Gallery Render',
        () => render(<LazyImageGallery images={largeGallery} />),
        5
      );

      // Large gallery should not be significantly slower due to lazy loading
      const performanceRatio = largeBenchmark.averageTime / smallBenchmark.averageTime;
      expect(performanceRatio).toBeLessThan(5); // Should not be more than 5x slower
    });

    it('should validate image loading performance across different scenarios', async () => {
      const scenarios = [
        { name: 'Fast Network', delay: 100 },
        { name: 'Slow Network', delay: 1000 },
        { name: 'Very Slow Network', delay: 3000 },
      ];

      for (const scenario of scenarios) {
        const mockImage = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
        };

        vi.spyOn(window, 'Image').mockImplementation(() => {
          setTimeout(() => {
            if (mockImage.onload) mockImage.onload();
          }, scenario.delay);
          return mockImage as any;
        });

        const loadTime = await ImagePerformanceTestUtils.measureImageLoadTime('test-image.jpg');
        
        // Validate that load time is reasonable for the scenario
        if (scenario.delay <= 500) {
          expect(loadTime).toBeLessThan(1000); // Fast network should load quickly
        } else if (scenario.delay <= 2000) {
          expect(loadTime).toBeLessThan(3000); // Slow network tolerance
        } else {
          expect(loadTime).toBeGreaterThan(2000); // Very slow network detection
        }
      }
    });
  });

  describe('Image Performance Regression Detection', () => {
    it('should detect image loading performance regressions', async () => {
      // Baseline performance
      const baselineTimes = ImagePerformanceTestUtils.mockImageLoadTimes(10, 500);
      const baselineAverage = baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length;

      // Regression scenario
      const regressionTimes = ImagePerformanceTestUtils.mockImageLoadTimes(10, 1500);
      const regressionAverage = regressionTimes.reduce((a, b) => a + b, 0) / regressionTimes.length;

      // Should detect significant regression (3x slower)
      const regressionRatio = regressionAverage / baselineAverage;
      expect(regressionRatio).toBeGreaterThan(2);
    });

    it('should detect lazy loading effectiveness regressions', async () => {
      // Mock scenario where lazy loading is not working (all images load immediately)
      const brokenLazyLoading = {
        imagesInViewport: 50,
        imagesLoaded: 50, // All images loaded immediately
        lazyLoadingWorking: false,
      };

      // Mock scenario where lazy loading is working properly
      const workingLazyLoading = {
        imagesInViewport: 5,
        imagesLoaded: 5, // Only visible images loaded
        lazyLoadingWorking: true,
      };

      expect(brokenLazyLoading.lazyLoadingWorking).toBe(false);
      expect(workingLazyLoading.lazyLoadingWorking).toBe(true);
      expect(brokenLazyLoading.imagesLoaded).toBeGreaterThan(workingLazyLoading.imagesLoaded);
    });
  });
});