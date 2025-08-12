/**
 * Unified Compare Types
 * 
 * Centralized type definitions for all comparison functionality
 * to ensure consistency across components.
 * 
 * Integrates with image system for property image comparison
 */

import type { PropertyImage, DocumentType, PropertyImageMetadata } from './images/index';

// Re-export image-related types for comparison context
export type { PropertyImage, DocumentType, PropertyImageMetadata };

export type VerificationStatus = "verified" | "pending" | "unverified" | "draft" | "flagged";

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  amenities?: string[];
}

export interface LocationData {
  name?: string;
  address?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CompareProperty {
  id: string;
  title: string;
  price: number;
  location: string | LocationData;
  description?: string;
  images?: string[];
  // Enhanced image integration
  propertyImages?: PropertyImage[];
  primaryImageId?: string;
  features?: PropertyFeatures;
  verificationStatus?: VerificationStatus;
  trustScore?: number;
  type?: "residential" | "commercial";
  aiVerificationResults?: unknown;
  // Image-based verification data
  imageVerificationScore?: number;
  documentAuthResults?: Record<string, boolean>;
}

export interface ComparisonResult {
  feature: string;
  values: { propertyId: string; value: unknown; propertyName: string }[];
  allSame: boolean;
  uniqueValues: unknown[];
}

export interface ComparisonStats {
  totalProperties: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  commonFeatures: number;
  uniqueFeatures: number;
  mostExpensive: CompareProperty | null;
  leastExpensive: CompareProperty | null;
}

export type ComparisonValueResult = "equal" | "higher" | "lower" | "different";

export interface BaseCompareProps {
  className?: string;
  onError?: (error: string) => void;
}

export interface CompareContextType {
  // Core state management
  selectedProperties: CompareProperty[];
  addToCompare: (property: CompareProperty) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isSelected: (propertyId: string) => boolean;
  canAddMore: boolean;
  maxProperties: number;
  
  // Enhanced functionality
  toggleProperty: (property: CompareProperty) => void;
  replaceProperty: (oldPropertyId: string, newProperty: CompareProperty) => void;
  reorderProperties: (fromIndex: number, toIndex: number) => void;
  getPropertyIndex: (propertyId: string) => number;
  
  // Bulk operations
  addMultiple: (properties: CompareProperty[]) => void;
  removeMultiple: (propertyIds: string[]) => void;
  replaceAll: (properties: CompareProperty[]) => void;
  
  // Comparison utilities
  getCommonFeatures: () => string[];
  getDifferentFeatures: () => string[];
  getPropertyComparison: () => ComparisonResult[];
  
  // Persistence and sharing
  exportComparison: () => string;
  importComparison: (data: string) => boolean;
  getShareableUrl: () => string;
  
  // Statistics and insights
  getStats: () => ComparisonStats;
  getPriceRange: () => { min: number; max: number; average: number } | null;
  
  // History and undo
  history: CompareProperty[][];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // State flags
  isLoading: boolean;
  error: string | null;
  
  // Event callbacks
  onSelectionChange?: (properties: CompareProperty[]) => void;
  onMaxReached?: () => void;
  onEmptyState?: () => void;
}