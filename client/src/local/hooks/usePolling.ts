/**
 * Polling Hook
 *
 * Enhanced polling with adaptive intervals, error back-off,
 * window-blur / offline pausing, and lifecycle management.
 * Acts as the primary real-time fallback when WebSocket is unavailable.
 */

import { useCallback, useRef, useState } from 'react'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager'
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdaptiveInterval {
  min:              number;
  max:              number;
  errorMultiplier:  number;
  successDivider:   number;
}

interface UsePollingOptions<TData, TError = Error> {
  queryKey:          unknown[];
  queryFn:           () => Promise<TData>;
  interval:          number;
  enabled?:          boolean;
  /** Execute immediately on mount. @default true */
  immediate?:        boolean;
  onSuccess?:        (data: TData) => void;
  onError?:          (error: TError) => void;
  retryOnError?:     boolean;
  maxRetries?:       number;
  pauseOnWindowBlur?: boolean;
  pauseOnOffline?:   boolean;
  adaptiveInterval?: AdaptiveInterval;
}

interface UsePollingReturn<TData, TError = Error> {
  data:            TData | undefined;
  error:           TError | null;
  isLoading:       boolean;
  isPolling:       boolean;
  start:           () => void;
  stop:            () => void;
  restart:         () => void;
  forceRefetch:    () => Promise<TData | undefined>;
  currentInterval: number;
  errorCount:      number;
}

// ---------------------------------------------------------------------------
// Core hook
// ---------------------------------------------------------------------------

export function usePolling<TData = unknown, TError = Error>({
  queryKey,
  queryFn,
  interval,
  enabled            = true,
  immediate          = true,
  onSuccess,
  onError,
  retryOnError       = true,
  maxRetries         = 3,
  pauseOnWindowBlur  = true,
  pauseOnOffline     = true,
  adaptiveInterval,
}: UsePollingOptions<TData, TError>): UsePollingReturn<TData, TError> {
  const [isPolling,       setIsPolling]       = useState(enabled);
  const [currentInterval, setCurrentInterval] = useState(interval);
  const [errorCount,      setErrorCount]      = useState(0);

  const isWindowFocused = useRef(true);
  const isOnline        = useRef(navigator.onLine);
  const cleanupManager  = useEnhancedCleanupManager();

  const query = useQuery({
    queryKey,
    queryFn,
    enabled:             false,
    retry:               false,
    refetchOnWindowFocus: false,
    refetchOnReconnect:  false,
  } as UseQueryOptions<TData, TError>);

  // Adaptive interval calculation
  const nextInterval = useCallback((wasError: boolean): number => {
    if (!adaptiveInterval) return interval;
    setCurrentInterval((prev) => {
      const next = wasError
        ? Math.min(prev * adaptiveInterval.errorMultiplier, adaptiveInterval.max)
        : Math.max(prev / adaptiveInterval.successDivider,  adaptiveInterval.min);
      return next;
    });
    // Return stable snapshot; actual state update is async but that's fine here
    return interval;
  }, [adaptiveInterval, interval]);

  const executeQuery = useCallback(async () => {
    try {
      const result = await query.refetch();
      if (result.data !== undefined) {
        setErrorCount(0);
        onSuccess?.(result.data);
        nextInterval(false);
      }
    } catch (err) {
      const error = err as TError;
      setErrorCount((n) => {
        const next = n + 1;
        if (!retryOnError && next >= maxRetries) setIsPolling(false);
        return next;
      });
      onError?.(error);
      nextInterval(true);
      throw error;
    }
  }, [query, onSuccess, onError, nextInterval, retryOnError, maxRetries]);

  const start = useCallback(() => {
    cleanupManager.removeCleanup('polling-interval');
    setIsPolling(true);
    setErrorCount(0);

    if (immediate) executeQuery().catch(() => undefined);

    const schedule = () => {
      cleanupManager.addTimeout(() => {
        const paused =
          (pauseOnWindowBlur && !isWindowFocused.current) ||
          (pauseOnOffline    && !isOnline.current);

        executeQuery()
          .catch(() => undefined)
          .finally(() => {
            if (!paused) schedule();
            else         setTimeout(schedule, currentInterval);
          });
      }, currentInterval, 'polling-interval');
    };

    schedule();
  }, [
    immediate, executeQuery, currentInterval,
    pauseOnWindowBlur, pauseOnOffline, cleanupManager,
  ]);

  const stop = useCallback(() => {
    setIsPolling(false);
    cleanupManager.removeCleanup('polling-interval');
  }, [cleanupManager]);

  const restart = useCallback(() => {
    stop();
    setCurrentInterval(interval);
    setErrorCount(0);
    setTimeout(start, 100);
  }, [stop, start, interval]);

  const forceRefetch = useCallback(async () => {
    try { return (await query.refetch()).data; } catch { return undefined; }
  }, [query]);

  // Window focus / blur
  useSafeEffect(() => {
    if (!pauseOnWindowBlur) return;
    const onFocus = () => { isWindowFocused.current = true;  if (enabled && !isPolling) start(); };
    const onBlur  = () => { isWindowFocused.current = false; };
    cleanupManager.addEventListener(window, 'focus', onFocus, undefined, 'window-focus');
    cleanupManager.addEventListener(window, 'blur',  onBlur,  undefined, 'window-blur');
  }, [pauseOnWindowBlur, enabled, isPolling, start, cleanupManager]);

  // Online / offline
  useSafeEffect(() => {
    if (!pauseOnOffline) return;
    const onOnline  = () => { isOnline.current = true;  if (enabled && !isPolling) start(); };
    const onOffline = () => { isOnline.current = false; };
    cleanupManager.addEventListener(window, 'online',  onOnline,  undefined, 'window-online');
    cleanupManager.addEventListener(window, 'offline', onOffline, undefined, 'window-offline');
  }, [pauseOnOffline, enabled, isPolling, start, cleanupManager]);

  // Start / stop based on enabled prop
  useSafeEffect(() => {
    if (enabled) start(); else stop();
    return stop;
  }, [enabled]); // eslint-disable-line

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

// ---------------------------------------------------------------------------
// Domain-specific polling hooks
// ---------------------------------------------------------------------------

function authFetch(url: string) {
  return fetch(url, {
    headers: {
      Authorization:  `Bearer ${localStorage.getItem('authToken') ?? ''}`,
      'Content-Type': 'application/json',
    },
  }).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  });
}

