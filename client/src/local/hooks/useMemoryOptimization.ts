/**
 * Memory Optimization Hooks
 * Collection of hooks for optimizing memory usage in React components.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

interface BaseEntity {
  id: string | number;
  [key: string]: unknown;
}

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize:  number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// ---------------------------------------------------------------------------
// 1. Virtualization Hook for Large Lists
// ---------------------------------------------------------------------------

interface VirtualizationOptions {
  itemHeight:      number;
  containerHeight: number;
  /** Items to render outside the visible area for smooth scrolling. @default 5 */
  // cspell:disable-next-line
  overscan?: number;
}

export function useVirtualization<T>(items: T[], options: VirtualizationOptions) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd   = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1,
    );
    return {
      start: Math.max(0, visibleStart - overscan),
      end:   Math.min(items.length - 1, visibleEnd + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() =>
    items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    })),
  [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY     = visibleRange.start * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return { visibleItems, totalHeight, offsetY, handleScroll };
}

// ---------------------------------------------------------------------------
// 1.1 Specialized Virtualization Helpers
// ---------------------------------------------------------------------------

export function usePropertyListVirtualization<T extends BaseEntity>(
  properties:      readonly T[],
  containerHeight: number,
  itemHeight = 280,
) {
  return useMemo(() => ({
    items:          properties,
    itemHeight,
    containerHeight,
    keyExtractor:   (p: T, i: number) => `${p.id}-${i}`,
    // cspell:disable-next-line
    overscanCount:  3,
  }), [properties, containerHeight, itemHeight]);
}

export function usePropertyGridVirtualization<T extends BaseEntity>(
  properties:      readonly T[],
  containerWidth:  number,
  containerHeight: number,
  cardWidth  = 280,
  cardHeight = 320,
) {
  return useMemo(() => ({
    items:          properties,
    itemWidth:      cardWidth,
    itemHeight:     cardHeight,
    containerWidth,
    containerHeight,
    gap:            16,
    keyExtractor:   (p: T, i: number) => `${p.id}-${i}`,
    // cspell:disable-next-line
    overscanCount:  1,
  }), [properties, containerWidth, containerHeight, cardWidth, cardHeight]);
}

export function useNotificationListVirtualization<T extends BaseEntity>(
  notifications:   readonly T[],
  containerHeight: number,
  itemHeight = 80,
) {
  return useMemo(() => ({
    items:          notifications,
    itemHeight,
    containerHeight,
    keyExtractor:   (n: T, i: number) => `${n.id}-${i}`,
    // cspell:disable-next-line
    overscanCount:  5,
  }), [notifications, containerHeight, itemHeight]);
}

export function useReviewListVirtualization<T extends BaseEntity>(
  reviews:         readonly T[],
  containerHeight: number,
  getItemHeight:   (review: T) => number = () => 120,
) {
  return useMemo(() => ({
    items:          reviews,
    itemHeight:     (index: number) => {
      const review = reviews[index];
      return review ? getItemHeight(review) : 120;
    },
    containerHeight,
    keyExtractor:   (r: T, i: number) => `${r.id}-${i}`,
    // cspell:disable-next-line
    overscanCount:  2,
  }), [reviews, containerHeight, getItemHeight]);
}

export function useTenantListVirtualization<T extends BaseEntity>(
  tenants:         readonly T[],
  containerHeight: number,
  itemHeight = 200,
) {
  return useMemo(() => ({
    items:          tenants,
    itemHeight,
    containerHeight,
    keyExtractor:   (t: T, i: number) => `${t.id}-${i}`,
    // cspell:disable-next-line
    overscanCount:  3,
  }), [tenants, containerHeight, itemHeight]);
}

export function useTeamGridVirtualization(
  members:         readonly BaseEntity[],
  containerWidth:  number,
  containerHeight: number,
  cardWidth  = 250,
  cardHeight = 300,
) {
  return useMemo(() => ({
    items:          members,
    itemWidth:      cardWidth,
    itemHeight:     cardHeight,
    containerWidth,
    containerHeight,
    gap:            24,
    keyExtractor:   (m: BaseEntity, i: number) => `${m.id ?? i}`,
    // cspell:disable-next-line
    overscanCount:  1,
  }), [members, containerWidth, containerHeight, cardWidth, cardHeight]);
}

// ---------------------------------------------------------------------------
// 2. Lazy Image Hook
// ---------------------------------------------------------------------------

export function useLazyImage(src: string, placeholder = '') {
  const [imageSrc, setImageSrc]   = useState(placeholder);
  const [isLoaded, setIsLoaded]   = useState(false);
  const [hasError, setHasError]   = useState(false);
  const imgRef                    = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    imgRef.current = img;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };
    img.onerror = () => {
      setIsLoaded(false);
      setHasError(true);
    };
    img.src = src;

    return () => {
      if (imgRef.current) {
        imgRef.current.onload  = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  return { imageSrc, isLoaded, hasError };
}

// ---------------------------------------------------------------------------
// 3. Memory-Safe State Hook with History Management
// ---------------------------------------------------------------------------

export function useMemorySafeState<T>(initialState: T, maxHistorySize = 10) {
  const [state,        setState]        = useState(initialState);
  const [history,      setHistory]      = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prevState)
        : newState;

      setHistory((prev) => {
        const next = [...prev.slice(0, historyIndex + 1), nextState];
        return next.length > maxHistorySize ? next.slice(-maxHistorySize) : next;
      });
      setHistoryIndex((idx) => Math.min(idx + 1, maxHistorySize - 1));

      return nextState;
    });
  }, [historyIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      if (prev !== undefined) {
        setHistoryIndex((i) => i - 1);
        setState(prev);
      }
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      if (next !== undefined) {
        setHistoryIndex((i) => i + 1);
        setState(next);
      }
    }
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setHistoryIndex(0);
  }, [state]);

  return {
    state,
    updateState,
    undo,
    redo,
    clearHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}

