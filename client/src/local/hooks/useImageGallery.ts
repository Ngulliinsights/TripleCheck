import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { NormalizedProperty } from '@shared/types/property'

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category?: string;
  caption?: string;
}

export interface UseImageGalleryOptions {
  /** The property object containing metadata */
  property: NormalizedProperty;
  /** Array of image URLs */
  images: readonly string[];
  /** Whether to enable image navigation */
  enableNavigation?: boolean;
  /** Whether to enable fullscreen gallery */
  enableFullscreen?: boolean;
  /** Whether to preload adjacent images for better performance */
  preloadAdjacent?: boolean;
  /** Callback for analytics tracking */
  onImageChange?: (index: number, imageUrl: string) => void;
  /** Callback when gallery is opened */
  onGalleryOpen?: () => void;
  /** Callback when gallery is closed */
  onGalleryClose?: () => void;
  /** Custom placeholder image URL */
  placeholderImage?: string;
}

export interface UseImageGalleryReturn {
  /** Current image index */
  currentIndex: number;
  /** Current image URL */
  currentImage: string;
  /** Array of gallery images with metadata */
  galleryImages: GalleryImage[];
  /** Whether the fullscreen gallery is open */
  showGallery: boolean;
  /** Whether there are multiple images */
  hasMultipleImages: boolean;
  /** Total number of images */
  imageCount: number;
  /** Whether navigation is available */
  canNavigate: boolean;
  /** Whether there's a next image */
  hasNext: boolean;
  /** Whether there's a previous image */
  hasPrevious: boolean;
  /** Navigate to specific image index */
  navigateToImage: (index: number) => void;
  /** Navigate to next image */
  nextImage: () => void;
  /** Navigate to previous image */
  previousImage: () => void;
  /** Open fullscreen gallery */
  openGallery: () => void;
  /** Close fullscreen gallery */
  closeGallery: () => void;
  /** Set current index directly */
  setCurrentIndex: (index: number) => void;
  /** Preload image at specific index */
  preloadImage: (index: number) => void;
  /** Get image loading state */
  isImageLoading: (index: number) => boolean;
}

/**
 * Enhanced shared hook for managing image gallery functionality
 * Provides comprehensive image gallery management with preloading, analytics, and accessibility
 * Used by PropertyCard, EnhancedLandCard, and other image-displaying components
 * 
 * @param options - Configuration options for the image gallery
 * @returns Gallery state and control functions
 */
