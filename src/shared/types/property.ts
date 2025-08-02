// Unified Property interface that matches the database schema
export interface Property {
  id: number | string; // Allow both for API compatibility
  title: string;
  description: string;
  location: string | LocationData;
  address?: string | null; // Optional since not always present in API
  price: string | number; // Allow both for API compatibility
  coordinates?: Coordinates | null; // Optional since not always present in API
  imageUrls?: string[]; // Optional, API uses 'images'
  images?: string[]; // API field name
  verificationStatus?: 'verified' | 'pending' | 'unverified' | 'draft';
  features: PropertyFeatures | null;
  ownerId?: string;
  aiVerificationResults?: AIVerificationResults | null;
  viewCount?: number;
  favoriteCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  availableFrom?: Date | string | null;
  availableUntil?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Extended properties for frontend use
  landVerification?: LandVerificationStatus;
  trustScore?: number;
  owner?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    trustScore: number;
    isVerifiedAgent: boolean;
  };
  // Additional fields that might be present in API responses
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  area?: number;
  type?: string;
  propertyType?: string;
  status?: string;
  amenities?: string[];
}

export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  amenities?: string[];
  propertyType?: string;
  petFriendly?: boolean;
  furnished?: boolean;
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
  sessionId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  completedLayers: string[];
  lastUpdated: Date;
  badge?: LandVerificationBadge;
}

export interface LandVerificationBadge {
  type: 'verified' | 'in_progress' | 'high_risk' | 'expert_required';
  label: string;
  color: 'green' | 'blue' | 'red' | 'orange';
  description: string;
}