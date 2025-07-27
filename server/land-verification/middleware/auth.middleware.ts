import { Request, Response, NextFunction } from 'express';
import { 
  AuthenticationError, 
  AuthorizationError,
  ValidationError 
} from '../../../src/shared/utils/errors';
import { db } from '../../lib/database';
import { users, landVerificationSessions } from '../../../src/shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../infrastructure/monitoring/logger';

// Extend Request interface for land verification context
declare global {
  namespace Express {
    interface Request {
      landVerificationContext?: {
        sessionId?: string;
        propertyId?: string;
        canModify: boolean;
        canView: boolean;
        userRole: 'user' | 'agent' | 'admin';
        trustScore: number;
      };
    }
  }
}

/**
 * Enhanced authentication middleware for land verification endpoints
 * Validates user authentication and extracts user context
 * Requirements: 9.2 - Authentication for verification sessions
 */
export const landVerificationAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is already authenticated by global auth middleware
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required for land verification operations',
        { endpoint: req.originalUrl }
      );
    }

    // Validate user exists in database and is active
    const [user] = await db.select()
      .from(users)
      .where(and(
        eq(users.id, req.user.id),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      throw new AuthenticationError(
        'User account not found or inactive',
        { userId: req.user.id }
      );
    }

    // Initialize land verification context
    req.landVerificationContext = {
      canModify: true,
      canView: true,
      userRole: user.role as 'user' | 'agent' | 'admin',
      trustScore: user.trustScore
    };

    logger.info(`Land verification auth successful for user ${user.id}`, 'LandVerificationAuth');
    next();

  } catch (error) {
    logger.error('Land verification authentication failed', 'LandVerificationAuth', undefined, error as Error);
    next(error);
  }
};

/**
 * Authorization middleware for session-specific operations
 * Ensures user has permission to access/modify specific verification sessions
 * Requirements: 9.2 - Authorization for verification sessions
 */
export const sessionAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user!.id;

    if (!sessionId) {
      throw new ValidationError(
        'Session ID is required',
        { sessionId: ['Session ID parameter is missing'] }
      );
    }

    // Check if session exists and user has access
    const [session] = await db.select()
      .from(landVerificationSessions)
      .where(eq(landVerificationSessions.id, parseInt(sessionId)))
      .limit(1);

    if (!session) {
      throw new AuthorizationError(
        'Verification session not found or access denied',
        { sessionId, userId }
      );
    }

    // Check ownership or admin privileges
    const hasAccess = session.userId === userId || req.landVerificationContext?.userRole === 'admin';

    if (!hasAccess) {
      throw new AuthorizationError(
        'Insufficient permissions to access this verification session',
        { sessionId, userId, sessionOwner: session.userId }
      );
    }

    // Update context with session information
    if (req.landVerificationContext) {
      req.landVerificationContext.sessionId = sessionId;
      req.landVerificationContext.propertyId = session.propertyId.toString();
      req.landVerificationContext.canModify = session.userId === userId || req.landVerificationContext.userRole === 'admin';
    }

    logger.info(`Session authorization successful for session ${sessionId}`, 'LandVerificationAuth');
    next();

  } catch (error) {
    logger.error('Session authorization failed', 'LandVerificationAuth', undefined, error as Error);
    next(error);
  }
};

/**
 * Trust score validation middleware
 * Ensures user has sufficient trust score for land verification operations
 * Requirements: 9.2 - Trust-based access control
 */
export const trustScoreValidation = (minimumTrustScore: number = 30) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userTrustScore = req.landVerificationContext?.trustScore || 0;

      if (userTrustScore < minimumTrustScore) {
        throw new AuthorizationError(
          'Insufficient trust score for land verification operations',
          { 
            currentTrustScore: userTrustScore, 
            requiredTrustScore: minimumTrustScore,
            userId: req.user?.id
          }
        );
      }

      logger.info(`Trust score validation passed for user ${req.user?.id}`, 'LandVerificationAuth');
      next();

    } catch (error) {
      logger.error('Trust score validation failed', 'LandVerificationAuth', undefined, error as Error);
      next(error);
    }
  };
};

/**
 * Role-based authorization middleware
 * Restricts access based on user roles
 * Requirements: 9.2 - Role-based access control
 */