export function useImageGallery({
  property,
  images,
  enableNavigation = true,
  enableFullscreen = true,
  preloadAdjacent = true,
  onImageChange,
  onGalleryOpen,
  onGalleryClose,
  placeholderImage = "/placeholder-property.jpg",
}: UseImageGalleryOptions): UseImageGalleryReturn {
  // Clamp initial index to valid range to prevent out-of-bounds issues
  const [currentIndex, setCurrentIndex] = useState(() => 
    Math.max(0, Math.min(0, images.length - 1))
  );
  const [showGallery, setShowGallery] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  
  // Use ref to track preloaded images and prevent duplicate requests
  const preloadedImages = useRef<Set<string>>(new Set());

  // Ensure current index stays within valid bounds when images array changes
  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= images.length) {
      // If current index is out of bounds, move to last available image
      const newIndex = images.length - 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex, images[newIndex] || placeholderImage);
    }
  }, [images.length, currentIndex, onImageChange, placeholderImage]);

  // Memoized computed values for better performance
  const computedValues = useMemo(() => ({
    canNavigate: enableNavigation && images.length > 1,
    hasMultipleImages: images.length > 1,
    imageCount: images.length,
    hasNext: currentIndex < images.length - 1,
    hasPrevious: currentIndex > 0,
  }), [enableNavigation, images.length, currentIndex]);

  // Memoized gallery images with enhanced metadata generation
  const galleryImages = useMemo(
    () =>
      images.map((src, index) => ({
        id: `${property.id}-${index}`,
        src,
        alt: `${property.title} - Image ${index + 1} of ${images.length}`,
        category: property.type || property.category,
        caption: index === 0 ? "Primary view" : `View ${index + 1}`,
      })),
    [images, property.id, property.title, property.type, property.category]
  );

  // Get current image with enhanced error handling
  const currentImage = useMemo(() => {
    // Handle empty images array
    if (images.length === 0) return placeholderImage;
    
    // Clamp currentIndex to valid range as safety net
    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const image = images[safeIndex];
    
    // Return placeholder if image URL is falsy (empty string, null, undefined)
    return image || placeholderImage;
  }, [currentIndex, images, placeholderImage]);

  // Optimized image preloading with duplicate prevention and error handling
  const preloadImage = useCallback((index: number) => {
    // Validate index bounds
    if (index < 0 || index >= images.length) return;
    
    const imageUrl = images[index];
    if (!imageUrl || preloadedImages.current.has(imageUrl)) return;

    // Mark as being preloaded to prevent duplicates
    preloadedImages.current.add(imageUrl);
    setLoadingImages(prev => new Set(prev).add(index));

    const img = new Image();
    
    const cleanup = () => {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    };

    img.onload = cleanup;
    img.onerror = () => {
      // Remove from preloaded set on error so it can be retried
      preloadedImages.current.delete(imageUrl);
      cleanup();
    };
    
    img.src = imageUrl;
  }, [images]);

  // Memoized loading state checker
  const isImageLoading = useCallback((index: number) => {
    return loadingImages.has(index);
  }, [loadingImages]);

  // Centralized index change handler for consistency
  const handleIndexChange = useCallback((newIndex: number, triggerCallback = true) => {
    if (newIndex >= 0 && newIndex < images.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      if (triggerCallback) {
        onImageChange?.(newIndex, images[newIndex] || placeholderImage);
      }
    }
  }, [images, currentIndex, onImageChange, placeholderImage]);

  // Enhanced navigation functions with improved logic
  const navigateToImage = useCallback(
    (index: number) => {
      if (computedValues.canNavigate) {
        handleIndexChange(index);
      }
    },
    [computedValues.canNavigate, handleIndexChange]
  );

  const nextImage = useCallback(() => {
    if (computedValues.canNavigate && computedValues.hasNext) {
      handleIndexChange(currentIndex + 1);
    }
  }, [computedValues.canNavigate, computedValues.hasNext, currentIndex, handleIndexChange]);

  const previousImage = useCallback(() => {
    if (computedValues.canNavigate && computedValues.hasPrevious) {
      handleIndexChange(currentIndex - 1);
    }
  }, [computedValues.canNavigate, computedValues.hasPrevious, currentIndex, handleIndexChange]);

  // Preload adjacent images effect with improved dependency management
  useEffect(() => {
    if (!preloadAdjacent || !computedValues.canNavigate) return;

    // Preload current image first if not already loaded
    preloadImage(currentIndex);
    
    // Then preload adjacent images
    if (computedValues.hasNext) {
      preloadImage(currentIndex + 1);
    }
    if (computedValues.hasPrevious) {
      preloadImage(currentIndex - 1);
    }
  }, [currentIndex, preloadAdjacent, computedValues.canNavigate, computedValues.hasNext, computedValues.hasPrevious, preloadImage]);

  // Enhanced gallery modal controls
  const openGallery = useCallback(() => {
    if (enableFullscreen) {
      setShowGallery(true);
      onGalleryOpen?.();
    }
  }, [enableFullscreen, onGalleryOpen]);

  const closeGallery = useCallback(() => {
    setShowGallery(false);
    onGalleryClose?.();
  }, [onGalleryClose]);

  // Simplified setCurrentIndex that uses the centralized handler
  const setCurrentIndexSafe = useCallback((index: number) => {
    handleIndexChange(index);
  }, [handleIndexChange]);

  // Clean up preloaded images ref when component unmounts or images change
  useEffect(() => {
    return () => {
      preloadedImages.current.clear();
    };
  }, [images]);

  return {
    currentIndex,
    currentImage,
    galleryImages,
    showGallery,
    ...computedValues, // Spread computed values for cleaner return
    navigateToImage,
    nextImage,
    previousImage,
    openGallery,
    closeGallery,
    setCurrentIndex: setCurrentIndexSafe,
    preloadImage,
    isImageLoading,
  };
}

export default useImageGallery;