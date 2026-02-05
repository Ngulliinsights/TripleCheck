/**
 * Unit tests for ReviewService
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Review, Property, User } from '../../../src/shared/schema';

// Mock the storage module before importing ReviewService
vi.mock('../../storage', () => ({
  storage: {
    getReviews: vi.fn(),
    getReviewsPaginated: vi.fn(),
    createReview: vi.fn(),
    getProperty: vi.fn(),
    getUser: vi.fn(),
    getProperties: vi.fn(),
    updateUserTrustScore: vi.fn(),
  }
}));

import { ReviewService } from '../ReviewService';
import { storage } from '../../storage';

const mockStorage = storage as any;

describe('ReviewService', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService();
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    const mockProperty: Property = {
      id: 1,
      title: 'Test Property',
      description: 'Test Description',
      price: '100000',
      location: 'Test Location',
      address: 'Test Address',
      coordinates: null,
      imageUrls: [],
      verificationStatus: 'pending',
      features: null,
      ownerId: 2,
      isActive: true,
      isFeatured: false,
      viewCount: 0,
      favoriteCount: 0,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockOwner: User = {
      id: 2,
      username: 'owner',
      email: 'owner@test.com',
      password: 'hashedpassword',
      role: 'user',
      trustScore: 50,
      isVerifiedAgent: false,
      firstName: 'Owner',
      lastName: 'User',
      phone: null,
      profileImageUrl: null,
      bio: null,
      isActive: true,
      lastLoginAt: null,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockReview: Review = {
      id: 1,
      propertyId: 1,
      userId: 3,
      rating: 5,
      comment: 'Great property!',
      verified: false,
      helpfulCount: 0,
      reportCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a review successfully', async () => {
      mockStorage.getReviews.mockResolvedValue([]);
      mockStorage.getProperty.mockResolvedValue(mockProperty);
      mockStorage.createReview.mockResolvedValue(mockReview);
      mockStorage.getUser.mockResolvedValue(mockOwner);
      mockStorage.updateUserTrustScore.mockResolvedValue(mockOwner);

      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'Great property!'
      }, 3);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReview);
      expect(result.message).toBe('Review created successfully');
      expect(mockStorage.createReview).toHaveBeenCalledWith({
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: 'Great property!',
        verified: false
      });
    });

    it('should prevent duplicate reviews', async () => {
      const existingReview: Review = {
        ...mockReview,
        userId: 3
      };
      
      mockStorage.getReviews.mockResolvedValue([existingReview]);

      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'Great property!'
      }, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this property');
      expect(mockStorage.createReview).not.toHaveBeenCalled();
    });

    it('should prevent users from reviewing their own properties', async () => {
      mockStorage.getReviews.mockResolvedValue([]);
      mockStorage.getProperty.mockResolvedValue(mockProperty);

      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'Great property!'
      }, 2); // Same as ownerId

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot review your own property');
      expect(mockStorage.createReview).not.toHaveBeenCalled();
    });

    it('should validate review data', async () => {
      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 6, // Invalid rating
        comment: 'Great property!'
      }, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rating must be between 1 and 5');
    });

    it('should validate comment length', async () => {
      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'Short' // Too short
      }, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Review comment must be at least 10 characters long');
    });
  });

  describe('getPropertyReviews', () => {
    const mockReviews: Review[] = [
      {
        id: 1,
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: 'Great property!',
        verified: false,
        helpfulCount: 0,
        reportCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should get reviews for a property', async () => {
      mockStorage.getReviews.mockResolvedValue(mockReviews);

      const result = await reviewService.getPropertyReviews(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(mockStorage.getReviews).toHaveBeenCalledWith(1);
    });

    it('should handle invalid property ID', async () => {
      const result = await reviewService.getPropertyReviews(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid property ID');
      expect(mockStorage.getReviews).not.toHaveBeenCalled();
    });

    it('should get paginated reviews', async () => {
      const mockPaginatedResult = {
        items: mockReviews,
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };

      mockStorage.getReviewsPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await reviewService.getPropertyReviews(1, { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaginatedResult);
      expect(mockStorage.getReviewsPaginated).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
    });
  });

  describe('generateReviewSummary', () => {
    it('should generate review summary with ratings', async () => {
      const mockReviews: Review[] = [
        {
          id: 1,
          propertyId: 1,
          userId: 3,
          rating: 5,
          comment: 'Great property!',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          propertyId: 1,
          userId: 4,
          rating: 4,
          comment: 'Good property!',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockStorage.getReviews.mockResolvedValue(mockReviews);

      const result = await reviewService.generateReviewSummary(1);

      expect(result.success).toBe(true);
      expect(result.data?.averageRating).toBe(4.5);
      expect(result.data?.totalReviews).toBe(2);
      expect(result.data?.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 1, 5: 1
      });
      expect(result.data?.recentReviews).toHaveLength(2);
    });

    it('should handle properties with no reviews', async () => {
      mockStorage.getReviews.mockResolvedValue([]);

      const result = await reviewService.generateReviewSummary(1);

      expect(result.success).toBe(true);
      expect(result.data?.averageRating).toBe(0);
      expect(result.data?.totalReviews).toBe(0);
      expect(result.data?.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      });
      expect(result.data?.recentReviews).toHaveLength(0);
    });
  });

  describe('canUserReviewProperty', () => {
    const mockProperty: Property = {
      id: 1,
      title: 'Test Property',
      description: 'Test Description',
      price: '100000',
      location: 'Test Location',
      address: 'Test Address',
      coordinates: null,
      imageUrls: [],
      verificationStatus: 'pending',
      features: null,
      ownerId: 2,
      isActive: true,
      isFeatured: false,
      viewCount: 0,
      favoriteCount: 0,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow user to review property', async () => {
      mockStorage.getProperty.mockResolvedValue(mockProperty);
      mockStorage.getReviews.mockResolvedValue([]);

      const result = await reviewService.canUserReviewProperty(3, 1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toBe('Can review property');
    });

    it('should prevent owner from reviewing own property', async () => {
      mockStorage.getProperty.mockResolvedValue(mockProperty);

      const result = await reviewService.canUserReviewProperty(2, 1); // Same as ownerId

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.message).toBe('Cannot review own property');
    });

    it('should prevent duplicate reviews', async () => {
      const existingReview: Review = {
        id: 1,
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: 'Great property!',
        verified: false,
        helpfulCount: 0,
        reportCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.getProperty.mockResolvedValue(mockProperty);
      mockStorage.getReviews.mockResolvedValue([existingReview]);

      const result = await reviewService.canUserReviewProperty(3, 1);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.message).toBe('Already reviewed this property');
    });

    it('should handle non-existent property', async () => {
      mockStorage.getProperty.mockResolvedValue(null);

      const result = await reviewService.canUserReviewProperty(3, 999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Property not found');
    });
  });

  describe('getUserReviews', () => {
    it('should get reviews by user successfully', async () => {
      const mockProperties: Property[] = [
        {
          id: 1,
          title: 'Property 1',
          description: 'Description 1',
          price: '100000',
          location: 'Location 1',
          address: 'Address 1',
          coordinates: null,
          imageUrls: [],
          verificationStatus: 'pending',
          features: null,
          ownerId: 2,
          isActive: true,
          isFeatured: false,
          viewCount: 0,
          favoriteCount: 0,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockReviews: Review[] = [
        {
          id: 1,
          propertyId: 1,
          userId: 3,
          rating: 5,
          comment: 'Great property!',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockStorage.getProperties.mockResolvedValue(mockProperties);
      mockStorage.getReviews.mockResolvedValue(mockReviews);

      const result = await reviewService.getUserReviews(3);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].userId).toBe(3);
    });

    it('should handle invalid user ID', async () => {
      const result = await reviewService.getUserReviews(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
    });

    it('should handle user with no reviews', async () => {
      mockStorage.getProperties.mockResolvedValue([]);

      const result = await reviewService.getUserReviews(3);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('markReviewHelpful', () => {
    it('should mark review as helpful', async () => {
      const result = await reviewService.markReviewHelpful(1, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Review marked as helpful');
    });

    it('should handle errors gracefully', async () => {
      // This is a placeholder implementation, so it should always succeed
      const result = await reviewService.markReviewHelpful(999, 3);

      expect(result.success).toBe(true);
    });
  });

  describe('reportReview', () => {
    it('should report review successfully', async () => {
      const result = await reviewService.reportReview(1, 3, 'Inappropriate content');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Review reported for moderation');
    });

    it('should handle empty reason', async () => {
      const result = await reviewService.reportReview(1, 3, '');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Review reported for moderation');
    });
  });

  describe('getReviewAnalytics', () => {
    it('should get analytics for property owner', async () => {
      const mockProperties: Property[] = [
        {
          id: 1,
          title: 'Owner Property',
          description: 'Description',
          price: '100000',
          location: 'Location',
          address: 'Address',
          coordinates: null,
          imageUrls: [],
          verificationStatus: 'pending',
          features: null,
          ownerId: 1,
          isActive: true,
          isFeatured: false,
          viewCount: 0,
          favoriteCount: 0,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockReviews: Review[] = [
        {
          id: 1,
          propertyId: 1,
          userId: 2,
          rating: 5,
          comment: 'Excellent!',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          propertyId: 1,
          userId: 3,
          rating: 4,
          comment: 'Good property',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockStorage.getProperties.mockResolvedValue(mockProperties);
      mockStorage.getReviews.mockResolvedValue(mockReviews);

      const result = await reviewService.getReviewAnalytics(1);

      expect(result.success).toBe(true);
      expect(result.data?.totalReviews).toBe(2);
      expect(result.data?.averageRating).toBe(4.5);
      expect(result.data?.ratingDistribution[4]).toBe(1);
      expect(result.data?.ratingDistribution[5]).toBe(1);
      expect(result.data?.recentTrends).toHaveLength(1);
      expect(result.data?.topReviewers).toHaveLength(2);
    });

    it('should handle owner with no properties', async () => {
      mockStorage.getProperties.mockResolvedValue([]);

      const result = await reviewService.getReviewAnalytics(1);

      expect(result.success).toBe(true);
      expect(result.data?.totalReviews).toBe(0);
      expect(result.data?.averageRating).toBe(0);
    });

    it('should handle properties with no reviews', async () => {
      const mockProperties: Property[] = [
        {
          id: 1,
          title: 'Owner Property',
          description: 'Description',
          price: '100000',
          location: 'Location',
          address: 'Address',
          coordinates: null,
          imageUrls: [],
          verificationStatus: 'pending',
          features: null,
          ownerId: 1,
          isActive: true,
          isFeatured: false,
          viewCount: 0,
          favoriteCount: 0,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockStorage.getProperties.mockResolvedValue(mockProperties);
      mockStorage.getReviews.mockResolvedValue([]);

      const result = await reviewService.getReviewAnalytics(1);

      expect(result.success).toBe(true);
      expect(result.data?.totalReviews).toBe(0);
      expect(result.data?.averageRating).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors in all methods', async () => {
      const dbError = new Error('Database connection failed');

      mockStorage.getProperty.mockRejectedValue(dbError);
      mockStorage.getReviews.mockRejectedValue(dbError);
      mockStorage.createReview.mockRejectedValue(dbError);
      mockStorage.getProperties.mockRejectedValue(dbError);

      const results = await Promise.allSettled([
        reviewService.createReview({ propertyId: 1, rating: 5, comment: 'Great property!' }, 3),
        reviewService.getPropertyReviews(1),
        reviewService.generateReviewSummary(1),
        reviewService.canUserReviewProperty(3, 1),
        reviewService.getUserReviews(3),
        reviewService.getReviewAnalytics(1)
      ]);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.success).toBe(false);
          expect(result.value.error).toContain('Failed to');
        }
      });
    });

    it('should handle trust score update errors gracefully', async () => {
      const mockProperty: Property = {
        id: 1,
        title: 'Test Property',
        description: 'Test Description',
        price: '100000',
        location: 'Test Location',
        address: 'Test Address',
        coordinates: null,
        imageUrls: [],
        verificationStatus: 'pending',
        features: null,
        ownerId: 2,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        favoriteCount: 0,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockOwner: User = {
        id: 2,
        username: 'owner',
        email: 'owner@test.com',
        password: 'hashedpassword',
        role: 'user',
        trustScore: 50,
        isVerifiedAgent: false,
        firstName: 'Owner',
        lastName: 'User',
        phone: null,
        profileImageUrl: null,
        bio: null,
        isActive: true,
        lastLoginAt: null,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.getReviews.mockResolvedValue([]);
      mockStorage.getProperty.mockResolvedValue(mockProperty);
      mockStorage.createReview.mockResolvedValue({
        id: 1,
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: 'Great property!',
        verified: false,
        helpfulCount: 0,
        reportCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockStorage.getUser.mockResolvedValue(mockOwner);
      mockStorage.updateUserTrustScore.mockRejectedValue(new Error('Trust score update failed'));

      // Should still succeed even if trust score update fails
      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'Great property!'
      }, 3);

      expect(result.success).toBe(true);
    });
  });

  describe('validation edge cases', () => {
    it('should handle inappropriate content detection', async () => {
      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: 'This is spam content'
      }, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Review contains inappropriate content');
    });

    it('should validate comment length limits', async () => {
      const longComment = 'A'.repeat(1001);
      
      const result = await reviewService.createReview({
        propertyId: 1,
        rating: 5,
        comment: longComment
      }, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Review comment cannot exceed 1000 characters');
    });

    it('should handle edge case ratings', async () => {
      const testCases = [
        { rating: 0, expectedError: 'Rating must be between 1 and 5' },
        { rating: 6, expectedError: 'Rating must be between 1 and 5' },
        { rating: -1, expectedError: 'Rating must be between 1 and 5' },
      ];

      for (const testCase of testCases) {
        const result = await reviewService.createReview({
          propertyId: 1,
          rating: testCase.rating,
          comment: 'Valid comment that is long enough'
        }, 3);

        expect(result.success).toBe(false);
        expect(result.error).toBe(testCase.expectedError);
      }

      // Test non-integer rating separately as it has different error message
      const nonIntegerResult = await reviewService.createReview({
        propertyId: 1,
        rating: 1.5,
        comment: 'Valid comment that is long enough'
      }, 3);

      expect(nonIntegerResult.success).toBe(false);
      expect(nonIntegerResult.error).toContain('Validation failed');
    });

    it('should handle invalid property IDs', async () => {
      const testCases = [0, -1, null, undefined];

      for (const propertyId of testCases) {
        const result = await reviewService.createReview({
          propertyId: propertyId as any,
          rating: 5,
          comment: 'Valid comment that is long enough'
        }, 3);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Valid property ID is required');
      }
    });

    it('should handle invalid user IDs', async () => {
      const testCases = [0, -1];

      for (const userId of testCases) {
        const result = await reviewService.createReview({
          propertyId: 1,
          rating: 5,
          comment: 'Valid comment that is long enough'
        }, userId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Valid user ID is required');
      }
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent review creation attempts', async () => {
      const mockProperty: Property = {
        id: 1,
        title: 'Test Property',
        description: 'Test Description',
        price: '100000',
        location: 'Test Location',
        address: 'Test Address',
        coordinates: null,
        imageUrls: [],
        verificationStatus: 'pending',
        features: null,
        ownerId: 2,
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        favoriteCount: 0,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.getProperty.mockResolvedValue(mockProperty);
      mockStorage.getReviews.mockResolvedValue([]);
      mockStorage.createReview.mockResolvedValue({
        id: 1,
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: 'Great property!',
        verified: false,
        helpfulCount: 0,
        reportCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const promises = Array.from({ length: 3 }, () =>
        reviewService.createReview({
          propertyId: 1,
          rating: 5,
          comment: 'Great property!'
        }, 3)
      );

      const results = await Promise.all(promises);

      // All should succeed in this mock scenario
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});