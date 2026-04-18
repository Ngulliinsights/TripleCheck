/**
 * Unified API Client — Client-side HTTP client
 *
 * Lightweight fetch wrapper for browser use with timeout, retry,
 * interceptors, and live request metrics.
 *
 * For server-side resilience (circuit-breaker, rate-limiting), use
 * ResilientHttpClient from server/infrastructure/http/resilient-client.ts
 */

// ─── Errors ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 30 000) */
  timeout?: number;
  /** Number of retry attempts on 5xx / network errors (default: 0) */
  retries?: number;
  /** Initial retry delay in ms — doubles on each attempt (default: 300) */
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export type RequestInterceptor = (
  config: { url: string; init: RequestInit }
) => { url: string; init: RequestInit } | Promise<{ url: string; init: RequestInit }>;

export type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorInterceptor = (error: unknown) => unknown | Promise<unknown>;

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface ApiMetrics {
  totalRequests: number;
  /** Alias of totalRequests — kept for dashboard compatibility */
  requestCount: number;
  successCount: number;
  errorCount: number;
  /** 0–100 */
  successRate: number;
  averageLatency: number;
  /** Alias of averageLatency — kept for dashboard compatibility */
  averageResponseTime: number;
  p95ResponseTime: number;
  errorsByCode: Record<string, number>;
  rateLimitHits: number;
  cacheHitRate: number;
  circuitBreakerTrips: number;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  lastError?: { message: string; timestamp: Date };
  rateLimitHits: number;
  cacheHitRate: number;
  circuitBreakerTrips: number;
}

// ─── Internal metrics store ───────────────────────────────────────────────────

interface MutableMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  latencies: number[];
  errorsByCode: Record<string, number>;
  byEndpoint: Map<string, {
    requestCount: number;
    successCount: number;
    latencies: number[];
    lastError?: { message: string; timestamp: Date };
    rateLimitHits: number;
    cacheHitCount: number;
    circuitBreakerTrips: number;
  }>;
  rateLimitHits: number;
  cacheHitCount: number;
  circuitBreakerTrips: number;
}

