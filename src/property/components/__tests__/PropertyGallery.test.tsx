import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PropertyGallery } from '../PropertyGallery';

// Mock the toast hook
vi.mock('../../../shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the drag and drop libraries
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, from, to) => {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
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
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

// Mock the zoom library
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: any }) => {
    const mockFunctions = {
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetTransform: vi.fn(),
      centerView: vi.fn(),
    };
    return <div>{typeof children === 'function' ? children(mockFunctions) : children}</div>;
  },
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock OptimizedImage component
vi.mock('../../../shared/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt, onLoad, className, loading }: any) => {
    React.useEffect(() => {
      // Simulate image load after a short delay
      const timer = setTimeout(() => {
        onLoad?.();
      }, 50);
      return () => clearTimeout(timer);
    }, [onLoad]);
    
    return <img src={src} alt={alt} className={className} loading={loading} data-testid="optimized-image" />;
  },
}));

// Mock Web Share API
Object.assign(navigator, {
  share: vi.fn(),
  clipboard: {
    writeText: vi.fn(),
  },
});

const mockImages = [
  {
    id: '1',
    url: 'https://example.com/image1.jpg',
    webpUrl: 'https://example.com/image1.webp',
    alt: 'Exterior view',
    caption: 'Beautiful exterior view',
    type: 'exterior' as const,
    thumbnailUrl: 'https://example.com/thumb1.jpg',
  },
  {
    id: '2',
    url: 'https://example.com/image2.jpg',
    webpUrl: 'https://example.com/image2.webp',
    alt: 'Interior view',
    caption: 'Spacious interior',
    type: 'interior' as const,
    is360: true,
    thumbnailUrl: 'https://example.com/thumb2.jpg',
  },
  {
    id: '3',
    url: 'https://example.com/image3.jpg',
    alt: 'Kitchen view',
    type: 'interior' as const,
    thumbnailUrl: 'https://example.com/thumb3.jpg',
  },
];

describe('PropertyGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders gallery with images', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      expect(screen.getByText('Exterior')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getAllByTestId('optimized-image')).toHaveLength(4); // 1 main + 3 thumbnails
    });

    it('renders empty state when no images', () => {
      render(
        <PropertyGallery
          images={[]}
          propertyTitle="Test Property"
        />
      );

      expect(screen.getByText('No images available')).toBeInTheDocument();
    });

    it('shows virtual tour indicator for 360° images', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      // Navigate to the 360° image
      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(screen.getByText('360° Tour')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates between images using arrow buttons', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('wraps around when navigating past boundaries', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const prevButtons = screen.getAllByLabelText('Previous image');
      fireEvent.click(prevButtons[0]); // Click the main gallery prev button

      expect(screen.getAllByText('3 / 3')[0]).toBeInTheDocument();

      const nextButtons = screen.getAllByLabelText('Next image');
      fireEvent.click(nextButtons[0]); // Click the main gallery next button
      fireEvent.click(nextButtons[0]);
      fireEvent.click(nextButtons[0]);

      expect(screen.getAllByText('1 / 3')[0]).toBeInTheDocument();
    });

    it('selects image when thumbnail is clicked', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const thumbnails = screen.getAllByLabelText(/View image \d+:/);
      fireEvent.click(thumbnails[2]); // Click third thumbnail

      expect(screen.getAllByText('3 / 3')[0]).toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('opens fullscreen viewer when maximize button is clicked', async () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const fullscreenButton = screen.getByLabelText('View fullscreen');
      fireEvent.click(fullscreenButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Close fullscreen')).toBeInTheDocument();
      });
    });

    it('shows zoom controls in fullscreen mode', async () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const fullscreenButton = screen.getByLabelText('View fullscreen');
      fireEvent.click(fullscreenButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
        expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
      });
    });
  });

  describe('Image Loading Performance', () => {
    it('shows loading skeleton while images are loading', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          lazyLoading={true}
        />
      );

      // Initially, skeleton should be visible
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides loading skeleton after image loads', async () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          lazyLoading={true}
        />
      );

      // Wait for image to load
      await waitFor(() => {
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBe(0);
      }, { timeout: 200 });
    });

    it('uses lazy loading when enabled', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          lazyLoading={true}
        />
      );

      const images = screen.getAllByTestId('optimized-image');
      // Main image should have lazy loading
      expect(images[0]).toHaveAttribute('loading', 'lazy');
    });

    it('uses eager loading when lazy loading is disabled', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          lazyLoading={false}
        />
      );

      const images = screen.getAllByTestId('optimized-image');
      // Main image should have eager loading
      expect(images[0]).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Social Sharing', () => {
    it('uses Web Share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: mockShare });

      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const shareButton = screen.getByLabelText('Share image');
      await userEvent.click(shareButton);

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Property - Exterior view',
        text: 'Beautiful exterior view',
        url: 'https://example.com/image1.jpg',
      });
    });

    it('falls back to clipboard when Web Share API fails', async () => {
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { 
        share: mockShare,
        clipboard: { writeText: mockWriteText }
      });

      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const shareButton = screen.getByLabelText('Share image');
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('https://example.com/image1.jpg');
      });
    });
  });

  describe('Image Reordering', () => {
    it('shows drag handles when edit mode is enabled', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          allowEdit={true}
        />
      );

      const dragHandles = document.querySelectorAll('.cursor-grab');
      expect(dragHandles.length).toBe(3); // One for each thumbnail
    });

    it('hides drag handles when edit mode is disabled', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
          allowEdit={false}
        />
      );

      const dragHandles = document.querySelectorAll('.cursor-grab');
      expect(dragHandles.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for navigation buttons', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      expect(screen.getByLabelText('View fullscreen')).toBeInTheDocument();
      expect(screen.getByLabelText('Share image')).toBeInTheDocument();
    });

    it('provides proper ARIA labels for thumbnails', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      expect(screen.getByLabelText('View image 1: Exterior view')).toBeInTheDocument();
      expect(screen.getByLabelText('View image 2: Interior view')).toBeInTheDocument();
      expect(screen.getByLabelText('View image 3: Kitchen view')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('renders thumbnails efficiently with proper grid layout', () => {
      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const thumbnailGrid = document.querySelector('.grid');
      expect(thumbnailGrid).toHaveClass('grid-cols-6', 'md:grid-cols-8', 'lg:grid-cols-10');
    });

    it('handles large number of images without performance issues', () => {
      const manyImages = Array.from({ length: 50 }, (_, i) => ({
        id: `image-${i}`,
        url: `https://example.com/image${i}.jpg`,
        alt: `Image ${i}`,
        type: 'interior' as const,
      }));

      const startTime = performance.now();
      
      render(
        <PropertyGallery
          images={manyImages}
          propertyTitle="Test Property"
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Rendering should complete within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('handles missing image URLs gracefully', () => {
      const imagesWithMissingUrl = [
        {
          id: '1',
          url: '',
          alt: 'Missing image',
          type: 'exterior' as const,
        },
      ];

      expect(() => {
        render(
          <PropertyGallery
            images={imagesWithMissingUrl}
            propertyTitle="Test Property"
          />
        );
      }).not.toThrow();
    });

    it('handles clipboard API not being available', async () => {
      // Remove clipboard API
      Object.assign(navigator, { 
        share: undefined,
        clipboard: undefined 
      });

      render(
        <PropertyGallery
          images={mockImages}
          propertyTitle="Test Property"
        />
      );

      const shareButton = screen.getByLabelText('Share image');
      
      // Should not throw error even without clipboard API
      expect(() => userEvent.click(shareButton)).not.toThrow();
    });
  });
});