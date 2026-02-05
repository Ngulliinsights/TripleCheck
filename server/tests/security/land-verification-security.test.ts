import { describe, it, expect, beforeAll, afterAll } from '..\..\..\src\shared\test-utils\index';
import request from '..\..\..\scripts\cleanup-redundancies';
import { app } from '../../app';
import { database } from '../../lib/database';
import crypto from '..\..\..\scripts\cleanup-redundancies';

describe('Land Verification Security Tests', () => {
  let validAuthToken: string;
  let validUserId: string;
  let testPropertyId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Create test user
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'security-test@example.com',
        password: testPassword,
        name: 'Security Test User'
      });

    validAuthToken = userResponse.body.token;
    validUserId = userResponse.body.user.id;

    // Create test property
    const propertyResponse = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${validAuthToken}`)
      .send({
        title: 'Security Test Property',
        description: 'Property for security testing',
        price: 2000000,
        location: {
          county: 'Nairobi',
          area: 'Security Test Area',
          coordinates: {
            latitude: -1.2921,
            longitude: 36.8219
          }
        },
        propertyType: 'land',
        size: 1.0,
        sizeUnit: 'acres'
      });

    testPropertyId = propertyResponse.body.property.id;

    // Create test verification session
    const sessionResponse = await request(app)
      .post('/api/land-verification/initiate')
      .set('Authorization', `Bearer ${validAuthToken}`)
      .send({
        propertyId: testPropertyId
      });

    testSessionId = sessionResponse.body.session.id;
  });

  afterAll(async () => {
    // Cleanup
    await database.query('DELETE FROM land_verification_sessions WHERE id = ?', [testSessionId]);
    await database.query('DELETE FROM properties WHERE id = ?', [testPropertyId]);
    await database.query('DELETE FROM users WHERE id = ?', [validUserId]);
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testPropertyId
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/authentication/i);
    });

    it('should reject requests with invalid authentication token', async () => {
      const response = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({
          propertyId: testPropertyId
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid.*token/i);
    });

    it('should reject requests with expired authentication token', async () => {
      // Create an expired token (this would need to be implemented based on your JWT setup)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          propertyId: testPropertyId
        });

      expect(response.status).toBe(401);
    });

    it('should prevent access to other users verification sessions', async () => {
      // Create second user
      const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security-test-2@example.com',
          password: testPassword,
          name: 'Security Test User 2'
        });

      const user2Token = user2Response.body.token;
      const user2Id = user2Response.body.user.id;

      // Try to access first user's session with second user's token
      const response = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/access.*denied|forbidden/i);

      // Cleanup
      await database.query('DELETE FROM users WHERE id = ?', [user2Id]);
    });

    it('should validate property ownership before allowing verification', async () => {
      // Create second user
      const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security-test-3@example.com',
          password: testPassword,
          name: 'Security Test User 3'
        });

      const user2Token = user2Response.body.token;
      const user2Id = user2Response.body.user.id;

      // Try to initiate verification on property owned by different user
      const response = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          propertyId: testPropertyId
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/property.*access|ownership/i);

      // Cleanup
      await database.query('DELETE FROM users WHERE id = ?', [user2Id]);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE land_verification_sessions; --",
        "' OR '1'='1",
        "'; DELETE FROM users WHERE '1'='1'; --",
        "' UNION SELECT * FROM users --"
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            propertyId: maliciousInput
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid.*input|validation/i);
      }
    });

    it('should reject XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        "'; alert('xss'); //"
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post(`/api/land-verification/sessions/${testSessionId}/layers/registry`)
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            titleNumber: payload,
            ownerName: 'Test Owner'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid.*input|validation/i);
      }
    });

    it('should validate file uploads securely', async () => {
      // Test malicious file upload
      const maliciousFile = Buffer.from('<?php system($_GET["cmd"]); ?>');
      
      const response = await request(app)
        .post(`/api/land-verification/sessions/${testSessionId}/documents`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .attach('document', maliciousFile, 'malicious.php')
        .field('documentType', 'title_deed');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid.*file|unsupported.*format/i);
    });

    it('should enforce file size limits', async () => {
      // Create a large file (simulate 50MB file)
      const largeFile = Buffer.alloc(50 * 1024 * 1024, 'a');
      
      const response = await request(app)
        .post(`/api/land-verification/sessions/${testSessionId}/documents`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .attach('document', largeFile, 'large-document.pdf')
        .field('documentType', 'title_deed');

      expect(response.status).toBe(413);
      expect(response.body.error).toMatch(/file.*too.*large|size.*limit/i);
    });

    it('should validate coordinate inputs', async () => {
      const invalidCoordinates = [
        { latitude: 'invalid', longitude: 36.8219 },
        { latitude: -1.2921, longitude: 'invalid' },
        { latitude: 200, longitude: 36.8219 }, // Invalid latitude
        { latitude: -1.2921, longitude: 200 }, // Invalid longitude
        { latitude: null, longitude: 36.8219 },
        { latitude: -1.2921, longitude: null }
      ];

      for (const coords of invalidCoordinates) {
        const response = await request(app)
          .post(`/api/land-verification/sessions/${testSessionId}/layers/physical`)
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            coordinates: coords
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid.*coordinate|validation/i);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting for verification initiation', async () => {
      const requests = [];
      const maxRequests = 20; // Assuming rate limit is lower than this

      // Make many rapid requests
      for (let i = 0; i < maxRequests; i++) {
        const request_promise = request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            propertyId: testPropertyId
          });
        
        requests.push(request_promise);
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Rate limited responses should have appropriate headers
      rateLimitedResponses.forEach(response => {
        expect(response.headers['retry-after']).toBeDefined();
        expect(response.body.error).toMatch(/rate.*limit|too.*many.*requests/i);
      });
    });

    it('should protect against large payload attacks', async () => {
      // Create extremely large payload
      const largePayload = {
        propertyId: testPropertyId,
        metadata: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      const response = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(largePayload);

      expect(response.status).toBe(413);
      expect(response.body.error).toMatch(/payload.*too.*large|request.*entity.*too.*large/i);
    });

    it('should handle concurrent request flooding gracefully', async () => {
      const concurrentRequests = 100;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app)
          .get(`/api/land-verification/sessions/${testSessionId}/status`)
          .set('Authorization', `Bearer ${validAuthToken}`);
        
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      // Server should not crash and should handle requests
      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      const errorResponses = responses.filter(r => r.status >= 500);

      // Should have some successful responses
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // Should not have server errors (500+)
      expect(errorResponses.length).toBe(0);
      
      // May have rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should not expose sensitive data in error messages', async () => {
      // Try to access non-existent session
      const response = await request(app)
        .get('/api/land-verification/sessions/non-existent-session-id/status')
        .set('Authorization', `Bearer ${validAuthToken}`);

      expect(response.status).toBe(404);
      
      // Error message should not contain sensitive information
      const errorMessage = response.body.error.toLowerCase();
      expect(errorMessage).not.toMatch(/database|sql|internal|stack|trace/);
      expect(errorMessage).not.toContain(validUserId);
      expect(errorMessage).not.toContain(testPropertyId);
    });

    it('should encrypt sensitive data in transit', async () => {
      // This test would verify HTTPS enforcement in production
      // For now, we'll check that sensitive data is not logged in plain text
      
      const response = await request(app)
        .post(`/api/land-verification/sessions/${testSessionId}/layers/community`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          communityFeedback: {
            sensitiveInformation: 'This contains personal details about community members',
            contactInfo: 'john.doe@example.com',
            phoneNumber: '+254700123456'
          }
        });

      // Response should not echo back sensitive information
      expect(response.body).not.toContain('john.doe@example.com');
      expect(response.body).not.toContain('+254700123456');
    });

    it('should implement proper session management', async () => {
      // Test session fixation protection
      const initialResponse = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${validAuthToken}`);

      expect(initialResponse.status).toBe(200);
      
      // Simulate session hijacking attempt
      const hijackResponse = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .set('X-Forwarded-For', '192.168.1.100') // Different IP
        .set('User-Agent', 'Different-User-Agent');

      // Should still work for legitimate user but may trigger additional security checks
      expect([200, 401, 403]).toContain(hijackResponse.status);
    });

    it('should sanitize data before database storage', async () => {
      const maliciousData = {
        titleNumber: '<script>alert("stored-xss")</script>',
        ownerName: '"; DROP TABLE users; --',
        notes: 'javascript:void(0)'
      };

      const response = await request(app)
        .post(`/api/land-verification/sessions/${testSessionId}/layers/registry`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(maliciousData);

      // Should either reject the data or sanitize it
      if (response.status === 200) {
        // If accepted, verify data was sanitized
        const statusResponse = await request(app)
          .get(`/api/land-verification/sessions/${testSessionId}/status`)
          .set('Authorization', `Bearer ${validAuthToken}`);

        const responseText = JSON.stringify(statusResponse.body);
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('DROP TABLE');
        expect(responseText).not.toContain('javascript:');
      } else {
        // Should be rejected with validation error
        expect(response.status).toBe(400);
      }
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${validAuthToken}`);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should not expose server information', async () => {
      const response = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${validAuthToken}`);

      // Should not expose server details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Cryptographic Security', () => {
    it('should use secure random values for session IDs', async () => {
      const sessions = [];
      
      // Create multiple sessions
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            propertyId: testPropertyId
          });

        expect(response.status).toBe(201);
        sessions.push(response.body.session.id);
      }

      // All session IDs should be unique
      const uniqueSessions = new Set(sessions);
      expect(uniqueSessions.size).toBe(sessions.length);

      // Session IDs should be sufficiently random (basic entropy check)
      sessions.forEach(sessionId => {
        expect(sessionId).toMatch(/^[a-zA-Z0-9-_]{20,}$/); // At least 20 characters
        expect(sessionId).not.toMatch(/^(123|abc|test)/i); // Not predictable
      });
    });

    it('should properly hash sensitive data', async () => {
      // This test would verify that passwords and other sensitive data are properly hashed
      // We'll test by ensuring plain text sensitive data is not returned in responses
      
      const response = await request(app)
        .get(`/api/land-verification/sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${validAuthToken}`);

      const responseText = JSON.stringify(response.body);
      
      // Should not contain common plain text patterns
      expect(responseText).not.toMatch(/password.*[:=]\s*["'][^"']{6,}["']/i);
      expect(responseText).not.toMatch(/secret.*[:=]\s*["'][^"']{6,}["']/i);
      expect(responseText).not.toMatch(/key.*[:=]\s*["'][^"']{20,}["']/i);
    });
  });

  describe('Business Logic Security', () => {
    it('should prevent verification session manipulation', async () => {
      // Try to manipulate session status directly
      const response = await request(app)
        .put(`/api/land-verification/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          status: 'completed',
          riskAssessment: {
            overallRiskScore: 0,
            riskLevel: 'low'
          }
        });

      // Should not allow direct manipulation
      expect(response.status).toBe(405); // Method not allowed or 403 Forbidden
    });

    it('should validate business rules for layer completion', async () => {
      // Try to complete a layer without required data
      const response = await request(app)
        .post(`/api/land-verification/sessions/${testSessionId}/layers/registry`)
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/required.*field|validation/i);
    });

    it('should prevent privilege escalation', async () => {
      // Try to access admin-only functionality
      const response = await request(app)
        .post('/api/land-verification/admin/reset-all-sessions')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });
});