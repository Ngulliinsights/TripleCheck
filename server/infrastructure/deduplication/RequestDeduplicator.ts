import { createHash } from 'crypto';

import { EnhancedCacheService, CacheFactory } from '../cache/CacheIntegrationAdapter';
import { CacheService } from '../cache/CacheService';
import { cachePerformanceMonitor } from '../monitoring/CachePerformanceMonitor';

/**
 * Interface for idempotent request handling
 * Represents the stored state of a request for deduplication purposes
 */
export interface IdempotentRequest {
  idempotencyKey: string;
  requestHash: string;
  expiresAt: Date;
  response?: unknown; // More precise than 'any'
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * Configuration for request deduplication
 * Controls caching behavior and performance characteristics
 */
export interface DeduplicationConfig {
  defaultTtl: number; // Default TTL in milliseconds
  maxPendingTime: number; // Max time to wait for pending requests
  enableRedisBackup: boolean; // Whether to use Redis as backup storage
  keyPrefix: string; // Prefix for cache keys
}

/**
 * Represents a completed request stored in memory cache
 */
interface CompletedRequest {
  response: unknown;
  timestamp: Date;
  etag: string;
}

/**
 * Logger interface for dependency injection and testing
 */
interface Logger {
  warn: (message: string, error?: Error) => void;
  error: (message: string, error?: Error) => void;
}

/**
 * Cache lookup result for type safety
 */
interface CacheLookupResult<T> {
  found: boolean;
  data?: T;
}

/**
 * Request deduplication service to prevent race conditions and duplicate processing
 * Supports both in-memory and Redis backing for scalability
 * 
 * This service helps prevent duplicate processing of identical requests by:
 * 1. Detecting when the same request is already in progress
 * 2. Caching completed results for a configurable time period
 * 3. Using both memory and Redis for multi-tier caching
 */
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private readonly pendingRequests = new Map<string, Promise<unknown>>();
  private readonly completedRequests = new Map<string, CompletedRequest>();
  
  // Use enhanced cache service for better performance
  private readonly cache: EnhancedCacheService;
  private readonly config: DeduplicationConfig;
  private readonly logger: Logger;

  constructor(
    config: Partial<DeduplicationConfig> = {},
    cache?: CacheService | undefined, // Explicit undefined in union type
    logger?: Logger | undefined
  ) {
    this.config = {
      defaultTtl: 300000, // 5 minutes
      maxPendingTime: 30000, // 30 seconds
      enableRedisBackup: true,
      keyPrefix: 'dedup:',
      ...config
    };
    
    // Use enhanced cache service or create a new one optimized for deduplication
    this.cache = cache instanceof EnhancedCacheService 
      ? cache 
      : CacheFactory.createDomainCache('deduplication', {
          l1MaxItems: 5000,
          l1DefaultTtl: this.config.defaultTtl,
          l2DefaultTtl: Math.floor(this.config.defaultTtl / 1000),
          l2KeyPrefix: this.config.keyPrefix,
          enableStampedeProtection: true
        });
    
    // Use provided logger or create a default implementation
    this.logger = logger || this.createDefaultLogger();
    
    // Clean up expired requests periodically
    setInterval(() => this.cleanupExpiredRequests(), 60000); // Every minute
  }

