/**
 * RateLimitedApiWrapper - Phase 1 Implementation
 * 
 * Wraps external API calls (county records, MLS, court records) with intelligent
 * rate limiting to prevent throttling and cascading failures.
 * 
 * Features:
 * - Per-API rate limiting with configurable thresholds
 * - Exponential backoff with jitter
 * - Circuit breaker pattern for failing APIs
 * - Request queuing to smooth traffic
 * - Adaptive rate limits based on API responses
 */

import { ApiRateLimiter, RateLimitConfig } from '../rate-limiting/ApiRateLimiter';
import { CircuitBreakerManager, CircuitBreaker } from '../rate-limiting/CircuitBreaker';
import { cacheService } from '../cache/CacheService';
import { logger } from '../observability/telemetry';

export interface ExternalApiConfig {
  name: string;
  baseUrl: string;
  defaultRateLimit: number; // requests per minute
  defaultRetryAttempts: number;
  defaultTimeout: number; // milliseconds
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeout: number;
}

export interface ApiCallOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ApiCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  retryCount: number;
  rateLimitInfo: {
    remaining: number;
    resetTime: Date;
    exceeded: boolean;
  };
}

/**
 * Rate-limited wrapper for external API calls
 * Manages county records, MLS, court records, and other external services
 */
export class RateLimitedApiWrapper {
  private config: ExternalApiConfig;
  private rateLimiter: ApiRateLimiter;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private adaptiveRateLimits: Map<string, number> = new Map();

  constructor(config: ExternalApiConfig) {
    this.config = config;
    this.rateLimiter = ApiRateLimiter.getInstance();
    this.circuitBreaker = CircuitBreakerManager.getInstance().getOrCreateBreaker(
      config.name,
      {
        failureThreshold: config.circuitBreakerThreshold,
        recoveryTimeout: config.circuitBreakerResetTimeout,
        requestTimeout: config.defaultTimeout
      }
    );
  }

  /**
   * Make a rate-limited API call
   */
  async call<T = any>(options: ApiCallOptions): Promise<ApiCallResult<T>> {
    const cacheKey = this.generateCacheKey(options);
    let retryCount = 0;
    const maxRetries = options.retries ?? this.config.defaultRetryAttempts;

    while (retryCount <= maxRetries) {
      try {
        // Check rate limit
        const rateLimitResult = await this.rateLimiter.checkEndpointRateLimit(
          `${this.config.name}:${options.endpoint}`,
          this.getRateLimitConfig()
        );

        if (!rateLimitResult.allowed) {
          logger.warn(
            `[${this.config.name}] Rate limit exceeded for ${options.endpoint}`,
            'EXTERNAL_API',
            {
              endpoint: options.endpoint,
              resetTime: rateLimitResult.resetTime,
              remaining: rateLimitResult.remaining
            }
          );

          // Queue the request for later
          return new Promise((resolve) => {
            this.queueRequest(async () => {
              const result = await this.call<T>(options);
              resolve(result);
            });
          });
        }

        // Check circuit breaker
        if (this.circuitBreaker.isOpen()) {
          logger.warn(
            `[${this.config.name}] Circuit breaker is open for ${options.endpoint}`,
            'EXTERNAL_API',
            { endpoint: options.endpoint }
          );

          return {
            success: false,
            error: 'Circuit breaker is open - service temporarily unavailable',
            statusCode: 503,
            retryCount,
            rateLimitInfo: {
              remaining: rateLimitResult?.remaining ?? 0,
              resetTime: rateLimitResult?.resetTime ?? new Date(),
              exceeded: true
            }
          };
        }

        // Make the actual API call
        const result = await this.makeApiCall<T>(options);

        // Update adaptive rate limits based on response
        if (result.success && result.data) {
          this.updateAdaptiveRateLimit(options.endpoint, true);
          this.circuitBreaker.recordSuccess();
        } else if (!result.success) {
          this.updateAdaptiveRateLimit(options.endpoint, false);
          this.circuitBreaker.recordFailure(new Error(result.error));
        }

        return {
          ...result,
          retryCount,
          rateLimitInfo: {
            remaining: rateLimitResult?.remaining ?? 0,
            resetTime: rateLimitResult?.resetTime ?? new Date(),
            exceeded: false
          }
        };

      } catch (error) {
        retryCount++;

        if (retryCount <= maxRetries) {
          const backoffMs = this.getExponentialBackoff(retryCount);
          logger.info(
            `[${this.config.name}] Retrying ${options.endpoint} after ${backoffMs}ms (attempt ${retryCount}/${maxRetries})`,
            'EXTERNAL_API'
          );

          await this.sleep(backoffMs);
        } else {
          logger.error(
            `[${this.config.name}] Failed to call ${options.endpoint} after ${maxRetries} retries`,
            'EXTERNAL_API',
            { error: error instanceof Error ? error.message : String(error) }
          );

          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount,
            rateLimitInfo: {
              remaining: 0,
              resetTime: new Date(),
              exceeded: true
            }
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retryCount,
      rateLimitInfo: {
        remaining: 0,
        resetTime: new Date(),
        exceeded: true
      }
    };
  }

  /**
   * Batch calls with rate limit awareness
   */
  async batchCall<T = any>(
    options: ApiCallOptions[],
    maxConcurrent: number = 3
  ): Promise<ApiCallResult<T>[]> {
    const results: ApiCallResult<T>[] = [];
    const chunks = this.chunkArray(options, maxConcurrent);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(opt => this.call<T>(opt))
      );
      results.push(...chunkResults);

      // Add delay between batches to respect rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.sleep(1000);
      }
    }

