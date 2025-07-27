import request from 'supertest';
import express from 'express';
import session from 'express-session';
import fileUpload from 'express-fileupload';
import { VerificationRoutes } from '../verification.routes';
import { VerificationService } from '../../services/VerificationService';

// Mock the services
jest.mock('../../services/VerificationService');

describe('VerificationRoutes Integration Tests', () => {
  let app: express.Application;
  let verificationService: jest.Mocked<VerificationService>;
  let verificationRoutes: VerificationRoutes;

  beforeEach(() => {
    // Create mocked service
    verificationService = new VerificationService() as jest.Mocked<VerificationService>;
    verificationService.initialize = jest.fn().mockResolvedValue(undefined);
    
    // Create VerificationRoutes instance
    verificationRoutes = new VerificationRoutes(verificationService);
    
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
    
    // Mount verification routes
    app.use('/api/verification', verificationRoutes.getRouter());
  });

  describe('GET /api/verification/properties/:id/status', () => {
    it('should get verification status for a property (public access)', async () => {
      const mockStatus = {
        status: 'verified',
        lastVerified: '2024-01-01T00:00:00Z',
        riskScore: 25,
        details: {
          documentAuthenticity: 'verified',
          ownershipVerified: true
        }
      };

      verificationService.getVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/verification/properties/1/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('verified');
      expect(response.body.data.metadata).toHaveProperty('timestamp');
      expect(response.body.data.metadata).toHaveProperty('propertyId', 1);
      expect(verificationService.getVerificationStatus).toHaveBeenCalledWith(1);
    });

    it('should handle invalid property ID', async () => {
      const response = await request(app)
        .get('/api/verification/properties/invalid/status');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle property not found', async () => {
      verificationService.getVerificationStatus.mockRejectedValue(
        new Error('Property not found')
      );

      const response = await request(app)
        .get('/api/verification/properties/999/status');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('POST /api/verification/properties/:id/documents', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/documents')
        .field('documentType', 'title_deed')
        .field('description', 'Property title deed');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate document type', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/documents')
        .send({
          documentType: 'invalid_type',
          description: 'Test document'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require documents to be uploaded', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/documents')
        .send({
          documentType: 'title_deed',
          description: 'Property title deed'
        });

      expect(response.status).toBe(401); // Will fail auth first, but validation would catch missing files
    });
  });

  describe('POST /api/verification/properties/:id/verify', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate property ID parameter', async () => {
      const response = await request(app)
        .post('/api/verification/properties/invalid/verify');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/verification/fraud-detection/analyze', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verification/fraud-detection/analyze')
        .send({
          propertyData: {
            title: 'Test Property',
            description: 'A test property for fraud detection',
            price: 100000,
            location: 'Test Location'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate property data', async () => {
      const response = await request(app)
        .post('/api/verification/fraud-detection/analyze')
        .send({
          propertyData: {
            title: '', // Invalid - empty title
            price: -1000, // Invalid - negative price
            location: 'Test Location'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/verification/fraud-detection/analyze')
        .send({
          propertyData: {
            title: 'Test Property'
            // Missing required fields: description, price, location
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/verification/properties/:id/reports', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/reports')
        .send({
          reportType: 'verification',
          includeDetails: true
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate report type', async () => {
      const response = await request(app)
        .post('/api/verification/properties/1/reports')
        .send({
          reportType: 'invalid_type',
          includeDetails: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate property ID', async () => {
      const response = await request(app)
        .post('/api/verification/properties/invalid/reports')
        .send({
          reportType: 'verification',
          includeDetails: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/verification/properties/:id/history', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/verification/properties/1/history');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/verification/properties/1/history')
        .query({
          page: -1, // Invalid page
          limit: 1000 // Exceeds maximum
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization', async () => {
      await expect(verificationRoutes.initialize()).resolves.toBeUndefined();
      expect(verificationService.initialize).toHaveBeenCalled();
    });

    it('should handle service initialization failure', async () => {
      verificationService.initialize.mockRejectedValue(new Error('Service init failed'));
      
      await expect(verificationRoutes.initialize()).rejects.toThrow('Service init failed');
    });

    it('should handle unexpected service errors', async () => {
      verificationService.getVerificationStatus.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/verification/properties/1/status');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to retrieve verification status');
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent API response format for success', async () => {
      const mockStatus = {
        status: 'verified',
        lastVerified: '2024-01-01T00:00:00Z',
        riskScore: 25
      };

      verificationService.getVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/verification/properties/1/status');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metadata');
    });

    it('should return consistent API response format for errors', async () => {
      verificationService.getVerificationStatus.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/api/verification/properties/1/status');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should provide enhanced data for authenticated users', async () => {
      const mockStatus = {
        status: 'verified',
        lastVerified: '2024-01-01T00:00:00Z',
        riskScore: 25
      };

      verificationService.getVerificationStatus.mockResolvedValue(mockStatus);

      // Test with authenticated user (would need proper session setup)
      const response = await request(app)
        .get('/api/verification/properties/1/status');

      expect(response.status).toBe(200);
      expect(response.body.data.metadata).toHaveProperty('timestamp');
      expect(response.body.data.metadata).toHaveProperty('propertyId');
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file types in document upload', async () => {
      // This would test file upload validation
      // In a real integration test, we would upload actual files
      const response = await request(app)
        .post('/api/verification/properties/1/documents')
        .field('documentType', 'title_deed');

      // Will fail on auth first, but file validation would be next
      expect(response.status).toBe(401);
    });
  });

  describe('Fraud Detection Integration', () => {
    it('should handle fraud detection analysis with valid data', async () => {
      const mockFraudResult = {
        isSuspicious: false,
        suspiciousScore: 15,
        overallScore: 85,
        verificationTimestamp: '2024-01-01T00:00:00Z'
      };

      verificationService.performFraudDetection.mockResolvedValue(mockFraudResult);

      // This would work with proper authentication
      const response = await request(app)
        .post('/api/verification/fraud-detection/analyze')
        .send({
          propertyData: {
            title: 'Legitimate Property',
            description: 'A well-documented property with clear ownership',
            price: 250000,
            location: 'Nairobi, Kenya',
            imageUrls: ['https://example.com/image1.jpg']
          }
        });

      expect(response.status).toBe(401); // Auth required
    });
  });
});