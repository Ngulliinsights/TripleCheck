import { eq, and, desc, asc, sql, like, gte, lte, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { properties, landVerificationSessions } from '../infrastructure/database/schemas/consolidated';
import { getDatabase, isDatabaseAvailable } from '../infrastructure/database/init';

// Enhanced type definitions with proper optional handling
interface PropertyFilters {
  query?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  landVerified?: boolean;
  landRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PropertyData {
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  images?: string[];
  verificationStatus?: string;
  features?: Record<string, unknown>;
  ownerId: number;
}

interface SimilarPropertyParams {
  propertyType?: string;
  city?: string;
  location?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  excludeId?: string;
}



interface LandVerification {
  sessionId: number | null;
  status: string | null;
  overallRiskScore: number | null;
  riskLevel: string | null;
  confidence: number | null;
  lastUpdated: Date | null;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: string;
  location: string;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  imageUrls: string[];
  verificationStatus: string;
  features?: Record<string, unknown>;
  ownerId: number;
  viewCount: number;
  favoriteCount: number;
  isActive: boolean;
  isFeatured: boolean;
  availableFrom?: Date;
  availableUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  landVerification: LandVerification;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Use the proper database connection type from infrastructure
type DrizzleConnection = NodePgDatabase<Record<string, never>>;

// Enhanced query tracker with better error handling
const queryMonitor = {
  trackQuery: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Only log slow queries in development to avoid console warnings in production
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        // Using console.warn is acceptable for performance monitoring
        // eslint-disable-next-line no-console
        console.warn(`[QUERY] Slow query detected: ${name} took ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      // Error logging is essential for debugging
      // eslint-disable-next-line no-console
      console.error(`[QUERY] Query failed: ${name} after ${duration}ms`, error);
      throw error;
    }
  }
};

export class PropertyRepository {
  // Helper method to get database connection safely with proper typing
  private async getDatabaseConnection(): Promise<DrizzleConnection> {
    if (!isDatabaseAvailable()) {
      throw new Error('Database not available');
    }
    const db = await getDatabase();
    return db as unknown as DrizzleConnection;
  }

  // Helper method to build land verification data with improved error handling
  private buildLandVerification(
    landVerificationResult: {
      sessionId: number;
      status: string;
      overallRiskScore: number;
      riskLevel: string;
      confidence: string | number;
      lastUpdated: Date;
    }
  ): LandVerification {
    const confidenceValue = typeof landVerificationResult.confidence === 'string' 
      ? parseFloat(landVerificationResult.confidence) 
      : landVerificationResult.confidence;
      
    return {
      sessionId: landVerificationResult.sessionId,
      status: landVerificationResult.status,
      overallRiskScore: landVerificationResult.overallRiskScore,
      riskLevel: landVerificationResult.riskLevel,
      confidence: isNaN(confidenceValue) ? null : confidenceValue,
      lastUpdated: landVerificationResult.lastUpdated,
    };
  }

  // Refactored to reduce cognitive complexity with proper typing
  private buildQueryConditions(filters: PropertyFilters): SQL[] {
    const conditions: SQL[] = [];
    
    // Group related conditions to improve readability and reduce complexity
    this.addSearchConditions(filters, conditions);
    this.addLocationConditions(filters, conditions);
    this.addPriceConditions(filters, conditions);
    this.addPropertyTypeConditions(filters, conditions);
    this.addFeatureConditions(filters, conditions);
    this.addVerificationConditions(filters, conditions);

    return conditions;
  }

  private addSearchConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.query) {
      const queryPattern = `%${filters.query}%`;
      conditions.push(
        sql`(${properties.title} ILIKE ${queryPattern} OR ${properties.description} ILIKE ${queryPattern})`
      );
    }
  }

  private addLocationConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.location) {
      conditions.push(like(properties.location, `%${filters.location}%`));
    }
  }

  private addPriceConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.priceMin !== undefined) {
      conditions.push(gte(properties.price, filters.priceMin.toString()));
    }

    if (filters.priceMax !== undefined) {
      conditions.push(lte(properties.price, filters.priceMax.toString()));
    }
  }

  private addPropertyTypeConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.propertyType && properties.features) {
      conditions.push(
        sql`${properties.features}->>'propertyType' = ${filters.propertyType}`
      );
    }
  }

  private addFeatureConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.bedrooms !== undefined && properties.features) {
      conditions.push(
        sql`(${properties.features}->>'bedrooms')::int >= ${filters.bedrooms}`
      );
    }

    if (filters.bathrooms !== undefined && properties.features) {
      conditions.push(
        sql`(${properties.features}->>'bathrooms')::int >= ${filters.bathrooms}`
      );
    }

    if (filters.areaMin !== undefined && properties.features) {
      conditions.push(
        sql`(${properties.features}->>'squareFeet')::int >= ${filters.areaMin}`
      );
    }

    if (filters.areaMax !== undefined && properties.features) {
      conditions.push(
        sql`(${properties.features}->>'squareFeet')::int <= ${filters.areaMax}`
      );
    }
  }

  private addVerificationConditions(filters: PropertyFilters, conditions: SQL[]): void {
    if (filters.landVerified === true) {
      conditions.push(eq(landVerificationSessions.status, 'completed'));
    }

    if (filters.landRiskLevel) {
      conditions.push(eq(landVerificationSessions.riskLevel, filters.landRiskLevel));
    }
  }

  async findMany(filters: PropertyFilters): Promise<PaginatedResult<Property>> {
    try {
      // Check if database is available first
      if (!isDatabaseAvailable()) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Database not available, returning mock data');
        }
        return this.getMockPropertiesWithFilters(filters);
      }

      const db = await this.getDatabaseConnection();
      
      // Check if database has any properties
      const hasProperties = await db.select().from(properties).limit(1);
      
      if (hasProperties.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('No properties found in database, returning mock data');
        }
        return this.getMockPropertiesWithFilters(filters);
      }

      return await this.executePropertyQuery(filters, db);
    } catch (error) {
      // Error logging is essential for debugging
      // eslint-disable-next-line no-console
      console.error('Error in findMany:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  // Separate method to handle the actual database query
  private async executePropertyQuery(
    filters: PropertyFilters, 
    db: DrizzleConnection
  ): Promise<PaginatedResult<Property>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Build the base query
    let baseQuery = db.select({
      property: properties,
      landVerification: {
        sessionId: landVerificationSessions.id,
        status: landVerificationSessions.status,
        overallRiskScore: landVerificationSessions.overallRiskScore,
        riskLevel: landVerificationSessions.riskLevel,
        confidence: landVerificationSessions.confidence,
        lastUpdated: landVerificationSessions.updatedAt
      }
    })
    .from(properties)
    .leftJoin(
      landVerificationSessions,
      eq(properties.id, landVerificationSessions.propertyId)
    );

    // Apply filters
    const conditions = this.buildQueryConditions(filters);
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    // Apply sorting
    const sortColumn = this.getSortColumn(sortBy);
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    baseQuery = baseQuery.orderBy(sortDirection(sortColumn)) as any;

    // Apply pagination
    const offset = (page - 1) * limit;
    const results = await baseQuery.limit(limit).offset(offset);

    // Get total count for pagination
    const totalCount = await this.getTotalCount(filters, db);

    // Transform results to include land verification data
    const transformedData = this.transformResults(results);

    return {
      data: transformedData,
      total: totalCount,
      page,
      limit,
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    };
  }

  // Helper method to get total count
  private async getTotalCount(
    filters: PropertyFilters, 
    db: DrizzleConnection
  ): Promise<number> {
    // Build count query
    let countQuery = db.select({ count: sql<number>`count(*)` })
      .from(properties)
      .leftJoin(
        landVerificationSessions,
        eq(properties.id, landVerificationSessions.propertyId)
      );

    const conditions = this.buildQueryConditions(filters);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }

    const [result] = await countQuery;
    return result?.count || 0; // Safe fallback to avoid undefined errors
  }

  // Helper method to transform results with proper null checking and typing
  private transformResults(
    results: Array<{
      property: typeof properties.$inferSelect;
      landVerification: {
        sessionId: number | null;
        status: string | null;
        overallRiskScore: number | null;
        riskLevel: string | null;
        confidence: string | null;
        lastUpdated: Date | null;
      } | null;
    }>
  ): Property[] {
    return results.map((result) => {
      const { property } = result;
      let landVerification: LandVerification;

      // Handle land verification data
      if (result.landVerification?.sessionId && 
          result.landVerification?.status && 
          result.landVerification?.overallRiskScore !== null &&
          result.landVerification?.riskLevel && 
          result.landVerification?.confidence !== null &&
          result.landVerification?.lastUpdated) {
        
        landVerification = this.buildLandVerification({
          sessionId: result.landVerification.sessionId,
          status: result.landVerification.status,
          overallRiskScore: result.landVerification.overallRiskScore,
          riskLevel: result.landVerification.riskLevel,
          confidence: result.landVerification.confidence,
          lastUpdated: result.landVerification.lastUpdated,
        });
      } else {
        landVerification = {
          sessionId: result.landVerification?.sessionId || null,
          status: result.landVerification?.status || null,
          overallRiskScore: result.landVerification?.overallRiskScore || null,
          riskLevel: result.landVerification?.riskLevel || null,
          confidence: typeof result.landVerification?.confidence === 'string' 
            ? parseFloat(result.landVerification.confidence) 
            : result.landVerification?.confidence || null,
          lastUpdated: result.landVerification?.lastUpdated || null,
        };
      }

      // Safe type conversion with proper handling of nullable fields
      return {
        ...property,
        features: property.features as Record<string, unknown> | undefined,
        landVerification
      } as Property;
    });
  }

  async findById(id: string): Promise<Property | null> {
    try {
      const db = await this.getDatabaseConnection();
      
      const results = await db.select({
        property: properties,
        landVerification: {
          sessionId: landVerificationSessions.id,
          status: landVerificationSessions.status,
          overallRiskScore: landVerificationSessions.overallRiskScore,
          riskLevel: landVerificationSessions.riskLevel,
          confidence: landVerificationSessions.confidence,
          lastUpdated: landVerificationSessions.updatedAt
        }
      })
      .from(properties)
      .leftJoin(
        landVerificationSessions,
        eq(properties.id, landVerificationSessions.propertyId)
      )
      .where(eq(properties.id, parseInt(id)))
      .limit(1);

      const [result] = results;

      if (!result) {
        return null;
      }

      const transformedResults = this.transformResults([result]);
      return transformedResults[0] || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    try {
      const db = await this.getDatabaseConnection();
      
      const results = await db.select({
        property: properties,
        landVerification: {
          sessionId: landVerificationSessions.id,
          status: landVerificationSessions.status,
          overallRiskScore: landVerificationSessions.overallRiskScore,
          riskLevel: landVerificationSessions.riskLevel,
          confidence: landVerificationSessions.confidence,
          lastUpdated: landVerificationSessions.updatedAt
        }
      })
      .from(properties)
      .leftJoin(
        landVerificationSessions,
        eq(properties.id, landVerificationSessions.propertyId)
      )
      .where(eq(properties.ownerId, parseInt(ownerId)));

      return this.transformResults(results);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in findByOwner:', error);
      return [];
    }
  }

  // Optimized findSimilar method with reduced cognitive complexity
  async findSimilar(params: SimilarPropertyParams): Promise<Property[]> {
    return await queryMonitor.trackQuery('findSimilar', async () => {
      const db = await this.getDatabaseConnection();
      const conditions = this.buildSimilarityConditions(params);
      
      // Build the query with proper typing
      let baseQuery = db.select({
        property: properties,
        landVerification: sql`NULL`.as('landVerification')
      })
      .from(properties)
      .orderBy(desc(properties.isFeatured), desc(properties.createdAt));
      
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as any;
      }
      
      const results = await baseQuery.limit(parseInt((params.limit || 10).toString()));
      
      if (process.env.NODE_ENV === 'development') {
        this.logSimilarityQueryPerformance(params, results.length);
      }
      
      return this.transformResults(results as any);
    });
  }

  // Extracted method to build similarity conditions
  private buildSimilarityConditions(params: SimilarPropertyParams): SQL[] {
    const { propertyType, city, location, price, minPrice, maxPrice, excludeId } = params;
    const conditions: SQL[] = [];
    
    // Exclude the current property if specified
    if (excludeId) {
      const excludeIdNum = parseInt(excludeId);
      if (!isNaN(excludeIdNum)) {
        conditions.push(sql`${properties.id} != ${excludeIdNum}`);
      }
    }
    
    // Handle location matching
    this.addLocationSimilarityConditions(city, location, conditions);
    
    // Handle price matching
    this.addPriceSimilarityConditions(price, minPrice, maxPrice, conditions);
    
    // Property type matching
    if (propertyType && properties.features) {
      conditions.push(
        sql`${properties.features}->>'propertyType' = ${propertyType}`
      );
    }
    
    // Only active properties
    conditions.push(eq(properties.isActive, true));
    
    return conditions;
  }

  private addLocationSimilarityConditions(
    city: string | undefined, 
    location: string | undefined, 
    conditions: SQL[]
  ): void {
    const locationToMatch = city || location;
    if (locationToMatch) {
      const cityName = locationToMatch.split(',')[0]?.trim();
      if (cityName) {
        conditions.push(like(properties.location, `%${cityName}%`));
      }
    }
  }

  private addPriceSimilarityConditions(
    price: number | undefined,
    minPrice: number | undefined,
    maxPrice: number | undefined,
    conditions: SQL[]
  ): void {
    if (price && !minPrice && !maxPrice) {
      const priceNum = parseFloat(price.toString());
      if (!isNaN(priceNum)) {
        const priceRange = priceNum * 0.2; // 20% range
        const minPriceCondition = gte(properties.price, (priceNum - priceRange).toString());
        const maxPriceCondition = lte(properties.price, (priceNum + priceRange).toString());
        const combinedCondition = and(minPriceCondition, maxPriceCondition);
        if (combinedCondition) {
          conditions.push(combinedCondition);
        }
      }
    } else {
      if (minPrice) {
        conditions.push(gte(properties.price, minPrice.toString()));
      }
      if (maxPrice) {
        conditions.push(lte(properties.price, maxPrice.toString()));
      }
    }
  }

  private logSimilarityQueryPerformance(params: SimilarPropertyParams, resultCount: number): void {
    const locationInfo = params.city || params.location || 'any location';
    const priceInfo = params.price ? params.price.toString() : `${params.minPrice || 'min'}-${params.maxPrice || 'max'}`;
    // eslint-disable-next-line no-console
    console.log(`[PERF] Similar properties query returned ${resultCount} results for location: ${locationInfo}, price: ${priceInfo}, excludeId: ${params.excludeId || 'none'}`);
  }

  async create(propertyData: PropertyData): Promise<Property> {
    try {
      const db = await this.getDatabaseConnection();
      
      const validVerificationStatus = ['verified', 'pending', 'unverified', 'draft'].includes(propertyData.verificationStatus || '') 
        ? propertyData.verificationStatus as 'verified' | 'pending' | 'unverified' | 'draft'
        : 'pending';

      const [newProperty] = await db.insert(properties)
        .values({
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price.toString(),
          location: propertyData.location,
          address: propertyData.address || null,
          coordinates: propertyData.coordinates || null,
          imageUrls: propertyData.images || [],
          verificationStatus: validVerificationStatus,
          features: propertyData.features || null,
          ownerId: propertyData.ownerId,
          isActive: true,
          isFeatured: false
        } as any)
        .returning();

      if (!newProperty) {
        throw new Error('Failed to create property');
      }

      return { 
        ...newProperty, 
        features: newProperty.features as Record<string, unknown> | undefined,
        landVerification: {
          sessionId: null,
          status: null,
          overallRiskScore: null,
          riskLevel: null,
          confidence: null,
          lastUpdated: null,
        }
      } as Property;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<PropertyData>): Promise<Property> {
    try {
      const db = await this.getDatabaseConnection();
      
      // Prepare update data with proper type handling
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.price) updateData.price = updates.price.toString();
      if (updates.location) updateData.location = updates.location;
      if (updates.address) updateData.address = updates.address;
      if (updates.coordinates) updateData.coordinates = updates.coordinates;
      if (updates.images) updateData.imageUrls = updates.images;
      if (updates.features) updateData.features = updates.features;
      if (updates.ownerId) updateData.ownerId = updates.ownerId;
      
      // Handle verification status with proper validation
      if (updates.verificationStatus && ['verified', 'pending', 'unverified', 'draft'].includes(updates.verificationStatus)) {
        updateData.verificationStatus = updates.verificationStatus as 'verified' | 'pending' | 'unverified' | 'draft';
      }

      const [updatedProperty] = await db.update(properties)
        .set(updateData)
        .where(eq(properties.id, parseInt(id)))
        .returning();

      if (!updatedProperty) {
        throw new Error('Failed to update property');
      }

      return { 
        ...updatedProperty, 
        features: updatedProperty.features as Record<string, unknown> | undefined,
        landVerification: {
          sessionId: null,
          status: null,
          overallRiskScore: null,
          riskLevel: null,
          confidence: null,
          lastUpdated: null,
        }
      } as Property;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = await this.getDatabaseConnection();
      
      await db.delete(properties)
        .where(eq(properties.id, parseInt(id)));
      
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Helper methods
  private getSortColumn(sortBy: string) {
    switch (sortBy) {
      case 'price':
        return properties.price;
      case 'date':
        return properties.createdAt;
      case 'landVerification':
        return landVerificationSessions.overallRiskScore;
      case 'trustScore':
        return properties.createdAt; // Fallback
      default:
        return properties.createdAt;
    }
  }

  // Mock data method with improved type safety and proper optional handling
  private getMockPropertiesWithFilters(filters: PropertyFilters): PaginatedResult<Property> {
    const mockProperties: Property[] = [
      {
        id: 1,
        title: "Modern 3-Bedroom Apartment in Westlands", // cspell:ignore-word Westlands
        description: "Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.",
        price: "15000000",
        location: "Westlands, Nairobi", // cspell:ignore-word Westlands
        address: "Westlands Road, Nairobi, Kenya", // cspell:ignore-word Westlands
        coordinates: { lat: -1.2676, lng: 36.8108 },
        imageUrls: [
          "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg", // cspell:ignore-word cytonn
          "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Apartment",
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "24/7 Security", "Elevator"],
          petFriendly: false,
          furnished: true,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: new Date(),
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: {
          sessionId: null,
          status: null,
          overallRiskScore: null,
          riskLevel: null,
          confidence: null,
          lastUpdated: null,
        }
      }
    ];

    return this.applyFiltersToMockData(mockProperties, filters);
  }

  private applyFiltersToMockData(mockProperties: Property[], filters: PropertyFilters): PaginatedResult<Property> {
    let filtered = mockProperties;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }

    if (filters.location) {
      filtered = filtered.filter(property =>
        property.location.toLowerCase().includes(filters.location?.toLowerCase() || '')
      );
    }

    if (filters.propertyType) {
      filtered = this.filterByPropertyType(filtered, filters.propertyType);
    }

    if (filters.bedrooms !== undefined) {
      filtered = this.filterByBedrooms(filtered, filters.bedrooms);
    }

    if (filters.bathrooms !== undefined) {
      filtered = this.filterByBathrooms(filtered, filters.bathrooms);
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filtered = this.filterByPriceRange(filtered, filters.priceMin, filters.priceMax);
    }

    return this.paginateResults(filtered, filters.page || 1, filters.limit || 10);
  }

  private filterByPropertyType(properties: Property[], targetType: string): Property[] {
    const normalizedTarget = targetType.toLowerCase();
    return properties.filter(property => {
      const features = property.features as { propertyType: string } | undefined;
      if (!features?.propertyType) return false;
      
      const propType = features.propertyType.toLowerCase();
      
      if (normalizedTarget === 'residential') {
        return ['apartment', 'house', 'condo', 'townhouse'].includes(propType);
      } else if (normalizedTarget === 'commercial') {
        return ['office', 'retail', 'warehouse', 'industrial'].includes(propType);
      } else if (normalizedTarget === 'land') {
        return propType.includes('land');
      } else {
        return propType === normalizedTarget;
      }
    });
  }

  private filterByBedrooms(properties: Property[], minBedrooms: number): Property[] {
    return properties.filter(property => {
      const features = property.features as { bedrooms: number } | undefined;
      return features?.bedrooms !== undefined && features.bedrooms >= minBedrooms;
    });
  }

  private filterByBathrooms(properties: Property[], minBathrooms: number): Property[] {
    return properties.filter(property => {
      const features = property.features as { bathrooms: number } | undefined;
      return features?.bathrooms !== undefined && features.bathrooms >= minBathrooms;
    });
  }

  private filterByPriceRange(properties: Property[], minPrice?: number, maxPrice?: number): Property[] {
    return properties.filter(property => {
      const price = parseInt(property.price);
      const meetsMin = minPrice === undefined || price >= minPrice;
      const meetsMax = maxPrice === undefined || price <= maxPrice;
      return meetsMin && meetsMax;
    });
  }

  private paginateResults(data: Property[], page: number, limit: number): PaginatedResult<Property> {
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total: data.length,
      page,
      limit,
      hasNext: page * limit < data.length,
      hasPrev: page > 1,
    };
  }


}