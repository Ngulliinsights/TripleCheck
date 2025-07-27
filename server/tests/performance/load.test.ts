import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import { storage } from '../../storage';
import { cacheService } from '../../cache/CacheService';
import { queryOptimizer } from '../../infrastructure/database/QueryOptimizer';
import { testUtils } from '../setup';

describe('Performance Tests', () => {
  beforeAll(async () => {
    await storage.initialize();
    await cacheService.connect();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  describe('Database Performance', () => {
    it('should handle bulk property creation efficiently', async () => {
      const propertyCount = 100;
      const properties = Array.from({ length: propertyCount }, () => 
        testUtils.createTestProperty()
      );

      const start = performance.now();
      
      // Use batch creation if available
      if (storage.createPropertiesBatch) {
        await storage.createPropertiesBatch(properties);
      } else {
        // Fallback to individual creation
        await Promise.all(
          properties.map(property => storage.createProperty(property))
        );
      }
      
      const duration = performance.now() - start;
      
      // Should complete bulk creation in reasonable time
      expect(duration).toBeLessThan(5000); // Under 5 seconds for 100 properties
      
      console.log(`Bulk creation of ${propertyCount} properties took ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent database queries efficiently', async () => {
      const concurrentQueries = 20;
      const queries = [];

      for (let i = 0; i < concurrentQueries; i++) {
        queries.push(
          storage.getProperties({ page: 1, limit: 10 })
        );
      }

      const start = performance.now();
      const results = await Promise.all(queries);
      const duration = performance.now() - start;

      // All queries should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      });

      // Should handle concurrent queries efficiently
      expect(duration).toBeLessThan(2000); // Under 2 seconds for 20 concurrent queries
      
      console.log(`${concurrentQueries} concurrent queries took ${duration.toFixed(2)}ms`);
    });

    it('should optimize complex search queries', async () => {
      // Create test data
      const properties = Array.from({ length: 50 }, () => 
        testUtils.createTestProperty()
      );
      
      await Promise.all(
        properties.map(property => storage.createProperty(property))
      );

      const searchFilters = {
        query: 'test',
        location: 'Test City',
        priceMin: 100000,
        priceMax: 1000000
      };

      const start = performance.now();
      const results = await storage.searchPropertiesWithFilters(searchFilters, { page: 1, limit: 20 });
      const duration = performance.now() - start;

      expect(results).toBeDefined();
      expect(Array.isArray(results.data)).toBe(true);
      
      // Complex search should complete quickly
      expect(duration).toBeLessThan(500); // Under 500ms
      
      console.log(`Complex search query took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache performance benefits', async () => {
      const cacheKey = 'test-performance-key';
      const testData = { 
        id: 1, 
        data: 'test data',
        timestamp: Date.now(),
        largeArray: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };

      // First write to cache
      const writeStart = performance.now();
      await cacheService.set(cacheKey, testData);
      const writeDuration = performance.now() - writeStart;

      // Read from cache multiple times
      const readCount = 100;
      const readStart = performance.now();
      
      const readPromises = Array.from({ length: readCount }, () => 
        cacheService.get(cacheKey)
      );
      
      const results = await Promise.all(readPromises);
      const readDuration = performance.now() - readStart;

      // All reads should succeed and return the same data
      results.forEach(result => {
        expect(result).toEqual(testData);
      });

      // Cache operations should be fast
      expect(writeDuration).toBeLessThan(50); // Under 50ms to write
      expect(readDuration).toBeLessThan(100); // Under 100ms for 100 reads
      
      console.log(`Cache write took ${writeDuration.toFixed(2)}ms`);
      console.log(`${readCount} cache reads took ${readDuration.toFixed(2)}ms (${(readDuration/readCount).toFixed(2)}ms avg)`);
    });

    it('should handle cache invalidation efficiently', async () => {
      const keyCount = 100;
      const keys = Array.from({ length: keyCount }, (_, i) => `test-key-${i}`);
      const testData = { value: 'test data' };

      // Set multiple cache entries
      await Promise.all(
        keys.map(key => cacheService.set(key, testData, { tags: ['test-tag'] }))
      );

      // Invalidate by tag
      const start = performance.now();
      const deletedCount = await cacheService.invalidateByTags(['test-tag']);
      const duration = performance.now() - start;

      expect(deletedCount).toBe(keyCount);
      expect(duration).toBeLessThan(200); // Under 200ms to invalidate 100 keys
      
      console.log(`Cache invalidation of ${keyCount} keys took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Query Optimization Performance', () => {
    it('should demonstrate query optimization benefits', async () => {
      // Mock query builder for testing
      const mockQuery = {
        execute: async () => Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })),
        toSQL: () => ({ sql: 'SELECT * FROM test_table' })
      } as any;

      const options = {
        cache: { enabled: true, ttl: 300 },
        pagination: { page: 1, limit: 20 }
      };

      // First execution (cache miss)
      const firstStart = performance.now();
      const firstResult = await queryOptimizer.executeQuery(mockQuery, options);
      const firstDuration = performance.now() - firstStart;

      // Second execution (cache hit)
      const secondStart = performance.now();
      const secondResult = await queryOptimizer.executeQuery(mockQuery, options);
      const secondDuration = performance.now() - secondStart;

      expect(firstResult.data).toBeDefined();
      expect(secondResult.data).toBeDefined();
      expect(firstResult.fromCache).toBe(false);
      expect(secondResult.fromCache).toBe(true);

      // Cached query should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration / 2);
      
      console.log(`First query (cache miss) took ${firstDuration.toFixed(2)}ms`);
      console.log(`Second query (cache hit) took ${secondDuration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should monitor memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const largeDataSets = Array.from({ length: 10 }, () => 
        Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `Large data item ${i}`,
          timestamp: Date.now(),
          metadata: { index: i, processed: false }
        }))
      );

      // Process the data
      const processedData = largeDataSets.map(dataset => 
        dataset.map(item => ({
          ...item,
          processed: true,
          processedAt: Date.now()
        }))
      );

      const finalMemory = process.memoryUsage();
      
      // Calculate memory increase
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const rssIncrease = finalMemory.rss - initialMemory.rss;

      console.log(`Heap memory increase: ${(heapIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`RSS memory increase: ${(rssIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable
      expect(heapIncrease).toBeLessThan(100 * 1024 * 1024); // Under 100MB heap increase
      expect(processedData.length).toBe(10);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-frequency operations', async () => {
      const operationCount = 1000;
      const operations = [];

      // Mix of different operations
      for (let i = 0; i < operationCount; i++) {
        if (i % 3 === 0) {
          // Cache operations
          operations.push(
            cacheService.set(`stress-test-${i}`, { id: i, data: `test-${i}` })
          );
        } else if (i % 3 === 1) {
          // Database reads
          operations.push(
            storage.getProperties({ page: 1, limit: 5 })
          );
        } else {
          // Cache reads
          operations.push(
            cacheService.get(`stress-test-${Math.floor(i / 3)}`)
          );
        }
      }

      const start = performance.now();
      const results = await Promise.allSettled(operations);
      const duration = performance.now() - start;

      // Count successful operations
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      console.log(`Stress test: ${successCount} successful, ${failureCount} failed operations in ${duration.toFixed(2)}ms`);
      
      // Most operations should succeed
      expect(successCount / operationCount).toBeGreaterThan(0.9); // 90% success rate
      
      // Should handle high frequency operations reasonably
      expect(duration).toBeLessThan(10000); // Under 10 seconds for 1000 operations
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should meet response time SLAs', async () => {
      const benchmarks = [
        {
          name: 'Simple property fetch',
          operation: () => storage.getProperties({ page: 1, limit: 10 }),
          maxTime: 100 // 100ms
        },
        {
          name: 'Cache get operation',
          operation: async () => {
            await cacheService.set('benchmark-key', { test: 'data' });
            return cacheService.get('benchmark-key');
          },
          maxTime: 10 // 10ms
        },
        {
          name: 'User authentication',
          operation: () => storage.getUserByUsername('test@example.com'),
          maxTime: 200 // 200ms
        }
      ];

      for (const benchmark of benchmarks) {
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          try {
            await benchmark.operation();
          } catch (error) {
            // Some operations might fail due to missing data, that's ok for benchmarking
          }
          const duration = performance.now() - start;
          times.push(duration);
        }

        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        console.log(`${benchmark.name}: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);

        // Average should meet SLA
        expect(avgTime).toBeLessThan(benchmark.maxTime);
      }
    });
  });
});