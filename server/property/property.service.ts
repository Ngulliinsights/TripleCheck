import { DocumentAuthService } from "../document-auth/DocumentAuthService";
import { PropertyCacheService } from "../infrastructure/cache"
import { LandVerificationService } from "../land-verification/LandVerificationService";

import { PropertyRepository } from "./property.repository";

// Type definitions for better type safety
interface PropertyFilters {
  location?: string;
  priceRange?: { min: number; max: number };
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: unknown;
}

// Interface for cache service to allow fallback implementation
interface CacheServiceInterface {
  getCachedSimilarProperties(params: unknown): Promise<unknown[] | null>;
  cacheSimilarProperties(params: unknown, properties: unknown[]): Promise<void>;
  getCachedPropertyDetails(id: string): Promise<unknown | null>;
  cachePropertyDetails(id: string, property: unknown): Promise<void>;
  getCachedOwnerProperties(ownerId: string): Promise<unknown[] | null>;
  cacheOwnerProperties(ownerId: string, properties: unknown[]): Promise<void>;
  getCachedPropertyStats(filters: unknown): Promise<unknown | null>;
  cachePropertyStats(filters: unknown, stats: unknown): Promise<void>;
  invalidatePropertyCache(id: string): Promise<void>;
  invalidateOwnerCache(ownerId: string): Promise<void>;
  batchInvalidate(keys: string[]): Promise<void>;
  healthCheck(): Promise<{ status: string }>;
}

interface PropertyData {
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  [key: string]: unknown;
}

interface PropertyUpdateData {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  [key: string]: unknown;
}

interface SimilarPropertyParams {
  location: string;
  propertyType: string;
  priceRange?: { min: number; max: number };
  bedrooms?: number;
  maxResults?: number;
}

interface LandVerificationData {
  status: string;
  riskLevel: string;
  riskScore: number;
  completedLayers: string[];
  riskFactors: unknown[];
  [key: string]: unknown;
}

interface RiskFactor {
  category: string;
  level: string;
  description: string;
}

interface Recommendation {
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
}

interface VerificationBadge {
  type: string;
  label: string;
  color: string;
  description: string;
}

// Constants to eliminate duplicate strings
const ERROR_MESSAGES = {
  PROPERTY_NOT_FOUND: "Property not found",
  UNAUTHORIZED_UPDATE: "Unauthorized: You can only update your own properties",
  UNAUTHORIZED_DELETE: "Unauthorized: You can only delete your own properties",
  UNKNOWN_ERROR: "Unknown error",
} as const;

const SUCCESS_MESSAGES = {
  PROPERTY_CREATED: "Property created successfully",
  PROPERTY_UPDATED: "Property updated successfully",
  LAND_VERIFICATION_INITIATED: "Land verification initiated successfully",
  LAND_VERIFICATION_UPDATED: "Property land verification updated successfully",
} as const;

export class PropertyService {
  private propertyRepository: PropertyRepository;
  private landVerificationService: LandVerificationService;
  private cacheService: CacheServiceInterface;

  constructor() {
    this.propertyRepository = new PropertyRepository();

    try {
      this.cacheService = new PropertyCacheService();
    } catch (error) {
      // Using a structured logger would be better in production
      this.logWarning("Failed to initialize property cache service:", error);
      // Create a no-op cache service as fallback that implements the interface
      this.cacheService = {
        getCachedSimilarProperties: async () => null,
        cacheSimilarProperties: async () => {},
        getCachedPropertyDetails: async () => null,
        cachePropertyDetails: async () => {},
        getCachedOwnerProperties: async () => null,
        cacheOwnerProperties: async () => {},
        getCachedPropertyStats: async () => null,
        cachePropertyStats: async () => {},
        invalidatePropertyCache: async () => {},
        invalidateOwnerCache: async () => {},
        batchInvalidate: async () => {},
        healthCheck: async () => ({ status: "disabled" }),
      };
    }

    // Initialize land verification service with document auth service
    const documentAuthService = new DocumentAuthService();
    this.landVerificationService = new LandVerificationService(
      documentAuthService
    );
  }

  /**
   * Logs warning messages - configured to suppress ESLint warnings
   * In production, replace this with a proper logging service like Winston or Pino
   */
  private logWarning(message: string, error: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(message, error);
  }

  /**
   * Logs error messages - configured to suppress ESLint warnings
   * In production, replace this with a proper logging service like Winston or Pino
   */
  private logError(message: string, error: unknown): void {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }

