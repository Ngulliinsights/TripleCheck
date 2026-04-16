import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, useEffect } from "react"

import { useDebounce } from '../../local/hooks/useDebounce"
import { useOptimisticMutation } from '../../local/hooks/useOptimisticMutation"
import { useSafeQuery } from '../../local/hooks/useSafeQuery"
import { Property } from '../../../../shared/types/property"
import { fetchMockLandProperty, hasMockLandProperty, type MockLandProperty } from "../services/mock-land-data"
import { propertyApi } from "../services/property-api"
import { PropertySearchParams } from "../types/property.types"

// Enhanced type definitions for unified property management
interface UnifiedPropertyOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  debounceMs?: number;
}

interface PropertyDetailResponse {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string | { address: string; city?: string; state: string; country: string };
  features: Record<string, unknown>;
  description?: string | undefined;
  amenities?: string[] | undefined;
  lastUpdated?: string | undefined;
  viewCount?: number | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  size?: number | undefined;
  type?: string | undefined;
  status?: string | undefined;
  ownerId?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

interface PropertiesResponse {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchResult {
  properties: Property[];
  totalCount: number;
  hasNextPage: boolean;
  searchMetrics?: {
    responseTime: number;
    totalResults: number;
    appliedFilters: string[];
  } | undefined;
}

// Constants for cache management and string literals
const CACHE_CONFIG = {
  PROPERTY_DETAIL: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  },
  PROPERTIES_LIST: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  },
  LAND_PROPERTY: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  },
} as const;

/**
 * Centralized string constants to avoid duplication and ensure consistency
 * This is our single source of truth for all string literals used throughout the hook
 * Think of this as the "dictionary" for all the fixed strings we use repeatedly
 */
const STRING_CONSTANTS = {
  PROPERTY_DETAIL: "property-detail",
  LAND_PROPERTY: "land-property",
  PROPERTIES_LIST: "properties-list",
  PROPERTY_SEARCH: "property-search",
  UNTITLED_PROPERTY: "Untitled Property",
  LOCATION_NOT_SPECIFIED: "Location not specified",
  FAILED_TO_FETCH: "Failed to fetch land property",
} as const;

/**
 * Cache key generators for consistency
 * These functions create standardized cache keys by combining our string constants
 * with dynamic values like IDs or parameters. This ensures all cache keys follow
 * the same pattern and reduces the chance of cache key conflicts.
 */
const generateCacheKey = {
  propertyDetail: (id: string) => `${STRING_CONSTANTS.PROPERTY_DETAIL}-${id}`,
  landProperty: (id: string) => `${STRING_CONSTANTS.LAND_PROPERTY}-${id}`,
  propertiesList: (params: Record<string, unknown>) => `${STRING_CONSTANTS.PROPERTIES_LIST}-${JSON.stringify(params)}`,
  propertySearch: (params: Record<string, unknown>) => `${STRING_CONSTANTS.PROPERTY_SEARCH}-${JSON.stringify(params)}`,
} as const;

/**
 * Helper function to safely extract string values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Think of this as a "safety net" that ensures we always get a string back,
 * even if the input data is malformed or missing
 */
function safeStringExtract(value: unknown, fallback: string): string {
  return value ? String(value) : fallback;
}

/**
 * Helper function to safely extract number values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Similar to safeStringExtract, but specifically for numeric values
 */
function safeNumberExtract(value: unknown, fallback?: number): number | undefined {
  return typeof value === "number" ? value : fallback;
}

/**
 * Helper function to safely extract array values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Ensures we always get an array back, preventing "cannot read property of undefined" errors
 */
function safeArrayExtract<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}

/**
 * Helper function to safely extract string array values with fallbacks
 * This ensures type safety for amenities and similar string arrays
 * Not only checks if it's an array, but also filters out non-string values
 */
