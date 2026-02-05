import { Request, Response, NextFunction } from 'express';
import { 
  requireAuth, 
  requireRole, 
  requireVerifiedAgent, 
  requireMinTrustScore,
  requirePermissions,
  requireMinRole,
  requireResourceOwnership,
  SessionManager,
  UserContext,
  AuthorizationManager,
  SessionConfigManager,
  AuthenticatedRequest,
  CustomSession
} from '../auth.middleware';
import { storage } from '../../storage';
import { ResponseHelper } from '../../utils/response-helpers';
import { AUTH_ERROR_MESSAGES } from '../../../core/src/error-handling';
import { HTTP_STATUS } from '../../utils/constants';

// Mock dependencies
jest.mock('../../storage', () => ({
  storage: {
    getUser: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
  }
}));

jest.mock('../../utils/response-helpers', () => ({
  ResponseHelper: {
    authError: jest.fn(),
    authorizationError: jest.fn(),
    error: jest.fn(),
    notFound: jest.fn(),
  }
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockResponseHelper = ResponseHelper as jest.Mocked<typeof ResponseHelper>;

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockSession: CustomSession;

  beforeEach(() => {
    mockSession = {
      userId: 1,
      lastActivity: new Date().toISOString(),
      destroy: jest.fn((callback) => callback()),
    };

    mockReq = {
      session: mockSession,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('SessionManager', () => {
    describe('getUserIdFromSession', () => {
      it('should return user ID from session', () => {
        const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
        expect(userId).toBe(1);
      });

      it('should return null if no session', () => {
        mockReq.session = undefined;
        const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
        expect(userId).toBeNull();
      });

      it('should return null if no userId in session', () => {
        mockReq.session!.userId = undefined;
        const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
        expect(userId).toBeNull();
      });
    });

    describe('setUserSession', () => {
      it('should set user session with activity tracking', () => {
        const req = { session: { destroy: jest.fn() } } as AuthenticatedRequest;
        SessionManager.setUserSession(req, 123);
        
        expect(req.session?.userId).toBe(123);
        expect(req.session?.lastActivity).toBeDefined();
      });

      it('should handle missing session gracefully', () => {
        const req = {} as AuthenticatedRequest;
        expect(() => SessionManager.setUserSession(req, 123)).not.toThrow();
      });
    });

    describe('isSessionValid', () => {
      it('should return true for valid session', () => {
        const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
        expect(isValid).toBe(true);
      });

      it('should return false for expired session', () => {
        const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
        mockReq.session!.lastActivity = expiredTime;
        
        const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
        expect(isValid).toBe(false);
      });

      it('should return false if no userId', () => {
        mockReq.session!.userId = undefined;
        const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
        expect(isValid).toBe(false);
      });

      it('should return true if no lastActivity (new session)', () => {
        mockReq.session!.lastActivity = undefined;
        const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('UserContext', () => {
    describe('loadUserContext', () => {
      it('should load user context successfully', async () => {
        mockStorage.getUser.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isVerifiedAgent: false,
          trustScore: 75,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const req = { session: { userId: 1 } } as AuthenticatedRequest;
        const result = await UserContext.loadUserContext(req);
        
        expect(result).toBe(true);
        expect(req.user).toBeDefined();
        expect(req.user?.password).toBeUndefined(); // Password should be removed
        expect(mockStorage.getUser).toHaveBeenCalledWith(1);
      });

      it('should return false if no userId in session', async () => {
        const req = {} as AuthenticatedRequest;
        const result = await UserContext.loadUserContext(req);
        
        expect(result).toBe(false);
        expect(mockStorage.getUser).not.toHaveBeenCalled();
      });

      it('should return false if user not found', async () => {
        mockStorage.getUser.mockResolvedValue(null);
        
        const req = { session: { userId: 1 } } as AuthenticatedRequest;
        const result = await UserContext.loadUserContext(req);
        
        expect(result).toBe(false);
      });

      it('should handle database errors gracefully', async () => {
        mockStorage.getUser.mockRejectedValue(new Error('Database error'));
        
        const req = { session: { userId: 1 } } as AuthenticatedRequest;
        const result = await UserContext.loadUserContext(req);
        
        expect(result).toBe(false);
      });
    });

    describe('getUserRole', () => {
      it('should return user role', () => {
        const role = UserContext.getUserRole(mockReq as AuthenticatedRequest);
        expect(role).toBe('user');
      });

      it('should return null if no user', () => {
        mockReq.user = undefined;
        const role = UserContext.getUserRole(mockReq as AuthenticatedRequest);
        expect(role).toBeNull();
      });
    });

    describe('hasRole', () => {
      it('should return true for matching role', () => {
        const hasRole = UserContext.hasRole(mockReq as AuthenticatedRequest, 'user');
        expect(hasRole).toBe(true);
      });

      it('should return false for non-matching role', () => {
        const hasRole = UserContext.hasRole(mockReq as AuthenticatedRequest, 'admin');
        expect(hasRole).toBe(false);
      });
    });

    describe('isVerifiedAgent', () => {
      it('should return false for non-verified agent', () => {
        const isVerified = UserContext.isVerifiedAgent(mockReq as AuthenticatedRequest);
        expect(isVerified).toBe(false);
      });

      it('should return true for verified agent', () => {
        mockReq.user!.isVerifiedAgent = true;
        const isVerified = UserContext.isVerifiedAgent(mockReq as AuthenticatedRequest);
        expect(isVerified).toBe(true);
      });
    });
  });

  describe('AuthorizationManager', () => {
    describe('hasPermission', () => {
      it('should allow admin to access user resources', () => {
        const hasPermission = AuthorizationManager.hasPermission('admin', 'user');
        expect(hasPermission).toBe(true);
      });

      it('should not allow user to access admin resources', () => {
        const hasPermission = AuthorizationManager.hasPermission('user', 'admin');
        expect(hasPermission).toBe(false);
      });

      it('should allow same role access', () => {
        const hasPermission = AuthorizationManager.hasPermission('agent', 'agent');
        expect(hasPermission).toBe(true);
      });
    });

    describe('checkPermissions', () => {
      it('should allow access with sufficient permissions', () => {
        const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
          roles: ['user'],
          minTrustScore: 50,
        });
        
        expect(result.allowed).toBe(true);
      });

      it('should deny access with insufficient role', () => {
        const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
          roles: ['admin'],
        });
        
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Insufficient role permissions');
      });

      it('should deny access with insufficient trust score', () => {
        const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
          minTrustScore: 100,
        });
        
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Insufficient trust score');
      });

      it('should deny access if verified agent required but not verified', () => {
        const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
          requireVerifiedAgent: true,
        });
        
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Verified agent status required');
      });
    });
  });

  describe('requireAuth middleware', () => {
    it('should allow authenticated user with valid session', async () => {
      mockStorage.getUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponseHelper.authError).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', async () => {
      mockReq.session = undefined;
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authError).toHaveBeenCalledWith(
        mockRes,
        AUTH_ERROR_MESSAGES.AUTH_REQUIRED
      );
    });

    it('should reject expired session', async () => {
      const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      mockReq.session!.lastActivity = expiredTime;
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authError).toHaveBeenCalledWith(
        mockRes,
        AUTH_ERROR_MESSAGES.SESSION_EXPIRED
      );
    });

    it('should reject if user not found in database', async () => {
      mockStorage.getUser.mockResolvedValue(null);
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authError).toHaveBeenCalledWith(
        mockRes,
        AUTH_ERROR_MESSAGES.USER_NOT_FOUND
      );
    });
  });

  describe('requireRole middleware', () => {
    beforeEach(() => {
      mockStorage.getUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should allow user with correct role', async () => {
      const middleware = requireRole('user');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponseHelper.authorizationError).not.toHaveBeenCalled();
    });

    it('should allow user with multiple acceptable roles', async () => {
      const middleware = requireRole(['user', 'agent']);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user with insufficient role', async () => {
      const middleware = requireRole('admin');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authorizationError).toHaveBeenCalledWith(
        mockRes,
        AUTH_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS
      );
    });
  });

  describe('requireMinTrustScore middleware', () => {
    beforeEach(() => {
      mockStorage.getUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should allow user with sufficient trust score', async () => {
      const middleware = requireMinTrustScore(50);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user with insufficient trust score', async () => {
      const middleware = requireMinTrustScore(100);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authorizationError).toHaveBeenCalledWith(
        mockRes,
        'Minimum trust score of 100 required. Current score: 75'
      );
    });
  });

  describe('requirePermissions middleware', () => {
    beforeEach(() => {
      mockStorage.getUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should allow user meeting all requirements', async () => {
      const middleware = requirePermissions({
        roles: ['user'],
        minTrustScore: 50,
      });
      
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user not meeting role requirements', async () => {
      const middleware = requirePermissions({
        roles: ['admin'],
      });
      
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        'Insufficient role permissions',
        HTTP_STATUS.FORBIDDEN
      );
    });

    it('should reject user not meeting trust score requirements', async () => {
      const middleware = requirePermissions({
        minTrustScore: 100,
      });
      
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        'Insufficient trust score',
        HTTP_STATUS.FORBIDDEN
      );
    });
  });

  describe('requireResourceOwnership middleware', () => {
    const mockGetResourceOwnerId = jest.fn();

    beforeEach(() => {
      mockStorage.getUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockGetResourceOwnerId.mockClear();
    });

    it('should allow resource owner to access their resource', async () => {
      mockGetResourceOwnerId.mockResolvedValue(1); // Same as user ID
      
      const middleware = requireResourceOwnership(mockGetResourceOwnerId);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-owner from accessing resource', async () => {
      mockGetResourceOwnerId.mockResolvedValue(2); // Different user ID
      
      const middleware = requireResourceOwnership(mockGetResourceOwnerId);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.authorizationError).toHaveBeenCalledWith(
        mockRes,
        'You can only access your own resources'
      );
    });

    it('should allow admin to access any resource', async () => {
      mockReq.user!.role = 'admin';
      mockGetResourceOwnerId.mockResolvedValue(2); // Different user ID
      
      const middleware = requireResourceOwnership(mockGetResourceOwnerId);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockGetResourceOwnerId).not.toHaveBeenCalled(); // Should not check ownership for admin
    });

    it('should handle resource not found', async () => {
      mockGetResourceOwnerId.mockResolvedValue(null);
      
      const middleware = requireResourceOwnership(mockGetResourceOwnerId);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponseHelper.notFound).toHaveBeenCalledWith(
        mockRes,
        'Resource not found'
      );
    });
  });

  describe('SessionConfigManager', () => {
    it('should return different session configs for different roles', () => {
      const userConfig = SessionConfigManager.getSessionConfig('user');
      const agentConfig = SessionConfigManager.getSessionConfig('agent');
      const adminConfig = SessionConfigManager.getSessionConfig('admin');
      
      expect(userConfig.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(agentConfig.maxAge).toBe(12 * 60 * 60 * 1000); // 12 hours
      expect(adminConfig.maxAge).toBe(8 * 60 * 60 * 1000); // 8 hours
      expect(adminConfig.requireReauth).toBe(true);
    });

    it('should validate session based on role', () => {
      // Mock a session that's 10 hours old
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
      mockReq.session!.lastActivity = tenHoursAgo;
      
      // Should be valid for user (24h limit) but not for admin (8h limit)
      expect(SessionConfigManager.isSessionValidForRole(mockReq as AuthenticatedRequest, 'user')).toBe(true);
      expect(SessionConfigManager.isSessionValidForRole(mockReq as AuthenticatedRequest, 'admin')).toBe(false);
    });
  });
});