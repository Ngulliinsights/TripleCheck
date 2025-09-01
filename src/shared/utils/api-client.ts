// Enhanced API client with race condition protection

// Enhanced type definitions with better constraints
type RequestCacheType =
  | "default"
  | "no-store"
  | "reload"
  | "no-cache"
  | "force-cache"
  | "only-if-cached";
type RequestPriority = "low" | "normal" | "high";
type AuthTokenFunction = () => string | Promise<string> | null;

export interface ApiRequestOptions {
  // Custom options
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  validateResponse?: boolean;
  transform?: <T>(data: unknown) => T;
  onRetry?: (attempt: number, error: Error) => void;
  priority?: RequestPriority;

  // Standard RequestInit properties
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCacheType;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
  window?: null;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  status: number;
  headers?: Record<string, string>;
  cached?: boolean;
  requestId: string;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

import { cacheService as enhancedCache } from "../../../core/src/cache"

// Request cache for preventing duplicate requests
const requestCache = new Map<string, Promise<ApiResponse<unknown>>>();

// Default cache TTL (5 minutes)
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
};

// Request ID generator for better debugging
const generateRequestId = (): string => {
  // Use crypto API if available, otherwise fall back to timestamp-based ID
  if (globalThis?.crypto?.randomUUID) {
    return `req_${Date.now()}_${globalThis.crypto.randomUUID().substring(0, 8)}`;
  }
  // Fallback for environments without crypto API
  return `req_${Date.now()}_${Date.now().toString(36)}`;
};

// Enhanced API client with race condition protection
export class ApiClient {
  private baseUrl: string;
  private defaultOptions: ApiRequestOptions;

  constructor(
    config: { baseUrl?: string; defaultOptions?: ApiRequestOptions } = {}
  ) {
    this.baseUrl = config.baseUrl || "";
    this.defaultOptions = {
      timeout: 10000,
      retries: DEFAULT_RETRY_CONFIG.retries,
      retryDelay: DEFAULT_RETRY_CONFIG.retryDelay,
      useCache: false,
      ...config.defaultOptions,
    };
  }

  private createAbortController(
    timeout: number,
    signal?: AbortSignal
  ): AbortController {
    const controller = new AbortController();

    // Set timeout
    setTimeout(() => controller.abort(), timeout);

    // Forward external abort signal
    signal?.addEventListener("abort", () => {
      controller.abort();
    });

    return controller;
  }

