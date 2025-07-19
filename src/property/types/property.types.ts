import { BaseEntity } from '../../shared/types';

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
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'date' | 'relevance' | 'trustScore';
  sortOrder?: 'asc' | 'desc';
}