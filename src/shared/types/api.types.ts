// Unified API response types for consistent frontend-backend communication

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

// Property types that match the database schema
export interface Property {
  id: string | number;
  title: string;
  description: string;
  price: string | number;
  location: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrls: string[];
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'draft';
  features?: PropertyFeatures;
  ownerId: number;
  viewCount: number;
  favoriteCount: number;
  isActive: boolean;
  isFeatured: boolean;
  availableFrom?: Date | string | null;
  availableUntil?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  landVerification?: LandVerificationData | null;
}

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  propertyType?: string;
  petFriendly?: boolean;
  furnished?: boolean;
  amenities?: string[];
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
  query?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  landVerified?: boolean;
  landRiskLevel?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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