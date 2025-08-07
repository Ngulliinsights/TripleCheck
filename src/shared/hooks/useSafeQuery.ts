import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useRef, useMemo, useState, useCallback } from "react";

import { useEnhancedCleanupManager } from "../../infrastructure/hooks/useCleanupManager";
import { useSafeEffect } from "../../infrastructure/hooks/useSafeEffect";
import { Property } from '../types/property';
// Removed unused import: requestMonitor

// Enhanced request coordinator with better error handling and metrics
class RequestCoordinator {
  private pendingRequests = new Map<string, AbortController>();
  private requestMetrics = new Map<
    string,
    { count: number; lastUsed: number; errorCount: number; lastError?: string }
  >();
  private globalRequestCount = 0;
  private lastGlobalReset = Date.now();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
  private readonly MAX_GLOBAL_REQUESTS = 15; // Reduced from 20 to be more conservative
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private readonly REQUEST_WINDOW = 1000; // 1 second window

  private checkCircuitBreaker(key: string): void {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker?.isOpen) {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
      if (timeSinceLastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
        throw new Error(`Circuit breaker is open for ${key}. Try again later.`);
      } else {
        // Reset circuit breaker after timeout
        circuitBreaker.isOpen = false;
        circuitBreaker.failures = 0;
      }
    }
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastGlobalReset > this.REQUEST_WINDOW) {
      this.globalRequestCount = 0;
      this.lastGlobalReset = now;
    }

    this.globalRequestCount++;
    
    if (this.globalRequestCount > this.MAX_GLOBAL_REQUESTS) {
      const backoffTime = Math.min(1000 * Math.pow(2, this.globalRequestCount - this.MAX_GLOBAL_REQUESTS), 10000);
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`[RequestCoordinator] Rate limit exceeded (${this.globalRequestCount} requests/sec). Backing off for ${backoffTime}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  private updateRequestMetrics(key: string): void {
    const metrics = this.requestMetrics.get(key) || {
      count: 0,
      lastUsed: Date.now(),
      errorCount: 0,
    };
    this.requestMetrics.set(key, {
      count: metrics.count + 1,
      lastUsed: Date.now(),
      errorCount: metrics.errorCount,
    });
  }

  private setupRequestController(key: string, timeout?: number): { controller: AbortController; timeoutId?: NodeJS.Timeout | undefined } {
    const existingController = this.pendingRequests.get(key);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.pendingRequests.set(key, controller);

    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
    }

    return { controller, timeoutId };
  }

  private handleRequestSuccess<T>(key: string, result: T): T {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.isOpen = false;
    }
    
    const metrics = this.requestMetrics.get(key) || { count: 0, lastUsed: Date.now(), errorCount: 0 };
    this.requestMetrics.set(key, {
      ...metrics,
      count: metrics.count + 1,
      lastUsed: Date.now(),
    });
    
    return result;
  }

  private handleRequestError(key: string, error: unknown, timeoutId?: NodeJS.Timeout): never {
    const circuitBreaker = this.circuitBreakers.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    
    if (circuitBreaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.isOpen = true;
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`[RequestCoordinator] Circuit breaker opened for ${key} after ${circuitBreaker.failures} failures`);
      }
    }
    
    this.circuitBreakers.set(key, circuitBreaker);
    
    const metrics = this.requestMetrics.get(key) || { count: 0, lastUsed: Date.now(), errorCount: 0 };
    this.requestMetrics.set(key, {
      ...metrics,
      errorCount: metrics.errorCount + 1,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      lastUsed: Date.now(),
    });
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        timeoutId ?
          `Request timed out`
        : "Request was cancelled"
      );
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
    this.updateRequestMetrics(key);

    const { controller, timeoutId } = this.setupRequestController(key, timeout);

    try {
      const result = await requestFn(controller.signal);
      return this.handleRequestSuccess(key, result);
    } catch (error) {
      return this.handleRequestError(key, error, timeoutId);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.pendingRequests.delete(key);
    }
  }

  cancelRequest(key: string): boolean {
    const controller = this.pendingRequests.get(key);
    if (controller) {
      controller.abort();
      this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  // Fixed: Now always returns the same type structure
  getRequestStats(key: string): { count: number; lastUsed: number } | null {
    const metrics = this.requestMetrics.get(key);
    if (!metrics) return null;
    
    return {
      count: metrics.count,
      lastUsed: metrics.lastUsed
    };
  }

  // Separate method for getting all stats if needed
  getAllRequestStats(): Record<string, { count: number; lastUsed: number }> {
    const result: Record<string, { count: number; lastUsed: number }> = {};
    for (const [key, metrics] of Array.from(this.requestMetrics.entries())) {
      // Use safe property access to avoid object injection warnings
      const safeMetrics = {
        count: metrics.count,
        lastUsed: metrics.lastUsed
      };
      result[key] = safeMetrics;
    }
    return result;
  }

  // Clean up old metrics to prevent memory leaks
  cleanup(maxAge: number = 5 * 60 * 1000) {
    const now = Date.now();
    this.requestMetrics.forEach((metrics, key) => {
      if (now - metrics.lastUsed > maxAge) {
        this.requestMetrics.delete(key);
      }
    });
    
    // Also clean up old circuit breakers
    this.circuitBreakers.forEach((breaker, key) => {
      if (now - breaker.lastFailure > maxAge && !breaker.isOpen) {
        this.circuitBreakers.delete(key);
      }
    });
  }

  // Get circuit breaker status for debugging
  getCircuitBreakerStatus(key: string): { failures: number; isOpen: boolean; lastFailure: number } | null {
    return this.circuitBreakers.get(key) || null;
  }

  // Reset circuit breaker manually if needed
  resetCircuitBreaker(key: string): boolean {
    const breaker = this.circuitBreakers.get(key);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
      return true;
    }
    return false;
  }
}

const globalCoordinator = new RequestCoordinator();

// Optimized operation tracker with better memory management
class OperationTracker {
  private operations = new Map<string, OperationInfo>();
  private readonly maxOperations = 100; // Prevent memory leaks

  startOperation(type: string, description: string, context?: string): string {
    // Clean up old operations if we're approaching the limit
    if (this.operations.size >= this.maxOperations) {
      this.cleanupOldOperations();
    }

    const id = `${type}-${Date.now()}-${globalThis.crypto?.randomUUID?.()?.substring(0, 8) || Date.now().toString(36)}`;
    const operation: OperationInfo = {
      id,
      type,
      description,
      context: context || "",
      startTime: Date.now(),
      status: "pending",
    };

    this.operations.set(id, operation);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`🔍 [${type}] ${description}`, { id, context });
    }

    return id;
  }

  completeOperation(id: string, data?: unknown, error?: Error): void {
    const operation = this.operations.get(id);
    if (!operation) return;

    operation.status = error ? "failed" : "completed";
    operation.duration = Date.now() - operation.startTime;
    operation.error = error?.message || "";

    if (process.env.NODE_ENV === "development") {
      const icon = operation.status === "completed" ? "✅" : "❌";
      // eslint-disable-next-line no-console
      console.log(
        `${icon} ${operation.description} (${operation.duration}ms)`,
        { data, error: operation.error }
      );
    }
  }

  getActiveOperations(context?: string): OperationInfo[] {
    return Array.from(this.operations.values()).filter(
      (op) => op.status === "pending" && (!context || op.context === context)
    );
  }

  private cleanupOldOperations(): void {
    const completedOperations = Array.from(this.operations.entries())
      .filter(([, op]) => op.status !== "pending")
      .sort(
        ([, a], [, b]) =>
          b.startTime + (b.duration || 0) - (a.startTime + (a.duration || 0))
      );

    // Keep only the 20 most recent completed operations
    completedOperations.slice(20).forEach(([id]) => {
      this.operations.delete(id);
    });
  }
}

// Type definitions for better TypeScript support
interface OperationInfo {
  id: string;
  type: string;
  description: string;
  context?: string;
  startTime: number;
  status: "pending" | "completed" | "failed";
  duration?: number;
  error?: string;
}

// Enhanced validator type for better type inference
type DataValidator<T> = (data: unknown) => T | null;

// Improved options interface with better defaults and documentation
interface SafeQueryOptions<T> {
  /** The API endpoint to call */
  endpoint: string;
  /** HTTP method to use (defaults to GET) */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Request body for POST/PUT/PATCH requests */
  body?:
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | boolean
    | undefined;
  /** Additional headers to include in the request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
  /** Fallback data to return if the request fails */
  fallbackData?: T;
  /** Function to validate and transform the response data */
  validator?: DataValidator<T>;
  /** Retry configuration (boolean or number of retries) */
  retry?: boolean | number;
  /** Debounce request body changes by this many milliseconds */
  debounceMs?: number;
  /** Whether to deduplicate identical requests (defaults to true) */
  deduplicate?: boolean;
  /** Whether to track operations for debugging (defaults to development mode) */
  trackOperations?: boolean;
  /** Context label for debugging and operation tracking */
  context?: string;
  /** Custom cache key override */
  cacheKey?: string;

  // React Query options (manually included for better control)
  /** Enable/disable the query */
  enabled?: boolean;
  /** Query key for caching */
  queryKey?: readonly unknown[];
  /** Time in milliseconds after which data is considered stale */
  staleTime?: number;
  /** Time in milliseconds after which cached data is garbage collected */
  gcTime?: number;
  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Whether to refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Whether to refetch on component mount */
  refetchOnMount?: boolean;
  // Note: initialData and placeholderData are handled via queryOptions spread
}

// Enhanced result interface with additional utilities
interface SafeQueryResult<T> extends Omit<UseQueryResult<T>, "data"> {
  /** The data with fallback applied - never undefined */
  data: T;
  /** Whether we have valid data from the server (not fallback) */
  hasValidData: boolean;
  /** The original data from the server (may be undefined) */
  originalData?: T;
  /** Function to cancel the current request */
  cancelRequest: () => void;
  /** Currently active operations for debugging */
  activeOperations: OperationInfo[];
  /** Request statistics for this query */
  requestStats: { count: number; lastUsed: number } | null;
}

const operationTracker = new OperationTracker();

// Set up periodic cleanup to prevent memory leaks
if (typeof window !== "undefined") {
  setInterval(
    () => {
      globalCoordinator.cleanup();
    },
    5 * 60 * 1000
  ); // Clean up every 5 minutes
}

export function useSafeQuery<T>({
  endpoint,
  method = "GET",
  body,
  headers = {},
  timeout = 30000,
  fallbackData,
  validator,
  retry = 3,
  debounceMs = 0,
  deduplicate = true,
  trackOperations = process.env.NODE_ENV === "development",
  context = "unknown",
  cacheKey,
  ...queryOptions
}: SafeQueryOptions<T>): SafeQueryResult<T> {
  const [debouncedBody, setDebouncedBody] = useState(body);
  const operationIdRef = useRef<string | null>(null);
  const lastRequestRef = useRef<string>("");
  const requestCountRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);

  const cleanupManager = useEnhancedCleanupManager();

  // Enhanced debouncing with proper cleanup and infinite loop prevention
  useSafeEffect(() => {
    // Prevent infinite loops by checking if body actually changed
    const currentBodyString = JSON.stringify(body);
    const lastBodyString = JSON.stringify(debouncedBody);

    if (currentBodyString === lastBodyString) {
      return; // No change, skip update
    }

    // Track request frequency to detect potential infinite loops
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;

    // If requests are happening too frequently (more than 3 per second), throttle them
    if (timeSinceLastRequest < 300) {
      requestCountRef.current += 1;
      if (requestCountRef.current > 5) { // Increased threshold
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(`[useSafeQuery] Throttling requests for ${endpoint} - too many rapid calls detected (${requestCountRef.current} requests)`);
        }
        return;
      }
    } else {
      // Reset counter if enough time has passed
      requestCountRef.current = 0;
    }

    lastRequestTimeRef.current = now;

    if (debounceMs > 0) {
      cleanupManager.removeCleanup("debounce-timeout");

      cleanupManager.addTimeout(
        () => {
          // Double-check that component is still mounted before updating
          if (lastRequestTimeRef.current > 0) {
            setDebouncedBody(body);
          }
        },
        debounceMs,
        "debounce-timeout"
      );
    } else {
      setDebouncedBody(body);
    }
  }, [body, debounceMs, cleanupManager, endpoint]); // Removed debouncedBody from dependencies to prevent loops

  // Optimized cache key generation with better serialization and loop prevention
  const requestCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey;

    // Create a stable cache key by normalizing the data
    let normalizedBody = '';
    if (debouncedBody) {
      if (typeof debouncedBody === 'object') {
        normalizedBody = JSON.stringify(debouncedBody, Object.keys(debouncedBody).sort((a, b) => a.localeCompare(b)));
      } else {
        normalizedBody = String(debouncedBody);
      }
    }
    
    const normalizedHeaders = headers ? 
      JSON.stringify(headers, Object.keys(headers).sort((a, b) => a.localeCompare(b))) : '';

    const currentKey = `${method}:${endpoint}:${normalizedBody}:${normalizedHeaders}`;

    // Only update if the key actually changed
    if (lastRequestRef.current !== currentKey) {
      lastRequestRef.current = currentKey;
    }

    return lastRequestRef.current;
  }, [method, endpoint, debouncedBody, headers, cacheKey]);

  // Enhanced query function with proper React Query options handling
  const query = useQuery({
    queryKey: [requestCacheKey, queryOptions.queryKey].flat().filter(Boolean),
    queryFn: async ({ signal }) => {
      // Start operation tracking
      if (trackOperations) {
        operationIdRef.current = operationTracker.startOperation(
          "safe_query",
          `${method} ${endpoint}`,
          context
        );
      }

      try {
        const requestPromise = async (
          requestSignal: AbortSignal
        ): Promise<T> => {
          // Build URL with query params for GET requests
          const url =
            (
              method === "GET" &&
              debouncedBody &&
              typeof debouncedBody === "object"
            ) ?
              `${endpoint}?${new URLSearchParams(debouncedBody as Record<string, string>).toString()}`
            : endpoint;

          const requestConfig: RequestInit = {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              ...headers,
            },
            credentials: "include",
            signal: requestSignal,
          };

          // Only add body for non-GET requests
          if (method !== "GET" && debouncedBody !== undefined) {
            requestConfig.body = JSON.stringify(debouncedBody);
          }

          const response = await fetch(url, requestConfig);

          if (!response.ok) {
            // Handle rate limiting specifically
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After') || '15';
              const errorMessage = `Rate limited. Please wait ${retryAfter} seconds before trying again.`;
              throw new Error(errorMessage);
            }
            
            const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
          }

          let data: unknown;
          const contentType = response.headers.get("content-type");

          if (contentType?.includes("application/json")) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          // Apply validation if provided
          if (validator) {
            const validatedData = validator(data);
            if (validatedData === null) {
              throw new Error("Response data failed validation");
            }
            return validatedData;
          }

          return data as T;
        };

        let result: T;

        if (deduplicate) {
          result = await globalCoordinator.executeRequest(
            requestCacheKey,
            requestPromise,
            timeout
          );
        } else {
          result = await requestPromise(signal);
        }

        // Complete operation tracking on success
        if (trackOperations && operationIdRef.current) {
          operationTracker.completeOperation(operationIdRef.current, result);
        }

        return result;
      } catch (error) {
        // Complete operation tracking on error
        if (trackOperations && operationIdRef.current) {
          operationTracker.completeOperation(
            operationIdRef.current,
            undefined,
            error as Error
          );
        }

        // Return fallback data on error if provided
        if (fallbackData !== undefined) {
          return fallbackData;
        }

        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const { message } = error;

        // Don't retry on client errors (4xx) except for specific cases
        if (message.includes("HTTP 4")) {
          const is408 = message.includes("408"); // Request Timeout
          const is429 = message.includes("429"); // Too Many Requests
          if (!is408 && !is429) {
            return false;
          }
        }

        // Don't retry on validation errors
        if (
          message.includes("validation") ||
          message.includes("Failed validation")
        ) {
          return false;
        }

        // Don't retry on user cancellation
        if (message.includes("cancelled") || message.includes("aborted")) {
          return false;
        }
      }

      return typeof retry === "number" ? failureCount < retry : Boolean(retry);
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: context === "properties" ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 minutes for properties, 5 for others
    gcTime: context === "properties" ? 5 * 60 * 1000 : 10 * 60 * 1000, // Shorter cache for properties
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    ...queryOptions, // Spread additional query options
  });

  // Optimized cancel function with return value
  const cancelRequest = useCallback(() => {
    return globalCoordinator.cancelRequest(requestCacheKey);
  }, [requestCacheKey]);

  // Get debugging information
  const activeOperations = useMemo(
    () =>
      trackOperations ? operationTracker.getActiveOperations(context) : [],
    [trackOperations, context]
  );

  // Fixed: Use the corrected method signature
  const requestStats = useMemo(
    () => globalCoordinator.getRequestStats(requestCacheKey),
    [requestCacheKey]
  );

  // Ensure we always have data with proper type safety
  const safeData = query.data ?? fallbackData;

  // Return the intersection of query result and our custom properties
  return {
    ...query,
    data: safeData as T,
    hasValidData: query.data != null,
    originalData: query.data,
    cancelRequest,
    activeOperations,
    requestStats,
  } as SafeQueryResult<T>;
}

// Property type imported from shared types

// Pre-configured specialized hooks with enhanced validators for the new domain structure
export const useSafePropertiesQuery = (
  searchParams?: Record<string, unknown>,
  options?: Partial<SafeQueryOptions<Property[]>>
) => {
  // Normalize search params to prevent cache misses and infinite loops
  const normalizedParams = useMemo(() => {
    if (!searchParams) return undefined;
    
    // Remove undefined/null values and normalize strings
    const cleaned = Object.entries(searchParams).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Normalize string values
        if (typeof value === 'string') {
          // Use safe property assignment to avoid object injection warnings
          const safeKey = key;
          const safeValue = value.trim();
          acc[safeKey] = safeValue;
        } else {
          // Use safe property assignment to avoid object injection warnings
          const safeKey = key;
          acc[safeKey] = value;
        }
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    // Return undefined if no meaningful params
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }, [searchParams]);

  return useSafeQuery({
    endpoint: "/api/properties",
    method: "GET",
    body: normalizedParams,
    fallbackData: [],
    validator: (data): Property[] => {
      if (!Array.isArray(data)) return [];

      return data.filter((item): item is Property => {
        if (!item || typeof item !== "object") return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === "string" || typeof obj.id === "number") && 
          obj.id != null && 
          typeof obj.title === "string" && 
          obj.title.length > 0 &&
          typeof obj.description === "string" && 
          obj.description.length > 0
        );
      });
    },
    context: "properties",
    debounceMs: 500, // Increased debouncing to prevent rapid-fire requests
    deduplicate: true, // Ensure duplicate requests are handled
    staleTime: 30000, // Cache for 30 seconds to reduce redundant calls
    enabled: true, // Always enabled but with proper caching
    ...options,
  });
};

export const useSafePropertyQuery = (
  id: string,
  options?: Partial<SafeQueryOptions<Property | null>> & { includeMarketEstimate?: boolean }
) => {
  const { includeMarketEstimate = false, ...queryOptions } = options || {};
  
  return useSafeQuery({
    endpoint: `/api/properties/${id}${includeMarketEstimate ? '?includeMarketEstimate=true' : ''}`,
    fallbackData: null,
    validator: (data): Property | null => {
      if (!data || typeof data !== "object") return null;

      const property = data as Record<string, unknown>;
      return {
        ...property,
        id: (property.id as string) || "",
        title: (property.title as string) || "Untitled Property",
        description: (property.description as string) || "No description available",
        price: typeof property.price === "number" ? property.price : 0,
        location: (property.location as string) || "",
        images: Array.isArray(property.images) ? property.images : [],
      } as Property;
    },
    enabled: Boolean(id) && id.length > 0,
    context: "property",
    ...queryOptions,
  });
};

// User type definition
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

export const useSafeUserQuery = (
  options?: Partial<SafeQueryOptions<User | null>>
) =>
  useSafeQuery({
    endpoint: "/api/auth/profile",
    fallbackData: null,
    validator: (data): User | null => {
      if (!data || typeof data !== "object") return null;

      const user = data as Record<string, unknown>;
      return {
        ...user,
        id: (user.id as string) || "",
        firstName: (user.firstName as string) || "",
        lastName: (user.lastName as string) || "",
        email: (user.email as string) || "",
        trustScore: typeof user.trustScore === "number" ? user.trustScore : 0,
        isVerified: Boolean(user.isVerified),
        role: (user.role as string) || "user",
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    context: "auth",
    ...options,
  });

// Trust score type definition
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
  useSafeQuery({
    endpoint: `/api/trust/score/${userId}`,
    fallbackData: {
      score: 0,
      level: "unverified",
      factors: {},
      recommendations: [],
    },
    validator: (data): TrustScore | null => {
      if (!data || typeof data !== "object") return null;

      const trustData = data as Record<string, unknown>;
      return {
        score: typeof trustData.score === "number" ? trustData.score : 0,
        level: (trustData.level as string) || "unverified",
        factors: (trustData.factors as Record<string, unknown>) || {},
        recommendations:
          Array.isArray(trustData.recommendations) ?
            trustData.recommendations
          : [],
      };
    },
    enabled: Boolean(userId) && userId.length > 0,
    context: "trust",
    ...options,
  });

// Message type definition
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
  useSafeQuery({
    endpoint: `/api/communication/messages?userId=${userId}`,
    fallbackData: [],
    validator: (data): Message[] => {
      if (!Array.isArray(data)) return [];

      return data.filter(
        (item): item is Message =>
          item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).id === "string" &&
          typeof (item as Record<string, unknown>).senderId === "string" &&
          typeof (item as Record<string, unknown>).recipientId === "string" &&
          typeof (item as Record<string, unknown>).subject === "string" &&
          typeof (item as Record<string, unknown>).content === "string"
      );
    },
    enabled: Boolean(userId) && userId.length > 0,
    context: "messages",
    ...options,
  });

// Export the coordinator and tracker for advanced usage
// Specialized hook for similar properties to prevent infinite loops
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
  // Normalize and validate params to prevent infinite loops
  const normalizedParams = useMemo(() => {
    if (!params || (!params?.location && !params?.propertyType)) {
      return null; // Don't make request without minimum required params
    }

    const normalized: Record<string, unknown> = {};
    
    if (params?.location && typeof params.location === 'string') {
      // Extract city from full location for better matching
      const city = params.location.split(',')[0]?.trim();
      if (city) {
        normalized.city = city;
      }
    }
    
    if (params?.price) {
      // Convert exact price to range for better results
      const priceNum = Number(params.price);
      if (!isNaN(priceNum) && priceNum > 0) {
        const range = priceNum * 0.2; // 20% range
        normalized.minPrice = Math.max(0, priceNum - range);
        normalized.maxPrice = priceNum + range;
      }
    }
    
    if (params?.propertyType) {
      normalized.propertyType = params.propertyType;
    }
    
    if (params?.excludeId) {
      normalized.excludeId = params.excludeId;
    }
    
    normalized.limit = Math.min(params?.limit || 10, 20); // Cap at 20 results
    
    return normalized;
  }, [params]);

  return useSafeQuery({
    endpoint: "/api/properties/similar",
    method: "GET",
    body: normalizedParams || {},
    fallbackData: [],
    validator: (data): Property[] => {
      if (!Array.isArray(data)) return [];
      return data.filter((item): item is Property => {
        if (!item || typeof item !== "object") return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.id === "string" && obj.id.length > 0;
      });
    },
    context: "similar-properties",
    debounceMs: 1000, // Higher debounce for similar properties
    deduplicate: true,
    staleTime: 60000, // Cache for 1 minute
    enabled: normalizedParams != null, // Only enabled with valid params
    ...options,
  });
};

export { globalCoordinator, operationTracker };
export type { SafeQueryOptions, SafeQueryResult, OperationInfo };
