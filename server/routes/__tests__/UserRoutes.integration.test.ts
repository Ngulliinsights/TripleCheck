import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { UserRoutes } from '../users.routes';
import { UserService } from '../../services/UserService';

// Mock the services
jest.mock('../../services/UserService');

describe('UserRoutes Integration Tests', () => {
  let app: express.Application;
  let userService: jest.Mocked<UserService>;
  let userRoutes: UserRoutes;

  beforeEach(() => {
    // Create mocked service
    userService = new UserService() as jest.Mocked<UserService>;
    
    // Create UserRoutes instance
    userRoutes = new UserRoutes(userService);
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Setup session middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Mount user routes
    app.use('/api/users', userRoutes.getRouter());
  });

  describe('GET /api/users/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate profile update data', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({
          firstName: '', // Invalid - empty string
          email: 'invalid-email' // Invalid email format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me/statistics', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/me/statistics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me/preferences', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/me/preferences');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/me/preferences', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/me/preferences')
        .send({
          emailNotifications: true,
          language: 'en'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate preferences data', async () => {
      const response = await request(app)
        .put('/api/users/me/preferences')
        .send({
          language: 'invalid', // Invalid language code
          currency: 'INVALID' // Invalid currency
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me/activity', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/me/activity');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users/me/activity')
        .query({
          page: -1, // Invalid page number
          limit: 1000 // Exceeds maximum limit
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/me/password', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .send({
          currentPassword: 'oldpass',
          newPassword: 'newpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate password change data', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .send({
          currentPassword: '', // Empty current password
          newPassword: '123' // Too short new password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get public user profile', async () => {
      const mockUser = {
        success: true,
        data: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          bio: 'Test bio',
          trustScore: 75,
          isVerifiedAgent: false,
          verificationLevel: 'basic',
          joinedAt: new Date(),
        }
      };

      userService.getUserProfile.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.password).toBeUndefined(); // Should not include password
      expect(userService.getUserProfile).toHaveBeenCalledWith(1);
    });

    it('should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle user not found', async () => {
      userService.getUserProfile.mockResolvedValue({
        success: false,
        error: 'User not found'
      });

      const response = await request(app)
        .get('/api/users/999');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users (Admin Only)', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate search filters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          role: 'invalid_role', // Invalid role
          trustScoreMin: -1, // Invalid trust score
          trustScoreMax: 101 // Invalid trust score
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/trust-score (Admin Only)', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/1/trust-score')
        .send({
          trustScore: 80,
          reason: 'Good behavior'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate trust score data', async () => {
      const response = await request(app)
        .put('/api/users/1/trust-score')
        .send({
          trustScore: 150, // Invalid trust score (> 100)
          reason: 'Bad' // Too short reason
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:id/promote-agent (Admin Only)', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/1/promote-agent');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate user ID parameter', async () => {
      const response = await request(app)
        .post('/api/users/invalid/promote-agent');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/admin/engagement-metrics (Admin Only)', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/admin/engagement-metrics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization', async () => {
      await expect(userRoutes.initialize()).resolves.toBeUndefined();
    });

    it('should handle unexpected service errors', async () => {
      userService.getUserProfile.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle password change with missing user', async () => {
      // This would be tested with proper authentication setup
      // For now, we test the validation path
      const response = await request(app)
        .put('/api/users/me/password')
        .send({
          currentPassword: 'validpass123',
          newPassword: 'newvalidpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent API response format for success', async () => {
      const mockUser = {
        success: true,
        data: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        }
      };

      userService.getUserProfile.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });

    it('should return consistent API response format for errors', async () => {
      userService.getUserProfile.mockResolvedValue({
        success: false,
        error: 'Service error'
      });

      const response = await request(app)
        .get('/api/users/1');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize public profile data', async () => {
      const mockUser = {
        success: true,
        data: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com', // Should be filtered out in public profile
          password: 'hashedpassword', // Should be filtered out
          trustScore: 75,
          isVerifiedAgent: false
        }
      };

      userService.getUserProfile.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1');

      expect(response.body.data.email).toBeUndefined();
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.trustScore).toBe(75);
    });
  });
});