import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { RequestDeduplicator } from '../RequestDeduplicator';

describe('Request Deduplication Middleware Integration', () => {
  let app: express.Application;
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    // Clear singleton instance for clean tests
    (RequestDeduplicator as any).instance = undefined;
    
    deduplicator = RequestDeduplicator.getInstance({
      defaultTtl: 5000, // 5 seconds for testing
      maxPendingTime: 1000, // 1 second
      enableRedisBackup: false // Use in-memory only for tests
    });

    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createDeduplicationMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if request should be deduplicated
      if (!deduplicator.shouldDeduplicate(req.method, req.path)) {
        return next();
      }

      // Generate deduplication key
      const userId = (req as any).user?.id || 0;
      const key = deduplicator.generateIdempotencyKey(
        userId,
        req.path,
        { method: req.method, body: req.body, query: req.query }
      );

      // Handle idempotent request
      deduplicator.handleIdempotentRequest(key, async () => {
        return new Promise((resolve, reject) => {
          const originalSend = res.send;
          const originalJson = res.json;
          const originalStatus = res.status;
          
          let statusCode = 200;
          let responseData: any;

          // Override response methods to capture data
          res.status = function(code: number) {
            statusCode = code;
            return originalStatus.call(this, code);
          };

          res.send = function(data: any) {
            responseData = data;
            if (statusCode >= 400) {
              reject(new Error(`HTTP ${statusCode}: ${data}`));
            } else {
              resolve(data);
            }
            return originalSend.call(this, data);
          };

          res.json = function(data: any) {
            responseData = data;
            if (statusCode >= 400) {
              reject(new Error(`HTTP ${statusCode}: ${JSON.stringify(data)}`));
            } else {
              resolve(data);
            }
            return originalJson.call(this, data);
          };

          next();
        });
      }).then(result => {
        if (!res.headersSent) {
          res.json(result);
        }
      }).catch(error => {
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      });
    };
  };

  describe('GET Request Deduplication', () => {
    it('should deduplicate identical GET requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.get('/api/test', (req, res) => {
        callCount++;
        res.json({ message: 'success', callCount });
      });

      // Make two identical requests concurrently
      const [response1, response2] = await Promise.all([
        request(app).get('/api/test?param=value'),
        request(app).get('/api/test?param=value')
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
      expect(callCount).toBe(1); // Should only be called once due to deduplication
    });

    it('should not deduplicate different GET requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.get('/api/test', (req, res) => {
        callCount++;
        res.json({ message: 'success', callCount, param: req.query.param });
      });

      // Make two different requests
      const [response1, response2] = await Promise.all([
        request(app).get('/api/test?param=value1'),
        request(app).get('/api/test?param=value2')
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.param).toBe('value1');
      expect(response2.body.param).toBe('value2');
      expect(callCount).toBe(2); // Should be called twice for different requests
    });
  });

  describe('POST Request Deduplication', () => {
    it('should not deduplicate general POST requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.post('/api/users', (req, res) => {
        callCount++;
        res.json({ message: 'user created', callCount });
      });

      // Make two identical POST requests
      const requestData = { name: 'John Doe', email: 'john@example.com' };
      const [response1, response2] = await Promise.all([
        request(app).post('/api/users').send(requestData),
        request(app).post('/api/users').send(requestData)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(callCount).toBe(2); // Should not be deduplicated
    });

    it('should deduplicate search POST requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.post('/api/properties/search', (req, res) => {
        callCount++;
        res.json({ 
          results: [{ id: 1, title: 'Property 1' }], 
          callCount,
          searchParams: req.body 
        });
      });

      // Make two identical search requests
      const searchData = { location: 'Nairobi', type: 'apartment' };
      const [response1, response2] = await Promise.all([
        request(app).post('/api/properties/search').send(searchData),
        request(app).post('/api/properties/search').send(searchData)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
      expect(callCount).toBe(1); // Should be deduplicated
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in deduplicated requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.get('/api/error', (req, res) => {
        callCount++;
        res.status(500).json({ error: 'Internal server error', callCount });
      });

      // Make two identical requests that will fail
      const [response1, response2] = await Promise.all([
        request(app).get('/api/error'),
        request(app).get('/api/error')
      ]);

      expect(response1.status).toBe(500);
      expect(response2.status).toBe(500);
      expect(callCount).toBe(1); // Error should also be deduplicated
    });

    it('should not cache failed requests', async () => {
      let callCount = 0;
      
      app.use(createDeduplicationMiddleware());
      app.get('/api/flaky', (req, res) => {
        callCount++;
        if (callCount === 1) {
          res.status(500).json({ error: 'First call fails' });
        } else {
          res.json({ message: 'Second call succeeds', callCount });
        }
      });

      // First request should fail
      const response1 = await request(app).get('/api/flaky');
      expect(response1.status).toBe(500);

      // Wait a bit to ensure first request is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request should succeed (not cached due to error)
      const response2 = await request(app).get('/api/flaky');
      expect(response2.status).toBe(200);
      expect(response2.body.callCount).toBe(2);
    });
  });

  describe('Cache TTL and Expiration', () => {
    it('should respect cache TTL', async () => {
      // Create deduplicator with very short TTL
      (RequestDeduplicator as any).instance = undefined;
      const shortTtlDeduplicator = RequestDeduplicator.getInstance({
        defaultTtl: 100, // 100ms
        maxPendingTime: 1000,
        enableRedisBackup: false
      });

      let callCount = 0;
      
      const middleware = (req: Request, res: Response, next: NextFunction) => {
        const key = shortTtlDeduplicator.generateIdempotencyKey(0, req.path, {});
        shortTtlDeduplicator.handleIdempotentRequest(key, async () => {
          return new Promise(resolve => {
            callCount++;
            resolve({ message: 'success', callCount });
          });
        }, 100).then(result => {
          res.json(result);
        }).catch(error => {
          res.status(500).json({ error: error.message });
        });
      };

      app.use(middleware);
      app.get('/api/ttl-test', (req, res, next) => next());

      // First request
      const response1 = await request(app).get('/api/ttl-test');
      expect(response1.status).toBe(200);
      expect(response1.body.callCount).toBe(1);

      // Second request immediately (should be cached)
      const response2 = await request(app).get('/api/ttl-test');
      expect(response2.status).toBe(200);
      expect(response2.body.callCount).toBe(1); // Same as first

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third request after TTL expiration
      const response3 = await request(app).get('/api/ttl-test');
      expect(response3.status).toBe(200);
      expect(response3.body.callCount).toBe(2); // Should be incremented
    });
  });

  describe('Performance and Statistics', () => {
    it('should track cache statistics', async () => {
      app.use(createDeduplicationMiddleware());
      app.get('/api/stats-test', (req, res) => {
        res.json({ message: 'success' });
      });

      // Make several requests
      await Promise.all([
        request(app).get('/api/stats-test?id=1'),
        request(app).get('/api/stats-test?id=1'), // Duplicate
        request(app).get('/api/stats-test?id=2'),
        request(app).get('/api/stats-test?id=2'), // Duplicate
      ]);

      const stats = deduplicator.getStats();
      expect(stats.completedRequests).toBeGreaterThan(0);
      expect(stats.pendingRequests).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Middleware Chaining', () => {
    it('should work correctly with authentication middleware', async () => {
      // Mock authentication middleware
      const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (authHeader === 'Bearer valid-token') {
          (req as any).user = { id: 123, username: 'testuser' };
          next();
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      };

      let callCount = 0;
      
      app.use(authMiddleware);
      app.use(createDeduplicationMiddleware());
      app.get('/api/protected', (req, res) => {
        callCount++;
        res.json({ 
          message: 'protected resource', 
          user: (req as any).user,
          callCount 
        });
      });

      // Make two identical authenticated requests
      const [response1, response2] = await Promise.all([
        request(app)
          .get('/api/protected')
          .set('Authorization', 'Bearer valid-token'),
        request(app)
          .get('/api/protected')
          .set('Authorization', 'Bearer valid-token')
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
      expect(callCount).toBe(1); // Should be deduplicated

      // Test unauthorized request
      const response3 = await request(app).get('/api/protected');
      expect(response3.status).toBe(401);
    });

    it('should work with validation middleware', async () => {
      // Mock validation middleware
      const validateMiddleware = (req: Request, res: Response, next: NextFunction) => {
        if (!req.body.name || req.body.name.length < 2) {
          return res.status(400).json({ error: 'Name is required and must be at least 2 characters' });
        }
        next();
      };

      let callCount = 0;
      
      app.use(validateMiddleware);
      app.use(createDeduplicationMiddleware());
      app.post('/api/analytics/events', (req, res) => {
        callCount++;
        res.json({ 
          message: 'event recorded', 
          event: req.body,
          callCount 
        });
      });

      // Valid requests should be deduplicated
      const validData = { name: 'page_view', data: { page: '/home' } };
      const [response1, response2] = await Promise.all([
        request(app).post('/api/analytics/events').send(validData),
        request(app).post('/api/analytics/events').send(validData)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
      expect(callCount).toBe(1);

      // Invalid request should fail validation
      const invalidData = { name: 'x' };
      const response3 = await request(app).post('/api/analytics/events').send(invalidData);
      expect(response3.status).toBe(400);
    });
  });
});