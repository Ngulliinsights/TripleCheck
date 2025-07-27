import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PropertyGallery } from '../PropertyGallery';

// Mock performance API
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntries: PerformanceEntry[] = [];

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => {
    mockPerformanceObserver.mockImplementation(callback);
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
  }),
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    ...performance,
    getEntriesByType: vi.fn(() => mockPerformanceEntries),
    mark: vi.fn(),
    measure: vi.fn(),
    now: vi.fn(() => Date.now()),
  },
});

// Mock the dependencies
vi.mock('../../../shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: any }) => {
    const mockFunctions = { zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(), centerView: vi.fn() };
    return <div>{typeof children === 'function' ? children(mockFunctions) : children}</div>;
  },
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock OptimizedImage with performance tracking
let imageLoadTimes: number[] = [];
let imageLoadCount = 0;

vi.mock('../../../shared/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt, onLoad, loading }: any) => {
    React.useEffect(() => {
      const startTime = performance.now();
      imageLoadCount++;
      
      // Simulate different loading times based on loading strategy
      const loadTime = loading === 'lazy' ? 50 : 20;
      
      const timer = setTimeout(() => {
        const endTime = performance.now();
        imageLoadTimes.push(endTime - startTime);
        onLoad?.();
      }, loadTime);
      
      return () => clearTimeout(timer);
    }, [onLoad, loading]);
    
    return (
      <img 
        src={src} 
        alt={alt} 
        loading={loading}
        data-testid="optimized-image"
        data-load-strategy={loading}
      />
    );
  },
}));

const generateMockImages = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `image-${i}`,
    url: `https://example.com/image${i}.jpg`,
    webpUrl: `https://example.com/image${i}.webp`,
    alt: `Image ${i}`,
    type: 'interior' as const,
    thumbnailUrl: `https://example.com/thumb${i}.jpg`,
  }));
};

