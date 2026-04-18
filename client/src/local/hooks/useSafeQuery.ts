import { useQuery, UseQueryResult, useQueryClient } from "@tanstack/react-query"
import { useRef, useMemo, useState, useCallback, useEffect } from "react"

import { useEnhancedCleanupManager } from "../../infrastructure/hooks/useCleanupManager"
import { useSafeEffect } from "../../infrastructure/hooks/useSafeEffect"
import { Property } from '@shared/types/property'

// ---------------------------------------------------------------------------
// RequestCoordinator
// ---------------------------------------------------------------------------

class RequestCoordinator {
  private pendingRequests = new Map<string, AbortController>();
  private requestMetrics = new Map<
    string,
    { count: number; lastUsed: number; errorCount: number; lastError?: string }
  >();
  private globalRequestCount = 0;
  private lastGlobalReset = Date.now();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();

  private readonly MAX_GLOBAL_REQUESTS = 15;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30_000; // ms
  private readonly REQUEST_WINDOW = 1_000; // ms

  private checkCircuitBreaker(key: string): void {
    const cb = this.circuitBreakers.get(key);
    if (!cb?.isOpen) return;

    if (Date.now() - cb.lastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
      throw new Error(`Circuit breaker is open for ${key}. Try again later.`);
    }

    // Auto-reset after timeout
    cb.isOpen = false;
    cb.failures = 0;
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastGlobalReset > this.REQUEST_WINDOW) {
      this.globalRequestCount = 0;
      this.lastGlobalReset = now;
    }

    this.globalRequestCount++;

