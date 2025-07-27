/**
 * ReviewRoutes - Handles all review-related endpoints
 * 
 * This module provides endpoints for creating, retrieving, and managing reviews
 * with proper validation, authentication, and error handling.
 */

import { Router, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireAuth, SessionManager } from '../middleware/auth.middleware';
import { validateRequest, CommonValidationSchemas, ReviewValidationSchemas, type ValidatedRequest } from '../middleware/validation.middleware';
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
 * ReviewRoutes class handles all review-related endpoints
 */
export class ReviewRoutes implements IRouteModule {
  private router: Router;

  constructor(
    private reviewService: ReviewService
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
    console.log('ReviewRoutes initialized');
  }

  /**
   * Set up all review routes
   */
  private setupRoutes(): void {
    // Get reviews for a specific property
    this.router.get(
      '/properties/:id/reviews',
      validateRequest({
        params: CommonValidationSchemas.idParam,
        query: z.object({
          page: z.coerce.number().int().min(1).default(1).optional(),
          limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
        }).optional(),
      }),
      this.getPropertyReviews.bind(this)
    );

    // Create a review for a property
    this.router.post(
      '/properties/:id/reviews',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
        body: ReviewValidationSchemas.createReview,
      }),
      this.createReview.bind(this)
    );

    // Get reviews by current user
    this.router.get(
      '/my-reviews',
      requireAuth,
      this.getUserReviews.bind(this)
    );

    // Get review summary for a property
    this.router.get(
      '/properties/:id/reviews/summary',
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.getReviewSummary.bind(this)
    );

    // Mark a review as helpful
    this.router.post(
      '/:id/helpful',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.markReviewHelpful.bind(this)
    );

    // Report a review
    this.router.post(
      '/:id/report',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
        body: z.object({
          reason: z.string().min(5, 'Report reason must be at least 5 characters').max(500, 'Report reason cannot exceed 500 characters'),
        }),
      }),
      this.reportReview.bind(this)
    );

    // Check if user can review a property
    this.router.get(
      '/properties/:id/can-review',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.canUserReviewProperty.bind(this)
    );

    // Get review analytics for property owner
    this.router.get(
      '/analytics',
      requireAuth,
      this.getReviewAnalytics.bind(this)
    );
  }

  /**
   * Get reviews for a specific property
   */
  private async getPropertyReviews(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const propertyId = req.validatedParams?.id;
      const pagination = req.validatedQuery;

      const result = await this.reviewService.getPropertyReviews(
        propertyId,
        pagination ? {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
        } : undefined
      );

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve reviews', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'Reviews retrieved successfully');
    } catch (error) {
      console.error('Error getting property reviews:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Create a review for a property
   */
  private async createReview(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const propertyId = req.validatedParams?.id;
      const reviewData = req.validatedBody;

      const result = await this.reviewService.createReview(
        {
          propertyId,
          rating: reviewData.rating,
          comment: reviewData.comment,
        },
        userId
      );

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to create review', 400);
        return;
      }

      ResponseHelper.created(res, result.data, result.message || 'Review created successfully');
    } catch (error) {
      console.error('Error creating review:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get reviews by current user
   */
  private async getUserReviews(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.reviewService.getUserReviews(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve user reviews', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'User reviews retrieved successfully');
    } catch (error) {
      console.error('Error getting user reviews:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get review summary for a property
   */
  private async getReviewSummary(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const propertyId = req.validatedParams?.id;

      const result = await this.reviewService.generateReviewSummary(propertyId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to generate review summary', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'Review summary generated successfully');
    } catch (error) {
      console.error('Error generating review summary:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Mark a review as helpful
   */
  private async markReviewHelpful(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const reviewId = req.validatedParams?.id;

      const result = await this.reviewService.markReviewHelpful(reviewId, userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to mark review as helpful', 400);
        return;
      }

      ResponseHelper.successMessage(res, result.message || 'Review marked as helpful');
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Report a review for moderation
   */
  private async reportReview(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const reviewId = req.validatedParams?.id;
      const { reason } = req.validatedBody;

      const result = await this.reviewService.reportReview(reviewId, userId, reason);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to report review', 400);
        return;
      }

      ResponseHelper.successMessage(res, result.message || 'Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Check if user can review a property
   */
  private async canUserReviewProperty(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const propertyId = req.validatedParams?.id;

      const result = await this.reviewService.canUserReviewProperty(userId, propertyId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to check review eligibility', 400);
        return;
      }

      ResponseHelper.success(res, { canReview: result.data }, result.message);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Get review analytics for property owner
   */
  private async getReviewAnalytics(req: AuthenticatedValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = SessionManager.getUserIdFromSession(req);
      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.reviewService.getReviewAnalytics(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to get review analytics', 400);
        return;
      }

      ResponseHelper.success(res, result.data, 'Review analytics retrieved successfully');
    } catch (error) {
      console.error('Error getting review analytics:', error);
      ResponseHelper.error(res, 'Internal server error', 500);
    }
  }
}