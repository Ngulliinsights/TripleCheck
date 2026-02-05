import { describe, it, expect, beforeEach, vi } from '..\..\..\src\shared\test-utils\index';
import { AuthenticationService, defaultAuthConfig } from '../../auth/AuthenticationService';
import { testUtils } from '../setup';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  beforeEach(() => {
    authService = new AuthenticationService(defaultAuthConfig);
  });

  describe('Password Management', () => {
    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(password, hash);
      const isInvalid = await authService.verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should validate password strength', () => {
      expect(authService.validatePasswordStrength('TestPassword123!')).toBe(true);
      expect(authService.validatePasswordStrength('weak')).toBe(false);
      expect(authService.validatePasswordStrength('NoNumbers!')).toBe(false);
      expect(authService.validatePasswordStrength('nonumbersorspecial')).toBe(false);
      expect(authService.validatePasswordStrength('NOLOWERCASE123!')).toBe(false);
    });

    it('should reject weak passwords during hashing', async () => {
      await expect(authService.hashPassword('weak')).rejects.toThrow();
    });
  });

  describe('Token Management', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      isActive: true,
      emailVerified: true,
      trustScore: 750
    };

    it('should generate valid JWT tokens', () => {
      const tokens = authService.generateTokens(mockUser);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.tokenType).toBe('Bearer');
      expect(tokens.expiresIn).toBeGreaterThan(0);
    });

    it('should verify valid tokens', () => {
      const tokens = authService.generateTokens(mockUser);
      const verifiedUser = authService.verifyToken(tokens.accessToken);
      
      expect(verifiedUser).toBeDefined();
      expect(verifiedUser?.id).toBe(mockUser.id);
      expect(verifiedUser?.username).toBe(mockUser.username);
      expect(verifiedUser?.role).toBe(mockUser.role);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      const verifiedUser = authService.verifyToken(invalidToken);
      
      expect(verifiedUser).toBeNull();
    });

    it('should refresh access tokens', async () => {
      const tokens = authService.generateTokens(mockUser);
      
      // Mock storage.getUser
      vi.spyOn(require('../../storage'), 'storage', 'get').mockReturnValue({
        getUser: vi.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedpassword',
          lastLoginAt: new Date()
        })
      });

      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      
      expect(newTokens).toBeDefined();
      expect(newTokens?.accessToken).toBeDefined();
      expect(newTokens?.refreshToken).toBeDefined();
      expect(newTokens?.accessToken).not.toBe(tokens.accessToken);
    });
  });

  describe('Authentication Flow', () => {
    const mockRequest = {
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
      correlationId: 'test-correlation-id'
    } as any;

    beforeEach(() => {
      // Mock storage methods
      vi.spyOn(require('../../storage'), 'storage', 'get').mockReturnValue({
        getUserByUsername: vi.fn(),
        getUser: vi.fn()
      });
    });

    it('should authenticate valid credentials', async () => {
      const testUser = testUtils.createTestUser();
      const hashedPassword = await authService.hashPassword(testUser.password);
      
      const mockDbUser = {
        id: 1,
        username: testUser.username,
        email: testUser.email,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        emailVerifiedAt: new Date(),
        trustScore: 500,
        lastLoginAt: null
      };

      require('../../storage').storage.getUserByUsername.mockResolvedValue(mockDbUser);

      const result = await authService.authenticate(testUser.email, testUser.password, mockRequest);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user?.email).toBe(testUser.email);
    });

    it('should reject invalid credentials', async () => {
      const testUser = testUtils.createTestUser();
      
      require('../../storage').storage.getUserByUsername.mockResolvedValue(null);

      const result = await authService.authenticate(testUser.email, 'wrongpassword', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.user).toBeUndefined();
      expect(result.tokens).toBeUndefined();
    });

    it('should reject inactive accounts', async () => {
      const testUser = testUtils.createTestUser();
      const hashedPassword = await authService.hashPassword(testUser.password);
      
      const mockDbUser = {
        id: 1,
        username: testUser.username,
        email: testUser.email,
        password: hashedPassword,
        role: 'user',
        isActive: false, // Inactive account
        emailVerifiedAt: new Date(),
        trustScore: 500,
        lastLoginAt: null
      };

      require('../../storage').storage.getUserByUsername.mockResolvedValue(mockDbUser);

      const result = await authService.authenticate(testUser.email, testUser.password, mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('inactive');
    });

    it('should handle account lockout', async () => {
      const testUser = testUtils.createTestUser();
      
      require('../../storage').storage.getUserByUsername.mockResolvedValue({
        id: 1,
        username: testUser.username,
        email: testUser.email,
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        emailVerifiedAt: new Date(),
        trustScore: 500
      });

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await authService.authenticate(testUser.email, 'wrongpassword', mockRequest);
      }

      // Next attempt should be blocked due to lockout
      const result = await authService.authenticate(testUser.email, 'wrongpassword', mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('locked');
    });
  });

  describe('Authorization Middleware', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      isActive: true,
      emailVerified: true,
      trustScore: 750
    };

    it('should allow access with valid token', () => {
      const tokens = authService.generateTokens(mockUser);
      const middleware = authService.requireAuth();
      
      const mockReq = {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`
        }
      } as any;
      
      const mockRes = {} as any;
      const mockNext = vi.fn();

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(mockUser.id);
    });

    it('should reject requests without token', () => {
      const middleware = authService.requireAuth();
      
      const mockReq = { headers: {} } as any;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;
      const mockNext = vi.fn();

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should enforce role-based access', () => {
      const tokens = authService.generateTokens(mockUser);
      const middleware = authService.requireRole('admin');
      
      const mockReq = {
        user: mockUser,
        correlationId: 'test'
      } as any;
      
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;
      const mockNext = vi.fn();

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should track login attempts', async () => {
      const testUser = testUtils.createTestUser();
      const mockRequest = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('test-user-agent'),
        correlationId: 'test'
      } as any;

      require('../../storage').storage.getUserByUsername.mockResolvedValue(null);

      // Make several failed attempts
      await authService.authenticate(testUser.email, 'wrong', mockRequest);
      await authService.authenticate(testUser.email, 'wrong', mockRequest);
      
      const stats = authService.getAuthStats();
      expect(stats.recentLoginAttempts).toBeGreaterThan(0);
    });

    it('should clean up expired tokens', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        emailVerified: true,
        trustScore: 750
      };

      const tokens = authService.generateTokens(mockUser);
      
      // Logout should remove refresh token
      await authService.logout(tokens.refreshToken);
      
      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      expect(newTokens).toBeNull();
    });
  });
});