    if (this.globalRequestCount > this.MAX_GLOBAL_REQUESTS) {
      const backoff = Math.min(1_000 * Math.pow(2, this.globalRequestCount - this.MAX_GLOBAL_REQUESTS), 10_000);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(
          `[RequestCoordinator] Rate limit exceeded (${this.globalRequestCount} req/s). Backing off ${backoff}ms.`
        );
      }
      await new Promise<void>(resolve => setTimeout(resolve, backoff));
    }
  }

  private updateMetrics(key: string): void {
    const m = this.requestMetrics.get(key) ?? { count: 0, lastUsed: Date.now(), errorCount: 0 };
    this.requestMetrics.set(key, { ...m, count: m.count + 1, lastUsed: Date.now() });
  }

  private setupController(key: string, timeout?: number): { controller: AbortController; timeoutId?: ReturnType<typeof setTimeout> } {
    this.pendingRequests.get(key)?.abort();

    const controller = new AbortController();
    this.pendingRequests.set(key, controller);

    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    return { controller, timeoutId };
  }

  private onSuccess<T>(key: string): void {
    const cb = this.circuitBreakers.get(key);
    if (cb) {
      cb.failures = 0;
      cb.isOpen = false;
    }
    const m = this.requestMetrics.get(key) ?? { count: 0, lastUsed: Date.now(), errorCount: 0 };
    this.requestMetrics.set(key, { ...m, count: m.count + 1, lastUsed: Date.now() });
  }

  private onError(key: string, error: unknown, timeoutId?: ReturnType<typeof setTimeout>): never {
    const cb = this.circuitBreakers.get(key) ?? { failures: 0, lastFailure: 0, isOpen: false };
    cb.failures++;
    cb.lastFailure = Date.now();

    if (cb.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      cb.isOpen = true;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[RequestCoordinator] Circuit breaker opened for "${key}" after ${cb.failures} failures.`);
      }
    }
    this.circuitBreakers.set(key, cb);

    const m = this.requestMetrics.get(key) ?? { count: 0, lastUsed: Date.now(), errorCount: 0 };
    this.requestMetrics.set(key, {
      ...m,
      errorCount: m.errorCount + 1,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      lastUsed: Date.now(),
    });

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(timeoutId ? 'Request timed out' : 'Request was cancelled');
    }

    throw error;
  }

  async executeRequest<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
    timeout?: number
  ): Promise<T> {
    this.checkCircuitBreaker(key);
    await this.handleRateLimit();
    this.updateMetrics(key);

    const { controller, timeoutId } = this.setupController(key, timeout);

    try {
      const result = await requestFn(controller.signal);
      this.onSuccess(key);
      return result;
    } catch (error) {
      return this.onError(key, error, timeoutId);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      this.pendingRequests.delete(key);
    }
  }

  cancelRequest(key: string): boolean {
    const controller = this.pendingRequests.get(key);
    if (!controller) return false;
    controller.abort();
    this.pendingRequests.delete(key);
    return true;
  }

  getRequestStats(key: string): { count: number; lastUsed: number } | null {
    const m = this.requestMetrics.get(key);
    if (!m) return null;
    return { count: m.count, lastUsed: m.lastUsed };
  }

  getAllRequestStats(): Record<string, { count: number; lastUsed: number }> {
    return Object.fromEntries(
      Array.from(this.requestMetrics.entries()).map(([key, m]) => [key, { count: m.count, lastUsed: m.lastUsed }])
    );
  }

  /** Evict stale metrics and closed circuit breakers to prevent memory leaks. */
  cleanup(maxAge = 5 * 60_000): void {
    const now = Date.now();
    this.requestMetrics.forEach((m, key) => {
      if (now - m.lastUsed > maxAge) this.requestMetrics.delete(key);
    });
    this.circuitBreakers.forEach((cb, key) => {
      if (now - cb.lastFailure > maxAge && !cb.isOpen) this.circuitBreakers.delete(key);
    });
  }

  getCircuitBreakerStatus(key: string): { failures: number; isOpen: boolean; lastFailure: number } | null {
    return this.circuitBreakers.get(key) ?? null;
  }

  resetCircuitBreaker(key: string): boolean {
    const cb = this.circuitBreakers.get(key);
    if (!cb) return false;
    cb.failures = 0;
    cb.isOpen = false;
    return true;
  }
}

// ---------------------------------------------------------------------------
// OperationTracker
// ---------------------------------------------------------------------------

interface OperationInfo {
  id: string;
  type: string;
  description: string;
  context?: string;
  startTime: number;
  status: 'pending' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

class OperationTracker {
  private operations = new Map<string, OperationInfo>();
  private readonly maxOperations = 100;

  startOperation(type: string, description: string, context?: string): string {
    if (this.operations.size >= this.maxOperations) this.cleanupOldOperations();

    const id = `${type}-${Date.now()}-${
      globalThis.crypto?.randomUUID?.().substring(0, 8) ?? Date.now().toString(36)
    }`;

    this.operations.set(id, {
      id, type, description,
      context: context ?? '',
      startTime: Date.now(),
      status: 'pending',
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${type}] ${description}`, { id, context });
    }

    return id;
  }

  completeOperation(id: string, data?: unknown, error?: Error): void {
    const op = this.operations.get(id);
    if (!op) return;

    op.status = error ? 'failed' : 'completed';
    op.duration = Date.now() - op.startTime;
    op.error = error?.message ?? '';

    if (process.env.NODE_ENV === 'development') {
      const icon = op.status === 'completed' ? '✅' : '❌';
      // eslint-disable-next-line no-console
      console.log(`${icon} ${op.description} (${op.duration}ms)`, { data, error: op.error });
    }
  }

  getActiveOperations(context?: string): OperationInfo[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === 'pending' && (!context || op.context === context)
    );
  }

  private cleanupOldOperations(): void {
    const completed = Array.from(this.operations.entries())
      .filter(([, op]) => op.status !== 'pending')
      .sort(([, a], [, b]) => (b.startTime + (b.duration ?? 0)) - (a.startTime + (a.duration ?? 0)));

    completed.slice(20).forEach(([id]) => this.operations.delete(id));
  }
}

// ---------------------------------------------------------------------------
// Singletons & module-level setup
// ---------------------------------------------------------------------------

const globalCoordinator = new RequestCoordinator();
const operationTracker = new OperationTracker();

