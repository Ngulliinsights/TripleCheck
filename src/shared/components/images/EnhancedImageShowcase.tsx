import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Grid,
  Maximize2,
  RotateCw,
  Info,
} from 'lucide-react'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'

import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/shared/lib/utils'

interface EnhancedImageShowcaseProps {
  images: string[];
  title: string;
  className?: string;
  maxPreviewImages?: number;
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  enableDownload?: boolean;
  enableShare?: boolean;
  enableZoom?: boolean;
  enableAutoplay?: boolean;
  autoplayInterval?: number;
  showImageCounter?: boolean;
  showThumbnails?: boolean;
  onImageClick?: (index: number) => void;
  onDownload?: (index: number, url: string) => void;
  onShare?: (index: number, url: string) => void;
}

/**
 * Enhanced Image Showcase Component
 * Provides a better visual presentation for property images with larger previews
 * and improved user interaction
 */
export function EnhancedImageShowcase({
  images,
  title,
  className = '',
  maxPreviewImages = 6,
  aspectRatio = 'video',
  enableDownload = true,
  enableShare = true,
  enableZoom = true,
  enableAutoplay = true,
  autoplayInterval = 3000,
  showImageCounter = true,
  showThumbnails = true,
  onImageClick,
  onDownload,
  onShare,
}: EnhancedImageShowcaseProps) {
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]',
  };

  // Autoplay functionality
  useEffect(() => {
    if (isAutoplay && isFullscreenOpen) {
      autoplayTimerRef.current = setInterval(() => {
        setFullscreenIndex((prev) => (prev + 1) % images.length);
      }, autoplayInterval);
    } else {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoplay, isFullscreenOpen, images.length, autoplayInterval]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreenOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleFullscreenClose();
          break;
        case 'ArrowLeft':
          handleFullscreenPrev();
          break;
        case 'ArrowRight':
          handleFullscreenNext();
          break;
        case ' ':
          e.preventDefault();
          setIsAutoplay((prev) => !prev);
          break;
        case 'i':
        case 'I':
          setShowInfo((prev) => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen]);

  const handleImageClick = useCallback((index: number) => {
    onImageClick?.(index);
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
    setIsAutoplay(false);
  }, [onImageClick]);

  const handleMainImageChange = useCallback((index: number) => {
    setCurrentMainImage(index);
    setIsImageLoading(true);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreenOpen(false);
    setIsAutoplay(false);
    setShowInfo(false);
  }, []);

  const handleFullscreenNext = useCallback(() => {
    setFullscreenIndex((prev) => (prev + 1) % images.length);
    setIsImageLoading(true);
  }, [images.length]);

  const handleFullscreenPrev = useCallback(() => {
    setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsImageLoading(true);
  }, [images.length]);

  const handleShare = useCallback(async (index?: number) => {
    const imageIndex = index ?? currentMainImage;
    const imageUrl = images[imageIndex];

    if (onShare) {
      onShare(imageIndex, imageUrl);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Image ${imageIndex + 1}`,
          text: `Check out this image from ${title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You might want to show a toast notification here
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  }, [images, currentMainImage, title, onShare]);

  const handleDownload = useCallback((index?: number) => {
    const imageIndex = index ?? currentMainImage;
    const imageUrl = images[imageIndex];

    if (onDownload) {
      onDownload(imageIndex, imageUrl);
      return;
    }

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-image-${imageIndex + 1}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [images, currentMainImage, title, onDownload]);

  const handleToggleAutoplay = useCallback(() => {
    setIsAutoplay((prev) => !prev);
  }, []);

  const visibleThumbnails = showThumbnails ? images.slice(0, maxPreviewImages) : [];
  const hasMoreImages = images.length > maxPreviewImages;

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-0">
          {/* Main Image Display */}
          <div className="relative group">
            <div
              className={cn(
                'relative overflow-hidden bg-gray-100',
                aspectRatioClasses[aspectRatio]
              )}
            >
              {/* Loading skeleton */}
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}

              {/* Main Image */}
              <img
                src={images[currentMainImage]}
                alt={`${title} - Image ${currentMainImage + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: isImageLoading ? 0 : 1 }}
                onLoad={() => setIsImageLoading(false)}
                onClick={() => handleImageClick(currentMainImage)}
              />

              {/* Hover Overlay with Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/90 hover:bg-white"
                  onClick={() => handleImageClick(currentMainImage)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                {enableDownload && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {enableShare && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMainImageChange(
                        (currentMainImage - 1 + images.length) % images.length
                      );
                    }}
                    disabled={currentMainImage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMainImageChange((currentMainImage + 1) % images.length);
                    }}
                    disabled={currentMainImage === images.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              {showImageCounter && images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentMainImage + 1} / {images.length}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {showThumbnails && images.length > 1 && (
            <div className="p-4 bg-gray-50">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {visibleThumbnails.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleMainImageChange(index)}
                    className={cn(
                      'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all',
                      'hover:ring-2 hover:ring-primary hover:scale-105',
                      currentMainImage === index
                        ? 'ring-2 ring-primary scale-105'
                        : 'opacity-60'
                    )}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}

                {/* More Images Indicator */}
                {hasMoreImages && (
                  <button
                    onClick={() => handleImageClick(maxPreviewImages)}
                    className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-all flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Grid className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">
                        +{images.length - maxPreviewImages}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Lightbox */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Top Controls Bar */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <h2 className="text-white text-lg font-semibold truncate max-w-md">
                  {title}
                </h2>
                {showImageCounter && (
                  <span className="text-white/80 text-sm">
                    {fullscreenIndex + 1} / {images.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Info Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-white hover:bg-white/20',
                    showInfo && 'bg-white/20'
                  )}
                  onClick={() => setShowInfo(!showInfo)}
                  title="Toggle info (I)"
                >
                  <Info className="h-5 w-5" />
                </Button>

                {/* Autoplay Toggle */}
                {enableAutoplay && images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleToggleAutoplay}
                    title={isAutoplay ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isAutoplay ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                )}

                {/* Download */}
                {enableDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleDownload(fullscreenIndex)}
                    title="Download image"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}

                {/* Share */}
                {enableShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleShare(fullscreenIndex)}
                    title="Share image"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                )}

                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleFullscreenClose}
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Image with Zoom */}
          <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32">
            {enableZoom ? (
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) => (
                  <>
                    {/* Zoom Controls */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => zoomIn()}
                        className="bg-white/90 hover:bg-white"
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => zoomOut()}
                        className="bg-white/90 hover:bg-white"
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => resetTransform()}
                        className="bg-white/90 hover:bg-white"
                        title="Reset zoom"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>

                    <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                      <img
                        src={images[fullscreenIndex]}
                        alt={`${title} - Image ${fullscreenIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        style={{ opacity: isImageLoading ? 0 : 1 }}
                        onLoad={() => setIsImageLoading(false)}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            ) : (
              <img
                src={images[fullscreenIndex]}
                alt={`${title} - Image ${fullscreenIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{ opacity: isImageLoading ? 0 : 1 }}
                onLoad={() => setIsImageLoading(false)}
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white disabled:opacity-50"
                onClick={handleFullscreenPrev}
                disabled={fullscreenIndex === 0}
                title="Previous (←)"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white disabled:opacity-50"
                onClick={handleFullscreenNext}
                disabled={fullscreenIndex === images.length - 1}
                title="Next (→)"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Bottom Thumbnail Strip */}
          {showThumbnails && images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="max-w-4xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                <div className="flex gap-2 justify-center min-w-max px-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFullscreenIndex(index);
                        setIsImageLoading(true);
                      }}
                      className={cn(
                        'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all',
                        'hover:ring-2 hover:ring-white hover:scale-110',
                        fullscreenIndex === index
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-60'
                      )}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute right-4 top-24 z-50 w-80 bg-white rounded-lg shadow-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-semibold text-lg mb-3">{title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Images:</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Image:</span>
                  <span className="font-medium">{fullscreenIndex + 1}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>← / →</span>
                    <span>Navigate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Space</span>
                    <span>Play/Pause</span>
                  </div>
                  <div className="flex justify-between">
                    <span>I</span>
                    <span>Toggle Info</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Esc</span>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </>
  );
}