import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UsePollingOptions<TData, TError = Error> {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  interval: number;
  enabled?: boolean;
  immediate?: boolean; // Execute immediately on mount
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  retryOnError?: boolean;
  maxRetries?: number;
  backoffMultiplier?: number;
  pauseOnWindowBlur?: boolean;
  pauseOnOffline?: boolean;
  adaptiveInterval?: {
    min: number;
    max: number;
    errorMultiplier: number;
    successDivider: number;
  };
}

interface UsePollingReturn<TData, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isPolling: boolean;
  start: () => void;
  stop: () => void;
  restart: () => void;
  forceRefetch: () => Promise<TData>;
  currentInterval: number;
  errorCount: number;
}

/**
 * Enhanced polling hook with adaptive intervals, error handling, and lifecycle management
 * Essential fallback for real-time features when WebSocket is unavailable
 */
export function usePolling<TData = any, TError = Error>({
  queryKey,
  queryFn,
  interval,
  enabled = true,
  immediate = true,
  onSuccess,
  onError,
  retryOnError = true,
  maxRetries = 3,
  backoffMultiplier = 1.5,
  pauseOnWindowBlur = true,
  pauseOnOffline = true,
  adaptiveInterval,
}: UsePollingOptions<TData, TError>): UsePollingReturn<TData, TError> {
  const [isPolling, setIsPolling] = useState(enabled);
  const [currentInterval, setCurrentInterval] = useState(interval);
  const [errorCount, setErrorCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const isWindowFocusedRef = useRef(true);
  const isOnlineRef = useRef(navigator.onLine);

  // React Query for data fetching
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: false, // We'll trigger manually
    retry: false, // Handle retries ourselves
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } as UseQueryOptions<TData, TError>);

  // Adaptive interval calculation
  const calculateNextInterval = useCallback((wasError: boolean) => {
    if (!adaptiveInterval) return interval;

    let nextInterval = currentInterval;

    if (wasError) {
      nextInterval = Math.min(
        nextInterval * adaptiveInterval.errorMultiplier,
        adaptiveInterval.max
      );
    } else {
      nextInterval = Math.max(
        nextInterval / adaptiveInterval.successDivider,
        adaptiveInterval.min
      );
    }

    setCurrentInterval(nextInterval);
    return nextInterval;
  }, [currentInterval, interval, adaptiveInterval]);

  // Execute query with error handling
  const executeQuery = useCallback(async () => {
    try {
      const data = await query.refetch();
      
      if (data.data) {
        setErrorCount(0);
        onSuccess?.(data.data);
        calculateNextInterval(false);
        return data.data;
      }
    } catch (error) {
      const err = error as TError;
      setErrorCount(prev => prev + 1);
      onError?.(err);
      calculateNextInterval(true);
      
      // Stop polling if max retries exceeded and retryOnError is false
      if (!retryOnError && errorCount >= maxRetries) {
        setIsPolling(false);
      }
      
      throw err;
    }
  }, [query, onSuccess, onError, calculateNextInterval, retryOnError, errorCount, maxRetries]);

  // Start polling
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    setErrorCount(0);

    // Execute immediately if requested
    if (immediate) {
      executeQuery().catch(() => {
        // Error already handled in executeQuery
      });
    }

    // Set up interval
    const scheduleNext = () => {
      intervalRef.current = setTimeout(() => {
        // Check if we should pause
        const shouldPause = 
          (pauseOnWindowBlur && !isWindowFocusedRef.current) ||
          (pauseOnOffline && !isOnlineRef.current);

        if (!shouldPause && isPolling) {
          executeQuery()
            .then(() => scheduleNext())
            .catch(() => scheduleNext()); // Continue polling even on error
        } else {
          scheduleNext(); // Keep checking conditions
        }
      }, currentInterval);
    };

    scheduleNext();
  }, [
    immediate,
    executeQuery,
    currentInterval,
    pauseOnWindowBlur,
    pauseOnOffline,
    isPolling,
  ]);

  // Stop polling
  const stop = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // Restart polling
  const restart = useCallback(() => {
    stop();
    setCurrentInterval(interval);
    setErrorCount(0);
    setTimeout(start, 100);
  }, [stop, start, interval]);

  // Force refetch
  const forceRefetch = useCallback(async () => {
    return executeQuery();
  }, [executeQuery]);

  // Window focus/blur handling
  useEffect(() => {
    if (!pauseOnWindowBlur) return;

    const handleFocus = () => {
      isWindowFocusedRef.current = true;
      if (enabled && !isPolling) {
        start();
      }
    };

    const handleBlur = () => {
      isWindowFocusedRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [pauseOnWindowBlur, enabled, isPolling, start]);

  // Online/offline handling
  useEffect(() => {
    if (!pauseOnOffline) return;

    const handleOnline = () => {
      isOnlineRef.current = true;
      if (enabled && !isPolling) {
        start();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pauseOnOffline, enabled, isPolling, start]);

  // Start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isPolling,
    start,
    stop,
    restart,
    forceRefetch,
    currentInterval,
    errorCount,
  };
}

/**
 * Property updates polling hook
 */
export function usePropertyUpdatesPolling(enabled: boolean = true) {
  return usePolling({
    queryKey: ['properties', 'updates', 'polling'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/properties/updates', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch property updates: ${response.statusText}`);
      }

      return response.json();
    },
    interval: 30000, // 30 seconds
    enabled,
    adaptiveInterval: {
      min: 15000, // 15 seconds minimum
      max: 120000, // 2 minutes maximum
      errorMultiplier: 2,
      successDivider: 1.2,
    },
  });
}

/**
 * Message polling hook (fallback for WebSocket)
 */
export function useMessagePolling(threadId: string, enabled: boolean = true) {
  return usePolling({
    queryKey: ['messages', 'polling', threadId],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/messages/${threadId}/recent`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      return response.json();
    },
    interval: 5000, // 5 seconds
    enabled,
    immediate: false, // Don't fetch immediately, let the main query handle initial load
    adaptiveInterval: {
      min: 2000, // 2 seconds minimum for active conversations
      max: 30000, // 30 seconds maximum for inactive conversations
      errorMultiplier: 2,
      successDivider: 1.1,
    },
  });
}

/**
 * Notifications polling hook
 */
export function useNotificationsPolling(userId: string, enabled: boolean = true) {
  return usePolling({
    queryKey: ['notifications', 'polling', userId],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/unread', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      return response.json();
    },
    interval: 60000, // 1 minute
    enabled,
    adaptiveInterval: {
      min: 30000, // 30 seconds minimum
      max: 300000, // 5 minutes maximum
      errorMultiplier: 1.5,
      successDivider: 1.1,
    },
  });
}

/**
 * Trust score polling hook
 */
export function useTrustScorePolling(userId: string, enabled: boolean = true) {
  return usePolling({
    queryKey: ['trust', 'score', 'polling', userId],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/trust/score/${userId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trust score: ${response.statusText}`);
      }

      return response.json();
    },
    interval: 300000, // 5 minutes
    enabled,
    pauseOnWindowBlur: false, // Trust scores can update in background
    adaptiveInterval: {
      min: 120000, // 2 minutes minimum
      max: 1800000, // 30 minutes maximum
      errorMultiplier: 2,
      successDivider: 1.2,
    },
  });
}

/**
 * System health polling hook
 */
export function useSystemHealthPolling(enabled: boolean = true) {
  return usePolling({
    queryKey: ['system', 'health', 'polling'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return response.json();
    },
    interval: 120000, // 2 minutes
    enabled,
    retryOnError: true,
    maxRetries: 5,
    pauseOnWindowBlur: false,
    onError: (error) => {
      console.warn('System health check failed:', error);
    },
  });
}