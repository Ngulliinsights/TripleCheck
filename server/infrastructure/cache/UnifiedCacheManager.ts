/**
 * Unified Multi-Level Cache Manager
 * 
 * Consolidates existing cache implementations into a unified L1/L2 architecture:
 * - L1: In-memory LRU cache (10K items, 5min TTL) for ultra-fast access
 * - L2: Redis cache (1hr TTL) for distributed caching and persistence
 * 
 * Features:
 * - Tag-based cache invalidation for related data updates
 * - Cache stampede prevention with distributed locking
 * - Intelligent pre-fetching based on usage patterns
 * - Comprehensive performance monitoring and metrics
 */

import { createHash } from 'crypto';

import Redis from 'ioredis';

import { cachePerformanceMonitor } from '../monitoring/CachePerformanceMonitor';

import { CacheService } from '../../../core/src/cache'


/**
 * Cache entry with metadata for L1 cache
 */
interface L1CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  tags: Set<string>;
  size: number; // Estimated memory size in bytes
}

/**
 * Cache configuration options
 */
export interface UnifiedCacheConfig {
  // L1 Cache Configuration
  l1MaxItems: number;
  l1DefaultTtl: number; // milliseconds
  l1MaxMemoryMB: number;
  
  // L2 Cache Configuration
  l2DefaultTtl: number; // seconds
  l2KeyPrefix: string;
  
  // Redis Configuration
  redisUrl?: string;
  redisOptions?: Redis.RedisOptions;
  
  // Performance Configuration
  enablePreFetching: boolean;
  preFetchThreshold: number; // Access count threshold for pre-fetching
  enableStampedeProtection: boolean;
  stampedeTimeout: number; // milliseconds
  
  // Monitoring Configuration
  enableMetrics: boolean;
  metricsInterval: number; // milliseconds
}

/**
 * Cache operation result with metadata
 */
export interface CacheResult<T = unknown> {
  value: T | null;
  hit: boolean;
  source: 'l1' | 'l2' | 'miss';
  latency: number;
  tags?: string[];
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  l1: {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsageMB: number;
    maxMemoryMB: number;
    evictions: number;
  };
  l2: {
    connected: boolean;
    hitRate: number;
    errors: number;
    latencyMs: number;
  };
  overall: {
    hitRate: number;
    totalRequests: number;
    averageLatency: number;
  };
}

/**
 * Pending operation for stampede protection
 */
interface PendingOperation<T> {
  promise: Promise<T>;
  timestamp: number;
  requestCount: number;
}

/**
 * Usage pattern for intelligent pre-fetching
 */
interface UsagePattern {
  key: string;
  accessCount: number;
  lastAccessed: number;
  averageInterval: number;
  relatedKeys: Set<string>;
}

/**
 * Unified Cache Manager implementing L1/L2 architecture
 */
