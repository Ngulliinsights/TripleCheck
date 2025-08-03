import { eq, and, or, like, desc, asc, sql, gte, lte } from "drizzle-orm";

import {
  professionals,
  professionalReviews,
  users,
  type ProfessionalSpecializationValue,
} from "../../src/shared/schema";
import { CacheService } from "../infrastructure/cache/CacheService";
import { db } from "../infrastructure/database/connection";
import { RequestDeduplicator } from "../infrastructure/deduplication/RequestDeduplicator";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../middleware/centralized-error-handler";

/**
 * Professional search filters interface
 */
export interface ProfessionalSearchFilters {
  specialization?: ProfessionalSpecializationValue;
  location?: string;
  minRating?: number;
  maxHourlyRate?: number;
  isAvailable?: boolean;
  verificationStatus?: "pending" | "verified" | "suspended" | "rejected";
  yearsOfExperience?: number;
  serviceAreas?: string[];
  emergencyAvailable?: boolean;
  sortBy?: "rating" | "experience" | "price" | "reviews" | "recent";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Professional creation data interface
 */
export interface CreateProfessionalData {
  userId?: number;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  businessAddress: string;
  serviceAreas: string[];
  primarySpecialization: ProfessionalSpecializationValue;
  secondarySpecializations?: string[];
  yearsOfExperience: number;
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  certifications?: Array<{
    name: string;
    issuingBody: string;
    issueDate: string;
    expiryDate?: string;
    certificateNumber?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: number;
  }>;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  hourlyRate?: number;
  projectMinimum?: number;
  currency?: string;
  paymentTerms?: string;
  workingHours?: Record<string, { start: string; end: string }>;
  emergencyAvailable?: boolean;
}

/**
 * Professional update data interface
 */
export interface UpdateProfessionalData
  extends Partial<CreateProfessionalData> {
  isAvailable?: boolean;
  nextAvailableDate?: Date;
  verificationDocuments?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
    verified: boolean;
  }>;
}

/**
 * Professional review data interface
 */
export interface CreateProfessionalReviewData {
  professionalId: number;
  reviewerId: number;
  projectId?: number;
  rating: number;
  title?: string;
  comment: string;
  serviceType?: string;
  projectValue?: number;
  timelinessRating?: number;
  communicationRating?: number;
  qualityRating?: number;
  valueRating?: number;
  wouldRecommend?: boolean;
}

/**
 * Professional data type
 */
export interface Professional {
  id: number;
  userId?: number;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  businessAddress: string;
  serviceAreas: string[];
  primarySpecialization: ProfessionalSpecializationValue;
  secondarySpecializations?: string[];
  yearsOfExperience: number;
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
  socialMedia?: Record<string, string>;
  hourlyRate?: string;
  projectMinimum?: string;
  currency: string;
  paymentTerms?: string;
  isAvailable: boolean;
  nextAvailableDate?: Date;
  workingHours?: Record<string, { start: string; end: string }>;
  emergencyAvailable: boolean;
  verificationStatus: "pending" | "verified" | "suspended" | "rejected";
  verificationDocuments?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
    verified: boolean;
  }>;
  trustScore: number;
  completedProjects: number;
  averageRating: string;
  totalReviews: number;
  responseTime: number;
  completionRate: string;
  isActive: boolean;
  isFeatured: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

/**
 * Professional Service for managing professional directory
 * Implements comprehensive CRUD operations with caching and deduplication
 */
