/**
 * Advanced API client for making HTTP requests
 * Provides interceptors, intelligent caching, request batching, and enhanced retry mechanisms
 */

// Constants to avoid duplicate strings
const UNKNOWN_ERROR = 'Unknown error';

// Enhanced interface with better type safety for error responses
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
  readonly status?: number;
  readonly timestamp?: string;
}

// Interceptor interfaces for request/response handling
export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  onFulfilled?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onRejected?: (error: Error) => Error | Promise<Error>;
}

export interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

// Cache interfaces for intelligent caching
export interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly ttl: number;
  readonly accessCount: number;
  readonly lastAccessed: number;
}

export interface CacheStrategy {
  readonly type: 'LRU' | 'TTL' | 'FIFO';
  readonly maxSize: number;
  readonly defaultTTL: number;
}

// Batch request interfaces
export interface BatchRequest {
  readonly id: string;
  readonly endpoint: string;
  readonly options: RequestOptions;
}

export interface BatchResponse<T = unknown> {
  readonly id: string;
  readonly response: ApiResponse<T>;
}

// More comprehensive request options with better defaults
export interface RequestOptions {
  readonly method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly timeout?: number;
}

// Enhanced configuration interface with advanced features
export interface ApiClientConfig {
  readonly baseUrl?: string;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
  readonly cacheStrategy?: CacheStrategy;
  readonly enableBatching?: boolean;
  readonly batchDelay?: number;
  readonly maxBatchSize?: number;
}

