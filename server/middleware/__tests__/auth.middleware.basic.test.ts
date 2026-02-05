import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SessionManager,
  UserContext,
  AuthorizationManager,
  SessionConfigManager,
  AuthenticatedRequest,
  CustomSession
} from '../auth.middleware';

describe('Authentication Middleware - Basic Tests', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockSession: CustomSession;

  beforeEach(() => {
    mockSession = {
      userId: 1,
      lastActivity: new Date().toISOString(),
      destroy: vi.fn((callback) => callback()),
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
  });

  describe('SessionManager', () => {
    it('should get user ID from session', () => {
      const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
      expect(userId).toBe(1);
    });

    it('should return null if no session', () => {
      mockReq.session = undefined;
      const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
      expect(userId).toBeNull();
    });

    it('should set user session with activity tracking', () => {
      const req = { session: { destroy: vi.fn() } } as AuthenticatedRequest;
      SessionManager.setUserSession(req, 123);
      
      expect(req.session?.userId).toBe(123);
      expect(req.session?.lastActivity).toBeDefined();
    });

    it('should validate session correctly', () => {
      const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
      expect(isValid).toBe(true);
    });

    it('should detect expired session', () => {
      const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      mockReq.session!.lastActivity = expiredTime;
      
      const isValid = SessionManager.isSessionValid(mockReq as AuthenticatedRequest);
      expect(isValid).toBe(false);
    });
  });

  describe('UserContext', () => {
    it('should get user role', () => {
      const role = UserContext.getUserRole(mockReq as AuthenticatedRequest);
      expect(role).toBe('user');
    });

    it('should check if user has role', () => {
      const hasRole = UserContext.hasRole(mockReq as AuthenticatedRequest, 'user');
      expect(hasRole).toBe(true);
    });

    it('should check if user has any of specified roles', () => {
      const hasAnyRole = UserContext.hasAnyRole(mockReq as AuthenticatedRequest, ['admin', 'user']);
      expect(hasAnyRole).toBe(true);
    });

    it('should check verified agent status', () => {
      const isVerified = UserContext.isVerifiedAgent(mockReq as AuthenticatedRequest);
      expect(isVerified).toBe(false);
      
      mockReq.user!.isVerifiedAgent = true;
      const isVerifiedNow = UserContext.isVerifiedAgent(mockReq as AuthenticatedRequest);
      expect(isVerifiedNow).toBe(true);
    });

    it('should get user trust score', () => {
      const trustScore = UserContext.getUserTrustScore(mockReq as AuthenticatedRequest);
      expect(trustScore).toBe(75);
    });
  });

  describe('AuthorizationManager', () => {
    it('should check role hierarchy permissions', () => {
      expect(AuthorizationManager.hasPermission('admin', 'user')).toBe(true);
      expect(AuthorizationManager.hasPermission('user', 'admin')).toBe(false);
      expect(AuthorizationManager.hasPermission('agent', 'agent')).toBe(true);
    });

    it('should get authorization context', () => {
      const context = AuthorizationManager.getAuthorizationContext(mockReq as AuthenticatedRequest);
      
      expect(context).toBeDefined();
      expect(context?.userId).toBe(1);
      expect(context?.role).toBe('user');
      expect(context?.trustScore).toBe(75);
    });

    it('should check permissions with sufficient access', () => {
      const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
        roles: ['user'],
        minTrustScore: 50,
      });
      
      expect(result.allowed).toBe(true);
    });

    it('should deny permissions with insufficient role', () => {
      const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
        roles: ['admin'],
      });
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient role permissions');
    });

    it('should deny permissions with insufficient trust score', () => {
      const result = AuthorizationManager.checkPermissions(mockReq as AuthenticatedRequest, {
        minTrustScore: 100,
      });
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Insufficient trust score');
    });
  });

  describe('SessionConfigManager', () => {
    it('should return different configs for different roles', () => {
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