function createMetricsStore(): MutableMetrics {
  return {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    latencies: [],
    errorsByCode: {},
    byEndpoint: new Map(),
    rateLimitHits: 0,
    cacheHitCount: 0,
    circuitBreakerTrips: 0,
  };
}

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]!;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class UnifiedApiClient {
  private readonly baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  private readonly _metrics: MutableMetrics = createMetricsStore();

  constructor(baseURL = '/api', options: Omit<ApiRequestOptions, 'headers'> = {}) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.defaultHeaders = { 'Content-Type': 'application/json' };
    this.defaultTimeout = options.timeout ?? 30_000;
    this.defaultRetries = options.retries ?? 0;
    this.defaultRetryDelay = options.retryDelay ?? 300;
  }

  // ── Interceptors ────────────────────────────────────────────────────────────

  addRequestInterceptor(fn: RequestInterceptor): void {
    this.requestInterceptors.push(fn);
  }

  addResponseInterceptor(fn: ResponseInterceptor): void {
    this.responseInterceptors.push(fn);
  }

  addErrorInterceptor(fn: ErrorInterceptor): void {
    this.errorInterceptors.push(fn);
  }

  // ── Core request ────────────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const timeout = options.timeout ?? this.defaultTimeout;
    const maxRetries = options.retries ?? this.defaultRetries;
    const retryDelay = options.retryDelay ?? this.defaultRetryDelay;

    let url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    let init: RequestInit = {
      method,
      headers: { ...this.defaultHeaders, ...options.headers },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials: 'include',
    };

    // Run request interceptors
    for (const intercept of this.requestInterceptors) {
      ({ url, init } = await intercept({ url, init }));
    }

    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const startedAt = Date.now();

      try {
        const raw = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);

        const latency = Date.now() - startedAt;
        const responseData = await raw.json().catch(() => ({} as T));

        if (!raw.ok) {
          const error = new ApiError(
            (responseData as any)?.error ?? `HTTP ${raw.status}: ${raw.statusText}`,
            raw.status,
            raw.statusText,
            responseData
          );
          this.recordError(method, endpoint, latency, String(raw.status));
          throw error;
        }

        let response: ApiResponse<T> = {
          data: responseData as T,
          status: raw.status,
          statusText: raw.statusText,
          headers: Object.fromEntries(raw.headers.entries()),
        };

        for (const intercept of this.responseInterceptors) {
          response = await intercept(response);
        }

        this.recordSuccess(method, endpoint, latency);
        return response;

      } catch (err: unknown) {
        clearTimeout(timer);

        const isTimeout = err instanceof Error && err.name === 'AbortError';
        const wrappedErr = isTimeout ? new TimeoutError(timeout) : err;

        const isRetryable =
          attempt < maxRetries &&
          !(wrappedErr instanceof ApiError && wrappedErr.status < 500);

        if (isRetryable) {
          await sleep(retryDelay * 2 ** attempt);
          attempt++;
          continue;
        }

        let finalErr: unknown = wrappedErr;
        for (const intercept of this.errorInterceptors) {
          finalErr = await intercept(finalErr);
        }
        throw finalErr;
      }
    }
  }

  // ── HTTP verbs ──────────────────────────────────────────────────────────────

  get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  put<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  patch<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ── Auth helpers ────────────────────────────────────────────────────────────

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  resetMetrics(): void {
    Object.assign(this._metrics, createMetricsStore());
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────

  get metrics(): ApiMonitor {
    return new ApiMonitor(this._metrics);
  }

  private recordSuccess(method: string, endpoint: string, latency: number): void {
    const m = this._metrics;
    m.totalRequests++;
    m.successCount++;
    m.latencies.push(latency);

    const key = `${method}:${endpoint}`;
    const ep = m.byEndpoint.get(key) || { 
      requestCount: 0, 
      successCount: 0, 
      latencies: [] as number[], 
      rateLimitHits: 0,
      cacheHitCount: 0,
      circuitBreakerTrips: 0
    };
    ep.requestCount++;
    ep.successCount++;
    ep.latencies.push(latency);
    m.byEndpoint.set(key, ep);
  }

  private recordError(method: string, endpoint: string, latency: number, code: string): void {
    const m = this._metrics;
    m.totalRequests++;
    m.errorCount++;
    m.latencies.push(latency);
    m.errorsByCode[code] = (m.errorsByCode[code] ?? 0) + 1;

    const key = `${method}:${endpoint}`;
    const ep = m.byEndpoint.get(key) || { 
      requestCount: 0, 
      successCount: 0, 
      latencies: [] as number[], 
      rateLimitHits: 0,
      cacheHitCount: 0,
      circuitBreakerTrips: 0
    };
    ep.requestCount++;
    ep.lastError = { message: `HTTP ${code}`, timestamp: new Date() };
    ep.latencies.push(latency);

    if (code === '429') {
      m.rateLimitHits++;
      ep.rateLimitHits++;
    }

    if (code === '503') {
      m.circuitBreakerTrips++;
      ep.circuitBreakerTrips++;
    }

    m.byEndpoint.set(key, ep);
  }

  recordCacheHit(method: string, endpoint: string): void {
    const m = this._metrics;
    m.cacheHitCount++;
    
    const key = `${method}:${endpoint}`;
    const ep = m.byEndpoint.get(key) || { 
      requestCount: 0, 
      successCount: 0, 
      latencies: [] as number[], 
      rateLimitHits: 0,
      cacheHitCount: 0,
      circuitBreakerTrips: 0
    };
    ep.cacheHitCount++;
    m.byEndpoint.set(key, ep);
  }
}

// ─── Monitor ─────────────────────────────────────────────────────────────────

