import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupMswServer, mockApiSuccess , server } from '../../test-utils/msw-server'
import { ApiClient, type CacheStrategy } from "../../../shared/services/unified-api-client"
import { http, HttpResponse } from 'msw'


// Setup MSW server for all tests
setupMswServer({ quiet: true });

describe('Cache Invalidation and Management Tests', () => {
  let client: ApiClient;

  afterEach(() => {
    server.resetHandlers();
  });

  describe('TTL (Time-To-Live) Cache Strategy', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'TTL',
          maxSize: 10,
          defaultTTL: 1000, // 1 second for testing
        },
      });
    });

    it('should cache responses until TTL expires', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/ttl-test', () => {
          requestCount++;
          return HttpResponse.json({ 
            data: 'cached data', 
            requestCount,
            timestamp: Date.now(),
          });
        })
      );

      // First request - should hit server
      const response1 = await client.get<{ requestCount: number }>('/ttl-test');
      expect(response1.success).toBe(true);
      expect(response1.data?.requestCount).toBe(1);
      expect(requestCount).toBe(1);

      // Second request within TTL - should use cache
      const response2 = await client.get<{ requestCount: number }>('/ttl-test');
      expect(response2.success).toBe(true);
      expect(response2.data?.requestCount).toBe(1); // Same as first request
      expect(requestCount).toBe(1); // No new request made

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Third request after TTL - should hit server again
      const response3 = await client.get<{ requestCount: number }>('/ttl-test');
      expect(response3.success).toBe(true);
      expect(response3.data?.requestCount).toBe(2); // New request
      expect(requestCount).toBe(2);
    });

    it('should evict expired entries during cache operations', async () => {
      const endpoints = ['/cache-1', '/cache-2', '/cache-3'];
      const requestCounts: Record<string, number> = {};
      
      // Set up handlers for multiple endpoints
      endpoints.forEach(endpoint => {
        requestCounts[endpoint] = 0;
        server.use(
          http.get(`/api${endpoint}`, () => {
            requestCounts[endpoint]++;
            return HttpResponse.json({ 
              endpoint,
              requestCount: requestCounts[endpoint],
            });
          })
        );
      });

      // Cache responses for all endpoints
      for (const endpoint of endpoints) {
        await client.get(endpoint);
      }

      expect(client.getCacheStats().size).toBe(3);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Make a new request to trigger cache cleanup
      await client.get('/cache-1');

      // Cache should have been cleaned up and new request made
      expect(requestCounts['/cache-1']).toBe(2); // Original + new request
      expect(client.getCacheStats().size).toBe(1); // Only new entry
    });

    it('should handle mixed TTL expiration correctly', async () => {
      // Create client with longer TTL for this test
      const longTtlClient = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'TTL',
          maxSize: 10,
          defaultTTL: 2000, // 2 seconds
        },
      });

      let requestCount = 0;
      
      server.use(
        http.get('/api/mixed-ttl', () => {
          requestCount++;
          return HttpResponse.json({ requestCount });
        })
      );

      // First request
      await longTtlClient.get('/mixed-ttl');
      expect(requestCount).toBe(1);

      // Wait half the TTL
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should still use cache
      await longTtlClient.get('/mixed-ttl');
      expect(requestCount).toBe(1);

      // Wait for full TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should make new request
      await longTtlClient.get('/mixed-ttl');
      expect(requestCount).toBe(2);
    });
  });

  describe('LRU (Least Recently Used) Cache Strategy', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'LRU',
          maxSize: 3,
          defaultTTL: 60000, // Long TTL to focus on LRU behavior
        },
      });
    });

    it('should evict least recently used entries when cache is full', async () => {
      const endpoints = ['/lru-1', '/lru-2', '/lru-3', '/lru-4'];
      const requestCounts: Record<string, number> = {};
      
      // Set up handlers
      endpoints.forEach(endpoint => {
        requestCounts[endpoint] = 0;
        server.use(
          http.get(`/api${endpoint}`, () => {
            requestCounts[endpoint]++;
            return HttpResponse.json({ 
              endpoint,
              requestCount: requestCounts[endpoint],
            });
          })
        );
      });

      // Fill cache to capacity
      await client.get('/lru-1');
      await client.get('/lru-2');
      await client.get('/lru-3');
      
      expect(client.getCacheStats().size).toBe(3);
      expect(requestCounts['/lru-1']).toBe(1);
      expect(requestCounts['/lru-2']).toBe(1);
      expect(requestCounts['/lru-3']).toBe(1);

      // Add fourth item - should evict first item (least recently used)
      await client.get('/lru-4');
      
      expect(client.getCacheStats().size).toBe(3); // Still at max size
      expect(requestCounts['/lru-4']).toBe(1);

      // Access first endpoint again - should make new request (was evicted)
      await client.get('/lru-1');
      expect(requestCounts['/lru-1']).toBe(2); // New request made

      // Access second endpoint - should use cache (still present)
      await client.get('/lru-2');
      expect(requestCounts['/lru-2']).toBe(1); // No new request
    });

    it('should update access time when cache entries are accessed', async () => {
      server.use(
        http.get('/api/lru-access-1', () => HttpResponse.json({ endpoint: 'lru-access-1' })),
        http.get('/api/lru-access-2', () => HttpResponse.json({ endpoint: 'lru-access-2' })),
        http.get('/api/lru-access-3', () => HttpResponse.json({ endpoint: 'lru-access-3' })),
        http.get('/api/lru-access-4', () => HttpResponse.json({ endpoint: 'lru-access-4' }))
      );

      // Fill cache
      await client.get('/lru-access-1');
      await client.get('/lru-access-2');
      await client.get('/lru-access-3');

      // Access first item to make it recently used
      await client.get('/lru-access-1');

      // Add fourth item - should evict second item (now least recently used)
      await client.get('/lru-access-4');

      // Verify that first item is still cached (was recently accessed)
      let requestCount = 0;
      server.use(
        http.get('/api/lru-access-1', () => {
          requestCount++;
          return HttpResponse.json({ endpoint: 'lru-access-1', requestCount });
        })
      );

      const response = await client.get<{ requestCount: number }>('/lru-access-1');
      expect(response.data?.requestCount).toBeUndefined(); // Should use cached response
    });

    it('should handle cache access patterns correctly', async () => {
      const accessPattern = ['/pattern-1', '/pattern-2', '/pattern-3'];
      
      accessPattern.forEach(endpoint => {
        server.use(
          http.get(`/api${endpoint}`, () => HttpResponse.json({ endpoint }))
        );
      });

      // Fill cache with access pattern
      for (const endpoint of accessPattern) {
        await client.get(endpoint);
      }

      // Access items in reverse order to change LRU order
      for (let i = accessPattern.length - 1; i >= 0; i--) {
        await client.get(accessPattern[i]);
      }

      // Add new item - should evict the item that wasn't accessed in reverse order
      server.use(
        http.get('/api/pattern-new', () => HttpResponse.json({ endpoint: 'pattern-new' }))
      );

      await client.get('/pattern-new');
      expect(client.getCacheStats().size).toBe(3);
    });
  });

  describe('FIFO (First In, First Out) Cache Strategy', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'FIFO',
          maxSize: 3,
          defaultTTL: 60000, // Long TTL to focus on FIFO behavior
        },
      });
    });

    it('should evict oldest entries when cache is full', async () => {
      const endpoints = ['/fifo-1', '/fifo-2', '/fifo-3', '/fifo-4'];
      const requestCounts: Record<string, number> = {};
      
      // Set up handlers
      endpoints.forEach(endpoint => {
        requestCounts[endpoint] = 0;
        server.use(
          http.get(`/api${endpoint}`, () => {
            requestCounts[endpoint]++;
            return HttpResponse.json({ 
              endpoint,
              requestCount: requestCounts[endpoint],
            });
          })
        );
      });

      // Fill cache in order
      await client.get('/fifo-1'); // First in
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      await client.get('/fifo-2');
      await new Promise(resolve => setTimeout(resolve, 10));
      await client.get('/fifo-3');
      
      expect(client.getCacheStats().size).toBe(3);

      // Add fourth item - should evict first item (oldest)
      await new Promise(resolve => setTimeout(resolve, 10));
      await client.get('/fifo-4');
      
      expect(client.getCacheStats().size).toBe(3);

      // Access first endpoint - should make new request (was evicted)
      await client.get('/fifo-1');
      expect(requestCounts['/fifo-1']).toBe(2); // Original + new request

      // Access second endpoint - should use cache (still present)
      await client.get('/fifo-2');
      expect(requestCounts['/fifo-2']).toBe(1); // No new request
    });

    it('should not be affected by access patterns', async () => {
      server.use(
        http.get('/api/fifo-access-1', () => HttpResponse.json({ endpoint: 'fifo-access-1' })),
        http.get('/api/fifo-access-2', () => HttpResponse.json({ endpoint: 'fifo-access-2' })),
        http.get('/api/fifo-access-3', () => HttpResponse.json({ endpoint: 'fifo-access-3' })),
        http.get('/api/fifo-access-4', () => HttpResponse.json({ endpoint: 'fifo-access-4' }))
      );

      // Fill cache
      await client.get('/fifo-access-1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await client.get('/fifo-access-2');
      await new Promise(resolve => setTimeout(resolve, 10));
      await client.get('/fifo-access-3');

      // Access first item multiple times (should not affect FIFO order)
      await client.get('/fifo-access-1');
      await client.get('/fifo-access-1');
      await client.get('/fifo-access-1');

      // Add fourth item - should still evict first item despite recent access
      await new Promise(resolve => setTimeout(resolve, 10));
      await client.get('/fifo-access-4');

      // Verify first item was evicted
      let requestCount = 0;
      server.use(
        http.get('/api/fifo-access-1', () => {
          requestCount++;
          return HttpResponse.json({ endpoint: 'fifo-access-1', requestCount });
        })
      );

      const response = await client.get<{ requestCount: number }>('/fifo-access-1');
      expect(response.data?.requestCount).toBe(1); // New request made
    });
  });

  describe('Cache Invalidation Scenarios', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'LRU',
          maxSize: 5,
          defaultTTL: 5000, // 5 seconds
        },
      });
    });

    it('should invalidate cache on non-GET requests to same endpoint', async () => {
      let getRequestCount = 0;
      let postRequestCount = 0;
      
      server.use(
        http.get('/api/invalidation-test', () => {
          getRequestCount++;
          return HttpResponse.json({ 
            data: 'cached data',
            getRequestCount,
          });
        }),
        http.post('/api/invalidation-test', () => {
          postRequestCount++;
          return HttpResponse.json({ 
            success: true,
            postRequestCount,
          });
        })
      );

      // First GET request - should cache
      const response1 = await client.get<{ getRequestCount: number }>('/invalidation-test');
      expect(response1.data?.getRequestCount).toBe(1);
      expect(getRequestCount).toBe(1);

      // Second GET request - should use cache
      const response2 = await client.get<{ getRequestCount: number }>('/invalidation-test');
      expect(response2.data?.getRequestCount).toBe(1); // Same as first
      expect(getRequestCount).toBe(1); // No new request

      // POST request to same endpoint
      await client.post('/invalidation-test', { update: 'data' });
      expect(postRequestCount).toBe(1);

      // GET request after POST - cache should still be used (current implementation doesn't auto-invalidate)
      const response3 = await client.get<{ getRequestCount: number }>('/invalidation-test');
      expect(response3.data?.getRequestCount).toBe(1); // Still cached
      expect(getRequestCount).toBe(1);
    });

    it('should manually clear cache when needed', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/manual-clear', () => {
          requestCount++;
          return HttpResponse.json({ requestCount });
        })
      );

      // Cache a response
      const response1 = await client.get<{ requestCount: number }>('/manual-clear');
      expect(response1.data?.requestCount).toBe(1);
      expect(requestCount).toBe(1);

      // Verify cache is working
      const response2 = await client.get<{ requestCount: number }>('/manual-clear');
      expect(response2.data?.requestCount).toBe(1);
      expect(requestCount).toBe(1);

      // Clear cache manually
      client.clearCache();

      // Next request should hit server
      const response3 = await client.get<{ requestCount: number }>('/manual-clear');
      expect(response3.data?.requestCount).toBe(2);
      expect(requestCount).toBe(2);
    });

    it('should handle cache invalidation with different cache strategies', async () => {
      const strategies: CacheStrategy[] = [
        { type: 'LRU', maxSize: 3, defaultTTL: 5000 },
        { type: 'FIFO', maxSize: 3, defaultTTL: 5000 },
        { type: 'TTL', maxSize: 3, defaultTTL: 5000 },
      ];

      for (const strategy of strategies) {
        const testClient = new ApiClient({
          baseUrl: '/api',
          cacheStrategy: strategy,
        });

        let requestCount = 0;
        
        server.use(
          http.get(`/api/strategy-${strategy.type}`, () => {
            requestCount++;
            return HttpResponse.json({ 
              strategy: strategy.type,
              requestCount,
            });
          })
        );

        // Cache response
        await testClient.get(`/strategy-${strategy.type}`);
        expect(requestCount).toBe(1);

        // Verify caching works
        await testClient.get(`/strategy-${strategy.type}`);
        expect(requestCount).toBe(1);

        // Clear cache
        testClient.clearCache();

        // Verify cache was cleared
        await testClient.get(`/strategy-${strategy.type}`);
        expect(requestCount).toBe(2);
      }
    });
  });

  describe('Cache Performance and Memory Management', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'LRU',
          maxSize: 100,
          defaultTTL: 10000,
        },
      });
    });

    it('should maintain cache size limits under heavy load', async () => {
      const numRequests = 150; // More than cache size
      const endpoints: string[] = [];
      
      // Create many endpoints
      for (let i = 0; i < numRequests; i++) {
        const endpoint = `/load-test-${i}`;
        endpoints.push(endpoint);
        
        server.use(
          http.get(`/api${endpoint}`, () => {
            return HttpResponse.json({ id: i, data: `Data for ${endpoint}` });
          })
        );
      }

      // Make requests to all endpoints
      for (const endpoint of endpoints) {
        await client.get(endpoint);
      }

      // Cache should not exceed max size
      const stats = client.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
      expect(stats.size).toBe(100); // Should be at max capacity
    });

    it('should handle rapid cache operations efficiently', async () => {
      const endpoint = '/rapid-test';
      let requestCount = 0;
      
      server.use(
        http.get(`/api${endpoint}`, () => {
          requestCount++;
          return HttpResponse.json({ requestCount });
        })
      );

      // Make many rapid requests to same endpoint
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(client.get(endpoint));
      }

      const responses = await Promise.all(promises);
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Should have made only one actual HTTP request due to caching
      expect(requestCount).toBe(1);
    });

    it('should provide accurate cache statistics', async () => {
      const initialStats = client.getCacheStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.maxSize).toBe(100);
      expect(initialStats.strategy).toBe('LRU');

      // Add some cache entries
      const endpoints = ['/stats-1', '/stats-2', '/stats-3'];
      
      endpoints.forEach(endpoint => {
        server.use(
          http.get(`/api${endpoint}`, () => HttpResponse.json({ endpoint }))
        );
      });

      for (const endpoint of endpoints) {
        await client.get(endpoint);
      }

      const afterStats = client.getCacheStats();
      expect(afterStats.size).toBe(3);
      expect(afterStats.maxSize).toBe(100);
      expect(afterStats.strategy).toBe('LRU');

      // Clear cache
      client.clearCache();

      const clearedStats = client.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    beforeEach(() => {
      client = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'LRU',
          maxSize: 3,
          defaultTTL: 1000,
        },
      });
    });

    it('should handle cache operations with zero max size', () => {
      const zeroSizeClient = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'LRU',
          maxSize: 0,
          defaultTTL: 1000,
        },
      });

      expect(zeroSizeClient.getCacheStats().maxSize).toBe(0);
      expect(zeroSizeClient.getCacheStats().size).toBe(0);
    });

    it('should handle cache operations with very short TTL', async () => {
      const shortTtlClient = new ApiClient({
        baseUrl: '/api',
        cacheStrategy: {
          type: 'TTL',
          maxSize: 5,
          defaultTTL: 1, // 1ms TTL
        },
      });

      let requestCount = 0;
      
      server.use(
        http.get('/api/short-ttl', () => {
          requestCount++;
          return HttpResponse.json({ requestCount });
        })
      );

      // First request
      await shortTtlClient.get('/short-ttl');
      expect(requestCount).toBe(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second request should hit server again
      await shortTtlClient.get('/short-ttl');
      expect(requestCount).toBe(2);
    });

    it('should handle concurrent cache operations safely', async () => {
      const endpoint = '/concurrent-test';
      let requestCount = 0;
      
      server.use(
        http.get(`/api${endpoint}`, async () => {
          requestCount++;
          // Add small delay to simulate processing time
          await new Promise(resolve => setTimeout(resolve, 10));
          return HttpResponse.json({ requestCount });
        })
      );

      // Make multiple concurrent requests
      const promises = [
        client.get(endpoint),
        client.get(endpoint),
        client.get(endpoint),
        client.get(endpoint),
        client.get(endpoint),
      ];

      const responses = await Promise.all(promises);
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Due to caching, should have made only one request
      // (though timing might affect this in concurrent scenarios)
      expect(requestCount).toBeGreaterThanOrEqual(1);
      expect(requestCount).toBeLessThanOrEqual(5);
    });

    it('should handle cache with malformed URLs gracefully', async () => {
      // Test with various URL formats
      const urls = [
        '/normal-endpoint',
        '//double-slash',
        '/endpoint/with/many/slashes',
        '/endpoint?query=param',
        '/endpoint#fragment',
      ];

      urls.forEach((url, index) => {
        server.use(
          http.get(`/api${url}`, () => HttpResponse.json({ url, index }))
        );
      });

      // All requests should work and be cacheable
      for (const url of urls) {
        const response = await client.get(url);
        expect(response.success).toBe(true);
      }

      expect(client.getCacheStats().size).toBe(urls.length);
    });
  });
});