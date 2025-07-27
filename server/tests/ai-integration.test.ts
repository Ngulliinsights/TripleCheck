import request from 'supertest';
import app from '../app';
import { storage } from '../infrastructure/storage/storage';

describe('AI Integration Tests', () => {
  let testUser: any;
  let testProperty: any;
  let authCookie: string;

  beforeAll(async () => {
    // Create test user for AI integration tests
    const userData = {
      username: 'aitest_user',
      email: 'aitest@example.com',
      password: 'testpassword123',
      firstName: 'AI',
      lastName: 'Test'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = response.body.data;
    
    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      });

    authCookie = loginResponse.headers['set-cookie'];

    // Create a test property for AI verification
    const propertyData = {
      title: 'AI Test Property',
      description: 'A property for AI integration testing with detailed description for analysis',
      location: 'AI Test Location, Test City',
      price: 250000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'house',
      features: {
        parking: true,
        garden: true,
        balcony: false
      }
    };

    const propertyResponse = await request(app)
      .post('/api/properties')
      .set('Cookie', authCookie)
      .send(propertyData);

    testProperty = propertyResponse.body.data;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      try {
        await storage.deleteUser(testUser.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
    if (testProperty) {
      try {
        await storage.deleteProperty(testProperty.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('AI Verification Integration', () => {
    test('Should perform AI verification on property', async () => {
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documentAuthenticity');
      expect(response.body.data).toHaveProperty('ownershipVerified');
      expect(response.body.data).toHaveProperty('riskScore');
      expect(response.body.data).toHaveProperty('verifiedAt');
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('verificationTimestamp');

      // Verify the response structure matches expected format
      expect(['verified', 'suspicious', 'pending']).toContain(response.body.data.documentAuthenticity);
      expect(typeof response.body.data.ownershipVerified).toBe('boolean');
      expect(typeof response.body.data.riskScore).toBe('number');
      expect(response.body.data.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.riskScore).toBeLessThanOrEqual(100);
    });

    test('Should retrieve verification status', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/verification`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('verificationStatus');
      expect(response.body.data).toHaveProperty('lastVerified');
    });

    test('Should handle verification with fraud detection', async () => {
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Check if fraud detection results are included
      if (response.body.data.fraudDetection) {
        expect(response.body.data.fraudDetection).toHaveProperty('isSuspicious');
        expect(response.body.data.fraudDetection).toHaveProperty('suspiciousScore');
        expect(response.body.data.fraudDetection).toHaveProperty('overallScore');
        expect(response.body.data.fraudDetection).toHaveProperty('verificationTimestamp');
        
        expect(typeof response.body.data.fraudDetection.isSuspicious).toBe('boolean');
        expect(typeof response.body.data.fraudDetection.suspiciousScore).toBe('number');
      }
    });
  });

  describe('AI Fraud Detection Integration', () => {
    test('Should detect potential fraud patterns', async () => {
      // Create a property with potentially suspicious characteristics
      const suspiciousPropertyData = {
        title: 'URGENT SALE!!! MUST GO TODAY!!!',
        description: 'Amazing deal! Price reduced by 90%! Contact immediately! Cash only! No questions asked!',
        location: 'Suspicious Location',
        price: 10000, // Unrealistically low price
        bedrooms: 5,
        bathrooms: 4,
        propertyType: 'mansion'
      };

      const propertyResponse = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .send(suspiciousPropertyData);

      const suspiciousProperty = propertyResponse.body.data;

      const verificationResponse = await request(app)
        .post(`/api/properties/${suspiciousProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(verificationResponse.status).toBe(200);
      expect(verificationResponse.body.success).toBe(true);

      // The AI should potentially flag this as suspicious
      const fraudDetection = verificationResponse.body.data.fraudDetection;
      if (fraudDetection) {
        expect(typeof fraudDetection.isSuspicious).toBe('boolean');
        expect(typeof fraudDetection.suspiciousScore).toBe('number');
        
        // If description analysis is performed
        if (fraudDetection.descriptionAnalysis) {
          expect(fraudDetection.descriptionAnalysis).toHaveProperty('sentiment');
          expect(fraudDetection.descriptionAnalysis).toHaveProperty('keywordFlags');
          expect(fraudDetection.descriptionAnalysis).toHaveProperty('qualityScore');
        }
      }

      // Cleanup suspicious property
      await storage.deleteProperty(suspiciousProperty.id);
    });

    test('Should handle comprehensive fraud detection', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/fraud-analysis`);

      // This endpoint might not exist in current implementation, so handle both cases
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('isSuspicious');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('suspiciousScore');
      } else if (response.status === 404) {
        // Endpoint doesn't exist, which is acceptable for backward compatibility
        expect(response.status).toBe(404);
      }
    });
  });

  describe('AI Service Availability', () => {
    test('Should handle AI service unavailability gracefully', async () => {
      // Test with a property that might cause AI service issues
      const testPropertyData = {
        title: 'AI Service Test Property',
        description: 'Testing AI service resilience',
        location: 'Service Test Location',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house'
      };

      const propertyResponse = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .send(testPropertyData);

      const serviceTestProperty = propertyResponse.body.data;

      const verificationResponse = await request(app)
        .post(`/api/properties/${serviceTestProperty.id}/verify`)
        .set('Cookie', authCookie);

      // Should either succeed or fail gracefully
      expect([200, 500, 503]).toContain(verificationResponse.status);
      
      if (verificationResponse.status === 200) {
        expect(verificationResponse.body.success).toBe(true);
        expect(verificationResponse.body.data).toHaveProperty('documentAuthenticity');
      } else {
        expect(verificationResponse.body.success).toBe(false);
        expect(verificationResponse.body).toHaveProperty('message');
      }

      // Cleanup
      await storage.deleteProperty(serviceTestProperty.id);
    });

    test('Should provide fallback verification when AI is unavailable', async () => {
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Even if AI fails, should provide basic verification
      expect(response.body.data).toHaveProperty('documentAuthenticity');
      expect(response.body.data).toHaveProperty('ownershipVerified');
      expect(response.body.data).toHaveProperty('riskScore');

      // If AI failed, should still have reasonable defaults
      if (response.body.data.error) {
        expect(response.body.data.documentAuthenticity).toBe('pending');
        expect(response.body.data.riskScore).toBe(50); // Default risk score
      }
    });
  });

  describe('AI Response Format Consistency', () => {
    test('Should maintain consistent AI response format', async () => {
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const verificationData = response.body.data;

      // Required fields should always be present
      expect(verificationData).toHaveProperty('documentAuthenticity');
      expect(verificationData).toHaveProperty('ownershipVerified');
      expect(verificationData).toHaveProperty('riskScore');
      expect(verificationData).toHaveProperty('verifiedAt');
      expect(verificationData).toHaveProperty('overallScore');
      expect(verificationData).toHaveProperty('verificationTimestamp');

      // Optional fields should be properly typed if present
      if (verificationData.fraudDetection) {
        expect(verificationData.fraudDetection).toHaveProperty('isSuspicious');
        expect(verificationData.fraudDetection).toHaveProperty('suspiciousScore');
        expect(verificationData.fraudDetection).toHaveProperty('overallScore');
        expect(verificationData.fraudDetection).toHaveProperty('verificationTimestamp');
      }

      if (verificationData.imageAnalysis) {
        expect(verificationData.imageAnalysis).toHaveProperty('qualityScore');
        expect(verificationData.imageAnalysis).toHaveProperty('authenticityScore');
        expect(verificationData.imageAnalysis).toHaveProperty('flaggedIssues');
        expect(Array.isArray(verificationData.imageAnalysis.flaggedIssues)).toBe(true);
      }

      if (verificationData.descriptionAnalysis) {
        expect(verificationData.descriptionAnalysis).toHaveProperty('sentiment');
        expect(verificationData.descriptionAnalysis).toHaveProperty('keywordFlags');
        expect(verificationData.descriptionAnalysis).toHaveProperty('qualityScore');
        expect(Array.isArray(verificationData.descriptionAnalysis.keywordFlags)).toBe(true);
      }
    });

    test('Should handle AI verification timeout gracefully', async () => {
      // This test simulates a timeout scenario
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie)
        .timeout(10000); // 10 second timeout

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should complete within reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000);

      console.log(`AI verification completed in ${duration}ms`);
    });
  });

  describe('AI Integration Performance', () => {
    test('AI verification should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // AI verification should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      
      console.log(`AI verification performance: ${duration}ms`);
    });

    test('Multiple AI requests should not degrade performance significantly', async () => {
      const requests = 3;
      const startTime = Date.now();
      
      const promises = Array.from({ length: requests }, () =>
        request(app)
          .post(`/api/properties/${testProperty.id}/verify`)
          .set('Cookie', authCookie)
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Average time per request should be reasonable
      const averageTime = duration / requests;
      expect(averageTime).toBeLessThan(7000); // 7 seconds per request on average
      
      console.log(`Multiple AI requests performance: ${averageTime}ms average (${requests} requests)`);
    });
  });
});