export class ApiMonitor {
  constructor(private readonly store: MutableMetrics) {}

  getCurrentMetrics(): ApiMetrics {
    const { totalRequests, successCount, errorCount, latencies, errorsByCode } = this.store;
    const avg = latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return {
      totalRequests,
      requestCount: totalRequests,
      successCount,
      errorCount,
      successRate: totalRequests ? (successCount / totalRequests) * 100 : 100,
      averageLatency: avg,
      averageResponseTime: avg,
      p95ResponseTime: p95(latencies),
      errorsByCode: { ...errorsByCode },
      rateLimitHits: this.store.rateLimitHits,
      cacheHitRate: totalRequests ? (this.store.cacheHitCount / totalRequests) * 100 : 0,
      circuitBreakerTrips: this.store.circuitBreakerTrips,
    };
  }

  getEndpointMetrics(): EndpointMetrics[] {
    return Array.from(this.store.byEndpoint.entries()).map(([key, ep]) => {
      const [method = 'GET', ...rest] = key.split(':');
      const endpoint = rest.join(':');
      const avg = ep.latencies.length
        ? ep.latencies.reduce((a, b) => a + b, 0) / ep.latencies.length
        : 0;

      return {
        endpoint,
        method,
        requestCount: ep.requestCount,
        successRate: ep.requestCount ? (ep.successCount / ep.requestCount) * 100 : 100,
        averageResponseTime: avg,
        lastError: ep.lastError,
        rateLimitHits: ep.rateLimitHits,
        cacheHitRate: ep.requestCount ? (ep.cacheHitCount / ep.requestCount) * 100 : 0,
        circuitBreakerTrips: ep.circuitBreakerTrips,
      };
    });
  }

  compareToBaseline(baseline: ApiMetrics): { alerts: string[] } {
    const current = this.getCurrentMetrics();
    const alerts: string[] = [];
    
    if (current.successRate < baseline.successRate - 5) {
      alerts.push(`Success rate dropped by over 5% (was ${baseline.successRate.toFixed(1)}%)`);
    }
    
    if (current.averageResponseTime > baseline.averageResponseTime * 1.5) {
      alerts.push('Average response time increased by >50%');
    }

    return { alerts };
  }

  resetMetrics(): void {
    // This resets the internal store of the singleton
    apiClient.resetMetrics();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const apiClient = new UnifiedApiClient();
export const apiMonitor = apiClient.metrics;

export const monitoringUtils = {
  getHealthCheck: (metrics: ApiMetrics) => {
    if (metrics.successRate < 80) return { status: 'critical' as const, message: 'High error rate' };
    if (metrics.successRate < 95) return { status: 'degraded' as const, message: 'Intermittent issues' };
    return { status: 'healthy' as const, message: 'Systems operational' };
  },
  compareMetrics: (current: ApiMetrics, previous?: ApiMetrics) => {
    if (!previous) return { alerts: [] };
    const alerts: string[] = [];
    if (current.errorCount > previous.errorCount * 1.5) alerts.push('Error spike detected');
    return { alerts };
  },
  logPerformanceSummary: (metrics: ApiMetrics) => {
    console.info('[API Monitor] Summary:', {
      requests: metrics.totalRequests,
      avgLatency: metrics.averageLatency.toFixed(2) + 'ms',
      successRate: metrics.successRate.toFixed(2) + '%'
    });
  }
};

// ─── HuggingFace legacy types (backward compatibility) ───────────────────────

/** @deprecated Import from your HuggingFace integration layer instead. */
export interface HuggingFaceResponse {
  generated_text?: string;
  translation_text?: string;
  label?: string;
  score?: number;
  [key: string]: unknown;
}

/** @deprecated */
export interface TextGenerationResult {
  generated_text: string;
}

/** @deprecated */
export interface TextClassificationResult {
  label: string;
  score: number;
}

/** @deprecated */
export interface TranslationResult {
  translation_text: string;
}