import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { 
  requireAuth, 
  requireRole, 
  requireMinTrustScore,
  requirePermissions,
  SessionManager,
  UserContext,
  AuthenticatedRequest
} from '../auth.middleware';

// Mock the storage module
vi.mock('../../storage', () => ({
  storage: {
    getUser: vi.fn(),
  }
}));

// Mock response helpers
vi.mock('../../utils/response-helpers', () => ({
  ResponseHelper: {
    authError: vi.fn(),
    authorizationError: vi.fn(),
    error: vi.fn(),
  }
}));

describe('Authentication Middleware Integration Tests', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      session: {
        userId: 1,
        lastActivity: new Date().toISOString(),
        destroy: vi.fn((callback) => callback()),
      },
      ip: '127.0.0.1',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    mockNext = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Integration with routes.ts patterns', () => {
    it('should work with property review creation pattern', async () => {
      // Mock user data that would be loaded
      const mockUser = {
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
      };

      // Mock storage.getUser to return the user
      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Test the requireAuth middleware (as used in routes.ts)
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.password).toBeUndefined(); // Password should be stripped
    });

    it('should handle session validation correctly', async () => {
      // Test with valid session
      expect(SessionManager.isSessionValid(mockReq as AuthenticatedRequest)).toBe(true);

      // Test with expired session
      const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      mockReq.session!.lastActivity = expiredTime;
      expect(SessionManager.isSessionValid(mockReq as AuthenticatedRequest)).toBe(false);
    });

    it('should handle getUserIdFromSession pattern used in routes', () => {
      // This pattern is used in routes.ts: getUserIdFromSession(req)
      const userId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
      expect(userId).toBe(1);

      // Test with no session
      mockReq.session = undefined;
      const noUserId = SessionManager.getUserIdFromSession(mockReq as AuthenticatedRequest);
      expect(noUserId).toBeNull();
    });

    it('should support role-based authorization for different user types', async () => {
      const mockUser = {
        id: 1,
        username: 'agent',
        email: 'agent@example.com',
        password: 'hashedpassword',
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
        isVerifiedAgent: true,
        trustScore: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Test agent role middleware
      const agentMiddleware = requireRole(['agent', 'admin']);
      await agentMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should support trust score requirements', async () => {
      const mockUser = {
        id: 1,
        username: 'hightrustuser',
        email: 'trust@example.com',
        password: 'hashedpassword',
        firstName: 'Trust',
        lastName: 'User',
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Test trust score middleware
      const trustMiddleware = requireMinTrustScore(80);
      await trustMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should support complex permission requirements', async () => {
      const mockUser = {
        id: 1,
        username: 'verifiedagent',
        email: 'verified@example.com',
        password: 'hashedpassword',
        firstName: 'Verified',
        lastName: 'Agent',
        role: 'agent',
        isVerifiedAgent: true,
        trustScore: 95,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Test complex permissions middleware
      const complexMiddleware = requirePermissions({
        roles: ['agent', 'admin'],
        minTrustScore: 90,
        requireVerifiedAgent: true,
      });

      await complexMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      // Test with no session
      mockReq.session = undefined;

      const { ResponseHelper } = await import('../../utils/response-helpers');
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseHelper.authError).toHaveBeenCalled();
    });

    it('should handle database errors during user loading', async () => {
      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockRejectedValue(new Error('Database error'));

      const { ResponseHelper } = await import('../../utils/response-helpers');

      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseHelper.authError).toHaveBeenCalled();
    });
  });

  describe('Middleware chaining compatibility', () => {
    it('should work correctly when chained with validation middleware', async () => {
      // Simulate the pattern used in routes.ts:
      // app.post("/api/properties/:id/reviews", requireAuth, validateRequest(...), handler)
      
      const mockUser = {
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
      };

      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // First middleware: requireAuth
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();

      // Reset next function for second middleware
      mockNext.mockClear();

      // Second middleware would be validation - we'll simulate it passed
      // Third middleware would be the actual route handler
      expect(mockReq.user?.id).toBe(1);
      expect(mockReq.session?.userId).toBe(1);
    });

    it('should maintain session state across middleware calls', async () => {
      const mockUser = {
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
      };

      const { storage } = await import('../../storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Set initial activity to an older time
      const oldTime = new Date(Date.now() - 1000).toISOString();
      mockReq.session!.lastActivity = oldTime;

      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Session activity should be updated to a newer time
      expect(mockReq.session?.lastActivity).not.toBe(oldTime);
      expect(mockReq.session?.userId).toBe(1);
      expect(new Date(mockReq.session?.lastActivity!).getTime()).toBeGreaterThan(new Date(oldTime).getTime());
    });
  });
});