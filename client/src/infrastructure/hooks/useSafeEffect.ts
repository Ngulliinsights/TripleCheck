import { useEffect, useRef, DependencyList, EffectCallback } from 'react'

/**
 * Safe effect hook that prevents memory leaks and race conditions
 * by automatically cleaning up effects when component unmounts
 */
export function useSafeEffect(
  effect: EffectCallback,
  deps?: DependencyList
): void {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    // Only run effect if component is still mounted
    if (!isMountedRef.current) return;

    // Store cleanup function
    cleanupRef.current = effect();

    // Return cleanup function that checks mount status
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
}