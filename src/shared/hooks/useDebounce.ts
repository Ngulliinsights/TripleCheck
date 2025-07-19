import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuration options for debounce hooks
 */
interface UseDebounceOptions {
  delay?: number;
  leading?: boolean; // Execute immediately on first call
  trailing?: boolean; // Execute after delay (default behavior)
  maxWait?: number; // Maximum time to wait before forcing execution
}

interface UseDebouncedValueOptions extends UseDebounceOptions {
  equalityFn?: (prev: any, next: any) => boolean;
}

/**
 * Debounced callback type with utility methods
 */
export type DebouncedCallback<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

/**
 * Enhanced debounce hook for callbacks with leading/trailing edge control and max wait
 * Critical for search inputs, form validation, and API calls
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebounceOptions = {}
): DebouncedCallback<T> {
  const {
    delay = 300,
    leading = false,
    trailing = true,
    maxWait,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T>>();
  const resultRef = useRef<ReturnType<T>>();
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invokeCallback = useCallback(() => {
    const args = argsRef.current;
    if (args) {
      lastInvokeTimeRef.current = Date.now();
      resultRef.current = callbackRef.current(...args);
      return resultRef.current;
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
    const isInvoking = leading && (lastCallTimeRef.current === 0 || timeSinceLastInvoke >= delay);

    lastCallTimeRef.current = now;
    argsRef.current = args;

    // Leading edge execution
    if (isInvoking) {
      const result = invokeCallback();
      if (!trailing) {
        return result;
      }
    }

    // Clear existing timeouts
    clearTimers();

    // Set up trailing edge execution
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        invokeCallback();
      }, delay);
    }

    // Set up max wait execution
    if (maxWait && timeSinceLastInvoke < maxWait) {
      maxTimeoutRef.current = setTimeout(() => {
        invokeCallback();
      }, maxWait - timeSinceLastInvoke);
    }

    return resultRef.current;
  }, [delay, leading, trailing, maxWait, invokeCallback, clearTimers]);

  // Cancel function
  const cancel = useCallback(() => {
    clearTimers();
    lastCallTimeRef.current = 0;
    lastInvokeTimeRef.current = 0;
    argsRef.current = undefined;
  }, [clearTimers]);

  // Flush function
  const flush = useCallback(() => {
    if (timeoutRef.current || maxTimeoutRef.current) {
      clearTimers();
      return invokeCallback();
    }
    return resultRef.current;
  }, [invokeCallback, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Attach utility methods to the debounced function
  const enhancedCallback = debouncedCallback as DebouncedCallback<T>;
  enhancedCallback.cancel = cancel;
  enhancedCallback.flush = flush;

  return enhancedCallback;
}

/**
 * Legacy alias for backward compatibility
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebounceOptions = {}
): DebouncedCallback<T> {
  return useDebouncedCallback(callback, options);
}

/**
 * Enhanced debounced value hook with better performance and additional features
 * Returns the debounced value with utility functions for control
 */
interface UseDebounceValueResult<T> {
  /** The debounced value */
  debouncedValue: T;
  /** Whether the debounce is currently pending */
  isPending: boolean;
  /** Immediately flush the debounced value (skip the delay) */
  flush: () => void;
  /** Cancel the pending debounced update */
  cancel: () => void;
}

