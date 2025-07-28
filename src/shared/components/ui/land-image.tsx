import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { LandImagePlaceholder } from './land-image-placeholder';

interface LandImageProps {
  src: string;
  alt: string;
  className?: string;
  landType?: 'agricultural' | 'residential' | 'commercial' | 'industrial';
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function LandImage({
  src,
  alt,
  className,
  landType = 'agricultural',
  width,
  height,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
}: LandImageProps) {
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

  // If there's an error loading the image, show the land placeholder
  if (imageError) {
    return (
      <LandImagePlaceholder 
        className={className}
        landType={landType}
        showIcon={true}
      />
    );
  }

  return (
    <div className="relative">
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
      {!isLoaded && (
        <LandImagePlaceholder 
          className={cn("absolute inset-0", className)}
          landType={landType}
          showIcon={false}
        />
      )}
    </div>
  );
}