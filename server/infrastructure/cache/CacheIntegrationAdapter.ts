/**
 * Cache Integration Adapter
 * 
 * Provides backward compatibility and integration layer for existing cache implementations
 * to seamlessly work with the new UnifiedCacheManager while maintaining existing APIs.
 */

import { CacheService } from "../infrastructure/cache"
import { UnifiedCacheManager, UnifiedCacheConfig } from './UnifiedCacheManager';

/**
 * Adapter that makes UnifiedCacheManager compatible with existing CacheService interface
 */
export class CacheServiceAdapter implements CacheService {
  private unifiedCache: UnifiedCacheManager;

  constructor(config?: Partial<UnifiedCacheConfig>) {
    this.unifiedCache = UnifiedCacheManager.getInstance(config);
  }

  async set<T>(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    const ttlMs = (options.ttl || 300) * 1000; // Convert seconds to milliseconds
    await this.unifiedCache.set(key, value, {
      l1Ttl: ttlMs,
      l2Ttl: options.ttl || 300
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.unifiedCache.get<T>(key);
    return result.value;
  }

  async delete(key: string): Promise<boolean> {
    return await this.unifiedCache.delete(key);
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    // Convert pattern to tags for more efficient invalidation
    const tag = pattern.replace(/\*/g, '');
    return await this.unifiedCache.invalidateByTags([tag]);
  }

  async has(key: string): Promise<boolean> {
    const result = await this.unifiedCache.get(key);
    return result.hit;
  }

  async clear(): Promise<void> {
    await this.unifiedCache.clear();
  }

  getStats(): {
    totalKeys: number;
    expiredKeys: number;
    memoryUsage: number;
  } {
    const stats = this.unifiedCache.getStats();
    return {
      totalKeys: stats.l1.size,
      expiredKeys: 0, // Not tracked in unified cache
      memoryUsage: stats.l1.memoryUsageMB * 1024 * 1024
    };
  }

  destroy(): void {
    // Unified cache handles its own lifecycle
  }
}

/**
 * Enhanced cache service that provides additional features
 */
export class EnhancedCacheService extends CacheServiceAdapter {
  /**
   * Get or set with automatic cache warming
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      warmCache?: boolean;
    } = {}
  ): Promise<T> {
    return await this.unifiedCache.getOrSet(key, factory, {
      l1Ttl: (options.ttl || 300) * 1000,
      l2Ttl: options.ttl || 300,
      tags: options.tags
    });
  }

  /**
   * Set with tags for better cache invalidation
   */
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    options: { ttl?: number } = {}
  ): Promise<void> {
    const ttlMs = (options.ttl || 300) * 1000;
    await this.unifiedCache.set(key, value, {
      l1Ttl: ttlMs,
      l2Ttl: options.ttl || 300,
      tags
    });
  }

  /**
   * Invalidate by multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    return await this.unifiedCache.invalidateByTags(tags);
  }

  /**
   * Get comprehensive cache statistics
   */
  getDetailedStats() {
    return this.unifiedCache.getStats();
  }

  /**
   * Warm cache with related data
   */
  async warmCache(keys: string[]): Promise<void> {
    // This would typically pre-load related data
    // Implementation depends on your specific use case
    for (const key of keys.slice(0, 10)) { // Limit to prevent overwhelming
      try {
        await this.unifiedCache.get(key);
      } catch (error) {
        // Warming is best-effort, continue on errors
        continue;
      }
    }
  }
}

/**
 * Factory for creating cache instances based on environment
 */
export class CacheFactory {
  private static instances = new Map<string, CacheService>();

  /**
   * Get cache instance for specific use case
   */
  static getInstance(
    type: 'default' | 'enhanced' | 'legacy' = 'enhanced',
    config?: Partial<UnifiedCacheConfig>
  ): CacheService {
    const key = `${type}_${JSON.stringify(config || {})}`;
    
    if (!this.instances.has(key)) {
      let instance: CacheService;
      
      switch (type) {
        case 'enhanced':
          instance = new EnhancedCacheService(config);
          break;
        case 'legacy':
          instance = new CacheService(); // Original implementation
          break;
        default:
          instance = new CacheServiceAdapter(config);
      }
      
      this.instances.set(key, instance);
    }
    
    return this.instances.get(key)!;
  }

  /**
   * Create cache instance optimized for specific domain
   */
  static createDomainCache(domain: string, config?: Partial<UnifiedCacheConfig>): EnhancedCacheService {
    const domainConfig: Partial<UnifiedCacheConfig> = {
      l2KeyPrefix: `${domain}:`,
      ...config
    };

    // Domain-specific optimizations
    switch (domain) {
      case 'property':
        domainConfig.l1MaxItems = 5000; // Properties are frequently accessed
        domainConfig.l1DefaultTtl = 10 * 60 * 1000; // 10 minutes
        domainConfig.l2DefaultTtl = 3600; // 1 hour
        break;
        
      case 'user':
        domainConfig.l1MaxItems = 2000; // User data is smaller but important
        domainConfig.l1DefaultTtl = 15 * 60 * 1000; // 15 minutes
        domainConfig.l2DefaultTtl = 7200; // 2 hours
        break;
        
      case 'fraud':
        domainConfig.l1MaxItems = 1000; // Fraud data is critical but less frequent
        domainConfig.l1DefaultTtl = 5 * 60 * 1000; // 5 minutes
        domainConfig.l2DefaultTtl = 1800; // 30 minutes
        domainConfig.enablePreFetching = false; // Don't pre-fetch fraud data
        break;
        
      case 'analytics':
        domainConfig.l1MaxItems = 500; // Analytics can be computed on demand
        domainConfig.l1DefaultTtl = 30 * 60 * 1000; // 30 minutes
        domainConfig.l2DefaultTtl = 10800; // 3 hours
        break;
        
      default:
        // Use defaults
        break;
    }

    return new EnhancedCacheService(domainConfig);
  }

  /**
   * Clear all cache instances (for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

// Export commonly used instances
export const defaultCache = CacheFactory.getInstance('enhanced');
export const propertyCache = CacheFactory.createDomainCache('property');
export const userCache = CacheFactory.createDomainCache('user');
export const fraudCache = CacheFactory.createDomainCache('fraud');
export const analyticsCache = CacheFactory.createDomainCache('analytics');

// Backward compatibility export
export const cacheService = defaultCache;