/**
 * Comprehensive Lazy Loading Components
 * 
 * Strategic consolidation: This file combines basic lazy loading with advanced
 * performance optimization features including virtualization, infinite scroll,
 * and progressive image loading.
 * 
 * Features:
 * - Basic lazy loading with intersection observer
 * - Virtualized lists for large datasets
 * - Infinite scroll implementation
 * - Progressive image loading
 * - Lazy route components
 * - Performance optimized rendering
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { useLazyLoading, usePreloader } from '../hooks/usePerformanceOptimization';
import { LoadingSpinner, Skeleton } from './LoadingStates';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError
}) => {
  const { elementRef, isVisible } = useLazyLoading({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  return (
    <div ref={elementRef} className={`relative ${className}`}>
      {!isVisible && (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt={alt} className="opacity-50" />
          ) : (
            <div className="text-gray-400">Loading...</div>
          )}
        </div>
      )}
      
      {isVisible && (
        <>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
          
          {imageError && (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
              Failed to load image
            </div>
          )}
          
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { elementRef, isVisible } = useLazyLoading({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  );
};

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LazyRouteProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  preload?: boolean;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component,
  fallback = <LoadingSpinner size="lg" />,
  preload = false
}) => {
  const LazyComponent = React.useMemo(() => lazy(component), [component]);
  const { preloadScript } = usePreloader();

  React.useEffect(() => {
    if (preload) {
      // Preload the component
      component().catch(console.error);
    }
  }, [component, preload]);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  threshold?: number;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  className = '',
  threshold = 0.8
}: InfiniteScrollProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(async () => {
    const container = containerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= threshold) {
      setIsLoadingMore(true);
      try {
        await loadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [loadMore, hasMore, isLoadingMore, threshold]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more items to load
        </div>
      )}
    </div>
  );
}

interface ProgressiveImageProps {
  src: string;
  placeholder: string;
  alt: string;
  className?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(placeholder);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-all duration-300 ${
          imageLoaded ? 'filter-none' : 'filter blur-sm scale-110'
        }`}
      />
      
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};