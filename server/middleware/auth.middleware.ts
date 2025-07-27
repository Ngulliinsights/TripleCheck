import { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import { HTTP_STATUS, AUTH_CONSTANTS, ROLE_HIERARCHY, ROLE_PERMISSIONS, TRUST_SCORE_THRESHOLDS } from '../utils/constants';
import { AUTH_ERROR_MESSAGES } from '../utils/error-messages';
import { ResponseHelper } from '../utils/response-helpers';
import type { UserRole, AuthorizationContext, PermissionCheckResult, SessionConfig } from '../types/auth.types';

// Storage interface for dependency injection
interface IStorage {
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
}

// Default storage instance (will be set at runtime)
let storageInstance: IStorage;

// Enhanced session interface with proper typing
export interface CustomSession {
  userId?: number;
  lastActivity?: string;
  destroy: (callback: (err?: any) => void) => void;
}

// Type-safe authenticated request interface
export interface AuthenticatedRequest extends Omit<Request, 'session'> {
  session?: CustomSession;
  user?: Omit<User, 'password'>;
}

// Re-export UserRole from types for consistency
export type { UserRole } from '../types/auth.types';

// Re-export authentication error messages for backward compatibility
export const AUTH_ERRORS = AUTH_ERROR_MESSAGES;

// Session management utilities
export class SessionManager {
  /**
   * Get user ID from session
   */
  static getUserIdFromSession(req: AuthenticatedRequest): number | null {
    return req.session?.userId ?? null;
  }

  /**
   * Set user session with activity tracking
   */
  static setUserSession(req: AuthenticatedRequest, userId: number): void {
    if (req.session) {
      req.session.userId = userId;
      req.session.lastActivity = new Date().toISOString();
    }
  }

  /**
   * Clear user session
   */
  static clearUserSession(req: AuthenticatedRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if session is valid and not expired
   */
  static isSessionValid(req: AuthenticatedRequest, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    if (!req.session?.userId) {
      return false;
    }

    const lastActivity = req.session.lastActivity;
    if (lastActivity) {
      const sessionAge = Date.now() - new Date(lastActivity).getTime();
      return sessionAge <= maxAgeMs;
    }

    return true;
  }

  /**
   * Update session activity timestamp
   */
  static updateSessionActivity(req: AuthenticatedRequest): void {
    if (req.session?.userId) {
      req.session.lastActivity = new Date().toISOString();
    }
  }
}

// User context utilities
export class UserContext {
  /**
   * Load user data into request context
   */
  static async loadUserContext(req: AuthenticatedRequest): Promise<boolean> {
    const userId = SessionManager.getUserIdFromSession(req);
    if (!userId) {
      return false;
    }

    try {
      if (!storageInstance) {
        // Lazy load storage to avoid circular dependencies
        const { storage } = await import('../infrastructure/storage/storage');
        storageInstance = storage;
      }
      
      const user = await storageInstance.getUser(userId);
      if (user) {
        // Remove password from user context for security
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        return true;
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }

    return false;
  }

  /**
   * Get user role from request context
   */
  static getUserRole(req: AuthenticatedRequest): UserRole | null {
    return (req.user?.role as UserRole) ?? null;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(req: AuthenticatedRequest, role: UserRole): boolean {
    const userRole = UserContext.getUserRole(req);
    return userRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(req: AuthenticatedRequest, roles: UserRole[]): boolean {
    const userRole = UserContext.getUserRole(req);
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Check if user is verified agent
   */
  static isVerifiedAgent(req: AuthenticatedRequest): boolean {
    return req.user?.isVerifiedAgent === true;
  }

  /**
   * Get user trust score
   */
  static getUserTrustScore(req: AuthenticatedRequest): number {
    return req.user?.trustScore ?? 0;
  }
}

// Rate limiting for authentication attempts
class AuthRateLimiter {
  private static attempts = new Map<string, { count: number; lastAttempt: number }>();

  static checkRateLimit(
    clientId: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000
  ): { allowed: boolean; timeLeft?: number } {
    const now = Date.now();
    const attempts = this.attempts.get(clientId);

    if (!attempts || now - attempts.lastAttempt > windowMs) {
      // Reset or initialize attempts
      this.attempts.set(clientId, { count: 1, lastAttempt: now });
      return { allowed: true };
    }

    if (attempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000 / 60);
      return { allowed: false, timeLeft };
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    return { allowed: true };
  }

  static clearAttempts(clientId: string): void {
    this.attempts.delete(clientId);
  }
}

// Core authentication middleware
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = SessionManager.getUserIdFromSession(req);
    
    if (!userId) {
      ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
      return;
    }

    // Validate session
    if (!SessionManager.isSessionValid(req)) {
      // Clear expired session
      await SessionManager.clearUserSession(req);
      ResponseHelper.authError(res, AUTH_ERRORS.SESSION_EXPIRED);
      return;
    }

    // Load user context
    const userLoaded = await UserContext.loadUserContext(req);
    if (!userLoaded) {
      ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
      return;
    }

    // Update session activity
    SessionManager.updateSessionActivity(req);
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    ResponseHelper.error(res, 'Authentication error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Optional authentication middleware (doesn't block if not authenticated)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = SessionManager.getUserIdFromSession(req);
    
    if (userId && SessionManager.isSessionValid(req)) {
      // Load user context if authenticated
      await UserContext.loadUserContext(req);
      SessionManager.updateSessionActivity(req);
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Don't block request on error, just continue without user context
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: UserRole | UserRole[]) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
        return;
      }

      // Load user context if not already loaded
      if (!req.user) {
        const userLoaded = await UserContext.loadUserContext(req);
        if (!userLoaded) {
          ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
          return;
        }
      }

      // Check if user has required role
      if (!UserContext.hasAnyRole(req, roleArray)) {
        ResponseHelper.authorizationError(res, AUTH_ERRORS.INSUFFICIENT_PERMISSIONS);
        return;
      }

      next();
    } catch (error) {
      console.error('Role authorization middleware error:', error);
      ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};

// Verified agent middleware
export const requireVerifiedAgent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First ensure user is authenticated
    const userId = SessionManager.getUserIdFromSession(req);
    if (!userId) {
      ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
      return;
    }

    // Load user context if not already loaded
    if (!req.user) {
      const userLoaded = await UserContext.loadUserContext(req);
      if (!userLoaded) {
        ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
        return;
      }
    }

    // Check if user is verified agent
    if (!UserContext.isVerifiedAgent(req)) {
      ResponseHelper.authorizationError(res, 'Verified agent status required');
      return;
    }

    next();
  } catch (error) {
    console.error('Verified agent middleware error:', error);
    ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Trust score middleware
export const requireMinTrustScore = (minScore: number) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
        return;
      }

      // Load user context if not already loaded
      if (!req.user) {
        const userLoaded = await UserContext.loadUserContext(req);
        if (!userLoaded) {
          ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
          return;
        }
      }

      // Check trust score
      const trustScore = UserContext.getUserTrustScore(req);
      if (trustScore < minScore) {
        ResponseHelper.authorizationError(res, `Minimum trust score of ${minScore} required. Current score: ${trustScore}`);
        return;
      }

      next();
    } catch (error) {
      console.error('Trust score middleware error:', error);
      ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};

// Rate limiting middleware for authentication endpoints
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const rateCheck = AuthRateLimiter.checkRateLimit(clientId, maxAttempts, windowMs);
    
    if (!rateCheck.allowed) {
      ResponseHelper.rateLimited(res, AUTH_ERRORS.RATE_LIMITED, rateCheck.timeLeft ? rateCheck.timeLeft * 60 : undefined);
      return;
    }
    
    next();
  };
};