// Periodic cleanup to avoid unbounded memory growth (runs only in browser).
if (typeof window !== 'undefined') {
  setInterval(() => globalCoordinator.cleanup(), 5 * 60_000);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DataValidator<T> = (data: unknown) => T | null;

interface SafeQueryOptions<T> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown> | unknown[] | string | number | boolean | undefined;
  headers?: Record<string, string>;
  timeout?: number;
  fallbackData?: T;
  validator?: DataValidator<T>;
  retry?: boolean | number;
  debounceMs?: number;
  deduplicate?: boolean;
  trackOperations?: boolean;
  context?: string;
  cacheKey?: string;
  /** Analytics event callback; prefer `Record<string, unknown>` over `any` at call sites. */
  onAnalyticsEvent?: (event: 'query_start' | 'query_success' | 'query_error' | 'query_retry', data: Record<string, unknown>) => void;
  onError?: (error: Error, context: string) => void;
  onSuccess?: (data: T, context: string) => void;
  enabled?: boolean;
  queryKey?: readonly unknown[];
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
}

interface SafeQueryResult<T> extends Omit<UseQueryResult<T>, 'data'> {
  /** The data with fallback applied — never undefined */
  data: T;
  /** True when the server returned valid data (not the fallback) */
  hasValidData: boolean;
  originalData?: T;
  cancelRequest: () => void;
  activeOperations: OperationInfo[];
  requestStats: { count: number; lastUsed: number } | null;
  metrics: { requestCount: number; errorCount: number; avgResponseTime: number; successRate: number };
  retryWithBackoff: () => void;
  isRateLimited: boolean;
  enhancedError: {
    code: 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN';
    retryAfter?: number;
    userMessage: string;
    originalError: Error;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getEnterpriseErrorMessage = (error: Error): string => {
  const msg = error.message.toLowerCase();

  if (msg.includes('429') || msg.includes('rate limit'))
    return 'Too many requests. Please wait a moment before trying again.';
  if (msg.includes('timeout'))
    return 'Request timed out. Please check your connection and try again.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Please check your internet connection.';
  if (msg.includes('validation') || msg.includes('invalid'))
    return 'Invalid data received. Please refresh and try again.';
  if (msg.includes('unauthorized') || msg.includes('401'))
    return 'Authentication required. Please log in again.';
  if (msg.includes('forbidden') || msg.includes('403'))
    return "Access denied. You don't have permission for this action.";
  if (msg.includes('not found') || msg.includes('404'))
    return 'The requested resource was not found.';

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Builds the fetch options for a single API request.
 * Extracted to avoid duplicating the same logic in prefetch and queryFn contexts.
 */
function buildRequestFn<T>(
  endpoint: string,
  method: string,
  body: SafeQueryOptions<T>['body'],
  headers: Record<string, string>,
  validator: DataValidator<T> | undefined,
  fallbackData: T | undefined
): (signal: AbortSignal) => Promise<T> {
  return async (signal: AbortSignal): Promise<T> => {
    const url =
      method === 'GET' && body && typeof body === 'object' && !Array.isArray(body)
        ? `${endpoint}?${new URLSearchParams(body as Record<string, string>).toString()}`
        : endpoint;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
        ...headers,
      },
      credentials: 'include',
      signal,
    };

    if (method !== 'GET' && body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') ?? '15';
        throw new Error(`Rate limited. Please wait ${retryAfter} seconds before trying again.`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();

    if (validator) {
      const validated = validator(data);
      if (validated === null) throw new Error('Response data failed validation');
      return validated;
    }

    return data as T;
  };
}

// ---------------------------------------------------------------------------
// Shared pre-configured property-list config (used by several specialized hooks)
// ---------------------------------------------------------------------------

const propertyListConfig = {
  endpoint: '/api/properties',
  method: 'GET' as const,
  fallbackData: [] as Property[],
  staleTime: 2 * 60_000,
  gcTime: 5 * 60_000,
  retry: 3,
  debounceMs: 500,
  deduplicate: true,
  context: 'properties',
  validator: (data: unknown): Property[] => {
    const isValidItem = (item: unknown): item is Property => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      return (
        (typeof obj.id === 'string' || typeof obj.id === 'number') &&
        obj.id != null &&
        typeof obj.title === 'string' &&
        obj.title.length > 0 &&
        typeof obj.description === 'string' &&
        obj.description.length > 0
      );
    };

    if (Array.isArray(data)) return data.filter(isValidItem);

    // Handle wrapped response: { data: Property[] }
    if (data && typeof data === 'object' && 'data' in data) {
      const inner = (data as { data: unknown }).data;
      if (Array.isArray(inner)) return inner.filter(isValidItem);
    }

    return [];
  },
};

const propertyDetailConfig = {
  fallbackData: null as Property | null,
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
  retry: 2,
  deduplicate: true,
  context: 'property',
  validator: (data: unknown): Property | null => {
    if (!data || typeof data !== 'object') return null;

    const response = data as Record<string, unknown>;
    const property: Record<string, unknown> =
      response.success && response.data && typeof response.data === 'object'
        ? (response.data as Record<string, unknown>)
        : response;

    return {
      ...property,
      id: (property.id as string) ?? '',
      title: (property.title as string) ?? 'Untitled Property',
      description: (property.description as string) ?? 'No description available',
      price: typeof property.price === 'number' ? property.price : 0,
      location: (property.location as string) ?? '',
      images: Array.isArray(property.images)
        ? property.images
        : Array.isArray(property.imageUrls)
          ? property.imageUrls
          : [],
    } as Property;
  },
};

// ---------------------------------------------------------------------------
// useSafeQuery
// ---------------------------------------------------------------------------

/**
 * Enhanced safe query hook with enterprise-grade features.
 *
 * Provides comprehensive data fetching with built-in error handling, rate limiting,
 * circuit breakers, request deduplication, and analytics tracking.
 *
 * @example
 * ```typescript
 * const { data, isLoading, hasValidData } = useSafeQuery({
 *   endpoint: '/api/properties',
 *   fallbackData: [],
 *   validator: (data) => Array.isArray(data) ? data : [],
 *   context: 'property-list',
 * });
 * ```
 */
export function useSafeQuery<T>({
  endpoint,
  method = 'GET',
  body,
  headers = {},
  timeout = 30_000,
  fallbackData,
  validator,
  retry = 3,
  debounceMs = 0,
  deduplicate = true,
  trackOperations = process.env.NODE_ENV === 'development',
  context = 'unknown',
  cacheKey,
  onAnalyticsEvent,
  onError,
  onSuccess,
  ...queryOptions
}: SafeQueryOptions<T>): SafeQueryResult<T> {
  const [debouncedBody, setDebouncedBody] = useState(body);
  const operationIdRef = useRef<string | null>(null);
  const requestCountRef = useRef(0);
  const lastRequestTimeRef = useRef(0);

  const cleanupManager = useEnhancedCleanupManager();

  // Per-instance metrics (request counts, response times).
  // Stored in a ref so updates don't trigger re-renders; read fresh in the return value.
  const metrics = useRef({
    requestCount: 0,
    errorCount: 0,
    successCount: 0,
    avgResponseTime: 0,
    responseTimes: [] as number[],
  });

  // --- Debounced body -------------------------------------------------------
  useSafeEffect(() => {
    const currentBodyStr = JSON.stringify(body);
    const lastBodyStr = JSON.stringify(debouncedBody);
    if (currentBodyStr === lastBodyStr) return;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < 300) {
      requestCountRef.current++;
      if (requestCountRef.current > 5) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(`[useSafeQuery] Throttling rapid calls on "${endpoint}" (${requestCountRef.current} bursts).`);
        }
        return;
      }
    } else {
      requestCountRef.current = 0;
    }

    lastRequestTimeRef.current = now;

    if (debounceMs > 0) {
      cleanupManager.removeCleanup('debounce-timeout');
      cleanupManager.addTimeout(
        () => { if (lastRequestTimeRef.current > 0) setDebouncedBody(body); },
        debounceMs,
        'debounce-timeout'
      );
    } else {
      setDebouncedBody(body);
    }
  }, [body, debounceMs, cleanupManager, endpoint]);

  // --- Cache key ------------------------------------------------------------
  const requestCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey;

    let bodyPart = '';
    if (debouncedBody) {
      bodyPart = typeof debouncedBody === 'object'
        ? JSON.stringify(debouncedBody, Object.keys(debouncedBody as object).sort((a, b) => a.localeCompare(b)))
        : String(debouncedBody);
    }

    const headersPart = headers
      ? JSON.stringify(headers, Object.keys(headers).sort((a, b) => a.localeCompare(b)))
      : '';

    return `${method}:${endpoint}:${bodyPart}:${headersPart}`;
  }, [method, endpoint, debouncedBody, headers, cacheKey]);

  // --- Query ----------------------------------------------------------------
  const query = useQuery({
    queryKey: [requestCacheKey, ...(queryOptions.queryKey ?? [])].filter(Boolean),
    queryFn: async () => {
      const startTime = Date.now();

      if (trackOperations) {
        operationIdRef.current = operationTracker.startOperation(
          'safe_query',
          `${method} ${endpoint}`,
          context
        );
      }

      try {
        metrics.current.requestCount++;

        onAnalyticsEvent?.('query_start', { endpoint, method, context, timestamp: Date.now() });

        const requestFn = buildRequestFn<T>(endpoint, method, debouncedBody, headers, validator, fallbackData);

        const result = deduplicate
          ? await globalCoordinator.executeRequest(requestCacheKey, requestFn, timeout)
          : await requestFn(new AbortController().signal);

        // Update success metrics
        const responseTime = Date.now() - startTime;
        metrics.current.successCount++;
        metrics.current.responseTimes.push(responseTime);
        if (metrics.current.responseTimes.length > 100) {
          metrics.current.responseTimes = metrics.current.responseTimes.slice(-50);
        }
        metrics.current.avgResponseTime =
          metrics.current.responseTimes.reduce((a, b) => a + b, 0) / metrics.current.responseTimes.length;

        if (trackOperations && operationIdRef.current) {
          operationTracker.completeOperation(operationIdRef.current, result);
        }

        onAnalyticsEvent?.('query_success', { endpoint, method, context, responseTime, timestamp: Date.now() });
        onSuccess?.(result, context);

        return result;
      } catch (error) {
        metrics.current.errorCount++;

        if (trackOperations && operationIdRef.current) {
          operationTracker.completeOperation(operationIdRef.current, undefined, error as Error);
        }

        onAnalyticsEvent?.('query_error', {
          endpoint,
          method,
          context,
          error: (error as Error).message,
          timestamp: Date.now(),
        });
        onError?.(error as Error, context);

        if (fallbackData !== undefined) return fallbackData;
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const { message } = error;
        // Never retry unrecoverable client errors
        if (message.includes('HTTP 4') && !message.includes('408') && !message.includes('429')) {
          return false;
        }
        if (message.includes('validation') || message.includes('Failed validation')) return false;
        if (message.includes('cancelled') || message.includes('aborted')) return false;
        if (message.includes('Circuit breaker is open')) return false;
      }
      return typeof retry === 'number' ? failureCount < retry : Boolean(retry);
    },
    retryDelay: (attemptIndex) => {
      const base = 1_000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 0.1 * base;
      return Math.min(base + jitter, 30_000);
    },
    staleTime: context === 'properties' ? 2 * 60_000 : 5 * 60_000,
    gcTime: context === 'properties' ? 5 * 60_000 : 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    ...queryOptions,
  });

  // --- Utilities ------------------------------------------------------------

  const cancelRequest = useCallback(
    () => globalCoordinator.cancelRequest(requestCacheKey),
    [requestCacheKey]
  );

  const retryWithBackoff = useCallback(() => {
    // Reset global circuit breaker for this endpoint before retrying.
    globalCoordinator.resetCircuitBreaker(`${method}:${endpoint}`);
    query.refetch();
  }, [query, method, endpoint]);

  const activeOperations = useMemo(
    () => trackOperations ? operationTracker.getActiveOperations(context) : [],
    [trackOperations, context]
  );

  const requestStats = useMemo(
    () => globalCoordinator.getRequestStats(requestCacheKey),
    [requestCacheKey]
  );

  const enhancedError = useMemo(() => {
    if (!query.error) return null;
    const error = query.error as Error;
    const msg = error.message.toLowerCase();

    let code: SafeQueryResult<T>['enhancedError'] extends null | { code: infer C } ? C : never = 'UNKNOWN';
    let retryAfter: number | undefined;

    if (msg.includes('429') || msg.includes('rate limit')) {
      code = 'RATE_LIMIT';
      const match = msg.match(/(\d+)\s*seconds?/);
      retryAfter = match ? parseInt(match[1] ?? '15', 10) : 15;
    } else if (msg.includes('timeout')) {
      code = 'TIMEOUT';
    } else if (msg.includes('network') || msg.includes('fetch')) {
      code = 'NETWORK';
    } else if (msg.includes('validation') || msg.includes('invalid')) {
      code = 'VALIDATION';
    }

    return { code, retryAfter, userMessage: getEnterpriseErrorMessage(error), originalError: error };
  }, [query.error]);

  // Compute fresh each render — ref mutations do not trigger re-renders, so
  // memoising against ref values would permanently cache the initial value.
  const successRate =
    metrics.current.requestCount === 0
      ? 1
      : metrics.current.successCount / metrics.current.requestCount;

  return {
    ...query,
    data: (query.data ?? fallbackData) as T,
    hasValidData: query.data != null,
    originalData: query.data,
    cancelRequest,
    activeOperations,
    requestStats,
    metrics: {
      requestCount: metrics.current.requestCount,
      errorCount: metrics.current.errorCount,
      avgResponseTime: metrics.current.avgResponseTime,
      successRate,
    },
    retryWithBackoff,
    isRateLimited: enhancedError?.code === 'RATE_LIMIT',
    enhancedError,
  } as SafeQueryResult<T>;
}

