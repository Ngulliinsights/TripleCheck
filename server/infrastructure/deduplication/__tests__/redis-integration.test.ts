import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RequestDeduplicator } from '../RequestDeduplicator';
import { CacheService } from '../../../../core/src/cache'

// Mock Redis-like cache service for testing
class MockRedisCacheService extends CacheService {
  private redisData = new Map<string, { value: any; expiresAt: number }>();
  private connectionFailure = false;

  constructor() {
    super();
  }

  // Simulate Redis connection failure
  simulateConnectionFailure(shouldFail: boolean) {
    this.connectionFailure = shouldFail;
  }

  async set(key: string, value: any, options: { ttl?: number } = {}): Promise<void> {
    if (this.connectionFailure) {
      throw new Error('Redis connection failed');
    }
    
    const ttlSeconds = options.ttl || 300;
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.redisData.set(key, { value, expiresAt });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.connectionFailure) {
      throw new Error('Redis connection failed');
    }

    const entry = this.redisData.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.redisData.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async delete(key: string): Promise<boolean> {
    if (this.connectionFailure) {
      throw new Error('Redis connection failed');
    }
    
    return this.redisData.delete(key);
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    if (this.connectionFailure) {
      throw new Error('Redis connection failed');
    }

    let deletedCount = 0;
    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escapedPattern}$`);

    for (const key of this.redisData.keys()) {
      if (regex.test(key)) {
        this.redisData.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Test helper methods
  getRedisSize(): number {
    return this.redisData.size;
  }

  clearRedis(): void {
    this.redisData.clear();
  }
}

describe('Redis Integration Tests', () => {
  let deduplicator: RequestDeduplicator;
  let mockRedisCache: MockRedisCacheService;

  beforeEach(() => {
    // Clear singleton instance
    (RequestDeduplicator as any).instance = undefined;
    
    mockRedisCache = new MockRedisCacheService();
    deduplicator = RequestDeduplicator.getInstance({
      defaultTtl: 5000,
      maxPendingTime: 1000,
      enableRedisBackup: true,
      keyPrefix: 'test-dedup:'
    }, mockRedisCache);
  });

  afterEach(() => {
    mockRedisCache.clearRedis();
    vi.clearAllMocks();
  });

  describe('Redis Backup Functionality', () => {
    it('should store results in Redis after execution', async () => {
      const operation = vi.fn().mockResolvedValue('redis-test-result');
      const key = 'redis-backup-test';

      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('redis-test-result');
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Should be stored in Redis
      expect(mockRedisCache.getRedisSize()).toBe(1);
      
      // Verify Redis contains the result
      const redisResult = await mockRedisCache.get('test-dedup:redis-backup-test');
      expect(redisResult).toBe('redis-test-result');
    });

    it('should retrieve results from Redis when memory cache is empty', async () => {
      const operation = vi.fn().mockResolvedValue('redis-retrieval-test');
      const key = 'redis-retrieval-test';

      // First request - should execute and cache
      await deduplicator.handleIdempotentRequest(key, operation);
      expect(operation).toHaveBeenCalledTimes(1);

      // Create new deduplicator instance (simulates server restart)
      (RequestDeduplicator as any).instance = undefined;
      const newDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 5000,
        maxPendingTime: 1000,
        enableRedisBackup: true,
        keyPrefix: 'test-dedup:'
      }, mockRedisCache);

      // Second request with new instance - should retrieve from Redis
      const result = await newDeduplicator.handleIdempotentRequest(key, operation);
      
      expect(result).toBe('redis-retrieval-test');
      expect(operation).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should fall back to operation execution when Redis fails', async () => {
      const operation = vi.fn().mockResolvedValue('fallback-test-result');
      const key = 'redis-fallback-test';

      // Simulate Redis connection failure
      mockRedisCache.simulateConnectionFailure(true);

      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('fallback-test-result');
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Should still work despite Redis failure
      expect(mockRedisCache.getRedisSize()).toBe(0);
    });

    it('should handle Redis failures gracefully during storage', async () => {
      const operation = vi.fn().mockResolvedValue('storage-failure-test');
      const key = 'redis-storage-failure-test';

      // First request succeeds
      const result1 = await deduplicator.handleIdempotentRequest(key, operation);
      expect(result1).toBe('storage-failure-test');

      // Simulate Redis failure for storage
      mockRedisCache.simulateConnectionFailure(true);

      // Second request should still work (from memory cache)
      const result2 = await deduplicator.handleIdempotentRequest(key, operation);
      expect(result2).toBe('storage-failure-test');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redis TTL and Expiration', () => {
    it('should respect TTL in Redis storage', async () => {
      const operation = vi.fn().mockResolvedValue('ttl-test-result');
      const key = 'redis-ttl-test';
      const shortTtl = 100; // 100ms

      await deduplicator.handleIdempotentRequest(key, operation, shortTtl);
      
      // Should be in Redis
      expect(await mockRedisCache.get('test-dedup:redis-ttl-test')).toBe('ttl-test-result');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired in Redis
      expect(await mockRedisCache.get('test-dedup:redis-ttl-test')).toBeNull();
    });

    it('should handle Redis expiration correctly', async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce('first-result')
        .mockResolvedValueOnce('second-result');
      
      const key = 'redis-expiration-test';
      const shortTtl = 100;

      // First request
      const result1 = await deduplicator.handleIdempotentRequest(key, operation, shortTtl);
      expect(result1).toBe('first-result');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Create new deduplicator instance to clear memory cache
      (RequestDeduplicator as any).instance = undefined;
      const newDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 5000,
        maxPendingTime: 1000,
        enableRedisBackup: true,
        keyPrefix: 'test-dedup:'
      }, mockRedisCache);

      // Second request after expiration
      const result2 = await newDeduplicator.handleIdempotentRequest(key, operation, shortTtl);
      expect(result2).toBe('second-result');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Redis Pattern Invalidation', () => {
    it('should clear Redis cache by pattern', async () => {
      const operation = vi.fn().mockImplementation((id: string) => 
        Promise.resolve(`result-${id}`)
      );

      // Create multiple cached entries
      await Promise.all([
        deduplicator.handleIdempotentRequest('user-123-profile', () => operation('123-profile')),
        deduplicator.handleIdempotentRequest('user-123-settings', () => operation('123-settings')),
        deduplicator.handleIdempotentRequest('user-456-profile', () => operation('456-profile')),
        deduplicator.handleIdempotentRequest('other-data', () => operation('other'))
      ]);

      expect(mockRedisCache.getRedisSize()).toBe(4);

      // Clear user-123 related cache
      await deduplicator.clearCache('user-123-*');

      // Should have cleared 2 entries
      expect(mockRedisCache.getRedisSize()).toBe(2);

      // Verify specific entries are cleared
      expect(await mockRedisCache.get('test-dedup:user-123-profile')).toBeNull();
      expect(await mockRedisCache.get('test-dedup:user-123-settings')).toBeNull();
      
      // Other entries should remain
      expect(await mockRedisCache.get('test-dedup:user-456-profile')).toBe('result-456-profile');
      expect(await mockRedisCache.get('test-dedup:other-data')).toBe('result-other');
    });

    it('should handle Redis pattern invalidation failures', async () => {
      const operation = vi.fn().mockResolvedValue('pattern-failure-test');
      
      await deduplicator.handleIdempotentRequest('pattern-test', operation);
      
      // Simulate Redis failure during pattern invalidation
      mockRedisCache.simulateConnectionFailure(true);
      
      // Should not throw error
      await expect(deduplicator.clearCache('pattern-*')).resolves.not.toThrow();
    });
  });

  describe('Redis Performance', () => {
    it('should handle high volume Redis operations efficiently', async () => {
      const operation = vi.fn().mockImplementation((id: number) => 
        Promise.resolve(`redis-perf-${id}`)
      );

      const numberOfOperations = 100;
      const startTime = Date.now();

      // Create many operations that will be stored in Redis
      const promises = Array.from({ length: numberOfOperations }, (_, i) =>
        deduplicator.handleIdempotentRequest(`redis-perf-${i}`, () => operation(i))
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(operation).toHaveBeenCalledTimes(numberOfOperations);
      expect(mockRedisCache.getRedisSize()).toBe(numberOfOperations);
      
      // Should complete efficiently
      expect(totalTime).toBeLessThan(2000);
      
      console.log(`${numberOfOperations} Redis operations completed in ${totalTime}ms`);
    });

    it('should maintain performance when Redis is slow', async () => {
      // Create a slow Redis mock
      class SlowRedisCacheService extends MockRedisCacheService {
        async set(key: string, value: any, options: { ttl?: number } = {}): Promise<void> {
          // Simulate slow Redis
          await new Promise(resolve => setTimeout(resolve, 10));
          return super.set(key, value, options);
        }

        async get<T>(key: string): Promise<T | null> {
          // Simulate slow Redis
          await new Promise(resolve => setTimeout(resolve, 10));
          return super.get(key);
        }
      }

      const slowRedis = new SlowRedisCacheService();
      
      (RequestDeduplicator as any).instance = undefined;
      const slowRedisDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 5000,
        maxPendingTime: 1000,
        enableRedisBackup: true,
        keyPrefix: 'test-dedup:'
      }, slowRedis);

      const operation = vi.fn().mockResolvedValue('slow-redis-test');
      const key = 'slow-redis-test';

      const startTime = Date.now();
      
      // First request (will be slow due to Redis)
      const result1 = await slowRedisDeduplicator.handleIdempotentRequest(key, operation);
      
      // Second request (should be fast from memory cache)
      const result2 = await slowRedisDeduplicator.handleIdempotentRequest(key, operation);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result1).toBe('slow-redis-test');
      expect(result2).toBe('slow-redis-test');
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Should still be reasonably fast due to memory caching
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Redis Configuration', () => {
    it('should work with Redis disabled', async () => {
      (RequestDeduplicator as any).instance = undefined;
      const noRedisDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 5000,
        maxPendingTime: 1000,
        enableRedisBackup: false // Disable Redis
      });

      const operation = vi.fn().mockResolvedValue('no-redis-test');
      const key = 'no-redis-test';

      const result = await noRedisDeduplicator.handleIdempotentRequest(key, operation);
      
      expect(result).toBe('no-redis-test');
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Redis should not be used
      expect(mockRedisCache.getRedisSize()).toBe(0);
    });

    it('should handle Redis configuration changes', async () => {
      const operation = vi.fn().mockResolvedValue('config-change-test');
      const key = 'config-change-test';

      // First with Redis enabled
      await deduplicator.handleIdempotentRequest(key, operation);
      expect(mockRedisCache.getRedisSize()).toBe(1);

      // Create new instance with Redis disabled
      (RequestDeduplicator as any).instance = undefined;
      const noRedisDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 5000,
        maxPendingTime: 1000,
        enableRedisBackup: false
      });

      // Should still work without Redis
      const result = await noRedisDeduplicator.handleIdempotentRequest(key, operation);
      expect(result).toBe('config-change-test');
      expect(operation).toHaveBeenCalledTimes(2); // Called again since no Redis lookup
    });
  });
});