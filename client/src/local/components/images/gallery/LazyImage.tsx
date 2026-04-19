/**
 * Lazy-loading image component for performance optimisation.
 *
 * Fixes vs original:
 * - Wrapper div now propagates `w-full h-full` so it correctly fills
 *   aspect-ratio / fixed-size containers used by ImageCard.
 * - Skeleton placeholder is absolutely positioned so it never affects layout.
 * - `data-src` attribute is cleared before unobserving to avoid double-loads.
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

    // Reset state when src changes
    useEffect(() => {
      setIsLoaded(false);
      setHasError(false);
    }, [src]);

    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              const lazySrc = target.dataset.src;
              if (lazySrc) {
                target.src = lazySrc;
                delete target.dataset.src;
              }
              observer.unobserve(target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(img);
      return () => observer.disconnect();
    }, [src]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      onError?.();
    }, [onError]);

    return (
      // w-full h-full ensures this wrapper fills whatever container ImageCard provides
      <div className="relative w-full h-full">
        {/* Skeleton — shown until image loads or errors */}
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