/**
 * UserRoutes - Handles all user profile management endpoints
 * 
 * This module provides endpoints for user profile management, preferences,
 * statistics, and administrative functions with proper validation and authentication.
 */

import { Router, Response } from 'express';
import { UserService } from '../services/UserService';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { 
  requireAuth, 
  requireRole, 
  requireMinTrustScore,
  SessionManager,
  UserContext 
} from '../middleware/auth.middleware';
import { validateRequest, CommonValidationSchemas, UserValidationSchemas, type ValidatedRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';
import { z } from 'zod';

// Combined interface for authenticated and validated requests
interface AuthenticatedValidatedRequest extends AuthenticatedRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  validatedHeaders?: any;
  correlationId?: string;
}

export interface IRouteModule {
  getRouter(): Router;
  initialize(): Promise<void>;
}

/**
 * UserRoutes class handles all user profile management endpoints
 */
export class UserRoutes implements IRouteModule {
  private router: Router;

  constructor(
    private userService: UserService
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Get the configured router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Initialize the route module
   */
  async initialize(): Promise<void> {
    // Any initialization logic can go here
    console.log('UserRoutes initialized');
  }

  /**
   * Set up all user routes
   */
  private setupRoutes(): void {
    // Get current user profile
    this.router.get(
      '/me',
      requireAuth,
      this.getCurrentUserProfile.bind(this)
    );

    // Update current user profile
    this.router.put(
      '/me',
      requireAuth,
      validateRequest({
        body: UserValidationSchemas.updateProfile,
      }),
      this.updateCurrentUserProfile.bind(this)
    );

    // Get user statistics
    this.router.get(
      '/me/statistics',
      requireAuth,
      this.getUserStatistics.bind(this)
    );

    // Get user preferences
    this.router.get(
      '/me/preferences',
      requireAuth,
      this.getUserPreferences.bind(this)
    );

    // Update user preferences
    this.router.put(
      '/me/preferences',
      requireAuth,
      validateRequest({
        body: z.object({
          emailNotifications: z.boolean().optional(),
          smsNotifications: z.boolean().optional(),
          marketingEmails: z.boolean().optional(),
          language: z.enum(['en', 'sw', 'fr']).optional(),
          timezone: z.string().optional(),
          currency: z.enum(['KES', 'USD', 'EUR']).optional(),
        }),
      }),
      this.updateUserPreferences.bind(this)
    );

    // Get user activity log
    this.router.get(
      '/me/activity',
      requireAuth,
      validateRequest({
        query: CommonValidationSchemas.pagination.optional(),
      }),
      this.getUserActivity.bind(this)
    );

    // Change password
    this.router.put(
      '/me/password',
      requireAuth,
      validateRequest({
        body: UserValidationSchemas.changePassword,
      }),
      this.changePassword.bind(this)
    );

    // Get user by ID (public profile)
    this.router.get(
      '/:id',
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.getUserById.bind(this)
    );

    // Search users (admin only)
    this.router.get(
      '/',
      requireAuth,
      requireRole(['admin']),
      validateRequest({
        query: z.object({
          role: z.enum(['user', 'agent', 'admin']).optional(),
          verificationLevel: z.enum(['unverified', 'basic', 'verified', 'premium']).optional(),
          trustScoreMin: z.coerce.number().min(0).max(100).optional(),
          trustScoreMax: z.coerce.number().min(0).max(100).optional(),
          joinedAfter: z.string().datetime().optional(),
          joinedBefore: z.string().datetime().optional(),
          active: z.coerce.boolean().optional(),
          ...CommonValidationSchemas.pagination.shape,
        }).optional(),
      }),
      this.searchUsers.bind(this)
    );

    // Update user trust score (admin only)
    this.router.put(
      '/:id/trust-score',
      requireAuth,
      requireRole(['admin']),
      validateRequest({
        params: CommonValidationSchemas.idParam,
        body: z.object({
          trustScore: z.number().int().min(0).max(100),
          reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason cannot exceed 500 characters'),
        }),
      }),
      this.updateUserTrustScore.bind(this)
    );

    // Promote user to verified agent (admin only)
    this.router.post(
      '/:id/promote-agent',
      requireAuth,
      requireRole(['admin']),
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.promoteToVerifiedAgent.bind(this)
    );

    // Get user engagement metrics (admin only)
    this.router.get(
      '/admin/engagement-metrics',
      requireAuth,
      requireRole(['admin']),
      this.getUserEngagementMetrics.bind(this)
    );
  }

  /**
   * Get current user profile
   */
  private async getCurrentUserProfile(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.userService.getUserProfile(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user profile', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Error getting user profile:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Update current user profile
   */
  private async updateCurrentUserProfile(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const updates = req.validatedBody;

      const result = await this.userService.updateUserProfile(userId, updates);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to update user profile', 400);
        return;
      }

      ResponseHelper.success(res, result.data, result.message || 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get user statistics
   */
  private async getUserStatistics(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.userService.getUserStatistics(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user statistics', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'User statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting user statistics:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get user preferences
   */
  private async getUserPreferences(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.userService.getUserPreferences(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user preferences', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'User preferences retrieved successfully');
    } catch (error) {
      console.error('Error getting user preferences:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Update user preferences
   */
  private async updateUserPreferences(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const preferences = req.validatedBody;

      const result = await this.userService.updateUserPreferences(userId, preferences);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to update user preferences', 400);
        return;
      }

      ResponseHelper.success(res, result.data, result.message || 'Preferences updated successfully');
    } catch (error) {
      console.error('Error updating user preferences:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get user activity log
   */
  private async getUserActivity(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const pagination = req.validatedQuery;

      const result = await this.userService.getUserActivity(
        userId,
        pagination ? {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
        } : undefined
      );

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user activity', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'User activity retrieved successfully');
    } catch (error) {
      console.error('Error getting user activity:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Change user password
   */
  private async changePassword(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const { currentPassword, newPassword } = req.validatedBody;

      // Get current user to verify password
      const currentUser = await this.userService.getUserById(userId);
      if (!currentUser) {
        ResponseHelper.notFound(res, 'User not found');
        return;
      }

      // Verify current password (this would need to be implemented in AuthService)
      // For now, we'll simulate password verification
      const bcrypt = await import('bcrypt');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isCurrentPasswordValid) {
        ResponseHelper.error(res, 'Current password is incorrect', 400);
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const result = await this.userService.updateUserPassword(userId, hashedNewPassword);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to update password', 400);
        return;
      }

      ResponseHelper.successMessage(res, result.message || 'Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get user by ID (public profile)
   */
  private async getUserById(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.validatedParams?.id;

      const result = await this.userService.getUserProfile(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user profile', 400);
        return;
      }

      // Remove sensitive information for public profile
      const publicProfile = {
        id: result.data?.id,
        username: result.data?.username,
        firstName: result.data?.firstName,
        lastName: result.data?.lastName,
        bio: result.data?.bio,
        trustScore: result.data?.trustScore,
        isVerifiedAgent: result.data?.isVerifiedAgent,
        verificationLevel: result.data?.verificationLevel,
        joinedAt: result.data?.joinedAt,
      };

      ResponseHelper.success(res, publicProfile, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Error getting user by ID:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Search users (admin only)
   */
  private async searchUsers(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const filters = req.validatedQuery || {};

      const result = await this.userService.searchUsers(filters);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to search users', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'Users retrieved successfully');
    } catch (error) {
      console.error('Error searching users:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Update user trust score (admin only)
   */
  private async updateUserTrustScore(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = SessionManager.getUserIdFromSession(req);
      if (!adminUserId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const userId = req.validatedParams?.id;
      const { trustScore, reason } = req.validatedBody;

      const result = await this.userService.updateTrustScore(userId, trustScore, reason, adminUserId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to update trust score', 400);
        return;
      }

      ResponseHelper.success(res, result.data, result.message || 'Trust score updated successfully');
    } catch (error) {
      console.error('Error updating trust score:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Promote user to verified agent (admin only)
   */
  private async promoteToVerifiedAgent(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = SessionManager.getUserIdFromSession(req);
      if (!adminUserId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const userId = req.validatedParams?.id;

      const result = await this.userService.promoteToVerifiedAgent(userId, adminUserId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to promote user', 400);
        return;
      }

      ResponseHelper.success(res, result.data, result.message || 'User promoted successfully');
    } catch (error) {
      console.error('Error promoting user:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get user engagement metrics (admin only)
   */
  private async getUserEngagementMetrics(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.userService.getUserEngagementMetrics();

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve engagement metrics', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'Engagement metrics retrieved successfully');
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }
}