export class ProfessionalService {
  private cache: CacheService;
  private deduplicator: RequestDeduplicator;

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
    this.deduplicator = RequestDeduplicator.getInstance({}, this.cache);
  }

  /**
   * Get database instance with proper error handling
   */
  private getDb() {
    if (!db) {
      throw new Error("Database connection not available");
    }
    return db;
  }

  /**
   * Create a new professional profile with idempotency
   */
  async createProfessionalProfile(
    data: CreateProfessionalData,
    idempotencyKey?: string
  ): Promise<Professional> {
    // Validate required fields
    this.validateCreateData(data);

    // Check for duplicate email
    const existingProfessional = await this.getDb()
      .select()
      .from(professionals)
      .where(eq(professionals.email, data.email))
      .limit(1);

    if (existingProfessional.length > 0) {
      throw new ConflictError("Professional with this email already exists");
    }

    // Use deduplication if idempotency key provided
    if (idempotencyKey) {
      return this.deduplicator.handleIdempotentRequest(
        `create-professional-${idempotencyKey}`,
        () => this.executeCreateProfessional(data)
      );
    }

    return this.executeCreateProfessional(data);
  }

  /**
   * Update professional profile with optimistic locking
   */
  async updateProfessionalProfile(
    professionalId: number,
    data: UpdateProfessionalData,
    lastUpdated?: Date
  ): Promise<Professional> {
    // Check if professional exists
    const existing = await this.getProfessionalById(professionalId);
    if (!existing) {
      throw new NotFoundError("Professional not found");
    }

    // Optimistic locking check
    if (lastUpdated && existing.updatedAt > lastUpdated) {
      throw new ConflictError("Professional has been updated by another user");
    }

    // Validate email uniqueness if email is being updated
    if (data.email && data.email !== existing.email) {
      const emailExists = await this.getDb()
        .select()
        .from(professionals)
        .where(
          and(
            eq(professionals.email, data.email),
            sql`${professionals.id} != ${professionalId}`
          )
        )
        .limit(1);

      if (emailExists.length > 0) {
        throw new ConflictError("Email already in use by another professional");
      }
    }

    // Prepare update data with proper type conversion
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Convert numeric fields to strings for database
    if (data.hourlyRate !== undefined) {
      updateData.hourlyRate = data.hourlyRate?.toString();
    }
    if (data.projectMinimum !== undefined) {
      updateData.projectMinimum = data.projectMinimum?.toString();
    }

    // Update professional
    const [updated] = await this.getDb()
      .update(professionals)
      .set(updateData)
      .where(eq(professionals.id, professionalId))
      .returning();

    // Clear cache
    await this.clearProfessionalCache(professionalId);

    return updated as Professional;
  }

  /**
   * Get professional by ID with caching
   */
  async getProfessionalById(
    professionalId: number
  ): Promise<Professional | null> {
    const cacheKey = `professional:${professionalId}`;

    // Try cache first
    const cached = await this.cache.get<Professional>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const [professional] = await this.getDb()
      .select({
        id: professionals.id,
        userId: professionals.userId,
        businessName: professionals.businessName,
        firstName: professionals.firstName,
        lastName: professionals.lastName,
        email: professionals.email,
        phone: professionals.phone,
        alternatePhone: professionals.alternatePhone,
        businessAddress: professionals.businessAddress,
        serviceAreas: professionals.serviceAreas,
        primarySpecialization: professionals.primarySpecialization,
        secondarySpecializations: professionals.secondarySpecializations,
        yearsOfExperience: professionals.yearsOfExperience,
        licenseNumber: professionals.licenseNumber,
        licenseExpiryDate: professionals.licenseExpiryDate,
        certifications: professionals.certifications,
        education: professionals.education,
        profileImageUrl: professionals.profileImageUrl,
        bio: professionals.bio,
        website: professionals.website,
        socialMedia: professionals.socialMedia,
        hourlyRate: professionals.hourlyRate,
        projectMinimum: professionals.projectMinimum,
        currency: professionals.currency,
        paymentTerms: professionals.paymentTerms,
        isAvailable: professionals.isAvailable,
        nextAvailableDate: professionals.nextAvailableDate,
        workingHours: professionals.workingHours,
        emergencyAvailable: professionals.emergencyAvailable,
        verificationStatus: professionals.verificationStatus,
        verificationDocuments: professionals.verificationDocuments,
        trustScore: professionals.trustScore,
        completedProjects: professionals.completedProjects,
        averageRating: professionals.averageRating,
        totalReviews: professionals.totalReviews,
        responseTime: professionals.responseTime,
        completionRate: professionals.completionRate,
        isActive: professionals.isActive,
        isFeatured: professionals.isFeatured,
        lastActiveAt: professionals.lastActiveAt,
        createdAt: professionals.createdAt,
        updatedAt: professionals.updatedAt,
        // Join user data if available
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(professionals)
      .leftJoin(users, eq(professionals.userId, users.id))
      .where(
        and(
          eq(professionals.id, professionalId),
          eq(professionals.isActive, true)
        )
      )
      .limit(1);

    if (!professional) {
      return null;
    }

    // Cache result
    await this.cache.set(cacheKey, professional, { ttl: 300 }); // 5 minutes

    return professional as Professional;
  }

  /**
   * Search professionals with advanced filtering and caching
   */
  async searchProfessionals(filters: ProfessionalSearchFilters = {}): Promise<{
    professionals: Professional[];
    totalCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    return this.executeSearchProfessionals(filters);
  }

  /**
   * Execute search with reduced complexity
   */
  private async executeSearchProfessionals(
    filters: ProfessionalSearchFilters
  ): Promise<{
    professionals: Professional[];
    totalCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const {
      sortBy = "rating",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = filters;

    // Generate cache key
    const cacheKey = `professionals:search:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<{
      professionals: Professional[];
      totalCount: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query conditions
    const conditions = this.buildSearchConditions(filters);

    // Build sort order
    const orderBy = this.buildSortOrder(sortBy, sortOrder);

    // Get total count
    const [countResult] = await this.getDb()
      .select({ count: sql<number>`count(*)` })
      .from(professionals)
      .where(and(...conditions));

    const totalCount = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * limit;
    const results = await this.getDb()
      .select({
        id: professionals.id,
        businessName: professionals.businessName,
        firstName: professionals.firstName,
        lastName: professionals.lastName,
        email: professionals.email,
        phone: professionals.phone,
        businessAddress: professionals.businessAddress,
        serviceAreas: professionals.serviceAreas,
        primarySpecialization: professionals.primarySpecialization,
        secondarySpecializations: professionals.secondarySpecializations,
        yearsOfExperience: professionals.yearsOfExperience,
        profileImageUrl: professionals.profileImageUrl,
        bio: professionals.bio,
        website: professionals.website,
        hourlyRate: professionals.hourlyRate,
        projectMinimum: professionals.projectMinimum,
        currency: professionals.currency,
        isAvailable: professionals.isAvailable,
        nextAvailableDate: professionals.nextAvailableDate,
        emergencyAvailable: professionals.emergencyAvailable,
        verificationStatus: professionals.verificationStatus,
        trustScore: professionals.trustScore,
        completedProjects: professionals.completedProjects,
        averageRating: professionals.averageRating,
        totalReviews: professionals.totalReviews,
        responseTime: professionals.responseTime,
        completionRate: professionals.completionRate,
        isFeatured: professionals.isFeatured,
        lastActiveAt: professionals.lastActiveAt,
      })
      .from(professionals)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const result = {
      professionals: results as Professional[],
      totalCount,
      page,
      limit,
      hasMore: offset + results.length < totalCount,
    };

    // Cache results for 2 minutes
    await this.cache.set(cacheKey, result, { ttl: 120 });

    return result;
  }

  /**
   * Build search conditions
   */
  private buildSearchConditions(filters: ProfessionalSearchFilters) {
    const conditions = [eq(professionals.isActive, true)];

    if (filters.specialization) {
      conditions.push(
        eq(professionals.primarySpecialization, filters.specialization)
      );
    }

    if (filters.location) {
      const locationPattern = `%${filters.location}%`;
      const locationCondition = or(
        like(professionals.businessAddress, locationPattern),
        sql`${professionals.serviceAreas}::text ILIKE ${locationPattern}`
      );
      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    if (filters.minRating && filters.minRating > 0) {
      conditions.push(
        gte(professionals.averageRating, filters.minRating.toString())
      );
    }

    if (filters.maxHourlyRate) {
      conditions.push(
        lte(professionals.hourlyRate, filters.maxHourlyRate.toString())
      );
    }

    if (filters.isAvailable !== undefined) {
      conditions.push(eq(professionals.isAvailable, filters.isAvailable));
    }

    if (filters.verificationStatus) {
      conditions.push(
        eq(professionals.verificationStatus, filters.verificationStatus)
      );
    }

    if (filters.yearsOfExperience) {
      conditions.push(
        gte(professionals.yearsOfExperience, filters.yearsOfExperience)
      );
    }

    if (filters.serviceAreas && filters.serviceAreas.length > 0) {
      const areaConditions = filters.serviceAreas.map((area) => {
        const areaPattern = `%${area}%`;
        return sql`${professionals.serviceAreas}::text ILIKE ${areaPattern}`;
      });
      const serviceAreasCondition = or(...areaConditions);
      if (serviceAreasCondition) {
        conditions.push(serviceAreasCondition);
      }
    }

    if (filters.emergencyAvailable !== undefined) {
      conditions.push(
        eq(professionals.emergencyAvailable, filters.emergencyAvailable)
      );
    }

    return conditions;
  }

  /**
   * Build sort order
   */
  private buildSortOrder(sortBy: string, sortOrder: string) {
    switch (sortBy) {
      case "rating":
        return sortOrder === "desc" ?
            desc(professionals.averageRating)
          : asc(professionals.averageRating);
      case "experience":
        return sortOrder === "desc" ?
            desc(professionals.yearsOfExperience)
          : asc(professionals.yearsOfExperience);
      case "price":
        return sortOrder === "desc" ?
            desc(professionals.hourlyRate)
          : asc(professionals.hourlyRate);
      case "reviews":
        return sortOrder === "desc" ?
            desc(professionals.totalReviews)
          : asc(professionals.totalReviews);
      case "recent":
        return sortOrder === "desc" ?
            desc(professionals.lastActiveAt)
          : asc(professionals.lastActiveAt);
      default:
        return desc(professionals.averageRating);
    }
  }

  /**
   * Get professionals by category with location filtering
   */
  async getProfessionalsByCategory(
    category: ProfessionalSpecializationValue,
    location?: string,
    limit: number = 10
  ): Promise<Professional[]> {
    const cacheKey = `professionals:category:${category}:${location || "all"}:${limit}`;
    const cached = await this.cache.get<Professional[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const conditions = [
      eq(professionals.isActive, true),
      eq(professionals.primarySpecialization, category),
      eq(professionals.verificationStatus, "verified"),
    ];

    if (location) {
      const locationPattern = `%${location}%`;
      const locationCondition = or(
        like(professionals.businessAddress, locationPattern),
        sql`${professionals.serviceAreas}::text ILIKE ${locationPattern}`
      );
      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    const results = await this.getDb()
      .select({
        id: professionals.id,
        businessName: professionals.businessName,
        firstName: professionals.firstName,
        lastName: professionals.lastName,
        profileImageUrl: professionals.profileImageUrl,
        primarySpecialization: professionals.primarySpecialization,
        yearsOfExperience: professionals.yearsOfExperience,
        averageRating: professionals.averageRating,
        totalReviews: professionals.totalReviews,
        hourlyRate: professionals.hourlyRate,
        currency: professionals.currency,
        isAvailable: professionals.isAvailable,
        serviceAreas: professionals.serviceAreas,
        trustScore: professionals.trustScore,
      })
      .from(professionals)
      .where(and(...conditions))
      .orderBy(
        desc(professionals.averageRating),
        desc(professionals.totalReviews)
      )
      .limit(limit);

    // Cache for 5 minutes
    await this.cache.set(cacheKey, results, { ttl: 300 });

    return results as Professional[];
  }

  /**
   * Add professional review with duplicate prevention
   */
  async addProfessionalReview(data: CreateProfessionalReviewData): Promise<{
    id: number;
    professionalId: number;
    reviewerId: number;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5");
    }

    // Check for duplicate review
    const existingReview = await this.getDb()
      .select()
      .from(professionalReviews)
      .where(
        and(
          eq(professionalReviews.professionalId, data.professionalId),
          eq(professionalReviews.reviewerId, data.reviewerId)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      throw new ConflictError("You have already reviewed this professional");
    }

    // Create review
    const [review] = await this.getDb()
      .insert(professionalReviews)
      .values({
        professionalId: data.professionalId,
        reviewerId: data.reviewerId,
        projectId: data.projectId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        serviceType: data.serviceType,
        projectValue: data.projectValue?.toString(),
        timelinessRating: data.timelinessRating,
        communicationRating: data.communicationRating,
        qualityRating: data.qualityRating,
        valueRating: data.valueRating,
        wouldRecommend: data.wouldRecommend ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!review) {
      throw new Error("Failed to create review");
    }

    // Update professional's rating statistics
    await this.updateProfessionalRatingStats(data.professionalId);

    // Clear cache
    await this.clearProfessionalCache(data.professionalId);

    return {
      id: review.id,
      professionalId: review.professionalId,
      reviewerId: review.reviewerId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  /**
   * Get professional reviews with pagination
   */
  async getProfessionalReviews(
    professionalId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: Array<{
      id: number;
      rating: number;
      title?: string | null;
      comment: string;
      serviceType?: string | null;
      projectValue?: string | null;
      timelinessRating?: number | null;
      communicationRating?: number | null;
      qualityRating?: number | null;
      valueRating?: number | null;
      wouldRecommend: boolean;
      isVerifiedClient: boolean;
      helpfulCount: number;
      professionalResponse?: string | null;
      professionalResponseAt?: Date | null;
      createdAt: Date;
      reviewer?: {
        id: number;
        firstName?: string | null;
        lastName?: string | null;
        profileImageUrl?: string | null;
      } | null;
    }>;
    totalCount: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  }> {
    const cacheKey = `professional:${professionalId}:reviews:${page}:${limit}`;
    const cached = await this.cache.get<{
      reviews: Array<{
        id: number;
        rating: number;
        title?: string | null;
        comment: string;
        serviceType?: string | null;
        projectValue?: string | null;
        timelinessRating?: number | null;
        communicationRating?: number | null;
        qualityRating?: number | null;
        valueRating?: number | null;
        wouldRecommend: boolean;
        isVerifiedClient: boolean;
        helpfulCount: number;
        professionalResponse?: string | null;
        professionalResponseAt?: Date | null;
        createdAt: Date;
        reviewer?: {
          id: number;
          firstName?: string | null;
          lastName?: string | null;
          profileImageUrl?: string | null;
        } | null;
      }>;
      totalCount: number;
      averageRating: number;
      ratingDistribution: Record<number, number>;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get total count and average rating
    const [stats] = await this.getDb()
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${professionalReviews.rating})`,
      })
      .from(professionalReviews)
      .where(
        and(
          eq(professionalReviews.professionalId, professionalId),
          eq(professionalReviews.isActive, true)
        )
      );

    // Get rating distribution
    const ratingDist = await this.getDb()
      .select({
        rating: professionalReviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(professionalReviews)
      .where(
        and(
          eq(professionalReviews.professionalId, professionalId),
          eq(professionalReviews.isActive, true)
        )
      )
      .groupBy(professionalReviews.rating);

    const ratingDistribution = ratingDist.reduce(
      (acc, { rating, count }) => {
        acc[rating] = count;
        return acc;
      },
      {} as Record<number, number>
    );

    // Get paginated reviews
    const offset = (page - 1) * limit;
    const reviews = await this.getDb()
      .select({
        id: professionalReviews.id,
        rating: professionalReviews.rating,
        title: professionalReviews.title,
        comment: professionalReviews.comment,
        serviceType: professionalReviews.serviceType,
        projectValue: professionalReviews.projectValue,
        timelinessRating: professionalReviews.timelinessRating,
        communicationRating: professionalReviews.communicationRating,
        qualityRating: professionalReviews.qualityRating,
        valueRating: professionalReviews.valueRating,
        wouldRecommend: professionalReviews.wouldRecommend,
        isVerifiedClient: professionalReviews.isVerifiedClient,
        helpfulCount: professionalReviews.helpfulCount,
        professionalResponse: professionalReviews.professionalResponse,
        professionalResponseAt: professionalReviews.professionalResponseAt,
        createdAt: professionalReviews.createdAt,
        reviewer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(professionalReviews)
      .leftJoin(users, eq(professionalReviews.reviewerId, users.id))
      .where(
        and(
          eq(professionalReviews.professionalId, professionalId),
          eq(professionalReviews.isActive, true)
        )
      )
      .orderBy(desc(professionalReviews.createdAt))
      .limit(limit)
      .offset(offset);

    const result = {
      reviews,
      totalCount: stats?.count || 0,
      averageRating: Number(stats?.avgRating) || 0,
      ratingDistribution,
    };

    // Cache for 3 minutes
    await this.cache.set(cacheKey, result, { ttl: 180 });

    return result;
  }

  /**
   * Update availability with real-time updates
   */
  async updateAvailability(
    professionalId: number,
    isAvailable: boolean,
    nextAvailableDate?: Date
  ): Promise<void> {
    await this.getDb()
      .update(professionals)
      .set({
        isAvailable,
        nextAvailableDate,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(professionals.id, professionalId));

    // Clear cache
    await this.clearProfessionalCache(professionalId);
  }

  /**
   * Get available professionals with smart filtering
   */
  async getAvailableProfessionals(
    specialization?: ProfessionalSpecializationValue,
    location?: string,
    emergencyOnly: boolean = false
  ): Promise<Professional[]> {
    const conditions = [
      eq(professionals.isActive, true),
      eq(professionals.isAvailable, true),
      eq(professionals.verificationStatus, "verified"),
    ];

    if (specialization) {
      conditions.push(eq(professionals.primarySpecialization, specialization));
    }

    if (location) {
      const locationPattern = `%${location}%`;
      const locationCondition = or(
        like(professionals.businessAddress, locationPattern),
        sql`${professionals.serviceAreas}::text ILIKE ${locationPattern}`
      );
      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    if (emergencyOnly) {
      conditions.push(eq(professionals.emergencyAvailable, true));
    }

    const results = await this.getDb()
      .select({
        id: professionals.id,
        businessName: professionals.businessName,
        firstName: professionals.firstName,
        lastName: professionals.lastName,
        phone: professionals.phone,
        email: professionals.email,
        primarySpecialization: professionals.primarySpecialization,
        yearsOfExperience: professionals.yearsOfExperience,
        averageRating: professionals.averageRating,
        responseTime: professionals.responseTime,
        hourlyRate: professionals.hourlyRate,
        currency: professionals.currency,
        emergencyAvailable: professionals.emergencyAvailable,
        serviceAreas: professionals.serviceAreas,
      })
      .from(professionals)
      .where(and(...conditions))
      .orderBy(
        desc(professionals.averageRating),
        asc(professionals.responseTime)
      );

    return results as Professional[];
  }

  // Private helper methods

  private validateCreateData(data: CreateProfessionalData): void {
    const errors: Record<string, string[]> = {};

    if (!data.businessName?.trim()) {
      errors.businessName = ["Business name is required"];
    }

    if (!data.firstName?.trim()) {
      errors.firstName = ["First name is required"];
    }

    if (!data.lastName?.trim()) {
      errors.lastName = ["Last name is required"];
    }

    if (!data.email?.trim()) {
      errors.email = ["Email is required"];
    } else if (!data.email.includes("@") || !data.email.includes(".")) {
      errors.email = ["Invalid email format"];
    }

    if (!data.phone?.trim()) {
      errors.phone = ["Phone number is required"];
    }

    if (!data.businessAddress?.trim()) {
      errors.businessAddress = ["Business address is required"];
    }

    if (!data.primarySpecialization?.trim()) {
      errors.primarySpecialization = ["Primary specialization is required"];
    }

    if (data.yearsOfExperience < 0) {
      errors.yearsOfExperience = ["Years of experience cannot be negative"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }
  }

  private async executeCreateProfessional(
    data: CreateProfessionalData
  ): Promise<Professional> {
    const [professional] = await this.getDb()
      .insert(professionals)
      .values({
        userId: data.userId,
        businessName: data.businessName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        businessAddress: data.businessAddress,
        serviceAreas: data.serviceAreas,
        primarySpecialization: data.primarySpecialization,
        secondarySpecializations: data.secondarySpecializations,
        yearsOfExperience: data.yearsOfExperience,
        licenseNumber: data.licenseNumber,
        licenseExpiryDate: data.licenseExpiryDate,
        certifications: data.certifications,
        education: data.education,
        profileImageUrl: data.profileImageUrl,
        bio: data.bio,
        website: data.website,
        socialMedia: data.socialMedia,
        hourlyRate: data.hourlyRate?.toString(),
        projectMinimum: data.projectMinimum?.toString(),
        currency: data.currency || "KES",
        paymentTerms: data.paymentTerms,
        workingHours: data.workingHours,
        emergencyAvailable: data.emergencyAvailable || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return professional as Professional;
  }

  private async updateProfessionalRatingStats(
    professionalId: number
  ): Promise<void> {
    const [stats] = await this.getDb()
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${professionalReviews.rating})`,
      })
      .from(professionalReviews)
      .where(
        and(
          eq(professionalReviews.professionalId, professionalId),
          eq(professionalReviews.isActive, true)
        )
      );

    await this.getDb()
      .update(professionals)
      .set({
        totalReviews: stats?.count || 0,
        averageRating: stats?.avgRating?.toString() || "0.00",
        updatedAt: new Date(),
      })
      .where(eq(professionals.id, professionalId));
  }

  private async clearProfessionalCache(professionalId: number): Promise<void> {
    await Promise.all([
      this.cache.delete(`professional:${professionalId}`),
      this.cache.invalidateByPattern(`professional:${professionalId}:*`),
      this.cache.invalidateByPattern("professionals:search:*"),
      this.cache.invalidateByPattern("professionals:category:*"),
    ]);
  }
}

// Export singleton instance
export const professionalService = new ProfessionalService();
