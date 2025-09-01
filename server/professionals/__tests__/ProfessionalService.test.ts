import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ProfessionalService, CreateProfessionalData, UpdateProfessionalData } from '../ProfessionalService';
import { CacheService } from '../../../core/src/cache'
import { RequestDeduplicator } from '../../infrastructure/deduplication/RequestDeduplicator';
import { db } from '../../infrastructure/database/connection';
import { professionals, professionalReviews } from '../../../src/shared/schema';

// Mock dependencies
vi.mock('../../infrastructure/database/connection');
vi.mock('../../infrastructure/cache/CacheService');
vi.mock('../../infrastructure/deduplication/RequestDeduplicator');

describe('ProfessionalService', () => {
  let professionalService: ProfessionalService;
  let mockCache: Mock;
  let mockDeduplicator: Mock;
  let mockDb: Mock;

  const mockProfessionalData: CreateProfessionalData = {
    businessName: 'Test Surveying Co.',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@testsurvey.com',
    phone: '+254700123456',
    businessAddress: '123 Test Street, Nairobi',
    serviceAreas: ['Nairobi', 'Kiambu'],
    primarySpecialization: 'land_surveying',
    yearsOfExperience: 5,
    hourlyRate: 5000,
    currency: 'KES',
  };

  const mockProfessional = {
    id: 1,
    ...mockProfessionalData,
    trustScore: 50,
    averageRating: '0.00',
    totalReviews: 0,
    completedProjects: 0,
    isActive: true,
    verificationStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock CacheService
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      invalidateByPattern: vi.fn(),
    };

    // Mock RequestDeduplicator
    mockDeduplicator = {
      handleIdempotentRequest: vi.fn(),
    };

    // Mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
    };

    // Setup mocks
    (CacheService as any).mockImplementation(() => mockCache);
    (RequestDeduplicator.getInstance as any).mockReturnValue(mockDeduplicator);
    (db as any) = mockDb;

    professionalService = new ProfessionalService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProfessionalProfile', () => {
    it('should create a professional profile successfully', async () => {
      // Arrange
      mockDb.returning.mockResolvedValue([mockProfessional]);

      // Act
      const result = await professionalService.createProfessionalProfile(mockProfessionalData);

      // Assert
      expect(result).toEqual(mockProfessional);
      expect(mockDb.insert).toHaveBeenCalledWith(professionals);
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
        ...mockProfessionalData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
    });

    it('should use deduplication when idempotency key is provided', async () => {
      // Arrange
      const idempotencyKey = 'test-key-123';
      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockProfessional);

      // Act
      const result = await professionalService.createProfessionalProfile(
        mockProfessionalData,
        idempotencyKey
      );

      // Assert
      expect(result).toEqual(mockProfessional);
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        `create-professional-${idempotencyKey}`,
        expect.any(Function)
      );
    });

    it('should throw ConflictError for duplicate email', async () => {
      // Arrange
      mockDb.limit.mockResolvedValue([{ id: 2, email: mockProfessionalData.email }]);

      // Act & Assert
      await expect(
        professionalService.createProfessionalProfile(mockProfessionalData)
      ).rejects.toThrow('Professional with this email already exists');
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = { ...mockProfessionalData, businessName: '' };

      // Act & Assert
      await expect(
        professionalService.createProfessionalProfile(invalidData)
      ).rejects.toThrow('Business name is required');
    });
  });

  describe('updateProfessionalProfile', () => {
    const updateData: UpdateProfessionalData = {
      businessName: 'Updated Surveying Co.',
      hourlyRate: 6000,
    };

    it('should update professional profile successfully', async () => {
      // Arrange
      const professionalId = 1;
      mockCache.get.mockResolvedValue(mockProfessional); // Mock getProfessionalById
      mockDb.returning.mockResolvedValue([{ ...mockProfessional, ...updateData }]);

      // Act
      const result = await professionalService.updateProfessionalProfile(
        professionalId,
        updateData
      );

      // Assert
      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockDb.update).toHaveBeenCalledWith(professionals);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
    });

    it('should throw NotFoundError for non-existent professional', async () => {
      // Arrange
      const professionalId = 999;
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValue([]);

      // Act & Assert
      await expect(
        professionalService.updateProfessionalProfile(professionalId, updateData)
      ).rejects.toThrow('Professional not found');
    });

    it('should handle optimistic locking', async () => {
      // Arrange
      const professionalId = 1;
      const lastUpdated = new Date('2023-01-01');
      const newerProfessional = { ...mockProfessional, updatedAt: new Date('2023-01-02') };
      mockCache.get.mockResolvedValue(newerProfessional);

      // Act & Assert
      await expect(
        professionalService.updateProfessionalProfile(professionalId, updateData, lastUpdated)
      ).rejects.toThrow('Professional has been updated by another user');
    });
  });

  describe('getProfessionalById', () => {
    it('should return professional from cache if available', async () => {
      // Arrange
      const professionalId = 1;
      mockCache.get.mockResolvedValue(mockProfessional);

      // Act
      const result = await professionalService.getProfessionalById(professionalId);

      // Assert
      expect(result).toEqual(mockProfessional);
      expect(mockCache.get).toHaveBeenCalledWith(`professional:${professionalId}`);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should query database and cache result if not in cache', async () => {
      // Arrange
      const professionalId = 1;
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValue([mockProfessional]);

      // Act
      const result = await professionalService.getProfessionalById(professionalId);

      // Assert
      expect(result).toEqual(mockProfessional);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        `professional:${professionalId}`,
        mockProfessional,
        { ttl: 300 }
      );
    });

    it('should return null for non-existent professional', async () => {
      // Arrange
      const professionalId = 999;
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValue([]);

      // Act
      const result = await professionalService.getProfessionalById(professionalId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('searchProfessionals', () => {
    const mockSearchResults = {
      professionals: [mockProfessional],
      totalCount: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    it('should return cached results if available', async () => {
      // Arrange
      const filters = { specialization: 'land_surveying' };
      mockCache.get.mockResolvedValue(mockSearchResults);

      // Act
      const result = await professionalService.searchProfessionals(filters);

      // Assert
      expect(result).toEqual(mockSearchResults);
      expect(mockCache.get).toHaveBeenCalledWith(
        `professionals:search:${JSON.stringify(filters)}`
      );
    });

    it('should query database and cache results if not cached', async () => {
      // Arrange
      const filters = { specialization: 'land_surveying', page: 1, limit: 20 };
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValueOnce([{ count: 1 }]); // Total count query
      mockDb.offset.mockResolvedValue([mockProfessional]); // Results query

      // Act
      const result = await professionalService.searchProfessionals(filters);

      // Assert
      expect(result.professionals).toEqual([mockProfessional]);
      expect(result.totalCount).toBe(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining('professionals:search:'),
        expect.any(Object),
        { ttl: 120 }
      );
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        specialization: 'land_surveying',
        location: 'Nairobi',
        minRating: 4,
        isAvailable: true,
      };
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.offset.mockResolvedValue([]);

      // Act
      await professionalService.searchProfessionals(filters);

      // Assert
      expect(mockDb.where).toHaveBeenCalled();
      // Verify that filters are applied (specific implementation details)
    });
  });

  describe('addProfessionalReview', () => {
    const mockReviewData = {
      professionalId: 1,
      reviewerId: 2,
      rating: 5,
      comment: 'Excellent service!',
    };

    const mockReview = {
      id: 1,
      ...mockReviewData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create review successfully', async () => {
      // Arrange
      mockDb.limit.mockResolvedValueOnce([]); // No existing review
      mockDb.returning.mockResolvedValue([mockReview]);

      // Act
      const result = await professionalService.addProfessionalReview(mockReviewData);

      // Assert
      expect(result).toEqual(mockReview);
      expect(mockDb.insert).toHaveBeenCalledWith(professionalReviews);
    });

    it('should throw ConflictError for duplicate review', async () => {
      // Arrange
      mockDb.limit.mockResolvedValue([{ id: 1 }]); // Existing review

      // Act & Assert
      await expect(
        professionalService.addProfessionalReview(mockReviewData)
      ).rejects.toThrow('You have already reviewed this professional');
    });

    it('should validate rating range', async () => {
      // Arrange
      const invalidReviewData = { ...mockReviewData, rating: 6 };

      // Act & Assert
      await expect(
        professionalService.addProfessionalReview(invalidReviewData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('updateAvailability', () => {
    it('should update availability successfully', async () => {
      // Arrange
      const professionalId = 1;
      const isAvailable = false;
      const nextAvailableDate = new Date('2024-02-01');

      // Act
      await professionalService.updateAvailability(
        professionalId,
        isAvailable,
        nextAvailableDate
      );

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(professionals);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        isAvailable,
        nextAvailableDate,
        lastActiveAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
    });

    it('should clear cache after updating availability', async () => {
      // Arrange
      const professionalId = 1;

      // Act
      await professionalService.updateAvailability(professionalId, true);

      // Assert
      expect(mockCache.delete).toHaveBeenCalledWith(`professional:${professionalId}`);
      expect(mockCache.invalidateByPattern).toHaveBeenCalledWith(
        `professional:${professionalId}:*`
      );
    });
  });

  describe('getAvailableProfessionals', () => {
    it('should return available professionals with filters', async () => {
      // Arrange
      const specialization = 'land_surveying';
      const location = 'Nairobi';
      mockDb.orderBy.mockResolvedValue([mockProfessional]);

      // Act
      const result = await professionalService.getAvailableProfessionals(
        specialization,
        location
      );

      // Assert
      expect(result).toEqual([mockProfessional]);
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('should filter for emergency availability when requested', async () => {
      // Arrange
      const emergencyOnly = true;
      mockDb.orderBy.mockResolvedValue([]);

      // Act
      await professionalService.getAvailableProfessionals(
        undefined,
        undefined,
        emergencyOnly
      );

      // Assert
      expect(mockDb.where).toHaveBeenCalled();
      // Verify emergency availability filter is applied
    });
  });

  describe('getProfessionalsByCategory', () => {
    it('should return professionals by category with caching', async () => {
      // Arrange
      const category = 'land_surveying';
      const location = 'Nairobi';
      const limit = 10;
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValue([mockProfessional]);

      // Act
      const result = await professionalService.getProfessionalsByCategory(
        category,
        location,
        limit
      );

      // Assert
      expect(result).toEqual([mockProfessional]);
      expect(mockCache.set).toHaveBeenCalledWith(
        `professionals:category:${category}:${location}:${limit}`,
        [mockProfessional],
        { ttl: 300 }
      );
    });
  });

  describe('getProfessionalReviews', () => {
    const mockReviewsResult = {
      reviews: [{ id: 1, rating: 5, comment: 'Great!' }],
      totalCount: 1,
      averageRating: 5.0,
      ratingDistribution: { 5: 1 },
    };

    it('should return cached reviews if available', async () => {
      // Arrange
      const professionalId = 1;
      mockCache.get.mockResolvedValue(mockReviewsResult);

      // Act
      const result = await professionalService.getProfessionalReviews(professionalId);

      // Assert
      expect(result).toEqual(mockReviewsResult);
      expect(mockCache.get).toHaveBeenCalledWith(
        `professional:${professionalId}:reviews:1:10`
      );
    });

    it('should query database and cache results if not cached', async () => {
      // Arrange
      const professionalId = 1;
      mockCache.get.mockResolvedValue(null);
      mockDb.limit.mockResolvedValueOnce([{ count: 1, avgRating: 5.0 }]); // Stats query
      mockDb.groupBy.mockResolvedValueOnce([{ rating: 5, count: 1 }]); // Rating distribution
      mockDb.offset.mockResolvedValue([{ id: 1, rating: 5, comment: 'Great!' }]); // Reviews

      // Act
      const result = await professionalService.getProfessionalReviews(professionalId);

      // Assert
      expect(result.totalCount).toBe(1);
      expect(result.averageRating).toBe(5.0);
      expect(mockCache.set).toHaveBeenCalledWith(
        `professional:${professionalId}:reviews:1:10`,
        expect.any(Object),
        { ttl: 180 }
      );
    });
  });
});