export function usePropertyUpdatesPolling(enabled = true) {
  return usePolling({
    queryKey:         ['properties', 'updates', 'polling'],
    queryFn:          () => authFetch('/api/properties/updates'),
    interval:         30_000,
    enabled,
    adaptiveInterval: { min: 15_000, max: 120_000, errorMultiplier: 2, successDivider: 1.2 },
  });
}

export function useMessagePolling(threadId: string, enabled = true) {
  return usePolling({
    queryKey:         ['messages', 'polling', threadId],
    queryFn:          () => authFetch(`/api/messages/${threadId}/recent`),
    interval:         5_000,
    enabled,
    immediate:        false,
    adaptiveInterval: { min: 2_000, max: 30_000, errorMultiplier: 2, successDivider: 1.1 },
  });
}

export function useNotificationsPolling(userId: string, enabled = true) {
  return usePolling({
    queryKey:         ['notifications', 'polling', userId],
    queryFn:          () => authFetch('/api/notifications/unread'),
    interval:         60_000,
    enabled,
    adaptiveInterval: { min: 30_000, max: 300_000, errorMultiplier: 1.5, successDivider: 1.1 },
  });
}

export function useTrustScorePolling(userId: string, enabled = true) {
  return usePolling({
    queryKey:          ['trust', 'score', 'polling', userId],
    queryFn:           () => authFetch(`/api/trust/score/${userId}`),
    interval:          300_000,
    enabled,
    pauseOnWindowBlur: false,
    adaptiveInterval:  { min: 120_000, max: 1_800_000, errorMultiplier: 2, successDivider: 1.2 },
  });
}

export function useSystemHealthPolling(enabled = true) {
  return usePolling({
    queryKey:          ['system', 'health', 'polling'],
    queryFn:           () => fetch('/api/health').then((r) => {
      if (!r.ok) throw new Error(`Health check ${r.status}`);
      return r.json();
    }),
    interval:          120_000,
    enabled,
    retryOnError:      true,
    maxRetries:        5,
    pauseOnWindowBlur: false,
    onError:           (err) => console.warn('[Health poll]', err),
  });
}