import { apiRequest } from "../../infrastructure/api/queryClient";
import { requestManager } from "../../infrastructure/api/request-manager";
import { ApiResponse, PaginatedResponse } from "../../shared/types/api.types";
import { PropertySearchParams, PropertySearchInput } from "../types/property.types";
import { Property } from "../../shared/types/property";

import { PropertyBusinessLogic } from "./property-validation";

const API_BASE = "/api/properties";

// Helper function to build search parameters
function buildSearchParams(params: PropertySearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams;
}

// Helper function to build request headers
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Enhanced property type with computed fields
type EnhancedProperty = Property & {
  calculatedScore: number;
  isFeatured: boolean;
  listingUrl: string;
  marketEstimate?: {
    estimatedValue: number;
    confidence: number;
    factors: string[];
  };
};

// Centralized error handling with consistent error messages
class PropertyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "PropertyApiError";
  }
}

// Helper function to handle API responses consistently with improved type safety
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PropertyApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
};

// Helper function to enhance property with business logic calculations
const enhanceProperty = (property: Property): EnhancedProperty => ({
  ...property,
  calculatedScore: PropertyBusinessLogic.calculatePropertyScore(property as any),
  isFeatured: PropertyBusinessLogic.isFeaturedProperty(property as any),
  listingUrl: PropertyBusinessLogic.generateListingUrl(property as any),
});

// Type guard to ensure API response data exists and is valid
const validateApiResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } => {
  return (
    response?.data !== undefined
  );
};

// Type guard for paginated response validation
const validatePaginatedResponse = <T>(
  response: PaginatedResponse<T>
): response is PaginatedResponse<T> & { data: T[] } => {
  return (
    response !== null && response !== undefined && Array.isArray(response.data)
  );
};

// Helper function to create type-safe empty paginated response
const createEmptyPaginatedResponse = <T>(): PaginatedResponse<T> => {
  // This approach ensures we match exactly what PaginatedResponse<T> expects
  // If PaginatedResponse has different structure, adjust this accordingly
  const emptyResponse: PaginatedResponse<T> = {
    data: [] as T[],
    // Include other properties that PaginatedResponse expects
    // Adjust these based on your actual PaginatedResponse type definition
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false, 
    hasPrev: false,
  } as PaginatedResponse<T>;

  return emptyResponse;
};

