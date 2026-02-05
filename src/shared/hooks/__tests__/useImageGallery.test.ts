import { renderHook, act } from '@testing-library/react'
import { useImageGallery } from '../useImageGallery'
import type { NormalizedProperty } from '../../types/property'

// Mock property for testing
const mockProperty: NormalizedProperty = {
  id: 'test-property-1',
  title: 'Test Property',
  price: 1000000,
  location: 'Test Location',
  description: 'Test Description',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  type: 'residential',
  category: 'residential',
  features: {},
  verificationStatus: 'pending',
  trustScore: 85,
};

describe('useImageGallery', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentImage).toBe('https://example.com/image1.jpg');
    expect(result.current.showGallery).toBe(false);
    expect(result.current.hasMultipleImages).toBe(true);
    expect(result.current.imageCount).toBe(3);
    expect(result.current.galleryImages).toHaveLength(3);
  });

  it('should handle empty images array', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: [],
      })
    );

    expect(result.current.currentImage).toBe('/placeholder-property.jpg');
    expect(result.current.hasMultipleImages).toBe(false);
    expect(result.current.imageCount).toBe(0);
    expect(result.current.galleryImages).toHaveLength(0);
  });

  it('should navigate to specific image index', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    act(() => {
      result.current.navigateToImage(2);
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentImage).toBe('https://example.com/image3.jpg');
  });

  it('should not navigate to invalid index', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    act(() => {
      result.current.navigateToImage(10); // Invalid index
    });

    expect(result.current.currentIndex).toBe(0); // Should remain unchanged
  });

  it('should navigate to next image', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    act(() => {
      result.current.nextImage();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentImage).toBe('https://example.com/image2.jpg');
  });

  it('should wrap to first image when navigating next from last image', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    // Navigate to last image
    act(() => {
      result.current.navigateToImage(2);
    });

    // Navigate next (should wrap to first)
    act(() => {
      result.current.nextImage();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentImage).toBe('https://example.com/image1.jpg');
  });

  it('should navigate to previous image', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    // Start from second image
    act(() => {
      result.current.navigateToImage(1);
    });

    act(() => {
      result.current.previousImage();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentImage).toBe('https://example.com/image1.jpg');
  });

  it('should wrap to last image when navigating previous from first image', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    act(() => {
      result.current.previousImage();
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentImage).toBe('https://example.com/image3.jpg');
  });

  it('should open and close gallery', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    act(() => {
      result.current.openGallery();
    });

    expect(result.current.showGallery).toBe(true);

    act(() => {
      result.current.closeGallery();
    });

    expect(result.current.showGallery).toBe(false);
  });

  it('should generate correct gallery images metadata', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
      })
    );

    const galleryImages = result.current.galleryImages;

    expect(galleryImages[0]).toEqual({
      id: 'test-property-1-0',
      src: 'https://example.com/image1.jpg',
      alt: 'Test Property - View 1',
      category: 'residential',
      caption: 'Primary view',
    });

    expect(galleryImages[1]).toEqual({
      id: 'test-property-1-1',
      src: 'https://example.com/image2.jpg',
      alt: 'Test Property - View 2',
      category: 'residential',
      caption: 'Additional view 1',
    });
  });

  it('should respect enableNavigation option', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
        enableNavigation: false,
      })
    );

    act(() => {
      result.current.navigateToImage(1);
    });

    expect(result.current.currentIndex).toBe(0); // Should not change

    act(() => {
      result.current.nextImage();
    });

    expect(result.current.currentIndex).toBe(0); // Should not change
  });

  it('should respect enableFullscreen option', () => {
    const { result } = renderHook(() =>
      useImageGallery({
        property: mockProperty,
        images: mockProperty.images || [],
        enableFullscreen: false,
      })
    );

    act(() => {
      result.current.openGallery();
    });

    expect(result.current.showGallery).toBe(false); // Should not open
  });
});