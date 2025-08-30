import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RequestDeduplicator } from '../RequestDeduplicator';
import { CacheService } from "../infrastructure/cache"

// Mock CacheService
vi.mock('../../cache/CacheService');

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    // Clear singleton instance
    (RequestDeduplicator as any).instance = undefined;
    
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      invalidateByPattern: vi.fn(),
      invalidateByTags: vi.fn(),
      clear: vi.fn()
    } as any;

    deduplicator = RequestDeduplicator.getInstance({
      defaultTtl: 1000, // 1 second for testing
      maxPendingTime: 100, // 100ms for testing
      enableRedisBackup: true
    }, mockCache);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('handleIdempotentRequest', () => {
    it('should execute operation and cache result', async () => {
      const operation = vi.fn().mockResolvedValue('test-result');
      const key = 'test-key';

      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('test-result');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        'dedup:test-key',
        'test-result',
        { ttl: 1 }
      );
    });

    it('should return cached result without executing operation', async () => {
      const operation = vi.fn().mockResolvedValue('new-result');
      const key = 'test-key';

      // First call
      await deduplicator.handleIdempotentRequest(key, operation);
      
      // Second call should return cached result
      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('new-result'); // Should be the cached result
      expect(operation).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it('should handle concurrent requests with same key', async () => {
      let resolveOperation: (value: string) => void = () => {};
      const operation = vi.fn().mockImplementation(() => 
        new Promise<string>(resolve => {
          resolveOperation = resolve;
        })
      );
      const key = 'concurrent-key';

      // Start two concurrent requests
      const promise1 = deduplicator.handleIdempotentRequest(key, operation);
      const promise2 = deduplicator.handleIdempotentRequest(key, operation);

      // Small delay to ensure both requests are pending
      await new Promise(resolve => setTimeout(resolve, 10));

      // Resolve the operation
      resolveOperation('concurrent-result');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('concurrent-result');
      expect(result2).toBe('concurrent-result');
      expect(operation).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it('should handle operation failure', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);
      const key = 'failing-key';

      await expect(deduplicator.handleIdempotentRequest(key, operation))
        .rejects.toThrow('Operation failed');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should fall back to Redis cache when memory cache misses', async () => {
      const operation = vi.fn().mockResolvedValue('redis-result');
      const key = 'redis-key';

      mockCache.get.mockResolvedValue('cached-redis-result');

      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('cached-redis-result');
      expect(operation).not.toHaveBeenCalled();
      expect(mockCache.get).toHaveBeenCalledWith('dedup:redis-key');
    });

    it('should handle Redis cache failure gracefully', async () => {
      const operation = vi.fn().mockResolvedValue('fallback-result');
      const key = 'redis-fail-key';

      mockCache.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await deduplicator.handleIdempotentRequest(key, operation);

      expect(result).toBe('fallback-result');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should timeout pending requests', async () => {
      // Use a shorter timeout for testing
      const testDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 1000,
        maxPendingTime: 50, // Very short timeout for testing
        enableRedisBackup: false
      });

      const operation = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          // Resolve after timeout period
          setTimeout(() => resolve('delayed-result'), 100);
        })
      );
      const key = 'timeout-key';

      const promise1 = testDeduplicator.handleIdempotentRequest(key, operation);
      
      // Small delay to ensure first request is pending
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Start second request that should timeout waiting for first
      const promise2 = testDeduplicator.handleIdempotentRequest(key, operation);

      // Both should eventually resolve (second one will execute its own operation)
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe('delayed-result');
      expect(result2).toBe('delayed-result');
      expect(operation).toHaveBeenCalledTimes(2); // Second request should execute its own operation
    }, 10000);
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent keys for same input', () => {
      const key1 = deduplicator.generateIdempotencyKey(123, '/api/test', { data: 'test' });
      const key2 = deduplicator.generateIdempotencyKey(123, '/api/test', { data: 'test' });

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = deduplicator.generateIdempotencyKey(123, '/api/test', { data: 'test1' });
      const key2 = deduplicator.generateIdempotencyKey(123, '/api/test', { data: 'test2' });

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different users', () => {
      const key1 = deduplicator.generateIdempotencyKey(123, '/api/test', { data: 'test' });
      const key2 = deduplicator.generateIdempotencyKey(456, '/api/test', { data: 'test' });

      expect(key1).not.toBe(key2);
    });
  });

  describe('generateRequestHash', () => {
    it('should generate consistent hashes for same request', () => {
      const hash1 = deduplicator.generateRequestHash('GET', '/api/test', { data: 'test' });
      const hash2 = deduplicator.generateRequestHash('GET', '/api/test', { data: 'test' });

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different methods', () => {
      const hash1 = deduplicator.generateRequestHash('GET', '/api/test');
      const hash2 = deduplicator.generateRequestHash('POST', '/api/test');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different URLs', () => {
      const hash1 = deduplicator.generateRequestHash('GET', '/api/test1');
      const hash2 = deduplicator.generateRequestHash('GET', '/api/test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should ignore irrelevant headers', () => {
      const headers1 = { 'user-agent': 'test', 'content-type': 'application/json' };
      const headers2 = { 'user-agent': 'different', 'content-type': 'application/json' };

      const hash1 = deduplicator.generateRequestHash('GET', '/api/test', {}, headers1);
      const hash2 = deduplicator.generateRequestHash('GET', '/api/test', {}, headers2);

      expect(hash1).toBe(hash2); // Should be same because user-agent is ignored
    });
  });

  describe('shouldDeduplicate', () => {
    it('should deduplicate GET requests', () => {
      expect(deduplicator.shouldDeduplicate('GET', '/api/test')).toBe(true);
    });

    it('should deduplicate HEAD requests', () => {
      expect(deduplicator.shouldDeduplicate('HEAD', '/api/test')).toBe(true);
    });

    it('should deduplicate OPTIONS requests', () => {
      expect(deduplicator.shouldDeduplicate('OPTIONS', '/api/test')).toBe(true);
    });

    it('should deduplicate PUT requests for idempotent endpoints', () => {
      expect(deduplicator.shouldDeduplicate('PUT', '/api/users/123')).toBe(true);
    });

    it('should not deduplicate PUT requests for non-idempotent endpoints', () => {
      expect(deduplicator.shouldDeduplicate('PUT', '/api/random/endpoint')).toBe(false);
    });

    it('should deduplicate specific POST endpoints', () => {
      expect(deduplicator.shouldDeduplicate('POST', '/api/analytics/events')).toBe(true);
      expect(deduplicator.shouldDeduplicate('POST', '/api/professionals/search')).toBe(true);
    });

    it('should not deduplicate general POST endpoints', () => {
      expect(deduplicator.shouldDeduplicate('POST', '/api/users')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache key', async () => {
      const operation = vi.fn().mockResolvedValue('test-result');
      const key = 'clear-test-key';

      // Cache a result
      await deduplicator.handleIdempotentRequest(key, operation);

      // Clear the cache
      await deduplicator.clearCache(key);

      // Next request should execute operation again
      await deduplicator.handleIdempotentRequest(key, operation);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockCache.delete).toHaveBeenCalledWith('dedup:clear-test-key');
    });

    it('should clear cache by pattern', async () => {
      await deduplicator.clearCache('pattern*');

      expect(mockCache.invalidateByPattern).toHaveBeenCalledWith('dedup:pattern*');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const operation = vi.fn().mockResolvedValue('test-result');
      
      // Add some cached results
      await deduplicator.handleIdempotentRequest('key1', operation);
      await deduplicator.handleIdempotentRequest('key2', operation);

      const stats = deduplicator.getStats();

      expect(stats.pendingRequests).toBe(0);
      expect(stats.completedRequests).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired requests', async () => {
      vi.useFakeTimers();

      const operation = vi.fn().mockResolvedValue('test-result');
      
      // Cache a result
      await deduplicator.handleIdempotentRequest('expire-key', operation);

      expect(deduplicator.getStats().completedRequests).toBe(1);

      // Fast-forward time beyond TTL
      vi.advanceTimersByTime(2000); // More than 1 second TTL

      // Trigger cleanup (normally happens every minute)
      vi.advanceTimersByTime(60000);

      expect(deduplicator.getStats().completedRequests).toBe(0);

      vi.useRealTimers();
    });
  });
});