import { useCallback, useEffect, useState } from 'react'

interface UseEnhancedImageGalleryProps {
  images: string[];
  title: string;
  enableAutoplay?: boolean;
  autoplayInterval?: number;
}

interface UseEnhancedImageGalleryReturn {
  currentImageIndex: number;
  isFullscreenOpen: boolean;
  openFullscreen: (index?: number) => void;
  closeFullscreen: () => void;
  nextImage: () => void;
  previousImage: () => void;
  goToImage: (index: number) => void;
  toggleAutoplay: () => void;
  isAutoplayActive: boolean;
}

/**
 * Enhanced image gallery hook for property details pages
 * Provides better control over image presentation and fullscreen experience
 */
export function useEnhancedImageGallery({
  images,
  title,
  enableAutoplay = false,
  autoplayInterval = 5000,
}: UseEnhancedImageGalleryProps): UseEnhancedImageGalleryReturn {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isAutoplayActive, setIsAutoplayActive] = useState(enableAutoplay);

  // Auto-advance images in fullscreen mode
  useEffect(() => {
    if (!isFullscreenOpen || !isAutoplayActive || images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [isFullscreenOpen, isAutoplayActive, images.length, autoplayInterval]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreenOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeFullscreen();
          break;
        case 'ArrowLeft':
          previousImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoplay();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen]);

  const openFullscreen = useCallback((index: number = 0) => {
    setCurrentImageIndex(Math.max(0, Math.min(index, images.length - 1)));
    setIsFullscreenOpen(true);
    // Prevent body scroll when fullscreen is open
    document.body.style.overflow = 'hidden';
  }, [images.length]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    setIsAutoplayActive(false);
    // Restore body scroll
    document.body.style.overflow = '';
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const previousImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(Math.max(0, Math.min(index, images.length - 1)));
  }, [images.length]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayActive((prev) => !prev);
  }, []);

  return {
    currentImageIndex,
    isFullscreenOpen,
    openFullscreen,
    closeFullscreen,
    nextImage,
    previousImage,
    goToImage,
    toggleAutoplay,
    isAutoplayActive,
  };
}