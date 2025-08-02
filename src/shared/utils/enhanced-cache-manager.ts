/**
 * Enhanced Cache Manager
 * Provides intelligent caching with TTL, memory management, and performance monitoring
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: number;
  newestEntry: number;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableStats: boolean; // Whether to track statistics
}

export class EnhancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
    deletes: 0,
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout | undefined;
  private totalSize = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true,
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return entry.data as T;
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T, ttl?: number): boolean {
    const now = Date.now();
    const entryTtl = ttl || this.config.defaultTtl;
    const size = this.calculateSize(data);

    // Check if we need to make space
    if (!this.makeSpace(size)) {
      return false; // Could not make enough space
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 0,
      lastAccessed: now,
      size,
    };

    this.cache.set(key, entry);
    this.totalSize += size;

    if (this.config.enableStats) {
      this.stats.sets++;
    }

    return true;
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.totalSize -= entry.size;

    if (this.config.enableStats) {
      this.stats.deletes++;
    }

    return true;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: this.cache.size,
      totalSize: this.totalSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictionCount: this.stats.evictions,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
    };
  }

  /**
   * Get cache keys matching a pattern
   */
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    if (!pattern) {
      return keys;
    }
    return keys.filter(key => pattern.test(key));
  }

  /**
   * Warm the cache with data
   */
  warm<T>(entries: Array<{ key: string; data: T; ttl?: number }>): number {
    let successCount = 0;
    for (const entry of entries) {
      if (this.set(entry.key, entry.data, entry.ttl)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * Get multiple items at once
   */
  getMultiple<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    for (const key of keys) {
      result.set(key, this.get<T>(key));
    }
    return result;
  }

  /**
   * Set multiple items at once
   */
  setMultiple<T>(entries: Array<{ key: string; data: T; ttl?: number }>): number {
    let successCount = 0;
    for (const entry of entries) {
      if (this.set(entry.key, entry.data, entry.ttl)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * Delete multiple items at once
   */
  deleteMultiple(keys: string[]): number {
    let deleteCount = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        deleteCount++;
      }
    }
    return deleteCount;
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  /**
   * Make space in the cache for new entry
   */
  private makeSpace(requiredSize: number): boolean {
    // Check if we're within limits
    if (
      this.cache.size < this.config.maxEntries &&
      this.totalSize + requiredSize <= this.config.maxSize
    ) {
      return true;
    }

    // Need to evict entries
    const entries = Array.from(this.cache.entries());
    
    // Sort by priority (least recently used + least frequently used)
    entries.sort(([, a], [, b]) => {
      const aScore = a.lastAccessed + (a.accessCount * 1000);
      const bScore = b.lastAccessed + (b.accessCount * 1000);
      return aScore - bScore;
    });

    let freedSpace = 0;
    let evictedCount = 0;

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      freedSpace += entry.size;
      evictedCount++;

      if (this.config.enableStats) {
        this.stats.evictions++;
      }

      // Check if we have enough space now
      if (
        this.cache.size < this.config.maxEntries &&
        this.totalSize + requiredSize <= this.config.maxSize
      ) {
        return true;
      }

      // Safety check to prevent infinite loop
      if (evictedCount > this.config.maxEntries / 2) {
        break;
      }
    }

    return this.totalSize + requiredSize <= this.config.maxSize;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }

    if (process.env.NODE_ENV === "development" && keysToDelete.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[EnhancedCacheManager] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Destroy the cache manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

// Create and export default instance
export const enhancedCache = new EnhancedCacheManager({
  maxSize: 25 * 1024 * 1024, // 25MB
  maxEntries: 500,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  enableStats: true,
});

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    enhancedCache.destroy();
  });
}

// Export types for external use
export type { CacheEntry, CacheStats, CacheConfig };