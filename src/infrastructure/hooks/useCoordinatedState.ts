import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Coordinated state hook that ensures atomic state updates and prevents race conditions
 * by coordinating multiple state updates and providing transaction-like behavior
 */
export function useCoordinatedState<T>(
  initialState: T | (() => T)
): [
  T,
  (updater: T | ((prev: T) => T)) => Promise<void>,
  {
    batch: (updates: Array<T | ((prev: T) => T)>) => Promise<void>;
    reset: () => void;
    isPending: boolean;
  }
] {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const isMountedRef = useRef(true);
  const updateQueueRef = useRef<Array<T | ((prev: T) => T)>>([]);
  const processingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Process queued updates atomically
  const processUpdates = useCallback(async () => {
    if (processingRef.current || !isMountedRef.current) return;
    
    processingRef.current = true;
    setIsPending(true);

    try {
      // Process all queued updates in a single batch
      const updates = [...updateQueueRef.current];
      updateQueueRef.current = [];

      if (updates.length > 0) {
        setState(currentState => {
          return updates.reduce<T>((acc, update) => {
            if (typeof update === 'function') {
              return (update as (prev: T) => T)(acc);
            } else {
              return update as T;
            }
          }, currentState);
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsPending(false);
      }
      processingRef.current = false;
    }
  }, []);

  // Coordinated state updater
  const updateState = useCallback(async (updater: T | ((prev: T) => T)) => {
    if (!isMountedRef.current) return;

    updateQueueRef.current.push(updater);
    
    // Use requestAnimationFrame to batch updates
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        processUpdates().then(resolve);
      });
    });
  }, [processUpdates]);

  // Batch multiple updates atomically
  const batchUpdates = useCallback(async (updates: Array<T | ((prev: T) => T)>) => {
    if (!isMountedRef.current) return;

    updateQueueRef.current.push(...updates);
    await processUpdates();
  }, [processUpdates]);

  // Reset state to initial value
  const resetState = useCallback(() => {
    if (!isMountedRef.current) return;

    updateQueueRef.current = [];
    setState(initialState);
    setIsPending(false);
  }, [initialState]);

  return [
    state,
    updateState,
    {
      batch: batchUpdates,
      reset: resetState,
      isPending,
    }
  ];
}

/**
 * Hook for coordinating multiple state values atomically
 */
export function useCoordinatedMultiState<T extends Record<string, any>>(
  initialState: T
): [
  T,
  {
    update: <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])) => Promise<void>;
    updateMultiple: (updates: Partial<T> | ((prev: T) => Partial<T>)) => Promise<void>;
    reset: () => void;
    isPending: boolean;
  }
] {
  const [state, updateState, { batch, reset, isPending }] = useCoordinatedState(initialState);

  const updateSingle = useCallback(async <K extends keyof T>(
    key: K, 
    value: T[K] | ((prev: T[K]) => T[K])
  ) => {
    await updateState(prev => ({
      ...prev,
      [key]: typeof value === 'function' ? (value as (prev: T[K]) => T[K])(prev[key]) : value
    }));
  }, [updateState]);

  const updateMultiple = useCallback(async (
    updates: Partial<T> | ((prev: T) => Partial<T>)
  ) => {
    await updateState(prev => ({
      ...prev,
      ...(typeof updates === 'function' ? updates(prev) : updates)
    }));
  }, [updateState]);

  return [
    state,
    {
      update: updateSingle,
      updateMultiple,
      reset,
      isPending,
    }
  ];
}