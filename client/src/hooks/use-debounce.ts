/**
 * Enhanced debounce hooks with better performance and additional features
 */

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Configuration options for useDebouncedCallback.
 */
export interface DebounceOptions {
  /** Time in milliseconds to delay */
  wait: number;
  /** Whether to invoke on the leading edge of the timeout */
  leading?: boolean;
  /** Whether to invoke on the trailing edge of the timeout */
  trailing?: boolean;
  /** The maximum time func is allowed to be delayed before it's invoked */
  maxWait?: number;
}

/**
 * Debounced function type returned by the hook.
 */
export type DebouncedCallback<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * useDebouncedCallback
 *
 * @param callback - Function to debounce
 * @param options - Debounce configuration options
 * @returns Debounced version of the callback with cancel and flush methods
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions
): DebouncedCallback<T> {
  const { wait, leading = false, trailing = true, maxWait } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number | null>(null);
  const latestArgsRef = useRef<Parameters<T>>();
  const latestCallbackRef = useRef<T>(callback);

  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const invoke = useCallback(() => {
    if (!latestArgsRef.current) return;
    lastInvokeTimeRef.current = Date.now();
    latestCallbackRef.current(...latestArgsRef.current);
    latestArgsRef.current = undefined;
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isInvoking = leading && lastCallTimeRef.current === null;

      latestArgsRef.current = args;
      lastCallTimeRef.current = now;

      if (isInvoking) {
        invoke();
      }

      clearTimers();

      timeoutRef.current = setTimeout(() => {
        const timeSinceLastCall = Date.now() - (lastCallTimeRef.current ?? 0);
        const timeSinceLastInvoke =
          Date.now() - (lastInvokeTimeRef.current ?? 0);

        if (
          trailing &&
          (!leading ||
            timeSinceLastCall >= wait ||
            timeSinceLastInvoke >= (maxWait ?? Infinity))
        ) {
          invoke();
        }
      }, wait);
    },
    [invoke, leading, trailing, wait, maxWait]
  );

  const cancel = useCallback(() => {
    clearTimers();
    latestArgsRef.current = undefined;
    lastCallTimeRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimers();
      invoke();
    }
  }, [invoke]);

  return Object.assign(debounced, { cancel, flush });
}
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

interface UseDebounceOptions {
  /** Whether to call the debounced function immediately on the first call */
  leading?: boolean;
  /** Maximum time the debounced function can be delayed before it's invoked */
  maxWait?: number;
  /** Whether to call the debounced function after the delay has passed */
  trailing?: boolean;
}

interface UseDebounceResult<T> {
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
  options: UseDebounceOptions = {}
): UseDebounceResult<T> {
  const { leading = false, maxWait, trailing = true } = options;

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
  }, [
    value,
    delay,
    leading,
    trailing,
    maxWait,
    debouncedValue,
    isPending,
    updateDebouncedValue,
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
 * Simplified version of useDebounce that maintains backward compatibility
 * with the original API while still providing performance improvements
 */
export function useDebounceSimple<T>(value: T, delay?: number): T {
  const { debouncedValue } = useDebounce(value, delay);
  return debouncedValue;
}
