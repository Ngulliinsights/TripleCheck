import { createHash } from 'crypto';
import { CacheService } from '../cache/CacheService';
import { cachePerformanceMonitor } from '../monitoring/CachePerformanceMonitor';

/**
 * Interface for idempotent request handling
 */
export interface IdempotentRequest {
  idempotencyKey: string;
  requestHash: string;
  expiresAt: Date;
  response?: any;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * Configuration for request deduplication
 */
export interface DeduplicationConfig {
  defaultTtl: number; // Default TTL in milliseconds
  maxPendingTime: number; // Max time to wait for pending requests
  enableRedisBackup: boolean; // Whether to use Redis as backup storage
  keyPrefix: string; // Prefix for cache keys
}

/**
 * Request deduplication service to prevent race conditions and duplicate processing
 * Supports both in-memory and Redis backing for scalability
 */
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests = new Map<string, Promise<any>>();
  private completedRequests = new Map<string, { response: any; timestamp: Date; etag: string }>();
  private cache?: CacheService;
  private config: DeduplicationConfig;

  constructor(config: Partial<DeduplicationConfig> = {}, cache?: CacheService) {
    this.config = {
      defaultTtl: 300000, // 5 minutes
      maxPendingTime: 30000, // 30 seconds
      enableRedisBackup: true,
      keyPrefix: 'dedup:',
      ...config
    };
    this.cache = cache;
    
    // Clean up expired requests periodically
    setInterval(() => this.cleanupExpiredRequests(), 60000); // Every minute
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<DeduplicationConfig>, cache?: CacheService): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator(config, cache);
    }
    return RequestDeduplicator.instance;
  }

  /**
   * Handle idempotent request with deduplication
   */
  async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = this.config.defaultTtl
  ): Promise<T> {
    const cacheKey = this.getCacheKey(key);
    
    // Check if request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      try {
        // Wait for pending request with timeout
        return await Promise.race([
          this.pendingRequests.get(cacheKey)!,
          this.createTimeoutPromise(this.config.maxPendingTime)
        ]);
      } catch (error) {
        // If pending request fails or times out, remove it and continue
        this.pendingRequests.delete(cacheKey);
      }
    }

    // Check for completed request in memory
    const completed = this.completedRequests.get(cacheKey);
    if (completed && Date.now() - completed.timestamp.getTime() < ttl) {
      cachePerformanceMonitor.recordCacheHit(cacheKey, 0); // Memory cache hit
      return completed.response;
    }

    // Check Redis cache if enabled
    if (this.cache && this.config.enableRedisBackup) {
      try {
        const cachedResult = await this.cache.get(cacheKey);
        if (cachedResult) {
          // Store in memory for faster access
          this.completedRequests.set(cacheKey, {
            response: cachedResult,
            timestamp: new Date(),
            etag: this.generateETag(cachedResult)
          });
          cachePerformanceMonitor.recordCacheHit(cacheKey, 0); // Redis cache hit
          return cachedResult as T;
        }
      } catch (error) {
        console.warn('Redis cache lookup failed:', error);
        cachePerformanceMonitor.recordCacheError(cacheKey, error as Error);
      }
    }

    // Execute new request
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
      if (this.cache && this.config.enableRedisBackup) {
        try {
          await this.cache.set(cacheKey, result, { ttl: Math.floor(ttl / 1000) });
        } catch (error) {
          console.warn('Redis cache storage failed:', error);
        }
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Generate idempotency key from request data
   */
  generateIdempotencyKey(userId: number, endpoint: string, data?: any): string {
    const payload = {
      userId,
      endpoint,
      data: data || {},
      timestamp: Math.floor(Date.now() / 1000) // Round to second for short-term deduplication
    };
    
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate request hash for content-based deduplication
   */
  generateRequestHash(method: string, url: string, body?: any, headers?: Record<string, string>): string {
    const payload = {
      method: method.toUpperCase(),
      url,
      body: body || {},
      // Only include relevant headers for deduplication
      headers: this.filterHeaders(headers || {})
    };
    
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Check if request should be deduplicated
   */
  shouldDeduplicate(method: string, endpoint: string): boolean {
    // Only deduplicate safe and idempotent operations
    const safeOperations = ['GET', 'HEAD', 'OPTIONS'];
    const idempotentOperations = ['PUT', 'DELETE'];
    
    // Always deduplicate safe operations
    if (safeOperations.includes(method.toUpperCase())) {
      return true;
    }
    
    // Deduplicate idempotent operations for specific endpoints
    if (idempotentOperations.includes(method.toUpperCase())) {
      return this.isIdempotentEndpoint(endpoint);
    }
    
    // For POST operations, only deduplicate specific endpoints
    if (method.toUpperCase() === 'POST') {
      return this.isDeduplicatablePostEndpoint(endpoint);
    }
    
    return false;
  }

  /**
   * Clear cache for specific key or pattern
   */
  async clearCache(keyOrPattern: string): Promise<void> {
    const cacheKey = this.getCacheKey(keyOrPattern);
    
    // Clear from memory
    if (keyOrPattern.includes('*')) {
      // Pattern matching for memory cache
      const pattern = new RegExp(keyOrPattern.replace(/\*/g, '.*'));
      for (const key of this.completedRequests.keys()) {
        if (pattern.test(key)) {
          this.completedRequests.delete(key);
        }
      }
    } else {
      this.completedRequests.delete(cacheKey);
    }
    
    // Clear from Redis if enabled
    if (this.cache && this.config.enableRedisBackup) {
      try {
        if (keyOrPattern.includes('*')) {
          await this.cache.invalidateByPattern(cacheKey);
        } else {
          await this.cache.delete(cacheKey);
        }
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }
    }
  }

  /**
   * Get cache statistics
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

  // Private methods

  private getCacheKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private generateETag(data: any): string {
    return createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  private async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log error but don't cache failed results
      console.error('Request deduplication operation failed:', error);
      throw error;
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    // Only include headers that affect response content
    const relevantHeaders = ['content-type', 'accept', 'authorization'];
    const filtered: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (relevantHeaders.includes(key.toLowerCase())) {
        filtered[key.toLowerCase()] = value;
      }
    }
    
    return filtered;
  }

  private isIdempotentEndpoint(endpoint: string): boolean {
    // Define endpoints that are safe for idempotent operations
    const idempotentPatterns = [
      /^\/api\/users\/\d+$/,
      /^\/api\/properties\/\d+$/,
      /^\/api\/professionals\/\d+$/,
      /^\/api\/trust\/score\/\d+$/
    ];
    
    return idempotentPatterns.some(pattern => pattern.test(endpoint));
  }

  private isDeduplicatablePostEndpoint(endpoint: string): boolean {
    // Define POST endpoints that should be deduplicated
    const deduplicatablePatterns = [
      /^\/api\/analytics\/events$/,
      /^\/api\/professionals\/search$/,
      /^\/api\/properties\/search$/,
      /^\/api\/fraud-intelligence\/report$/
    ];
    
    return deduplicatablePatterns.some(pattern => pattern.test(endpoint));
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    
    // Clean up completed requests
    for (const [key, value] of this.completedRequests.entries()) {
      if (now - value.timestamp.getTime() > this.config.defaultTtl) {
        this.completedRequests.delete(key);
      }
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
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
 */
export const requestDeduplicator = RequestDeduplicator.getInstance();