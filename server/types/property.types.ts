/**
 * Property-related types and interfaces
 */

import { z } from "zod";

// Database property type (based on schema structure)
export interface DatabaseProperty {
  id: number;
  title: string;
  description: string;
  price: string; // decimal stored as string
  location: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrls: string[];
  verificationStatus: "verified" | "pending" | "unverified" | "draft";
  features?: PropertyFeatures;
  ownerId: number;
  aiVerificationResults?: any;
  viewCount: number;
  favoriteCount: number;
  isActive: boolean;
  isFeatured: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Property input schema for validation
export const insertPropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  location: z.string().min(1).max(255),
  address: z.string().optional(),
  imageUrls: z.array(z.string().url()).default([]),
});

// Property input type for creation
export type NewPropertyInput = z.infer<typeof insertPropertySchema>;

// Property with additional computed fields
export interface PropertyWithMetadata extends DatabaseProperty {
  riskLevel?: string;
  fraudDetectionPerformed?: boolean;
  requiresManualReview?: boolean;
}

// Property search filters (specific to properties)
export interface PropertySearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

// Property creation request
export interface PropertyCreateRequest {
  title: string;
  description: string;
  location: string;
  price: number;
  features?: PropertyFeatures;
  imageUrls?: string[];
}

// Property features interface
export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  parking?: boolean;
  garden?: boolean;
  furnished?: boolean;
  petFriendly?: boolean;
}

// Property summary for listings
export type PropertySummary = Pick<DatabaseProperty, 'id' | 'title' | 'location' | 'price'> & {
  verificationStatus?: string;
};

// Property update request
export interface PropertyUpdateRequest {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  features?: PropertyFeatures;
  imageUrls?: string[];
}

// Legacy Property interface (for backward compatibility)
// Note: Consider migrating to DatabaseProperty for new code
export interface Property {
  id: number;
  price: number;
  location: string;
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    amenities: string[];
  };
  verificationStatus?: string;
  trustScore?: number;
  ownerId?: number;
  isFraudulent?: boolean;
  yearBuilt?: number;
}