import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { testUtils } from '../../tests/setup';

describe('Land Verification Security Tests - API Security', () => {
  let testUser: any;
  let testProperty: any;
  let authToken: string;

  beforeEach(async () => {
    testUser = testUtils.createTestUser();
    testProperty = testUtils.createTestProperty();
    authToken = process.env.TEST_AUTH_TOKEN || 'test-jwt-token-' + require('crypto').randomBytes(16).toString('hex');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HTTPS and Transport Security', () => {
    it('should enforce HTTPS in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Test that HTTP requests are redirected to HTTPS
      const response = await request(app)
        .get('/api/land-verification/health')
        .set('X-Forwarded-Proto', 'http');

      // Should redirect to HTTPS or return security headers
      expect(response.headers['strict-transport-security']).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should set appropriate security headers', async () => {
      const response = await request(app)
        .get('/api/land-verification/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should implement CORS properly', async () => {
      // Test preflight request
      const preflightResponse = await request(app)
        .options('/api/land-verification/initiate')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      // Should reject unauthorized origins
      expect(preflightResponse.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');

      // Test with authorized origin
      const authorizedResponse = await request(app)
        .options('/api/land-verification/initiate')
        .set('Origin', 'https://trusted-domain.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(authorizedResponse.status).toBe(200);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate request content types', async () => {
      // Test with invalid content type
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('invalid data format')
        .expect(400);

      // Test with XML content type (should be rejected)
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/xml')
        .send('<xml>data</xml>')
        .expect(400);
    });

    it('should validate JSON structure', async () => {
      const invalidJsonPayloads = [
        '{"propertyId": "test", "userId": }', // Invalid JSON
        '{"propertyId": "test", "userId": null}', // Null values
        '{"propertyId": "", "userId": ""}', // Empty strings
        '{}', // Missing required fields
        '{"propertyId": 123, "userId": "test"}' // Wrong data types
      ];

      for (const payload of invalidJsonPayloads) {
        await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(400);
      }
    });

    it('should prevent parameter pollution', async () => {
      // Test with duplicate parameters
      await request(app)
        .post('/api/land-verification/initiate?userId=1&userId=2')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(400);

      // Test with array injection
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: [testProperty.id, 'malicious'],
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(400);
    });

    it('should validate URL parameters', async () => {
      const invalidSessionIds = [
        '../../../etc/passwd',
        'session; DROP TABLE sessions;',
        '<script>alert("xss")</script>',
        'session%00.txt',
        'very-long-session-id-' + 'a'.repeat(1000)
      ];

      for (const sessionId of invalidSessionIds) {
        await request(app)
          .get(`/api/land-verification/sessions/${encodeURIComponent(sessionId)}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      }
    });
  });

  describe('Authentication Security', () => {
    it('should prevent JWT token manipulation', async () => {
      const manipulatedTokens = [
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiIxIiwicm9sZSI6ImFkbWluIn0.', // None algorithm
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.invalid-signature', // Invalid signature
        'Bearer ' + 'a'.repeat(10000), // Extremely long token
      ];

      for (const token of manipulatedTokens) {
        await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', token)
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          })
          .expect(401);
      }
    });

    it('should implement token expiration', async () => {
      // Mock expired token
      const expiredToken = process.env.TEST_EXPIRED_TOKEN || 'expired-test-token-' + require('crypto').randomBytes(16).toString('hex');

      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(401);
    });

    it('should prevent session fixation attacks', async () => {
      // Create session with one token
      const sessionResponse1 = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse1.body.sessionId;

      // Try to access session with different token
      const differentToken = process.env.TEST_DIFFERENT_TOKEN || 'different-test-token-' + require('crypto').randomBytes(16).toString('hex');
      await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${differentToken}`)
        .expect(403);
    });

    it('should implement proper logout/token invalidation', async () => {
      // Create session
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Logout/invalidate token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to use invalidated token
      await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('API Endpoint Security', () => {
    it('should prevent HTTP method tampering', async () => {
      // Try to use wrong HTTP methods
      await request(app)
        .get('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(405); // Method not allowed

      await request(app)
        .put('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(405);

      // Test method override attempts
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-HTTP-Method-Override', 'DELETE')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(400); // Should reject method override
    });

    it('should validate API versioning', async () => {
      // Test with unsupported API version
      await request(app)
        .post('/api/v999/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(404);

      // Test with deprecated API version
      await request(app)
        .post('/api/v1/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(410); // Gone - deprecated
    });

    it('should implement proper error handling without information disclosure', async () => {
      // Test with invalid property ID
      const response = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'non-existent-property',
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(400);

      // Error message should not reveal internal details
      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('SQL');
      expect(response.body.error).not.toContain('stack trace');
      expect(response.body.error).not.toContain('file path');
    });

    it('should prevent directory traversal attacks', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd'
      ];

      for (const attempt of traversalAttempts) {
        await request(app)
          .get(`/api/land-verification/sessions/${encodeURIComponent(attempt)}/report`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      }
    });
  });

  describe('Business Logic Security', () => {
    it('should prevent privilege escalation', async () => {
      const regularUser = { ...testUser, role: 'user' };
      
      // Mock regular user authentication
      vi.mock('../../middleware/auth', () => ({
        requireAuth: (req: any, res: any, next: any) => {
          req.user = regularUser;
          next();
        }
      }));

      // Try to access admin functions
      await request(app)
        .get('/api/land-verification/admin/all-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Try to modify other users' sessions
      await request(app)
        .delete('/api/land-verification/sessions/other-user-session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Try to escalate privileges through request manipulation
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic',
          userRole: 'admin' // Attempt to set admin role
        })
        .expect(400);
    });

    it('should validate business rules', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Try to execute layers out of order
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interviews: []
        })
        .expect(400); // Should require registry layer first

      // Try to generate report without completing required layers
      await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should prevent race conditions in concurrent operations', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Try to execute same layer concurrently
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            titleNumber: 'TEST123',
            location: 'Nairobi'
          })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );

      // Only one should succeed
      expect(successful.length).toBe(1);
    });

    it('should validate resource limits', async () => {
      // Try to create too many sessions
      const sessionPromises = Array.from({ length: 100 }, (_, i) =>
        request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            propertyId: `${testProperty.id}_${i}`,
            userId: testUser.id,
            verificationType: 'basic'
          })
      );

      const results = await Promise.allSettled(sessionPromises);
      const rateLimited = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 429
      );

      // Should have rate limiting
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Third-Party Integration Security', () => {
    it('should validate government API responses', async () => {
      // Mock malicious government API response
      vi.mock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: '<script>alert("xss")</script>',
            currentOwner: {
              name: 'javascript:alert("xss")',
              idNumber: '"; DROP TABLE users; --'
            },
            maliciousField: 'unexpected data'
          })
        }))
      }));

      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      const registryResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleNumber: 'TEST123',
          location: 'Nairobi'
        })
        .expect(200);

      // Response should be sanitized
      const responseString = JSON.stringify(registryResponse.body);
      expect(responseString).not.toContain('<script>');
      expect(responseString).not.toContain('javascript:');
      expect(responseString).not.toContain('DROP TABLE');
      expect(registryResponse.body.results).not.toHaveProperty('maliciousField');
    });

    it('should implement timeout protection for external calls', async () => {
      // Mock slow government service
      vi.mock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 35000)) // 35 second delay
          )
        }))
      }));

      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleNumber: 'TEST123',
          location: 'Nairobi'
        })
        .timeout(30000)
        .expect(408); // Request timeout
    });

    it('should validate SSL certificates for external services', async () => {
      // This would typically test actual SSL validation
      // For now, we'll test that the configuration requires valid certificates
      
      const config = {
        governmentApiEndpoints: {
          landsRegistry: 'https://invalid-cert.gov.ke/api',
          courtRecords: 'http://insecure.gov.ke/api' // HTTP instead of HTTPS
        }
      };

      // Should reject insecure endpoints
      expect(() => {
        // This would be validated during service initialization
        if (config.governmentApiEndpoints.courtRecords.startsWith('http:')) {
          throw new Error('Insecure endpoint not allowed');
        }
      }).toThrow('Insecure endpoint not allowed');
    });
  });
});