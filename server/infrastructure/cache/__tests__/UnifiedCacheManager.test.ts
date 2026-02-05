/**
 * Comprehensive test suite for UnifiedCacheManager
 * 
 * Tests L1/L2 cache architecture, performance, and reliability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnifiedCacheManager, UnifiedCacheConfig } from '../UnifiedCacheManager';

// Mock Redis
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      scanStream: vi.fn(),
      on: vi.fn(),
      quit: vi.fn()
    }))
  };
});

describe('UnifiedCacheManager', () => {
  let cacheManager: UnifiedCacheManager;
  let testConfig: Partial<UnifiedCacheConfig>;

  beforeEach(() => {
    testConfig = {
      l1MaxItems: 100,
      l1DefaultTtl: 5000, // 5 seconds
      l1MaxMemoryMB: 1,
      l2DefaultTtl: 10, // 10 seconds
      enablePreFetching: false,
      enableMetrics: false,
      redisUrl: undefined // Disable Redis for most tests
    };
    
    cacheManager = new UnifiedCacheManager(testConfig);
  });

  afterEach(async () => {
    await cacheManager.destroy();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values from L1 cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cacheManager.set(key, value);
      const result = await cacheManager.get(key);

      expect(result.hit).toBe(true);
      expect(result.source).toBe('l1');
      expect(result.value).toEqual(value);
    });

    it('should handle cache misses correctly', async () => {
      const result = await cacheManager.get('non-existent-key');

      expect(result.hit).toBe(false);
      expect(result.source).toBe('miss');
      expect(result.value).toBeNull();
    });

    it('should delete values from cache', async () => {
      const key = 'delete-test';
      const value = 'test-value';

      await cacheManager.set(key, value);
      const deleted = await cacheManager.delete(key);
      const result = await cacheManager.get(key);

      expect(deleted).toBe(true);
      expect(result.hit).toBe(false);
    });

    it('should clear all cache entries', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      
      await cacheManager.clear();
      
      const result1 = await cacheManager.get('key1');
      const result2 = await cacheManager.get('key2');
      
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expire-test';
      const value = 'test-value';

      await cacheManager.set(key, value, { l1Ttl: 100 }); // 100ms TTL
      
      // Should be available immediately
      let result = await cacheManager.get(key);
      expect(result.hit).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      result = await cacheManager.get(key);
      expect(result.hit).toBe(false);
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate entries by tags', async () => {
      await cacheManager.set('key1', 'value1', { tags: ['tag1', 'tag2'] });
      await cacheManager.set('key2', 'value2', { tags: ['tag2', 'tag3'] });
      await cacheManager.set('key3', 'value3', { tags: ['tag3'] });

      const invalidated = await cacheManager.invalidateByTags(['tag2']);

      const result1 = await cacheManager.get('key1');
      const result2 = await cacheManager.get('key2');
      const result3 = await cacheManager.get('key3');

      expect(result1.hit).toBe(false); // Should be invalidated (has tag2)
      expect(result2.hit).toBe(false); // Should be invalidated (has tag2)
      expect(result3.hit).toBe(true);  // Should remain (no tag2)
      expect(invalidated).toBeGreaterThan(0);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when at capacity', async () => {
      const smallConfig = { ...testConfig, l1MaxItems: 3 };
      const smallCache = new UnifiedCacheManager(smallConfig);

      // Fill cache to capacity
      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');

      // Access key1 to make it recently used
      await smallCache.get('key1');

      // Add new entry, should evict key2 (least recently used)
      await smallCache.set('key4', 'value4');

      const result1 = await smallCache.get('key1');
      const result2 = await smallCache.get('key2');
      const result3 = await smallCache.get('key3');
      const result4 = await smallCache.get('key4');

      expect(result1.hit).toBe(true);  // Recently accessed, should remain
      expect(result2.hit).toBe(false); // Should be evicted
      expect(result3.hit).toBe(true);  // Should remain
      expect(result4.hit).toBe(true);  // Newly added

      await smallCache.destroy();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage accurately', async () => {
      const stats = cacheManager.getStats();
      const initialMemory = stats.l1.memoryUsageMB;

      // Add some data
      await cacheManager.set('large-key', 'x'.repeat(1000));
      
      const newStats = cacheManager.getStats();
      expect(newStats.l1.memoryUsageMB).toBeGreaterThan(initialMemory);
    });

    it('should evict entries when memory limit is reached', async () => {
      const memoryLimitedConfig = { 
        ...testConfig, 
        l1MaxMemoryMB: 0.001, // Very small limit
        l1MaxItems: 1000 // High item limit
      };
      const memoryCache = new UnifiedCacheManager(memoryLimitedConfig);

      // Add entries until memory limit is hit
      for (let i = 0; i < 10; i++) {
        await memoryCache.set(`key${i}`, 'x'.repeat(100));
      }

      const stats = memoryCache.getStats();
      expect(stats.l1.size).toBeLessThan(10); // Some should be evicted
      expect(stats.l1.evictions).toBeGreaterThan(0);

      await memoryCache.destroy();
    });
  });

  describe('Cache-aside Pattern with Stampede Protection', () => {
    it('should handle getOrSet operations correctly', async () => {
      const key = 'factory-test';
      let factoryCalls = 0;
      
      const factory = async () => {
        factoryCalls++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return `generated-value-${factoryCalls}`;
      };

      const result1 = await cacheManager.getOrSet(key, factory);
      const result2 = await cacheManager.getOrSet(key, factory);

      expect(result1).toBe('generated-value-1');
      expect(result2).toBe('generated-value-1'); // Should use cached value
      expect(factoryCalls).toBe(1); // Factory should only be called once
    });

    it('should prevent cache stampede with concurrent requests', async () => {
      const key = 'stampede-test';
      let factoryCalls = 0;
      
      const factory = async () => {
        factoryCalls++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return `generated-value-${factoryCalls}`;
      };

      // Make multiple concurrent requests
      const promises = Array(5).fill(0).map(() => 
        cacheManager.getOrSet(key, factory)
      );

      const results = await Promise.all(promises);

      // All results should be the same
      expect(results.every(r => r === results[0])).toBe(true);
      // Factory should only be called once despite concurrent requests
      expect(factoryCalls).toBe(1);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track cache statistics correctly', async () => {
      // Perform some cache operations
      await cacheManager.set('key1', 'value1');
      await cacheManager.get('key1'); // Hit
      await cacheManager.get('key2'); // Miss

      const stats = cacheManager.getStats();

      expect(stats.l1.size).toBe(1);
      expect(stats.overall.totalRequests).toBeGreaterThan(0);
      expect(stats.overall.hitRate).toBeGreaterThan(0);
      expect(stats.overall.hitRate).toBeLessThanOrEqual(1);
    });

    it('should calculate hit rates correctly', async () => {
      // Create predictable hit/miss pattern
      await cacheManager.set('hit-key', 'value');
      
      await cacheManager.get('hit-key');   // Hit
      await cacheManager.get('miss-key1'); // Miss
      await cacheManager.get('miss-key2'); // Miss

      const stats = cacheManager.getStats();
      
      // Should have 1 hit out of 3 total requests = 33.33% hit rate
      expect(stats.overall.hitRate).toBeCloseTo(0.33, 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle factory errors gracefully in getOrSet', async () => {
      const key = 'error-test';
      const factory = async () => {
        throw new Error('Factory error');
      };

      await expect(cacheManager.getOrSet(key, factory)).rejects.toThrow('Factory error');
      
      // Cache should not contain the failed result
      const result = await cacheManager.get(key);
      expect(result.hit).toBe(false);
    });

    it('should handle invalid keys gracefully', async () => {
      // Test with various invalid key formats
      const invalidKeys = ['', null, undefined, 'key with spaces', 'key/with/slashes'];
      
      for (const key of invalidKeys) {
        if (key === null || key === undefined) continue;
        
        // Should not throw errors
        await expect(cacheManager.set(key as string, 'value')).resolves.not.toThrow();
        await expect(cacheManager.get(key as string)).resolves.not.toThrow();
      }
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency operations efficiently', async () => {
      const startTime = Date.now();
      const operations = 1000;

      // Perform many cache operations
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(cacheManager.set(`perf-key-${i}`, `value-${i}`));
      }
      await Promise.all(promises);

      // Read operations
      const readPromises = [];
      for (let i = 0; i < operations; i++) {
        readPromises.push(cacheManager.get(`perf-key-${i}`));
      }
      const results = await Promise.all(readPromises);

      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 2000 operations
      
      // All reads should be hits
      expect(results.every(r => r.hit)).toBe(true);
    });

    it('should maintain performance under memory pressure', async () => {
      const config = { 
        ...testConfig, 
        l1MaxItems: 100,
        l1MaxMemoryMB: 0.1 // Small memory limit
      };
      const pressureCache = new UnifiedCacheManager(config);

      const startTime = Date.now();
      
      // Add many entries to trigger evictions
      for (let i = 0; i < 500; i++) {
        await pressureCache.set(`pressure-key-${i}`, `value-${i}`);
      }

      const duration = Date.now() - startTime;
      const stats = pressureCache.getStats();

      // Should handle memory pressure gracefully
      expect(duration).toBeLessThan(2000); // Should not be too slow
      expect(stats.l1.size).toBeLessThanOrEqual(config.l1MaxItems);
      expect(stats.l1.evictions).toBeGreaterThan(0);

      await pressureCache.destroy();
    });
  });
});

describe('CacheIntegrationAdapter', () => {
  // Add tests for the integration adapter
  it('should provide backward compatibility with CacheService interface', async () => {
    // This would test the adapter functionality
    // Implementation depends on your specific requirements
  });
});

describe('CacheWarmingStrategy', () => {
  // Add tests for cache warming
  it('should warm cache based on access patterns', async () => {
    // This would test the warming strategy
    // Implementation depends on your specific requirements
  });
});