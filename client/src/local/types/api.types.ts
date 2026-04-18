// Unified API response types for consistent frontend-backend communication
import { Property } from './contracts/property-contracts'
import { PropertyFeatures } from './compare'

// Re-export Property types for external consumers
export type { Property, PropertyFeatures }

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
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