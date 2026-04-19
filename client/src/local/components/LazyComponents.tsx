/**
 * Lazy Loading Components
 *
 * Fixes applied:
 * - `LazyRoute`: `lazy(component)` was called inside `useMemo` with `[component]`
 *   as a dep. When the parent re-renders with the same function reference, this
 *   is fine, but any reference change causes the lazy module to be thrown away
 *   and re-fetched. The proper pattern is to call `lazy()` at module scope (or
 *   at least outside the render path) so the Promise resolves once. The component
 *   prop is now expected to be stable (defined outside the render tree); a warning
 *   is surfaced in dev if it changes.
 *
 * - `usePreloader` → `preloadScript` was destructured but never used. Removed.
 *
 * - `InfiniteScroll`: items were keyed by array index, causing React to reuse DOM
 *   nodes incorrectly when the list mutates. Callers must now supply a `keyExtractor`.
 *
 * - `VirtualizedList`: same index-key problem fixed via `keyExtractor`.
 *
 * - `InfiniteScroll`: scroll handler was attached via `addEventListener` on a ref,
 *   bypassing React's passive-listener optimisation. Replaced with the `onScroll`
 *   prop so the browser can apply passive hints automatically.
 */

import React, { Suspense, lazy, ComponentType } from "react";
import { useLazyLoading } from "../hooks/usePerformanceOptimization";
import { LoadingSpinner, Skeleton } from "./LoadingStates";

// ---------------------------------------------------------------------------
// LazyImage
// ---------------------------------------------------------------------------

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
  className = "",
  placeholder,
  onLoad,
  onError,
}) => {
  const { elementRef, isVisible } = useLazyLoading<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "50px",
  });

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError]   = React.useState(false);

  const handleLoad  = React.useCallback(() => { setImageLoaded(true); onLoad?.();  }, [onLoad]);
  const handleError = React.useCallback(() => { setImageError(true);  onError?.(); }, [onError]);

  return (
    <div ref={elementRef} className={`relative ${className}`}>
      {!isVisible && (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt={alt} className="opacity-50" />
          ) : (
            <span className="text-gray-400 text-sm">Loading…</span>
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
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
              Failed to load image
            </div>
          )}

          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// LazyComponent (intersection-observer gated rendering)
// ---------------------------------------------------------------------------

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
  rootMargin = "100px",
}) => {
  const { elementRef, isVisible } = useLazyLoading<HTMLDivElement>({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  );
};

// ---------------------------------------------------------------------------
// VirtualizedList
//
// FIX: keyed by `startIndex + index` (non-stable integer) → `keyExtractor` prop
// ---------------------------------------------------------------------------

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = "",
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex   = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight  = items.length * itemHeight;
  const offsetY      = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={keyExtractor(item, startIndex + idx)} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LazyRoute
//
// FIX: The previous version called `React.useMemo(() => lazy(component), [component])`.
// Whenever the `component` reference changed (e.g. anonymous arrow on parent re-render)
// React threw away the suspended module and re-fetched it. The correct pattern is to
// create the lazy component *once* and store it outside the render path.
//
// Callers MUST define `component` outside the render function or with `useRef` /
// module scope so its reference is stable. A dev-mode warning is emitted on change.
// ---------------------------------------------------------------------------

// Module-level cache so each import path is only wrapped once.
const lazyCache = new WeakMap<() => Promise<{ default: ComponentType<unknown> }>, ComponentType<unknown>>();

function getOrCreateLazy<P>(
  factory: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  const f = factory as () => Promise<{ default: ComponentType<unknown> }>;
  if (!lazyCache.has(f)) {
    lazyCache.set(f, lazy(f));
  }
  return lazyCache.get(f) as ComponentType<P>;
}

interface LazyRouteProps {
  component: () => Promise<{ default: ComponentType<unknown> }>;
  fallback?: React.ReactNode;
  preload?: boolean;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component,
  fallback = <LoadingSpinner size="lg" />,
  preload = false,
}) => {
  const LazyComp = getOrCreateLazy(component);

  const prevRef = React.useRef(component);
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && prevRef.current !== component) {
      console.warn(
        "[LazyRoute] The `component` prop changed reference between renders. " +
        "Define it at module scope or with useRef to avoid refetching the module.",
      );
    }
    prevRef.current = component;
  }, [component]);

  React.useEffect(() => {
    if (preload) {
      component().catch(console.error);
    }
  }, [component, preload]);

  return (
    <Suspense fallback={fallback}>
      <LazyComp />
    </Suspense>
  );
};

// ---------------------------------------------------------------------------
// InfiniteScroll
//
// Fixes:
// 1. `keyExtractor` prop replaces unstable array-index keys.
// 2. Scroll handler uses the React `onScroll` prop (enables passive listeners)
//    instead of a manual `addEventListener`, which was also missing cleanup.
// ---------------------------------------------------------------------------

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  threshold?: number;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  keyExtractor,
  loadMore,
  hasMore,
  isLoading,
  className = "",
  threshold = 0.8,
}: InfiniteScrollProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const handleScroll = React.useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (isLoadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const pct = (scrollTop + clientHeight) / scrollHeight;

      if (pct >= threshold) {
        setIsLoadingMore(true);
        try {
          await loadMore();
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [loadMore, hasMore, isLoadingMore, threshold],
  );

  return (
    <div className={`overflow-auto ${className}`} onScroll={handleScroll}>
      {items.map((item, idx) => (
        <div key={keyExtractor(item, idx)}>
          {renderItem(item, idx)}
        </div>
      ))}

      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-4" aria-live="polite" aria-label="Loading more">
          <LoadingSpinner />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center py-4 text-sm text-gray-500">
          No more items to load
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressiveImage
// ---------------------------------------------------------------------------

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
  className = "",
}) => {
  const [currentSrc, setCurrentSrc]   = React.useState(placeholder);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    setCurrentSrc(placeholder);
    setImageLoaded(false);

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src, placeholder]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-all duration-500 ${
          imageLoaded ? "filter-none blur-0" : "blur-sm scale-110"
        }`}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
};