  /**
   * Get singleton instance
   * Ensures only one deduplicator exists across the application
   */
  static getInstance(
    config?: Partial<DeduplicationConfig>,
    cache?: CacheService,
    logger?: Logger
  ): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator(config, cache, logger);
    }
    return RequestDeduplicator.instance;
  }

  /**
   * Handle idempotent request with deduplication
   * This method has been refactored to reduce cognitive complexity by breaking
   * the logic into smaller, focused helper methods
   */
  async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = this.config.defaultTtl
  ): Promise<T> {
    const cacheKey = this.getCacheKey(key);
    
    // Step 1: Check for pending requests
    const pendingResult = await this.checkPendingRequest<T>(cacheKey);
    if (pendingResult.found) {
      return pendingResult.data as T;
    }

    // Step 2: Check memory cache
    const memoryResult = this.checkMemoryCache<T>(cacheKey, ttl);
    if (memoryResult.found) {
      return memoryResult.data as T;
    }

    // Step 3: Check Redis cache
    const redisResult = await this.checkRedisCache<T>(cacheKey);
    if (redisResult.found) {
      return redisResult.data as T;
    }

    // Step 4: Execute and cache the operation
    return await this.executeAndCacheOperation(cacheKey, operation, ttl);
  }

  /**
   * Generate idempotency key from request data
   * Creates a consistent key for the same logical request
   * 
   * Uses SHA-256 for cryptographic strength in key generation
   * Includes timestamp rounded to seconds for short-term deduplication
   */
  generateIdempotencyKey(userId: number, endpoint: string, requestData?: unknown): string {
    const payload = {
      userId,
      endpoint,
      data: requestData || {},
      timestamp: Math.floor(Date.now() / 1000) // Round to second for short-term deduplication
    };
    
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate request hash for content-based deduplication
   * Creates a hash that uniquely identifies the request content
   */
  generateRequestHash(
    method: string, 
    url: string, 
    body?: unknown, 
    headers?: Record<string, string>
  ): string {
    const payload = {
      method: method.toUpperCase(),
      url,
      body: body || {},
      headers: this.filterHeaders(headers || {})
    };
    
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Check if request should be deduplicated
   * Implements smart logic to determine when deduplication is safe and beneficial
   */
  shouldDeduplicate(method: string, endpoint: string): boolean {
    const upperMethod = method.toUpperCase();
    
    // Always deduplicate safe operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(upperMethod)) {
      return true;
    }
    
    // Deduplicate idempotent operations for specific endpoints
    if (['PUT', 'DELETE'].includes(upperMethod)) {
      return this.isIdempotentEndpoint(endpoint);
    }
    
    // For POST operations, only deduplicate specific endpoints
    if (upperMethod === 'POST') {
      return this.isDeduplicatablePostEndpoint(endpoint);
    }
    
    return false;
  }

  /**
   * Clear cache for specific key or pattern
   * Provides cache invalidation capabilities for both memory and Redis
   */
  async clearCache(keyOrPattern: string): Promise<void> {
    const cacheKey = this.getCacheKey(keyOrPattern);
    
    // Clear from memory using safe pattern matching
    this.clearMemoryCache(keyOrPattern, cacheKey);
    
    // Clear from Redis if enabled
    await this.clearRedisCache(keyOrPattern, cacheKey);
  }

  /**
   * Get cache statistics
   * Provides insights into cache performance and memory usage
   */
  getStats(): {
    pendingRequests: number;
    completedRequests: number;
    memoryUsage: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      completedRequests: this.completedRequests.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Private helper methods - These break down complex operations into manageable pieces

  /**
   * Create default logger implementation
   * Provides console-based logging with proper ESLint handling
   */
  private createDefaultLogger(): Logger {
    return {
      warn: (message: string, error?: Error) => {
        // eslint-disable-next-line no-console
        console.warn(message, error?.message || '');
      },
      error: (message: string, error?: Error) => {
        // eslint-disable-next-line no-console
        console.error(message, error?.message || '');
      }
    };
  }

  /**
   * Check if there's a pending request for the given cache key
   * This method isolates the pending request logic to reduce complexity
   */
  private async checkPendingRequest<T>(cacheKey: string): Promise<CacheLookupResult<T>> {
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (!pendingRequest) {
      return { found: false };
    }

    try {
      // Wait for pending request with timeout
      const result = await Promise.race([
        pendingRequest,
        this.createTimeoutPromise(this.config.maxPendingTime)
      ]);
      return { found: true, data: result as T };
    } catch (error) {
      // Remove failed pending request and continue
      this.pendingRequests.delete(cacheKey);
      
      // Re-throw timeout errors, but allow retry for other errors
      if (error instanceof Error && error.message === 'Request timeout') {
        throw error;
      }
      return { found: false };
    }
  }

  /**
   * Check memory cache for cached result
   * Isolates memory cache logic for better maintainability
   */
  private checkMemoryCache<T>(cacheKey: string, ttl: number): CacheLookupResult<T> {
    const completed = this.completedRequests.get(cacheKey);
    
    if (completed && Date.now() - completed.timestamp.getTime() < ttl) {
      cachePerformanceMonitor.recordCacheHit(cacheKey, 0);
      return { found: true, data: completed.response as T };
    }
    
    return { found: false };
  }

  /**
   * Check unified cache for cached result
   * Uses the enhanced cache service with L1/L2 architecture
   */
  private async checkRedisCache<T>(cacheKey: string): Promise<CacheLookupResult<T>> {
    if (!this.config.enableRedisBackup) {
      return { found: false };
    }

    try {
      const startTime = Date.now();
      const cachedResult = await this.cache.get(cacheKey);
      const latency = Date.now() - startTime;
      
      if (!cachedResult) {
        return { found: false };
      }

      // Store in memory for faster future access
      this.completedRequests.set(cacheKey, {
        response: cachedResult,
        timestamp: new Date(),
        etag: this.generateETag(cachedResult)
      });
      
      cachePerformanceMonitor.recordCacheHit(cacheKey, latency);
      return { found: true, data: cachedResult as T };
    } catch (error) {
      this.logger.warn('Unified cache lookup failed', error as Error);
      cachePerformanceMonitor.recordCacheError(cacheKey, error as Error);
      return { found: false };
    }
  }

  /**
   * Execute the operation and cache the result
   * Handles the actual operation execution and caching logic
   */
  private async executeAndCacheOperation<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const startTime = Date.now();
    const promise = this.executeWithErrorHandling(operation);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      const responseTime = Date.now() - startTime;
      cachePerformanceMonitor.recordCacheMiss(cacheKey, responseTime);
      
      // Store result in memory
      const etag = this.generateETag(result);
      this.completedRequests.set(cacheKey, {
        response: result,
        timestamp: new Date(),
        etag
      });

      // Store in Redis if enabled
      await this.storeInRedis(cacheKey, result, ttl);

      return result as T;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Store result in unified cache
   * Uses enhanced cache service with automatic L1/L2 distribution
   */
  private async storeInRedis(cacheKey: string, result: unknown, ttl: number): Promise<void> {
    if (!this.config.enableRedisBackup) {
      return;
    }

    try {
      await this.cache.setWithTags(cacheKey, result, ['deduplication'], { 
        ttl: Math.floor(ttl / 1000) 
      });
    } catch (error) {
      this.logger.warn('Unified cache storage failed', error as Error);
    }
  }

  /**
   * Clear memory cache with safe pattern matching
   * Uses pre-compiled patterns to avoid security issues
   */
  private clearMemoryCache(keyOrPattern: string, cacheKey: string): void {
    if (!keyOrPattern.includes('*')) {
      this.completedRequests.delete(cacheKey);
      return;
    }

    // Create safe pattern matching using known safe patterns only
    const safePatterns = this.createSafePatterns();
    const matchingPattern = safePatterns.find(pattern => 
      keyOrPattern.replace(/\*/g, '.*') === pattern.source
    );

    if (matchingPattern) {
      for (const key of this.completedRequests.keys()) {
        if (matchingPattern.test(key)) {
          this.completedRequests.delete(key);
        }
      }
    }
  }

  /**
   * Create safe regex patterns for cache clearing
   * Pre-defines allowed patterns to avoid regex injection
   */
  private createSafePatterns(): RegExp[] {
    // Pre-defined safe patterns that are known to be secure
    return [
      /^dedup:user:\d+:.*/, // User-specific patterns
      /^dedup:endpoint:.*/, // Endpoint-specific patterns
      /^dedup:session:.*/, // Session-specific patterns
    ];
  }

  /**
   * Clear unified cache safely
   * Uses tag-based invalidation for better performance
   */
  private async clearRedisCache(keyOrPattern: string, cacheKey: string): Promise<void> {
    if (!this.config.enableRedisBackup) {
      return;
    }

    try {
      if (keyOrPattern.includes('*')) {
        // Use tag-based invalidation for pattern matching
        const tag = keyOrPattern.replace(/\*/g, '').replace(this.config.keyPrefix, '');
        await this.cache.invalidateByTags([tag, 'deduplication']);
      } else {
        await this.cache.delete(cacheKey);
      }
    } catch (error) {
      this.logger.warn('Unified cache clear failed', error as Error);
    }
  }

  private getCacheKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Generate ETag for response caching
   * Uses SHA-256 for better security than MD5
   */
  private generateETag(data: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Execute operation with proper error handling
   * Wraps the user-provided operation to ensure consistent error behavior
   */
  private async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error('Request deduplication operation failed', error as Error);
      throw error;
    }
  }

  /**
   * Create a timeout promise for racing against pending requests
   * Uses proper parameter naming for ESLint compliance
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  /**
   * Filter headers to only include those that affect response content
   * This prevents cache misses due to irrelevant header differences
   */
  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const relevantHeaders = ['content-type', 'accept', 'authorization'];
    const filtered: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (relevantHeaders.includes(key.toLowerCase())) {
        filtered[key.toLowerCase()] = value;
      }
    }
    
    return filtered;
  }

  /**
   * Check if endpoint is safe for idempotent operations
   * Defines which endpoints can safely have PUT/DELETE operations deduplicated
   */
  private isIdempotentEndpoint(endpoint: string): boolean {
    const idempotentPatterns = [
      /^\/api\/users\/\d+$/,
      /^\/api\/properties\/\d+$/,
      /^\/api\/professionals\/\d+$/,
      /^\/api\/trust\/score\/\d+$/
    ];
    
    return idempotentPatterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * Check if POST endpoint should be deduplicated
   * POST operations are typically not idempotent, but some can be safely cached
   */
  private isDeduplicatablePostEndpoint(endpoint: string): boolean {
    const deduplicatablePatterns = [
      /^\/api\/analytics\/events$/,
      /^\/api\/professionals\/search$/,
      /^\/api\/properties\/search$/,
      /^\/api\/fraud-intelligence\/report$/
    ];
    
    return deduplicatablePatterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * Clean up expired requests from memory cache
   * Prevents memory leaks by removing old cached responses
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    
    for (const [key, value] of this.completedRequests.entries()) {
      if (now - value.timestamp.getTime() > this.config.defaultTtl) {
        this.completedRequests.delete(key);
      }
    }
  }

  /**
   * Estimate memory usage of the cache
   * Provides rough calculation for monitoring purposes
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, value] of this.completedRequests.entries()) {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(value.response).length * 2;
      size += 100; // Overhead for timestamp, etag, etc.
    }
    
    return size;
  }
}

/**
 * Default instance for easy access
 * Provides a singleton instance that can be imported and used directly
 */
export const requestDeduplicator = RequestDeduplicator.getInstance();