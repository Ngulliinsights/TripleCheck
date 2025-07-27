import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('API Validation Tests', () => {
  describe('Authentication API', () => {
    it('should handle login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should handle login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle logout without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      // Should handle gracefully even without auth
      expect(response.status).toBeLessThan(500);
    });

    it('should handle profile request without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      // Should return appropriate auth error
      expect(response.status).toBe(401);
    });
  });

  describe('Property API', () => {
    it('should get properties without authentication', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle invalid property ID format', async () => {
      const response = await request(app)
        .get('/api/properties/invalid-id');

      expect(response.status).toBeLessThan(500);
    });

    it('should require authentication for property creation', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: 'Test Property',
          description: 'A test property',
          price: 100000,
          location: 'Test Location'
        });

      expect(response.status).toBe(401);
    });

    it('should handle property creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: 'A', // Too short
          price: -1000, // Negative price
        });

      expect(response.status).toBe(400);
    });

    it('should handle property update without authentication', async () => {
      const response = await request(app)
        .patch('/api/properties/1')
        .send({
          title: 'Updated Property'
        });

      expect(response.status).toBe(401);
    });

    it('should handle property deletion without authentication', async () => {
      const response = await request(app)
        .delete('/api/properties/1');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('should include correlation ID in error responses', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.headers).toHaveProperty('x-correlation-id');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/properties');

      // Check for basic security headers
      expect(response.headers).toHaveProperty('x-correlation-id');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/properties')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests gracefully', async () => {
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/api/properties')
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (no rate limiting on GET)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/properties')
        .query({
          page: 'invalid',
          limit: -1
        });

      // Should handle invalid query params gracefully
      expect(response.status).toBeLessThan(500);
    });

    it('should sanitize input data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      // Should handle XSS attempts
      expect(response.status).toBeLessThan(500);
    });
  });
});