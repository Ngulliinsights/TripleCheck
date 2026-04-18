/**
 * Performance Optimization Hooks
 *
 * Covers: smart caching, lazy loading, debounce/throttle,
 * virtual scrolling, resource preloading, and per-component metrics.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { performanceMonitoring } from '../services/PerformanceService'

// ---------------------------------------------------------------------------
// Simple client-side cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value:  T;
  expiry: number;
}

const clientCache = new Map<string, CacheEntry<unknown>>();

const cacheService = {
  get<T>(key: string): T | null {
    const entry = clientCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) { clientCache.delete(key); return null; }
    return entry.value as T;
  },
  set<T>(key: string, value: T, ttlSeconds = 3_600): void {
    clientCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1_000 });
  },
  delete(key: string): void {
    clientCache.delete(key);
  },
};

function recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Perf] ${name}:`, value, metadata ?? '');
  }
}

// ---------------------------------------------------------------------------
// useCache
// ---------------------------------------------------------------------------

interface UseCacheOptions<T> {
  ttl?:                number;   // seconds
  enabled?:            boolean;
  staleWhileRevalidate?: boolean;
  onSuccess?:          (data: T) => void;
  onError?:            (error: Error) => void;
}

export function useCache<T>(
  key:      string,
  fetcher:  () => Promise<T>,
  options:  UseCacheOptions<T> = {},
) {
  const { enabled = true, staleWhileRevalidate = false, ttl = 3_600 } = options;

  const [data,      setData]      = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<Error | null>(null);
  const [isStale,   setIsStale]   = useState(false);

  // Stable refs for callbacks to prevent fetchData from changing identity
  const fetcherRef    = useRef(fetcher);
  const onSuccessRef  = useRef(options.onSuccess);
  const onErrorRef    = useRef(options.onError);
  useEffect(() => {
    fetcherRef.current   = fetcher;
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current   = options.onError;
  });

  const fetchData = useCallback(async (useStale = false) => {
    if (!enabled) return;

    const cached = cacheService.get<T>(key);
    if (cached !== null) {
      setData(cached);
      setError(null);
      if (!useStale) return cached;
      setIsStale(true);
    }

    if (cached === null || useStale) {
      setIsLoading(true);
      try {
        performanceMonitoring.mark(`fetch_${key}_start`);
        const fresh = await fetcherRef.current();
        performanceMonitoring.mark(`fetch_${key}_end`);
        performanceMonitoring.measureTiming(`fetch_${key}`, `fetch_${key}_start`, `fetch_${key}_end`);

        cacheService.set(key, fresh, ttl);
        setData(fresh);
        setError(null);
        setIsStale(false);
        onSuccessRef.current?.(fresh);
        return fresh;
      } catch (err) {
        const e = err as Error;
        setError(e);
        onErrorRef.current?.(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    }
  }, [key, enabled, ttl]);

  const invalidate = useCallback(() => {
    cacheService.delete(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  const refetch = useCallback(() => { invalidate(); return fetchData(); }, [invalidate, fetchData]);

  useEffect(() => {
    if (enabled) fetchData(staleWhileRevalidate);
  }, [fetchData, enabled, staleWhileRevalidate]);

  return { data, isLoading, error, isStale, refetch, invalidate };
}

// ---------------------------------------------------------------------------
// useLazyLoading (IntersectionObserver)
// ---------------------------------------------------------------------------

interface UseLazyLoadingOptions {
  threshold?:   number;
  rootMargin?:  string;
  triggerOnce?: boolean;
}

export function useLazyLoading(options: UseLazyLoadingOptions = {}) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;
  const [isVisible,    setIsVisible]    = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef  = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || (triggerOnce && hasTriggered)) return;
      setIsVisible(true);
      setHasTriggered(true);
      recordMetric('lazy_load', Date.now(), { element: el.tagName.toLowerCase() });
      if (triggerOnce) observerRef.current?.unobserve(el);
    }, { threshold, rootMargin });

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { elementRef, isVisible, hasTriggered };
}

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// useThrottle
// ---------------------------------------------------------------------------

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay:    number,
): T {
  const lastRun = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args) => {
      const now  = Date.now();
      const wait = delay - (now - lastRun.current);
      if (wait <= 0) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, wait);
      }
    }) as T,
    [callback, delay],
  );
}

// ---------------------------------------------------------------------------
// usePerformanceMonitoring
// ---------------------------------------------------------------------------

export function usePerformanceMonitoring(componentName: string) {
  const mountTimeRef  = useRef<number>();
  const renderTimeRef = useRef(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
    recordMetric(`mount_${componentName}`, mountTimeRef.current - renderTimeRef.current, { component: componentName });
    return () => {
      if (mountTimeRef.current)
        recordMetric(`lifetime_${componentName}`, Date.now() - mountTimeRef.current, { component: componentName });
    };
  }, [componentName]);

  const measureRender = useCallback(() => { renderTimeRef.current = Date.now(); }, []);

  const recordCustomMetric = useCallback(
    (name: string, value: number, tags?: Record<string, string>) =>
      recordMetric(`${componentName}_${name}`, value, { component: componentName, ...tags }),
    [componentName],
  );

  return { measureRender, recordCustomMetric };
}

// ---------------------------------------------------------------------------
// useExpensiveMemo — memoised computation with optional cache persistence
// ---------------------------------------------------------------------------

export function useExpensiveMemo<T>(
  factory:  () => T,
  deps:     React.DependencyList,
  cacheKey?: string,
): T {
  return useMemo(() => {
    if (cacheKey) {
      const cached = cacheService.get<T>(cacheKey);
      if (cached !== null) return cached;
    }

    const result = factory();
    if (cacheKey) cacheService.set(cacheKey, result, 300); // 5 minutes
    return result;
    // eslint-disable-next-line
  }, deps);
}

// ---------------------------------------------------------------------------
// useVirtualScrolling
// ---------------------------------------------------------------------------

export function useVirtualScrolling<T>(
  items:           T[],
  itemHeight:      number,
  containerHeight: number,
  // cspell: disable-next-line
  overscan = 5,
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    // cspell:disable-next-line
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end   = Math.min(
      items.length - 1,
      // cspell:disable-next-line
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end + 1).map((item, i) => ({
      item, index: visibleRange.start + i,
    })),
    [items, visibleRange],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
    [],
  );

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    offsetY:     visibleRange.start * itemHeight,
    handleScroll,
  };
}

// ---------------------------------------------------------------------------
// usePreloader
// ---------------------------------------------------------------------------

export function usePreloader() {
  const [loaded,  setLoaded]  = useState(new Set<string>());
  const [loading, setLoading] = useState(new Set<string>());

  const preload = useCallback(
    (src: string, type: 'image' | 'script'): Promise<void> => {
      if (loaded.has(src) || loading.has(src)) return Promise.resolve();

      setLoading((prev) => new Set(prev).add(src));

      return new Promise((resolve, reject) => {
        const el = type === 'image' ? new Image() : document.createElement('script');

        const finish = (ok: boolean) => {
          setLoading((prev) => { const s = new Set(prev); s.delete(src); return s; });
          if (ok) {
            setLoaded((prev) => new Set(prev).add(src));
            recordMetric(`${type}_preload_ok`, Date.now(), { src });
            resolve();
          } else {
            recordMetric(`${type}_preload_err`, Date.now(), { src });
            reject(new Error(`Failed to preload ${type}: ${src}`));
          }
        };

        el.onload  = () => finish(true);
        el.onerror = () => finish(false);

        if (type === 'image') {
          (el as HTMLImageElement).src = src;
        } else {
          (el as HTMLScriptElement).src = src;
          document.head.appendChild(el);
        }
      });
    },
    [loaded, loading],
  );

  const preloadImage  = useCallback((src: string) => preload(src, 'image'),  [preload]);
  const preloadScript = useCallback((src: string) => preload(src, 'script'), [preload]);

  return {
    preloadImage,
    preloadScript,
    loadedResources:  Array.from(loaded),
    loadingResources: Array.from(loading),
    isLoaded:         (src: string) => loaded.has(src),
    isLoading:        (src: string) => loading.has(src),
  };
}