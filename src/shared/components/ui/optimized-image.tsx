import React, { useState, useCallback } from 'react';

import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  webpSrc,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // If there's an error loading the image, show a placeholder
  if (imageError) {
    return (
      <div 
        className={cn(
          "bg-gray-200 flex items-center justify-center text-gray-500",
          className
        )}
        style={{ 
          ...(width && { width }), 
          ...(height && { height }) 
        }}
      >
        <span className="text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <picture>
      {webpSrc && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    </picture>
  );
}