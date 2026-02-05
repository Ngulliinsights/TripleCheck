import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../AccessControlService';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';

// Mock database
vi.mock('../../../lib/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    and: vi.fn(),
    eq: vi.fn()
  }
}));

// Mock schema
vi.mock('../../../../src/shared/schema', () => ({
  landVerificationSessions: {
    id: 'id',
    propertyId: 'propertyId',
    userId: 'userId'
  },
  properties: {
    id: 'id'
  },
  users: {
    id: 'id',
    role: 'role'
  }
}));

describe('AccessControlService', () => {
  let accessControlService: AccessControlService;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    accessControlService = new AccessControlService();
    
    mockRequest = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        trustScore: 80,
        isVerifiedAgent: false
      },
      session: {
        userId: 1
      },
      params: {},
      body: {}
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Access Control', () => {
    it('should allow access to own verification session', async () => {
      mockRequest.params = { sessionId: '123' };
      
      // Mock database response for session owned by user
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access to other users session', async () => {
      mockRequest.params = { sessionId: '123' };
      
      // Mock database response for session owned by different user
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 999, // Different user
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied: You can only access your own verification sessions',
          restrictions: undefined
        }
      });
    });

    it('should allow admin access to any session', async () => {
      mockRequest.user!.role = 'admin';
      mockRequest.params = { sessionId: '123' };

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;
      mockRequest.session = undefined;
      mockRequest.params = { sessionId: '123' };

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access verification sessions'
        }
      });
    });

    it('should require session ID', async () => {
      mockRequest.params = {}; // No sessionId

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_ID_REQUIRED',
          message: 'Session ID is required'
        }
      });
    });

    it('should deny delete operations for non-admin users', async () => {
      mockRequest.params = { sessionId: '123' };
      
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireSessionAccess('delete');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Property Access Control', () => {
    it('should allow access to property with verification session', async () => {
      mockRequest.params = { propertyId: '456' };
      
      const { db } = await import('../../../lib/database');
      // Mock property exists
      (db.select as any).mockResolvedValueOnce([{ id: 456 }]);
      // Mock user has sessions for this property
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456
      }]);

      const middleware = accessControlService.requirePropertyAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access to property without verification session', async () => {
      mockRequest.params = { propertyId: '456' };
      
      const { db } = await import('../../../lib/database');
      // Mock property exists
      (db.select as any).mockResolvedValueOnce([{ id: 456 }]);
      // Mock user has no sessions for this property
      (db.select as any).mockResolvedValueOnce([]);

      const middleware = accessControlService.requirePropertyAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should deny access to non-existent property', async () => {
      mockRequest.params = { propertyId: '999' };
      
      const { db } = await import('../../../lib/database');
      // Mock property doesn't exist
      (db.select as any).mockResolvedValueOnce([]);

      const middleware = accessControlService.requirePropertyAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Property not found',
          restrictions: undefined
        }
      });
    });
  });

  describe('Feedback Access Control', () => {
    it('should allow feedback access for session owner', async () => {
      mockRequest.params = { sessionId: '123' };
      
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireFeedbackAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should apply restrictions for non-admin users', async () => {
      mockRequest.params = { sessionId: '123' };
      
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireFeedbackAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).accessContext).toBeDefined();
    });

    it('should deny feedback access for non-assigned experts', async () => {
      mockRequest.user!.role = 'surveyor';
      mockRequest.params = { sessionId: '123' };
      
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 999, // Different user
        propertyId: 456,
        status: 'in_progress'
      }]);

      const middleware = accessControlService.requireFeedbackAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Access Context Validation', () => {
    it('should check session access correctly', async () => {
      const context = {
        userId: '1',
        userRole: 'user',
        sessionId: '123',
        operation: 'read' as const,
        resourceType: 'session' as const
      };

      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const result = await accessControlService.checkSessionAccess(context);
      expect(result.allowed).toBe(true);
    });

    it('should check property access correctly', async () => {
      const context = {
        userId: '1',
        userRole: 'user',
        propertyId: '456',
        operation: 'read' as const,
        resourceType: 'property' as const
      };

      const { db } = await import('../../../lib/database');
      // Mock property exists
      (db.select as any).mockResolvedValueOnce([{ id: 456 }]);
      // Mock user has sessions for this property
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456
      }]);

      const result = await accessControlService.checkPropertyAccess(context);
      expect(result.allowed).toBe(true);
    });

    it('should check feedback access correctly', async () => {
      const context = {
        userId: '1',
        userRole: 'user',
        sessionId: '123',
        operation: 'read' as const,
        resourceType: 'feedback' as const
      };

      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456,
        status: 'in_progress'
      }]);

      const result = await accessControlService.checkFeedbackAccess(context);
      expect(result.allowed).toBe(true);
      expect(result.restrictions).toContain('Source contact information is protected');
    });
  });

  describe('Data Filtering', () => {
    it('should filter community feedback for non-admin users', () => {
      const feedback = {
        id: 'feedback-123',
        sourceDetails: {
          name: 'John Doe',
          contactInfo: 'john@example.com',
          yearsInArea: 5
        },
        feedback: {
          ownershipHistory: 'Some history'
        }
      };

      const context = {
        userId: '1',
        userRole: 'user',
        operation: 'read' as const,
        resourceType: 'feedback' as const
      };

      const filtered = accessControlService.filterDataByAccess(feedback, context);
      
      expect(filtered.id).toBe('feedback-123');
      expect(filtered.sourceDetails.yearsInArea).toBe(5);
      expect(filtered.sourceDetails.name).toBeUndefined();
      expect(filtered.sourceDetails.contactInfo).toBeUndefined();
    });

    it('should not filter data for admin users', () => {
      const feedback = {
        id: 'feedback-123',
        sourceDetails: {
          name: 'John Doe',
          contactInfo: 'john@example.com'
        }
      };

      const context = {
        userId: '1',
        userRole: 'admin',
        operation: 'read' as const,
        resourceType: 'feedback' as const
      };

      const filtered = accessControlService.filterDataByAccess(feedback, context);
      
      expect(filtered.sourceDetails.name).toBe('John Doe');
      expect(filtered.sourceDetails.contactInfo).toBe('john@example.com');
    });

    it('should filter property data for non-owners', () => {
      const property = {
        id: '456',
        ownershipData: {
          currentOwner: {
            name: 'Jane Smith',
            idNumber: 'ID123456789',
            contactInfo: 'jane@example.com'
          }
        }
      };

      const context = {
        userId: '1',
        userRole: 'user',
        operation: 'read' as const,
        resourceType: 'property' as const
      };

      const filtered = accessControlService.filterDataByAccess(property, context);
      
      expect(filtered.id).toBe('456');
      expect(filtered.ownershipData.currentOwner.name).toBeDefined();
      expect(filtered.ownershipData.currentOwner.idNumber).toBeUndefined();
      expect(filtered.ownershipData.currentOwner.contactInfo).toBeUndefined();
    });
  });

  describe('User Permissions', () => {
    it('should get session permissions for owner', async () => {
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456
      }]);

      const permissions = await accessControlService.getUserPermissions('1', 'session', '123');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
    });

    it('should get property permissions for user with sessions', async () => {
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 123,
        userId: 1,
        propertyId: 456
      }]);

      const permissions = await accessControlService.getUserPermissions('1', 'property', '456');
      expect(permissions).toContain('read');
    });

    it('should return admin permissions for admin users', async () => {
      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([{
        id: 1,
        role: 'admin'
      }]);

      const permissions = await accessControlService.getUserPermissions('1', 'session', '123');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).toContain('delete');
      expect(permissions).toContain('admin');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.params = { sessionId: '123' };
      
      const { db } = await import('../../../lib/database');
      (db.select as any).mockRejectedValueOnce(new Error('Database error'));

      const middleware = accessControlService.requireSessionAccess('read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCESS_CHECK_FAILED',
          message: 'Failed to verify access permissions'
        }
      });
    });

    it('should handle missing session gracefully', async () => {
      const context = {
        userId: '1',
        userRole: 'user',
        sessionId: '999',
        operation: 'read' as const,
        resourceType: 'session' as const
      };

      const { db } = await import('../../../lib/database');
      (db.select as any).mockResolvedValueOnce([]); // No session found

      const result = await accessControlService.checkSessionAccess(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Verification session not found');
    });
  });
});