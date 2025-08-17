/**
 * Enhanced Cache Manager
 * 
 * Wrapper around the existing CacheService to provide the interface
 * expected by the unified API client with additional enhancements.
 */

import { cacheService, type CacheEntry } from './CacheService';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  persist?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
}

/**
 * Enhanced Cache Manager class
 * Provides a simplified interface for the unified API client
 */
class EnhancedCacheManager {
  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    return cacheService.get<T>(key);
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    cacheService.set(key, value, { ttl });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return cacheService.has(key);
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    return cacheService.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    cacheService.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const stats = cacheService.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      totalEntries: stats.totalEntries,
      totalSize: stats.totalSize
    };
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    return cacheService.getOrSet(key, factory, options);
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    return cacheService.invalidateByTags(tags);
  }

  /**
   * Warm cache with multiple entries
   */
  warm<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return cacheService.getKeys();
  }

  /**
   * Get entries by tag
   */
  getByTag(tag: string): Array<{ key: string; data: any }> {
    return cacheService.getByTag(tag);
  }

  /**
   * Preload cache entries
   */
  async preload<T>(
    entries: Array<{
      key: string;
      factory: () => Promise<T>;
      ttl?: number;
      tags?: string[];
    }>
  ): Promise<void> {
    const preloadEntries = entries.map(({ key, factory, ttl, tags }) => ({
      key,
      factory,
      options: { ttl, tags }
    }));

    await cacheService.preload(preloadEntries);
  }

  /**
   * Export cache data for backup/migration
   */
  export(): Record<string, any> {
    return cacheService.export();
  }

  /**
   * Import cache data from backup/migration
   */
  import(data: Record<string, any>): void {
    cacheService.import(data);
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: {
    maxSize?: number;
    defaultTTL?: number;
    maxEntries?: number;
    enableCompression?: boolean;
    enablePersistence?: boolean;
  }): void {
    cacheService.updateConfig(config);
  }

  /**
   * Get current cache configuration
   */
  getConfig() {
    return cacheService.getConfig();
  }
}

// Export singleton instance
export const enhancedCache = new EnhancedCacheManager();

// Export class for custom instances
export { EnhancedCacheManager };

// Export default instance
export default enhancedCache;