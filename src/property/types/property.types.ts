import { BaseEntity } from '@/shared/types';

export interface Property extends BaseEntity {
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  propertyType: 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  amenities: string[];
  ownerId: string;
  status: 'active' | 'pending' | 'sold' | 'inactive';
  trustScore?: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  landVerification?: LandVerificationStatus;
}

export interface LandVerificationStatus {
  sessionId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  completedLayers: string[]; // Array of completed verification layer types
  lastUpdated: Date;
  badge?: LandVerificationBadge;
}

export interface LandVerificationBadge {
  type: 'verified' | 'in_progress' | 'high_risk' | 'expert_required';
  label: string;
  color: 'green' | 'blue' | 'red' | 'orange';
  description: string;
}

export interface PropertySearchParams {
  query?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: Property['propertyType'];
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