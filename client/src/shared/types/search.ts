/**
 * Unified Search Types
 * Consolidates all search-related interfaces to eliminate redundancies
 */

// Base search filters that all search implementations should extend
export interface BaseSearchFilters {
  query?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  verified?: boolean;
}

// Property-specific search filters
export interface PropertySearchFilters extends BaseSearchFilters {
  propertyType?: string | string[];
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  amenities?: string[];
  verificationStatus?: string[];
  furnished?: boolean;
  petFriendly?: boolean;
  parkingSpaces?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  trustScore?: number;
}

// Search options for pagination and sorting
export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price' | 'date' | 'size' | 'trust_score';
  sortOrder?: 'asc' | 'desc';
}

// Search result structure
export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets?: SearchFacets;
  searchTime?: number;
  appliedFilters?: PropertySearchFilters;
}

// Search facets for filtering UI
export interface SearchFacets {
  propertyTypes: Array<{ value: string; label: string; count: number }>;
  locations: Array<{ value: string; label: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  amenities: Array<{ value: string; label: string; count: number }>;
}

// Search suggestions
export interface SearchSuggestion {
  text: string;
  type: 'query' | 'location' | 'property';
  count?: number;
  relevanceScore?: number;
}

// Location suggestions
export interface LocationSuggestion {
  name: string;
  type: 'city' | 'neighborhood' | 'landmark';
  coordinates?: [number, number];
  parentLocation?: string;
}

// Search validation result
export interface SearchValidationResult {
  isValid: boolean;
  errors: string[];
}

// Search error types
export interface SearchError {
  code: string;
  message: string;
  details?: any;
}

// Hook options for search functionality
export interface UseSearchOptions {
  initialFilters?: PropertySearchFilters;
  initialOptions?: SearchOptions;
  autoSearch?: boolean;
  debounceMs?: number;
}

// Search bar specific filters (for UI components)
export interface SearchBarFilters {
  location: string;
  propertyType: string;
  priceRange: string;
}

// Sort options type
export type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'relevance';

// Search query keys for React Query
export const searchKeys = {
  all: ['search'] as const,
  results: (filters: PropertySearchFilters, options: SearchOptions) => 
    [...searchKeys.all, 'results', filters, options] as const,
  suggestions: (query: string) => 
    [...searchKeys.all, 'suggestions', query] as const,
  locations: (query: string) => 
    [...searchKeys.all, 'locations', query] as const,
  popular: () => 
    [...searchKeys.all, 'popular'] as const,
  facets: (filters: PropertySearchFilters) => 
    [...searchKeys.all, 'facets', filters] as const,
};