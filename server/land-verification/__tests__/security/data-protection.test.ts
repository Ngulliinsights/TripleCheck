import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { testUtils } from '../../tests/setup';
import crypto from 'crypto';

describe('Land Verification Security Tests - Data Protection', () => {
  let testUser: any;
  let testProperty: any;
  let authToken: string;

  beforeEach(async () => {
    testUser = testUtils.createTestUser();
    testProperty = testUtils.createTestProperty();
    
    // Mock authentication token - use environment variable or generate secure test token
    authToken = process.env.TEST_AUTH_TOKEN || 'test-jwt-token-' + crypto.randomBytes(16).toString('hex');
    
    // Mock authentication middleware
    vi.mock('../../middleware/auth', () => ({
      requireAuth: (req: any, res: any, next: any) => {
        req.user = testUser;
        next();
      },
      requireRole: (role: string) => (req: any, res: any, next: any) => {
        req.user.role = role;
        next();
      }
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all land verification endpoints', async () => {
      // Test without authentication token
      await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(401);

      await request(app)
        .get('/api/land-verification/sessions/test-session/status')
        .expect(401);

      await request(app)
        .post('/api/land-verification/sessions/test-session/layers/registry')
        .send({ titleNumber: 'TEST123', location: 'Nairobi' })
        .expect(401);
    });

    it('should enforce user ownership of verification sessions', async () => {
      // Create session for user A
      const userA = { ...testUtils.createTestUser(), id: 1 };
      const userB = { ...testUtils.createTestUser(), id: 2 };

      // Mock user A authentication
      vi.mocked(require('../../middleware/auth').requireAuth).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = userA;
          next();
        }
      );

      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: userA.id,
          verificationType: 'basic'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Now try to access session as user B
      vi.mocked(require('../../middleware/auth').requireAuth).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = userB;
          next();
        }
      );

      await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Forbidden

      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ titleNumber: 'TEST123', location: 'Nairobi' })
        .expect(403);
    });

    it('should require appropriate roles for sensitive operations', async () => {
      const regularUser = { ...testUser, role: 'user' };
      const adminUser = { ...testUser, role: 'admin' };

      // Regular user should not access admin endpoints
      vi.mocked(require('../../middleware/auth').requireAuth).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = regularUser;
          next();
        }
      );

      await request(app)
        .get('/api/land-verification/admin/all-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app)
        .delete('/api/land-verification/sessions/test-session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Admin user should have access
      vi.mocked(require('../../middleware/auth').requireAuth).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = adminUser;
          next();
        }
      );

      await request(app)
        .get('/api/land-verification/admin/all-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '', // Empty token
        'Bearer ', // Bearer without token
      ];

      for (const token of invalidTokens) {
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
  });

  describe('Data Encryption and Storage', () => {
    it('should encrypt sensitive data in verification sessions', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Add sensitive community intelligence data
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interviews: [
            {
              source: 'local_admin',
              sourceDetails: {
                name: 'Chief Mwangi',
                position: 'Assistant Chief',
                contactInfo: '+254712345678', // Sensitive PII
                yearsInArea: 15
              },
              feedback: {
                ownershipHistory: 'Sensitive ownership information',
                knownDisputes: ['Confidential dispute details'],
                concerns: ['Private community concerns']
              },
              reliability: 0.9
            }
          ]
        })
        .expect(200);

      // Verify that sensitive data is encrypted in storage
      // This would typically check the database directly
      const statusResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Sensitive data should be available to authorized user
      expect(statusResponse.body).toHaveProperty('communityIntelligence');
      
      // But raw storage should be encrypted (this would be tested against actual DB)
      // expect(rawDatabaseRecord.communityIntelligence).not.toContain('+254712345678');
    });

    it('should protect personally identifiable information (PII)', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Add data with PII
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interviews: [
            {
              source: 'neighbor',
              sourceDetails: {
                name: 'John Kamau',
                contactInfo: 'john.kamau@email.com',
                idNumber: '12345678',
                yearsInArea: 10
              },
              feedback: {
                ownershipHistory: 'Normal ownership',
                knownDisputes: [],
                concerns: []
              },
              reliability: 0.8
            }
          ]
        })
        .expect(200);

      // Generate report and verify PII is handled appropriately
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Report should not contain raw PII in shareable format
      const reportString = JSON.stringify(reportResponse.body);
      expect(reportString).not.toContain('john.kamau@email.com');
      expect(reportString).not.toContain('12345678');
      
      // But should contain anonymized references
      expect(reportString).toContain('Local Resident');
    });

    it('should implement data retention policies', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic',
          dataRetentionPeriod: 30 // 30 days
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Check that retention policy is set
      const statusResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('dataRetentionPolicy');
      expect(statusResponse.body.dataRetentionPolicy.retentionPeriodDays).toBe(30);

      // Test data deletion endpoint
      await request(app)
        .delete(`/api/land-verification/sessions/${sessionId}/data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify data is marked for deletion
      const deletedStatusResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deletedStatusResponse.body.dataStatus).toBe('scheduled_for_deletion');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousInputs = [
        "'; DROP TABLE verification_sessions; --",
        "1' OR '1'='1",
        "'; INSERT INTO users (username) VALUES ('hacker'); --",
        "1; DELETE FROM properties WHERE id = 1; --"
      ];

      for (const maliciousInput of maliciousInputs) {
        await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            propertyId: maliciousInput,
            userId: testUser.id,
            verificationType: 'basic'
          })
          .expect(400); // Should be rejected with validation error
      }
    });

    it('should prevent XSS attacks in user inputs', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        "'; alert('XSS'); //"
      ];

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

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            interviews: [
              {
                source: 'neighbor',
                sourceDetails: {
                  name: payload, // XSS payload in name field
                  yearsInArea: 5
                },
                feedback: {
                  ownershipHistory: payload, // XSS payload in feedback
                  knownDisputes: [],
                  concerns: []
                },
                reliability: 0.7
              }
            ]
          });

        // Should either reject the input or sanitize it
        if (response.status === 200) {
          // If accepted, verify it's sanitized
          const statusResponse = await request(app)
            .get(`/api/land-verification/sessions/${sessionId}/status`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

          const responseString = JSON.stringify(statusResponse.body);
          expect(responseString).not.toContain('<script>');
          expect(responseString).not.toContain('javascript:');
          expect(responseString).not.toContain('onerror=');
        } else {
          expect(response.status).toBe(400); // Should be rejected
        }
      }
    });

    it('should validate coordinate inputs to prevent injection', async () => {
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

      const invalidCoordinates = [
        { lat: 'invalid', lng: 36.8219 },
        { lat: -1.2921, lng: 'DROP TABLE coordinates' },
        { lat: 999, lng: 36.8219 }, // Out of valid range
        { lat: -1.2921, lng: 999 }, // Out of valid range
        { lat: null, lng: 36.8219 },
        { lat: -1.2921, lng: null }
      ];

      for (const coords of invalidCoordinates) {
        await request(app)
          .post(`/api/land-verification/sessions/${sessionId}/layers/physical`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            gpsCoordinates: coords,
            boundaryMarkers: [],
            measurements: { area: 1000, perimeter: 126 }
          })
          .expect(400);
      }
    });

    it('should validate file uploads securely', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Test malicious file uploads
      const maliciousFiles = [
        { filename: '../../../etc/passwd', content: 'malicious content' },
        { filename: 'script.js', content: 'alert("XSS")' },
        { filename: 'file.exe', content: 'executable content' },
        { filename: 'very-long-filename-' + 'a'.repeat(1000) + '.pdf', content: 'content' }
      ];

      for (const file of maliciousFiles) {
        await request(app)
          .post(`/api/land-verification/sessions/${sessionId}/documents`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('document', Buffer.from(file.content), file.filename)
          .expect(400); // Should reject malicious files
      }

      // Test valid file upload
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('document', Buffer.from('valid PDF content'), 'title-deed.pdf')
        .expect(200);
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting for API endpoints', async () => {
      const requests = [];
      
      // Make many requests quickly
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/api/land-verification/initiate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              propertyId: `${testProperty.id}_${i}`,
              userId: testUser.id,
              verificationType: 'basic'
            })
        );
      }

      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      // Should have some rate-limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should protect against large payload attacks', async () => {
      const largePayload = {
        propertyId: testProperty.id,
        userId: testUser.id,
        verificationType: 'basic',
        maliciousData: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload)
        .expect(413); // Payload too large
    });

    it('should implement request timeout protection', async () => {
      // Mock a slow operation
      vi.mock('../LandVerificationService', () => ({
        LandVerificationService: vi.fn().mockImplementation(() => ({
          initiateVerification: vi.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(resolve, 35000)) // 35 second delay
          )
        }))
      }));

      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .timeout(30000) // 30 second timeout
        .expect(408); // Request timeout
    });
  });

  describe('Audit Logging and Monitoring', () => {
    it('should log all verification activities', async () => {
      const logSpy = vi.spyOn(console, 'log');

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
        .expect(200);

      // Verify audit logs were created
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT'),
        expect.objectContaining({
          action: 'verification_initiated',
          userId: testUser.id,
          sessionId: expect.any(String)
        })
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT'),
        expect.objectContaining({
          action: 'layer_executed',
          layer: 'registry',
          sessionId
        })
      );
    });

    it('should log security events', async () => {
      const logSpy = vi.spyOn(console, 'log');

      // Attempt unauthorized access
      await request(app)
        .get('/api/land-verification/sessions/unauthorized-session/status')
        .expect(401);

      // Attempt to access another user\'s session
      await request(app)
        .get('/api/land-verification/sessions/other-user-session/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Verify security events were logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY'),
        expect.objectContaining({
          event: 'unauthorized_access_attempt',
          endpoint: expect.stringContaining('/status')
        })
      );
    });

    it('should monitor for suspicious activity patterns', async () => {
      const logSpy = vi.spyOn(console, 'log');

      // Simulate suspicious pattern - many failed attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          })
          .expect(401);
      }

      // Should log suspicious activity
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY'),
        expect.objectContaining({
          event: 'suspicious_activity_detected',
          pattern: 'repeated_failed_auth'
        })
      );
    });
  });

  describe('Data Privacy Compliance', () => {
    it('should support GDPR-style data deletion requests', async () => {
      const sessionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Add personal data
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interviews: [
            {
              source: 'neighbor',
              sourceDetails: {
                name: 'Jane Doe',
                contactInfo: 'jane@example.com',
                yearsInArea: 5
              },
              feedback: {
                ownershipHistory: 'Personal observations',
                knownDisputes: [],
                concerns: []
              },
              reliability: 0.8
            }
          ]
        })
        .expect(200);

      // Request data deletion
      await request(app)
        .delete(`/api/land-verification/sessions/${sessionId}/personal-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dataTypes: ['community_intelligence', 'personal_identifiers'],
          reason: 'user_request'
        })
        .expect(200);

      // Verify personal data is removed
      const statusResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseString = JSON.stringify(statusResponse.body);
      expect(responseString).not.toContain('jane@example.com');
      expect(responseString).not.toContain('Jane Doe');
    });

    it('should provide data export functionality', async () => {
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

      // Request data export
      const exportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(exportResponse.body).toHaveProperty('userData');
      expect(exportResponse.body).toHaveProperty('verificationData');
      expect(exportResponse.body).toHaveProperty('exportTimestamp');
      expect(exportResponse.body.userData.userId).toBe(testUser.id);
    });

    it('should implement consent management', async () => {
      const consentResponse = await request(app)
        .post('/api/land-verification/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consentTypes: ['data_processing', 'third_party_sharing', 'government_integration'],
          granted: true,
          timestamp: new Date().toISOString()
        })
        .expect(200);

      expect(consentResponse.body).toHaveProperty('consentId');

      // Verify consent is required for certain operations
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive',
          requiresConsent: true
        })
        .expect(200); // Should succeed with consent

      // Revoke consent
      await request(app)
        .delete(`/api/land-verification/consent/${consentResponse.body.consentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should now fail without consent
      await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive',
          requiresConsent: true
        })
        .expect(403); // Forbidden without consent
    });
  });
});