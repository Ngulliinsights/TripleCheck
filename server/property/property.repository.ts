import { Property } from "@shared/schema";
import { eq, and, desc, asc, sql, like, gte, lte, inArray } from 'drizzle-orm';

import { properties, landVerificationSessions, verificationLayers } from '../../src/shared/schema';
import { getDatabase, isDatabaseAvailable } from '../infrastructure/database/init';
// Create a simple query tracker as fallback
const queryMonitor = {
  trackQuery: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`[QUERY] Slow query detected: ${name} took ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[QUERY] Query failed: ${name} after ${duration}ms`, error);
      throw error;
    }
  }
};

export class PropertyRepository {
  async findMany(filters: any) {
    try {
      const {
        query,
        location,
        priceMin,
        priceMax,
        propertyType,
        bedrooms,
        bathrooms,
        areaMin,
        areaMax,
        landVerified,
        landRiskLevel,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Check if database is available
      if (!isDatabaseAvailable()) {
        console.log('Database not available, returning mock data');
        return this.getMockPropertiesWithFilters(filters);
      }

      // First check if database has any properties
      const db = getDatabase();
      const hasProperties = await db.select().from(properties).limit(1);
      
      // If no properties in database, return mock data
      if (hasProperties.length === 0) {
        console.log('No properties found in database, returning mock data');
        return this.getMockPropertiesWithFilters(filters);
      }
      let queryBuilder = db.select({
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
      const conditions = [];

      if (query) {
        conditions.push(
          sql`(${properties.title} ILIKE ${`%${query}%`} OR ${properties.description} ILIKE ${`%${query}%`})`
        );
      }

      if (location) {
        conditions.push(like(properties.location, `%${location}%`));
      }

      if (priceMin) {
        conditions.push(gte(properties.price, priceMin.toString()));
      }

      if (priceMax) {
        conditions.push(lte(properties.price, priceMax.toString()));
      }

      if (propertyType && properties.features) {
        conditions.push(
          sql`${properties.features}->>'propertyType' = ${propertyType}`
        );
      }

      if (bedrooms && properties.features) {
        conditions.push(
          sql`(${properties.features}->>'bedrooms')::int >= ${bedrooms}`
        );
      }

      if (bathrooms && properties.features) {
        conditions.push(
          sql`(${properties.features}->>'bathrooms')::int >= ${bathrooms}`
        );
      }

      if (areaMin && properties.features) {
        conditions.push(
          sql`(${properties.features}->>'squareFeet')::int >= ${areaMin}`
        );
      }

      if (areaMax && properties.features) {
        conditions.push(
          sql`(${properties.features}->>'squareFeet')::int <= ${areaMax}`
        );
      }

      if (landVerified === true) {
        conditions.push(eq(landVerificationSessions.status, 'completed'));
      }

      if (landRiskLevel) {
        conditions.push(eq(landVerificationSessions.riskLevel, landRiskLevel));
      }

      // Apply conditions
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = this.getSortColumn(sortBy);
      const sortDirection = sortOrder === 'asc' ? asc : desc;
      queryBuilder = queryBuilder.orderBy(sortDirection(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.limit(limit).offset(offset);

      const results = await queryBuilder;

      // Get total count for pagination
      let countQuery = db.select({ count: sql<number>`count(*)` })
        .from(properties)
        .leftJoin(
          landVerificationSessions,
          eq(properties.id, landVerificationSessions.propertyId)
        );

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const [{ count: total }] = await countQuery;

      // Transform results to include land verification data
      const transformedData = await Promise.all(results.map(async (result) => {
        const {property} = result;
        let landVerification = null;

        if (result.landVerification && result.landVerification.sessionId) {
          // Get completed layers for this session
          const layers = await db.select()
            .from(verificationLayers)
            .where(eq(verificationLayers.sessionId, result.landVerification.sessionId));

          const completedLayers = layers
            .filter(layer => layer.status === 'completed')
            .map(layer => layer.layerType);

          landVerification = {
            sessionId: result.landVerification.sessionId.toString(),
            status: result.landVerification.status,
            overallRiskScore: result.landVerification.overallRiskScore,
            riskLevel: result.landVerification.riskLevel,
            confidence: parseFloat(result.landVerification.confidence.toString()),
            completedLayers,
            lastUpdated: result.landVerification.lastUpdated,
            badge: this.generateLandVerificationBadge(
              result.landVerification.status,
              result.landVerification.riskLevel
            )
          };
        }

        return {
          ...property,
          landVerification
        };
      }));

      return {
        data: transformedData,
        total,
        page,
        limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
    } catch (error) {
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

  async findById(id: string): Promise<Property | null> {
    try {
      const db = getDatabase();
      const [result] = await db.select({
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

      if (!result) {
        return null;
      }

      let landVerification = null;
      if (result.landVerification && result.landVerification.sessionId) {
        // Get completed layers for this session
        const layers = await db.select()
          .from(verificationLayers)
          .where(eq(verificationLayers.sessionId, result.landVerification.sessionId));

        const completedLayers = layers
          .filter(layer => layer.status === 'completed')
          .map(layer => layer.layerType);

        landVerification = {
          sessionId: result.landVerification.sessionId.toString(),
          status: result.landVerification.status,
          overallRiskScore: result.landVerification.overallRiskScore,
          riskLevel: result.landVerification.riskLevel,
          confidence: parseFloat(result.landVerification.confidence.toString()),
          completedLayers,
          lastUpdated: result.landVerification.lastUpdated,
          badge: this.generateLandVerificationBadge(
            result.landVerification.status,
            result.landVerification.riskLevel
          )
        };
      }

      return {
        ...result.property,
        landVerification
      } as Property;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findByOwner(ownerId: string) {
    try {
      const db = getDatabase();
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

      // Transform results to include land verification data
      return await Promise.all(results.map(async (result) => {
        let landVerification = null;

        if (result.landVerification && result.landVerification.sessionId) {
          // Get completed layers for this session
          const layers = await db.select()
            .from(verificationLayers)
            .where(eq(verificationLayers.sessionId, result.landVerification.sessionId));

          const completedLayers = layers
            .filter(layer => layer.status === 'completed')
            .map(layer => layer.layerType);

          landVerification = {
            sessionId: result.landVerification.sessionId.toString(),
            status: result.landVerification.status,
            overallRiskScore: result.landVerification.overallRiskScore,
            riskLevel: result.landVerification.riskLevel,
            confidence: parseFloat(result.landVerification.confidence.toString()),
            completedLayers,
            lastUpdated: result.landVerification.lastUpdated,
            badge: this.generateLandVerificationBadge(
              result.landVerification.status,
              result.landVerification.riskLevel
            )
          };
        }

        return {
          ...result.property,
          landVerification
        };
      }));
    } catch (error) {
      console.error('Error in findByOwner:', error);
      return [];
    }
  }

  async findSimilar(params: any) {
    return await queryMonitor.trackQuery(
      'findSimilar',
      async () => {
        const { 
          propertyType, 
          city, 
          location, // Handle both city and location parameters
          price, // Handle exact price parameter
          minPrice, 
          maxPrice, 
          limit = 10, 
          excludeId 
        } = params;
        
        const conditions = [];
        
        // Exclude the current property if specified
        if (excludeId) {
          conditions.push(sql`${properties.id} != ${parseInt(excludeId)}`);
        }
        
        // Handle location matching - prioritize city over location, and make it flexible
        const locationToMatch = city || location;
        if (locationToMatch) {
          // Extract city name from full location string for better matching
          const cityName = locationToMatch.split(',')[0].trim();
          conditions.push(like(properties.location, `%${cityName}%`));
        }
        
        // Handle price matching - convert exact price to range for better results
        if (price && !minPrice && !maxPrice) {
          // Convert exact price to a reasonable range (±20%)
          const priceNum = parseFloat(price);
          const priceRange = priceNum * 0.2; // 20% range
          conditions.push(
            and(
              gte(properties.price, (priceNum - priceRange).toString()),
              lte(properties.price, (priceNum + priceRange).toString())
            )
          );
        } else if (minPrice && maxPrice) {
          conditions.push(
            and(
              gte(properties.price, minPrice.toString()),
              lte(properties.price, maxPrice.toString())
            )
          );
        } else if (minPrice) {
          conditions.push(gte(properties.price, minPrice.toString()));
        } else if (maxPrice) {
          conditions.push(lte(properties.price, maxPrice.toString()));
        }
        
        // Property type matching if available (optimized JSON query)
        if (propertyType && properties.features) {
          conditions.push(
            sql`${properties.features}->>'propertyType' = ${propertyType}`
          );
        }
        
        // Only active properties
        conditions.push(eq(properties.isActive, true));
        
        // Optimized query with proper ordering for consistent results
        const db = getDatabase();
        let queryBuilder = db.select({
          id: properties.id,
          title: properties.title,
          description: properties.description,
          price: properties.price,
          location: properties.location,
          address: properties.address,
          coordinates: properties.coordinates,
          imageUrls: properties.imageUrls,
          verificationStatus: properties.verificationStatus,
          features: properties.features,
          ownerId: properties.ownerId,
          viewCount: properties.viewCount,
          favoriteCount: properties.favoriteCount,
          isActive: properties.isActive,
          isFeatured: properties.isFeatured,
          availableFrom: properties.availableFrom,
          availableUntil: properties.availableUntil,
          createdAt: properties.createdAt,
          updatedAt: properties.updatedAt
        })
        .from(properties)
        .orderBy(desc(properties.isFeatured), desc(properties.createdAt)) // Featured first, then newest
        .limit(parseInt(limit));
        
        if (conditions.length > 0) {
          queryBuilder = queryBuilder.where(and(...conditions));
        }
        
        const results = await queryBuilder;
        
        // Log query performance in development with better debugging info
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PERF] Similar properties query returned ${results.length} results for location: ${locationToMatch}, price: ${price || `${minPrice}-${maxPrice}`}, excludeId: ${excludeId}`);
        }
        
        return results;
      }
    );
  }

  async create(propertyData: any) {
    try {
      const db = getDatabase();
      const [newProperty] = await db.insert(properties)
        .values({
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price.toString(),
          location: propertyData.location,
          address: propertyData.address,
          coordinates: propertyData.coordinates,
          imageUrls: propertyData.images || [],
          verificationStatus: propertyData.verificationStatus || 'pending',
          features: propertyData.features,
          ownerId: propertyData.ownerId,
          isActive: true,
          isFeatured: false
        })
        .returning();

      return newProperty;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  async update(id: string, updates: any) {
    try {
      const db = getDatabase();
      const [updatedProperty] = await db.update(properties)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(properties.id, parseInt(id)))
        .returning();

      return updatedProperty;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const db = getDatabase();
      await db.delete(properties)
        .where(eq(properties.id, parseInt(id)));
      return true;
    } catch (error) {
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
        // Assuming trust score is calculated or stored somewhere
        return properties.createdAt; // Fallback
      default:
        return properties.createdAt;
    }
  }

  private getMockPropertiesWithFilters(filters: any) {
    const mockProperties = [
      {
        id: 1,
        title: "Modern 3-Bedroom Apartment in Westlands",
        description: "Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.",
        price: "15000000",
        location: "Westlands, Nairobi",
        address: "Westlands Road, Nairobi, Kenya",
        coordinates: { lat: -1.2676, lng: 36.8108 },
        imageUrls: [
          "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
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
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      {
        id: 2,
        title: "Luxury Villa in Karen",
        description: "Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.",
        price: "45000000",
        location: "Karen, Nairobi",
        address: "Karen Road, Nairobi, Kenya",
        coordinates: { lat: -1.3197, lng: 36.7076 },
        imageUrls: [
          "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
          "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "House",
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 3500,
          parkingSpaces: 3,
          yearBuilt: 2018,
          amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Generator"],
          petFriendly: true,
          furnished: false,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      {
        id: 3,
        title: "Elegant Penthouse in Kilimani",
        description: "Stunning penthouse with panoramic city views and luxury finishes. Features premium amenities and modern design.",
        price: "32000000",
        location: "Kilimani, Nairobi",
        address: "Argwings Kodhek Road, Kilimani, Nairobi, Kenya",
        coordinates: { lat: -1.2921, lng: 36.7833 },
        imageUrls: [
          "/assets/Residential/joel-filipe-RFDP7_80v5A-unsplash.jpg",
          "/assets/Residential/krzysztof-hepner-V7Q0Oh3Az-c-unsplash.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Apartment",
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2800,
          parkingSpaces: 2,
          yearBuilt: 2019,
          amenities: ["Rooftop Terrace", "Gym", "Concierge", "Wine Cellar"],
          petFriendly: true,
          furnished: true,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      {
        id: 4,
        title: "Cozy Family Home in Kileleshwa",
        description: "Perfect family home with modern amenities and great location. Ideal for young families starting their journey.",
        price: "18500000",
        location: "Kileleshwa, Nairobi",
        address: "Kileleshwa Road, Nairobi, Kenya",
        coordinates: { lat: -1.2833, lng: 36.7833 },
        imageUrls: [
          "/assets/Residential/jason-briscoe-AQl-J19ocWE-unsplash.jpg",
          "/assets/Residential/rebecca-chandler-z6Yn9hhlrJw-unsplash.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "House",
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1450,
          parkingSpaces: 2,
          yearBuilt: 2021,
          amenities: ["Garden", "Security", "Backup Generator", "Modern Kitchen"],
          petFriendly: true,
          furnished: false,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: false,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      // Commercial Properties
      {
        id: 5,
        title: "Modern Office Space in Westlands",
        description: "Premium office space with modern amenities, perfect for growing businesses. Features open floor plan and excellent connectivity.",
        price: "25000000",
        location: "Westlands, Nairobi",
        address: "Westlands Road, Nairobi, Kenya",
        coordinates: { lat: -1.2676, lng: 36.8108 },
        imageUrls: [
          "/assets/Commercial/office-1.jpg",
          "/assets/Commercial/office-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Office",
          size: 2500,
          floors: 3,
          parkingSpaces: 15,
          yearBuilt: 2019,
          amenities: ["High-Speed Internet", "Conference Rooms", "Reception Area", "24/7 Security"],
          airConditioning: true,
          elevator: true,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      {
        id: 6,
        title: "Retail Space in Sarit Centre",
        description: "Prime retail location with high foot traffic. Perfect for fashion, electronics, or food businesses.",
        price: "18000000",
        location: "Westlands, Nairobi",
        address: "Sarit Centre, Westlands, Nairobi, Kenya",
        coordinates: { lat: -1.2676, lng: 36.8108 },
        imageUrls: [
          "/assets/Commercial/retail-1.jpg",
          "/assets/Commercial/retail-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Retail",
          size: 800,
          floors: 1,
          parkingSpaces: 5,
          yearBuilt: 2015,
          amenities: ["Display Windows", "Storage Area", "Customer Parking", "Mall Security"],
          airConditioning: true,
          elevator: false,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: false,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      {
        id: 7,
        title: "Industrial Warehouse in Industrial Area",
        description: "Large warehouse facility with loading docks and ample storage space. Ideal for distribution and manufacturing.",
        price: "35000000",
        location: "Industrial Area, Nairobi",
        address: "Enterprise Road, Industrial Area, Nairobi, Kenya",
        coordinates: { lat: -1.3197, lng: 36.8500 },
        imageUrls: [
          "/assets/Commercial/warehouse-1.jpg",
          "/assets/Commercial/warehouse-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Warehouse",
          size: 5000,
          floors: 1,
          parkingSpaces: 20,
          yearBuilt: 2017,
          amenities: ["Loading Docks", "High Ceiling", "Security Fence", "Office Space"],
          airConditioning: false,
          elevator: false,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      },
      // Land Properties
      {
        id: 8,
        title: "Prime Residential Plot in Runda",
        description: "Excellent residential plot in prestigious Runda estate. Perfect for building your dream home with all utilities available.",
        price: "12000000",
        location: "Runda, Nairobi",
        address: "Runda Estate, Nairobi, Kenya",
        coordinates: { lat: -1.2167, lng: 36.7833 },
        imageUrls: [
          "/assets/Land/residential-plot-1.jpg",
          "/assets/Land/residential-plot-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Residential Land",
          size: "0.5 acres",
          titleDeedStatus: "available",
          soilType: "Clay loam",
          zoning: "Residential",
          waterAccess: true,
          roadAccess: true,
          electricityAccess: true,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: true,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: {
          sessionId: "1",
          status: "completed",
          overallRiskScore: 15,
          riskLevel: "low",
          confidence: 0.95,
          completedLayers: ["title_deed", "survey", "environmental", "legal"],
          lastUpdated: new Date(),
          badge: {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          }
        }
      },
      {
        id: 9,
        title: "Commercial Plot in Kilimani",
        description: "Strategic commercial plot suitable for office building or mixed-use development. Great investment opportunity.",
        price: "28000000",
        location: "Kilimani, Nairobi",
        address: "Argwings Kodhek Road, Kilimani, Nairobi, Kenya",
        coordinates: { lat: -1.2921, lng: 36.7833 },
        imageUrls: [
          "/assets/Land/commercial-plot-1.jpg",
          "/assets/Land/commercial-plot-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Commercial Land",
          size: "0.25 acres",
          titleDeedStatus: "available",
          soilType: "Sandy clay",
          zoning: "Commercial",
          waterAccess: true,
          roadAccess: true,
          electricityAccess: true,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: false,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: {
          sessionId: "2",
          status: "completed",
          overallRiskScore: 25,
          riskLevel: "medium",
          confidence: 0.88,
          completedLayers: ["title_deed", "survey", "legal"],
          lastUpdated: new Date(),
          badge: {
            type: 'verified',
            label: 'Land Verified - Medium Risk',
            color: 'blue',
            description: 'Property has completed land verification with medium risk factors identified'
          }
        }
      },
      {
        id: 10,
        title: "Agricultural Land in Kiambu",
        description: "Fertile agricultural land perfect for farming or future development. Good access roads and water availability.",
        price: "8000000",
        location: "Kiambu, Kenya",
        address: "Kiambu Road, Kiambu, Kenya",
        coordinates: { lat: -1.1667, lng: 36.8333 },
        imageUrls: [
          "/assets/Land/agricultural-1.jpg",
          "/assets/Land/agricultural-2.jpg"
        ],
        verificationStatus: "verified",
        features: {
          propertyType: "Agricultural Land",
          size: "2 acres",
          titleDeedStatus: "available",
          soilType: "Red volcanic",
          zoning: "Agricultural",
          waterAccess: true,
          roadAccess: true,
          electricityAccess: false,
        },
        ownerId: 1,
        viewCount: 0,
        favoriteCount: 0,
        isActive: true,
        isFeatured: false,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        landVerification: null
      }
    ];

    // Apply filters to mock data
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
        property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.propertyType) {
      const targetType = filters.propertyType.toLowerCase();
      filtered = filtered.filter(property => {
        const propType = property.features.propertyType.toLowerCase();
        
        // Handle different property type mappings
        if (targetType === 'residential') {
          return propType === 'apartment' || propType === 'house' || propType === 'condo' || propType === 'townhouse';
        } else if (targetType === 'commercial') {
          return propType === 'office' || propType === 'retail' || propType === 'warehouse' || propType === 'industrial';
        } else if (targetType === 'land') {
          return propType.includes('land');
        } else {
          // Exact match for specific types
          return propType === targetType;
        }
      });
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(property =>
        property.features.bedrooms >= filters.bedrooms
      );
    }

    if (filters.bathrooms) {
      filtered = filtered.filter(property =>
        property.features.bathrooms >= filters.bathrooms
      );
    }

    if (filters.priceMin) {
      filtered = filtered.filter(property =>
        parseInt(property.price) >= filters.priceMin
      );
    }

    if (filters.priceMax) {
      filtered = filtered.filter(property =>
        parseInt(property.price) <= filters.priceMax
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const paginatedData = filtered.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      hasNext: page * limit < filtered.length,
      hasPrev: page > 1,
    };
  }

  private generateLandVerificationBadge(status: string, riskLevel: string) {
    switch (status) {
      case 'completed':
        if (riskLevel === 'low') {
          return {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          };
        } else if (riskLevel === 'medium') {
          return {
            type: 'verified',
            label: 'Land Verified - Medium Risk',
            color: 'blue',
            description: 'Property has completed land verification with medium risk factors identified'
          };
        } else {
          return {
            type: 'high_risk',
            label: 'High Risk Property',
            color: 'red',
            description: 'Property has completed verification but significant risks were identified'
          };
        }
      case 'in_progress':
        return {
          type: 'in_progress',
          label: 'Verification In Progress',
          color: 'blue',
          description: 'Land verification is currently underway'
        };
      case 'suspended':
      case 'failed':
        return {
          type: 'expert_required',
          label: 'Expert Review Required',
          color: 'orange',
          description: 'Land verification requires expert attention'
        };
      default:
        return undefined;
    }
  }
}