// ---------------------------------------------------------------------------
// 4. Debounced State Hook
// ---------------------------------------------------------------------------

export function useDebouncedState<T>(initialValue: T, delay = 300) {
  const [value,         setValue]         = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef                           = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  // Dedicated unmount cleanup
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  return [value, debouncedValue, setValue] as const;
}

// ---------------------------------------------------------------------------
// 5. Intersection Observer Hook
// ---------------------------------------------------------------------------

export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef    = useRef<HTMLElement>(null);
  const observerRef  = useRef<IntersectionObserver | null>(null);

  // Stringify options to prevent the object reference from causing re-runs.
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) setHasIntersected(true);
    }, { threshold: 0.1, ...options });

    observerRef.current.observe(target);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line
  }, [optionsKey]); // stable serialized key — options object reference changes every render

  return { targetRef, isIntersecting, hasIntersected };
}

// ---------------------------------------------------------------------------
// 6. Memory Usage Monitor
// ---------------------------------------------------------------------------

export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize:  number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const update = () => {
      const mem = (performance as Performance).memory;
      if (mem) setMemoryInfo({ ...mem });
    };
    update();
    const id = setInterval(update, 5_000);
    return () => clearInterval(id);
  }, []);

  const memoryUsagePercentage = useMemo(() =>
    memoryInfo ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100 : 0,
  [memoryInfo]);

  return {
    memoryInfo,
    memoryUsagePercentage,
    isMemoryAvailable: typeof performance !== 'undefined' && 'memory' in performance,
  };
}

// ---------------------------------------------------------------------------
// 7. Array Operations Hook — O(1) lookups via internal Map
// ---------------------------------------------------------------------------

export function useArrayOperations<T extends BaseEntity>(
  initialArray:  T[] = [],
  keyExtractor:  (item: T) => string | number,
) {
  const [items, setItems] = useState(initialArray);
  const mapRef            = useRef(new Map<string | number, T>());

  useEffect(() => {
    const m = new Map<string | number, T>();
    items.forEach((item) => m.set(keyExtractor(item), item));
    mapRef.current = m;
  }, [items, keyExtractor]);

  const addItem = useCallback((item: T) => {
    if (!mapRef.current.has(keyExtractor(item))) {
      setItems((prev) => [...prev, item]);
    }
  }, [keyExtractor]);

  const removeItem = useCallback((key: string | number) => {
    if (mapRef.current.has(key)) {
      setItems((prev) => prev.filter((item) => keyExtractor(item) !== key));
    }
  }, [keyExtractor]);

  const updateItem = useCallback((key: string | number, updated: T) => {
    if (mapRef.current.has(key)) {
      setItems((prev) => prev.map((item) => keyExtractor(item) === key ? updated : item));
    }
  }, [keyExtractor]);

  const findItem  = useCallback((key: string | number) => mapRef.current.get(key),  []);
  const hasItem   = useCallback((key: string | number) => mapRef.current.has(key),  []);
  const clearItems = useCallback(() => setItems([]), []);

  return { items, addItem, removeItem, updateItem, findItem, hasItem, clearItems, size: items.length };
}

// ---------------------------------------------------------------------------
// 8. Component Performance Monitor
// ---------------------------------------------------------------------------

/** @deprecated Use `useComponentPerformance` from `useComponentPerformance.tsx` for the full-featured version. */
export function useSimplePerformanceMonitor(componentName: string) {
  const renderCountRef       = useRef(0);
  const lastRenderTimeRef    = useRef(Date.now());
  const [metrics, setMetrics] = useState({
    renderCount:       0,
    averageRenderTime: 0,
    lastRenderDuration: 0,
  });

  useEffect(() => {
    renderCountRef.current += 1;
    const now      = Date.now();
    const duration = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    setMetrics((prev) => ({
      renderCount:        renderCountRef.current,
      lastRenderDuration: duration,
      averageRenderTime:  prev.averageRenderTime === 0
        ? duration
        : (prev.averageRenderTime + duration) / 2,
    }));

    if (process.env.NODE_ENV === 'development') {
      if (duration > 16) {
        // eslint-disable-next-line no-console
        console.warn(`${componentName} render took ${duration}ms (>16ms frame budget)`);
      }
      if (renderCountRef.current > 100 && renderCountRef.current % 50 === 0) {
        // eslint-disable-next-line no-console
        console.info(`${componentName} has rendered ${renderCountRef.current} times`);
      }
    }
  }, [componentName]);

  return metrics;
}

// ---------------------------------------------------------------------------
// 9. Generic Cleanup Manager
// ---------------------------------------------------------------------------

export function useCleanup() {
  const fnsRef = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((fn: () => void) => {
    fnsRef.current.push(fn);
  }, []);

  const runCleanup = useCallback(() => {
    fnsRef.current.forEach((fn) => {
      try { fn(); } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Cleanup error:', err);
      }
    });
    fnsRef.current = [];
  }, []);

  useEffect(() => () => runCleanup(), [runCleanup]);

  return { addCleanup, runCleanup };
}

// Backward-compatibility alias
export const useOptimizedArray = useArrayOperations;