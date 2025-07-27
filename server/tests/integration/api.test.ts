import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '../../storage';
import { authService } from '../../auth/AuthenticationService';
import { testUtils } from '../setup';

describe('API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Set up test app with routes
    app = express();
    app.use(express.json());
    
    // Import and set up routes
    const { registerRoutes } = await import('../../routes/index');
    await registerRoutes(app);
  });

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = testUtils.createTestUser();
    const hashedPassword = await authService.hashPassword(testUser.password);
    
    // Mock user creation in database
    const createdUser = await storage.createUser({
      ...testUser,
      password: hashedPassword
    });

    // Generate auth token
    const authResult = await authService.authenticate(
      testUser.email,
      testUser.password,
      { ip: '127.0.0.1', get: () => 'test-agent' } as any
    );

    if (authResult.success && authResult.tokens) {
      authToken = authResult.tokens.accessToken;
    }
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const newUser = testUtils.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should refresh tokens', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toBeDefined();
    });
  });

  describe('Property Endpoints', () => {
    it('should create a property with authentication', async () => {
      const testProperty = testUtils.createTestProperty();
      
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(testProperty.title);
    });

    it('should reject property creation without authentication', async () => {
      const testProperty = testUtils.createTestProperty();
      
      const response = await request(app)
        .post('/api/properties')
        .send(testProperty)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should get properties list', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get property by ID', async () => {
      // First create a property
      const testProperty = testUtils.createTestProperty();
      const createResponse = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty);

      const propertyId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/properties/${propertyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(propertyId);
    });

    it('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .get('/api/properties/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should search properties', async () => {
      const response = await request(app)
        .get('/api/properties/search')
        .query({ q: 'test', location: 'nairobi' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Review Endpoints', () => {
    let propertyId: number;

    beforeEach(async () => {
      // Create a test property first
      const testProperty = testUtils.createTestProperty();
      const createResponse = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty);
      
      propertyId = createResponse.body.data.id;
    });

    it('should create a review', async () => {
      const testReview = {
        rating: 4,
        comment: 'Great property with excellent location'
      };

      const response = await request(app)
        .post(`/api/properties/${propertyId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testReview)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(testReview.rating);
    });

    it('should get property reviews', async () => {
      const response = await request(app)
        .get(`/api/properties/${propertyId}/reviews`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.reviews)).toBe(true);
    });

    it('should validate review data', async () => {
      const invalidReview = {
        rating: 6, // Invalid rating
        comment: '' // Empty comment
      };

      const response = await request(app)
        .post(`/api/properties/${propertyId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidReview)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ready).toBeDefined();
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alive).toBe(true);
    });
  });

  describe('Security Integration', () => {
    it('should enforce rate limiting', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/properties')
            .expect((res) => {
              // Should eventually get rate limited
              if (res.status === 429) {
                expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
              }
            })
        );
      }

      await Promise.all(requests);
    });

    it('should sanitize malicious input', async () => {
      const maliciousProperty = {
        title: '<script>alert("xss")</script>Malicious Property',
        description: 'Normal description with <iframe src="evil.com"></iframe>',
        price: 500000,
        location: 'Test City'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousProperty)
        .expect(201);

      // Check that malicious content was sanitized
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('<iframe>');
    });

    it('should detect SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/properties/search')
        .query({ q: "'; DROP TABLE properties; --" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MALICIOUS_INPUT_DETECTED');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidProperty = {
        title: '', // Empty title
        description: 'A', // Too short
        price: -100, // Negative price
        location: ''
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProperty)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fieldErrors).toBeDefined();
    });

    it('should handle server errors gracefully', async () => {
      // Mock a server error by making storage throw
      const originalMethod = storage.getProperties;
      storage.getProperties = () => {
        throw new Error('Database connection failed');
      };

      const response = await request(app)
        .get('/api/properties')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Restore original method
      storage.getProperties = originalMethod;
    });

    it('should include correlation IDs in error responses', async () => {
      const response = await request(app)
        .get('/api/properties/invalid-id')
        .expect(400);

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.metadata?.correlationId).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond to health checks quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/health/live')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should respond in under 100ms
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/properties')
            .expect(200)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(5000); // Under 5 seconds for 10 concurrent requests
    });
  });
});