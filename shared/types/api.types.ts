// Unified API response types for consistent frontend-backend communication
import { Property, PropertyFeatures } from './property'

/**
 * CANONICAL API types for entire monorepo (client + server)
 * Single source of truth for API contracts
 */

// Common API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  errors?: unknown[];
  metadata?: ApiMetadata;
}

// API metadata for responses (server-side enrichment)
export interface ApiMetadata {
  totalCount?: number;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
  verificationStatus?: string;
  riskLevel?: string;
  fraudDetectionPerformed?: boolean;
  requiresManualReview?: boolean;
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

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PropertyApiResponse {
  success: boolean;
  data: Property[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SinglePropertyResponse {
  success: boolean;
  data: Property;
  cached?: boolean;
}

export interface LandVerificationData {
  sessionId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  completedLayers: string[];
  lastUpdated: Date | string;
  badge?: {
    type: string;
    label: string;
    color: string;
    description: string;
  };
}

export interface PropertySearchParams {
  query: string;
  location?: string;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  propertyType?: string | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  areaMin?: number | undefined;
  areaMax?: number | undefined;
  landVerified?: boolean | undefined;
  landRiskLevel?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  page: number;
  limit: number;
  sortBy: 'date' | 'trustScore' | 'price' | 'relevance' | 'landVerification';
  sortOrder: 'asc' | 'desc';
}

// Error response types
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  status?: number;
  code?: string;
  timestamp?: string;
}

// Authentication types
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  trustScore: number;
  isVerifiedAgent: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    token?: string;
  };
  message?: string;
  error?: string;
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
export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  error?: string;
}