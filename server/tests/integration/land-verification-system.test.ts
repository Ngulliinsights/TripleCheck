import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { LandVerificationService } from '../../land-verification/LandVerificationService';
import { DocumentIntegration } from '../../land-verification/DocumentIntegration';
import { PropertyService } from '../../services/PropertyService';
import { TrustScoringService } from '../../trust/TrustScoringService';
import { database } from '../../lib/database';

describe('Land Verification System Integration Tests', () => {
  let landVerificationService: LandVerificationService;
  let documentIntegration: DocumentIntegration;
  let propertyService: PropertyService;
  let trustScoringService: TrustScoringService;
  let testPropertyId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Initialize services
    landVerificationService = new LandVerificationService();
    documentIntegration = new DocumentIntegration();
    propertyService = new PropertyService();
    trustScoringService = new TrustScoringService();

    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test-land-verification@example.com',
        password: 'TestPassword123!',
        name: 'Land Verification Test User'
      });

    testUserId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    // Create test property
    const propertyResponse = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Property for Land Verification',
        description: 'A test property in Nairobi for land verification testing',
        price: 5000000,
        location: {
          county: 'Nairobi',
          area: 'Westlands',
          coordinates: {
            latitude: -1.2921,
            longitude: 36.8219
          }
        },
        propertyType: 'land',
        size: 0.5,
        sizeUnit: 'acres'
      });

    testPropertyId = propertyResponse.body.property.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPropertyId) {
      await database.query('DELETE FROM properties WHERE id = ?', [testPropertyId]);
    }
    if (testUserId) {
      await database.query('DELETE FROM users WHERE id = ?', [testUserId]);
    }
  });

  beforeEach(async () => {
    // Clean up any existing verification sessions
    await database.query('DELETE FROM land_verification_sessions WHERE property_id = ?', [testPropertyId]);
  });

  describe('Land Verification Service Integration', () => {
    it('should integrate with existing property service', async () => {
      // Test that land verification can access property data
      const property = await propertyService.getPropertyById(testPropertyId);
      expect(property).toBeDefined();
      expect(property.id).toBe(testPropertyId);

      // Initiate land verification
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      expect(session).toBeDefined();
      expect(session.propertyId).toBe(testPropertyId);
      expect(session.userId).toBe(testUserId);
      expect(session.status).toBe('initiated');
    });

    it('should integrate with document authentication service', async () => {
      // Create a verification session
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);

      // Test document integration
      const mockDocument = {
        type: 'title_deed',
        content: 'Mock title deed content',
        metadata: {
          titleNumber: 'NAIROBI/BLOCK1/123',
          registrationDate: '2020-01-15'
        }
      };

      const documentResult = await documentIntegration.verifyLandDocument({
        sessionId: session.id,
        document: mockDocument,
        propertyId: testPropertyId
      });

      expect(documentResult).toBeDefined();
      expect(documentResult.isValid).toBeDefined();
      expect(documentResult.landSpecificChecks).toBeDefined();
    });

    it('should integrate with trust scoring service', async () => {
      // Create a verification session and complete some layers
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      // Mock completing registry verification layer
      await landVerificationService.executeVerificationLayer(session.id, {
        type: 'registry',
        status: 'completed',
        results: [{
          type: 'registry_check',
          status: 'passed',
          data: {
            ownershipVerified: true,
            titleValid: true,
            noDisputes: true
          },
          confidence: 0.9
        }]
      });

      // Generate risk assessment
      const riskAssessment = await landVerificationService.generateRiskAssessment(session.id);
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(riskAssessment.overallRiskScore).toBeLessThanOrEqual(100);

      // Test integration with trust scoring
      const property = await propertyService.getPropertyById(testPropertyId);
      const trustScore = await trustScoringService.calculateTrustScore(property);
      expect(trustScore).toBeDefined();
      expect(trustScore.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('API Integration Tests', () => {
    it('should handle complete land verification workflow via API', async () => {
      // Step 1: Initiate verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testPropertyId
        });

      expect(initiateResponse.status).toBe(201);
      expect(initiateResponse.body.session).toBeDefined();
      const sessionId = initiateResponse.body.session.id;

      // Step 2: Execute registry verification layer
      const registryResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleNumber: 'NAIROBI/BLOCK1/123',
          ownerName: 'Test Owner'
        });

      expect(registryResponse.status).toBe(200);
      expect(registryResponse.body.result).toBeDefined();

      // Step 3: Get verification status
      const statusResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.session).toBeDefined();
      expect(statusResponse.body.session.completedLayers).toContain('registry');

      // Step 4: Generate risk assessment
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(riskResponse.status).toBe(200);
      expect(riskResponse.body.riskAssessment).toBeDefined();
      expect(riskResponse.body.riskAssessment.overallRiskScore).toBeDefined();
    });

    it('should integrate land verification results with property listings', async () => {
      // Create and complete a verification session
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      // Complete multiple verification layers
      await landVerificationService.executeVerificationLayer(session.id, {
        type: 'registry',
        status: 'completed',
        results: [{
          type: 'registry_check',
          status: 'passed',
          data: { ownershipVerified: true },
          confidence: 0.9
        }]
      });

      await landVerificationService.executeVerificationLayer(session.id, {
        type: 'physical',
        status: 'completed',
        results: [{
          type: 'boundary_check',
          status: 'passed',
          data: { boundariesMatch: true },
          confidence: 0.8
        }]
      });

      // Generate final risk assessment
      const riskAssessment = await landVerificationService.generateRiskAssessment(session.id);

      // Check that property now shows land verification status
      const propertyResponse = await request(app)
        .get(`/api/properties/${testPropertyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(propertyResponse.status).toBe(200);
      expect(propertyResponse.body.property.landVerification).toBeDefined();
      expect(propertyResponse.body.property.landVerification.status).toBe('completed');
      expect(propertyResponse.body.property.landVerification.riskLevel).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid property ID
      const invalidResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: 'invalid-property-id'
        });

      expect(invalidResponse.status).toBe(404);

      // Test with missing authentication
      const unauthResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testPropertyId
        });

      expect(unauthResponse.status).toBe(401);

      // Test with invalid session ID
      const invalidSessionResponse = await request(app)
        .get('/api/land-verification/sessions/invalid-session-id/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(invalidSessionResponse.status).toBe(404);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle concurrent verification sessions', async () => {
      const concurrentSessions = 5;
      const promises = [];

      // Create multiple concurrent verification sessions
      for (let i = 0; i < concurrentSessions; i++) {
        const promise = request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            propertyId: testPropertyId
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      // All sessions should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.session).toBeDefined();
      });

      // Verify sessions are independent
      const sessionIds = responses.map(r => r.body.session.id);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(concurrentSessions);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Create verification session
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      // Execute multiple verification layers
      const layerPromises = [
        landVerificationService.executeVerificationLayer(session.id, {
          type: 'registry',
          status: 'completed',
          results: [{ type: 'registry_check', status: 'passed', data: {}, confidence: 0.9 }]
        }),
        landVerificationService.executeVerificationLayer(session.id, {
          type: 'physical',
          status: 'completed',
          results: [{ type: 'boundary_check', status: 'passed', data: {}, confidence: 0.8 }]
        }),
        landVerificationService.executeVerificationLayer(session.id, {
          type: 'community',
          status: 'completed',
          results: [{ type: 'community_check', status: 'passed', data: {}, confidence: 0.7 }]
        })
      ];

      await Promise.all(layerPromises);
      
      // Generate risk assessment
      await landVerificationService.generateRiskAssessment(session.id);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency across services', async () => {
      // Create verification session
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      // Complete verification layers
      await landVerificationService.executeVerificationLayer(session.id, {
        type: 'registry',
        status: 'completed',
        results: [{
          type: 'registry_check',
          status: 'passed',
          data: {
            ownershipVerified: true,
            titleNumber: 'NAIROBI/BLOCK1/123'
          },
          confidence: 0.9
        }]
      });

      // Generate risk assessment
      const riskAssessment = await landVerificationService.generateRiskAssessment(session.id);
      
      // Verify data consistency
      const sessionStatus = await landVerificationService.getVerificationStatus(session.id);
      expect(sessionStatus.riskAssessment?.id).toBe(riskAssessment.id);
      
      // Check property service integration
      const property = await propertyService.getPropertyById(testPropertyId);
      expect(property.landVerification?.sessionId).toBe(session.id);
      expect(property.landVerification?.riskLevel).toBe(riskAssessment.riskLevel);
    });

    it('should handle database transactions correctly', async () => {
      // Test that failed operations don't leave partial data
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      try {
        // Attempt an operation that should fail
        await landVerificationService.executeVerificationLayer(session.id, {
          type: 'invalid_layer' as any,
          status: 'completed',
          results: []
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify session is still in valid state
        const sessionStatus = await landVerificationService.getVerificationStatus(session.id);
        expect(sessionStatus.status).toBe('initiated');
        expect(sessionStatus.completedLayers).toHaveLength(0);
      }
    });
  });

  describe('Security Integration Tests', () => {
    it('should enforce proper authorization', async () => {
      // Create session with first user
      const session = await landVerificationService.initiateVerification(testPropertyId, testUserId);
      
      // Create second user
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-user2@example.com',
          password: 'TestPassword123!',
          name: 'Test User 2'
        });
      
      const user2Token = user2Response.body.token;
      
      // Try to access session with different user
      const unauthorizedResponse = await request(app)
        .get(`/api/land-verification/sessions/${session.id}/status`)
        .set('Authorization', `Bearer ${user2Token}`);
      
      expect(unauthorizedResponse.status).toBe(403);
      
      // Cleanup
      await database.query('DELETE FROM users WHERE id = ?', [user2Response.body.user.id]);
    });

    it('should validate input data properly', async () => {
      // Test with malicious input
      const maliciousResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testPropertyId,
          maliciousScript: '<script>alert("xss")</script>'
        });
      
      expect(maliciousResponse.status).toBe(400);
      
      // Test with SQL injection attempt
      const sqlInjectionResponse = await request(app)
        .post('/api/land-verification/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: "'; DROP TABLE properties; --"
        });
      
      expect(sqlInjectionResponse.status).toBe(400);
    });
  });
});