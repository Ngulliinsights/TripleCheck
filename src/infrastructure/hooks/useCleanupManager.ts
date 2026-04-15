import { useEffect, useRef, useCallback } from 'react'

/**
 * Cleanup function type
 */
type CleanupFunction = () => void | Promise<void>;

/**
 * Base cleanup manager hook that provides centralized cleanup management
 * for components to prevent memory leaks and ensure proper resource disposal
 */
function useBaseCleanupManager(): {
  addCleanup: (cleanup: CleanupFunction, key?: string) => void;
  removeCleanup: (key: string) => void;
  runCleanup: (key?: string) => Promise<void>;
  runAllCleanup: () => Promise<void>;
  hasCleanup: (key?: string) => boolean;
} {
  const cleanupFunctionsRef = useRef<Map<string, CleanupFunction>>(new Map());
  const keyCounterRef = useRef(0);
  const isMountedRef = useRef(true);

  // Generate unique key for cleanup functions
  const generateKey = useCallback(() => {
    return `cleanup_${++keyCounterRef.current}`;
  }, []);

  // Add cleanup function
  const addCleanup = useCallback((cleanup: CleanupFunction, key?: string) => {
    if (!isMountedRef.current) return;

    const cleanupKey = key || generateKey();
    cleanupFunctionsRef.current.set(cleanupKey, cleanup);
  }, [generateKey]);

  // Remove specific cleanup function
  const removeCleanup = useCallback((key: string) => {
    cleanupFunctionsRef.current.delete(key);
  }, []);

  // Run specific cleanup function
  const runCleanup = useCallback(async (key?: string) => {
    if (!key) return;

    const cleanup = cleanupFunctionsRef.current.get(key);
    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        console.error(`Cleanup function "${key}" failed:`, error);
      } finally {
        cleanupFunctionsRef.current.delete(key);
      }
    }
  }, []);

  // Run all cleanup functions
  const runAllCleanup = useCallback(async () => {
    const cleanupPromises: Promise<void>[] = [];

    cleanupFunctionsRef.current.forEach((cleanup, key) => {
      cleanupPromises.push(
        (async () => {
          try {
            await cleanup();
          } catch (error) {
            console.error(`Cleanup function "${key}" failed:`, error);
          }
        })()
      );
    });

    await Promise.allSettled(cleanupPromises);
    cleanupFunctionsRef.current.clear();
  }, []);

  // Check if cleanup exists
  const hasCleanup = useCallback((key?: string) => {
    if (key) {
      return cleanupFunctionsRef.current.has(key);
    }
    return cleanupFunctionsRef.current.size > 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Run all cleanup functions synchronously on unmount
      const cleanupFunctions = Array.from(cleanupFunctionsRef.current.values());
      cleanupFunctions.forEach(cleanup => {
        try {
          const result = cleanup();
          // Handle async cleanup functions
          if (result && typeof result.then === 'function') {
            result.catch(error => {
              console.error('Async cleanup failed during unmount:', error);
            });
          }
        } catch (error) {
          console.error('Cleanup failed during unmount:', error);
        }
      });
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  return {
    addCleanup,
    removeCleanup,
    runCleanup,
    runAllCleanup,
    hasCleanup,
  };
}

/**
 * Cleanup manager with automatic cleanup registration for common patterns
 */
export function useCleanupManager(): {
  addCleanup: (cleanup: CleanupFunction, key?: string) => void;
  removeCleanup: (key: string) => void;
  runCleanup: (key?: string) => Promise<void>;
  runAllCleanup: () => Promise<void>;
  hasCleanup: (key?: string) => boolean;
  // Enhanced methods
  addTimeout: (callback: () => void, delay: number, key?: string) => string;
  addInterval: (callback: () => void, delay: number, key?: string) => string;
  addEventListener: (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
    key?: string
  ) => string;
  addAbortController: (controller: AbortController, key?: string) => string;
} {
  const baseManager = useBaseCleanupManager();

  // Add timeout with automatic cleanup
  const addTimeout = useCallback((
    callback: () => void,
    delay: number,
    key?: string
  ) => {
    const timeoutId = setTimeout(callback, delay);
    const cleanupKey = key || `timeout_${timeoutId}`;
    
    baseManager.addCleanup(() => {
      clearTimeout(timeoutId);
    }, cleanupKey);

    return cleanupKey;
  }, [baseManager]);

  // Add interval with automatic cleanup
  const addInterval = useCallback((
    callback: () => void,
    delay: number,
    key?: string
  ) => {
    const intervalId = setInterval(callback, delay);
    const cleanupKey = key || `interval_${intervalId}`;
    
    baseManager.addCleanup(() => {
      clearInterval(intervalId);
    }, cleanupKey);

    return cleanupKey;
  }, [baseManager]);

  // Add event listener with automatic cleanup
  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
    key?: string
  ) => {
    element.addEventListener(event, handler, options);
    const cleanupKey = key || `event_${event}_${Date.now()}`;
    
    baseManager.addCleanup(() => {
      element.removeEventListener(event, handler, options);
    }, cleanupKey);

    return cleanupKey;
  }, [baseManager]);

  // Add abort controller with automatic cleanup
  const addAbortController = useCallback((
    controller: AbortController,
    key?: string
  ) => {
    const cleanupKey = key || `abort_${Date.now()}`;
    
    baseManager.addCleanup(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, cleanupKey);

    return cleanupKey;
  }, [baseManager]);

  return {
    ...baseManager,
    addTimeout,
    addInterval,
    addEventListener,
    addAbortController,
  };
}


// Backward compatibility
export const useEnhancedCleanupManager = useCleanupManager
