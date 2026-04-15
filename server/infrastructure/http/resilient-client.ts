/**
 * Resilient HTTP Client with Axios, Circuit Breaker, and Validation
 * Replaces unified-api-client.ts
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';
import { z } from 'zod';
import { logger } from '../observability/telemetry';
import Keyv from 'keyv';

interface ResilientClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  circuitBreakerOptions?: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
  };
  cacheOptions?: {
    enabled: boolean;
    ttl?: number;
  };
}

export class ResilientHttpClient {
  private axios: AxiosInstance;
  private breaker: CircuitBreaker;
  private cache?: Keyv;
  private config: ResilientClientConfig;

  constructor(config: ResilientClientConfig) {
    this.config = config;

    // Configure Axios
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Configure retry strategy
    axiosRetry(this.axios, {
      retries: config.retries || 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or specific status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429 || // Rate limit
          error.response?.status === 503 || // Service unavailable
          error.response?.status === 504    // Gateway timeout
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn('Retrying HTTP request', {
          retryCount,
          url: requestConfig.url,
          method: requestConfig.method,
          error: error.message,
          status: error.response?.status,
        });
      },
    });

    // Request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        logger.debug('HTTP request', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('HTTP request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.axios.interceptors.response.use(
      (response) => {
        logger.debug('HTTP response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('HTTP response error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Configure circuit breaker
    const breakerOptions = config.circuitBreakerOptions || {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
    };

    this.breaker = new CircuitBreaker(
      async (requestConfig: AxiosRequestConfig) => {
        return this.axios.request(requestConfig);
      },
      breakerOptions
    );

    // Circuit breaker event handlers
    this.breaker.on('open', () => {
      logger.error('Circuit breaker opened', {
        service: config.baseURL,
        stats: this.breaker.stats,
      });
    });

    this.breaker.on('halfOpen', () => {
      logger.info('Circuit breaker half-open', {
        service: config.baseURL,
      });
    });

    this.breaker.on('close', () => {
      logger.info('Circuit breaker closed', {
        service: config.baseURL,
      });
    });

    this.breaker.on('reject', () => {
      logger.warn('Circuit breaker rejected request', {
        service: config.baseURL,
      });
    });

    // Fallback strategy
    this.breaker.fallback(() => {
      throw new Error('Service unavailable - circuit breaker open');
    });

    // Initialize cache if enabled
    if (config.cacheOptions?.enabled) {
      this.cache = new Keyv({
        ttl: config.cacheOptions.ttl || 3600000, // 1 hour default
      });
    }

    logger.info('Resilient HTTP client initialized', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      retries: config.retries,
      cacheEnabled: config.cacheOptions?.enabled,
    });
  }

  /**
   * Make a request with circuit breaker protection
   */
  async request<T>(
    config: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(config);

    // Check cache for GET requests
    if (config.method === 'GET' && this.cache && cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { url: config.url });
        return cached as T;
      }
    }

    try {
      const response = await this.breaker.fire(config);

      // Validate response with Zod if schema provided
      if (schema) {
        const parsed = schema.safeParse(response.data);
        if (!parsed.success) {
          logger.error('Response validation failed', {
            url: config.url,
            errors: parsed.error.errors,
          });
          throw new Error('Invalid response schema');
        }

        // Cache successful validated responses
        if (config.method === 'GET' && this.cache && cacheKey) {
          await this.cache.set(cacheKey, parsed.data);
        }

        return parsed.data;
      }

      // Cache successful responses without validation
      if (config.method === 'GET' && this.cache && cacheKey) {
        await this.cache.set(cacheKey, response.data);
      }

      return response.data;
    } catch (error: any) {
      logger.error('Request failed', {
        url: config.url,
        method: config.method,
        error: error.message,
        circuitState: this.breaker.status.name,
      });
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url }, schema);
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data }, schema);
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data }, schema);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url }, schema);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data }, schema);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      circuitState: this.breaker.status.name,
      stats: this.breaker.stats,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitState: string;
    stats: any;
  }> {
    const circuitState = this.breaker.status.name;
    const stats = this.breaker.stats;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (circuitState === 'OPEN') {
      status = 'unhealthy';
    } else if (circuitState === 'HALF_OPEN') {
      status = 'degraded';
    }

    return { status, circuitState, stats };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    if (this.cache) {
      await this.cache.clear();
      logger.info('Cache cleared');
    }
  }

  /**
   * Generate cache key from request config
   */
  private getCacheKey(config: AxiosRequestConfig): string | null {
    if (config.method !== 'GET') {
      return null;
    }

    const url = config.url || '';
    const params = JSON.stringify(config.params || {});
    return `${url}:${params}`;
  }
}

export default ResilientHttpClient;
