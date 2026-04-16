import { createHash, randomBytes } from 'crypto';
import { performance } from 'perf_hooks';

import { EnhancedCacheService, CacheFactory } from '../cache/CacheIntegrationAdapter';
import { CacheService } from '../../cache/CacheService'
import { cachePerformanceMonitor } from '../monitoring/CachePerformanceMonitor';

/**
 * Interface for idempotent request handling
 * Represents the stored state of a request for deduplication purposes
 */
export interface IdempotentRequest {
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly expiresAt: Date;
  readonly response?: unknown;
  readonly status: 'pending' | 'completed' | 'failed';
  readonly createdAt: Date;
}

/**
 * Configuration for request deduplication
 * Controls caching behavior and performance characteristics
 */
export interface DeduplicationConfig {
  readonly defaultTtl: number; // Default TTL in milliseconds
  readonly maxPendingTime: number; // Max time to wait for pending requests
  readonly enableRedisBackup: boolean; // Whether to use Redis as backup storage
  readonly keyPrefix: string; // Prefix for cache keys
  readonly cleanupInterval: number; // Cleanup interval in milliseconds
  readonly maxMemoryItems: number; // Maximum items in memory cache
}

/**
 * Represents a completed request stored in memory cache
 */
interface CompletedRequest {
  readonly response: unknown;
  readonly timestamp: Date;
  readonly etag: string;
  readonly size: number; // Track memory usage per item
}

/**
 * Logger interface for dependency injection and testing
 */
interface Logger {
  warn: (message: string, error?: Error) => void;
  error: (message: string, error?: Error) => void;
  debug?: (message: string, data?: unknown) => void;
}

/**
 * Cache lookup result for type safety and better error handling
 */
interface CacheLookupResult<T> {
  readonly found: boolean;
  readonly data?: T;
  readonly source?: 'memory' | 'redis' | 'pending';
  readonly latency?: number;
}

/**
 * Enhanced cache statistics with more detailed metrics
 */
interface CacheStatistics {
  readonly pendingRequests: number;
  readonly completedRequests: number;
  readonly memoryUsage: number;
  readonly hitRate: number;
  readonly averageLatency: number;
  readonly uptime: number;
}