// Clear authentication attempts on successful login
export const clearAuthAttempts = (req: Request): void => {
  const clientId = req.ip || 'unknown';
  AuthRateLimiter.clearAttempts(clientId);
};

// Session validation middleware
export const validateSession = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.session?.userId) {
    // Check if session is valid
    if (!SessionManager.isSessionValid(req)) {
      // Session is expired, clear it
      req.session.destroy(() => {
        res.status(401).json({
          success: false,
          message: AUTH_ERRORS.SESSION_EXPIRED,
        });
      });
      return;
    }
    
    // Update last activity
    SessionManager.updateSessionActivity(req);
  }
  
  next();
};

// Advanced authorization utilities
export class AuthorizationManager {
  /**
   * Check if user has permission based on role hierarchy
   */
  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Get authorization context for current user
   */
  static getAuthorizationContext(req: AuthenticatedRequest): AuthorizationContext | null {
    if (!req.user) {
      return null;
    }

    return {
      userId: req.user.id,
      user: req.user,
      role: req.user.role as UserRole,
      isVerifiedAgent: req.user.isVerifiedAgent || false,
      trustScore: req.user.trustScore || 0,
    };
  }

  /**
   * Check multiple permission requirements
   */
  static checkPermissions(
    req: AuthenticatedRequest,
    requirements: {
      roles?: UserRole[];
      minTrustScore?: number;
      requireVerifiedAgent?: boolean;
      customCheck?: (context: AuthorizationContext) => boolean;
    }
  ): PermissionCheckResult {
    const context = AuthorizationManager.getAuthorizationContext(req);
    
    if (!context) {
      return {
        allowed: false,
        reason: 'User not authenticated',
      };
    }

    // Check role requirements
    if (requirements.roles && requirements.roles.length > 0) {
      const hasRequiredRole = requirements.roles.some(role => 
        AuthorizationManager.hasPermission(context.role, role)
      );
      
      if (!hasRequiredRole) {
        return {
          allowed: false,
          reason: 'Insufficient role permissions',
          requiredRole: requirements.roles[0],
        };
      }
    }

    // Check trust score requirements
    if (requirements.minTrustScore && context.trustScore < requirements.minTrustScore) {
      return {
        allowed: false,
        reason: 'Insufficient trust score',
        requiredTrustScore: requirements.minTrustScore,
      };
    }

    // Check verified agent requirement
    if (requirements.requireVerifiedAgent && !context.isVerifiedAgent) {
      return {
        allowed: false,
        reason: 'Verified agent status required',
      };
    }

    // Check custom requirements
    if (requirements.customCheck && !requirements.customCheck(context)) {
      return {
        allowed: false,
        reason: 'Custom authorization check failed',
      };
    }

    return { allowed: true };
  }
}

