import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Enhanced debounce hook with race condition protection and performance optimizations
 *
 * This hook delays updating the returned value until after the specified delay period
 * has passed without the input value changing. Perfect for search inputs, API calls,
 * and other scenarios where you want to wait for user input to stabilize.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Clear any existing timeout to prevent stale updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout with mounted check to prevent memory leaks
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setDebouncedValue(value);
      }
    }, delay);

    // Cleanup function runs on dependency change and unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  // Track mount status and cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Debounced callback hook with enhanced type safety and performance optimizations
 *
 * This hook creates a debounced version of your callback function. The callback
 * will only execute after the specified delay has passed since the last call.
 * The callback reference is kept stable to prevent unnecessary re-renders.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  // Keep callback reference fresh without affecting memoization
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Memoize the debounced function with only delay as dependency
  // This prevents unnecessary re-creations when callback changes
  const debouncedCallback = useCallback(
    (...args: Parameters<T>): void => {
      // Clear any pending execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule new execution with mount check
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          callbackRef.current(...args);
        }
      }, delay);
    },
    [delay] // Only delay affects the memoization, not the callback itself
  ) as T;

  // Mount tracking and cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttle hook for performance-sensitive operations with improved timing accuracy
 *
 * Unlike debouncing which delays execution, throttling ensures the value updates
 * at most once per time interval. This is ideal for scroll handlers, resize events,
 * and other high-frequency operations where you need regular updates but want to
 * limit the rate.
 *
 * @param value - The value to throttle
 * @param limit - Minimum time between updates in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (timeSinceLastExecution >= limit) {
      // Enough time has passed, update immediately
      if (mountedRef.current) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    } else {
      // Not enough time has passed, schedule update for later
      const remainingTime = limit - timeSinceLastExecution;
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setThrottledValue(value);
          lastExecuted.current = Date.now();
        }
      }, remainingTime);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, limit]);

  // Mount tracking and cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledValue;
}

/**
 * Advanced throttled callback hook with leading and trailing edge options
 *
 * This provides more control over when the throttled function executes:
 * - leading: true means execute immediately on first call
 * - trailing: true means execute once more after the throttle period
 *
 * @param callback - The function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @param options - Configuration for leading/trailing execution
 * @returns A throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {
    leading: true,
    trailing: true,
  }
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTime = useRef<number>(0);
  const lastArgs = useRef<Parameters<T>>();
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  // Keep callback reference fresh
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>): void => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;
      lastArgs.current = args;

      // Clear existing timeout to prevent multiple scheduled executions
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If this is the first call or enough time has passed, execute immediately (leading edge)
      if (
        options.leading &&
        (lastCallTime.current === 0 || timeSinceLastCall >= delay)
      ) {
        if (mountedRef.current) {
          lastCallTime.current = now;
          callbackRef.current(...args);
        }
        return;
      }

      // Schedule trailing execution if enabled
      if (options.trailing && mountedRef.current) {
        const remainingTime = delay - timeSinceLastCall;
        const timeoutDelay = remainingTime > 0 ? remainingTime : delay;

        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current && lastArgs.current) {
            lastCallTime.current = Date.now();
            callbackRef.current(...lastArgs.current);
          }
          timeoutRef.current = null;
        }, timeoutDelay);
      }
    },
    [delay, options.leading, options.trailing]
  ) as T;

  // Mount tracking and cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return throttledCallback;
}
