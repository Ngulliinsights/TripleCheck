import {
  professionals,
  users,
  professionalSpecializationEnum,
} from "..\infrastructure\database\schemas\consolidated";
import { eq, and, or, like, desc, asc, sql, gte, lte } from "drizzle-orm";

import { CacheService } from '../cache/CacheService'
import { db } from "../infrastructure/database/connection";
import { RequestDeduplicator } from "../infrastructure/deduplication/RequestDeduplicator";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../src/local/error-handling";

// Extract the type from the enum
type ProfessionalSpecializationValue = typeof professionalSpecializationEnum.enumValues[number];

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
  availability?: Record<string, { start: string; end: string }>;
}

/**
 * Professional update data interface
 */
export interface UpdateProfessionalData
  extends Partial<CreateProfessionalData> {
  isAvailable?: boolean;
  verificationDocuments?: string[];
}

/**
 * Professional review data interface - using general reviews table
 */
export interface CreateProfessionalReviewData {
  professionalId: number;
  reviewerId: number;
  rating: number;
  comment: string;
}

/**
 * Professional data type - matches actual database schema
 */
export interface Professional {
  id: number;
  userId?: number | null;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  businessAddress: string;
  serviceAreas: string[];
  primarySpecialization: ProfessionalSpecializationValue;
  secondarySpecializations?: string[];
  yearsOfExperience: number;
  licenseNumber?: string | null;
  licenseExpiryDate?: Date | null;
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
  profileImageUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  hourlyRate?: string | null;
  projectMinimum?: string | null;
  availability?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  verificationStatus: "pending" | "verified" | "suspended" | "rejected";
  verificationDocuments?: string[];
  rating: string; // decimal stored as string
  reviewCount: number;
  completedProjects: number;
  responseTime: number;
  isActive: boolean;
  isAvailable: boolean;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  } | null;
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
        availability: professionals.availability,
        isAvailable: professionals.isAvailable,
        verificationStatus: professionals.verificationStatus,
        verificationDocuments: professionals.verificationDocuments,
        rating: professionals.rating,
        reviewCount: professionals.reviewCount,
        completedProjects: professionals.completedProjects,
        responseTime: professionals.responseTime,
        isActive: professionals.isActive,
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
        availability: professionals.availability,
        isAvailable: professionals.isAvailable,
        verificationStatus: professionals.verificationStatus,
        rating: professionals.rating,
        reviewCount: professionals.reviewCount,
        completedProjects: professionals.completedProjects,
        responseTime: professionals.responseTime,
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
        gte(professionals.rating, filters.minRating.toString())
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

    return conditions;
  }

  /**
   * Build sort order
   */
  private buildSortOrder(sortBy: string, sortOrder: string) {
    switch (sortBy) {
      case "rating":
        return sortOrder === "desc" ?
          desc(professionals.rating)
          : asc(professionals.rating);
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
          desc(professionals.reviewCount)
          : asc(professionals.reviewCount);
      case "recent":
        return sortOrder === "desc" ?
          desc(professionals.lastActiveAt)
          : asc(professionals.lastActiveAt);
      default:
        return desc(professionals.rating);
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
        rating: professionals.rating,
        reviewCount: professionals.reviewCount,
        hourlyRate: professionals.hourlyRate,
        isAvailable: professionals.isAvailable,
        serviceAreas: professionals.serviceAreas,
      })
      .from(professionals)
      .where(and(...conditions))
      .orderBy(
        desc(professionals.rating),
        desc(professionals.reviewCount)
      )
      .limit(limit);

    // Cache for 5 minutes
    await this.cache.set(cacheKey, results, { ttl: 300 });

    return results as Professional[];
  }

  /**
   * Add professional review - placeholder implementation
   * Note: Professional reviews system needs to be implemented
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

    // For now, return a placeholder response
    // In the future, this should create a proper professional review
    const now = new Date();
    // Using crypto.getRandomValues for secure random number generation
    const [randomId] = globalThis.crypto.getRandomValues(new Uint32Array(1));
    return {
      id: randomId ?? 0,
      professionalId: data.professionalId,
      reviewerId: data.reviewerId,
      rating: data.rating,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get professional reviews - placeholder implementation
   * Note: Professional reviews system needs to be implemented
   */
  async getProfessionalReviews(
    _professionalId: number,
    _pageNum: number = 1,
    _limitNum: number = 10
  ): Promise<{
    reviews: Array<{
      id: number;
      rating: number;
      comment: string;
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
    // For now, return empty results as professional reviews system is not yet implemented
    
    // For now, return empty results
    // In the future, this should query a proper professional reviews table
    return {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
      ratingDistribution: {},
    };
  }

  /**
   * Update availability with real-time updates
   */
  async updateAvailability(
    professionalId: number,
    isAvailable: boolean
  ): Promise<void> {
    await this.getDb()
      .update(professionals)
      .set({
        isAvailable,
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
    location?: string
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
        rating: professionals.rating,
        responseTime: professionals.responseTime,
        hourlyRate: professionals.hourlyRate,
        serviceAreas: professionals.serviceAreas,
      })
      .from(professionals)
      .where(and(...conditions))
      .orderBy(
        desc(professionals.rating),
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
    } else if (!data.email.includes('@') || !data.email.includes('.')) {
      errors.email = ["Invalid email format"];
    }

    if (!data.phone?.trim()) {
      errors.phone = ["Phone number is required"];
    }

    if (!data.businessAddress?.trim()) {
      errors.businessAddress = ["Business address is required"];
    }

    if (!data.serviceAreas || data.serviceAreas.length === 0) {
      errors.serviceAreas = ["At least one service area is required"];
    }

    if (!data.primarySpecialization) {
      errors.primarySpecialization = ["Primary specialization is required"];
    }

    if (typeof data.yearsOfExperience !== 'number' || data.yearsOfExperience < 0) {
      errors.yearsOfExperience = ["Years of experience must be a non-negative number"];
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
        availability: data.availability,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return professional as Professional;
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