// Note: ApiError interface removed as it wasn't being used
// The error handling is now integrated directly into the response processing

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  // Advanced features
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheStrategy: CacheStrategy;
  private readonly enableBatching: boolean;
  private readonly batchDelay: number;
  private readonly maxBatchSize: number;
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? "/api";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 10000;
    this.retryAttempts = config.retryAttempts ?? 3; // Enhanced default
    this.retryDelay = config.retryDelay ?? 1000;

    // Initialize advanced features
    this.cacheStrategy = config.cacheStrategy ?? {
      type: 'LRU',
      maxSize: 100,
      defaultTTL: 300000, // 5 minutes
    };
    this.enableBatching = config.enableBatching ?? false;
    this.batchDelay = config.batchDelay ?? 50; // 50ms batch window
    this.maxBatchSize = config.maxBatchSize ?? 10;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Clear all interceptors
   */
  clearInterceptors(): void {
    this.requestInterceptors.length = 0;
    this.responseInterceptors.length = 0;
  }

  /**
   * Make an HTTP request with enhanced error handling, caching, and retry logic
   * @param endpoint - The API endpoint to call
   * @param options - Request configuration options
   * @returns Promise resolving to ApiResponse with type safety
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig = this.prepareRequestConfig(endpoint, options);

    // Check cache for GET requests
    const cachedResponse = this.checkCache<T>(requestConfig.method, requestConfig.url);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Handle batching if enabled
    if (this.shouldUseBatching(requestConfig.method)) {
      return this.handleBatchRequest<T>(endpoint, options);
    }

    return this.executeRequest<T>(requestConfig, options.timeout ?? this.timeout);
  }

  /**
   * Prepare request configuration with proper URL and headers
   * @private
   */
  private prepareRequestConfig(endpoint: string, options: RequestOptions): RequestConfig {
    const { method = "GET", headers = {}, body, signal } = options;

    // Ensure endpoint starts with forward slash for proper URL construction
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return {
      url,
      method,
      headers: { ...this.defaultHeaders, ...headers },
      body,
      ...(signal && { signal }),
    };
  }

  /**
   * Check cache for GET requests
   * @private
   */
  private checkCache<T>(method: string, url: string): ApiResponse<T> | null {
    if (method === "GET") {
      return this.getCachedResponse<T>(url);
    }
    return null;
  }

  /**
   * Determine if batching should be used
   * @private
   */
  private shouldUseBatching(method: string): boolean {
    return this.enableBatching && method === "GET";
  }

  /**
   * Execute the request with interceptors and error handling
   * @private
   */
  private async executeRequest<T>(requestConfig: RequestConfig, timeout: number): Promise<ApiResponse<T>> {
    // Apply request interceptors
    let config = requestConfig;
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    // Set up timeout handling
    const { timeoutController, timeoutId } = this.setupTimeout(timeout);
    const effectiveSignal = config.signal ?? timeoutController.signal;

    try {
      let response = await this.executeRequestWithRetry<T>(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: effectiveSignal,
      });

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      // Cache successful GET responses
      if (config.method === "GET" && response.success) {
        this.setCachedResponse(config.url, response);
      }

      return response;
    } catch (error) {
      const processedError = await this.applyErrorInterceptors(error);
      return this.createErrorResponse<T>(processedError);
    } finally {
      this.cleanupTimeout(timeoutId);
    }
  }

  /**
   * Set up timeout handling
   * @private
   */
  private setupTimeout(timeout: number): { timeoutController: AbortController; timeoutId: number | NodeJS.Timeout | undefined } {
    const timeoutController = new AbortController();
    let timeoutId: NodeJS.Timeout | number | undefined;

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        timeoutController.abort();
      }, timeout);
    }

    return { timeoutController, timeoutId };
  }

  /**
   * Apply response interceptors
   * @private
   */
  private async applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        processedResponse = await interceptor.onFulfilled(processedResponse);
      }
    }
    return processedResponse;
  }

  /**
   * Apply error interceptors
   * @private
   */
  private async applyErrorInterceptors(error: unknown): Promise<Error> {
    let processedError = error instanceof Error ? error : new Error(UNKNOWN_ERROR);
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onRejected) {
        processedError = await interceptor.onRejected(processedError);
      }
    }
    return processedError;
  }

  /**
   * Clean up timeout to prevent memory leaks
   * @private
   */
  private cleanupTimeout(timeoutId?: NodeJS.Timeout | number): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle batch request processing
   * @private
   */
  private async handleBatchRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      const requestId = `${Date.now()}-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`;

      this.batchQueue.push({
        id: requestId,
        endpoint,
        options,
      });

      // Set up batch processing if not already scheduled
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }

      // Process immediately if batch is full
      if (this.batchQueue.length >= this.maxBatchSize) {
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
          this.batchTimeout = null;
        }
        this.processBatch();
      }

      // Store resolver for this request with type assertion to handle generic compatibility
      this.batchResolvers.set(requestId, resolve as (response: ApiResponse<unknown>) => void);
    });
  }

  private batchResolvers = new Map<string, (response: ApiResponse<unknown>) => void>();

  /**
   * Process batched requests
   * @private
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const currentBatch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Process all requests in parallel
    const batchPromises = currentBatch.map(async (batchRequest) => {
      try {
        const response = await this.executeSingleRequest(
          batchRequest.endpoint,
          batchRequest.options
        );
        return { id: batchRequest.id, response };
      } catch (error) {
        return {
          id: batchRequest.id,
          response: this.createErrorResponse(error instanceof Error ? error : new Error("Batch request failed")),
        };
      }
    });

    const results = await Promise.allSettled(batchPromises);

    // Resolve individual request promises
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, response } = result.value;
        const resolver = this.batchResolvers.get(id);
        if (resolver) {
          resolver(response);
          this.batchResolvers.delete(id);
        }
      }
    });
  }

  /**
   * Execute a single request without batching
   * @private
   */
  private async executeSingleRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    return this.executeRequestWithRetry<T>(url, {
      method: options.method ?? "GET",
      headers: { ...this.defaultHeaders, ...options.headers },
      body: options.body,
      signal: options.signal ?? new AbortController().signal,
    });
  }

  /**
   * Execute request with retry logic for transient failures
   * @private
   */
  private async executeRequestWithRetry<T>(
    url: string,
    options: Omit<RequestOptions, "timeout"> & { signal: AbortSignal }
  ): Promise<ApiResponse<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.executeHttpRequest<T>(url, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(UNKNOWN_ERROR);

        // Don't retry on client errors (4xx) or if this is the last attempt
        if (
          attempt === this.retryAttempts ||
          lastError.name === "AbortError" ||
          this.isClientError(lastError)
        ) {
          break;
        }

        // Wait before retrying with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    // Handle the final error after all retries exhausted
    return this.createErrorResponse<T>(lastError);
  }

  /**
   * Execute the actual HTTP request
   * @private
   */
  private async executeHttpRequest<T>(
    url: string,
    options: Omit<RequestOptions, "timeout"> & { signal: AbortSignal }
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, signal } = options;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal,
    };

    // Add body for non-GET requests with proper content handling
    if (body !== undefined && method !== "GET") {
      if (typeof body === "string") {
        requestOptions.body = body;
      } else if (body instanceof FormData || body instanceof URLSearchParams) {
        requestOptions.body = body;
        // Remove Content-Type header to let browser set it with boundary for FormData
        if (body instanceof FormData) {
          delete requestHeaders["Content-Type"];
        }
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, requestOptions);
    return this.processResponse<T>(response);
  }

  /**
   * Process the fetch response and extract data
   * @private
   */
  private async processResponse<T>(
    response: globalThis.Response
  ): Promise<ApiResponse<T>> {
    let data: T;
    const contentType = response.headers.get("content-type") ?? "";

    try {
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType.includes("text/")) {
        data = (await response.text()) as unknown as T;
      } else {
        // For binary data or other content types
        data = (await response.blob()) as unknown as T;
      }
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Parse error';
      return {
        success: false,
        error: "Failed to parse response",
        message: `The server response could not be parsed: ${errorMessage}`,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    if (!response.ok) {
      const errorMessage = this.extractErrorMessage(data);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: errorMessage,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data,
      status: response.status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract error message from response data
   * @private
   */
  private extractErrorMessage(data: unknown): string {
    if (typeof data === "object" && data !== null) {
      const errorObj = data as Record<string, unknown>;
      if (typeof errorObj.message === "string") {
        return errorObj.message;
      }
      if (typeof errorObj.error === "string") {
        return errorObj.error;
      }
    }
    return "Request failed";
  }

  /**
   * Create standardized error response
   * @private
   */
  private createErrorResponse<T>(error: Error | undefined): ApiResponse<T> {
    if (!error) {
      return {
        success: false,
        error: UNKNOWN_ERROR,
        message: "An unknown error occurred",
        timestamp: new Date().toISOString(),
      };
    }

    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Request was cancelled",
        message: "The request was cancelled",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "Network error occurred",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if error is a client error (4xx status)
   * @private
   */
  private isClientError(error: Error): boolean {
    const { message } = error;
    return (
      message.includes("HTTP 4") ||
      message.includes("Bad Request") ||
      message.includes("Unauthorized") ||
      message.includes("Forbidden")
    );
  }

  /**
   * Delay execution for retry logic
   * @private
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request with enhanced type safety
   */
  async get<T = unknown>(
    endpoint: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", ...(signal && { signal }) });
  }

  /**
   * POST request with enhanced type safety
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body, ...(signal && { signal }) });
  }

  /**
   * PUT request with enhanced type safety
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body, ...(signal && { signal }) });
  }

  /**
   * DELETE request with enhanced type safety
   */
  async delete<T = unknown>(
    endpoint: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", ...(signal && { signal }) });
  }

  /**
   * PATCH request with enhanced type safety
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body, ...(signal && { signal }) });
  }

  /**
   * Get authentication token from storage with error handling
   * @private
   */
  private getAuthToken(): string | null {
    // Guard against server-side rendering environments
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return (
        localStorage.getItem("auth_token") ??
        sessionStorage.getItem("auth_token") ??
        null
      );
    } catch (storageError) {
      // Storage might be unavailable (incognito mode, disabled, etc.)
      // Log error in development mode for debugging
      if (process.env.NODE_ENV === 'development' && storageError instanceof Error) {
        // eslint-disable-next-line no-console
        console.warn('Storage access failed:', storageError.message);
      }
      return null;
    }
  }

  /**
   * Update base URL for all subsequent requests
   */
  setBaseUrl(baseUrl: string): void {
    if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
      throw new Error("Base URL must be a non-empty string");
    }
    // Remove trailing slash to ensure consistent URL construction
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Update default headers (merge with existing)
   */
  setDefaultHeaders(headers: Readonly<Record<string, string>>): void {
    if (!headers || typeof headers !== "object") {
      throw new Error("Headers must be a valid object");
    }
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Reset default headers to initial state
   */
  clearDefaultHeaders(): void {
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Get cached response if available and valid
   * @private
   */
  private getCachedResponse<T>(url: string): ApiResponse<T> | null {
    const entry = this.cache.get(url) as CacheEntry<ApiResponse<T>> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(url);
      return null;
    }

    // Update access information for LRU strategy
    if (this.cacheStrategy.type === 'LRU') {
      const updatedEntry: CacheEntry<ApiResponse<T>> = {
        ...entry,
        accessCount: entry.accessCount + 1,
        lastAccessed: now,
      };
      this.cache.set(url, updatedEntry);
    }

    return entry.data;
  }

  /**
   * Set cached response with appropriate strategy
   * @private
   */
  private setCachedResponse<T>(url: string, response: ApiResponse<T>): void {
    const now = Date.now();

    // Enforce cache size limit
    if (this.cache.size >= this.cacheStrategy.maxSize) {
      this.evictCacheEntry();
    }

    const entry: CacheEntry<ApiResponse<T>> = {
      data: response,
      timestamp: now,
      ttl: this.cacheStrategy.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(url, entry);
  }

  /**
   * Evict cache entry based on strategy
   * @private
   */
  private evictCacheEntry(): void {
    if (this.cache.size === 0) return;

    const keyToEvict = this.findKeyToEvict();
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Find the key to evict based on cache strategy
   * @private
   */
  private findKeyToEvict(): string | null {
    switch (this.cacheStrategy.type) {
      case 'LRU':
        return this.findLRUKey();
      case 'FIFO':
        return this.findFIFOKey();
      case 'TTL':
        return this.findTTLKey();
      default:
        return this.findFIFOKey(); // Default fallback
    }
  }

  /**
   * Find least recently used key
   * @private
   */
  private findLRUKey(): string | null {
    let oldestAccess = Date.now();
    let keyToEvict: string | null = null;

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        keyToEvict = key;
      }
    });

    return keyToEvict;
  }

  /**
   * Find first-in-first-out key
   * @private
   */
  private findFIFOKey(): string | null {
    let oldestTimestamp = Date.now();
    let keyToEvict: string | null = null;

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        keyToEvict = key;
      }
    });

    return keyToEvict;
  }

  /**
   * Find expired key or fall back to FIFO
   * @private
   */
  private findTTLKey(): string | null {
    const now = Date.now();

    // First, look for expired entries
    const expiredEntry = Array.from(this.cache.entries()).find(([_key, entry]) => {
      return now - entry.timestamp > entry.ttl;
    });

    if (expiredEntry) {
      return expiredEntry[0];
    }

    // If no expired entries, fall back to FIFO
    return this.findFIFOKey();
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    strategy: string;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.cacheStrategy.maxSize,
      strategy: this.cacheStrategy.type,
    };
  }

  /**
   * Enable or disable request batching
   */
  setBatchingEnabled(enabled: boolean): void {
    if (!enabled && this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
      // Process any pending batch immediately
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }
  }

  /**
   * Get current configuration (useful for debugging)
   */
  getConfig(): Readonly<{
    baseUrl: string;
    defaultHeaders: Record<string, string>;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    cacheStrategy: CacheStrategy;
    enableBatching: boolean;
    batchDelay: number;
    maxBatchSize: number;
  }> {
    return {
      baseUrl: this.baseUrl,
      defaultHeaders: { ...this.defaultHeaders },
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      cacheStrategy: { ...this.cacheStrategy },
      enableBatching: this.enableBatching,
      batchDelay: this.batchDelay,
      maxBatchSize: this.maxBatchSize,
    };
  }
}

// Create and export singleton instance with sensible defaults
export const apiClient = new ApiClient();

// Export the class for custom instances when needed
export { ApiClient };

// Helper object for quick API calls without instantiating
export const api = {
  get: <T = unknown>(
    endpoint: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> => apiClient.get<T>(endpoint, signal),

  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> => apiClient.post<T>(endpoint, body, signal),

  put: <T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> => apiClient.put<T>(endpoint, body, signal),

  delete: <T = unknown>(
    endpoint: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> => apiClient.delete<T>(endpoint, signal),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> => apiClient.patch<T>(endpoint, body, signal),
} as const;
