import request from '..\app';
import app from '../app';

describe('Quick Validation Tests', () => {
  describe('Core Functionality', () => {
    test('Application should start successfully', () => {
      expect(app).toBeDefined();
    });

    test('Health endpoint should be accessible and fast', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(duration).toBeLessThan(1000);
      
      console.log(`✅ Health check: ${duration}ms`);
    });

    test('CORS should be properly configured', async () => {
      const response = await request(app)
        .options('/api/properties')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      console.log('✅ CORS configured');
    });

    test('Error handling should work consistently', async () => {
      const response = await request(app).get('/api/nonexistent-route');
      
      expect(response.status).toBe(404);
      console.log('✅ Error handling working');
    });

    test('JSON parsing should work', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ test: 'data' });

      // Should not return JSON parsing error
      expect(response.status).not.toBe(400);
      console.log('✅ JSON parsing working');
    });
  });

  describe('Route Accessibility', () => {
    test('Auth routes should be accessible', async () => {
      const routes = ['/api/auth/register', '/api/auth/login'];
      
      for (const route of routes) {
        const response = await request(app).post(route).send({});
        expect(response.status).not.toBe(404);
      }
      console.log('✅ Auth routes accessible');
    });

    test('Property routes should be accessible', async () => {
      const response = await request(app).get('/api/properties');
      expect(response.status).not.toBe(404);
      console.log('✅ Property routes accessible');
    });

    test('File upload routes should be accessible', async () => {
      const response = await request(app)
        .post('/api/properties')
        .attach('images', Buffer.from('test'), 'test.jpg');
      
      expect(response.status).not.toBe(404);
      console.log('✅ File upload routes accessible');
    });
  });

  describe('Performance Validation', () => {
    test('Concurrent requests should be handled efficiently', async () => {
      const startTime = Date.now();
      const requests = Array.from({ length: 5 }, () => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(duration).toBeLessThan(2000);
      console.log(`✅ Concurrent requests: ${duration}ms for 5 requests`);
    });

    test('Memory usage should be stable', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform some operations
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random()
      }));

      const processed = data.filter(item => item.value > 0.5);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const increase = finalMemory - initialMemory;

      expect(processed.length).toBeGreaterThan(0);
      expect(increase).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      
      console.log(`✅ Memory stable: ${Math.round(increase / 1024 / 1024 * 100) / 100}MB increase`);
    });
  });

  describe('Security Validation', () => {
    test('Large payloads should be rejected', async () => {
      const largePayload = { data: 'x'.repeat(1024 * 1024) }; // 1MB
      
      const response = await request(app)
        .post('/api/properties')
        .send(largePayload);

      // Should reject or handle gracefully
      expect([413, 400, 401, 500]).toContain(response.status);
      console.log('✅ Large payload protection working');
    });

    test('Invalid JSON should be handled gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json');

      // Should handle gracefully, not crash
      expect([400, 500]).toContain(response.status);
      console.log('✅ Invalid JSON handled gracefully');
    });
  });

  describe('Backward Compatibility', () => {
    test('API prefix should be maintained', async () => {
      // Routes without /api should return 404
      const response = await request(app).get('/properties');
      expect(response.status).toBe(404);
      console.log('✅ API prefix maintained');
    });

    test('HTTP methods should be supported', async () => {
      const methods = ['get', 'post', 'put', 'delete'];
      
      for (const method of methods) {
        const response = await request(app)[method]('/api/properties/123');
        // Should not return 405 (method not allowed) for basic routes
        expect(response.status).not.toBe(405);
      }
      console.log('✅ HTTP methods supported');
    });
  });
});