import request from 'supertest';
import { vi } from 'vitest';

// Mock the storage module to avoid database connection issues
vi.mock('../storage', () => ({
  storage: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    // Mock basic methods that might be called
    getUsers: vi.fn().mockResolvedValue([]),
    getProperties: vi.fn().mockResolvedValue({ properties: [], totalCount: 0 }),
    getUserById: vi.fn().mockResolvedValue(null),
    getPropertyById: vi.fn().mockResolvedValue(null),
    createUser: vi.fn().mockResolvedValue({ id: 1, username: 'test' }),
    createProperty: vi.fn().mockResolvedValue({ id: 1, title: 'test' }),
    updateProperty: vi.fn().mockResolvedValue({ id: 1, title: 'updated' }),
    deleteUser: vi.fn().mockResolvedValue(true),
    deleteProperty: vi.fn().mockResolvedValue(true),
  }
}));

// Mock other services that might require external connections
vi.mock('../cache/CacheService', () => ({
  cacheService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }
}));

vi.mock('../monitoring/StructuredLogger', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    shutdown: vi.fn(),
  }
}));

describe('Application Validation Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Import app after mocks are set up
    app = (await import('../app')).default;
  });

  describe('Health Check Validation', () => {
    test('Health endpoint should be accessible', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('Health endpoint should return proper format', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('Route Structure Validation', () => {
    test('Authentication routes should exist', async () => {
      const routes = [
        { method: 'post', path: '/api/auth/register' },
        { method: 'post', path: '/api/auth/login' },
        { method: 'get', path: '/api/auth/me' },
        { method: 'post', path: '/api/auth/logout' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Property routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/properties' },
        { method: 'post', path: '/api/properties' },
        { method: 'get', path: '/api/properties/123' },
        { method: 'put', path: '/api/properties/123' },
        { method: 'delete', path: '/api/properties/123' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('User routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/users' },
        { method: 'get', path: '/api/users/123' },
        { method: 'put', path: '/api/users/123' },
        { method: 'delete', path: '/api/users/123' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Search routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/search/locations' },
        { method: 'post', path: '/api/search/properties' },
        { method: 'get', path: '/api/search/suggestions' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Trust/Verification routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/trust/123' },
        { method: 'post', path: '/api/properties/123/verify' },
        { method: 'get', path: '/api/properties/123/verification' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('AI routes should exist', async () => {
      const routes = [
        { method: 'post', path: '/api/ai/analyze' },
        { method: 'post', path: '/api/ai/verify-document' },
        { method: 'post', path: '/api/ai/detect-fraud' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Analytics routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/analytics/dashboard' },
        { method: 'get', path: '/api/analytics/properties' },
        { method: 'get', path: '/api/analytics/users' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Communication routes should exist', async () => {
      const routes = [
        { method: 'get', path: '/api/communication/messages' },
        { method: 'post', path: '/api/communication/messages' },
        { method: 'get', path: '/api/communication/notifications' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });
  });

  describe('Middleware Validation', () => {
    test('CORS middleware should be working', async () => {
      const response = await request(app)
        .options('/api/properties')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('JSON parsing middleware should be working', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' });

      // Should parse JSON and return validation error, not parsing error
      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
    });

    test('Error handling middleware should provide consistent responses', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format Validation', () => {
    test('API responses should have consistent structure', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
      } else {
        expect(response.body).toHaveProperty('message');
      }
    });

    test('Error responses should have consistent structure', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    test('Content-Type headers should be correct', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Security Validation', () => {
    test('Authentication should be required for protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/api/auth/me' },
        { method: 'post', path: '/api/properties' },
        { method: 'put', path: '/api/properties/123' },
        { method: 'delete', path: '/api/properties/123' },
        { method: 'get', path: '/api/users' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)[route.method](route.path);
        // Should return 401 (unauthorized) or 403 (forbidden)
        expect([401, 403]).toContain(response.status);
      }
    });

    test('Invalid JSON should be handled gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json-string');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });

    test('Large payloads should be rejected', async () => {
      const largePayload = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      const response = await request(app)
        .post('/api/properties')
        .send(largePayload);

      // Should reject large payloads
      expect([413, 400, 401]).toContain(response.status);
    });
  });

  describe('Performance Validation', () => {
    test('Health check should respond quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health');

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Route resolution should be fast', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties');

      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should resolve within 2 seconds
    });

    test('Multiple concurrent requests should be handled efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      const averageTime = duration / concurrentRequests;
      expect(averageTime).toBeLessThan(500); // Average response time under 500ms
    });
  });

  describe('Backward Compatibility Validation', () => {
    test('All API endpoints should maintain /api prefix', async () => {
      const endpoints = [
        '/properties', // Should return 404
        '/users', // Should return 404
        '/auth/login', // Should return 404
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(404);
      }
    });

    test('Legacy response formats should be maintained', async () => {
      const response = await request(app)
        .get('/api/properties');

      // Should maintain the expected response structure
      expect(response.body).toHaveProperty('success');
      
      if (response.body.success && response.body.data) {
        expect(response.body.data).toHaveProperty('properties');
        expect(response.body.data).toHaveProperty('totalCount');
      }
    });

    test('HTTP methods should be properly supported', async () => {
      const methodTests = [
        { method: 'get', path: '/api/properties', expectedStatus: [200, 401, 403] },
        { method: 'post', path: '/api/properties', expectedStatus: [400, 401, 403, 422] },
        { method: 'put', path: '/api/properties/123', expectedStatus: [400, 401, 403, 404] },
        { method: 'delete', path: '/api/properties/123', expectedStatus: [401, 403, 404] }
      ];

      for (const test of methodTests) {
        const response = await request(app)[test.method](test.path);
        expect(test.expectedStatus).toContain(response.status);
      }
    });
  });

  describe('File Upload Validation', () => {
    test('File upload endpoints should exist', async () => {
      const response = await request(app)
        .post('/api/properties')
        .attach('images', Buffer.from('fake-image'), 'test.jpg');

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
      // Should return auth error or validation error
      expect([400, 401, 403, 422]).toContain(response.status);
    });

    test('Document upload endpoints should exist', async () => {
      const response = await request(app)
        .post('/api/properties/123/documents')
        .attach('document', Buffer.from('fake-document'), 'test.pdf');

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe('AI Integration Validation', () => {
    test('AI verification endpoints should exist', async () => {
      const response = await request(app)
        .post('/api/properties/123/verify');

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
      // Should return auth error or validation error
      expect([400, 401, 403]).toContain(response.status);
    });

    test('AI analysis endpoints should exist', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .send({ text: 'test analysis' });

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });
});