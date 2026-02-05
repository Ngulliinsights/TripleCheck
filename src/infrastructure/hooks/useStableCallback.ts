import { useCallback, useRef, useEffect } from 'react'

/**
 * Stable callback hook that prevents unnecessary re-renders
 * by maintaining a stable reference while keeping the latest callback
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  // Update the ref with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return a stable callback that calls the latest version
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}