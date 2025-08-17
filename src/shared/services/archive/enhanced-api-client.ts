/**
 * Enhanced API Client with Circuit Breaker, Rate Limiting, and Intelligent Caching
 * 
 * This implementation provides a robust API client that handles:
 * - Circuit breaking for fault tolerance
 * - Rate limiting to prevent abuse
 * - Intelligent caching with TTL and invalidation
 * - Comprehensive error handling and retry logic
 * - Request/response transformation
 * - Performance monitoring and metrics
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auditLogger, AuditEventType } from './audit-trail-service';
import { securityMonitor } from './security-monitoring-service';

// Extended Axios configuration with metadata support
export interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime?: number;
    requestId?: string;
    retryCount?: number;
  };
}

// Types and Interfaces
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  circuitBreakerOptions: CircuitBreakerOptions;
  rateLimitOptions: RateLimitOptions;
  cacheOptions: CacheOptions;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (url: string) => string;
  skipSuccessfulRequests?: boolean;
}

export interface CacheOptions {
  defaultTTL: number;
  maxSize: number;
  enableCompression: boolean;
  keyPrefix: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

export interface ApiError extends Error {
  status?: number | undefined;
  code?: string | undefined;
  requestId?: string | undefined;
  retryable?: boolean;
}

export interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  requestId: string;
}

// API Response type for better error handling
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: any;
}

// Circuit Breaker Implementation
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private halfOpenCalls = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        throw new Error('Circuit breaker HALF_OPEN - max calls exceeded');
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.halfOpenCalls = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.recoveryTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Rate Limiter Implementation
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private options: RateLimitOptions) {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(url: string, method: string = 'GET'): Promise<void> {
    const key = this.generateKey(url, method);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (requestTimes.length >= this.options.maxRequests) {
      const oldestRequest = Math.min(...requestTimes);
      const waitTime = oldestRequest + this.options.windowMs - now;
      
      const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`) as ApiError;
      error.status = 429;
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryable = true;
      throw error;
    }

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);
  }

  private generateKey(url: string, method: string): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(url);
    }
    return `${method}:${url}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    for (const [key, times] of this.requests.entries()) {
      const validTimes = times.filter(time => time > windowStart);
      if (validTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimes);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Cache Manager Implementation
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private accessTimes = new Map<string, number>();

  constructor(private options: CacheOptions) {}

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(fullKey);
      this.accessTimes.delete(fullKey);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(fullKey, Date.now());
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    const entryTTL = ttl || this.options.defaultTTL;

    // Check cache size and evict if necessary
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL
    };

    this.cache.set(fullKey, entry);
    this.accessTimes.set(fullKey, Date.now());
  }

  async invalidate(key: string): Promise<void> {
    const fullKey = `${this.options.keyPrefix}:${key}`;
    this.cache.delete(fullKey);
    this.accessTimes.delete(fullKey);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Placeholder
  }
}

// Performance Monitor
export class PerformanceMonitor {
  private metrics: RequestMetrics[] = [];
  private readonly maxMetrics = 1000;

  trackRequest(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  getMetrics(endpoint?: string): any {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.url.includes(endpoint))
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const successCount = filteredMetrics.filter(m => m.status < 400).length;

    return {
      count: filteredMetrics.length,
      averageResponseTime: this.average(durations),
      p95ResponseTime: this.percentile(durations, 95),
      p99ResponseTime: this.percentile(durations, 99),
      successRate: successCount / filteredMetrics.length,
      errorRate: (filteredMetrics.length - successCount) / filteredMetrics.length
    };
  }

  private checkPerformanceThresholds(metrics: RequestMetrics): void {
    // Alert on slow responses
    if (metrics.duration > 5000) {
      console.warn(`Slow API response detected: ${metrics.url} took ${metrics.duration}ms`);
    }

    // Alert on errors
    if (metrics.status >= 500) {
      console.error(`Server error detected: ${metrics.url} returned ${metrics.status}`);
    }
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private percentile(numbers: number[], p: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// Main Enhanced API Client
export class EnhancedApiClient {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private cache: CacheManager;
  private performanceMonitor: PerformanceMonitor;

  constructor(private config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerOptions);
    this.rateLimiter = new RateLimiter(config.rateLimitOptions);
    this.cache = new CacheManager(config.cacheOptions);
    this.performanceMonitor = new PerformanceMonitor();

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - properly typed to handle our extended config
    this.client.interceptors.request.use(
      async (config: ExtendedAxiosRequestConfig) => {
        const startTime = Date.now();
        
        // Generate request ID for tracing
        const requestId = this.generateRequestId();
        config.headers = config.headers || {};
        config.headers['X-Request-ID'] = requestId;
        
        // Initialize metadata with proper typing
        config.metadata = { 
          startTime, 
          requestId,
          retryCount: config.metadata?.retryCount || 0
        };

        // Security analysis for outgoing requests
        try {
          const clientIP = await this.getClientIP();
          if (clientIP) {
            const securityAnalysis = await securityMonitor.analyzeRequest({
              ip: clientIP,
              userAgent: config.headers['User-Agent'] as string,
              endpoint: config.url || '',
              method: config.method?.toUpperCase() || 'GET',
              headers: config.headers as Record<string, string>,
              body: config.data,
              sessionId: (await this.getSessionId()) || 'no-session',
              userId: (await this.getUserId()) || 'anonymous'
            });

            // Block request if security analysis indicates high risk
            if (securityAnalysis.blocked) {
              const error = new Error('Request blocked by security policy') as ApiError;
              error.status = 403;
              error.code = 'SECURITY_BLOCKED';
              error.retryable = false;
              throw error;
            }

            // Add security headers if rate limited
            if (securityAnalysis.rateLimited) {
              config.headers['X-Rate-Limited'] = 'true';
            }
          }
        } catch (securityError) {
          // Log security analysis failure but don't block the request
          console.warn('Security analysis failed:', securityError);
        }

        // Rate limiting check - safely handle undefined URL
        const url = config.url || '';
        const method = config.method?.toUpperCase() || 'GET';
        await this.rateLimiter.checkLimit(url, method);
        
        // Add authentication headers
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Audit log the API request
        await auditLogger.dataRead(
          `API:${method}:${url}`,
          1,
          {
            userId: (await this.getUserId()) || 'anonymous',
            sessionId: (await this.getSessionId()) || 'no-session',
            ipAddress: (await this.getClientIP()) || 'unknown',
            userAgent: config.headers['User-Agent'] as string,
            roles: [],
            permissions: [],
            isAuthenticated: !!token
          }
        );

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with proper error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.handleSuccessResponse(response);
        return response;
      },
      async (error: AxiosError) => {
        return this.handleErrorResponse(error);
      }
    );
  }

  private handleSuccessResponse(response: AxiosResponse): void {
    // Safely access metadata with proper type assertion
    const config = response.config as ExtendedAxiosRequestConfig;
    const startTime = config.metadata?.startTime || Date.now();
    const requestId = config.metadata?.requestId || '';
    const duration = Date.now() - startTime;

    // Track performance metrics
    this.performanceMonitor.trackRequest({
      url: response.config.url || '',
      method: response.config.method?.toUpperCase() || 'GET',
      duration,
      status: response.status,
      timestamp: Date.now(),
      requestId
    });

    // Cache successful GET responses
    if (response.config.method?.toUpperCase() === 'GET' && response.status === 200) {
      const cacheKey = this.generateCacheKey(response.config.url || '', response.config.params);
      this.cache.set(cacheKey, response.data);
    }
  }

  private async handleErrorResponse(error: AxiosError): Promise<any> {
    // Safely access metadata from extended config
    const config = error.config as ExtendedAxiosRequestConfig | undefined;
    const startTime = config?.metadata?.startTime || Date.now();
    const requestId = config?.metadata?.requestId || '';
    const duration = Date.now() - startTime;

    // Track error metrics
    this.performanceMonitor.trackRequest({
      url: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'GET',
      duration,
      status: error.response?.status || 0,
      timestamp: Date.now(),
      requestId
    });

    // Transform error for consistent handling
    const apiError = this.transformError(error);
    
    // Retry logic for retryable errors
    if (apiError.retryable && this.shouldRetry(error)) {
      return this.retryRequest(error);
    }

    throw apiError;
  }

  private transformError(error: AxiosError): ApiError {
    // Safely handle error response data with proper typing
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    
    const apiError = new Error(
      responseData?.message || 
      error.message || 
      'An unexpected error occurred'
    ) as ApiError;

    // Use explicit undefined for exact optional property types
    apiError.status = error.response?.status ?? undefined;
    apiError.code = responseData?.code ?? error.code ?? undefined;
    apiError.requestId = error.config?.headers?.['X-Request-ID'] as string ?? undefined;
    apiError.retryable = this.isRetryableError(error);

    return apiError;
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) return true; // Network errors are retryable
    
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as ExtendedAxiosRequestConfig | undefined;
    const retryCount = config?.metadata?.retryCount || 0;
    return retryCount < this.config.retryAttempts;
  }

  private async retryRequest(error: AxiosError): Promise<any> {
    const config = error.config as ExtendedAxiosRequestConfig;
    if (!config) {
      throw error;
    }

    const currentRetryCount = config.metadata?.retryCount || 0;
    const retryCount = currentRetryCount + 1;
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Exponential backoff

    await new Promise(resolve => setTimeout(resolve, delay));

    // Update metadata with new retry count
    config.metadata = { 
      ...config.metadata, 
      retryCount 
    };
    
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (retryError) {
      // If this retry also fails, throw the original error to maintain error context
      throw error;
    }
  }

  // Public API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Check cache first for GET requests
    const cacheKey = this.generateCacheKey(url, config?.params);
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute with circuit breaker
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.post<T>(url, data, config);
      
      // Invalidate related cache entries
      await this.cache.invalidatePattern(`*${url.split('/')[1]}*`);
      
      return response.data;
    });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.put<T>(url, data, config);
      
      // Invalidate related cache entries
      await this.cache.invalidatePattern(`*${url.split('/')[1]}*`);
      
      return response.data;
    });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.delete<T>(url, config);
      
      // Invalidate related cache entries
      await this.cache.invalidatePattern(`*${url.split('/')[1]}*`);
      
      return response.data;
    });
  }

  // Utility methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  private async getAuthToken(): Promise<string | null> {
    // This would integrate with your auth system
    // Using a safe approach that works in both browser and Node.js environments
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('auth_token');
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getClientIP(): Promise<string | null> {
    // In a browser environment, we can't directly get the client IP
    // This would typically be handled by the server or a service
    try {
      if (typeof window !== 'undefined') {
        // In production, you might use a service like ipify or similar
        return null; // Client-side can't reliably get IP
      }
      return '127.0.0.1'; // Server-side default
    } catch {
      return null;
    }
  }

  private async getSessionId(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem('session_id');
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getUserId(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.id || user.userId || null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Monitoring and diagnostics
  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  getPerformanceMetrics(endpoint?: string) {
    return this.performanceMonitor.getMetrics(endpoint);
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  // Cleanup
  destroy(): void {
    this.rateLimiter.destroy();
  }
}

// Default configuration
export const defaultApiClientConfig: ApiClientConfig = {
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retryAttempts: 3,
  circuitBreakerOptions: {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
    halfOpenMaxCalls: 3
  },
  rateLimitOptions: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  cacheOptions: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 1000,
    enableCompression: true,
    keyPrefix: 'api_cache'
  }
};

// Export singleton instance
export const apiClient = new EnhancedApiClient(defaultApiClientConfig);