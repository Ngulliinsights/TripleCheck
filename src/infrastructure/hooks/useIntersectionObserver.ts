/**
 * INTERSECTION OBSERVER HOOK
 * ==========================
 * 
 * Custom hook for intersection observer-based lazy loading with configurable thresholds.
 * Provides efficient viewport detection for image loading optimization.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

export interface IntersectionObserverResult {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  ref: (element: Element | null) => void;
}

/**
 * Custom hook for intersection observer functionality
 * 
 * @param options - Configuration options for the intersection observer
 * @returns Object containing intersection state and ref callback
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): IntersectionObserverResult {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    skip = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback to set the element reference
  const setRef = useCallback((element: Element | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
    
    elementRef.current = element;
    
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  useEffect(() => {
    if (skip || !window?.IntersectionObserver) {
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setEntry(entry);
        
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          
          // If triggerOnce is true, stop observing after first intersection
          if (triggerOnce && elementRef.current) {
            observerRef.current?.unobserve(elementRef.current);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    // Observe current element if it exists
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, skip]);

  return {
    isIntersecting,
    entry,
    ref: setRef
  };
}

/**
 * Hook specifically for lazy loading images
 * Provides optimized defaults for image loading scenarios
 */
export function useLazyImageLoading(options: Omit<IntersectionObserverOptions, 'triggerOnce'> = {}) {
  return useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Start loading images 100px before they enter viewport
    triggerOnce: true,
    ...options
  });
}

/**
 * Hook for detecting when an element enters the viewport
 * Useful for animations and progressive loading
 */
export function useViewportEntry(options: IntersectionObserverOptions = {}) {
  return useIntersectionObserver({
    threshold: 0.3,
    rootMargin: '0px',
    triggerOnce: false,
    ...options
  });
}