// ---------------------------------------------------------------------------
// Specialized hooks
// ---------------------------------------------------------------------------

export const useSafePropertiesQuery = (
  searchParams?: Record<string, unknown>,
  options?: Partial<SafeQueryOptions<Property[]>>
) => {
  const normalizedParams = useMemo(() => {
    if (!searchParams) return undefined;
    const cleaned = Object.entries(searchParams).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        Object.assign(acc, { [key]: typeof value === 'string' ? value.trim() : value });
      }
      return acc;
    }, {} as Record<string, unknown>);
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }, [searchParams]);

  return useSafeQuery<Property[]>({
    ...propertyListConfig,
    body: normalizedParams,
    enabled: true,
    ...options,
  });
};

export const useSafePropertyQuery = (
  id: string,
  options?: Partial<SafeQueryOptions<Property | null>> & { includeMarketEstimate?: boolean }
) => {
  const { includeMarketEstimate = false, ...queryOptions } = options ?? {};

  return useSafeQuery<Property | null>({
    ...propertyDetailConfig,
    endpoint: `/api/properties/${id}${includeMarketEstimate ? '?includeMarketEstimate=true' : ''}`,
    enabled: Boolean(id) && id.length > 0,
    ...queryOptions,
  });
};

// ---------------------------------------------------------------------------
// User / auth
// ---------------------------------------------------------------------------

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  trustScore: number;
  isVerified: boolean;
  role: string;
  [key: string]: unknown;
}