// Enhanced property API with improved error handling and performance optimizations
export const propertyApi = {
  // Get all properties with search and filters - optimized parameter handling
  getProperties: async (
    params: PropertySearchInput = {}
  ): Promise<PaginatedResponse<EnhancedProperty>> => {
    try {
      // Validate search parameters using business logic
      const validatedParams =
        PropertyBusinessLogic.validateSearchParams(params);

      // Build search parameters efficiently
      const searchParams = buildSearchParams(validatedParams);

      const data = await apiRequest<PaginatedResponse<Property>>(
        'GET',
        `${API_BASE}?${searchParams}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `properties:${searchParams.toString()}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );

      // Validate response structure and enhance properties with calculated scores
      if (validatePaginatedResponse(data)) {
        // Create a new response with enhanced properties while preserving the original structure
        const enhancedResponse: PaginatedResponse<EnhancedProperty> = {
          ...data,
          data: data.data.map(enhanceProperty),
        };
        return enhancedResponse;
      } else {
        // Return properly typed empty paginated response if data is invalid
        return createEmptyPaginatedResponse<EnhancedProperty>();
      }
    } catch (error) {
      // Re-throw PropertyApiError instances, wrap others
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to fetch properties: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Get single property by ID with enhanced data and optional market estimate
  getProperty: async (
    id: string, 
    options: { includeMarketEstimate?: boolean } = {}
  ): Promise<ApiResponse<EnhancedProperty>> => {
    try {
      const data = await apiRequest<ApiResponse<Property>>(
        'GET',
        `${API_BASE}/${id}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `property:${id}`,
            cancelPrevious: true,
            priority: 'high'
          }
        }
      );

      // Validate response structure before processing
      if (validateApiResponse(data)) {
        // Enhance property with business logic calculations
        const enhancedProperty = enhanceProperty(data.data);

        // Only get market estimate if explicitly requested to prevent infinite API calls
        if (options.includeMarketEstimate) {
          try {
            const similarProperties = await propertyApi.getSimilarProperties(
              data.data
            );
            if (similarProperties.length > 0) {
              enhancedProperty.marketEstimate =
                PropertyBusinessLogic.estimateMarketValue(
                  data.data,
                  similarProperties
                );
            }
          } catch (error) {
            // Log warning but don't fail the entire request
            console.warn("Failed to get market estimate:", error);
          }
        }

        // Return enhanced response preserving original structure
        return {
          ...data,
          data: enhancedProperty,
        };
      } else {
        throw new PropertyApiError(
          "Invalid response structure from server",
          500
        );
      }
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to fetch property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Create new property with comprehensive validation
  createProperty: async (
    propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Property>> => {
    try {
      // Validate property data before sending - create temporary complete object for validation
      const tempProperty: Property = {
        ...propertyData,
        id: "temp-id", // Temporary ID for validation purposes
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      PropertyBusinessLogic.validateProperty(tempProperty);

      return await apiRequest<ApiResponse<Property>>(
        'POST',
        API_BASE,
        propertyData,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `create-property:${Date.now()}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to create property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Update property with ownership validation and optimized validation flow
  updateProperty: async (
    id: string,
    updates: Partial<Property>,
    userId: string
  ): Promise<ApiResponse<Property>> => {
    try {
      // First get the current property to validate ownership
      const currentPropertyResponse = await propertyApi.getProperty(id);

      // Validate the response structure
      if (!validateApiResponse(currentPropertyResponse)) {
        throw new PropertyApiError(
          "Property not found or invalid response",
          404
        );
      }

      // Validate ownership and edit permissions
      const { canEdit, reasons } = PropertyBusinessLogic.canEditProperty(
        currentPropertyResponse.data,
        userId
      );

      if (!canEdit) {
        throw new PropertyApiError(
          `Cannot edit property: ${reasons.join(", ")}`,
          403
        );
      }

      return await apiRequest<ApiResponse<Property>>(
        'PATCH',
        `${API_BASE}/${id}`,
        updates,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `update-property:${id}`,
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to update property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Delete property with comprehensive validation and clear error messages
  deleteProperty: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    try {
      // Get the current property to validate ownership and status
      const currentPropertyResponse = await propertyApi.getProperty(id);

      // Validate the response structure
      if (!validateApiResponse(currentPropertyResponse)) {
        throw new PropertyApiError(
          "Property not found or invalid response",
          404
        );
      }

      const property = currentPropertyResponse.data;

      // Validate ownership
      if (!PropertyBusinessLogic.validateOwnership(property, userId)) {
        throw new PropertyApiError(
          "You are not authorized to delete this property",
          403
        );
      }

      // Check if property can be deleted based on status
      if ((property as any).status === "sold") {
        throw new PropertyApiError("Sold properties cannot be deleted", 400);
      }

      return await apiRequest<ApiResponse<void>>(
        'DELETE',
        `${API_BASE}/${id}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `delete-property:${id}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to delete property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Get properties by owner with improved error handling
  getPropertiesByOwner: async (
    ownerId: string
  ): Promise<ApiResponse<Property[]>> => {
    try {
      return await apiRequest<ApiResponse<Property[]>>(
        'GET',
        `${API_BASE}/owner/${ownerId}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `owner-properties:${ownerId}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to fetch owner properties: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Batch similar properties requests to reduce API calls
  _similarPropertiesBatch: new Map<string, Promise<Property[]>>(),
  _batchTimeout: null as NodeJS.Timeout | null,

  // Get similar properties with batching and caching
  getSimilarProperties: async (property: Property): Promise<Property[]> => {
    try {
      const propertyType = (property as any).propertyType || 'unknown';
      const location = typeof property.location === 'string' ? property.location : (property.location as any)?.city || 'unknown';
      const price = typeof property.price === 'number' ? property.price : parseFloat(property.price as string) || 0;
      
      const cacheKey = `${propertyType}-${location}-${Math.floor(price * 0.7)}-${Math.floor(price * 1.3)}`;
      
      // Check if we already have a pending request for similar criteria
      if (propertyApi._similarPropertiesBatch.has(cacheKey)) {
        return await propertyApi._similarPropertiesBatch.get(cacheKey)!;
      }

      const params = {
        propertyType: propertyType,
        city: location,
        minPrice: Math.floor(price * 0.7).toString(),
        maxPrice: Math.floor(price * 1.3).toString(),
        limit: "10",
      };

      const searchParams = buildSearchParams(params);
      
      const requestPromise = apiRequest<{ data: Property[] }>(
        'GET',
        `${API_BASE}/similar?${searchParams}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `similar-properties:${cacheKey}`,
            cancelPrevious: false, // Don't cancel batched requests
            priority: 'low',
            timeout: 5000
          }
        }
      ).then(data => {
        // Clean up batch cache after request completes
        propertyApi._similarPropertiesBatch.delete(cacheKey);
        return Array.isArray(data?.data) ? data.data : [];
      }).catch(error => {
        // Clean up batch cache on error
        propertyApi._similarPropertiesBatch.delete(cacheKey);
        console.warn("Error fetching similar properties:", error);
        return [];
      });

      // Store the promise in batch cache
      propertyApi._similarPropertiesBatch.set(cacheKey, requestPromise);
      
      return await requestPromise;
    } catch (error) {
      console.warn("Error fetching similar properties:", error);
      return [];
    }
  },

  // Get property recommendations with improved type safety
  getRecommendations: async (userPreferences: {
    priceRange: { min: number; max: number };
    preferredTypes: string[];
    minBedrooms: number;
    preferredAmenities: string[];
    location?: string;
  }): Promise<ApiResponse<Property[]>> => {
    try {
      return await apiRequest<ApiResponse<Property[]>>(
        'POST',
        `${API_BASE}/recommendations`,
        userPreferences,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `recommendations:${JSON.stringify(userPreferences)}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to fetch recommendations: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Upload property images with improved file handling and validation
  uploadImages: async (
    propertyId: string,
    images: File[]
  ): Promise<ApiResponse<string[]>> => {
    try {
      // Validate that images array is not empty
      if (!images || images.length === 0) {
        throw new PropertyApiError("No images provided for upload", 400);
      }

      // Validate each file before uploading
      const maxFileSize = 10 * 1024 * 1024; // 10MB limit
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      for (const image of images) {
        if (image.size > maxFileSize) {
          throw new PropertyApiError(
            `Image ${image.name} exceeds size limit of 10MB`,
            400
          );
        }
        if (!allowedTypes.includes(image.type)) {
          throw new PropertyApiError(
            `Image ${image.name} has unsupported format. Only JPEG, PNG, and WebP are allowed`,
            400
          );
        }
      }

      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const authToken = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      return await requestManager.makeRequest<ApiResponse<string[]>>(
        async (signal: AbortSignal) => {
          const response = await fetch(`${API_BASE}/${propertyId}/images`, {
            method: "POST",
            headers,
            body: formData,
            signal,
          });

          return handleApiResponse<ApiResponse<string[]>>(response);
        },
        {
          key: `upload-images:${propertyId}`,
          priority: 'high',
          cancelPrevious: false
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to upload images: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Request property verification with consistent error handling
  requestVerification: async (
    propertyId: string
  ): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<ApiResponse<void>>(
        'POST',
        `${API_BASE}/${propertyId}/verify`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `verify-property:${propertyId}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to request verification: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Batch operations for better performance when handling multiple properties
  batchUpdateProperties: async (
    updates: Array<{ id: string; data: Partial<Property> }>,
    userId: string
  ): Promise<ApiResponse<Property[]>> => {
    try {
      // Validate each update before sending
      for (const update of updates) {
        const currentPropertyResponse = await propertyApi.getProperty(
          update.id
        );

        if (!validateApiResponse(currentPropertyResponse)) {
          throw new PropertyApiError(`Property ${update.id} not found`, 404);
        }

        const { canEdit, reasons } = PropertyBusinessLogic.canEditProperty(
          currentPropertyResponse.data,
          userId
        );

        if (!canEdit) {
          throw new PropertyApiError(
            `Cannot edit property ${update.id}: ${reasons.join(", ")}`,
            403
          );
        }
      }

      return await apiRequest<ApiResponse<Property[]>>(
        'PATCH',
        `${API_BASE}/batch-update`,
        { updates },
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `batch-update:${updates.map(u => u.id).join(',')}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to batch update properties: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Get property statistics with caching for better performance
  getPropertyStats: async (
    filters?: PropertySearchParams
  ): Promise<
    ApiResponse<{
      totalProperties: number;
      averagePrice: number;
      priceRange: { min: number; max: number };
      propertyTypeDistribution: Record<string, number>;
      locationDistribution: Record<string, number>;
    }>
  > => {
    try {
      const searchParams =
        filters ? buildSearchParams(filters) : new URLSearchParams();

      return await apiRequest<
        ApiResponse<{
          totalProperties: number;
          averagePrice: number;
          priceRange: { min: number; max: number };
          propertyTypeDistribution: Record<string, number>;
          locationDistribution: Record<string, number>;
        }>
      >(
        'GET',
        `${API_BASE}/stats?${searchParams}`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `property-stats:${searchParams.toString()}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to fetch property statistics: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Land verification specific methods

  // Initiate land verification for a property
  initiateLandVerification: async (
    propertyId: string,
    requestedLayers?: string[]
  ): Promise<ApiResponse<{ sessionId: string }>> => {
    try {
      return await apiRequest<ApiResponse<{ sessionId: string }>>(
        'POST',
        `${API_BASE}/${propertyId}/land-verification`,
        { requestedLayers },
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `initiate-land-verification:${propertyId}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to initiate land verification: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Get land verification status for a property
  getLandVerificationStatus: async (
    propertyId: string
  ): Promise<ApiResponse<Property['landVerification']>> => {
    try {
      return await apiRequest<ApiResponse<Property['landVerification']>>(
        'GET',
        `${API_BASE}/${propertyId}/land-verification/status`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `land-verification-status:${propertyId}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to get land verification status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Get detailed land verification report
  getLandVerificationReport: async (
    propertyId: string
  ): Promise<ApiResponse<{
    sessionId: string;
    overallRiskScore: number;
    riskLevel: string;
    confidence: number;
    completedLayers: string[];
    riskFactors: Array<{
      category: string;
      severity: string;
      description: string;
      impact: string;
    }>;
    recommendations: Array<{
      priority: string;
      title: string;
      description: string;
    }>;
    lastUpdated: Date;
  }>> => {
    try {
      return await apiRequest<ApiResponse<{
        sessionId: string;
        overallRiskScore: number;
        riskLevel: string;
        confidence: number;
        completedLayers: string[];
        riskFactors: Array<{
          category: string;
          severity: string;
          description: string;
          impact: string;
        }>;
        recommendations: Array<{
          priority: string;
          title: string;
          description: string;
        }>;
        lastUpdated: Date;
      }>>(
        'GET',
        `${API_BASE}/${propertyId}/land-verification/report`,
        undefined,
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `land-verification-report:${propertyId}`,
            cancelPrevious: true,
            priority: 'normal'
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to get land verification report: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Update property with land verification results
  updatePropertyLandVerification: async (
    propertyId: string,
    landVerification: Property['landVerification']
  ): Promise<ApiResponse<Property>> => {
    try {
      return await apiRequest<ApiResponse<Property>>(
        'PATCH',
        `${API_BASE}/${propertyId}/land-verification`,
        { landVerification },
        {
          headers: buildHeaders(),
          requestOptions: {
            key: `update-land-verification:${propertyId}`,
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw new PropertyApiError(
        `Failed to update property land verification: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
};