  private getCacheKey(url: string, options: ApiRequestOptions): string {
    const method = options.method || "GET";
    const headers = JSON.stringify(options.headers || {});
    const body = options.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${headers}:${body}`;
  }

  private getCachedResponse<T>(cacheKey: string): ApiResponse<T> | null {
    return enhancedCache.get<ApiResponse<T>>(cacheKey);
  }

  private setCachedResponse<T>(
    cacheKey: string,
    data: ApiResponse<T>,
    ttl = DEFAULT_CACHE_TTL
  ): void {
    enhancedCache.set(cacheKey, data, ttl);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const delay =
      baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
    // Use secure random if available, otherwise use timestamp-based jitter
    let jitter: number;
    if (globalThis?.crypto?.getRandomValues) {
      const randomArray = new Uint32Array(1);
      globalThis.crypto.getRandomValues(randomArray);
      jitter = ((randomArray[0] ?? 0) / 2 ** 32) * 0.1 * delay;
    } else {
      // Fallback: use timestamp-based pseudo-random for jitter
      jitter = ((Date.now() % 1000) / 1000) * 0.1 * delay;
    }
    return Math.min(delay + jitter, DEFAULT_RETRY_CONFIG.maxDelay);
  }

  private buildRequestInit(
    options: ApiRequestOptions,
    signal: AbortSignal
  ): RequestInit {
    const requestInit: RequestInit = { signal };

    if (options.method) requestInit.method = options.method;
    if (options.headers) requestInit.headers = options.headers;
    if (options.body !== undefined) requestInit.body = options.body || null;
    if (options.mode) requestInit.mode = options.mode;
    if (options.credentials) requestInit.credentials = options.credentials;
    if (options.cache) requestInit.cache = options.cache as RequestCache;
    if (options.redirect) requestInit.redirect = options.redirect;
    if (options.referrer) requestInit.referrer = options.referrer;
    if (options.referrerPolicy)
      requestInit.referrerPolicy = options.referrerPolicy;
    if (options.integrity) requestInit.integrity = options.integrity;
    if (options.keepalive) requestInit.keepalive = options.keepalive;
    if (options.window !== undefined) requestInit.window = options.window;

    return requestInit;
  }

  private async processResponse<T>(
    response: Response,
    options: ApiRequestOptions,
    requestId: string
  ): Promise<ApiResponse<T>> {
    let data: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Apply transformation if provided
    if (options.transform) {
      data = options.transform(data);
    }

    return {
      data: data as T,
      success: true,
      message: (data as Record<string, unknown>)?.message as string,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      requestId,
    };
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error = new Error("Request failed");

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (
          error instanceof TypeError ||
          (error as Error & { name?: string })?.name === "AbortError" ||
          (error as Error & { status?: number })?.status === 401 ||
          (error as Error & { status?: number })?.status === 403
        ) {
          throw error;
        }

        if (attempt < retries) {
          await this.sleep(this.calculateRetryDelay(attempt, retryDelay));
        }
      }
    }

    throw lastError;
  }

  async request<T = unknown>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
    const requestId = generateRequestId();

    // Create cache key
    const cacheKey =
      mergedOptions.cacheKey || this.getCacheKey(fullUrl, mergedOptions);

    // Check response cache first
    if (mergedOptions.useCache) {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return { ...cached, cached: true, requestId };
      }
    }

    // Check for ongoing request to prevent race conditions
    if (requestCache.has(cacheKey)) {
      const existingRequest = requestCache.get(cacheKey);
      if (existingRequest) {
        return (await existingRequest) as ApiResponse<T>;
      }
    }

    // Create abort controller
    const controller = this.createAbortController(
      mergedOptions.timeout || 10000,
      mergedOptions.signal
    );

    const requestPromise = this.executeWithRetry<ApiResponse<T>>(
      async () => {
        const requestInit = this.buildRequestInit(
          mergedOptions,
          controller.signal
        );

        const response = await fetch(fullUrl, requestInit);

        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          const error = new Error(errorMessage) as Error & { status: number };
          error.status = response.status;
          throw error;
        }

        const result = await this.processResponse<T>(
          response,
          mergedOptions,
          requestId
        );

        // Cache successful responses
        if (mergedOptions.useCache) {
          this.setCachedResponse(
            cacheKey,
            result,
            mergedOptions.cacheTtl || DEFAULT_CACHE_TTL
          );
        }

        return result;
      },
      mergedOptions.retries || 0,
      mergedOptions.retryDelay || 1000
    );

    // Cache the request promise to prevent duplicate requests
    requestCache.set(cacheKey, requestPromise as Promise<ApiResponse<unknown>>);

    try {
      return await requestPromise;
    } catch (error) {
      const errorResult: ApiResponse<T> = {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: (error as Error & { status?: number })?.status || 0,
        requestId,
      };
      return errorResult;
    } finally {
      // Clean up request cache
      requestCache.delete(cacheKey);
    }
  }

  // Enhanced convenience methods with better type safety
  async get<T = unknown>(
    url: string,
    options: Omit<ApiRequestOptions, "method"> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "GET",
      useCache: options.useCache ?? true,
    });
  }

  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete<T = unknown>(
    url: string,
    options: Omit<ApiRequestOptions, "method"> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  // Cache management methods
  clearCache(): void {
    requestCache.clear();
    enhancedCache.clear();
  }

  clearCacheEntry(cacheKey: string): void {
    requestCache.delete(cacheKey);
    enhancedCache.delete(cacheKey);
  }

  // Get cache statistics
  getCacheStats() {
    return enhancedCache.getStats();
  }

  // Warm cache with data
  warmCache<T>(
    entries: Array<{ key: string; data: ApiResponse<T>; ttl?: number }>
  ) {
    return enhancedCache.warm(entries);
  }
}

// Default API client instance
export const apiClient = new ApiClient({ baseUrl: "/api" });

// Enhanced authenticated API client
export class AuthenticatedApiClient extends ApiClient {
  private getAuthToken?: AuthTokenFunction;
  private refreshToken?: () => Promise<string>;

  constructor(
    config: {
      baseUrl?: string;
      defaultOptions?: ApiRequestOptions;
      getAuthToken?: AuthTokenFunction;
      refreshToken?: () => Promise<string>;
    } = {}
  ) {
    const { getAuthToken, refreshToken, ...apiConfig } = config;

    super({
      baseUrl: apiConfig.baseUrl || "/api",
      defaultOptions: {
        headers: {
          "Content-Type": "application/json",
        },
        ...apiConfig.defaultOptions,
      },
    });

    if (getAuthToken) this.getAuthToken = getAuthToken;
    if (refreshToken) this.refreshToken = refreshToken;

    // Override request method to add authentication
    const originalRequest = this.request.bind(this);
    this.request = async <T = unknown>(
      url: string,
      options: ApiRequestOptions = {}
    ) => {
      const token = await this.getAuthToken?.();
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await originalRequest<T>(url, options);

      // Handle token refresh on 401
      if (!response.success && response.status === 401 && this.refreshToken) {
        try {
          await this.refreshToken();
          const newToken = await this.getAuthToken?.();
          if (newToken) {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return originalRequest<T>(url, options);
          }
        } catch (refreshError) {
          // Token refresh failed, continue with original response
          // In production, you might want to log this to your error tracking service
          if (
            refreshError instanceof Error &&
            refreshError.message.includes("network")
          ) {
            // Handle network errors specifically if needed
          }
          // Continue with original response regardless of refresh error
        }
      }

      return response;
    };
  }
}

// Export utility functions
export const createApiClient = (config?: {
  baseUrl?: string;
  defaultOptions?: ApiRequestOptions;
}) => new ApiClient(config);

export const createAuthenticatedApiClient = (config?: {
  baseUrl?: string;
  defaultOptions?: ApiRequestOptions;
  getAuthToken?: AuthTokenFunction;
  refreshToken?: () => Promise<string>;
}) => new AuthenticatedApiClient(config);
