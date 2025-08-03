import { eq, and, or } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

import { landVerificationSessions, users, properties } from '../../../src/shared/schema';
import { logger } from '../../infrastructure/monitoring/logger';
import { db } from '../../lib/database';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export interface AccessControlConfig {
  enableRoleBasedAccess: boolean;
  enableResourceOwnership: boolean;
  enableSessionIsolation: boolean;
  adminRoles: string[];
  expertRoles: string[];
}

export interface AccessContext {
  userId: string;
  userRole: string;
  sessionId?: string;
  propertyId?: string;
  operation: 'read' | 'write' | 'delete' | 'admin';
  resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring';
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  restrictions?: string[];
}

/**
 * Service for implementing access controls for verification sessions and results
 * Ensures users can only access their own data and authorized resources
 */
export class AccessControlService {
  private config: AccessControlConfig;

  constructor(config?: Partial<AccessControlConfig>) {
    this.config = {
      enableRoleBasedAccess: true,
      enableResourceOwnership: true,
      enableSessionIsolation: true,
      adminRoles: ['admin', 'super_admin'],
      expertRoles: ['surveyor', 'lawyer', 'appraiser', 'expert'],
      ...config
    };
  }

  /**
   * Middleware to check access to verification sessions
   */
  requireSessionAccess(operation: AccessContext['operation'] = 'read') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id?.toString() || req.session?.userId?.toString();
        const userRole = req.user?.role || 'user';
        const sessionId = req.params.sessionId || req.body.sessionId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required to access verification sessions'
            }
          });
        }

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SESSION_ID_REQUIRED',
              message: 'Session ID is required'
            }
          });
        }

        const accessContext: AccessContext = {
          userId,
          userRole,
          sessionId,
          operation,
          resourceType: 'session'
        };

        const accessResult = await this.checkSessionAccess(accessContext);

        if (!accessResult.allowed) {
          logger.warn('Access denied to verification session', 'AccessControlService', {
            userId,
            sessionId,
            operation,
            reason: accessResult.reason
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: accessResult.reason || 'Access denied to verification session',
              restrictions: accessResult.restrictions
            }
          });
        }

        // Add access context to request for downstream use
        (req as any).accessContext = accessContext;
        next();

      } catch (error) {
        logger.error('Error checking session access', 'AccessControlService', undefined, error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'ACCESS_CHECK_FAILED',
            message: 'Failed to verify access permissions'
          }
        });
      }
    };
  }

  /**
   * Middleware to check access to property data
   */
  requirePropertyAccess(operation: AccessContext['operation'] = 'read') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id?.toString() || req.session?.userId?.toString();
        const userRole = req.user?.role || 'user';
        const propertyId = req.params.propertyId || req.body.propertyId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required to access property data'
            }
          });
        }

        if (!propertyId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'PROPERTY_ID_REQUIRED',
              message: 'Property ID is required'
            }
          });
        }

        const accessContext: AccessContext = {
          userId,
          userRole,
          propertyId,
          operation,
          resourceType: 'property'
        };

        const accessResult = await this.checkPropertyAccess(accessContext);

        if (!accessResult.allowed) {
          logger.warn('Access denied to property data', 'AccessControlService', {
            userId,
            propertyId,
            operation,
            reason: accessResult.reason
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: accessResult.reason || 'Access denied to property data',
              restrictions: accessResult.restrictions
            }
          });
        }

        (req as any).accessContext = accessContext;
        next();

      } catch (error) {
        logger.error('Error checking property access', 'AccessControlService', undefined, error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'ACCESS_CHECK_FAILED',
            message: 'Failed to verify access permissions'
          }
        });
      }
    };
  }

  /**
   * Middleware to check access to community feedback
   */
  requireFeedbackAccess(operation: AccessContext['operation'] = 'read') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id?.toString() || req.session?.userId?.toString();
        const userRole = req.user?.role || 'user';
        const sessionId = req.params.sessionId || req.body.sessionId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required to access community feedback'
            }
          });
        }

        const accessContext: AccessContext = {
          userId,
          userRole,
          sessionId,
          operation,
          resourceType: 'feedback'
        };

        const accessResult = await this.checkFeedbackAccess(accessContext);

        if (!accessResult.allowed) {
          logger.warn('Access denied to community feedback', 'AccessControlService', {
            userId,
            sessionId,
            operation,
            reason: accessResult.reason
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: accessResult.reason || 'Access denied to community feedback',
              restrictions: accessResult.restrictions
            }
          });
        }

        (req as any).accessContext = accessContext;
        next();

      } catch (error) {
        logger.error('Error checking feedback access', 'AccessControlService', undefined, error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'ACCESS_CHECK_FAILED',
            message: 'Failed to verify access permissions'
          }
        });
      }
    };
  }

  /**
   * Check if user has access to a verification session
   */
  async checkSessionAccess(context: AccessContext): Promise<AccessResult> {
    try {
      // Admin users have full access
      if (this.config.enableRoleBasedAccess && this.isAdmin(context.userRole)) {
        return { allowed: true };
      }

      // Get session from database
      const [session] = await db.select()
        .from(landVerificationSessions)
        .where(eq(landVerificationSessions.id, parseInt(context.sessionId!)))
        .limit(1);

      if (!session) {
        return {
          allowed: false,
          reason: 'Verification session not found'
        };
      }

      // Check ownership
      if (this.config.enableResourceOwnership) {
        if (session.userId.toString() !== context.userId) {
          // Check if user is an assigned expert
          const isExpert = await this.checkExpertAssignment(context.sessionId!, context.userId);
          if (!isExpert) {
            return {
              allowed: false,
              reason: 'Access denied: You can only access your own verification sessions'
            };
          }
        }
      }

      // Check operation permissions
      const operationAllowed = await this.checkOperationPermission(context);
      if (!operationAllowed.allowed) {
        return operationAllowed;
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Error checking session access', 'AccessControlService', undefined, error as Error);
      return {
        allowed: false,
        reason: 'Failed to verify session access'
      };
    }
  }

  /**
   * Check if user has access to property data
   */
  async checkPropertyAccess(context: AccessContext): Promise<AccessResult> {
    try {
      // Admin users have full access
      if (this.config.enableRoleBasedAccess && this.isAdmin(context.userRole)) {
        return { allowed: true };
      }

      // Get property from database
      const [property] = await db.select()
        .from(properties)
        .where(eq(properties.id, parseInt(context.propertyId!)))
        .limit(1);

      if (!property) {
        return {
          allowed: false,
          reason: 'Property not found'
        };
      }

      // Check if user has any verification sessions for this property
      const userSessions = await db.select()
        .from(landVerificationSessions)
        .where(
          and(
            eq(landVerificationSessions.propertyId, parseInt(context.propertyId!)),
            eq(landVerificationSessions.userId, parseInt(context.userId))
          )
        );

      if (userSessions.length === 0) {
        return {
          allowed: false,
          reason: 'Access denied: No verification sessions found for this property'
        };
      }

      // Check operation permissions
      const operationAllowed = await this.checkOperationPermission(context);
      if (!operationAllowed.allowed) {
        return operationAllowed;
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Error checking property access', 'AccessControlService', undefined, error as Error);
      return {
        allowed: false,
        reason: 'Failed to verify property access'
      };
    }
  }

  /**
   * Check if user has access to community feedback
   */
  async checkFeedbackAccess(context: AccessContext): Promise<AccessResult> {
    try {
      // First check session access
      const sessionAccess = await this.checkSessionAccess({
        ...context,
        resourceType: 'session'
      });

      if (!sessionAccess.allowed) {
        return sessionAccess;
      }

      // Additional restrictions for community feedback
      const restrictions: string[] = [];

      // Non-admin users cannot see source contact information
      if (!this.isAdmin(context.userRole)) {
        restrictions.push('Source contact information is protected');
      }

      // Experts can only see feedback relevant to their assignments
      if (this.isExpert(context.userRole) && !this.isAdmin(context.userRole)) {
        const isAssigned = await this.checkExpertAssignment(context.sessionId!, context.userId);
        if (!isAssigned) {
          return {
            allowed: false,
            reason: 'Access denied: Experts can only access feedback for assigned sessions'
          };
        }
        restrictions.push('Limited to feedback relevant to your expert assignment');
      }

      return {
        allowed: true,
        restrictions: restrictions.length > 0 ? restrictions : undefined
      };

    } catch (error) {
      logger.error('Error checking feedback access', 'AccessControlService', undefined, error as Error);
      return {
        allowed: false,
        reason: 'Failed to verify feedback access'
      };
    }
  }

  /**
   * Filter data based on user access level
   */
  filterDataByAccess(data: any, context: AccessContext): any {
    if (!data) return data;

    // Admin users see everything
    if (this.isAdmin(context.userRole)) {
      return data;
    }

    // Filter community feedback to protect privacy
    if (context.resourceType === 'feedback') {
      return this.filterCommunityFeedback(data, context);
    }

    // Filter ownership data for non-owners
    if (context.resourceType === 'property') {
      return this.filterPropertyData(data, context);
    }

    return data;
  }

  /**
   * Get user permissions for a resource
   */
  async getUserPermissions(userId: string, resourceType: string, resourceId: string): Promise<string[]> {
    const permissions: string[] = [];

    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (!user) {
        return permissions;
      }

      // Admin permissions
      if (this.isAdmin(user.role)) {
        permissions.push('read', 'write', 'delete', 'admin');
        return permissions;
      }

      // Resource-specific permissions
      switch (resourceType) {
        case 'session':
          const sessionPermissions = await this.getSessionPermissions(userId, resourceId);
          permissions.push(...sessionPermissions);
          break;

        case 'property':
          const propertyPermissions = await this.getPropertyPermissions(userId, resourceId);
          permissions.push(...propertyPermissions);
          break;

        case 'feedback':
          const feedbackPermissions = await this.getFeedbackPermissions(userId, resourceId);
          permissions.push(...feedbackPermissions);
          break;
      }

      return permissions;

    } catch (error) {
      logger.error('Error getting user permissions', 'AccessControlService', undefined, error as Error);
      return permissions;
    }
  }

  // Private helper methods

  private isAdmin(role: string): boolean {
    return this.config.adminRoles.includes(role);
  }

  private isExpert(role: string): boolean {
    return this.config.expertRoles.includes(role);
  }

  private async checkExpertAssignment(sessionId: string, userId: string): Promise<boolean> {
    // This would check expert assignments table when implemented
    // For now, return false
    return false;
  }

  private async checkOperationPermission(context: AccessContext): Promise<AccessResult> {
    // Check if operation is allowed based on role and resource type
    if (context.operation === 'delete' && !this.isAdmin(context.userRole)) {
      return {
        allowed: false,
        reason: 'Delete operations require admin privileges'
      };
    }

    if (context.operation === 'admin' && !this.isAdmin(context.userRole)) {
      return {
        allowed: false,
        reason: 'Admin operations require admin privileges'
      };
    }

    return { allowed: true };
  }

  private filterCommunityFeedback(feedback: any, context: AccessContext): any {
    if (Array.isArray(feedback)) {
      return feedback.map(item => this.filterCommunityFeedback(item, context));
    }

    if (!feedback || typeof feedback !== 'object') {
      return feedback;
    }

    const filtered = { ...feedback };

    // Remove sensitive contact information for non-admin users
    if (!this.isAdmin(context.userRole) && filtered.sourceDetails) {
      delete filtered.sourceDetails.name;
      delete filtered.sourceDetails.contactInfo;
    }

    return filtered;
  }

  private filterPropertyData(property: any, context: AccessContext): any {
    if (!property || typeof property !== 'object') {
      return property;
    }

    const filtered = { ...property };

    // Filter sensitive ownership information for non-owners
    if (filtered.ownershipData && !this.isAdmin(context.userRole)) {
      // Keep only basic ownership information
      if (filtered.ownershipData.currentOwner) {
        delete filtered.ownershipData.currentOwner.idNumber;
        delete filtered.ownershipData.currentOwner.contactInfo;
      }
    }

    return filtered;
  }

  private async getSessionPermissions(userId: string, sessionId: string): Promise<string[]> {
    const permissions: string[] = [];

    try {
      const [session] = await db.select()
        .from(landVerificationSessions)
        .where(eq(landVerificationSessions.id, parseInt(sessionId)))
        .limit(1);

      if (session && session.userId.toString() === userId) {
        permissions.push('read', 'write');
      }

      // Check expert assignment
      const isExpert = await this.checkExpertAssignment(sessionId, userId);
      if (isExpert) {
        permissions.push('read');
      }

    } catch (error) {
      logger.error('Error getting session permissions', 'AccessControlService', undefined, error as Error);
    }

    return permissions;
  }

  private async getPropertyPermissions(userId: string, propertyId: string): Promise<string[]> {
    const permissions: string[] = [];

    try {
      const userSessions = await db.select()
        .from(landVerificationSessions)
        .where(
          and(
            eq(landVerificationSessions.propertyId, parseInt(propertyId)),
            eq(landVerificationSessions.userId, parseInt(userId))
          )
        );

      if (userSessions.length > 0) {
        permissions.push('read');
      }

    } catch (error) {
      logger.error('Error getting property permissions', 'AccessControlService', undefined, error as Error);
    }

    return permissions;
  }

  private async getFeedbackPermissions(userId: string, sessionId: string): Promise<string[]> {
    // Feedback permissions are based on session permissions
    return this.getSessionPermissions(userId, sessionId);
  }
}

// Create singleton instance
export const accessControlService = new AccessControlService();