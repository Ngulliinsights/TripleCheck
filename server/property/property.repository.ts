import { Property } from "@shared/schema";
import { db } from '../infrastructure/database/connection';
import { properties, landVerificationSessions, verificationLayers } from '../../src/shared/schema';
import { eq, and, desc, asc, sql, like, gte, lte, inArray } from 'drizzle-orm';

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
        const property = result.property;
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
      const transformedData = await Promise.all(results.map(async (result) => {
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

      return transformedData;
    } catch (error) {
      console.error('Error in findByOwner:', error);
      return [];
    }
  }

  async create(propertyData: any) {
    try {
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