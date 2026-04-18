import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debounce hook with race-condition protection.
 *
 * Delays updating the returned value until after `delay` ms has elapsed
 * without the input changing. Ideal for search inputs and API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Track mount / unmount once; inner effect handles value changes
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------

/**
 * Debounced callback hook with a stable function reference.
 *
 * The returned callback only fires after `delay` ms has elapsed since the
 * most recent call. The callback reference is intentionally kept stable so
 * it can be passed as a prop or used in dependency arrays without triggering
 * extra re-renders.
 *
 * @param callback - The function to debounce
 * @param delay    - Delay in milliseconds
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  // Track mount / unmount; keep callback ref fresh
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => { callbackRef.current = callback; }, [callback]);

  return useCallback(
    (...args: Parameters<T>): void => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) callbackRef.current(...args);
      }, delay);
    },
    [delay] // callback changes don't need to recreate the debounced wrapper
  );
}

// ---------------------------------------------------------------------------

/**
 * Throttle hook for high-frequency values (scroll, resize, etc.).
 *
 * Unlike debounce, throttle guarantees at least one update per `limit` ms.
 *
 * @param value - The value to throttle
 * @param limit - Minimum ms between updates
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const now = Date.now();
    const elapsed = now - lastExecuted.current;

    if (elapsed >= limit) {
      if (mountedRef.current) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    } else {
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setThrottledValue(value);
          lastExecuted.current = Date.now();
        }
      }, limit - elapsed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, limit]);

  return throttledValue;
}

// ---------------------------------------------------------------------------

/**
 * Throttled callback hook with leading- and trailing-edge options.
 *
 * @param callback - The function to throttle
 * @param delay    - Minimum ms between executions
 * @param options  - `leading` (fire on first call) and `trailing` (fire once after the period)
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTime = useRef(0);
  const lastArgs = useRef<Parameters<T>>();
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => { callbackRef.current = callback; }, [callback]);

  return useCallback(
    (...args: Parameters<T>): void => {
      const now = Date.now();
      const elapsed = now - lastCallTime.current;
      lastArgs.current = args;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (options.leading && (lastCallTime.current === 0 || elapsed >= delay)) {
        if (mountedRef.current) {
          lastCallTime.current = now;
          callbackRef.current(...args);
        }
        return;
      }

      if (options.trailing && mountedRef.current) {
        const wait = elapsed < delay ? delay - elapsed : delay;
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current && lastArgs.current) {
            lastCallTime.current = Date.now();
            callbackRef.current(...lastArgs.current);
          }
          timeoutRef.current = null;
        }, wait);
      }
    },
    [delay, options.leading, options.trailing]
  );
}