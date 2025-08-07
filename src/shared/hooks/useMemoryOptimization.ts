/**
 * Memory Optimization Hooks
 * Collection of hooks for optimizing memory usage in React components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ------------------------------------------------------------------
// 1. Virtualization Hook for Large Lists
// ------------------------------------------------------------------
interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualization = <T>(
  items: T[],
  options: VirtualizationOptions
) => {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(items.length - 1, visibleEnd + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

// ------------------------------------------------------------------
// 2. Pagination Hook
// ------------------------------------------------------------------
interface PaginationOptions {
  itemsPerPage: number;
  totalItems: number;
}

export const usePagination = <T>(
  items: T[],
  options: PaginationOptions
) => {
  const { itemsPerPage, totalItems } = options;
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  };
};

// ------------------------------------------------------------------
// 3. Lazy Loading Hook for Images
// ------------------------------------------------------------------
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>();

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = src;

    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  return { imageSrc, isLoaded, hasError };
};

// ------------------------------------------------------------------
// 4. Memory-Safe State Hook
// ------------------------------------------------------------------
export const useMemorySafeState = <T>(
  initialState: T,
  maxHistorySize: number = 10
) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState;

      // Update history with size limit
      setHistory(prevHistory => {
        const newHistory = [...prevHistory.slice(0, historyIndex + 1), nextState];
        return newHistory.length > maxHistorySize 
          ? newHistory.slice(-maxHistorySize)
          : newHistory;
      });

      setHistoryIndex(prevIndex => 
        Math.min(prevIndex + 1, maxHistorySize - 1)
      );

      return nextState;
    });
  }, [historyIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
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
};

// ------------------------------------------------------------------
// 5. Debounced State Hook with Cleanup
// ------------------------------------------------------------------
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, setValue] as const;
};

// ------------------------------------------------------------------
// 6. Intersection Observer Hook for Lazy Loading
// ------------------------------------------------------------------
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
};

// ------------------------------------------------------------------
// 7. Memory Usage Monitor Hook
// ------------------------------------------------------------------
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const {memory} = (performance as any);
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercentage = useMemo(() => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  }, [memoryInfo]);

  return {
    memoryInfo,
    memoryUsagePercentage,
    isMemoryAvailable: 'memory' in performance,
  };
};

// ------------------------------------------------------------------
// 8. Optimized Array Operations Hook
// ------------------------------------------------------------------
export const useOptimizedArray = <T>(
  initialArray: T[] = [],
  keyExtractor: (item: T) => string | number
) => {
  const [items, setItems] = useState(initialArray);
  const itemsMapRef = useRef(new Map<string | number, T>());

  // Update map when items change
  useEffect(() => {
    const newMap = new Map<string | number, T>();
    items.forEach(item => {
      newMap.set(keyExtractor(item), item);
    });
    itemsMapRef.current = newMap;
  }, [items, keyExtractor]);

  const addItem = useCallback((item: T) => {
    const key = keyExtractor(item);
    if (!itemsMapRef.current.has(key)) {
      setItems(prev => [...prev, item]);
    }
  }, [keyExtractor]);

  const removeItem = useCallback((key: string | number) => {
    if (itemsMapRef.current.has(key)) {
      setItems(prev => prev.filter(item => keyExtractor(item) !== key));
    }
  }, [keyExtractor]);

  const updateItem = useCallback((key: string | number, updatedItem: T) => {
    if (itemsMapRef.current.has(key)) {
      setItems(prev => prev.map(item => 
        keyExtractor(item) === key ? updatedItem : item
      ));
    }
  }, [keyExtractor]);

  const findItem = useCallback((key: string | number) => {
    return itemsMapRef.current.get(key);
  }, []);

  const hasItem = useCallback((key: string | number) => {
    return itemsMapRef.current.has(key);
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    findItem,
    hasItem,
    clearItems,
    size: items.length,
  };
};

// ------------------------------------------------------------------
// 9. Component Performance Monitor Hook
// ------------------------------------------------------------------
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderDuration: 0,
  });

  useEffect(() => {
    renderCountRef.current += 1;
    const currentTime = Date.now();
    const renderDuration = currentTime - lastRenderTimeRef.current;
    
    setPerformanceMetrics(prev => ({
      renderCount: renderCountRef.current,
      lastRenderDuration: renderDuration,
      averageRenderTime: prev.averageRenderTime === 0 
        ? renderDuration 
        : (prev.averageRenderTime + renderDuration) / 2,
    }));

    lastRenderTimeRef.current = currentTime;

    // Log performance warnings
    if (renderDuration > 16) { // More than one frame at 60fps
      console.warn(`${componentName} render took ${renderDuration}ms (>16ms)`);
    }

    if (renderCountRef.current > 100 && renderCountRef.current % 50 === 0) {
      console.info(`${componentName} has rendered ${renderCountRef.current} times`);
    }
  });

  return performanceMetrics;
};

// ------------------------------------------------------------------
// 10. Cleanup Hook for Event Listeners and Timers
// ------------------------------------------------------------------
export const useCleanup = () => {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      runCleanup();
    };
  }, [runCleanup]);

  return { addCleanup, runCleanup };
};