export class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;
  
  // L1 Cache (In-Memory LRU)
  private l1Cache = new Map<string, L1CacheEntry>();
  private l1AccessOrder: string[] = []; // For LRU eviction
  private l1MemoryUsage = 0;
  
  // L2 Cache (Redis)
  private redis?: Redis;
  private redisConnected = false;
  
  // Stampede Protection
  private pendingOperations = new Map<string, PendingOperation<unknown>>();
  
  // Usage Patterns for Pre-fetching
  private usagePatterns = new Map<string, UsagePattern>();
  
  // Performance Metrics
  private metrics = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalRequests: 0,
    l1Evictions: 0,
    l2Errors: 0,
    totalLatency: 0,
  };
  
  // Configuration
  private config: UnifiedCacheConfig;
  
  // Cleanup intervals
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private preFetchInterval?: NodeJS.Timeout;

  constructor(config: Partial<UnifiedCacheConfig> = {}) {
    this.config = {
      // L1 Cache defaults
      l1MaxItems: 10000,
      l1DefaultTtl: 5 * 60 * 1000, // 5 minutes
      l1MaxMemoryMB: 50,
      
      // L2 Cache defaults
      l2DefaultTtl: 3600, // 1 hour
      l2KeyPrefix: 'unified:',
      
      // Redis defaults
      redisUrl: process.env.REDIS_URL,
      redisOptions: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
      },
      
      // Performance defaults
      enablePreFetching: true,
      preFetchThreshold: 5,
      enableStampedeProtection: true,
      stampedeTimeout: 30000,
      
      // Monitoring defaults
      enableMetrics: true,
      metricsInterval: 60000, // 1 minute
      
      ...config
    };

    this.initializeRedis();
    this.startBackgroundTasks();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<UnifiedCacheConfig>): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager(config);
    }
    return UnifiedCacheManager.instance;
  }

  /**
   * Get value from cache with L1/L2 fallback
   */
  async get<T>(key: string, tags?: string[]): Promise<CacheResult<T>> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // Sanitize key to prevent injection
    const sanitizedKey = this.sanitizeKey(key);
    
    // Update usage patterns for pre-fetching
    this.updateUsagePattern(sanitizedKey, tags);

    // Try L1 cache first
    const l1Result = this.getFromL1<T>(sanitizedKey);
    if (l1Result.hit) {
      const latency = Date.now() - startTime;
      this.metrics.l1Hits++;
      this.metrics.totalLatency += latency;
      
      if (this.config.enableMetrics) {
        cachePerformanceMonitor.recordCacheHit(sanitizedKey, latency);
      }
      
      return {
        value: l1Result.value,
        hit: true,
        source: 'l1',
        latency,
        tags: l1Result.tags ? Array.from(l1Result.tags) : undefined
      };
    }

    this.metrics.l1Misses++;

    // Try L2 cache (Redis)
    const l2Result = await this.getFromL2<T>(sanitizedKey);
    if (l2Result.hit && l2Result.value !== null) {
      const latency = Date.now() - startTime;
      this.metrics.l2Hits++;
      this.metrics.totalLatency += latency;
      
      // Store in L1 for faster future access
      this.setInL1(sanitizedKey, l2Result.value, this.config.l1DefaultTtl, tags);
      
      if (this.config.enableMetrics) {
        cachePerformanceMonitor.recordCacheHit(sanitizedKey, latency);
      }
      
      return {
        value: l2Result.value,
        hit: true,
        source: 'l2',
        latency,
        tags
      };
    }

    this.metrics.l2Misses++;
    const latency = Date.now() - startTime;
    this.metrics.totalLatency += latency;
    
    if (this.config.enableMetrics) {
      cachePerformanceMonitor.recordCacheMiss(sanitizedKey, latency);
    }

    return {
      value: null,
      hit: false,
      source: 'miss',
      latency,
      tags
    };
  }

  /**
   * Set value in both L1 and L2 caches
   */
  async set<T>(
    key: string, 
    value: T, 
    options: {
      l1Ttl?: number;
      l2Ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const sanitizedKey = this.sanitizeKey(key);
    const l1Ttl = options.l1Ttl || this.config.l1DefaultTtl;
    const l2Ttl = options.l2Ttl || this.config.l2DefaultTtl;

    // Set in L1 cache
    this.setInL1(sanitizedKey, value, l1Ttl, options.tags);

    // Set in L2 cache (Redis)
    await this.setInL2(sanitizedKey, value, l2Ttl, options.tags);
  }

  /**
   * Get or set with cache-aside pattern and stampede protection
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      l1Ttl?: number;
      l2Ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const sanitizedKey = this.sanitizeKey(key);
    
    // Try to get from cache first
    const cached = await this.get<T>(sanitizedKey, options.tags);
    if (cached.hit && cached.value !== null) {
      return cached.value;
    }

    // Stampede protection
    if (this.config.enableStampedeProtection) {
      const pending = this.pendingOperations.get(sanitizedKey);
      if (pending) {
        pending.requestCount++;
        
        // Wait for pending operation with timeout
        try {
          const result = await Promise.race([
            pending.promise,
            this.createTimeoutPromise(this.config.stampedeTimeout)
          ]);
          return result as T;
        } catch (error) {
          // If timeout or error, remove pending and continue
          this.pendingOperations.delete(sanitizedKey);
          if (error instanceof Error && error.message === 'Operation timeout') {
            throw error;
          }
        }
      }
    }

    // Create new operation
    const operation = factory();
    
    if (this.config.enableStampedeProtection) {
      this.pendingOperations.set(sanitizedKey, {
        promise: operation,
        timestamp: Date.now(),
        requestCount: 1
      });
    }

    try {
      const result = await operation;
      
      // Cache the result
      await this.set(sanitizedKey, result, options);
      
      return result;
    } finally {
      // Clean up pending operation
      if (this.config.enableStampedeProtection) {
        this.pendingOperations.delete(sanitizedKey);
      }
    }
  }

  /**
   * Delete from both L1 and L2 caches
   */
  async delete(key: string): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    
    // Delete from L1
    const l1Deleted = this.deleteFromL1(sanitizedKey);
    
    // Delete from L2
    const l2Deleted = await this.deleteFromL2(sanitizedKey);
    
    return l1Deleted || l2Deleted;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;
    
    // Invalidate L1 cache by tags
    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.tags && tags.some(tag => entry.tags.has(tag))) {
        this.deleteFromL1(key);
        deletedCount++;
      }
    }
    
    // Invalidate L2 cache by tags (requires scanning, expensive operation)
    if (this.redis && this.redisConnected) {
      try {
        // Use Redis SCAN to find keys with matching tags
        const stream = this.redis.scanStream({
          match: `${this.config.l2KeyPrefix}*`,
          count: 100
        });
        
        for await (const keys of stream) {
          for (const key of keys) {
            try {
              const data = await this.redis.get(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed.tags && Array.isArray(parsed.tags)) {
                  if (tags.some(tag => parsed.tags.includes(tag))) {
                    await this.redis.del(key);
                    deletedCount++;
                  }
                }
              }
            } catch (error) {
              // Skip invalid entries
              continue;
            }
          }
        }
      } catch (error) {
        this.metrics.l2Errors++;
        console.warn('Redis tag invalidation failed:', error);
      }
    }
    
    return deletedCount;
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    // Clear L1
    this.l1Cache.clear();
    this.l1AccessOrder = [];
    this.l1MemoryUsage = 0;
    
    // Clear L2
    if (this.redis && this.redisConnected) {
      try {
        const keys = await this.redis.keys(`${this.config.l2KeyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        this.metrics.l2Errors++;
        console.warn('Redis clear failed:', error);
      }
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.metrics.totalRequests || 1; // Avoid division by zero
    const l1Total = this.metrics.l1Hits + this.metrics.l1Misses || 1;
    const l2Total = this.metrics.l2Hits + this.metrics.l2Misses || 1;
    
    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.config.l1MaxItems,
        hitRate: this.metrics.l1Hits / l1Total,
        memoryUsageMB: this.l1MemoryUsage / (1024 * 1024),
        maxMemoryMB: this.config.l1MaxMemoryMB,
        evictions: this.metrics.l1Evictions
      },
      l2: {
        connected: this.redisConnected,
        hitRate: this.metrics.l2Hits / l2Total,
        errors: this.metrics.l2Errors,
        latencyMs: this.redis ? 0 : -1 // TODO: Implement Redis latency tracking
      },
      overall: {
        hitRate: (this.metrics.l1Hits + this.metrics.l2Hits) / totalRequests,
        totalRequests: this.metrics.totalRequests,
        averageLatency: this.metrics.totalLatency / totalRequests
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async destroy(): Promise<void> {
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.preFetchInterval) {
      clearInterval(this.preFetchInterval);
    }
    
    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }
    
    // Clear caches
    this.l1Cache.clear();
    this.pendingOperations.clear();
    this.usagePatterns.clear();
  }

  // Private methods

  private initializeRedis(): void {
    if (!this.config.redisUrl) {
      console.warn('Redis URL not provided, L2 cache disabled');
      return;
    }

    try {
      this.redis = new Redis(this.config.redisUrl, {
        ...this.config.redisOptions,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        this.redisConnected = true;
        console.log('Redis connected for unified cache');
      });

      this.redis.on('error', (error) => {
        this.redisConnected = false;
        this.metrics.l2Errors++;
        console.warn('Redis error:', error.message);
      });

      this.redis.on('close', () => {
        this.redisConnected = false;
        console.warn('Redis connection closed');
      });

    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
    }
  }

  private startBackgroundTasks(): void {
    // L1 cleanup task
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredL1Entries();
    }, 60000); // Every minute

    // Metrics reporting
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.reportMetrics();
      }, this.config.metricsInterval);
    }

    // Pre-fetching task
    if (this.config.enablePreFetching) {
      this.preFetchInterval = setInterval(() => {
        this.performIntelligentPreFetch();
      }, 300000); // Every 5 minutes
    }
  }

  private getFromL1<T>(key: string): { hit: boolean; value: T | null; tags?: Set<string> } {
    const entry = this.l1Cache.get(key);
    
    if (!entry) {
      return { hit: false, value: null };
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.deleteFromL1(key);
      return { hit: false, value: null };
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Move to end of access order (most recently used)
    const index = this.l1AccessOrder.indexOf(key);
    if (index > -1) {
      this.l1AccessOrder.splice(index, 1);
    }
    this.l1AccessOrder.push(key);

    return { 
      hit: true, 
      value: entry.value as T,
      tags: entry.tags
    };
  }

  private setInL1<T>(key: string, value: T, ttl: number, tags?: string[]): void {
    const size = this.estimateSize(value);
    const expiresAt = Date.now() + ttl;
    const tagSet = tags ? new Set(tags) : new Set<string>();

    // Check memory limits and evict if necessary
    this.ensureL1Capacity(size);

    // Create entry
    const entry: L1CacheEntry<T> = {
      value,
      expiresAt,
      accessCount: 1,
      lastAccessed: Date.now(),
      tags: tagSet,
      size
    };

    // Update existing entry or add new one
    const existingEntry = this.l1Cache.get(key);
    if (existingEntry) {
      this.l1MemoryUsage -= existingEntry.size;
    } else {
      this.l1AccessOrder.push(key);
    }

    this.l1Cache.set(key, entry);
    this.l1MemoryUsage += size;
  }

  private deleteFromL1(key: string): boolean {
    const entry = this.l1Cache.get(key);
    if (!entry) {
      return false;
    }

    this.l1Cache.delete(key);
    this.l1MemoryUsage -= entry.size;
    
    const index = this.l1AccessOrder.indexOf(key);
    if (index > -1) {
      this.l1AccessOrder.splice(index, 1);
    }

    return true;
  }

  private async getFromL2<T>(key: string): Promise<{ hit: boolean; value: T | null }> {
    if (!this.redis || !this.redisConnected) {
      return { hit: false, value: null };
    }

    try {
      const data = await this.redis.get(`${this.config.l2KeyPrefix}${key}`);
      if (!data) {
        return { hit: false, value: null };
      }

      const parsed = JSON.parse(data);
      return { hit: true, value: parsed.value as T };
    } catch (error) {
      this.metrics.l2Errors++;
      return { hit: false, value: null };
    }
  }

  private async setInL2<T>(key: string, value: T, ttl: number, tags?: string[]): Promise<void> {
    if (!this.redis || !this.redisConnected) {
      return;
    }

    try {
      const data = JSON.stringify({
        value,
        tags: tags || [],
        timestamp: Date.now()
      });

      await this.redis.setex(`${this.config.l2KeyPrefix}${key}`, ttl, data);
    } catch (error) {
      this.metrics.l2Errors++;
      console.warn('Redis set failed:', error);
    }
  }

  private async deleteFromL2(key: string): Promise<boolean> {
    if (!this.redis || !this.redisConnected) {
      return false;
    }

    try {
      const result = await this.redis.del(`${this.config.l2KeyPrefix}${key}`);
      return result > 0;
    } catch (error) {
      this.metrics.l2Errors++;
      return false;
    }
  }

  private ensureL1Capacity(newEntrySize: number): void {
    const maxMemoryBytes = this.config.l1MaxMemoryMB * 1024 * 1024;
    
    // Evict entries if we exceed limits
    while (
      (this.l1Cache.size >= this.config.l1MaxItems) ||
      (this.l1MemoryUsage + newEntrySize > maxMemoryBytes)
    ) {
      if (this.l1AccessOrder.length === 0) {
        break;
      }

      // Evict least recently used entry
      const lruKey = this.l1AccessOrder.shift();
      if (lruKey) {
        this.deleteFromL1(lruKey);
        this.metrics.l1Evictions++;
      }
    }
  }

  private cleanupExpiredL1Entries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.l1Cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.deleteFromL1(key);
    }
  }

  private updateUsagePattern(key: string, tags?: string[]): void {
    if (!this.config.enablePreFetching) {
      return;
    }

    const now = Date.now();
    let pattern = this.usagePatterns.get(key);

    if (!pattern) {
      pattern = {
        key,
        accessCount: 0,
        lastAccessed: now,
        averageInterval: 0,
        relatedKeys: new Set()
      };
      this.usagePatterns.set(key, pattern);
    }

    // Update access statistics
    const interval = now - pattern.lastAccessed;
    pattern.averageInterval = pattern.averageInterval === 0 
      ? interval 
      : (pattern.averageInterval + interval) / 2;
    
    pattern.accessCount++;
    pattern.lastAccessed = now;

    // Track related keys through tags
    if (tags) {
      for (const tag of tags) {
        // Find other keys with the same tag
        for (const [otherKey, otherPattern] of this.usagePatterns.entries()) {
          if (otherKey !== key) {
            // This is a simplified relation detection
            // In practice, you'd want more sophisticated logic
            pattern.relatedKeys.add(otherKey);
          }
        }
      }
    }
  }

  private async performIntelligentPreFetch(): Promise<void> {
    if (!this.config.enablePreFetching) {
      return;
    }

    const now = Date.now();
    const candidatesForPreFetch: string[] = [];

    // Find keys that might need pre-fetching
    for (const [key, pattern] of this.usagePatterns.entries()) {
      // Pre-fetch if:
      // 1. Access count is above threshold
      // 2. Average interval suggests it will be accessed soon
      // 3. Not currently in L1 cache
      if (
        pattern.accessCount >= this.config.preFetchThreshold &&
        pattern.averageInterval > 0 &&
        (now - pattern.lastAccessed) >= (pattern.averageInterval * 0.8) &&
        !this.l1Cache.has(key)
      ) {
        candidatesForPreFetch.push(key);
      }
    }

    // Pre-fetch candidates (limit to avoid overwhelming the system)
    const maxPreFetch = Math.min(candidatesForPreFetch.length, 10);
    for (let i = 0; i < maxPreFetch; i++) {
      const key = candidatesForPreFetch[i];
      try {
        // Try to get from L2 and populate L1
        const result = await this.getFromL2(key);
        if (result.hit && result.value !== null) {
          this.setInL1(key, result.value, this.config.l1DefaultTtl);
        }
      } catch (error) {
        // Pre-fetching is best-effort, don't fail on errors
        continue;
      }
    }
  }

  private reportMetrics(): void {
    const stats = this.getStats();
    
    if (this.config.enableMetrics) {
      cachePerformanceMonitor.recordCacheStats({
        l1HitRate: stats.l1.hitRate,
        l2HitRate: stats.l2.hitRate,
        overallHitRate: stats.overall.hitRate,
        l1MemoryUsage: stats.l1.memoryUsageMB,
        totalRequests: stats.overall.totalRequests,
        averageLatency: stats.overall.averageLatency
      });
    }
  }

  private sanitizeKey(key: string): string {
    // Remove potentially dangerous characters and limit length
    return key
      .replace(/[^\w\-\.:]/g, '_')
      .substring(0, 250)
      .toLowerCase();
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16 encoding
    } catch {
      return 1000; // Default estimate for non-serializable values
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });
  }
}

// Export singleton instance
export const unifiedCacheManager = UnifiedCacheManager.getInstance();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await unifiedCacheManager.destroy();
});

process.on('SIGTERM', async () => {
  await unifiedCacheManager.destroy();
});