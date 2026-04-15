/**
 * Lazy loading image component for performance optimization
 */

import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { FileImage } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo<LazyImageProps>(
  ({ src, alt, className, onLoad, onError }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const image = entry.target as HTMLImageElement;
              if (image.dataset.src) {
                image.src = image.dataset.src;
                image.removeAttribute("data-src");
                observer.unobserve(image);
              }
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(img);
      return () => observer.disconnect();
    }, []);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      onError?.();
    }, [onError]);

    return (
      <div className="relative">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        {hasError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <FileImage className="w-8 h-8" />
          </div>
        ) : (
          <img
            ref={imgRef}
            data-src={src}
            alt={alt}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        )}
      </div>
    );
  }
);

LazyImage.displayName = "LazyImage";
