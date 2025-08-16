/**
 * Performance Optimization Hooks
 * React hooks for caching, lazy loading, and performance monitoring
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cacheService } from '../services/CacheService';
import { performanceService } from '../services/PerformanceService';

/**
 * Hook for intelligent caching with React Query-like interface
 */
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    staleWhileRevalidate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const { enabled = true, staleWhileRevalidate = false } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (useStale = false) => {
    if (!enabled) return;

    // Check cache first
    const cachedData = cacheService.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      setError(null);
      
      if (!useStale) {
        return cachedData;
      } else {
        setIsStale(true);
      }
    }

    if (!cachedData || useStale) {
      setIsLoading(true);
      
      try {
        const freshData = await performanceService.measureAsync(
          `cache_fetch_${key}`,
          fetcherRef.current
        );
        
        // Cache the fresh data
        cacheService.set(key, freshData, {
          ttl: options.ttl,
          tags: options.tags
        });
        
        setData(freshData);
        setError(null);
        setIsStale(false);
        options.onSuccess?.(freshData);
        
        return freshData;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  }, [key, enabled, options]);

  const invalidate = useCallback(() => {
    cacheService.delete(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  const refetch = useCallback(() => {
    invalidate();
    return fetchData();
  }, [invalidate, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(staleWhileRevalidate);
    }
  }, [fetchData, enabled, staleWhileRevalidate]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch,
    invalidate
  };
};

/**
 * Hook for lazy loading with intersection observer
 */
export const useLazyLoading = (
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsVisible(true);
          setHasTriggered(true);
          
          performanceService.recordMetric(
            'lazy_load_triggered',
            Date.now(),
            'custom',
            { element: element.tagName.toLowerCase() }
          );
          
          if (triggerOnce) {
            observerRef.current?.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isVisible,
    hasTriggered
  };
};

/**
 * Hook for debounced values to optimize performance
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttled callbacks
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (Date.now() - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef(Date.now());
  const mountTime = useRef<number>();

  useEffect(() => {
    // Record mount time
    mountTime.current = Date.now();
    const mountDuration = mountTime.current - renderStartTime.current;
    
    performanceService.recordMetric(
      `component_mount_${componentName}`,
      mountDuration,
      'custom',
      { component: componentName }
    );

    return () => {
      // Record unmount time
      if (mountTime.current) {
        const unmountDuration = Date.now() - mountTime.current;
        performanceService.recordMetric(
          `component_lifetime_${componentName}`,
          unmountDuration,
          'custom',
          { component: componentName }
        );
      }
    };
  }, [componentName]);

  const measureRender = useCallback(() => {
    renderStartTime.current = Date.now();
  }, []);

  const recordCustomMetric = useCallback((name: string, value: number, tags?: Record<string, string>) => {
    performanceService.recordMetric(
      `${componentName}_${name}`,
      value,
      'custom',
      { component: componentName, ...tags }
    );
  }, [componentName]);

  return {
    measureRender,
    recordCustomMetric
  };
};

/**
 * Hook for memoized expensive calculations
 */
export const useExpensiveMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T => {
  const memoizedValue = useMemo(() => {
    const startTime = Date.now();
    
    // Check cache if key provided
    if (cacheKey) {
      const cached = cacheService.get<T>(cacheKey);
      if (cached) {
        performanceService.recordMetric(
          'expensive_memo_cache_hit',
          Date.now() - startTime,
          'custom',
          { cacheKey }
        );
        return cached;
      }
    }

    // Calculate value
    const result = factory();
    const duration = Date.now() - startTime;
    
    // Cache result if key provided
    if (cacheKey) {
      cacheService.set(cacheKey, result, {
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['expensive_memo']
      });
    }

    performanceService.recordMetric(
      'expensive_memo_calculation',
      duration,
      'custom',
      { cacheKey: cacheKey || 'no_cache', cached: false }
    );

    return result;
  }, deps);

  return memoizedValue;
};

/**
 * Hook for virtual scrolling optimization
 */
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

/**
 * Hook for preloading resources
 */
export const usePreloader = () => {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());

  const preloadImage = useCallback(async (src: string): Promise<void> => {
    if (loadedResources.has(src) || loadingResources.has(src)) {
      return;
    }

    setLoadingResources(prev => new Set(prev).add(src));

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedResources(prev => new Set(prev).add(src));
        setLoadingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        
        performanceService.recordMetric(
          'image_preload_success',
          Date.now(),
          'custom',
          { src }
        );
        
        resolve();
      };
      
      img.onerror = () => {
        setLoadingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        
        performanceService.recordMetric(
          'image_preload_error',
          Date.now(),
          'custom',
          { src }
        );
        
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      img.src = src;
    });
  }, [loadedResources, loadingResources]);

  const preloadScript = useCallback(async (src: string): Promise<void> => {
    if (loadedResources.has(src) || loadingResources.has(src)) {
      return;
    }

    setLoadingResources(prev => new Set(prev).add(src));

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      script.onload = () => {
        setLoadedResources(prev => new Set(prev).add(src));
        setLoadingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        
        performanceService.recordMetric(
          'script_preload_success',
          Date.now(),
          'custom',
          { src }
        );
        
        resolve();
      };
      
      script.onerror = () => {
        setLoadingResources(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        
        performanceService.recordMetric(
          'script_preload_error',
          Date.now(),
          'custom',
          { src }
        );
        
        reject(new Error(`Failed to preload script: ${src}`));
      };
      
      script.src = src;
      document.head.appendChild(script);
    });
  }, [loadedResources, loadingResources]);

  return {
    preloadImage,
    preloadScript,
    loadedResources: Array.from(loadedResources),
    loadingResources: Array.from(loadingResources),
    isLoaded: (src: string) => loadedResources.has(src),
    isLoading: (src: string) => loadingResources.has(src)
  };
};