export const useSafeUserQuery = (options?: Partial<SafeQueryOptions<User | null>>) =>
  useSafeQuery<User | null>({
    endpoint: '/api/auth/profile',
    fallbackData: null,
    validator: (data): User | null => {
      if (!data || typeof data !== 'object') return null;
      const user = data as Record<string, unknown>;
      return {
        ...user,
        id: (user.id as string) ?? '',
        firstName: (user.firstName as string) ?? '',
        lastName: (user.lastName as string) ?? '',
        email: (user.email as string) ?? '',
        trustScore: typeof user.trustScore === 'number' ? user.trustScore : 0,
        isVerified: Boolean(user.isVerified),
        role: (user.role as string) ?? 'user',
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    context: 'auth',
    ...options,
  });

// ---------------------------------------------------------------------------
// Trust score
// ---------------------------------------------------------------------------

interface TrustScore {
  score: number;
  level: string;
  factors: Record<string, unknown>;
  recommendations: string[];
}

export const useSafeTrustScoreQuery = (
  userId: string,
  options?: Partial<SafeQueryOptions<TrustScore>>
) =>
  useSafeQuery<TrustScore>({
    endpoint: `/api/trust/score/${userId}`,
    fallbackData: { score: 0, level: 'unverified', factors: {}, recommendations: [] },
    validator: (data): TrustScore | null => {
      if (!data || typeof data !== 'object') return null;
      const d = data as Record<string, unknown>;
      return {
        score: typeof d.score === 'number' ? d.score : 0,
        level: (d.level as string) ?? 'unverified',
        factors: (d.factors as Record<string, unknown>) ?? {},
        recommendations: Array.isArray(d.recommendations) ? d.recommendations : [],
      };
    },
    enabled: Boolean(userId) && userId.length > 0,
    context: 'trust',
    ...options,
  });

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  [key: string]: unknown;
}

export const useSafeMessagesQuery = (
  userId: string,
  options?: Partial<SafeQueryOptions<Message[]>>
) =>
  useSafeQuery<Message[]>({
    endpoint: `/api/communication/messages?userId=${userId}`,
    fallbackData: [],
    validator: (data): Message[] => {
      if (!Array.isArray(data)) return [];
      return data.filter((item): item is Message => {
        if (!item || typeof item !== 'object') return false;
        const obj = item as Record<string, unknown>;
        return (
          typeof obj.id === 'string' &&
          typeof obj.senderId === 'string' &&
          typeof obj.recipientId === 'string' &&
          typeof obj.subject === 'string' &&
          typeof obj.content === 'string'
        );
      });
    },
    enabled: Boolean(userId) && userId.length > 0,
    context: 'messages',
    ...options,
  });

// ---------------------------------------------------------------------------
// Owner properties
// ---------------------------------------------------------------------------

export const useSafeOwnerPropertiesQuery = (
  ownerId: string,
  options?: Partial<SafeQueryOptions<Property[]>> & { includeTotal?: boolean }
) => {
  const { includeTotal = false, ...queryOptions } = options ?? {};

  return useSafeQuery<Property[]>({
    endpoint: `/api/properties/owner/${ownerId}`,
    method: 'GET',
    body: includeTotal ? { includeTotal: true } : undefined,
    fallbackData: [],
    validator: (data): Property[] => {
      const isValid = (item: unknown): item is Property => {
        if (!item || typeof item !== 'object') return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === 'string' || typeof obj.id === 'number') &&
          obj.id != null &&
          typeof obj.title === 'string' &&
          obj.title.length > 0
        );
      };

      if (Array.isArray(data)) return data.filter(isValid);
      if (data && typeof data === 'object' && 'data' in data) {
        const inner = (data as { data: unknown }).data;
        if (Array.isArray(inner)) return inner.filter(isValid);
      }
      return [];
    },
    enabled: Boolean(ownerId) && ownerId.length > 0,
    context: 'owner-properties',
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    ...queryOptions,
  });
};

