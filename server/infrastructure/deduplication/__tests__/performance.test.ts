import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RequestDeduplicator } from '../RequestDeduplicator';
import { cachePerformanceMonitor } from '../../monitoring/CachePerformanceMonitor';

describe('Request Deduplication Performance Tests', () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    // Clear singleton instance for clean tests
    (RequestDeduplicator as any).instance = undefined;
    deduplicator = RequestDeduplicator.getInstance({
      defaultTtl: 5000,
      maxPendingTime: 1000,
      enableRedisBackup: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('High Concurrency Performance', () => {
    it('should handle 100 concurrent identical requests efficiently', async () => {
      let operationCallCount = 0;
      const operation = vi.fn().mockImplementation(async () => {
        operationCallCount++;
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        return `result-${operationCallCount}`;
      });

      const key = 'high-concurrency-test';
      const concurrentRequests = 100;

      const startTime = Date.now();

      // Create 100 concurrent identical requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        deduplicator.handleIdempotentRequest(key, operation)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All results should be identical
      expect(results.every(result => result === results[0])).toBe(true);
      
      // Operation should only be called once due to deduplication
      expect(operationCallCount).toBe(1);
      
      // Should complete reasonably quickly (less than 1 second for 100 requests)
      expect(totalTime).toBeLessThan(1000);
      
      console.log(`100 concurrent requests completed in ${totalTime}ms with ${operationCallCount} actual operations`);
    });

    it('should handle mixed concurrent requests with different keys', async () => {
      let operationCallCount = 0;
      const operation = vi.fn().mockImplementation(async (keyId: string) => {
        operationCallCount++;
        await new Promise(resolve => setTimeout(resolve, 5));
        return `result-${keyId}-${operationCallCount}`;
      });

      const numberOfKeys = 10;
      const requestsPerKey = 10;
      const totalRequests = numberOfKeys * requestsPerKey;

      const startTime = Date.now();

      // Create requests with different keys
      const promises: Promise<string>[] = [];
      for (let keyId = 0; keyId < numberOfKeys; keyId++) {
        for (let requestId = 0; requestId < requestsPerKey; requestId++) {
          promises.push(
            deduplicator.handleIdempotentRequest(
              `key-${keyId}`,
              () => operation(`${keyId}`)
            )
          );
        }
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have exactly numberOfKeys unique results
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(numberOfKeys);
      
      // Operation should be called once per unique key
      expect(operationCallCount).toBe(numberOfKeys);
      
      // Should complete efficiently
      expect(totalTime).toBeLessThan(2000);
      
      console.log(`${totalRequests} mixed requests (${numberOfKeys} unique keys) completed in ${totalTime}ms with ${operationCallCount} actual operations`);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage under load', async () => {
      const operation = vi.fn().mockImplementation(async (id: number) => {
        // Return a reasonably sized object
        return {
          id,
          data: 'x'.repeat(1000), // 1KB of data
          timestamp: Date.now(),
          metadata: { processed: true, version: 1 }
        };
      });

      const numberOfRequests = 1000;
      const initialStats = deduplicator.getStats();

      // Create many requests with unique keys
      const promises = Array.from({ length: numberOfRequests }, (_, i) =>
        deduplicator.handleIdempotentRequest(`memory-test-${i}`, () => operation(i))
      );

      await Promise.all(promises);

      const finalStats = deduplicator.getStats();
      const memoryIncrease = finalStats.memoryUsage - initialStats.memoryUsage;

      // Memory usage should be reasonable (less than 10MB for 1000 1KB objects)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      // Should have cached all requests
      expect(finalStats.completedRequests).toBeGreaterThanOrEqual(numberOfRequests);
      
      console.log(`Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB for ${numberOfRequests} cached requests`);
    });

    it('should clean up expired entries to prevent memory leaks', async () => {
      // Create deduplicator with very short TTL
      (RequestDeduplicator as any).instance = undefined;
      const shortTtlDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 100, // 100ms TTL
        maxPendingTime: 1000,
        enableRedisBackup: false
      });

      const operation = vi.fn().mockImplementation(async (id: number) => {
        return { id, data: 'x'.repeat(1000) };
      });

      // Create many requests
      const numberOfRequests = 100;
      const promises = Array.from({ length: numberOfRequests }, (_, i) =>
        shortTtlDeduplicator.handleIdempotentRequest(`cleanup-test-${i}`, () => operation(i), 100)
      );

      await Promise.all(promises);

      const statsAfterRequests = shortTtlDeduplicator.getStats();
      expect(statsAfterRequests.completedRequests).toBe(numberOfRequests);

      // Wait for TTL to expire and cleanup to occur
      await new Promise(resolve => setTimeout(resolve, 200));

      // Trigger cleanup by making a new request
      await shortTtlDeduplicator.handleIdempotentRequest('trigger-cleanup', () => operation(999));

      // Memory should be cleaned up (some entries should be removed)
      const statsAfterCleanup = shortTtlDeduplicator.getStats();
      expect(statsAfterCleanup.memoryUsage).toBeLessThan(statsAfterRequests.memoryUsage);
      
      console.log(`Memory usage reduced from ${(statsAfterRequests.memoryUsage / 1024).toFixed(2)}KB to ${(statsAfterCleanup.memoryUsage / 1024).toFixed(2)}KB after cleanup`);
    });
  });

  describe('Response Time Performance', () => {
    it('should provide fast cache hits', async () => {
      const operation = vi.fn().mockImplementation(async () => {
        // Simulate slow operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow-operation-result';
      });

      const key = 'response-time-test';

      // First request (cache miss)
      const startTime1 = Date.now();
      const result1 = await deduplicator.handleIdempotentRequest(key, operation);
      const endTime1 = Date.now();
      const firstRequestTime = endTime1 - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      const result2 = await deduplicator.handleIdempotentRequest(key, operation);
      const endTime2 = Date.now();
      const secondRequestTime = endTime2 - startTime2;

      expect(result1).toBe(result2);
      expect(operation).toHaveBeenCalledTimes(1);

      // Cache hit should be significantly faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime / 10);
      expect(secondRequestTime).toBeLessThan(10); // Should be under 10ms

      console.log(`First request (miss): ${firstRequestTime}ms, Second request (hit): ${secondRequestTime}ms`);
    });

    it('should handle burst traffic efficiently', async () => {
      const operation = vi.fn().mockImplementation(async (batchId: string) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return `batch-${batchId}-result`;
      });

      const batchSize = 50;
      const numberOfBatches = 5;
      const results: number[] = [];

      // Simulate burst traffic in batches
      for (let batch = 0; batch < numberOfBatches; batch++) {
        const startTime = Date.now();
        
        const promises = Array.from({ length: batchSize }, () =>
          deduplicator.handleIdempotentRequest(`burst-test-${batch}`, () => operation(`${batch}`))
        );

        await Promise.all(promises);
        const endTime = Date.now();
        const batchTime = endTime - startTime;
        results.push(batchTime);

        console.log(`Batch ${batch + 1}: ${batchSize} requests in ${batchTime}ms`);
      }

      // Each batch should complete reasonably quickly
      results.forEach(time => {
        expect(time).toBeLessThan(500); // Less than 500ms per batch
      });

      // Operation should only be called once per batch
      expect(operation).toHaveBeenCalledTimes(numberOfBatches);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without affecting performance', async () => {
      let successCount = 0;
      let errorCount = 0;

      const operation = vi.fn().mockImplementation(async (shouldFail: boolean) => {
        if (shouldFail) {
          errorCount++;
          throw new Error('Simulated error');
        } else {
          successCount++;
          return 'success-result';
        }
      });

      const numberOfRequests = 100;
      const promises: Promise<any>[] = [];

      // Mix of successful and failing requests
      for (let i = 0; i < numberOfRequests; i++) {
        const shouldFail = i % 3 === 0; // Every 3rd request fails
        const key = `error-test-${shouldFail ? 'fail' : 'success'}-${Math.floor(i / 10)}`;
        
        promises.push(
          deduplicator.handleIdempotentRequest(key, () => operation(shouldFail))
            .catch(error => ({ error: error.message }))
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successResults = results.filter(r => !r.error);
      const errorResults = results.filter(r => r.error);

      expect(successResults.length).toBeGreaterThan(0);
      expect(errorResults.length).toBeGreaterThan(0);
      
      // Should complete efficiently even with errors
      expect(totalTime).toBeLessThan(1000);
      
      console.log(`${numberOfRequests} mixed requests (${successResults.length} success, ${errorResults.length} errors) completed in ${totalTime}ms`);
    });
  });

  describe('Monitoring Integration Performance', () => {
    it('should track performance metrics without significant overhead', async () => {
      const operation = vi.fn().mockImplementation(async (id: number) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return `monitored-result-${id}`;
      });

      const numberOfRequests = 200;
      
      // Test with monitoring
      const startTimeWithMonitoring = Date.now();
      const promises = Array.from({ length: numberOfRequests }, (_, i) =>
        deduplicator.handleIdempotentRequest(`monitoring-test-${i % 20}`, () => operation(i))
      );
      
      await Promise.all(promises);
      const endTimeWithMonitoring = Date.now();
      const timeWithMonitoring = endTimeWithMonitoring - startTimeWithMonitoring;

      // Monitoring should not add significant overhead
      expect(timeWithMonitoring).toBeLessThan(2000);
      
      // Should have deduplication savings due to repeated keys
      expect(operation).toHaveBeenCalledTimes(20); // Only 20 unique keys
      
      console.log(`${numberOfRequests} requests with monitoring completed in ${timeWithMonitoring}ms with ${operation.mock.calls.length} actual operations`);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain stability under extreme load', async () => {
      const operation = vi.fn().mockImplementation(async (id: number) => {
        // Very fast operation
        return `stress-result-${id}`;
      });

      const extremeLoad = 1000;
      const uniqueKeys = 100;
      
      const startTime = Date.now();
      
      // Create extreme load with limited unique keys for maximum deduplication
      const promises = Array.from({ length: extremeLoad }, (_, i) =>
        deduplicator.handleIdempotentRequest(
          `stress-test-${i % uniqueKeys}`,
          () => operation(i % uniqueKeys)
        )
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete successfully
      expect(results.length).toBe(extremeLoad);
      
      // Should have massive deduplication savings
      expect(operation).toHaveBeenCalledTimes(uniqueKeys);
      
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(5000);
      
      const stats = deduplicator.getStats();
      expect(stats.completedRequests).toBeGreaterThanOrEqual(uniqueKeys);
      
      console.log(`Stress test: ${extremeLoad} requests (${uniqueKeys} unique) completed in ${totalTime}ms`);
      console.log(`Deduplication ratio: ${((extremeLoad - uniqueKeys) / extremeLoad * 100).toFixed(1)}%`);
    });
  });
});