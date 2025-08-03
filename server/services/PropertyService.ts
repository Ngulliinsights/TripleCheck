import { z } from "zod";

import type { Property, InsertProperty } from "../../src/shared/schema";
import { storage } from "../infrastructure/storage/storage";
import type { PropertyFilter, PaginationParams, PaginatedResult } from "../infrastructure/storage/storage";
import { PropertyValidationSchemas } from "../middleware/validation.middleware";


// Property-specific types
export interface PropertySearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

export interface PropertyCreateRequest {
  title: string;
  description: string;
  location: string;
  price: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
    propertyType?: string;
    petFriendly?: boolean;
    furnished?: boolean;
    amenities?: string[];
  };
  imageUrls?: string[];
}

export interface PropertyUpdateRequest {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
    propertyType?: string;
    petFriendly?: boolean;
    furnished?: boolean;
    amenities?: string[];
  };
  imageUrls?: string[];
}

export interface PropertyServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * PropertyService handles all property management business logic
 * including creation, retrieval, search, validation, and data processing
 */
export class PropertyService {
  /**
   * Get all properties with optional pagination
   */
  async getProperties(pagination?: PaginationParams): Promise<PropertyServiceResult<readonly Property[] | PaginatedResult<Property>>> {
    try {
      if (pagination) {
        const result = await storage.getPropertiesPaginated(pagination);
        return {
          success: true,
          data: result
        };
      } else {
        const properties = await storage.getProperties();
        return {
          success: true,
          data: properties
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: number): Promise<PropertyServiceResult<Property>> {
    try {
      if (!id || id <= 0) {
        return {
          success: false,
          error: 'Invalid property ID'
        };
      }

      const property = await storage.getProperty(id);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new property with validation and data processing
   */
  async createProperty(propertyData: PropertyCreateRequest, ownerId: number): Promise<PropertyServiceResult<Property>> {
    try {
      // Validate input data
      const validationResult = this.validatePropertyData(propertyData);
      if (!validationResult.success) {
        return validationResult;
      }

      // Process and sanitize property data
      const processedData = this.processPropertyData(propertyData);

      // Create property in storage
      const insertData: InsertProperty = {
        ...processedData,
        ownerId,
        price: processedData.price.toString(), // Convert to string for decimal storage
        verificationStatus: 'pending',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        favoriteCount: 0
      };

      const property = await storage.createProperty(insertData);

      return {
        success: true,
        data: property,
        message: 'Property created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(id: number, updates: PropertyUpdateRequest, ownerId: number): Promise<PropertyServiceResult<Property>> {
    try {
      // Check if property exists and user owns it
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      if (existingProperty.ownerId !== ownerId) {
        return {
          success: false,
          error: 'Unauthorized: You can only update your own properties'
        };
      }

      // Validate update data
      const validationResult = this.validatePropertyUpdateData(updates);
      if (!validationResult.success) {
        return validationResult;
      }

      // Process update data
      const processedUpdates = this.processPropertyUpdateData(updates);

      // Update property in storage
      const updatedProperty = await storage.updateVerificationStatus(
        id,
        existingProperty.verificationStatus,
        {
          ...processedUpdates,
          ...(processedUpdates.price && { price: processedUpdates.price.toString() })
        }
      );

      return {
        success: true,
        data: updatedProperty,
        message: 'Property updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search properties with filters
   */
  async searchProperties(query?: string, filters?: PropertySearchFilters): Promise<PropertyServiceResult<readonly Property[]>> {
    try {
      let properties: readonly Property[];

      if (query) {
        // Use text search
        properties = await storage.searchProperties(query);
      } else if (filters) {
        // Convert filters to storage format
        const storageFilters = this.convertToStorageFilters(filters);
        properties = await storage.searchPropertiesWithFilters(storageFilters);
      } else {
        // Get all properties
        properties = await storage.getProperties();
      }

      // Apply additional client-side filtering if needed
      if (filters) {
        properties = this.applyClientSideFilters(properties, filters);
      }

      return {
        success: true,
        data: properties
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search properties with filters and pagination
   */
  async searchPropertiesWithPagination(
    filters: PropertySearchFilters,
    pagination: PaginationParams
  ): Promise<PropertyServiceResult<PaginatedResult<Property>>> {
    try {
      const storageFilters = this.convertToStorageFilters(filters);
      const result = await storage.searchPropertiesWithFiltersPaginated(storageFilters, pagination);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search properties with pagination: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update property verification status
   */
  async updateVerificationStatus(
    id: number,
    status: string,
    results?: any,
    ownerId?: number
  ): Promise<PropertyServiceResult<Property>> {
    try {
      // If ownerId is provided, check ownership
      if (ownerId) {
        const existingProperty = await storage.getProperty(id);
        if (!existingProperty) {
          return {
            success: false,
            error: 'Property not found'
          };
        }

        if (existingProperty.ownerId !== ownerId) {
          return {
            success: false,
            error: 'Unauthorized: You can only update your own properties'
          };
        }
      }

      const updatedProperty = await storage.updateVerificationStatus(id, status, results);

      return {
        success: true,
        data: updatedProperty,
        message: 'Verification status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update verification status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: number): Promise<PropertyServiceResult<readonly Property[]>> {
    try {
      if (!ownerId || ownerId <= 0) {
        return {
          success: false,
          error: 'Invalid owner ID'
        };
      }

      // Get all properties and filter by owner
      const allProperties = await storage.getProperties();
      const ownerProperties = allProperties.filter(property => property.ownerId === ownerId);

      return {
        success: true,
        data: ownerProperties
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve properties by owner: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate property creation data
   */
  private validatePropertyData(data: PropertyCreateRequest): PropertyServiceResult<void> {
    try {
      // Additional business logic validation first
      if (data.price <= 0) {
        return {
          success: false,
          error: 'Price must be greater than 0'
        };
      }

      if (data.price > 1000000000) {
        return {
          success: false,
          error: 'Price cannot exceed 1 billion'
        };
      }

      if (data.imageUrls && data.imageUrls.length > 20) {
        return {
          success: false,
          error: 'Cannot have more than 20 images'
        };
      }

      // Use existing validation schema
      PropertyValidationSchemas.createProperty.parse({
        ...data,
        price: data.price
      });

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
        };
      }
      return {
        success: false,
        error: 'Invalid property data'
      };
    }
  }

  /**
   * Validate property update data
   */
  private validatePropertyUpdateData(data: PropertyUpdateRequest): PropertyServiceResult<void> {
    try {
      // Validate only provided fields
      if (data.price !== undefined) {
        if (data.price <= 0) {
          return {
            success: false,
            error: 'Price must be greater than 0'
          };
        }

        if (data.price > 1000000000) {
          return {
            success: false,
            error: 'Price cannot exceed 1 billion'
          };
        }
      }

      if (data.title !== undefined) {
        if (data.title.length < 5 || data.title.length > 100) {
          return {
            success: false,
            error: 'Title must be between 5 and 100 characters'
          };
        }
      }

      if (data.description !== undefined) {
        if (data.description.length < 20 || data.description.length > 2000) {
          return {
            success: false,
            error: 'Description must be between 20 and 2000 characters'
          };
        }
      }

      if (data.imageUrls && data.imageUrls.length > 20) {
        return {
          success: false,
          error: 'Cannot have more than 20 images'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid property update data'
      };
    }
  }

  /**
   * Process and sanitize property data
   */
  private processPropertyData(data: PropertyCreateRequest): PropertyCreateRequest {
    return {
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      address: data.address?.trim(),
      imageUrls: data.imageUrls?.filter(url => url.trim().length > 0) || [],
      features: data.features ? {
        ...data.features,
        amenities: data.features.amenities?.filter(amenity => amenity.trim().length > 0)
      } : undefined
    };
  }

  /**
   * Process property update data
   */
  private processPropertyUpdateData(data: PropertyUpdateRequest): PropertyUpdateRequest {
    const processed: PropertyUpdateRequest = {};

    if (data.title !== undefined) {
      processed.title = data.title.trim();
    }

    if (data.description !== undefined) {
      processed.description = data.description.trim();
    }

    if (data.location !== undefined) {
      processed.location = data.location.trim();
    }

    if (data.address !== undefined) {
      processed.address = data.address.trim();
    }

    if (data.price !== undefined) {
      processed.price = data.price;
    }

    if (data.coordinates !== undefined) {
      processed.coordinates = data.coordinates;
    }

    if (data.features !== undefined) {
      processed.features = {
        ...data.features,
        amenities: data.features.amenities?.filter(amenity => amenity.trim().length > 0)
      };
    }

    if (data.imageUrls !== undefined) {
      processed.imageUrls = data.imageUrls.filter(url => url.trim().length > 0);
    }

    return processed;
  }

  /**
   * Convert PropertySearchFilters to storage PropertyFilter format
   */
  private convertToStorageFilters(filters: PropertySearchFilters): PropertyFilter {
    const storageFilters: PropertyFilter = {};

    if (filters.location) {
      storageFilters.location = filters.location;
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      storageFilters.priceRange = [
        filters.priceMin || 0,
        filters.priceMax || Number.MAX_SAFE_INTEGER
      ] as const;
    }

    if (filters.propertyType) {
      storageFilters.type = [filters.propertyType];
    }

    if (filters.bedrooms !== undefined) {
      storageFilters.bedrooms = filters.bedrooms;
    }

    if (filters.bathrooms !== undefined) {
      storageFilters.bathrooms = filters.bathrooms;
    }

    if (filters.verified !== undefined) {
      storageFilters.verificationStatus = filters.verified ? ['verified'] : ['pending', 'unverified'];
    }

    return storageFilters;
  }

  /**
   * Apply additional client-side filtering
   */
  private applyClientSideFilters(properties: readonly Property[], filters: PropertySearchFilters): readonly Property[] {
    return properties.filter(property => {
      // Additional filtering logic that can't be done at database level
      if (filters.verified !== undefined) {
        const isVerified = property.verificationStatus === 'verified';
        if (filters.verified !== isVerified) {
          return false;
        }
      }

      return true;
    });
  }
}