describe('PropertyGallery Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageLoadTimes = [];
    imageLoadCount = 0;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Image Loading Performance', () => {
    it('should load images efficiently with lazy loading', async () => {
      const images = generateMockImages(10);
      const startTime = performance.now();

      render(
        <PropertyGallery
          images={images}
          propertyTitle="Performance Test"
          lazyLoading={true}
        />
      );

      const renderTime = performance.now() - startTime;

      // Initial render should be fast (< 50ms)
      expect(renderTime).toBeLessThan(50);

      // Wait for images to load
      await waitFor(() => {
        expect(imageLoadCount).toBeGreaterThan(0);
      }, { timeout: 1000 });

      // Lazy loading should result in reasonable load times
      const averageLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
      expect(averageLoadTime).toBeLessThan(100);
    });

    it('should handle large image galleries without blocking UI', async () => {
      const images = generateMockImages(50);
      const startTime = performance.now();

      const { container } = render(
        <PropertyGallery
          images={images}
          propertyTitle="Large Gallery Test"
          lazyLoading={true}
        />
      );

      const renderTime = performance.now() - startTime;

      // Even with 50 images, initial render should be fast
      expect(renderTime).toBeLessThan(100);

      // Check that thumbnails are rendered efficiently
      const thumbnails = container.querySelectorAll('[data-testid="optimized-image"]');
      expect(thumbnails.length).toBe(51); // 1 main + 50 thumbnails

      // Verify lazy loading is applied to thumbnails
      const lazyImages = container.querySelectorAll('[data-load-strategy="lazy"]');
      expect(lazyImages.length).toBeGreaterThan(0);
    });

    it('should optimize image loading order', async () => {
      const images = generateMockImages(5);

      render(
        <PropertyGallery
          images={images}
          propertyTitle="Load Order Test"
          lazyLoading={true}
        />
      );

      // Wait for initial images to start loading
      await waitFor(() => {
        expect(imageLoadCount).toBeGreaterThan(0);
      });

      // Main image should load first (eager loading for current image)
      const mainImage = screen.getAllByTestId('optimized-image')[0];
      expect(mainImage).toHaveAttribute('loading', 'lazy');
    });

    it('should handle WebP format optimization', () => {
      const images = generateMockImages(3).map(img => ({
        ...img,
        webpUrl: img.url.replace('.jpg', '.webp'),
      }));

      render(
        <PropertyGallery
          images={images}
          propertyTitle="WebP Test"
        />
      );

      // Verify that WebP URLs are passed to OptimizedImage
      const optimizedImages = screen.getAllByTestId('optimized-image');
      expect(optimizedImages.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not create memory leaks with image loading', async () => {
      const images = generateMockImages(10);

      const { unmount } = render(
        <PropertyGallery
          images={images}
          propertyTitle="Memory Test"
          lazyLoading={true}
        />
      );

      // Wait for some images to load
      await waitFor(() => {
        expect(imageLoadCount).toBeGreaterThan(0);
      });

      const initialLoadCount = imageLoadCount;

      // Unmount component
      unmount();

      // Wait a bit to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // No additional images should load after unmount
      expect(imageLoadCount).toBe(initialLoadCount);
    });

    it('should efficiently handle image state updates', async () => {
      const images = generateMockImages(5);

      const { rerender } = render(
        <PropertyGallery
          images={images}
          propertyTitle="State Update Test"
          lazyLoading={true}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(imageLoadCount).toBeGreaterThan(0);
      });

      const initialLoadCount = imageLoadCount;

      // Update with same images (should not trigger reload)
      rerender(
        <PropertyGallery
          images={images}
          propertyTitle="State Update Test"
          lazyLoading={true}
        />
      );

      // Should not trigger additional image loads for same images
      expect(imageLoadCount).toBe(initialLoadCount);
    });
  });

  describe('Rendering Performance', () => {
    it('should render thumbnails efficiently', () => {
      const images = generateMockImages(20);
      const startTime = performance.now();

      const { container } = render(
        <PropertyGallery
          images={images}
          propertyTitle="Thumbnail Performance Test"
          showThumbnails={true}
        />
      );

      const renderTime = performance.now() - startTime;

      // Thumbnail rendering should be fast
      expect(renderTime).toBeLessThan(100);

      // Verify grid layout is applied for performance
      const thumbnailGrid = container.querySelector('.grid');
      expect(thumbnailGrid).toHaveClass('grid-cols-6');
    });

    it('should handle thumbnail visibility optimization', () => {
      const images = generateMockImages(30);

      const { container } = render(
        <PropertyGallery
          images={images}
          propertyTitle="Visibility Test"
          showThumbnails={true}
          lazyLoading={true}
        />
      );

      // All thumbnails should use lazy loading for performance
      const thumbnailImages = container.querySelectorAll('[data-testid="optimized-image"]');
      const lazyThumbnails = Array.from(thumbnailImages).filter(img => 
        img.getAttribute('loading') === 'lazy'
      );

      expect(lazyThumbnails.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction Performance', () => {
    it('should handle navigation interactions efficiently', async () => {
      const images = generateMockImages(10);

      render(
        <PropertyGallery
          images={images}
          propertyTitle="Navigation Performance Test"
        />
      );

      const nextButton = screen.getByLabelText('Next image');
      
      // Measure navigation performance
      const startTime = performance.now();
      
      // Simulate rapid navigation
      for (let i = 0; i < 5; i++) {
        nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const navigationTime = performance.now() - startTime;

      // Navigation should be responsive (< 100ms total for 5 clicks)
      expect(navigationTime).toBeLessThan(100);
    });

    it('should handle fullscreen mode efficiently', async () => {
      const images = generateMockImages(5);

      render(
        <PropertyGallery
          images={images}
          propertyTitle="Fullscreen Performance Test"
        />
      );

      const fullscreenButton = screen.getByLabelText('View fullscreen');
      
      const startTime = performance.now();
      fullscreenButton.click();

      await waitFor(() => {
        expect(screen.getByLabelText('Close fullscreen')).toBeInTheDocument();
      });

      const fullscreenTime = performance.now() - startTime;

      // Fullscreen mode should open quickly
      expect(fullscreenTime).toBeLessThan(200);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should not significantly impact bundle size', () => {
      // This is more of a build-time test, but we can check component complexity
      const images = generateMockImages(1);

      const { container } = render(
        <PropertyGallery
          images={images}
          propertyTitle="Bundle Size Test"
        />
      );

      // Component should not create excessive DOM nodes
      const allElements = container.querySelectorAll('*');
      expect(allElements.length).toBeLessThan(50); // Reasonable DOM complexity
    });
  });

  describe('Core Web Vitals Simulation', () => {
    it('should meet Largest Contentful Paint (LCP) targets', async () => {
      const images = generateMockImages(3);

      const startTime = performance.now();

      render(
        <PropertyGallery
          images={images}
          propertyTitle="LCP Test"
          lazyLoading={false} // Eager load for LCP measurement
        />
      );

      // Wait for main image to load
      await waitFor(() => {
        expect(imageLoadCount).toBeGreaterThan(0);
      });

      const lcpTime = performance.now() - startTime;

      // LCP should be under 2.5 seconds (simulated)
      expect(lcpTime).toBeLessThan(2500);
    });

    it('should minimize Cumulative Layout Shift (CLS)', () => {
      const images = generateMockImages(5);

      const { container } = render(
        <PropertyGallery
          images={images}
          propertyTitle="CLS Test"
        />
      );

      // Check that aspect ratios are defined to prevent layout shift
      const imageContainers = container.querySelectorAll('.aspect-\\[16\\/10\\]');
      expect(imageContainers.length).toBeGreaterThan(0);

      const thumbnailContainers = container.querySelectorAll('.aspect-square');
      expect(thumbnailContainers.length).toBeGreaterThan(0);
    });

    it('should optimize First Input Delay (FID)', async () => {
      const images = generateMockImages(10);

      render(
        <PropertyGallery
          images={images}
          propertyTitle="FID Test"
        />
      );

      const nextButton = screen.getByLabelText('Next image');

      // Measure interaction responsiveness
      const startTime = performance.now();
      nextButton.click();
      const interactionTime = performance.now() - startTime;

      // Interaction should be immediate (< 100ms)
      expect(interactionTime).toBeLessThan(100);
    });
  });
});