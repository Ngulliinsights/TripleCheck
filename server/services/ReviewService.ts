/**
 * ReviewService - Handles review creation and management business logic
 * 
 * This service provides comprehensive review management functionality including
 * creation, retrieval, validation, moderation, and analytics.
 */

import { storage } from "../infrastructure/storage/storage";
import type { Review, InsertReview } from "../../src/shared/schema";
import type { 
  ReviewCreateRequest, 
  ReviewUpdateRequest, 
  ReviewWithMetadata,
  ReviewSummary,
  ReviewSearchFilters,
  ReviewModerationStatus,
  ReviewWithModeration
} from "../types/review.types";
import type { PaginationParams, PaginatedResult } from "../infrastructure/storage/storage";
import { insertReviewSchema } from "../../src/shared/schema";
import { z } from "zod";
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  DatabaseError,
  generateCorrelationId 
} from "../../src/shared/utils/errors";

export interface ReviewServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentTrends: {
    period: string;
    averageRating: number;
    reviewCount: number;
  }[];
  topReviewers: {
    userId: number;
    username: string;
    reviewCount: number;
    averageRating: number;
  }[];
}

/**
 * ReviewService handles all review-related business logic
 */
export class ReviewService {
  /**
   * Create a new review with validation and duplicate checking
   */
  async createReview(
    reviewData: ReviewCreateRequest, 
    userId: number
  ): Promise<ReviewServiceResult<Review>> {
    try {
      // Validate input data including userId
      const validationResult = this.validateReviewData(reviewData, userId);
      if (!validationResult.success) {
        return validationResult;
      }

      // Check if user has already reviewed this property
      const existingReviews = await storage.getReviews(reviewData.propertyId);
      const userHasReviewed = existingReviews.some(review => review.userId === userId);
      
      if (userHasReviewed) {
        return {
          success: false,
          error: 'You have already reviewed this property'
        };
      }

      // Verify property exists
      const property = await storage.getProperty(reviewData.propertyId);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      // Prevent users from reviewing their own properties
      if (property.ownerId === userId) {
        return {
          success: false,
          error: 'You cannot review your own property'
        };
      }

      // Create review data for insertion
      const insertData: InsertReview = {
        propertyId: reviewData.propertyId,
        userId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim(),
        verified: false, // Reviews start as unverified
      };

      // Create review in storage
      const review = await storage.createReview(insertData);

      // Update property owner's trust score based on review
      await this.updateOwnerTrustScore(property.ownerId, reviewData.rating);

      return {
        success: true,
        data: review,
        message: 'Review created successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get reviews for a specific property
   */
  async getPropertyReviews(
    propertyId: number,
    pagination?: PaginationParams
  ): Promise<ReviewServiceResult<readonly Review[] | PaginatedResult<Review>>> {
    try {
      if (!propertyId || propertyId <= 0) {
        return {
          success: false,
          error: 'Invalid property ID'
        };
      }

      if (pagination) {
        const result = await storage.getReviewsPaginated(propertyId, pagination);
        return {
          success: true,
          data: result
        };
      } else {
        const reviews = await storage.getReviews(propertyId);
        return {
          success: true,
          data: reviews
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get reviews by a specific user
   */
  async getUserReviews(userId: number): Promise<ReviewServiceResult<readonly Review[]>> {
    try {
      if (!userId || userId <= 0) {
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      // Get all properties and their reviews, then filter by user
      const allProperties = await storage.getProperties();
      const userReviews: Review[] = [];

      for (const property of allProperties) {
        const propertyReviews = await storage.getReviews(property.id);
        const userPropertyReviews = propertyReviews.filter(review => review.userId === userId);
        userReviews.push(...userPropertyReviews);
      }

      // Sort by creation date (newest first)
      userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        success: true,
        data: userReviews
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve user reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate review summary for a property
   */
  async generateReviewSummary(propertyId: number): Promise<ReviewServiceResult<ReviewSummary>> {
    try {
      const reviews = await storage.getReviews(propertyId);
      
      if (reviews.length === 0) {
        return {
          success: true,
          data: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            recentReviews: []
          }
        };
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

      // Calculate rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      // Get recent reviews (last 5)
      const sortedReviews = [...reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const recentReviews = sortedReviews.slice(0, 5).map(review => ({
        ...review,
        // Add metadata that would be populated in a real implementation
        authorName: `User ${review.userId}`,
        propertyTitle: `Property ${review.propertyId}`,
        verificationStatus: review.verified ? 'verified' : 'unverified',
        helpfulVotes: review.helpfulCount,
        reportedCount: review.reportCount
      }));

      return {
        success: true,
        data: {
          averageRating,
          totalReviews: reviews.length,
          ratingDistribution,
          recentReviews
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate review summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update review helpful count
   */
  async markReviewHelpful(reviewId: number, userId: number): Promise<ReviewServiceResult<void>> {
    try {
      // In a full implementation, this would:
      // 1. Check if user already marked this review as helpful
      // 2. Update the helpful count
      // 3. Track user's helpful votes to prevent spam
      
      // For now, we'll simulate the functionality
      console.log(`User ${userId} marked review ${reviewId} as helpful`);
      
      return {
        success: true,
        message: 'Review marked as helpful'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to mark review as helpful: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Report a review for moderation
   */
  async reportReview(
    reviewId: number, 
    reporterId: number, 
    reason: string
  ): Promise<ReviewServiceResult<void>> {
    try {
      // In a full implementation, this would:
      // 1. Create a report record
      // 2. Increment report count
      // 3. Auto-flag for moderation if threshold reached
      // 4. Notify moderation team
      
      console.log(`Review ${reviewId} reported by user ${reporterId} for: ${reason}`);
      
      return {
        success: true,
        message: 'Review reported for moderation'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to report review: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get review analytics for a property owner
   */
  async getReviewAnalytics(ownerId: number): Promise<ReviewServiceResult<ReviewAnalytics>> {
    try {
      // Get all properties owned by the user
      const allProperties = await storage.getProperties();
      const ownerProperties = allProperties.filter(property => property.ownerId === ownerId);

      if (ownerProperties.length === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {},
            recentTrends: [],
            topReviewers: []
          }
        };
      }

      // Collect all reviews for owner's properties
      const allReviews: Review[] = [];
      for (const property of ownerProperties) {
        const propertyReviews = await storage.getReviews(property.id);
        allReviews.push(...propertyReviews);
      }

      if (allReviews.length === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {},
            recentTrends: [],
            topReviewers: []
          }
        };
      }

      // Calculate analytics
      const totalReviews = allReviews.length;
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Rating distribution
      const ratingDistribution: Record<number, number> = {};
      allReviews.forEach(review => {
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      });

      // Recent trends (simplified - last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentReviews = allReviews.filter(
        review => new Date(review.createdAt) >= thirtyDaysAgo
      );
      
      const recentTrends = [{
        period: 'Last 30 days',
        averageRating: recentReviews.length > 0 ? 
          recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length : 0,
        reviewCount: recentReviews.length
      }];

      // Top reviewers (users who reviewed multiple properties)
      const reviewerCounts: Record<number, { count: number; totalRating: number }> = {};
      allReviews.forEach(review => {
        if (!reviewerCounts[review.userId]) {
          reviewerCounts[review.userId] = { count: 0, totalRating: 0 };
        }
        reviewerCounts[review.userId].count++;
        reviewerCounts[review.userId].totalRating += review.rating;
      });

      const topReviewers = Object.entries(reviewerCounts)
        .map(([userId, data]) => ({
          userId: parseInt(userId),
          username: `User ${userId}`, // In real implementation, fetch from user service
          reviewCount: data.count,
          averageRating: data.totalRating / data.count
        }))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 10);

      return {
        success: true,
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
          recentTrends,
          topReviewers
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get review analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate review data
   */
  private validateReviewData(data: ReviewCreateRequest, userId: number): ReviewServiceResult<void> {
    try {
      // Business logic validation first (more specific error messages)
      if (!data.propertyId || data.propertyId <= 0) {
        return {
          success: false,
          error: 'Valid property ID is required'
        };
      }

      if (!userId || userId <= 0) {
        return {
          success: false,
          error: 'Valid user ID is required'
        };
      }

      if (!data.rating || data.rating < 1 || data.rating > 5) {
        return {
          success: false,
          error: 'Rating must be between 1 and 5'
        };
      }

      if (!data.comment || data.comment.trim().length < 10) {
        return {
          success: false,
          error: 'Review comment must be at least 10 characters long'
        };
      }

      if (data.comment.length > 1000) {
        return {
          success: false,
          error: 'Review comment cannot exceed 1000 characters'
        };
      }

      // Check for inappropriate content (simplified)
      const inappropriateWords = ['spam', 'fake', 'scam']; // In real app, use proper content filtering
      const lowerComment = data.comment.toLowerCase();
      const hasInappropriateContent = inappropriateWords.some(word => lowerComment.includes(word));
      
      if (hasInappropriateContent) {
        return {
          success: false,
          error: 'Review contains inappropriate content'
        };
      }

      // Use schema validation for final check (this should pass if business logic validation passed)
      insertReviewSchema.parse({
        propertyId: data.propertyId,
        userId: userId,
        rating: data.rating,
        comment: data.comment.trim(),
        verified: false
      });

      return { success: true };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
        };
      }
      return {
        success: false,
        error: 'Invalid review data'
      };
    }
  }

  /**
   * Update property owner's trust score based on review
   */
  private async updateOwnerTrustScore(ownerId: number, rating: number): Promise<void> {
    try {
      // Get current user to access current trust score
      const owner = await storage.getUser(ownerId);
      if (!owner) {
        return;
      }

      // Calculate trust score adjustment based on rating
      // Positive reviews (4-5) increase trust score, negative (1-2) decrease it
      let adjustment = 0;
      if (rating >= 4) {
        adjustment = rating === 5 ? 2 : 1; // 5-star = +2, 4-star = +1
      } else if (rating <= 2) {
        adjustment = rating === 1 ? -2 : -1; // 1-star = -2, 2-star = -1
      }
      // 3-star reviews don't change trust score

      // Calculate new trust score (keep within 0-100 range)
      const newTrustScore = Math.max(0, Math.min(100, owner.trustScore + adjustment));

      // Update trust score if it changed
      if (newTrustScore !== owner.trustScore) {
        await storage.updateUserTrustScore(ownerId, newTrustScore);
      }

    } catch (error) {
      // Log error but don't throw - trust score update shouldn't break review creation
      console.error(`Failed to update trust score for user ${ownerId}:`, error);
    }
  }

  /**
   * Check if user can review property (business rules)
   */
  async canUserReviewProperty(userId: number, propertyId: number): Promise<ReviewServiceResult<boolean>> {
    try {
      // Check if property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      // Check if user owns the property
      if (property.ownerId === userId) {
        return {
          success: true,
          data: false,
          message: 'Cannot review own property'
        };
      }

      // Check if user already reviewed this property
      const existingReviews = await storage.getReviews(propertyId);
      const hasExistingReview = existingReviews.some(review => review.userId === userId);
      
      if (hasExistingReview) {
        return {
          success: true,
          data: false,
          message: 'Already reviewed this property'
        };
      }

      return {
        success: true,
        data: true,
        message: 'Can review property'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to check review eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}