import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  fallback?: string;
  progressive?: boolean;
  webpSupport?: boolean;
  avifSupport?: boolean;
  responsive?: boolean;
  aspectRatio?: string;
}

interface ImageState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  currentSrc: string;
}

/**
 * Optimized image component with lazy loading, progressive enhancement, and modern format support
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  loading = 'lazy',
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  fallback,
  progressive = true,
  webpSupport = true,
  avifSupport = true,
  responsive = true,
  aspectRatio
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    currentSrc: placeholder || blurDataURL || ''
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(priority);
  const [supportedFormats, setSupportedFormats] = useState<{
    webp: boolean;
    avif: boolean;
  }>({ webp: false, avif: false });

  // Check browser support for modern image formats
  useEffect(() => {
    const checkFormatSupport = async () => {
      const formats = { webp: false, avif: false };

      if (webpSupport) {
        try {
          const webpCanvas = document.createElement('canvas');
          webpCanvas.width = 1;
          webpCanvas.height = 1;
          formats.webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } catch {
          formats.webp = false;
        }
      }

      if (avifSupport) {
        try {
          const avifImage = new Image();
          const avifPromise = new Promise<boolean>((resolve) => {
            avifImage.onload = () => resolve(true);
            avifImage.onerror = () => resolve(false);
            avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
          });
          formats.avif = await avifPromise;
        } catch {
          formats.avif = false;
        }
      }

      setSupportedFormats(formats);
    };

    checkFormatSupport();
  }, [webpSupport, avifSupport]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Generate optimized image URLs
  const generateImageUrl = useCallback((originalSrc: string, format?: string) => {
    if (!originalSrc) return '';

    // If it's already a data URL or external URL, return as is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // Build optimized URL with query parameters
    const url = new URL(originalSrc, window.location.origin);
    const params = new URLSearchParams();

    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 75) params.set('q', quality.toString());
    if (format) params.set('f', format);

    return `${url.pathname}?${params.toString()}`;
  }, [width, height, quality]);

  // Get the best supported image format
  const getOptimizedSrc = useCallback(() => {
    if (supportedFormats.avif && avifSupport) {
      return generateImageUrl(src, 'avif');
    }
    if (supportedFormats.webp && webpSupport) {
      return generateImageUrl(src, 'webp');
    }
    return generateImageUrl(src);
  }, [src, supportedFormats, avifSupport, webpSupport, generateImageUrl]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    if (!responsive || !width) return undefined;

    const breakpoints = [0.5, 1, 1.5, 2];
    const srcSetEntries = breakpoints.map(multiplier => {
      const scaledWidth = Math.round(width * multiplier);
      const url = generateImageUrl(src, supportedFormats.avif ? 'avif' : supportedFormats.webp ? 'webp' : undefined);
      const urlWithWidth = url.includes('?') 
        ? url.replace(/w=\d+/, `w=${scaledWidth}`)
        : `${url}?w=${scaledWidth}`;
      return `${urlWithWidth} ${scaledWidth}w`;
    });

    return srcSetEntries.join(', ');
  }, [responsive, width, src, supportedFormats, generateImageUrl]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      isLoaded: true,
      isLoading: false,
      hasError: false
    }));
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState(prev => ({
      ...prev,
      isLoaded: false,
      isLoading: false,
      hasError: true,
      currentSrc: fallback || placeholder || ''
    }));
    onError?.(event.nativeEvent);
  }, [onError, fallback, placeholder]);

  // Start loading image when in view
  useEffect(() => {
    if (isInView && !imageState.isLoaded && !imageState.isLoading && !imageState.hasError) {
      setImageState(prev => ({
        ...prev,
        isLoading: true,
        currentSrc: getOptimizedSrc()
      }));
    }
  }, [isInView, imageState, getOptimizedSrc]);

  // Progressive loading effect
  useEffect(() => {
    if (progressive && blurDataURL && !imageState.isLoaded) {
      setImageState(prev => ({
        ...prev,
        currentSrc: blurDataURL
      }));
    }
  }, [progressive, blurDataURL, imageState.isLoaded]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && {
      aspectRatio,
      width: '100%',
      height: 'auto'
    }),
    ...(width && height && !aspectRatio && {
      width,
      height
    })
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    transition: imageState.isLoaded ? 'opacity 0.3s ease-in-out' : 'none',
    opacity: imageState.isLoaded ? 1 : 0.8,
    ...(progressive && blurDataURL && !imageState.isLoaded && {
      filter: 'blur(10px)',
      transform: 'scale(1.1)'
    })
  };

  return (
    <div 
      className={cn('relative', className)} 
      style={containerStyle}
    >
      {/* Placeholder/Loading state */}
      {!imageState.isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ zIndex: 1 }}
        >
          {imageState.isLoading && (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={imageState.currentSrc || (isInView ? getOptimizedSrc() : placeholder)}
        srcSet={isInView ? generateSrcSet() : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={imageStyle}
        className="w-full h-full"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Error state */}
      {imageState.hasError && !fallback && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for preloading images
 */
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };
        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          reject(new Error(`Failed to load image: ${url}`));
        };
        img.src = url;
      });
    };

    const preloadAll = async () => {
      const promises = urls.map(url => 
        preloadImage(url).catch(() => {}) // Ignore individual failures
      );
      await Promise.allSettled(promises);
    };

    if (urls.length > 0) {
      preloadAll();
    }
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    hasFailed: (url: string) => failedImages.has(url)
  };
}

/**
 * Image gallery component with optimized loading
 */
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
  }>;
  className?: string;
  itemClassName?: string;
  columns?: number;
  gap?: number;
  lazy?: boolean;
  quality?: number;
}

export function ImageGallery({
  images,
  className,
  itemClassName,
  columns = 3,
  gap = 16,
  lazy = true,
  quality = 75
}: ImageGalleryProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  };

  return (
    <div className={cn('w-full', className)} style={gridStyle}>
      {images.map((image, index) => (
        <div key={index} className={cn('relative', itemClassName)}>
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={lazy ? 'lazy' : 'eager'}
            quality={quality}
            responsive
            progressive
            className="rounded-lg overflow-hidden"
          />
          {image.caption && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default OptimizedImage;