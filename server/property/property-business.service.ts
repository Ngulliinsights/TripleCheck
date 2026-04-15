import { z } from "zod";
import type { properties } from "../infrastructure/database/schemas/consolidated";

// Define types from database schema
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

import { storage } from "../infrastructure/storage/storage";
import type { PropertyFilter, PaginationParams, PaginatedResult } from "../infrastructure/storage/storage";
import { PropertyValidationSchemas } from "../middleware/validation.middleware";

// Constants to avoid duplicate strings
const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
  PROPERTY_NOT_FOUND: 'Property not found',
  INVALID_PROPERTY_ID: 'Invalid property ID',
  INVALID_OWNER_ID: 'Invalid owner ID',
  UNAUTHORIZED: 'Unauthorized: You can only update your own properties',
  INVALID_PROPERTY_DATA: 'Invalid property data',
} as const;

const SUCCESS_MESSAGES = {
  PROPERTY_CREATED: 'Property created successfully',
  PROPERTY_UPDATED: 'Property updated successfully',
  VERIFICATION_UPDATED: 'Verification status updated successfully',
} as const;

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

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  propertyType?: 'apartment' | 'house' | 'townhouse' | 'land' | 'commercial' | 'studio' | 'condo';
  petFriendly?: boolean;
  furnished?: boolean;
  amenities?: string[] | undefined;
}

export interface PropertyCreateRequest {
  title: string;
  description: string;
  location: string;
  price: number;
  address?: string | undefined;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: PropertyFeatures | undefined;
  imageUrls?: string[] | undefined;
}

export interface PropertyUpdateRequest {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  address?: string | undefined;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: PropertyFeatures | undefined;
  imageUrls?: string[] | undefined;
}

