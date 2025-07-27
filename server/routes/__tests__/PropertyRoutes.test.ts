import request from 'supertest';
import express from 'express';
import session from 'express-session';
import fileUpload from 'express-fileupload';
import { PropertyRoutes } from '../PropertyRoutes';
import { PropertyService } from '../../services/PropertyService';
import { VerificationService } from '../../services/VerificationService';

// Mock the services
jest.mock('../../services/PropertyService');
jest.mock('../../services/VerificationService');

describe('PropertyRoutes Integration Tests', () => {
  let app: express.Application;
  let propertyRoutes: PropertyRoutes;
  let mockPropertyService: jest.Mocked<PropertyService>;
  let mockVerificationService: jest.Mocked<VerificationService>;

  beforeEach(() => {
    mockPropertyService = new PropertyService() as jest.Mocked<PropertyService>;
    mockVerificationService = new VerificationService() as jest.Mocked<VerificationService>;
    
    // Mock the initialize method
    mockVerificationService.initialize = jest.fn().mockResolvedValue(undefined);
    
    propertyRoutes = new PropertyRoutes(mockPropertyService, mockVerificationService);
    
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(fileUpload());
    
    // Setup session middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Mount property routes
    app.use('/api/properties', propertyRoutes.getRouter());
  });

  describe('GET /api/properties', () => {
    it('should get all properties with pagination', async () => {
      const mockProperties = {
        success: true,
        data: {
          properties: [
            {
              id: 1,
              title: 'Test Property',
              location: 'Test Location',
              price: 100000,
              ownerId: 1,
              createdAt: new Date()
            }
          ],
          totalCount: 1
        }
      };

      mockPropertyService.searchPropertiesWithPagination.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1);
      expect(mockPropertyService.searchPropertiesWithPagination).toHaveBeenCalled();
    });

    it('should handle search filters', async () => {
      const mockProperties = {
        success: true,
        data: { properties: [], totalCount: 0 }
      };

      mockPropertyService.searchPropertiesWithPagination.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties')
        .query({
          location: 'Nairobi',
          priceMin: 50000,
          priceMax: 200000,
          propertyType: 'apartment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle service errors', async () => {
      mockPropertyService.searchPropertiesWithPagination.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should get single property by ID', async () => {
      const mockProperty = {
        success: true,
        data: {
          id: 1,
          title: 'Test Property',
          location: 'Test Location',
          price: 100000,
          ownerId: 1
        }
      };

      mockPropertyService.getProperty.mockResolvedValue(mockProperty);

      const response = await request(app)
        .get('/api/properties/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Property');
      expect(mockPropertyService.getProperty).toHaveBeenCalledWith(1);
    });

    it('should handle invalid property ID', async () => {
      const response = await request(app)
        .get('/api/properties/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle property not found', async () => {
      mockPropertyService.getProperty.mockResolvedValue({
        success: false,
        error: 'Property not found'
      });

      const response = await request(app)
        .get('/api/properties/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/properties', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: 'New Property',
          location: 'Test Location',
          price: 150000,
          description: 'A test property'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate property data', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: '', // Invalid - empty title
          price: -1000, // Invalid - negative price
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/properties/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/properties/1')
        .send({
          title: 'Updated Property',
          price: 200000
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate property ID', async () => {
      const response = await request(app)
        .put('/api/properties/invalid')
        .send({
          title: 'Updated Property'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/properties/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/properties/:id/images', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/properties/1/images');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/properties/:id/images/:imageIndex', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/properties/1/images/0');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate image index', async () => {
      const response = await request(app)
        .delete('/api/properties/1/images/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id/verification', () => {
    it('should get verification status', async () => {
      const mockStatus = {
        status: 'verified',
        lastVerified: '2024-01-01T00:00:00Z',
        riskScore: 25
      };

      mockVerificationService.getVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/properties/1/verification');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockVerificationService.getVerificationStatus).toHaveBeenCalledWith(1);
    });

    it('should handle verification service errors', async () => {
      mockVerificationService.getVerificationStatus.mockRejectedValue(
        new Error('Property not found')
      );

      const response = await request(app)
        .get('/api/properties/1/verification');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/properties/:id/verify', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/properties/1/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/properties/:id/documents/verify', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/properties/1/documents/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id/reports/verification', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/properties/1/reports/verification');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id/reports/market-analysis', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/properties/1/reports/market-analysis');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id/reports/risk-assessment', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/properties/1/reports/risk-assessment');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/properties/search', () => {
    it('should perform text-based search', async () => {
      const mockSearchResult = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Apartment in Nairobi',
            location: 'Nairobi',
            price: 120000
          }
        ]
      };

      mockPropertyService.searchProperties.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .post('/api/properties/search')
        .send({
          query: 'apartment nairobi',
          page: 1,
          limit: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should perform filter-based search', async () => {
      const mockSearchResult = {
        success: true,
        data: {
          properties: [],
          totalCount: 0
        }
      };

      mockPropertyService.searchPropertiesWithPagination.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .post('/api/properties/search')
        .send({
          location: 'Nairobi',
          priceMin: 100000,
          priceMax: 300000,
          page: 1,
          limit: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/properties/user/my-properties', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/properties/user/my-properties');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization', async () => {
      await expect(propertyRoutes.initialize()).resolves.toBeUndefined();
      expect(mockVerificationService.initialize).toHaveBeenCalled();
    });

    it('should handle unexpected service errors', async () => {
      mockPropertyService.searchPropertiesWithPagination.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent API response format for success', async () => {
      const mockProperties = {
        success: true,
        data: { properties: [], totalCount: 0 }
      };

      mockPropertyService.searchPropertiesWithPagination.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });

    it('should return consistent API response format for errors', async () => {
      mockPropertyService.getProperty.mockResolvedValue({
        success: false,
        error: 'Property not found'
      });

      const response = await request(app)
        .get('/api/properties/999');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });

  describe('File Upload Integration', () => {
    it('should handle file upload validation', async () => {
      // This would test file upload validation in a real integration test
      const response = await request(app)
        .post('/api/properties/1/images');

      // Will fail on auth first, but file validation would be next
      expect(response.status).toBe(401);
    });
  });

  describe('Verification Integration', () => {
    it('should integrate with verification service', async () => {
      const mockStatus = {
        status: 'pending',
        riskScore: 50
      };

      mockVerificationService.getVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/properties/1/verification');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('pending');
    });
  });
});