// ---------------------------------------------------------------------------
// Property actions status
// ---------------------------------------------------------------------------

/**
 * Checks the server-side status of a property action (favourites / share).
 * For performing the mutation itself, use useMutation directly or usePropertyActions.
 */
export const useSafePropertyActionStatusQuery = (
  action: 'favorites' | 'share',
  propertyId?: string,
  options?: Partial<SafeQueryOptions<{ success: boolean; data?: unknown }>>
) => {
  const base = action === 'favorites' ? '/api/properties/favorites' : '/api/properties/share';
  const endpoint = propertyId ? `${base}/${propertyId}` : base;

  return useSafeQuery<{ success: boolean; data?: unknown }>({
    endpoint,
    method: 'GET',
    fallbackData: { success: false },
    validator: (data): { success: boolean; data?: unknown } => {
      if (!data || typeof data !== 'object') return { success: false };
      const r = data as Record<string, unknown>;
      return { success: Boolean(r.success), data: r.data };
    },
    enabled: Boolean(propertyId) && (propertyId?.length ?? 0) > 0,
    context: `property-${action}`,
    staleTime: 2 * 60_000,
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Property search
// ---------------------------------------------------------------------------

export const useSafePropertySearchQuery = (
  searchParams?: Record<string, unknown>,
  options?: Partial<SafeQueryOptions<{ data: Property[]; total: number; hasNext: boolean; hasPrev: boolean }>>
) => {
  const normalizedParams = useMemo(() => {
    if (!searchParams) return undefined;
    const cleaned = Object.entries(searchParams).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        Object.assign(acc, { [key]: typeof value === 'string' ? value.trim() : value });
      }
      return acc;
    }, {} as Record<string, unknown>);
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }, [searchParams]);

  return useSafeQuery<{ data: Property[]; total: number; hasNext: boolean; hasPrev: boolean }>({
    endpoint: '/api/properties/search',
    method: 'GET',
    body: normalizedParams,
    fallbackData: { data: [], total: 0, hasNext: false, hasPrev: false },
    validator: (data) => {
      if (!data || typeof data !== 'object') {
        return { data: [], total: 0, hasNext: false, hasPrev: false };
      }

      const r = data as Record<string, unknown>;
      const actual = (r.success ? r.data ?? r : r) as Record<string, unknown>;

      const isValidProperty = (item: unknown): item is Property => {
        if (!item || typeof item !== 'object') return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === 'string' || typeof obj.id === 'number') &&
          obj.id != null &&
          typeof obj.title === 'string' &&
          obj.title.length > 0
        );
      };

      return {
        data: Array.isArray(actual.data) ? actual.data.filter(isValidProperty) : [],
        total: typeof actual.total === 'number' ? actual.total : 0,
        hasNext: Boolean(actual.hasNext),
        hasPrev: Boolean(actual.hasPrev),
      };
    },
    context: 'property-search',
    debounceMs: 500,
    deduplicate: true,
    staleTime: 30_000,
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Similar properties
// ---------------------------------------------------------------------------

export const useSafeSimilarPropertiesQuery = (
  params?: {
    location?: string;
    price?: number;
    propertyType?: string;
    excludeId?: string;
    limit?: number;
  },
  options?: Partial<SafeQueryOptions<Property[]>>
) => {
  const normalizedParams = useMemo(() => {
    if (!params?.location && !params?.propertyType) return null;

    const p: Record<string, unknown> = {};

    if (params.location) {
      const city = params.location.split(',')[0]?.trim();
      if (city) p['city'] = city;
    }

    if (params.price) {
      const price = Number(params.price);
      if (!isNaN(price) && price > 0) {
        const range = price * 0.2;
        p['minPrice'] = Math.max(0, price - range);
        p['maxPrice'] = price + range;
      }
    }

    if (params.propertyType) p['propertyType'] = params.propertyType;
    if (params.excludeId) p['excludeId'] = params.excludeId;
    p['limit'] = Math.min(params.limit ?? 10, 20);

    return p;
  }, [params]);

  return useSafeQuery<Property[]>({
    endpoint: '/api/properties/similar',
    method: 'GET',
    body: normalizedParams ?? {},
    fallbackData: [],
    validator: (data): Property[] => {
      if (!Array.isArray(data)) return [];
      return data.filter((item): item is Property => {
        if (!item || typeof item !== 'object') return false;
        return typeof (item as Record<string, unknown>).id === 'string' &&
          ((item as Record<string, unknown>).id as string).length > 0;
      });
    },
    context: 'similar-properties',
    debounceMs: 1_000,
    deduplicate: true,
    staleTime: 60_000,
    enabled: normalizedParams != null,
    ...options,
  });
};

export { globalCoordinator, operationTracker };
export type { SafeQueryOptions, SafeQueryResult, OperationInfo };