    return results;
  }

  /**
   * Make the actual HTTP call
   */
  private async makeApiCall<T = any>(options: ApiCallOptions): Promise<ApiCallResult<T>> {
    const url = `${this.config.baseUrl}${options.endpoint}`;
    const timeout = options.timeout ?? this.config.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.data ? JSON.stringify(options.data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          retryCount: 0,
          rateLimitInfo: {
            remaining: 0,
            resetTime: new Date(),
            exceeded: response.status === 429
          }
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
        statusCode: response.status,
        retryCount: 0,
        rateLimitInfo: {
          remaining: parseInt(response.headers.get('x-rate-limit-remaining') ?? '0'),
          resetTime: new Date(parseInt(response.headers.get('x-rate-limit-reset') ?? String(Date.now() + 60000))),
          exceeded: false
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout after ${timeout}ms`,
          retryCount: 0,
          rateLimitInfo: {
            remaining: 0,
            resetTime: new Date(),
            exceeded: true
          }
        };
      }

      throw error;
    }
  }

  /**
   * Queue a request for later processing
   */
  private queueRequest(fn: () => Promise<any>): void {
    this.requestQueue.push(fn);
    this.processQueue();
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const fn = this.requestQueue.shift();
        if (fn) {
          await fn();
          // Add delay between queued requests
          await this.sleep(1000);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Update adaptive rate limits based on API responses
   */
  private updateAdaptiveRateLimit(endpoint: string, success: boolean): void {
    const key = `${this.config.name}:${endpoint}`;
    const current = this.adaptiveRateLimits.get(key) ?? this.config.defaultRateLimit;

    if (success) {
      // Gradually increase limit if successful
      this.adaptiveRateLimits.set(key, Math.min(current * 1.05, this.config.defaultRateLimit * 1.5));
    } else {
      // Decrease limit if failed
      this.adaptiveRateLimits.set(key, Math.max(current * 0.7, this.config.defaultRateLimit * 0.5));
    }
  }

  /**
   * Get current rate limit config
   */
  private getRateLimitConfig(): RateLimitConfig {
    return {
      maxRequests: this.config.defaultRateLimit,
      timeWindowSeconds: 60,
      enableCircuitBreaker: true
    };
  }

  /**
   * Exponential backoff with jitter
   */
  private getExponentialBackoff(attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // ±10% jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(options: ApiCallOptions): string {
    return `api:${this.config.name}:${options.method}:${options.endpoint}:${JSON.stringify(options.data ?? {})}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Pre-configured wrappers for common external APIs
 */
export class ExternalApiWrappers {
  private static instances: Map<string, RateLimitedApiWrapper> = new Map();

  static getCountyRecordsWrapper(): RateLimitedApiWrapper {
    return this.getOrCreate('countyRecords', {
      name: 'CountyRecords',
      baseUrl: process.env.COUNTY_RECORDS_API_URL || 'https://api.counties.ke',
      defaultRateLimit: 60, // 60 requests per minute (conservative for government APIs)
      defaultRetryAttempts: 3,
      defaultTimeout: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTimeout: 60000
    });
  }

  static getMLSWrapper(): RateLimitedApiWrapper {
    return this.getOrCreate('mls', {
      name: 'MLS',
      baseUrl: process.env.MLS_API_URL || 'https://api.mls.ke',
      defaultRateLimit: 120, // 120 requests per minute
      defaultRetryAttempts: 2,
      defaultTimeout: 20000,
      circuitBreakerThreshold: 3,
      circuitBreakerResetTimeout: 30000
    });
  }

  static getCourtRecordsWrapper(): RateLimitedApiWrapper {
    return this.getOrCreate('courtRecords', {
      name: 'CourtRecords',
      baseUrl: process.env.COURT_RECORDS_API_URL || 'https://api.courts.ke',
      defaultRateLimit: 30, // 30 requests per minute (court systems are slower)
      defaultRetryAttempts: 4,
      defaultTimeout: 45000,
      circuitBreakerThreshold: 3,
      circuitBreakerResetTimeout: 120000
    });
  }

  private static getOrCreate(name: string, config: ExternalApiConfig): RateLimitedApiWrapper {
    if (!this.instances.has(name)) {
      this.instances.set(name, new RateLimitedApiWrapper(config));
    }
    return this.instances.get(name)!;
  }
}

export default RateLimitedApiWrapper;
