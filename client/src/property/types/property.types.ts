// Re-export the unified Property interface from shared types
export type { 
  Property, 
  PropertyFeatures, 
  LandVerificationStatus, 
  LandVerificationBadge,
  LocationData,
  Coordinates,
  AIVerificationResults
} from '../../../src/local/types/property'

export interface PropertySearchParams {
  query: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  amenities?: string[];
  landVerified?: boolean;
  landRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  page: number;
  limit: number;
  sortBy: 'price' | 'date' | 'relevance' | 'trustScore' | 'landVerification';
  sortOrder: 'asc' | 'desc';
}

// Input type for search parameters (all optional)
export interface PropertySearchInput {
  query?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  amenities?: string[];
  landVerified?: boolean;
  landRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'date' | 'relevance' | 'trustScore' | 'landVerification';
  sortOrder?: 'asc' | 'desc';
}