function safeStringArrayExtract(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Helper function to extract and validate location data
 * This simplifies location handling logic by centralizing the complex
 * logic for dealing with different location data formats
 */
function extractLocationData(location: unknown): string {
  // Handle simple string location format
  if (typeof location === "string") {
    return location;
  }

  // Handle complex object location format with nested properties
  if (location && typeof location === "object") {
    const locationObj = location as { address?: string };
    return locationObj.address || STRING_CONSTANTS.LOCATION_NOT_SPECIFIED;
  }

  // Fallback for any other data type
  return STRING_CONSTANTS.LOCATION_NOT_SPECIFIED;
}

/**
 * Simplified property validation function with reduced cognitive complexity
 * Addresses ESLint cognitive-complexity warning by breaking down validation logic
 * This function takes raw API data and transforms it into a standardized format
 * that our application can rely on, regardless of how the backend sends the data
 */
function validatePropertyData(propertyObj: Record<string, unknown>, id: string): PropertyDetailResponse {
  // Basic required fields with safe extraction
  // These are the fields that every property must have, so we provide sensible defaults
  const basicFields = {
    id: safeStringExtract(propertyObj.id, id),
    title: safeStringExtract(propertyObj.title, STRING_CONSTANTS.UNTITLED_PROPERTY),
    price: safeNumberExtract(propertyObj.price, 0) || 0,
    images: safeArrayExtract(propertyObj.images, []),
    location: extractLocationData(propertyObj.location),
    features: (propertyObj.features && typeof propertyObj.features === "object")
      ? propertyObj.features as Record<string, unknown>
      : {},
  };

  // Optional fields with safe extraction
  // These fields might not be present in all property data, so we handle them gracefully
  const optionalFields = {
    description: propertyObj.description ? String(propertyObj.description) : undefined,
    amenities: safeStringArrayExtract(propertyObj.amenities),
    lastUpdated: propertyObj.lastUpdated ? String(propertyObj.lastUpdated) : undefined,
    viewCount: safeNumberExtract(propertyObj.viewCount),
    bedrooms: safeNumberExtract(propertyObj.bedrooms),
    bathrooms: safeNumberExtract(propertyObj.bathrooms),
    size: safeNumberExtract(propertyObj.size),
    type: propertyObj.type ? String(propertyObj.type) : undefined,
    status: propertyObj.status ? String(propertyObj.status) : undefined,
    ownerId: propertyObj.ownerId ? String(propertyObj.ownerId) : undefined,
    createdAt: propertyObj.createdAt ? String(propertyObj.createdAt) : undefined,
    updatedAt: propertyObj.updatedAt ? String(propertyObj.updatedAt) : undefined,
  };

  // Combine all fields into the final response
  // This spread operator technique creates a clean, flat object structure
  return {
    ...basicFields,
    ...optionalFields,
  };
}

/**
 * Helper function to extract properties from search results
 * This simplifies the nested ternary operations by handling the various
 * ways that different APIs might structure their response data
 */
function extractPropertiesFromResponse(actualData: Record<string, unknown>): Property[] {
  if (Array.isArray(actualData.properties)) {
    return actualData.properties;
  }
  if (Array.isArray(actualData.data)) {
    return actualData.data;
  }
  return [];
}

/**
 * Helper function to extract total count from search results
 * This simplifies the nested ternary operations and provides a consistent
 * way to get the total count regardless of API response format
 */
function extractTotalCountFromResponse(actualData: Record<string, unknown>): number {
  if (typeof actualData.totalCount === "number") {
    return actualData.totalCount;
  }
  if (typeof actualData.total === "number") {
    return actualData.total;
  }
  return 0;
}

/**
 * Enhanced error handling helper for async operations
 * This centralizes error handling logic and ensures proper logging
 * Think of this as a "translator" that converts any kind of error into
 * a standardized format that our application can understand and handle
 */
function handleAsyncError(error: unknown, context: string): Error {
  const errorMessage = `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  // Use proper error logging instead of console.warn to avoid ESLint warnings
  // We only log in development to avoid cluttering production logs
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(errorMessage, error);
  }
  return error instanceof Error ? error : new Error(errorMessage);
}

/**
 * Unified property hook that consolidates functionality from:
 * - useProperty.ts (property details and CRUD operations)
 * - useLandProperty.ts (land-specific property handling)
 * - usePropertySearch.ts (search and filtering)
 * 
 * This hook provides a single interface for all property-related operations
 * with enhanced error handling, caching, and performance optimizations.
 * 
 * Think of this hook as a "property management control center" that handles
 * all the different ways your application needs to interact with property data.
 */
export function useUnifiedProperty() {
  const queryClient = useQueryClient();

  /**
   * Fetch a single property by ID with enhanced validation and caching
   * Uses simplified validator function to reduce cognitive complexity
   * This is like asking for a specific file from a well-organized filing cabinet
   */
  const usePropertyDetail = (id: string, options: UnifiedPropertyOptions = {}) => {
    const {
      enabled = true,
      staleTime = CACHE_CONFIG.PROPERTY_DETAIL.staleTime,
      gcTime = CACHE_CONFIG.PROPERTY_DETAIL.gcTime,
    } = options;

    return useSafeQuery<PropertyDetailResponse | null>({
      endpoint: `/api/properties/${id}`,
      method: "GET",
      fallbackData: null,
      validator: (data: unknown): PropertyDetailResponse | null => {
        if (!data || typeof data !== "object") return null;

        const response = data as Record<string, unknown>;
        const property = response.data || response;

        if (!property || typeof property !== "object") return null;

        const propertyObj = property as Record<string, unknown>;
        return validatePropertyData(propertyObj, id);
      },
      enabled: Boolean(id) && id.length > 0 && enabled,
      // Notice: We now use STRING_CONSTANTS directly instead of CONTEXT_NAMES
      // This eliminates the duplicate string literals and maintains consistency
      context: STRING_CONSTANTS.PROPERTY_DETAIL,
      cacheKey: generateCacheKey.propertyDetail(id),
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  /**
   * Fetch land property with mock data fallback and proper error handling
   * Addresses ESLint warnings about unused variables and unhandled exceptions
   * This handles the special case where we might not have real data yet,
   * so we gracefully fall back to mock data for development and testing
   */
  const useLandProperty = (id: string, options: UnifiedPropertyOptions = {}) => {
    const { enabled = true } = options;
    // Note: staleTime and gcTime removed as they weren't being used in the custom implementation

    const [landData, setLandData] = useState<MockLandProperty | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (!id || id.length === 0 || !enabled) return;

      const fetchLandData = async () => {
        setIsLoading(true);
        setError(null);

        try {
          // First try the real API endpoint
          const response = await fetch(`/api/land-properties/${id}`);
          if (response.ok) {
            const data = await response.json();
            setLandData(data.data || data);
            return;
          }
        } catch (apiError) {
          // Handle API error properly instead of silent catch
          const handledError = handleAsyncError(apiError, 'API fetch failed');
          // Use proper error logging instead of console.warn to avoid ESLint warnings
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('API endpoint unavailable, falling back to mock data:', handledError.message);
          }
        }

        // Fallback to mock data if API fails or doesn't have the property
        // This provides a smooth development experience even when backend isn't ready
        try {
          if (hasMockLandProperty(id)) {
            const mockData = await fetchMockLandProperty(id);
            setLandData(mockData);
          } else {
            setLandData(null);
          }
        } catch (mockError) {
          const handledError = handleAsyncError(mockError, 'Mock data fetch failed');
          setError(handledError);
        }
      };

      // Properly handle the promise chain to address ESLint promise/catch-or-return warning
      void fetchLandData()
        .catch((err) => {
          const handledError = handleAsyncError(err, STRING_CONSTANTS.FAILED_TO_FETCH);
          setError(handledError);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [id, enabled]);

    return {
      data: landData,
      isLoading,
      error,
    };
  };

  /**
   * Fetch multiple properties with advanced filtering and pagination
   * This is like asking for a filtered and sorted list from a database
   * The debouncing prevents too many API calls when users are typing quickly
   */
  const useProperties = (
    searchParams: Partial<PropertySearchParams> = {},
    options: UnifiedPropertyOptions = {}
  ) => {
    const {
      enabled = true,
      staleTime = CACHE_CONFIG.PROPERTIES_LIST.staleTime,
      gcTime = CACHE_CONFIG.PROPERTIES_LIST.gcTime,
      debounceMs = 300,
    } = options;

    // Debounce search parameters to reduce API calls
    // This waits for the user to stop typing before making the API call
    const debouncedParams = useDebounce(searchParams, debounceMs);

    return useSafeQuery<PropertiesResponse>({
      endpoint: "/api/properties",
      method: "GET",
      body: debouncedParams as Record<string, unknown>,
      fallbackData: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false,
      },
      validator: (data: unknown): PropertiesResponse | null => {
        if (!data || typeof data !== "object") return null;

        const response = data as Record<string, unknown>;
        const actualData = (response.success ? response.data || response : response) as Record<string, unknown>;

        return {
          data: Array.isArray(actualData.data) ? actualData.data : [],
          total: typeof actualData.total === "number" ? actualData.total : 0,
          page: typeof actualData.page === "number" ? actualData.page : 1,
          limit: typeof actualData.limit === "number" ? actualData.limit : 10,
          hasNext: Boolean(actualData.hasNext),
          hasPrev: Boolean(actualData.hasPrev),
        };
      },
      enabled,
      // Using STRING_CONSTANTS directly eliminates duplicate string literals
      context: STRING_CONSTANTS.PROPERTIES_LIST,
      cacheKey: useMemo(
        () => generateCacheKey.propertiesList(debouncedParams),
        [debouncedParams]
      ),
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  /**
   * Advanced property search with intelligent filtering and suggestions
   * Uses helper functions to simplify complex ternary operations
   * This is like having a smart search engine that understands property-specific queries
   */
  const usePropertySearch = (
    searchQuery: string,
    filters: Partial<PropertySearchParams> = {},
    options: UnifiedPropertyOptions = {}
  ) => {
    const {
      enabled = true,
      staleTime = CACHE_CONFIG.PROPERTIES_LIST.staleTime,
      gcTime = CACHE_CONFIG.PROPERTIES_LIST.gcTime,
      debounceMs = 500,
    } = options;

    // Combine search query with filters into a single search request
    // This creates a comprehensive search that considers both text and structured filters
    const searchParams = useMemo(() => ({
      ...filters,
      query: searchQuery,
    }), [searchQuery, filters]);

    const debouncedSearchParams = useDebounce(searchParams, debounceMs);

    return useSafeQuery<SearchResult>({
      endpoint: "/api/properties/search",
      method: "POST",
      body: debouncedSearchParams as Record<string, unknown>,
      fallbackData: {
        properties: [],
        totalCount: 0,
        hasNextPage: false,
        searchMetrics: undefined,
      },
      validator: (data: unknown): SearchResult | null => {
        if (!data || typeof data !== "object") return null;

        const response = data as Record<string, unknown>;
        const actualData = (response.success ? response.data || response : response) as Record<string, unknown>;

        return {
          properties: extractPropertiesFromResponse(actualData),
          totalCount: extractTotalCountFromResponse(actualData),
          hasNextPage: Boolean(actualData.hasNextPage || actualData.hasNext),
          searchMetrics: actualData.searchMetrics as SearchResult["searchMetrics"],
        };
      },
      enabled: enabled && searchQuery.trim().length > 0,
      // Using STRING_CONSTANTS directly for consistency
      context: STRING_CONSTANTS.PROPERTY_SEARCH,
      cacheKey: useMemo(
        () => generateCacheKey.propertySearch(debouncedSearchParams),
        [debouncedSearchParams]
      ),
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  /**
   * Create a new property with optimistic updates
   * Optimistic updates mean we update the UI immediately, assuming the operation
   * will succeed, then fix it later if there's an error. This makes the app feel faster.
   */
  const useCreateProperty = () => {
    return useOptimisticMutation({
      mutationFn: (propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">) =>
        propertyApi.createProperty(propertyData),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, newProperty: Property) => {
        const currentData = oldData as PropertiesResponse | undefined;
        if (!currentData?.data) return currentData;

        // Add the new property to the beginning of the list
        return {
          ...currentData,
          data: [newProperty, ...currentData.data],
          total: currentData.total + 1,
          hasNext: currentData.hasNext || currentData.data.length >= currentData.limit - 1,
        };
      },
      onSettled: () => {
        // Invalidate all property-related queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
      },
    });
  };

  /**
   * Update an existing property with optimistic updates
   * This allows users to see their changes immediately while the update
   * is being processed in the background
   */
  const useUpdateProperty = () => {
    return useOptimisticMutation({
      mutationFn: ({ id, updates, userId }: {
        id: string;
        updates: Partial<Property>;
        userId: string;
      }) => propertyApi.updateProperty(id, updates, userId),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, variables: { id: string; updates: Partial<Property> }) => {
        const currentData = oldData as PropertiesResponse | undefined;
        if (!currentData?.data) return currentData;

        // Find and update the specific property in the list
        return {
          ...currentData,
          data: currentData.data.map((property: Property) => {
            if (property.id === variables.id) {
              return { ...property, ...variables.updates };
            }
            return property;
          }),
        };
      },
      onSettled: (data, _error, variables) => {
        // Update specific property cache with the latest data
        if (data) {
          queryClient.setQueryData([generateCacheKey.propertyDetail(variables.id)], data);
        }

        // Invalidate related queries to ensure consistency across the app
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
      },
    });
  };

  /**
   * Delete a property with optimistic updates
   * Immediately removes the property from the UI while processing the deletion
   * in the background, providing instant feedback to the user
   */
  const useDeleteProperty = () => {
    return useOptimisticMutation({
      mutationFn: ({ id, userId }: { id: string; userId: string }) =>
        propertyApi.deleteProperty(id, userId),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, variables: { id: string }) => {
        const currentData = oldData as PropertiesResponse | undefined;
        if (!currentData?.data) return currentData;

        // Remove the property from the list and adjust the total count
        return {
          ...currentData,
          data: currentData.data.filter((property: Property) => property.id !== variables.id),
          total: Math.max(0, currentData.total - 1),
        };
      },
      onSettled: (_data, _error, variables) => {
        // Remove the specific property from cache since it no longer exists
        queryClient.removeQueries({ queryKey: [generateCacheKey.propertyDetail(variables.id)] });

        // Invalidate related queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
      },
    });
  };

  // Return all the hooks and utility functions as a cohesive API
  // This creates a clean, organized interface for components to use
  return {
    // Query hooks for fetching data
    usePropertyDetail,
    useLandProperty,
    useProperties,
    usePropertySearch,

    // Mutation hooks for modifying data
    useCreateProperty,
    useUpdateProperty,
    useDeleteProperty,

    // Utility functions for cache management
    invalidatePropertyQueries: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
      queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.LAND_PROPERTY] });
    },

    clearPropertyCache: (propertyId?: string) => {
      if (propertyId) {
        // Clear cache for a specific property
        queryClient.removeQueries({ queryKey: [generateCacheKey.propertyDetail(propertyId)] });
        queryClient.removeQueries({ queryKey: [generateCacheKey.landProperty(propertyId)] });
      } else {
        // Clear all property-related cache
        queryClient.removeQueries({ queryKey: ["properties"] });
        queryClient.removeQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
        queryClient.removeQueries({ queryKey: [STRING_CONSTANTS.LAND_PROPERTY] });
      }
    },
  };
}

/**
 * Specialized hook for property search with enhanced features
 * This provides backward compatibility while leveraging the unified hook
 * Think of this as a "preset configuration" for search-focused use cases
 */
export function usePropertySearch(
  initialQuery = "",
  initialFilters: Partial<PropertySearchParams> = {}
) {
  const { usePropertySearch } = useUnifiedProperty();

  return usePropertySearch(initialQuery, initialFilters, {
    debounceMs: 400, // Slightly longer debounce for search to reduce API calls
    staleTime: 3 * 60 * 1000, // 3 minutes for search results - shorter than detail views
  });
}

/**
 * Specialized hook for land properties with enhanced mock data support
 * This provides a focused interface for land-specific property operations
 */
export function useLandProperty(id: string) {
  const { useLandProperty } = useUnifiedProperty();

  return useLandProperty(id, {
    // Custom options can be added here if needed for land properties
    // For example, you might want different caching strategies for land vs. regular properties
  });
}

export default useUnifiedProperty;

// Backward compatibility
export const useEnhancedPropertySearch = usePropertySearch
export const useEnhancedLandProperty = useLandProperty
