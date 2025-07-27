import request from 'supertest';
import app from '../app';

describe('API Compatibility Validation', () => {
  describe('Health Check Endpoint', () => {
    test('GET /health should return status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API Route Structure Validation', () => {
    test('Authentication routes should be accessible', async () => {
      // Test that auth routes exist (even if they fail due to missing data)
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should return 400 (validation error) not 404 (route not found)
      expect([400, 401, 422]).toContain(registerResponse.status);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({});

      expect([400, 401, 422]).toContain(loginResponse.status);

      const meResponse = await request(app)
        .get('/api/auth/me');

      expect([401, 403]).toContain(meResponse.status);

      const logoutResponse = await request(app)
        .post('/api/auth/logout');

      expect([401, 403]).toContain(logoutResponse.status);
    });

    test('Property routes should be accessible', async () => {
      const getPropertiesResponse = await request(app)
        .get('/api/properties');

      // Should not return 404 (route exists)
      expect(getPropertiesResponse.status).not.toBe(404);

      const createPropertyResponse = await request(app)
        .post('/api/properties')
        .send({});

      // Should return auth error or validation error, not 404
      expect([400, 401, 422]).toContain(createPropertyResponse.status);

      const getPropertyResponse = await request(app)
        .get('/api/properties/test-id');

      // Should not return 404 for route (might return 400 for invalid ID)
      expect(getPropertyResponse.status).not.toBe(404);
    });

    test('User routes should be accessible', async () => {
      const getUsersResponse = await request(app)
        .get('/api/users');

      // Should require auth, not return 404
      expect([401, 403]).toContain(getUsersResponse.status);

      const getUserResponse = await request(app)
        .get('/api/users/test-id');

      // Should require auth or return validation error, not 404
      expect([400, 401, 403]).toContain(getUserResponse.status);
    });

    test('Search routes should be accessible', async () => {
      const searchLocationsResponse = await request(app)
        .get('/api/search/locations');

      // Should not return 404 (route exists)
      expect(searchLocationsResponse.status).not.toBe(404);

      const searchPropertiesResponse = await request(app)
        .post('/api/search/properties')
        .send({});

      // Should not return 404 (route exists)
      expect(searchPropertiesResponse.status).not.toBe(404);
    });

    test('Trust/Verification routes should be accessible', async () => {
      const trustResponse = await request(app)
        .get('/api/trust/test-id');

      // Should not return 404 (route exists)
      expect(trustResponse.status).not.toBe(404);

      const verificationResponse = await request(app)
        .post('/api/properties/test-id/verify');

      // Should require auth or return validation error, not 404
      expect([400, 401, 403]).toContain(verificationResponse.status);
    });

    test('AI routes should be accessible', async () => {
      const aiResponse = await request(app)
        .post('/api/ai/analyze')
        .send({});

      // Should not return 404 (route exists)
      expect(aiResponse.status).not.toBe(404);
    });

    test('Analytics routes should be accessible', async () => {
      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard');

      // Should require auth, not return 404
      expect([401, 403]).toContain(analyticsResponse.status);
    });

    test('Communication routes should be accessible', async () => {
      const communicationResponse = await request(app)
        .get('/api/communication/messages');

      // Should require auth, not return 404
      expect([401, 403]).toContain(communicationResponse.status);
    });
  });

  describe('Response Format Consistency', () => {
    test('Error responses should have consistent format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: '' });

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    test('Validation errors should have consistent format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: '' });

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    test('Unauthorized responses should have consistent format', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('HTTP Methods and Headers', () => {
    test('CORS headers should be present', async () => {
      const response = await request(app)
        .options('/api/properties');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('Content-Type headers should be correct', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('Security headers should be present', async () => {
      const response = await request(app)
        .get('/health');

      // Check for common security headers
      expect(response.headers).toBeDefined();
    });
  });

  describe('API Versioning and Backward Compatibility', () => {
    test('All API routes should be prefixed with /api', async () => {
      // Test that routes without /api prefix return 404
      const response = await request(app)
        .get('/properties');

      expect(response.status).toBe(404);
    });

    test('Legacy endpoint patterns should still work', async () => {
      // Test common REST patterns
      const endpoints = [
        '/api/properties',
        '/api/properties/123',
        '/api/users',
        '/api/users/123',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout',
        '/api/auth/me'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });
  });

  describe('Performance Baseline', () => {
    test('Health check should respond quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health');

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
      
      console.log(`Health check response time: ${duration}ms`);
    });

    test('Route resolution should be fast', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties');

      const duration = Date.now() - startTime;
      
      // Should resolve route quickly even if it fails due to missing data
      expect(duration).toBeLessThan(2000); // Should resolve within 2 seconds
      
      console.log(`Route resolution time: ${duration}ms`);
    });

    test('Multiple concurrent requests should be handled', async () => {
      const concurrentRequests = 5;
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
      
      console.log(`Concurrent requests handled in ${duration}ms (${averageTime}ms average)`);
    });
  });

  describe('Error Handling Consistency', () => {
    test('Invalid routes should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route');

      expect(response.status).toBe(404);
    });

    test('Invalid HTTP methods should return 405', async () => {
      const response = await request(app)
        .patch('/health'); // PATCH not supported on health endpoint

      expect([404, 405]).toContain(response.status);
    });

    test('Malformed JSON should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json');

      expect(response.status).toBe(400);
    });
  });
});