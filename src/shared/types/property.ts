// Unified Property interface that matches the database schema
export interface Property {
  id: number | string; // Allow both for API compatibility
  title: string;
  description: string;
  location: string | LocationData;
  address?: string | null | undefined; // Optional since not always present in API
  price: string | number; // Allow both for API compatibility
  coordinates?: Coordinates | null | undefined; // Optional since not always present in API
  imageUrls?: string[] | undefined; // Optional, API uses 'images'
  images?: string[] | undefined; // API field name
  verificationStatus?: 'verified' | 'pending' | 'unverified' | 'draft' | undefined;
  features?: PropertyFeatures | null | undefined;
  ownerId?: string | undefined;
  aiVerificationResults?: AIVerificationResults | null | undefined;
  viewCount?: number | undefined;
  favoriteCount?: number | undefined;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
  availableFrom?: Date | string | null | undefined;
  availableUntil?: Date | string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  // Extended properties for frontend use
  landVerification?: LandVerificationStatus | undefined;
  trustScore?: number | undefined;
  owner?: {
    id: string;
    username: string;
    email: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    trustScore: number;
    isVerifiedAgent: boolean;
  } | undefined;
  // Additional fields that might be present in API responses
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  size?: number | undefined;
  area?: number | undefined;
  type?: string | undefined;
  propertyType?: string | undefined;
  status?: string | undefined;
  amenities?: string[] | undefined;
}

export interface LocationData {
  address: string;
  city?: string | undefined;
  state: string;
  country: string;
  coordinates?: Coordinates | undefined;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PropertyFeatures {
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  squareFeet?: number | undefined;
  parkingSpaces?: number | undefined;
  yearBuilt?: number | undefined;
  amenities?: string[] | undefined;
  propertyType?: string | undefined;
  petFriendly?: boolean | undefined;
  furnished?: boolean | undefined;
  // Allow additional dynamic properties from API
  [key: string]: unknown;
}

export interface AIVerificationResults {
  overallScore?: number;
  imageAnalysis?: {
    authenticity: number;
    quality: number;
    flags: string[];
  };
  textAnalysis?: {
    sentiment: number;
    credibility: number;
    flags: string[];
  };
  priceAnalysis?: {
    marketComparison: number;
    reasonableness: number;
    flags: string[];
  };
  lastVerified?: string;
  verificationId?: string;
}

export interface LandVerificationStatus {
  sessionId?: string | undefined;
  status: 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  completedLayers: string[];
  lastUpdated: Date;
  badge?: LandVerificationBadge | undefined;
}

export interface LandVerificationBadge {
  type: 'verified' | 'in_progress' | 'high_risk' | 'expert_required';
  label: string;
  color: 'green' | 'blue' | 'red' | 'orange';
  description: string;
}