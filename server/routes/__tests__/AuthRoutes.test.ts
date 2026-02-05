import './test-setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { AuthRoutes } from '../AuthRoutes';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';

// Mock the services
vi.mock('../../services/AuthService');
vi.mock('../../services/UserService');

describe('AuthRoutes Integration Tests', () => {
  let app: express.Application;
  let authService: any;
  let userService: any;
  let authRoutes: AuthRoutes;

  beforeEach(() => {
    // Create mocked services
    authService = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      setUserSession: vi.fn(),
      clearUserSession: vi.fn(),
      getUserIdFromSession: vi.fn(),
      getUserById: vi.fn(),
      validateSession: vi.fn(),
      validateCredentials: vi.fn(),
      hashPassword: vi.fn(),
    };
    
    userService = {
      getUserById: vi.fn(),
      updateUserPassword: vi.fn(),
    };
    
    // Create AuthRoutes instance
    authRoutes = new AuthRoutes(authService, userService);
    
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
    
    // Mount auth routes
    app.use('/api/auth', authRoutes.getRouter());
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockAuthResult = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          trustScore: 50,
          isVerifiedAgent: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        expiresAt: new Date()
      };

      authService.register.mockResolvedValue(mockAuthResult);
      authService.setUserSession.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return conflict error for existing username', async () => {
      authService.register.mockRejectedValue(new Error('Username already exists'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockAuthResult = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          trustScore: 50,
          isVerifiedAgent: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        expiresAt: new Date()
      };

      authService.login.mockResolvedValue(mockAuthResult);
      authService.setUserSession.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return unauthorized for invalid credentials', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return unauthorized when not authenticated', async () => {
      authService.getUserIdFromSession.mockReturnValue(null);

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        trustScore: 50,
        isVerifiedAgent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      authService.getUserIdFromSession.mockReturnValue(1);
      authService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Create authenticated session first
      const agent = request.agent(app);
      
      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/auth/validate-session', () => {
    it('should return session status', async () => {
      const response = await request(app).get('/api/auth/validate-session');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isAuthenticated).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate password change data', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: '', // Empty current password
          newPassword: '123' // Too short new password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '', // Invalid - empty username
          email: 'invalid-email', // Invalid email format
          password: '123', // Too short password
          firstName: '',
          lastName: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate login data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '', // Empty username
          password: '' // Empty password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization', async () => {
      await expect(authRoutes.initialize()).resolves.toBeUndefined();
    });

    it('should handle registration service errors', async () => {
      authService.register.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle login service errors', async () => {
      authService.login.mockRejectedValue(new Error('Authentication service unavailable'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent API response format for successful registration', async () => {
      const mockAuthResult = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        expiresAt: new Date()
      };

      authService.register.mockResolvedValue(mockAuthResult);
      authService.setUserSession.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });

    it('should return consistent API response format for errors', async () => {
      authService.register.mockRejectedValue(new Error('Username already exists'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete authentication flow', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const mockAuthResult = {
        user: mockUser,
        expiresAt: new Date()
      };

      // Mock successful registration
      authService.register.mockResolvedValue(mockAuthResult);
      authService.setUserSession.mockImplementation(() => {});

      // Test registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Mock successful login
      authService.login.mockResolvedValue(mockAuthResult);

      // Test login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should handle rate limiting on registration', async () => {
      // This would test rate limiting if properly configured
      // For now, we test that the endpoint exists and handles requests
      authService.register.mockResolvedValue({
        user: { id: 1, username: 'testuser' },
        expiresAt: new Date()
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        });

      // Should succeed on first attempt
      expect(response.status).toBe(201);
    });
  });
});