import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Enhanced debounce hook with better performance and additional features
 * 
 * The debounce pattern delays the execution of a function until after a specified
 * time has passed since the last time it was invoked. This is particularly useful
 * for search inputs, API calls, and other scenarios where you want to avoid
 * excessive function calls.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @param options - Additional configuration options
 * @returns Object containing the debounced value and utility functions
 */

interface DebounceOptions {
  /** Whether to call the debounced function immediately on the first call */
  leading?: boolean;
  /** Maximum time the debounced function can be delayed before it's invoked */
  maxWait?: number;
  /** Whether to call the debounced function after the delay has passed */
  trailing?: boolean;
}

interface DebounceResult<T> {
  /** The debounced value */
  debouncedValue: T;
  /** Whether the debounce is currently pending */
  isPending: boolean;
  /** Immediately flush the debounced value (skip the delay) */
  flush: () => void;
  /** Cancel the pending debounced update */
  cancel: () => void;
}

export function useDebounce<T>(
  value: T,
  delay: number = 500,
  options: DebounceOptions = {}
): DebounceResult<T> {
  const {
    leading = false,
    maxWait,
    trailing = true,
  } = options;

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
    if (value === debouncedValue && !isPending) {
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
  }, [value, delay, leading, trailing, maxWait, debouncedValue, isPending, updateDebouncedValue]);

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
 * Simplified version of useDebounce that maintains backward compatibility
 * with the original API while still providing performance improvements
 */
export function useDebounceSimple<T>(value: T, delay?: number): T {
  const { debouncedValue } = useDebounce(value, delay);
  return debouncedValue;
}

/**
 * Hook specifically optimized for debouncing callback functions
 * This is useful when you want to debounce a function call rather than a value
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  const argsRef = useRef<Parameters<T>>();

  // Keep the callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      cancel();
      callbackRef.current(...argsRef.current);
    }
  }, [cancel]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      cancel();
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  ) as T & { cancel: () => void; flush: () => void };

  // Attach utility methods
  debouncedCallback.cancel = cancel;
  debouncedCallback.flush = flush;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return debouncedCallback;
}