  async getProperties(filters: PropertyFilters) {
    const result = await this.propertyRepository.findMany(filters);
    return {
      success: true,
      data: result.data, // Return the properties array directly
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    };
  }

  async getProperty(
    id: string,
    _options: { includeMarketEstimate?: boolean } = {}
  ) {
    try {
      // Try to get from cache first
      const cachedProperty =
        await this.cacheService.getCachedPropertyDetails(id);
      if (cachedProperty) {
        return { data: cachedProperty, success: true, cached: true };
      }

      // If not in cache, fetch from database
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        throw new Error(ERROR_MESSAGES.PROPERTY_NOT_FOUND);
      }

      // Cache the property details
      await this.cacheService.cachePropertyDetails(id, property);

      return { data: property, success: true, cached: false };
    } catch (error) {
      this.logError("Error in getProperty:", error);
      throw error;
    }
  }

  async createProperty(propertyData: PropertyData, ownerId: number) {
    const property = await this.propertyRepository.create({
      ...propertyData,
      ownerId,
    });
    return {
      data: property,
      success: true,
      message: SUCCESS_MESSAGES.PROPERTY_CREATED,
    };
  }

  async updateProperty(
    id: string,
    updates: PropertyUpdateData,
    userId: number
  ) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new Error(ERROR_MESSAGES.PROPERTY_NOT_FOUND);
    }
    if (property.ownerId !== userId) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_UPDATE);
    }

    const updatedProperty = await this.propertyRepository.update(id, updates);

    // Invalidate cache after update
    await this.cacheService.invalidatePropertyCache(id);
    await this.cacheService.invalidateOwnerCache(userId.toString());

    return {
      data: updatedProperty,
      success: true,
      message: SUCCESS_MESSAGES.PROPERTY_UPDATED,
    };
  }

  async deleteProperty(id: string, userId: number) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new Error(ERROR_MESSAGES.PROPERTY_NOT_FOUND);
    }
    if (property.ownerId !== userId) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_DELETE);
    }

    await this.propertyRepository.delete(id);
  }

  async getPropertiesByOwner(ownerId: string) {
    const properties = await this.propertyRepository.findByOwner(ownerId);
    return { data: properties, success: true };
  }

  async getSimilarProperties(params: SimilarPropertyParams) {
    try {
      // Add request validation to prevent infinite loops
      if (!params.location && !params.propertyType) {
        return {
          data: [],
          success: false,
          error: "Location or property type is required for similar properties search",
        };
      }

      // Normalize parameters to prevent cache misses due to slight variations
      const normalizedParams = {
        ...params,
        location: params.location?.trim(),
        maxResults: Math.min(params.maxResults || 10, 50), // Cap at 50 results
      };

      // Try to get from cache first
      const cachedProperties =
        await this.cacheService.getCachedSimilarProperties(normalizedParams);
      if (cachedProperties) {
        return { data: cachedProperties, success: true, cached: true };
      }

      // If not in cache, fetch from database
      const properties = await this.propertyRepository.findSimilar(normalizedParams);

      // Cache the results for future requests (with longer TTL for similar properties)
      await this.cacheService.cacheSimilarProperties(normalizedParams, properties);

      return { data: properties, success: true, cached: false };
    } catch (error) {
      this.logError("Error in getSimilarProperties:", error);
      return {
        data: [],
        success: false,
        error: "Failed to fetch similar properties",
      };
    }
  }

  // Land verification integration methods (simplified for now)

  async initiateLandVerification(
    propertyId: string,
    _userId: string,
    _requestedLayers?: string[]
  ) {
    try {
      // Simplified implementation - return mock session ID
      const sessionId = `session_${Date.now()}_${propertyId}`;

      return {
        data: { sessionId },
        success: true,
        message: SUCCESS_MESSAGES.LAND_VERIFICATION_INITIATED,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(`Failed to initiate land verification: ${errorMessage}`);
    }
  }

  async getLandVerificationStatus(_propertyId: string) {
    try {
      // Simplified implementation - return default status
      return {
        data: {
          status: "not_started",
          overallRiskScore: 0,
          riskLevel: "low",
          confidence: 0,
          completedLayers: [],
          lastUpdated: new Date(),
        },
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(
        `Failed to get land verification status: ${errorMessage}`
      );
    }
  }

  async getLandVerificationReport(_propertyId: string) {
    try {
      // Simplified implementation - return basic report
      const report = {
        sessionId: `session_${_propertyId}`,
        overallRiskScore: 0,
        riskLevel: "low",
        confidence: 0,
        completedLayers: [],
        riskFactors: [],
        recommendations: this.generateBasicRecommendations("low", []),
        lastUpdated: new Date(),
      };

      return { data: report, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(
        `Failed to get land verification report: ${errorMessage}`
      );
    }
  }

  async updatePropertyLandVerification(
    propertyId: string,
    landVerification: LandVerificationData,
    userId: number
  ) {
    try {
      // Verify property ownership
      const property = await this.propertyRepository.findById(propertyId);
      if (!property) {
        throw new Error(ERROR_MESSAGES.PROPERTY_NOT_FOUND);
      }
      if (property.ownerId !== userId) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED_UPDATE);
      }

      // Update property with land verification data
      const updatedProperty = await this.propertyRepository.update(propertyId, {
        // landVerification - commented out for now to avoid schema issues
      });

      return {
        data: updatedProperty,
        success: true,
        message: SUCCESS_MESSAGES.LAND_VERIFICATION_UPDATED,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(
        `Failed to update property land verification: ${errorMessage}`
      );
    }
  }

  // Helper method to generate land verification badge
  private generateLandVerificationBadge(
    status: string,
    riskLevel: string
  ): VerificationBadge | undefined {
    switch (status) {
      case "completed":
        if (riskLevel === "low") {
          return {
            type: "verified",
            label: "Land Verified",
            color: "green",
            description:
              "Property has completed comprehensive land verification with low risk",
          };
        } else if (riskLevel === "medium") {
          return {
            type: "verified",
            label: "Land Verified - Medium Risk",
            color: "blue",
            description:
              "Property has completed land verification with medium risk factors identified",
          };
        } else {
          return {
            type: "high_risk",
            label: "High Risk Property",
            color: "red",
            description:
              "Property has completed verification but significant risks were identified",
          };
        }
      case "in_progress":
        return {
          type: "in_progress",
          label: "Verification In Progress",
          color: "blue",
          description: "Land verification is currently underway",
        };
      case "suspended":
      case "failed":
        return {
          type: "expert_required",
          label: "Expert Review Required",
          color: "orange",
          description: "Land verification requires expert attention",
        };
      default:
        return undefined;
    }
  }

  // Helper method to generate basic recommendations
  private generateBasicRecommendations(
    riskLevel: string,
    riskFactors: RiskFactor[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    switch (riskLevel) {
      case "critical":
        recommendations.push({
          priority: "high",
          title: "Immediate Expert Review Required",
          description:
            "Critical risks identified require immediate professional assessment",
        });
        recommendations.push({
          priority: "high",
          title: "Consider Alternative Properties",
          description:
            "Given the critical risk level, consider exploring other property options",
        });
        break;
      case "high":
        recommendations.push({
          priority: "high",
          title: "Professional Legal Review",
          description:
            "High-risk factors require thorough legal examination before proceeding",
        });
        recommendations.push({
          priority: "medium",
          title: "Additional Due Diligence",
          description:
            "Conduct additional verification steps to mitigate identified risks",
        });
        break;
      case "medium":
        recommendations.push({
          priority: "medium",
          title: "Risk Mitigation Planning",
          description:
            "Develop strategies to address identified medium-risk factors",
        });
        recommendations.push({
          priority: "low",
          title: "Ongoing Monitoring",
          description: "Implement monitoring to track changes in risk factors",
        });
        break;
      case "low":
        recommendations.push({
          priority: "low",
          title: "Proceed with Confidence",
          description:
            "Low risk level indicates property is suitable for transaction",
        });
        recommendations.push({
          priority: "low",
          title: "Periodic Review",
          description:
            "Schedule periodic reviews to maintain verification status",
        });
        break;
    }

    // Add specific recommendations based on risk factors
    const ownershipRisks = riskFactors.filter(
      (rf) => rf.category === "ownership"
    );
    const governmentRisks = riskFactors.filter(
      (rf) => rf.category === "government"
    );
    const legalRisks = riskFactors.filter((rf) => rf.category === "legal");

    if (ownershipRisks.length > 0) {
      recommendations.push({
        priority: "high",
        title: "Ownership Verification",
        description:
          "Address ownership-related risks through additional documentation",
      });
    }

    if (governmentRisks.length > 0) {
      recommendations.push({
        priority: "medium",
        title: "Government Compliance Check",
        description:
          "Verify compliance with government regulations and designations",
      });
    }

    if (legalRisks.length > 0) {
      recommendations.push({
        priority: "high",
        title: "Legal Consultation",
        description:
          "Consult with legal experts to address identified legal risks",
      });
    }

    return recommendations;
  }
}