// Enhanced session configuration
export class SessionConfigManager {
  private static defaultConfig: SessionConfig = {
    maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE,
    updateActivity: true,
    requireReauth: false,
  };

  static getSessionConfig(userRole?: UserRole): SessionConfig {
    // Different session configurations based on user role
    switch (userRole) {
      case 'admin':
        return {
          ...SessionConfigManager.defaultConfig,
          maxAge: 8 * 60 * 60 * 1000, // 8 hours for admin
          requireReauth: true,
        };
      case 'agent':
        return {
          ...SessionConfigManager.defaultConfig,
          maxAge: 12 * 60 * 60 * 1000, // 12 hours for agents
        };
      default:
        return SessionConfigManager.defaultConfig;
    }
  }

  static isSessionValidForRole(req: AuthenticatedRequest, userRole: UserRole): boolean {
    const config = SessionConfigManager.getSessionConfig(userRole);
    return SessionManager.isSessionValid(req, config.maxAge);
  }
}

// Comprehensive authorization middleware factory
export const requirePermissions = (requirements: {
  roles?: UserRole[];
  minTrustScore?: number;
  requireVerifiedAgent?: boolean;
  customCheck?: (context: AuthorizationContext) => boolean;
}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
        return;
      }

      // Load user context if not already loaded
      if (!req.user) {
        const userLoaded = await UserContext.loadUserContext(req);
        if (!userLoaded) {
          ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
          return;
        }
      }

      // Check all permission requirements
      const permissionCheck = AuthorizationManager.checkPermissions(req, requirements);
      
      if (!permissionCheck.allowed) {
        const statusCode = permissionCheck.reason?.includes('authenticated') ? 
          HTTP_STATUS.UNAUTHORIZED : HTTP_STATUS.FORBIDDEN;
        
        ResponseHelper.error(res, permissionCheck.reason || 'Access denied', statusCode);
        return;
      }

      next();
    } catch (error) {
      console.error('Permission authorization middleware error:', error);
      ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};

// Role hierarchy middleware (checks if user role is at least the required level)
export const requireMinRole = (minRole: UserRole) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
        return;
      }

      // Load user context if not already loaded
      if (!req.user) {
        const userLoaded = await UserContext.loadUserContext(req);
        if (!userLoaded) {
          ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
          return;
        }
      }

      const userRole = UserContext.getUserRole(req);
      if (!userRole || !AuthorizationManager.hasPermission(userRole, minRole)) {
        ResponseHelper.authorizationError(res, `Minimum role '${minRole}' required`);
        return;
      }

      next();
    } catch (error) {
      console.error('Role hierarchy middleware error:', error);
      ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};

// Enhanced session middleware with role-based configuration
export const enhancedSessionValidation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = SessionManager.getUserIdFromSession(req);
    
    if (userId) {
      // Load user context to get role
      await UserContext.loadUserContext(req);
      const userRole = UserContext.getUserRole(req);
      
      if (userRole) {
        // Check session validity based on user role
        if (!SessionConfigManager.isSessionValidForRole(req, userRole)) {
          await SessionManager.clearUserSession(req);
          ResponseHelper.authError(res, AUTH_ERRORS.SESSION_EXPIRED);
          return;
        }
        
        // Update session activity
        SessionManager.updateSessionActivity(req);
      }
    }
    
    next();
  } catch (error) {
    console.error('Enhanced session validation error:', error);
    next(); // Don't block request on session validation errors
  }
};

// Middleware to check if user owns a resource
export const requireResourceOwnership = (getResourceOwnerId: (req: AuthenticatedRequest) => Promise<number | null>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, AUTH_ERRORS.AUTH_REQUIRED);
        return;
      }

      // Load user context if not already loaded
      if (!req.user) {
        const userLoaded = await UserContext.loadUserContext(req);
        if (!userLoaded) {
          ResponseHelper.authError(res, AUTH_ERRORS.USER_NOT_FOUND);
          return;
        }
      }

      // Check if user is admin (admins can access any resource)
      const userRole = UserContext.getUserRole(req);
      if (userRole === 'admin') {
        next();
        return;
      }

      // Get resource owner ID
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (resourceOwnerId === null) {
        ResponseHelper.notFound(res, 'Resource not found');
        return;
      }

      // Check if user owns the resource
      if (userId !== resourceOwnerId) {
        ResponseHelper.authorizationError(res, 'You can only access your own resources');
        return;
      }

      next();
    } catch (error) {
      console.error('Resource ownership middleware error:', error);
      ResponseHelper.error(res, 'Authorization error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};

// All utilities and middleware are already exported above