import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Safe state hook that prevents state updates after component unmount
 * to avoid memory leaks and React warnings
 */
export function useSafeState<T>(
  initialState: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialState);
  const isMountedRef = useRef(true);

  // Safe setState that only updates if component is mounted
  const safeSetState = useCallback((value: SetStateAction<T>) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  // Set up cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [state, safeSetState];
}