/**
 * Request deduplication service to prevent race conditions and duplicate processing
 * Supports both in-memory and Redis backing for scalability
 * 
 * This service helps prevent duplicate processing of identical requests by:
 * 1. Detecting when the same request is already in progress
 * 2. Caching completed results for a configurable time period
 * 3. Using both memory and Redis for multi-tier caching
 * 4. Implementing intelligent memory management with size-based eviction
 * 5. Providing comprehensive performance monitoring
 */
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;

  // Core data structures - using WeakRef for better memory management
  private readonly pendingRequests = new Map<string, Promise<unknown>>();
  private readonly completedRequests = new Map<string, CompletedRequest>();

  // Performance tracking
  private readonly startTime = Date.now();
  private totalRequests = 0;
  private cacheHits = 0;
  private totalLatency = 0;

  // Configuration and dependencies
  private readonly cache: EnhancedCacheService;
  private readonly config: DeduplicationConfig;
  private readonly logger: Logger;

  // Cleanup management
  private readonly cleanupTimer: NodeJS.Timeout;

  // Pre-compiled patterns for better performance
  private readonly idempotentPatterns = this.compileIdempotentPatterns();
  private readonly deduplicatablePostPatterns = this.compileDeduplicatablePostPatterns();
  private readonly safePatterns = this.compileSafePatterns();

  constructor(
    config: Partial<DeduplicationConfig> = {},
    cache?: CacheService,
    logger?: Logger
  ) {
    // Apply configuration with intelligent defaults
    this.config = Object.freeze({
      defaultTtl: 300_000, // 5 minutes
      maxPendingTime: 30_000, // 30 seconds
      enableRedisBackup: true,
      keyPrefix: 'dedup:',
      cleanupInterval: 60_000, // 1 minute
      maxMemoryItems: 10_000, // Prevent memory bloat
      ...config
    });

    // Initialize cache service with optimized settings
    this.cache = cache instanceof EnhancedCacheService
      ? cache
      : CacheFactory.createDomainCache('deduplication', {
        l1MaxItems: Math.min(this.config.maxMemoryItems, 5000),
        l1DefaultTtl: this.config.defaultTtl,
        l2DefaultTtl: Math.floor(this.config.defaultTtl / 1000),
        l2KeyPrefix: this.config.keyPrefix,
        enableStampedeProtection: true
      });

    // Initialize logger with enhanced capabilities
    this.logger = logger || this.createEnhancedLogger();

    // Set up automatic cleanup with error handling
    this.cleanupTimer = setInterval(() => {
      this.performCleanup().catch(error =>
        this.logger.error('Cleanup operation failed', error as Error)
      );
    }, this.config.cleanupInterval);
  }

  /**
   * Get singleton instance with better error handling
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
   * Handle idempotent request with enhanced deduplication
   * Now includes better error handling and performance tracking
   */
  async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = this.config.defaultTtl
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(key);

    this.totalRequests++;

    try {
      // Enhanced lookup with detailed source tracking
      const result = await this.performLookupSequence<T>(cacheKey, operation, ttl);

      // Track performance metrics
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(latency, result.source === 'operation' ? 'miss' : 'hit');

      return result.data;
    } catch (error) {
      this.logger.error('Idempotent request handling failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate idempotency key with enhanced collision resistance
   * Uses more entropy and better timestamp handling
   */
  generateIdempotencyKey(
    userId: number,
    endpoint: string,
    requestData?: unknown,
    timeWindow: number = 1000 // Milliseconds for grouping
  ): string {
    const payload = {
      userId,
      endpoint,
      data: requestData || {},
      // Group requests within time window for better deduplication
      timestamp: Math.floor(Date.now() / timeWindow) * timeWindow,
      // Add cryptographically secure entropy to prevent collisions
      entropy: randomBytes(4).toString('hex')
    };

    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 20); // Slightly longer for better collision resistance
  }

  /**
   * Generate request hash with improved normalization
   * Better handling of header normalization and body serialization
   */
  generateRequestHash(
    method: string,
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): string {
    const normalizedHeaders = this.normalizeHeaders(headers || {});
    const normalizedBody = this.normalizeBody(body);

    const payload = {
      method: method.toUpperCase(),
      url: this.normalizeUrl(url),
      body: normalizedBody,
      headers: normalizedHeaders
    };

    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Enhanced deduplication decision logic
   * More intelligent handling of different request types
   */
  shouldDeduplicate(
    method: string,
    endpoint: string,
    headers?: Record<string, string>
  ): boolean {
    const upperMethod = method.toUpperCase();

    // Never deduplicate streaming or real-time requests
    if (this.isStreamingRequest(headers)) {
      return false;
    }

    // Safe operations are always deduplicatable
    if (['GET', 'HEAD', 'OPTIONS'].includes(upperMethod)) {
      return true;
    }

    // Idempotent operations for specific endpoints
    if (['PUT', 'DELETE'].includes(upperMethod)) {
      return this.isIdempotentEndpoint(endpoint);
    }

    // Selective POST deduplication
    if (upperMethod === 'POST') {
      return this.isDeduplicatablePostEndpoint(endpoint);
    }

    return false;
  }

  /**
   * Enhanced cache clearing with batch operations
   * More efficient pattern matching and Redis operations
   */
  async clearCache(keyOrPattern: string): Promise<void> {
    const operations: Promise<void>[] = [];

    // Clear memory cache
    operations.push(this.clearMemoryCacheOptimized(keyOrPattern));

    // Clear Redis cache if enabled
    if (this.config.enableRedisBackup) {
      operations.push(this.clearRedisCacheOptimized(keyOrPattern));
    }

    await Promise.allSettled(operations);
  }

  /**
   * Get comprehensive cache statistics
   * Enhanced metrics for better monitoring
   */
  getStats(): CacheStatistics {
    const hitRate = this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0;
    const averageLatency = this.cacheHits > 0 ? this.totalLatency / this.cacheHits : 0;
    const uptime = Date.now() - this.startTime;

    return {
      pendingRequests: this.pendingRequests.size,
      completedRequests: this.completedRequests.size,
      memoryUsage: this.calculateMemoryUsage(),
      hitRate: Math.round(hitRate * 100) / 100,
      averageLatency: Math.round(averageLatency * 100) / 100,
      uptime: Math.floor(uptime / 1000) // Convert to seconds
    };
  }

  /**
   * Graceful shutdown with proper cleanup
   */
  async shutdown(): Promise<void> {
    clearInterval(this.cleanupTimer);

    // Wait for pending requests to complete or timeout
    const pendingPromises = Array.from(this.pendingRequests.values());
    if (pendingPromises.length > 0) {
      await Promise.allSettled(
        pendingPromises.map(promise =>
          Promise.race([
            promise,
            new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
          ])
        )
      );
    }

    // Clear all caches
    this.completedRequests.clear();
    this.pendingRequests.clear();
  }

  // Private helper methods with enhanced functionality

  /**
   * Create enhanced logger with debug capabilities
   */
  private createEnhancedLogger(): Logger {
    return {
      warn: (message: string, error?: Error) => {
        // eslint-disable-next-line no-console
        console.warn(`[RequestDeduplicator] ${message}`, error?.message || '');
      },
      error: (message: string, error?: Error) => {
        // eslint-disable-next-line no-console
        console.error(`[RequestDeduplicator] ${message}`, error?.message || '');
      },
      debug: (message: string, data?: unknown) => {
        // eslint-disable-next-line no-console
        console.debug(`[RequestDeduplicator] ${message}`, data);
      }
    };
  }

  /**
   * Perform the complete lookup sequence with better organization
   */
  private async performLookupSequence<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    ttl: number
  ): Promise<{ data: T; source: 'pending' | 'memory' | 'redis' | 'operation' }> {
    // Step 1: Check for pending requests
    const pendingResult = await this.checkPendingRequest<T>(cacheKey);
    if (pendingResult.found) {
      return { data: pendingResult.data as T, source: 'pending' };
    }

    // Step 2: Check memory cache
    const memoryResult = this.checkMemoryCache<T>(cacheKey, ttl);
    if (memoryResult.found) {
      return { data: memoryResult.data as T, source: 'memory' };
    }

    // Step 3: Check Redis cache
    const redisResult = await this.checkRedisCache<T>(cacheKey);
    if (redisResult.found) {
      return { data: redisResult.data as T, source: 'redis' };
    }

    // Step 4: Execute operation
    const result = await this.executeAndCacheOperation(cacheKey, operation, ttl);
    return { data: result, source: 'operation' };
  }

  /**
   * Enhanced pending request checking with better timeout handling
   */
  private async checkPendingRequest<T>(cacheKey: string): Promise<CacheLookupResult<T>> {
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (!pendingRequest) {
      return { found: false };
    }

    try {
      const startTime = performance.now();
      const result = await Promise.race([
        pendingRequest,
        this.createTimeoutPromise(this.config.maxPendingTime)
      ]);

      const latency = performance.now() - startTime;
      return {
        found: true,
        data: result as T,
        source: 'pending',
        latency
      };
    } catch (error) {
      this.pendingRequests.delete(cacheKey);

      if (error instanceof Error && error.message === 'Request timeout') {
        this.logger.warn(`Pending request timeout for key: ${cacheKey}`);
        throw error;
      }

      return { found: false };
    }
  }

  /**
   * Enhanced memory cache checking with size awareness
   */
  private checkMemoryCache<T>(cacheKey: string, ttl: number): CacheLookupResult<T> {
    const completed = this.completedRequests.get(cacheKey);

    if (completed && (Date.now() - completed.timestamp.getTime()) < ttl) {
      // Move to front for LRU behavior
      this.completedRequests.delete(cacheKey);
      this.completedRequests.set(cacheKey, completed);

      cachePerformanceMonitor.recordCacheHit(cacheKey, 0);
      return {
        found: true,
        data: completed.response as T,
        source: 'memory',
        latency: 0
      };
    }

    // Clean up expired entry
    if (completed) {
      this.completedRequests.delete(cacheKey);
    }

    return { found: false };
  }

  /**
   * Enhanced Redis cache checking with better error handling
   */
  private async checkRedisCache<T>(cacheKey: string): Promise<CacheLookupResult<T>> {
    if (!this.config.enableRedisBackup) {
      return { found: false };
    }

    try {
      const startTime = performance.now();
      const cachedResult = await this.cache.get(cacheKey);
      const latency = performance.now() - startTime;

      if (!cachedResult) {
        return { found: false };
      }

      // Store in memory with size calculation
      const serializedSize = JSON.stringify(cachedResult).length * 2; // UTF-16
      this.storeInMemory(cacheKey, cachedResult, serializedSize);

      cachePerformanceMonitor.recordCacheHit(cacheKey, latency);
      return {
        found: true,
        data: cachedResult as T,
        source: 'redis',
        latency
      };
    } catch (error) {
      this.logger.warn('Redis cache lookup failed', error as Error);
      cachePerformanceMonitor.recordCacheError(cacheKey, error as Error);
      return { found: false };
    }
  }

  /**
   * Execute operation with enhanced error handling and memory management
   */
  private async executeAndCacheOperation<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const startTime = performance.now();
    const promise = this.executeWithErrorHandling(operation);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      const responseTime = performance.now() - startTime;

      cachePerformanceMonitor.recordCacheMiss(cacheKey, responseTime);

      // Store with size awareness
      const serializedSize = JSON.stringify(result).length * 2;
      this.storeInMemory(cacheKey, result, serializedSize);

      // Store in Redis with fire-and-forget pattern
      this.storeInRedisAsync(cacheKey, result, ttl);

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Store in memory with size tracking and eviction
   */
  private storeInMemory(cacheKey: string, result: unknown, size: number): void {
    // Check if we need to evict items
    this.evictIfNecessary();

    const etag = this.generateETag(result);
    this.completedRequests.set(cacheKey, {
      response: result,
      timestamp: new Date(),
      etag,
      size
    });
  }

  /**
   * Evict items if memory cache is too large (LRU eviction)
   */
  private evictIfNecessary(): void {
    while (this.completedRequests.size >= this.config.maxMemoryItems) {
      const firstKey = this.completedRequests.keys().next().value;
      if (firstKey) {
        this.completedRequests.delete(firstKey);
      } else {
        break;
      }
    }
  }

  /**
   * Async Redis storage to avoid blocking
   */
  private storeInRedisAsync(cacheKey: string, result: unknown, ttl: number): void {
    if (!this.config.enableRedisBackup) {
      return;
    }

    // Fire and forget - don't await
    this.cache.setWithTags(cacheKey, result, ['deduplication'], {
      ttl: Math.floor(ttl / 1000)
    }).catch(error => {
      this.logger.warn('Redis cache storage failed', error as Error);
    });
  }

  /**
   * Optimized memory cache clearing
   */
  private async clearMemoryCacheOptimized(keyOrPattern: string): Promise<void> {
    const cacheKey = this.getCacheKey(keyOrPattern);

    if (!keyOrPattern.includes('*')) {
      this.completedRequests.delete(cacheKey);
      return;
    }

    // Use pre-compiled patterns for better performance
    const pattern = this.findMatchingPattern(keyOrPattern);
    if (pattern) {
      const keysToDelete: string[] = [];

      for (const key of this.completedRequests.keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }

      // Batch delete for better performance
      keysToDelete.forEach(key => this.completedRequests.delete(key));
    }
  }

  /**
   * Optimized Redis cache clearing
   */
  private async clearRedisCacheOptimized(keyOrPattern: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(keyOrPattern);

      if (keyOrPattern.includes('*')) {
        const tag = keyOrPattern.replace(/\*/g, '').replace(this.config.keyPrefix, '');
        await this.cache.invalidateByTags([tag, 'deduplication']);
      } else {
        await this.cache.delete(cacheKey);
      }
    } catch (error) {
      this.logger.warn('Redis cache clear failed', error as Error);
    }
  }

  /**
   * Find matching pre-compiled pattern for better performance
   */
  private findMatchingPattern(keyOrPattern: string): RegExp | undefined {
    const searchPattern = keyOrPattern.replace(/\*/g, '.*');
    return this.safePatterns.find(pattern => pattern.source === searchPattern);
  }

  /**
   * Enhanced cleanup with memory pressure handling
   */
  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired items
    for (const [key, value] of this.completedRequests.entries()) {
      if ((now - value.timestamp.getTime()) > this.config.defaultTtl) {
        expiredKeys.push(key);
      }
    }

    // Batch delete expired items
    expiredKeys.forEach(key => this.completedRequests.delete(key));

    // Log cleanup results if debug logging is enabled
    if (this.logger.debug && expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Calculate total memory usage more accurately
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, value] of this.completedRequests.entries()) {
      totalSize += key.length * 2; // Key size
      totalSize += value.size; // Cached response size
      totalSize += 150; // Overhead for timestamps, etags, etc.
    }

    return totalSize;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(latency: number, type: 'hit' | 'miss'): void {
    if (type === 'hit') {
      this.cacheHits++;
      this.totalLatency += latency;
    }
  }

  // Enhanced helper methods with better performance

  /**
   * Normalize URL for consistent hashing
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      // Sort query parameters for consistent hashing
      urlObj.searchParams.sort();
      return urlObj.pathname + urlObj.search;
    } catch {
      return url; // Fallback for invalid URLs
    }
  }

  /**
   * Normalize request body for consistent hashing
   */
  private normalizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Sort object keys for consistent serialization
    if (Array.isArray(body)) {
      return body.map(item => this.normalizeBody(item));
    }

    const sorted: Record<string, unknown> = {};
    Object.keys(body as Record<string, unknown>)
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        const bodyRecord = body as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(bodyRecord, key)) {
          sorted[key] = this.normalizeBody(bodyRecord[key]);
        }
      });

    return sorted;
  }

  /**
   * Normalize headers for consistent hashing
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const relevantHeaders = [
      'content-type', 'accept', 'authorization',
      'x-api-key', 'x-request-id'
    ];

    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (relevantHeaders.includes(lowerKey)) {
        normalized[lowerKey] = value.trim();
      }
    }

    return normalized;
  }

  /**
   * Check if request is streaming based on headers
   */
  private isStreamingRequest(headers?: Record<string, string>): boolean {
    if (!headers) return false;

    const contentType = headers['content-type']?.toLowerCase() || '';
    const accept = headers.accept?.toLowerCase() || '';

    return contentType.includes('stream') ||
      accept.includes('stream') ||
      accept.includes('event-stream');
  }

  /**
   * Pre-compile idempotent patterns for better performance
   */
  private compileIdempotentPatterns(): RegExp[] {
    return [
      /^\/api\/users\/\d+$/,
      /^\/api\/properties\/\d+$/,
      /^\/api\/professionals\/\d+$/,
      /^\/api\/trust\/score\/\d+$/,
      /^\/api\/settings\/\w+$/
    ];
  }

  /**
   * Pre-compile deduplicatable POST patterns
   */
  private compileDeduplicatablePostPatterns(): RegExp[] {
    return [
      /^\/api\/analytics\/events$/,
      /^\/api\/professionals\/search$/,
      /^\/api\/properties\/search$/,
      /^\/api\/fraud-intelligence\/report$/,
      /^\/api\/recommendations\/generate$/
    ];
  }

  /**
   * Pre-compile safe patterns for cache clearing
   */
  private compileSafePatterns(): RegExp[] {
    return [
      /^dedup:user:\d+:.*/,
      /^dedup:endpoint:.*/,
      /^dedup:session:.*/,
      /^dedup:analytics:.*/
    ];
  }

  /**
   * Check if endpoint supports idempotent operations
   */
  private isIdempotentEndpoint(endpoint: string): boolean {
    return this.idempotentPatterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * Check if POST endpoint should be deduplicated
   */
  private isDeduplicatablePostEndpoint(endpoint: string): boolean {
    return this.deduplicatablePostPatterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * Generate cache key with consistent formatting
   */
  private getCacheKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Generate ETag with better performance
   */
  private generateETag(data: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Execute operation with comprehensive error handling
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
   * Create timeout promise with proper typing
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }
}

/**
 * Default instance for easy access with better initialization
 */
export const requestDeduplicator = RequestDeduplicator.getInstance();