export interface PropertyServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ValidationResult {
  success: boolean;
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
        error: `Failed to retrieve properties: ${this.getErrorMessage(error)}`
      };
    }
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: number): Promise<PropertyServiceResult<Property>> {
    try {
      if (!this.isValidId(id)) {
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_PROPERTY_ID
        };
      }

      const property = await storage.getProperty(id);
      if (!property) {
        return {
          success: false,
          error: ERROR_MESSAGES.PROPERTY_NOT_FOUND
        };
      }

      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve property: ${this.getErrorMessage(error)}`
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
        title: processedData.title,
        description: processedData.description,
        location: processedData.location,
        price: processedData.price.toString(), // Convert to string for decimal storage
        imageUrls: processedData.imageUrls || [],
        ownerId,
        verificationStatus: 'pending',
        isActive: true,
        isFeatured: false,
        viewCount: 0,
        favoriteCount: 0,
        ...(processedData.address ? { address: processedData.address } : {}),
        ...(processedData.coordinates ? { coordinates: processedData.coordinates } : {}),
        ...(processedData.features ? { features: processedData.features } : {})
      };

      const property = await storage.createProperty(insertData);

      return {
        success: true,
        data: property,
        message: SUCCESS_MESSAGES.PROPERTY_CREATED
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create property: ${this.getErrorMessage(error)}`
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
          error: ERROR_MESSAGES.PROPERTY_NOT_FOUND
        };
      }

      if (existingProperty.ownerId !== ownerId) {
        return {
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED
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
        message: SUCCESS_MESSAGES.PROPERTY_UPDATED
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update property: ${this.getErrorMessage(error)}`
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
        error: `Failed to search properties: ${this.getErrorMessage(error)}`
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
        error: `Failed to search properties with pagination: ${this.getErrorMessage(error)}`
      };
    }
  }

  /**
   * Update property verification status
   */
  async updateVerificationStatus(
    id: number,
    status: string,
    results?: Record<string, unknown>,
    ownerId?: number
  ): Promise<PropertyServiceResult<Property>> {
    try {
      // If ownerId is provided, check ownership
      if (ownerId) {
        const existingProperty = await storage.getProperty(id);
        if (!existingProperty) {
          return {
            success: false,
            error: ERROR_MESSAGES.PROPERTY_NOT_FOUND
          };
        }

        if (existingProperty.ownerId !== ownerId) {
          return {
            success: false,
            error: ERROR_MESSAGES.UNAUTHORIZED
          };
        }
      }

      const updatedProperty = await storage.updateVerificationStatus(id, status, results);

      return {
        success: true,
        data: updatedProperty,
        message: SUCCESS_MESSAGES.VERIFICATION_UPDATED
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update verification status: ${this.getErrorMessage(error)}`
      };
    }
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: number): Promise<PropertyServiceResult<readonly Property[]>> {
    try {
      if (!this.isValidId(ownerId)) {
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_OWNER_ID
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
        error: `Failed to retrieve properties by owner: ${this.getErrorMessage(error)}`
      };
    }
  }

  /**
   * Validate property creation data
   */
  private validatePropertyData(data: PropertyCreateRequest): ValidationResult {
    try {
      // Additional business logic validation first
      const businessValidation = this.validateBusinessRules(data);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // Use existing validation schema
      PropertyValidationSchemas.createProperty.parse({
        ...data,
        price: data.price
      });

      return { success: true };
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  /**
   * Validate property update data
   */
  private validatePropertyUpdateData(data: PropertyUpdateRequest): ValidationResult {
    try {
      // Validate only provided fields
      if (data.price !== undefined && !this.isValidPrice(data.price)) {
        return {
          success: false,
          error: this.getPriceErrorMessage(data.price)
        };
      }

      if (data.title !== undefined && !this.isValidTitle(data.title)) {
        return {
          success: false,
          error: 'Title must be between 5 and 100 characters'
        };
      }

      if (data.description !== undefined && !this.isValidDescription(data.description)) {
        return {
          success: false,
          error: 'Description must be between 20 and 2000 characters'
        };
      }

      if (data.imageUrls && !this.isValidImageCount(data.imageUrls)) {
        return {
          success: false,
          error: 'Cannot have more than 20 images'
        };
      }

      return { success: true };
    } catch (error) {
      // Log the error for debugging purposes
      // eslint-disable-next-line no-console
      console.error('Property validation error:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_PROPERTY_DATA
      };
    }
  }

  /**
   * Process and sanitize property data
   */
  private processPropertyData(data: PropertyCreateRequest): PropertyCreateRequest {
    const processedData: PropertyCreateRequest = {
      title: data.title.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      price: data.price,
      imageUrls: this.sanitizeImageUrls(data.imageUrls),
      ...(data.address?.trim() ? { address: data.address.trim() } : {}),
      ...(data.coordinates ? { coordinates: data.coordinates } : {}),
      ...(data.features ? { features: this.sanitizeFeatures(data.features) } : {})
    };

    return processedData;
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
      processed.address = data.address?.trim() ?? undefined;
    }

    if (data.price !== undefined) {
      processed.price = data.price;
    }

    if (data.coordinates !== undefined) {
      processed.coordinates = data.coordinates;
    }

    if (data.features !== undefined) {
      processed.features = this.sanitizeFeatures(data.features);
    }

    if (data.imageUrls !== undefined) {
      processed.imageUrls = this.sanitizeImageUrls(data.imageUrls);
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
        filters.priceMin ?? 0,
        filters.priceMax ?? Number.MAX_SAFE_INTEGER
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

  // Utility methods
  private isValidId(id: number): boolean {
    return Boolean(id && id > 0);
  }

  private isValidPrice(price: number): boolean {
    return price > 0 && price <= 1000000000;
  }

  private isValidTitle(title: string): boolean {
    return title.length >= 5 && title.length <= 100;
  }

  private isValidDescription(description: string): boolean {
    return description.length >= 20 && description.length <= 2000;
  }

  private isValidImageCount(imageUrls: string[]): boolean {
    return imageUrls.length <= 20;
  }

  private getPriceErrorMessage(price: number): string {
    if (price <= 0) {
      return 'Price must be greater than 0';
    }
    return 'Price cannot exceed 1 billion';
  }

  private validateBusinessRules(data: PropertyCreateRequest): ValidationResult {
    if (!this.isValidPrice(data.price)) {
      return {
        success: false,
        error: this.getPriceErrorMessage(data.price)
      };
    }

    if (data.imageUrls && !this.isValidImageCount(data.imageUrls)) {
      return {
        success: false,
        error: 'Cannot have more than 20 images'
      };
    }

    return { success: true };
  }

  private sanitizeImageUrls(imageUrls?: string[] | undefined): string[] {
    return imageUrls?.filter(url => url.trim().length > 0) ?? [];
  }

  private sanitizeFeatures(features: PropertyFeatures): PropertyFeatures {
    const sanitizedFeatures: PropertyFeatures = {
      ...features,
      amenities: features.amenities?.filter(amenity => amenity.trim().length > 0) ?? undefined
    };

    return sanitizedFeatures;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private handleValidationError(error: unknown): ValidationResult {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMessage}`
      };
    }
    
    // Log the error for debugging purposes
    // eslint-disable-next-line no-console
    console.error('Validation error:', error);
    
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_PROPERTY_DATA
    };
  }
}