export function useDebouncedValue<T>(
  value: T,
  delay: number = 500,
  options: UseDebouncedValueOptions = {}
): UseDebounceValueResult<T> {
  const { leading = false, maxWait, trailing = true, equalityFn = (prev, next) => prev === next } = options;

  // State to hold the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // State to track if debounce is pending
  const [isPending, setIsPending] = useState<boolean>(false);

  // Refs to persist values across renders without causing re-renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<T>(value);
  const hasLeadingCallRef = useRef<boolean>(false);

  // Function to actually update the debounced value
  const updateDebouncedValue = useCallback((newValue: T) => {
    setDebouncedValue(newValue);
    setIsPending(false);
    hasLeadingCallRef.current = false;
  }, []);

  // Function to cancel all pending timeouts
  const cancelTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  // Flush function to immediately update the debounced value
  const flush = useCallback(() => {
    if (timeoutRef.current || maxTimeoutRef.current) {
      cancelTimeouts();
      updateDebouncedValue(lastArgsRef.current);
    }
  }, [cancelTimeouts, updateDebouncedValue]);

  // Cancel function to cancel pending updates
  const cancel = useCallback(() => {
    cancelTimeouts();
    setIsPending(false);
    hasLeadingCallRef.current = false;
  }, [cancelTimeouts]);

  useEffect(() => {
    // Update the stored arguments
    lastArgsRef.current = value;

    // If the value hasn't actually changed, don't do anything
    // This prevents unnecessary debounce cycles for reference equality
    if (equalityFn(value, debouncedValue) && !isPending) {
      return;
    }

    const currentTime = Date.now();
    lastCallTimeRef.current = currentTime;

    // Handle leading edge execution
    if (leading && !hasLeadingCallRef.current && !isPending) {
      hasLeadingCallRef.current = true;
      updateDebouncedValue(value);

      // If we're not doing trailing execution, we're done
      if (!trailing) {
        return;
      }
    }

    // Set pending state if we haven't already
    if (!isPending) {
      setIsPending(true);
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up the trailing execution timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        updateDebouncedValue(value);
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, delay);
    }

    // Handle maxWait functionality
    if (maxWait && maxWait > 0) {
      // Clear existing maxWait timeout
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }

      // Set up maxWait timeout
      maxTimeoutRef.current = setTimeout(() => {
        updateDebouncedValue(value);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, maxWait);
    }

    // Cleanup function
    return () => {
      // Don't clear timeouts in cleanup - let them complete naturally
      // This prevents issues with StrictMode and fast updates
    };
  }, [
    value,
    delay,
    leading,
    trailing,
    maxWait,
    debouncedValue,
    isPending,
    updateDebouncedValue,
    equalityFn,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelTimeouts();
    };
  }, [cancelTimeouts]);

  return {
    debouncedValue,
    isPending,
    flush,
    cancel,
  };
}

/**
 * Simplified version that maintains backward compatibility
 * Returns [debouncedValue, isPending] tuple for legacy usage
 */
export function useDebouncedValueSimple<T>(
  value: T,
  delay?: number,
  options?: UseDebouncedValueOptions
): [T, boolean] {
  const { debouncedValue, isPending } = useDebouncedValue(value, delay, options);
  return [debouncedValue, isPending];
}

/**
 * Debounced search hook specifically for search inputs
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 300
): [string, boolean, () => void] {
  const { debouncedValue: debouncedTerm, isPending } = useDebouncedValue(searchTerm, delay, {
    equalityFn: (prev, next) => prev.trim().toLowerCase() === next.trim().toLowerCase(),
  });

  const clearSearch = useCallback(() => {
    // This would need to be handled by the parent component
    // by setting the search term to empty string
  }, []);

  return [debouncedTerm, isPending, clearSearch];
}

/**
 * Debounced API call hook
 */
export function useDebouncedApiCall<TData, TParams extends any[]>(
  apiCall: (...params: TParams) => Promise<TData>,
  delay: number = 500
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedApiCall = useDebounce(
    async (...params: TParams) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall(...params);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('API call failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    { delay, trailing: true }
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    (debouncedApiCall as any).cancel();
  }, [debouncedApiCall]);

  return {
    data,
    loading,
    error,
    execute: debouncedApiCall,
    reset,
    cancel: (debouncedApiCall as any).cancel,
    flush: (debouncedApiCall as any).flush,
  };
}

/**
 * Property search debounced hook
 */
export function useDebouncedPropertySearch() {
  return useDebouncedApiCall(
    async (searchParams: {
      query?: string;
      location?: string;
      priceMin?: number;
      priceMax?: number;
      propertyType?: string;
      bedrooms?: number;
      bathrooms?: number;
    }) => {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/properties/search?${params}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return response.json();
    },
    400 // Slightly longer delay for complex searches
  );
}

/**
 * User search debounced hook
 */
export function useDebouncedUserSearch() {
  return useDebouncedApiCall(
    async (query: string) => {
      if (!query.trim()) return [];

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`User search failed: ${response.statusText}`);
      }

      return response.json();
    },
    250 // Faster for user searches
  );
}