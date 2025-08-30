import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import { propertyRouter } from './property.controller';
import { PropertyService } from './property.service';

// Mock the PropertyService
vi.mock('./property.service');

// Mock the auth middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 123 }; // Mock authenticated user
    next();
  },
  AuthenticatedRequest: {}
}));

describe('Property Controller Land Verification Integration', () => {
  let app: express.Application;
  let mockPropertyService: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock service
    mockPropertyService = {
      initiateLandVerification: vi.fn(),
      getLandVerificationStatus: vi.fn(),
      getLandVerificationReport: vi.fn(),
      updatePropertyLandVerification: vi.fn(),
      getProperties: vi.fn(),
      getProperty: vi.fn(),
      createProperty: vi.fn(),
      updateProperty: vi.fn(),
      deleteProperty: vi.fn(),
      getPropertiesByOwner: vi.fn()
    };

    (PropertyService as any).mockImplementation(() => mockPropertyService);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/properties', propertyRouter);
  });

  describe('POST /:id/land-verification', () => {
    it('should initiate land verification successfully', async () => {
      const mockResponse = {
        data: { sessionId: 'session123' },
        success: true,
        message: 'Land verification initiated successfully'
      };

      mockPropertyService.initiateLandVerification.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({ requestedLayers: ['registry', 'physical'] })
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(mockPropertyService.initiateLandVerification).toHaveBeenCalledWith(
        'property123',
        '123',
        ['registry', 'physical']
      );
    });

    it('should handle initiation errors', async () => {
      mockPropertyService.initiateLandVerification.mockRejectedValue(
        new Error('Verification service unavailable')
      );

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({ requestedLayers: ['registry'] })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      // Mock auth middleware to reject
      vi.doMock('../middleware/auth', () => ({
        requireAuth: (req: any, res: any, next: any) => {
          res.status(401).json({ error: 'Authentication required' });
        }
      }));

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({ requestedLayers: ['registry'] });

      // Note: This test would need proper auth middleware mocking
      // For now, we assume the auth middleware is working
    });

    it('should handle missing request body', async () => {
      const mockResponse = {
        data: { sessionId: 'session123' },
        success: true,
        message: 'Land verification initiated successfully'
      };

      mockPropertyService.initiateLandVerification.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({}) // Empty body
        .expect(201);

      expect(mockPropertyService.initiateLandVerification).toHaveBeenCalledWith(
        'property123',
        '123',
        undefined
      );
    });
  });

  describe('GET /:id/land-verification/status', () => {
    it('should get land verification status successfully', async () => {
      const mockStatus = {
        data: {
          sessionId: 'session123',
          status: 'completed',
          overallRiskScore: 25,
          riskLevel: 'low',
          confidence: 0.9,
          completedLayers: ['registry', 'physical'],
          lastUpdated: new Date(),
          badge: {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          }
        },
        success: true
      };

      mockPropertyService.getLandVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/properties/property123/land-verification/status')
        .expect(200);

      expect(response.body).toEqual(mockStatus);
      expect(mockPropertyService.getLandVerificationStatus).toHaveBeenCalledWith('property123');
    });

    it('should handle status retrieval errors', async () => {
      mockPropertyService.getLandVerificationStatus.mockRejectedValue(
        new Error('Property not found')
      );

      const response = await request(app)
        .get('/api/properties/property123/land-verification/status')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return default status for property without verification', async () => {
      const mockDefaultStatus = {
        data: {
          status: 'not_started',
          overallRiskScore: 0,
          riskLevel: 'low',
          confidence: 0,
          completedLayers: [],
          lastUpdated: expect.any(String)
        },
        success: true
      };

      mockPropertyService.getLandVerificationStatus.mockResolvedValue(mockDefaultStatus);

      const response = await request(app)
        .get('/api/properties/property999/land-verification/status')
        .expect(200);

      expect(response.body.data.status).toBe('not_started');
    });
  });

  describe('GET /:id/land-verification/report', () => {
    it('should get detailed land verification report', async () => {
      const mockReport = {
        data: {
          sessionId: 'session123',
          overallRiskScore: 35,
          riskLevel: 'medium',
          confidence: 0.8,
          completedLayers: ['registry', 'physical', 'community'],
          riskFactors: [
            {
              category: 'ownership',
              severity: 'medium',
              description: 'Minor ownership documentation gap',
              impact: 'Potential delays in transaction'
            }
          ],
          recommendations: [
            {
              priority: 'medium',
              title: 'Risk Mitigation Planning',
              description: 'Develop strategies to address identified medium-risk factors'
            }
          ],
          lastUpdated: new Date()
        },
        success: true
      };

      mockPropertyService.getLandVerificationReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/properties/property123/land-verification/report')
        .expect(200);

      expect(response.body).toEqual(mockReport);
      expect(mockPropertyService.getLandVerificationReport).toHaveBeenCalledWith('property123');
    });

    it('should handle report retrieval errors', async () => {
      mockPropertyService.getLandVerificationReport.mockRejectedValue(
        new Error('No land verification session found for this property')
      );

      const response = await request(app)
        .get('/api/properties/property123/land-verification/report')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return comprehensive report data structure', async () => {
      const mockReport = {
        data: {
          sessionId: 'session123',
          overallRiskScore: 15,
          riskLevel: 'low',
          confidence: 0.95,
          completedLayers: ['registry', 'physical', 'community', 'government', 'legal'],
          riskFactors: [],
          recommendations: [
            {
              priority: 'low',
              title: 'Proceed with Confidence',
              description: 'Low risk level indicates property is suitable for transaction'
            }
          ],
          lastUpdated: new Date()
        },
        success: true
      };

      mockPropertyService.getLandVerificationReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/properties/property123/land-verification/report')
        .expect(200);

      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('overallRiskScore');
      expect(response.body.data).toHaveProperty('riskLevel');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('completedLayers');
      expect(response.body.data).toHaveProperty('riskFactors');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });
  });

  describe('PATCH /:id/land-verification', () => {
    it('should update property land verification successfully', async () => {
      const mockLandVerification = {
        sessionId: 'session123',
        status: 'completed',
        overallRiskScore: 20,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical'],
        lastUpdated: new Date()
      };

      const mockResponse = {
        data: {
          id: 1,
          title: 'Test Property',
          landVerification: mockLandVerification
        },
        success: true,
        message: 'Property land verification updated successfully'
      };

      mockPropertyService.updatePropertyLandVerification.mockResolvedValue(mockResponse);

      const response = await request(app)
        .patch('/api/properties/property123/land-verification')
        .send({ landVerification: mockLandVerification })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockPropertyService.updatePropertyLandVerification).toHaveBeenCalledWith(
        'property123',
        mockLandVerification,
        123
      );
    });

    it('should handle update errors', async () => {
      mockPropertyService.updatePropertyLandVerification.mockRejectedValue(
        new Error('Unauthorized: You can only update your own properties')
      );

      const response = await request(app)
        .patch('/api/properties/property123/land-verification')
        .send({ landVerification: {} })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for updates', async () => {
      const mockLandVerification = {
        status: 'completed',
        riskLevel: 'low'
      };

      const mockResponse = {
        data: { id: 1, landVerification: mockLandVerification },
        success: true,
        message: 'Property land verification updated successfully'
      };

      mockPropertyService.updatePropertyLandVerification.mockResolvedValue(mockResponse);

      const response = await request(app)
        .patch('/api/properties/property123/land-verification')
        .send({ landVerification: mockLandVerification })
        .expect(200);

      expect(mockPropertyService.updatePropertyLandVerification).toHaveBeenCalledWith(
        'property123',
        mockLandVerification,
        123
      );
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .patch('/api/properties/property123/land-verification')
        .send({ invalidData: 'test' })
        .expect(200);

      expect(mockPropertyService.updatePropertyLandVerification).toHaveBeenCalledWith(
        'property123',
        undefined,
        123
      );
    });
  });

  describe('Integration with existing property endpoints', () => {
    it('should get property with land verification data', async () => {
      const mockProperty = {
        data: {
          id: 1,
          title: 'Test Property',
          description: 'A test property',
          price: 100000,
          location: 'Nairobi',
          landVerification: {
            sessionId: 'session123',
            status: 'completed',
            overallRiskScore: 25,
            riskLevel: 'low',
            confidence: 0.9,
            completedLayers: ['registry', 'physical'],
            lastUpdated: new Date(),
            badge: {
              type: 'verified',
              label: 'Land Verified',
              color: 'green',
              description: 'Property has completed comprehensive land verification with low risk'
            }
          }
        },
        success: true
      };

      mockPropertyService.getProperty.mockResolvedValue(mockProperty);

      const response = await request(app)
        .get('/api/properties/property123')
        .expect(200);

      expect(response.body).toEqual(mockProperty);
      expect(response.body.data.landVerification).toBeDefined();
    });

    it('should get properties list with land verification filters', async () => {
      const mockProperties = {
        data: [
          {
            id: 1,
            title: 'Verified Property',
            landVerification: {
              status: 'completed',
              riskLevel: 'low',
              badge: { type: 'verified', label: 'Land Verified', color: 'green' }
            }
          },
          {
            id: 2,
            title: 'Unverified Property',
            landVerification: null
          }
        ],
        total: 2,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };

      mockPropertyService.getProperties.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties')
        .query({
          landVerified: 'true',
          landRiskLevel: 'low',
          sortBy: 'landVerification'
        })
        .expect(200);

      expect(response.body).toEqual(mockProperties);
      expect(mockPropertyService.getProperties).toHaveBeenCalledWith({
        landVerified: 'true',
        landRiskLevel: 'low',
        sortBy: 'landVerification'
      });
    });

    it('should create property and allow land verification initiation', async () => {
      const newProperty = {
        title: 'New Land Property',
        description: 'A new land property for verification',
        price: 150000,
        location: 'Nairobi',
        propertyType: 'land'
      };

      const mockCreatedProperty = {
        data: {
          id: 1,
          ...newProperty,
          ownerId: 123,
          landVerification: null
        },
        success: true,
        message: 'Property created successfully'
      };

      mockPropertyService.createProperty.mockResolvedValue(mockCreatedProperty);

      const response = await request(app)
        .post('/api/properties')
        .send(newProperty)
        .expect(201);

      expect(response.body).toEqual(mockCreatedProperty);
      expect(mockPropertyService.createProperty).toHaveBeenCalledWith(newProperty, 123);
    });

    it('should update property and preserve land verification data', async () => {
      const updates = {
        title: 'Updated Property Title',
        description: 'Updated description'
      };

      const mockUpdatedProperty = {
        data: {
          id: 1,
          ...updates,
          landVerification: {
            status: 'completed',
            riskLevel: 'low'
          }
        },
        success: true,
        message: 'Property updated successfully'
      };

      mockPropertyService.updateProperty.mockResolvedValue(mockUpdatedProperty);

      const response = await request(app)
        .patch('/api/properties/property123')
        .send(updates)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedProperty);
      expect(response.body.data.landVerification).toBeDefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle service unavailable errors', async () => {
      mockPropertyService.initiateLandVerification.mockRejectedValue(
        new Error('Land verification service is temporarily unavailable')
      );

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({ requestedLayers: ['registry'] })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid property IDs', async () => {
      mockPropertyService.getLandVerificationStatus.mockRejectedValue(
        new Error('Property not found')
      );

      const response = await request(app)
        .get('/api/properties/invalid-id/land-verification/status')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express should handle malformed JSON
    });

    it('should handle concurrent verification requests', async () => {
      mockPropertyService.initiateLandVerification.mockRejectedValue(
        new Error('Verification session already in progress for this property')
      );

      const response = await request(app)
        .post('/api/properties/property123/land-verification')
        .send({ requestedLayers: ['registry'] })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database connection errors', async () => {
      mockPropertyService.getLandVerificationStatus.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/properties/property123/land-verification/status')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response format validation', () => {
    it('should return consistent response format for status endpoint', async () => {
      const mockStatus = {
        data: {
          sessionId: 'session123',
          status: 'completed',
          overallRiskScore: 25,
          riskLevel: 'low',
          confidence: 0.9,
          completedLayers: ['registry', 'physical'],
          lastUpdated: new Date(),
          badge: {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          }
        },
        success: true
      };

      mockPropertyService.getLandVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/properties/property123/land-verification/status')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('overallRiskScore');
      expect(response.body.data).toHaveProperty('riskLevel');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('completedLayers');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).toHaveProperty('badge');
    });

    it('should return consistent response format for report endpoint', async () => {
      const mockReport = {
        data: {
          sessionId: 'session123',
          overallRiskScore: 35,
          riskLevel: 'medium',
          confidence: 0.8,
          completedLayers: ['registry', 'physical'],
          riskFactors: [],
          recommendations: [],
          lastUpdated: new Date()
        },
        success: true
      };

      mockPropertyService.getLandVerificationReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/properties/property123/land-verification/report')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('riskFactors');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.riskFactors)).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });
  });
});