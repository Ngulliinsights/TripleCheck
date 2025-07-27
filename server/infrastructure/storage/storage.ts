import { neon } from "@neondatabase/serverless";
import { 
  eq, 
  and, 
  or, 
  gte, 
  lte, 
  desc, 
  ilike, 
  sql, 
  count,
  type SQL 
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { 
  users, 
  properties, 
  reviews, 
  validateAIVerificationResults 
} from "../../../src/shared/schema";
import type {
  Property,
  User,
  Review,
  InsertUser,
  InsertProperty,
  InsertReview,
  AIVerificationResults,
} from "../../../src/shared/schema";
// Enhanced PropertyFilter interface with better type safety
export interface PropertyFilter {
  type?: string[];
  priceRange?: readonly [number, number];
  bedrooms?: number;
  bathrooms?: number;
  area?: readonly [number, number];
  features?: readonly string[];
  verificationStatus?: readonly string[];
  location?: string;
}

// Custom Location interface to avoid DOM Location conflicts
export interface PropertyLocation {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

// Pagination interfaces for efficient data handling
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// Cache configuration interface
export interface CacheConfig {
  readonly ttl: number;
  readonly maxSize: number;
}

// Batch operation interfaces
export interface BatchCreateResult<T> {
  readonly successful: readonly T[];
  readonly failed: readonly { item: unknown; error: string }[];
  readonly totalProcessed: number;
}

// Enhanced interface with better error handling and result types
export interface IStorage {
  // User operations with proper return types
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(id: number, score: number): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;

  // Property operations with enhanced type safety and pagination
  getProperty(id: number): Promise<Property | null>;
  getProperties(): Promise<readonly Property[]>;
  getPropertiesPaginated(
    pagination: PaginationParams
  ): Promise<PaginatedResult<Property>>;
  createProperty(property: InsertProperty): Promise<Property>;
  createPropertiesBatch(
    properties: InsertProperty[]
  ): Promise<BatchCreateResult<Property>>;
  updateVerificationStatus(
    id: number,
    status: string,
    results: unknown
  ): Promise<Property>;
  searchProperties(query: string): Promise<readonly Property[]>;
  searchPropertiesWithFilters(
    filters: PropertyFilter
  ): Promise<readonly Property[]>;
  searchPropertiesWithFiltersPaginated(
    filters: PropertyFilter,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Property>>;

  // Review operations with pagination
  getReviews(propertyId: number): Promise<readonly Review[]>;
  getReviewsPaginated(
    propertyId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Review>>;
  createReview(review: InsertReview): Promise<Review>;

  // Location operations
  searchLocations(query: string): Promise<readonly PropertyLocation[]>;

  // Database initialization
  initializeDatabase(): Promise<void>;
}

// Enhanced database storage implementation with better error handling and performance
export class DatabaseStorage implements IStorage {
  private readonly db: ReturnType<typeof drizzle>;
  private static readonly UNKNOWN_ERROR_MESSAGE = "Unknown error";

  // Logger utility to replace console statements
  private readonly logger = {
    error: (message: string, error?: unknown): void => {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.error(`[DatabaseStorage] ${message}`, error);
      }
    },
    warn: (message: string, error?: unknown): void => {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn(`[DatabaseStorage] ${message}`, error);
      }
    }
  };

  // Cache for common locations to improve performance
  private readonly commonLocations: readonly PropertyLocation[] = [
    { id: "1", name: "Karen", description: "Affluent suburb in Nairobi" },
    { id: "2", name: "Runda", description: "Exclusive residential area" },
    {
      id: "3",
      name: "Kilimani",
      description: "Popular urban residential area",
    },
    {
      id: "4",
      name: "Westlands",
      description: "Commercial and residential hub",
    },
    { id: "5", name: "Lavington", description: "Upmarket residential area" },
    {
      id: "6",
      name: "Parklands",
      description: "Diverse residential and commercial area",
    },
    {
      id: "7",
      name: "Upperhill",
      description: "Business district with residential options",
    },
    { id: "8", name: "Kileleshwa", description: "Mixed residential area" },
    {
      id: "9",
      name: "Ngong Road",
      description: "Developing residential corridor",
    },
    { id: "10", name: "Riverside", description: "Upscale residential area" },
  ] as const;

  // Simple in-memory cache for frequently accessed data
  private readonly cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();
  private readonly cacheConfig: CacheConfig = {
    ttl: 300, // 5 minutes default TTL
    maxSize: 1000, // Maximum 1000 cached items
  };

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!databaseUrl) {
      if (isDevelopment) {
        // Initialize with mock data for development
        this.db = {} as ReturnType<typeof drizzle>;
        return;
      }
      throw new Error("DATABASE_URL environment variable is required");
    }

    try {
      // Enhanced connection with better configuration for production use
      const sql = neon(databaseUrl);
      this.db = drizzle(sql);
      // Database connection initialized successfully with connection pooling

      // Start cache cleanup interval
      this.startCacheCleanup();
    } catch (error) {
      // Failed to initialize database connection
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE}`);
    }
  }

  // Cache management methods
  private cacheCleanupInterval?: NodeJS.Timeout | undefined;

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > value.ttl * 1000) {
          this.cache.delete(key);
        }
      }

      // Enforce max cache size
      if (this.cache.size > this.cacheConfig.maxSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(
          0,
          this.cache.size - this.cacheConfig.maxSize
        );
        toDelete.forEach(([key]) => this.cache.delete(key));
      }
    }, 300000); // 5 minutes
  }

  // Add cleanup method
  public cleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = undefined;
    }
    this.cache.clear();
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(
    key: string,
    data: T,
    ttl: number = this.cacheConfig.ttl
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Helper method to calculate pagination offset
  private calculateOffset(pagination: PaginationParams): number {
    return pagination.offset ?? (pagination.page - 1) * pagination.limit;
  }

  // Helper method to create paginated result
  private createPaginatedResult<T>(
    items: T[],
    totalCount: number,
    pagination: PaginationParams
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(totalCount / pagination.limit);

    return {
      items,
      totalCount,
      currentPage: pagination.page,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };
  }

  // Enhanced error handling with more specific error messages
  private handleDatabaseError(operation: string, error: unknown): never {
    // Database error occurred during operation
    throw new Error(
      `Failed to ${operation}: ${error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE}`
    );
  }

  async getUser(id: number): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError("get user", error);
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError("get user by username", error);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create user - no result returned");
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("create user", error);
    }
  }

  async updateUserTrustScore(id: number, score: number): Promise<User> {
    try {
      const result = await this.db
        .update(users)
        .set({
          trustScore: score,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`User with id ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("update user trust score", error);
    }
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    try {
      const result = await this.db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`User with id ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("update user password", error);
    }
  }

  async getProperty(id: number): Promise<Property | null> {
    try {
      const result = await this.db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError("get property", error);
    }
  }

  async getProperties(): Promise<readonly Property[]> {
    try {
      return await this.db
        .select()
        .from(properties)
        .where(eq(properties.isActive, true))
        .orderBy(desc(properties.createdAt));
    } catch (error) {
      this.handleDatabaseError("get properties", error);
    }
  }

  async getPropertiesPaginated(
    pagination: PaginationParams
  ): Promise<PaginatedResult<Property>> {
    try {
      const cacheKey = `properties_paginated_${pagination.page}_${pagination.limit}`;
      const cached = this.getCached<PaginatedResult<Property>>(cacheKey);
      if (cached) {
        return cached;
      }

      const offset = this.calculateOffset(pagination);

      // Get total count for pagination
      const [countResult] = await this.db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.isActive, true));

      const totalCount = countResult?.count || 0;

      // Get paginated results
      const result = await this.db
        .select()
        .from(properties)
        .where(eq(properties.isActive, true))
        .orderBy(desc(properties.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const paginatedResult = this.createPaginatedResult<Property>(
        result,
        totalCount,
        pagination
      );

      // Cache the result for 2 minutes
      this.setCache(cacheKey, paginatedResult, 120);

      return paginatedResult;
    } catch (error) {
      this.handleDatabaseError("get properties paginated", error);
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    try {
      const result = await this.db
        .insert(properties)
        .values({
          ...insertProperty,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create property - no result returned");
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("create property", error);
    }
  }

  async createPropertiesBatch(
    insertProperties: InsertProperty[]
  ): Promise<BatchCreateResult<Property>> {
    const successful: Property[] = [];
    const failed: { item: unknown; error: string }[] = [];

    // Process in batches of 10 for better performance and error handling
    const batchSize = 10;
    for (let i = 0; i < insertProperties.length; i += batchSize) {
      const batch = insertProperties.slice(i, i + batchSize);
      await this.processBatch(batch, successful, failed);
    }

    return {
      successful,
      failed,
      totalProcessed: insertProperties.length,
    };
  }

  private async processBatch(
    batch: InsertProperty[],
    successful: Property[],
    failed: { item: unknown; error: string }[]
  ): Promise<void> {
    try {
      const results = await this.executeBatchInsert(batch);
      successful.push(...results);
    } catch (error) {
      this.logger.error("Batch insert failed, attempting individual inserts:", error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE);
      await this.processIndividualInserts(batch, successful, failed);
    }
  }

  private async executeBatchInsert(batch: InsertProperty[]): Promise<Property[]> {
    const batchData = batch.map((property) => ({
      ...property,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return await this.db
      .insert(properties)
      .values(batchData)
      .returning();
  }

  private async processIndividualInserts(
    batch: InsertProperty[],
    successful: Property[],
    failed: { item: unknown; error: string }[]
  ): Promise<void> {
    for (const property of batch) {
      try {
        const result = await this.createProperty(property);
        successful.push(result);
      } catch (individualError) {
        failed.push({
          item: property,
          error:
            individualError instanceof Error ?
              individualError.message
            : DatabaseStorage.UNKNOWN_ERROR_MESSAGE,
        });
      }
    }
  }

  async updateVerificationStatus(
    id: number,
    status: string,
    results: unknown
  ): Promise<Property> {
    try {
      // Validate and type the AI verification results
      const validatedResults: AIVerificationResults | null = results ? validateAIVerificationResults(results) : null;
      
      const result = await this.db
        .update(properties)
        .set({
          verificationStatus: status as
            | "verified"
            | "pending"
            | "unverified"
            | "draft",
          aiVerificationResults: validatedResults,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Property with id ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("update verification status", error);
    }
  }

  async searchProperties(query: string): Promise<readonly Property[]> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      // Enhanced full-text search with PostgreSQL capabilities
      const searchTerms = trimmedQuery
        .split(" ")
        .filter((term) => term.length > 0);
      const tsQuery = searchTerms.join(" & ");

      return await this.db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.isActive, true),
            or(
              // Full-text search on title and description
              sql`to_tsvector('english', ${properties.title} || ' ' || ${properties.description}) @@ to_tsquery('english', ${tsQuery})`,
              // Fallback to ILIKE for partial matches and location search
              ilike(properties.title, `%${trimmedQuery}%`),
              ilike(properties.description, `%${trimmedQuery}%`),
              ilike(properties.location, `%${trimmedQuery}%`),
              // Search in JSON features for property type
              sql`${properties.features}->>'propertyType' ILIKE '%${trimmedQuery}%'`
            )
          )
        )
        .orderBy(
          // Order by relevance using ts_rank for full-text matches, then by creation date
          sql`CASE 
            WHEN to_tsvector('english', ${properties.title} || ' ' || ${properties.description}) @@ to_tsquery('english', ${tsQuery}) 
            THEN ts_rank(to_tsvector('english', ${properties.title} || ' ' || ${properties.description}), to_tsquery('english', ${tsQuery})) 
            ELSE 0 
          END DESC`,
          desc(properties.createdAt)
        )
        .limit(50);
    } catch (error) {
      // Fallback to simple ILIKE search if full-text search fails
      this.logger.warn("Full-text search failed, falling back to simple search:", error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE);
      try {
        return await this.db
          .select()
          .from(properties)
          .where(
            and(
              eq(properties.isActive, true),
              or(
                ilike(properties.title, `%${query.trim()}%`),
                ilike(properties.description, `%${query.trim()}%`),
                ilike(properties.location, `%${query.trim()}%`)
              )
            )
          )
          .orderBy(desc(properties.createdAt))
          .limit(50);
      } catch (fallbackError) {
        this.handleDatabaseError("search properties", fallbackError);
      }
    }
  }

  async searchPropertiesWithFilters(
    filters: PropertyFilter
  ): Promise<readonly Property[]> {
    try {
      // Build database-level conditions for optimal performance
      const conditions = this.buildDatabaseConditions(filters);

      // Execute optimized database query
      const result = await this.db
        .select()
        .from(properties)
        .where(and(eq(properties.isActive, true), ...conditions))
        .orderBy(desc(properties.createdAt))
        .limit(100);

      // Apply memory-based filters for complex JSON operations
      return this.applyMemoryFilters(result, filters);
    } catch (error) {
      this.handleDatabaseError("search properties with filters", error);
    }
  }

  async searchPropertiesWithFiltersPaginated(
    filters: PropertyFilter,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Property>> {
    try {
      const cacheKey = `properties_filtered_${JSON.stringify(filters)}_${pagination.page}_${pagination.limit}`;
      const cached = this.getCached<PaginatedResult<Property>>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build database-level conditions for optimal performance
      const conditions = this.buildDatabaseConditions(filters);
      const offset = this.calculateOffset(pagination);

      // Get all results that match database conditions
      const baseQuery = this.db
        .select()
        .from(properties)
        .where(and(eq(properties.isActive, true), ...conditions));

      const allResults = await baseQuery;
      const filteredResults = this.applyMemoryFilters(allResults, filters);
      const totalCount = filteredResults.length;

      // Apply pagination to filtered results
      const paginatedItems = filteredResults.slice(
        offset,
        offset + pagination.limit
      );

      const paginatedResult = this.createPaginatedResult<Property>(
        paginatedItems,
        totalCount,
        pagination
      );

      // Cache the result for 2 minutes
      this.setCache(cacheKey, paginatedResult, 120);

      return paginatedResult;
    } catch (error) {
      this.handleDatabaseError(
        "search properties with filters paginated",
        error
      );
    }
  }

  async getReviews(propertyId: number): Promise<readonly Review[]> {
    try {
      return await this.db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.propertyId, propertyId), eq(reviews.isActive, true))
        )
        .orderBy(desc(reviews.createdAt));
    } catch (error) {
      this.handleDatabaseError("get reviews", error);
    }
  }

  async getReviewsPaginated(
    propertyId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Review>> {
    try {
      const cacheKey = `reviews_paginated_${propertyId}_${pagination.page}_${pagination.limit}`;
      const cached = this.getCached<PaginatedResult<Review>>(cacheKey);
      if (cached) {
        return cached;
      }

      const offset = this.calculateOffset(pagination);

      // Get total count for pagination
      const [countResult] = await this.db
        .select({ count: count() })
        .from(reviews)
        .where(
          and(eq(reviews.propertyId, propertyId), eq(reviews.isActive, true))
        );

      const totalCount = countResult?.count || 0;

      // Get paginated results
      const result = await this.db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.propertyId, propertyId), eq(reviews.isActive, true))
        )
        .orderBy(desc(reviews.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const paginatedResult = this.createPaginatedResult<Review>(
        result,
        totalCount,
        pagination
      );

      // Cache the result for 5 minutes
      this.setCache(cacheKey, paginatedResult, 300);

      return paginatedResult;
    } catch (error) {
      this.handleDatabaseError("get reviews paginated", error);
    }
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    try {
      const result = await this.db
        .insert(reviews)
        .values({
          ...insertReview,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create review - no result returned");
      }

      return result[0];
    } catch (error) {
      this.handleDatabaseError("create review", error);
    }
  }

  async searchLocations(query: string): Promise<readonly PropertyLocation[]> {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return [];
    }

    try {
      // Query database for actual locations from properties
      const result = await this.db
        .select({
          location: properties.location,
        })
        .from(properties)
        .where(
          and(
            eq(properties.isActive, true),
            ilike(properties.location, `%${trimmedQuery}%`)
          )
        )
        .groupBy(properties.location)
        .orderBy(properties.location)
        .limit(20);

      // Transform database results to PropertyLocation format
      const dbLocations: PropertyLocation[] = result.map((row: { location: string }, index: number) => ({
        id: `db_${index}`,
        name: row.location,
        description: `Properties available in ${row.location}`,
      }));

      // Combine with cached common locations for better user experience
      const cachedMatches = this.commonLocations.filter(
        (location) =>
          location.name.toLowerCase().includes(trimmedQuery) ||
          location.description?.toLowerCase().includes(trimmedQuery)
      );

      // Merge and deduplicate results, prioritizing database results
      const allLocations = [...dbLocations, ...cachedMatches];
      const uniqueLocations = allLocations.filter(
        (location, index, self) =>
          index ===
          self.findIndex(
            (l) => l.name.toLowerCase() === location.name.toLowerCase()
          )
      );

      return uniqueLocations.slice(0, 10);
    } catch (error) {
      // Fallback to cached locations if database query fails
      this.logger.warn("Database location search failed, using cached locations:", error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE);
      return this.commonLocations.filter(
        (location) =>
          location.name.toLowerCase().includes(trimmedQuery) ||
          location.description?.toLowerCase().includes(trimmedQuery)
      );
    }
  }

  // Enhanced helper method to build database-level conditions for better performance
  private buildDatabaseConditions(filters: PropertyFilter): SQL[] {
    const conditions: SQL[] = [];

    // Price range filter - handled at database level for performance
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      const priceCondition = and(
        gte(sql`CAST(${properties.price} AS DECIMAL)`, min),
        lte(sql`CAST(${properties.price} AS DECIMAL)`, max)
      );
      if (priceCondition) {
        conditions.push(priceCondition);
      }
    }

    // Location filter - handled at database level with case-insensitive search
    if (filters.location) {
      conditions.push(ilike(properties.location, `%${filters.location}%`));
    }

    // Verification status filter - handled at database level
    if (filters.verificationStatus?.length) {
      conditions.push(
        sql`${properties.verificationStatus} = ANY(${filters.verificationStatus})`
      );
    }

    return conditions;
  }

  // Helper method to apply memory-based filters for complex JSON operations
  private applyMemoryFilters(
    properties: Property[],
    filters: PropertyFilter
  ): readonly Property[] {
    return properties.filter((property) => {
      return this.matchesPropertyTypeFilter(property, filters) &&
             this.matchesBedroomFilter(property, filters) &&
             this.matchesBathroomFilter(property, filters) &&
             this.matchesAreaFilter(property, filters) &&
             this.matchesFeaturesFilter(property, filters);
    });
  }

  private matchesPropertyTypeFilter(property: Property, filters: PropertyFilter): boolean {
    if (!filters.type?.length) return true;
    return filters.type.includes(property.features?.propertyType || "");
  }

  private matchesBedroomFilter(property: Property, filters: PropertyFilter): boolean {
    if (filters.bedrooms === undefined) return true;
    return (property.features?.bedrooms || 0) >= filters.bedrooms;
  }

  private matchesBathroomFilter(property: Property, filters: PropertyFilter): boolean {
    if (filters.bathrooms === undefined) return true;
    return (property.features?.bathrooms || 0) >= filters.bathrooms;
  }

  private matchesAreaFilter(property: Property, filters: PropertyFilter): boolean {
    if (!filters.area) return true;
    const [min, max] = filters.area;
    const squareFeet = property.features?.squareFeet || 0;
    return squareFeet >= min && squareFeet <= max;
  }

  private matchesFeaturesFilter(property: Property, filters: PropertyFilter): boolean {
    if (!filters.features?.length) return true;
    const propertyAmenities = property.features?.amenities || [];
    return filters.features.every((feature) => propertyAmenities.includes(feature));
  }

  // Enhanced database initialization with better error handling
  async initializeDatabase(): Promise<void> {
    try {
      if (await this.shouldSkipInitialization()) {
        return;
      }

      const createdUsers = await this.initializeSampleUsers();
      const mockProperties = this.createSampleProperties(createdUsers);
      await this.initializeSampleProperties(mockProperties);
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE}`);
    }
  }

  private async shouldSkipInitialization(): Promise<boolean> {
    const existingProperties = await this.getProperties();
    return existingProperties.length > 0;
  }

  private async initializeSampleUsers(): Promise<User[]> {
    const sampleUsers = this.getSampleUserData();
    const createdUsers: User[] = [];

    for (const user of sampleUsers) {
      const createdUser = await this.createOrGetUser(user);
      if (createdUser) {
        createdUsers.push(createdUser);
      }
    }

    if (createdUsers.length === 0) {
      throw new Error("No users available for property creation");
    }

    return createdUsers;
  }

  private getSampleUserData(): InsertUser[] {
    const defaultPassword = process.env.DEFAULT_SAMPLE_PASSWORD || "password123";
    return [
      {
        username: "john_doe",
        email: "john@example.com",
        password: defaultPassword,
        role: "user",
      },
      {
        username: "jane_smith",
        email: "jane@example.com",
        password: process.env.JANE_SAMPLE_PASSWORD || "password456",
        role: "user",
      },
    ];
  }

  private async createOrGetUser(user: InsertUser): Promise<User | null> {
    try {
      const existingUser = await this.getUserByUsername(user.username);
      if (existingUser) {
        return existingUser;
      }
      return await this.createUser(user);
    } catch (error) {
      this.logger.error(`Failed to create user ${user.username}:`, error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE);
      return null;
    }
  }

  private async initializeSampleProperties(mockProperties: InsertProperty[]): Promise<void> {
    for (const property of mockProperties) {
      try {
        await this.createProperty(property);
      } catch (error) {
        this.logger.error(`Failed to create property ${property.title}:`, error instanceof Error ? error.message : DatabaseStorage.UNKNOWN_ERROR_MESSAGE);
      }
    }
  }

  // Helper method to create sample properties with better organization and type safety
  private createSampleProperties(users: User[]): InsertProperty[] {
    if (users.length === 0) {
      throw new Error("Cannot create sample properties without users");
    }

    const [primaryUser] = users;
    if (!primaryUser) {
      throw new Error("No primary user available for property creation");
    }
    const secondaryUser = users[1] || primaryUser;

    return [
      {
        ownerId: primaryUser.id,
        title: "Modern Apartment in Kilimani",
        description:
          "Luxurious 3-bedroom apartment with amazing city views and modern amenities.",
        location: "Kilimani, Nairobi",
        price: "25000000",
        verificationStatus: "verified" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
          parkingSpaces: 2,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
          petFriendly: true,
          furnished: true,
          propertyType: "apartment" as const,
        },
      },
      {
        ownerId: primaryUser.id,
        title: "Family Home in Karen",
        description:
          "Spacious 4-bedroom house with large garden and staff quarters.",
        location: "Karen, Nairobi",
        price: "45000000",
        verificationStatus: "verified" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 3000,
          parkingSpaces: 3,
          yearBuilt: 2019,
          amenities: ["Garden", "Staff Quarters", "Security", "Borehole"],
          petFriendly: false,
          furnished: false,
          propertyType: "house" as const,
        },
      },
      {
        ownerId: secondaryUser.id,
        title: "Executive Office in Westlands",
        description:
          "Premium office space in the heart of Westlands business district.",
        location: "Westlands, Nairobi",
        price: "35000000",
        verificationStatus: "pending" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ],
        features: {
          bedrooms: 0,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 5,
          yearBuilt: 2021,
          amenities: [
            "High-Speed Internet",
            "Conference Room",
            "Reception Area",
            "Security",
          ],
          petFriendly: false,
          furnished: true,
          propertyType: "condo" as const,
        },
      },
    ];
  }
}

// Export singleton instance with enhanced error handling
export const storage = new DatabaseStorage();
