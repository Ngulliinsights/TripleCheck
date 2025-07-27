import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { FraudDetectionEngine } from '../core/FraudDetectionEngine';
import { FraudDetectionDashboardRoutes } from '../routes/dashboard';
import { requireAuth } from '../../middleware/auth.middleware';

describe('Fraud Detection Integration Tests', () => {
  let app: express.Application;
  let engine: FraudDetectionEngine;
  let server: any;

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Session middleware
    app.use(session({
      secret: 'test-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));

    // Mock authentication middleware for testing
    const mockAuth = (req: any, res: any, next: any) => {
      req.session = req.session || {};
      req.session.userId = 123; // Mock authenticated user
      next();
    };

    // Initialize fraud detection engine
    engine = new FraudDetectionEngine();
    
    // Mock engine methods for testing
    jest.spyOn(engine, 'initialize').mockResolvedValue();
    jest.spyOn(engine, 'getSystemStatus').mockResolvedValue({
      isRunning: true,
      processingQueue: 0,
      uptime: 3600,
      lastProcessed: new Date(),
      mlModelsStatus: { status: 'healthy' },
      dataIntegrationStatus: { status: 'healthy' }
    });

    // Setup routes
    const dashboardRoutes = new FraudDetectionDashboardRoutes(engine);
    app.use('/api/fraud-detection/dashboard', mockAuth, dashboardRoutes.getRouter());

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Start server
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('System Health', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Dashboard API Integration', () => {
    it('should get active scans successfully', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/scans/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify scan structure
      if (response.body.data.length > 0) {
        const scan = response.body.data[0];
        expect(scan).toHaveProperty('id');
        expect(scan).toHaveProperty('propertyId');
        expect(scan).toHaveProperty('status');
        expect(scan).toHaveProperty('progress');
        expect(scan).toHaveProperty('riskLevel');
      }
    });

    it('should get recent reports successfully', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/reports/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify report structure
      if (response.body.data.length > 0) {
        const report = response.body.data[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('propertyId');
        expect(report).toHaveProperty('title');
        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('riskScore');
        expect(report).toHaveProperty('status');
        expect(report).toHaveProperty('keyFindings');
        expect(report).toHaveProperty('recommendations');
      }
    });

    it('should get user statistics successfully', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('propertiesScanned');
      expect(response.body.data).toHaveProperty('averageScanTime');
      expect(response.body.data).toHaveProperty('cleanRate');
      
      // Verify data types
      expect(typeof response.body.data.propertiesScanned).toBe('number');
      expect(typeof response.body.data.averageScanTime).toBe('number');
      expect(typeof response.body.data.cleanRate).toBe('number');
    });

    it('should get report details successfully', async () => {
      const reportId = 'RPT-001';
      const response = await request(app)
        .get(`/api/fraud-detection/dashboard/reports/${reportId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', reportId);
      expect(response.body.data).toHaveProperty('detailedAnalysis');
      
      // Verify detailed analysis structure
      const analysis = response.body.data.detailedAnalysis;
      expect(analysis).toHaveProperty('documentAuthenticity');
      expect(analysis).toHaveProperty('ownershipVerification');
      expect(analysis).toHaveProperty('marketAnalysis');
      expect(analysis).toHaveProperty('legalCompliance');
    });

    it('should download report as PDF', async () => {
      const reportId = 'RPT-001';
      const response = await request(app)
        .get(`/api/fraud-detection/dashboard/reports/${reportId}/download`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(`fraud-report-${reportId}.pdf`);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should refresh scans successfully', async () => {
      const response = await request(app)
        .post('/api/fraud-detection/dashboard/scans/refresh')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scan status refreshed successfully');
      expect(response.body).toHaveProperty('refreshedAt');
    });

    it('should start new scan successfully', async () => {
      const propertyId = 'PROP-TEST-123';
      const response = await request(app)
        .post('/api/fraud-detection/dashboard/scans/start')
        .send({ propertyId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fraud detection scan started successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('propertyId', propertyId);
      expect(response.body.data).toHaveProperty('status', 'scanning');
      expect(response.body.data).toHaveProperty('progress', 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing report ID gracefully', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/reports/')
        .expect(404); // Express will return 404 for missing route parameter
    });

    it('should handle missing property ID in scan start', async () => {
      const response = await request(app)
        .post('/api/fraud-detection/dashboard/scans/start')
        .send({}) // Missing propertyId
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property ID is required');
    });

    it('should handle invalid JSON in requests', async () => {
      const response = await request(app)
        .post('/api/fraud-detection/dashboard/scans/start')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data across multiple requests', async () => {
      // Make multiple requests to the same endpoint
      const responses = await Promise.all([
        request(app).get('/api/fraud-detection/dashboard/scans/active'),
        request(app).get('/api/fraud-detection/dashboard/scans/active'),
        request(app).get('/api/fraud-detection/dashboard/scans/active')
      ]);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Data structure should be consistent
      const firstResponse = responses[0].body.data;
      responses.slice(1).forEach(response => {
        expect(response.body.data).toEqual(firstResponse);
      });
    });

    it('should validate risk levels are within expected ranges', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/scans/active')
        .expect(200);

      const validRiskLevels = ['low', 'medium', 'high', 'critical'];
      response.body.data.forEach((scan: any) => {
        expect(validRiskLevels).toContain(scan.riskLevel);
        expect(scan.progress).toBeGreaterThanOrEqual(0);
        expect(scan.progress).toBeLessThanOrEqual(100);
      });
    });

    it('should validate report risk scores are within valid range', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/reports/recent')
        .expect(200);

      const validStatuses = ['safe', 'caution', 'warning', 'blocked'];
      response.body.data.forEach((report: any) => {
        expect(validStatuses).toContain(report.status);
        expect(report.riskScore).toBeGreaterThanOrEqual(0);
        expect(report.riskScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/fraud-detection/dashboard/scans/active')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make 20 concurrent requests
      const promises = Array(20).fill(null).map(() =>
        request(app).get('/api/fraud-detection/dashboard/scans/active')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within 3 seconds for 20 concurrent requests
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Security', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without authentication middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      
      const dashboardRoutes = new FraudDetectionDashboardRoutes(engine);
      unauthApp.use('/api/fraud-detection/dashboard', requireAuth, dashboardRoutes.getRouter());
      
      // All endpoints should return 401 without authentication
      const endpoints = [
        '/api/fraud-detection/dashboard/scans/active',
        '/api/fraud-detection/dashboard/reports/recent',
        '/api/fraud-detection/dashboard/stats'
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(unauthApp).get(endpoint);
        expect(response.status).toBe(401);
      }
    });

    it('should sanitize error messages', async () => {
      const response = await request(app)
        .get('/api/fraud-detection/dashboard/reports/invalid-id')
        .expect(400);

      // Error message should not contain sensitive information
      expect(response.body.message).toBe('Report ID is required');
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('error');
    });
  });

  describe('API Contract', () => {
    it('should maintain consistent response structure', async () => {
      const endpoints = [
        '/api/fraud-detection/dashboard/scans/active',
        '/api/fraud-detection/dashboard/reports/recent',
        '/api/fraud-detection/dashboard/stats'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint).expect(200);
        
        // All responses should have consistent structure
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    it('should handle POST requests with consistent structure', async () => {
      const postEndpoints = [
        {
          url: '/api/fraud-detection/dashboard/scans/refresh',
          body: {}
        },
        {
          url: '/api/fraud-detection/dashboard/scans/start',
          body: { propertyId: 'PROP-TEST' }
        }
      ];

      for (const endpoint of postEndpoints) {
        const response = await request(app)
          .post(endpoint.url)
          .send(endpoint.body)
          .expect(200);
        
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.success).toBe('boolean');
        expect(typeof response.body.message).toBe('string');
      }
    });
  });
});