export const roleAuthorization = (allowedRoles: Array<'user' | 'agent' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.landVerificationContext?.userRole;

      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new AuthorizationError(
          'Insufficient role permissions for this operation',
          { 
            userRole, 
            allowedRoles,
            userId: req.user?.id
          }
        );
      }

      logger.info(`Role authorization successful for user ${req.user?.id} with role ${userRole}`, 'LandVerificationAuth');
      next();

    } catch (error) {
      logger.error('Role authorization failed', 'LandVerificationAuth', undefined, error as Error);
      next(error);
    }
  };
};

/**
 * Property ownership validation middleware
 * Ensures user has rights to initiate verification for a property
 * Requirements: 9.2 - Property access control
 */
export const propertyOwnershipValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const propertyId = req.params.propertyId || req.body.propertyId;
    const userId = req.user!.id;

    if (!propertyId) {
      throw new ValidationError(
        'Property ID is required',
        { propertyId: ['Property ID parameter is missing'] }
      );
    }

    // Import properties table dynamically to avoid circular dependencies
    const { properties } = await import('../../../src/shared/schema');

    // Check if property exists and user has access
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.id, parseInt(propertyId)))
      .limit(1);

    if (!property) {
      throw new AuthorizationError(
        'Property not found or access denied',
        { propertyId, userId }
      );
    }

    // Check ownership or admin/agent privileges
    const hasAccess = property.ownerId === userId || 
                     req.landVerificationContext?.userRole === 'admin' ||
                     req.landVerificationContext?.userRole === 'agent';

    if (!hasAccess) {
      throw new AuthorizationError(
        'Insufficient permissions to access this property',
        { propertyId, userId, propertyOwner: property.ownerId }
      );
    }

    // Update context with property information
    if (req.landVerificationContext) {
      req.landVerificationContext.propertyId = propertyId;
    }

    logger.info(`Property ownership validation successful for property ${propertyId}`, 'LandVerificationAuth');
    next();

  } catch (error) {
    logger.error('Property ownership validation failed', 'LandVerificationAuth', undefined, error as Error);
    next(error);
  }
};

/**
 * Rate limiting middleware for land verification operations
 * Prevents abuse of verification services
 * Requirements: 9.3 - Rate limiting for API security
 */
export const verificationRateLimit = () => {
  const userRequestCounts = new Map<number, { count: number; resetTime: number }>();
  const RATE_LIMIT = 10; // Max 10 verification requests per hour
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userId = req.user!.id;
      const now = Date.now();
      
      const userLimit = userRequestCounts.get(userId);
      
      if (!userLimit || now > userLimit.resetTime) {
        // Reset or initialize counter
        userRequestCounts.set(userId, {
          count: 1,
          resetTime: now + WINDOW_MS
        });
        next();
        return;
      }

      if (userLimit.count >= RATE_LIMIT) {
        const resetIn = Math.ceil((userLimit.resetTime - now) / 1000 / 60); // minutes
        
        throw new AuthorizationError(
          'Rate limit exceeded for land verification operations',
          { 
            userId,
            limit: RATE_LIMIT,
            resetInMinutes: resetIn
          }
        );
      }

      // Increment counter
      userLimit.count++;
      userRequestCounts.set(userId, userLimit);

      logger.info(`Rate limit check passed for user ${userId} (${userLimit.count}/${RATE_LIMIT})`, 'LandVerificationAuth');
      next();

    } catch (error) {
      logger.error('Rate limit validation failed', 'LandVerificationAuth', undefined, error as Error);
      next(error);
    }
  };
};

/**
 * Audit logging middleware for land verification operations
 * Logs all verification activities for compliance and monitoring
 * Requirements: 9.6 - Audit trails for verification activities
 */
export const auditLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auditData = {
      timestamp: new Date().toISOString(),
      operation,
      userId: req.user?.id,
      userRole: req.landVerificationContext?.userRole,
      sessionId: req.landVerificationContext?.sessionId,
      propertyId: req.landVerificationContext?.propertyId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestBody: req.method !== 'GET' ? req.body : undefined,
      correlationId: (req as any).correlationId
    };

    // Log the audit entry
    logger.info(`Land verification audit: ${operation}`, 'LandVerificationAudit', auditData);

    // In a production system, this would also:
    // 1. Store audit logs in a dedicated audit database
    // 2. Send to compliance monitoring systems
    // 3. Generate alerts for suspicious activities

    next();
  };
};

export default {
  landVerificationAuth,
  sessionAuthorization,
  trustScoreValidation,
  roleAuthorization,
  propertyOwnershipValidation,
  verificationRateLimit,
  auditLogger
};