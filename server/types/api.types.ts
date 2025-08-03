/**
 * Common API types and interfaces used across all route modules
 */

// Common API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
  metadata?: ApiMetadata;
}

// API metadata for responses
export interface ApiMetadata {
  totalCount?: number;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
  verificationStatus?: string;
  riskLevel?: string;
  fraudDetectionPerformed?: boolean;
  requiresManualReview?: boolean;
  timestamp?: string;
  correlationId?: string;
  // API Versioning metadata
  supportedVersions?: string[];
  availableVersions?: string[];
  availableInVersions?: string[];
  currentVersion?: string;
  feature?: string;
  versioningMethods?: string[];
  versionDetails?: Array<{
    version: string;
    status: string;
    releaseDate: Date;
  }>;
}

// Search filters interface
export interface SearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Location data interface
export interface LocationData {
  id: number;
  name: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

// Validation result interface
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}