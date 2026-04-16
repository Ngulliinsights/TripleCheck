import { useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { queryKeys } from "../../infrastructure/api/queryClient"
import { useDebounce } from '../../local/hooks/useDebounce"
import { useOptimisticMutation } from '../../local/hooks/useOptimisticMutation"
import { useSafeQuery } from '../../local/hooks/useSafeQuery"
import { Property as ApiProperty, PropertySearchParams as ApiPropertySearchParams } from '../../local/types/api.types"
import { Property } from '../../../../shared/types/property"
import { propertyApi } from "../services/property-api"

// Enhanced type definitions that properly handle optional properties with exactOptionalPropertyTypes
interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?:
    | {
        lat: number;
        lng: number;
      }
    | undefined; // Explicitly handle undefined for exactOptionalPropertyTypes
}

interface PropertiesResponse {
  data: ApiProperty[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OwnerPropertiesResponse {
  data: ApiProperty[];
  total?: number | undefined; // Explicitly handle undefined for exactOptionalPropertyTypes
}

// Fixed PropertyDetailResponse to avoid inheritance conflicts
// Instead of extending Property with conflicts, we create a clean interface
interface PropertyDetailResponse {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: LocationData;
  features: Record<string, unknown>;
  // These fields may or may not be present in the base Property interface
  // By defining them explicitly, we avoid inheritance conflicts
  description?: string | undefined;
  amenities?: string[] | undefined;
  lastUpdated?: string | undefined;
  viewCount?: number | undefined;
  // Include any other fields that might be in the base Property interface
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  size?: number | undefined;
  type?: string | undefined;
  status?: string | undefined;
  ownerId?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

// Constants to avoid string duplication - addressing sonarjs/no-duplicate-string
const CACHE_KEYS = {
  OWNER_PROPERTIES: "owner-properties",
  PROPERTIES: "properties",
  PROPERTY_DETAIL: "property",
} as const;

const ENDPOINTS = {
  PROPERTIES: "/api/properties",
  PROPERTY_DETAIL: (id: string) => `/api/properties/${id}`,
  OWNER_PROPERTIES: (ownerId: string) => `/api/properties/owner/${ownerId}`,
} as const;

// Enhanced cache configuration with properly typed retry functions
const CACHE_CONFIG = {
  PROPERTIES_LIST: {
    staleTime: 5 * 60 * 1000, // 5 minutes - frequent updates expected
    gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cleanup time
    retry: 3, // Enhanced error recovery
    retryDelay: (attemptIndex: number): number =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  PROPERTY_DETAIL: {
    staleTime: 10 * 60 * 1000, // 10 minutes - more stable data
    gcTime: 30 * 60 * 1000, // 30 minutes - longer retention for detail views
    retry: 2,
    retryDelay: (attemptIndex: number): number =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  },
  OWNER_PROPERTIES: {
    staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - moderate retention
    retry: 3,
    retryDelay: (attemptIndex: number): number =>
      Math.min(1000 * 2 ** attemptIndex, 20000),
  },
} as const;

// Standardized query keys using infrastructure configuration
export const propertyKeys = queryKeys.properties;

// Enhanced utility functions for better data validation and transformation
function validateLocationData(location: unknown): LocationData {
  if (typeof location === "string") {
    // Transform string location to object structure for backward compatibility
    return {
      address: location,
      city: "",
      state: "",
      country: "",
      // Explicitly set coordinates as undefined to satisfy exactOptionalPropertyTypes
      coordinates: undefined,
    };
  }

  if (!location || typeof location !== "object") {
    return {
      address: "",
      city: "",
      state: "",
      country: "",
      coordinates: undefined,
    };
  }

  const loc = location as Record<string, unknown>;
  const hasValidCoordinates =
    loc.coordinates &&
    typeof loc.coordinates === "object" &&
    loc.coordinates != null;

  return {
    address: String(loc.address || ""),
    city: String(loc.city || ""),
    state: String(loc.state || ""),
    country: String(loc.country || ""),
    // Properly handle coordinates to satisfy exactOptionalPropertyTypes
    coordinates:
      hasValidCoordinates ?
        {
          lat: Number((loc.coordinates as Record<string, unknown>).lat) || 0,
          lng: Number((loc.coordinates as Record<string, unknown>).lng) || 0,
        }
      : undefined,
  };
}

function createDebugLogger(context: string) {
  return (message: string, data?: unknown) => {
    // Using a more sophisticated logging approach that can be easily toggled
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(`[${context}] ${message}`, data);
    }
  };
}

// Helper function to extract and validate property data from API response
function extractPropertyFromResponse(
  data: unknown,
  _id: string
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const response = data as Record<string, unknown>;
  const property = response.data || response;

  if (!property || typeof property !== "object") {
    return null;
  }

  return property as Record<string, unknown>;
}

// Helper function to extract core property fields
function extractCorePropertyFields(
  propertyObj: Record<string, unknown>,
  id: string,
  locationData: LocationData
) {
  return {
    id: String(propertyObj.id || id),
    title: String(propertyObj.title || "Untitled Property"),
    price: typeof propertyObj.price === "number" ? propertyObj.price : 0,
    images: Array.isArray(propertyObj.images) ? propertyObj.images : [],
    location: locationData,
    features:
      propertyObj.features && typeof propertyObj.features === "object" ?
        (propertyObj.features as Record<string, unknown>)
      : {},
  };
}

// Helper function to extract optional property fields
function extractOptionalPropertyFields(propertyObj: Record<string, unknown>) {
  return {
    description:
      propertyObj.description ? String(propertyObj.description) : undefined,
    amenities:
      Array.isArray(propertyObj.amenities) ? propertyObj.amenities : undefined,
    lastUpdated:
      propertyObj.lastUpdated ? String(propertyObj.lastUpdated) : undefined,
    viewCount:
      typeof propertyObj.viewCount === "number" ?
        propertyObj.viewCount
      : undefined,
    bedrooms:
      typeof propertyObj.bedrooms === "number" ?
        propertyObj.bedrooms
      : undefined,
    bathrooms:
      typeof propertyObj.bathrooms === "number" ?
        propertyObj.bathrooms
      : undefined,
    size: typeof propertyObj.size === "number" ? propertyObj.size : undefined,
    type: propertyObj.type ? String(propertyObj.type) : undefined,
    status: propertyObj.status ? String(propertyObj.status) : undefined,
    ownerId: propertyObj.ownerId ? String(propertyObj.ownerId) : undefined,
    createdAt:
      propertyObj.createdAt ? String(propertyObj.createdAt) : undefined,
    updatedAt:
      propertyObj.updatedAt ? String(propertyObj.updatedAt) : undefined,
  };
}

// Helper function to create validated property response
function createValidatedPropertyResponse(
  propertyObj: Record<string, unknown>,
  id: string,
  locationData: LocationData
): PropertyDetailResponse {
  const coreFields = extractCorePropertyFields(propertyObj, id, locationData);
  const optionalFields = extractOptionalPropertyFields(propertyObj);

  return {
    ...coreFields,
    ...optionalFields,
  };
}

/**
 * Enhanced hook for fetching properties with advanced search and pagination capabilities
 * Features: debouncing, intelligent caching, error recovery, and optimistic loading states
 * 
 * @deprecated This hook is deprecated in favor of useUnifiedProperty from useUnifiedProperty.ts
 * Please migrate to useUnifiedProperty().useProperties for better error handling, caching, and performance.
 * Migration guide: Replace useProperties(params) with useUnifiedProperty().useProperties(params)
 */
export function useProperties(params: Partial<ApiPropertySearchParams> = {}) {
  const logger = createDebugLogger("useProperties");
  
  // Add deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] useProperties is deprecated. Please migrate to useUnifiedProperty().useProperties from useUnifiedProperty.ts for better error handling and performance."
    );
  }

  // Enhanced debouncing with variable delay based on search complexity
  const searchComplexity = Object.keys(params).length;
  const debounceDelay = Math.min(300 + searchComplexity * 50, 800);
  const debouncedParams = useDebounce(params, debounceDelay);

  logger("Fetching properties with params", debouncedParams);

  return useSafeQuery<PropertiesResponse>({
    endpoint: ENDPOINTS.PROPERTIES,
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
      if (!data || typeof data !== "object") {
        logger("Invalid response data structure");
        return null;
      }

      const response = data as Record<string, unknown>;

      // Handle the API response format which includes a 'success' field
      const actualData = (response.success ? response.data || response : response) as Record<string, unknown>;

      const validatedResponse = {
        data: Array.isArray(actualData.data) ? actualData.data : [],
        total: typeof actualData.total === "number" ? actualData.total : 0,
        page: typeof actualData.page === "number" ? actualData.page : 1,
        limit: typeof actualData.limit === "number" ? actualData.limit : 10,
        hasNext: Boolean(actualData.hasNext),
        hasPrev: Boolean(actualData.hasPrev),
      };

      logger("Properties data validated successfully", {
        count: validatedResponse.data.length,
        total: validatedResponse.total,
        success: response.success,
      });

      return validatedResponse;
    },
    debounceMs: debounceDelay,
    deduplicate: true,
    context: "properties-list",
    cacheKey: useMemo(
      () => `${CACHE_KEYS.PROPERTIES}-${JSON.stringify(debouncedParams)}`,
      [debouncedParams]
    ),
    ...CACHE_CONFIG.PROPERTIES_LIST,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: true,
    // Removed refetchInterval as it's not supported by SafeQueryOptions
  });
}

/**
 * Enhanced hook for fetching detailed property information
 * Features: comprehensive validation, location data transformation, and enhanced caching
 * 
 * @deprecated This hook is deprecated in favor of useUnifiedProperty from useUnifiedProperty.ts
 * Please migrate to useUnifiedProperty().usePropertyDetail for better error handling, caching, and performance.
 * Migration guide: Replace useProperty(id) with useUnifiedProperty().usePropertyDetail(id)
 */
export function useProperty(id: string) {
  const logger = createDebugLogger("useProperty");
  
  // Add deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] useProperty is deprecated. Please migrate to useUnifiedProperty().usePropertyDetail from useUnifiedProperty.ts for better error handling and performance."
    );
  }

  return useSafeQuery<PropertyDetailResponse | null>({
    endpoint: ENDPOINTS.PROPERTY_DETAIL(id),
    method: "GET",
    fallbackData: null,
    validator: (data: unknown): PropertyDetailResponse | null => {
      const propertyObj = extractPropertyFromResponse(data, id);

      if (!propertyObj) {
        logger("Invalid property data received", { id });
        return null;
      }

      const locationData = validateLocationData(propertyObj.location);
      const validatedProperty = createValidatedPropertyResponse(
        propertyObj,
        id,
        locationData
      );

      logger("Property data validated successfully", {
        id,
        title: validatedProperty.title,
      });

      return validatedProperty;
    },
    enabled: Boolean(id) && id.length > 0,
    context: "property-detail",
    cacheKey: `${CACHE_KEYS.PROPERTY_DETAIL}-${id}`,
    ...CACHE_CONFIG.PROPERTY_DETAIL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Removed notifyOnChangeProps as it's not supported by SafeQueryOptions
  });
}

/**
 * Enhanced hook for fetching owner properties with improved pagination and filtering
 * Features: owner-specific caching strategies and enhanced error handling
 * 
 * @deprecated This hook is deprecated in favor of useSafeQuery with custom configuration
 * Please migrate to useSafeQuery with owner-specific endpoint configuration.
 * Migration guide: Use useSafeQuery({ endpoint: `/api/properties/owner/${ownerId}`, ... })
 */
export function useOwnerProperties(ownerId: string, includeTotal = false) {
  const logger = createDebugLogger("useOwnerProperties");
  
  // Add deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] useOwnerProperties is deprecated. Please migrate to useSafeQuery with custom configuration for better error handling and performance."
    );
  }

  return useSafeQuery<OwnerPropertiesResponse>({
    endpoint: ENDPOINTS.OWNER_PROPERTIES(ownerId),
    method: "GET",
    body: includeTotal ? { includeTotal: true } : undefined,
    fallbackData: { data: [] },
    validator: (data: unknown): OwnerPropertiesResponse | null => {
      if (!data || typeof data !== "object") {
        logger("Invalid owner properties data", { ownerId });
        return null;
      }

      const response = data as Record<string, unknown>;

      // Properly handle the total field to satisfy exactOptionalPropertyTypes
      const total =
        typeof response.total === "number" ? response.total : undefined;

      const validatedResponse: OwnerPropertiesResponse = {
        data: Array.isArray(response.data) ? response.data : [],
        ...(total !== undefined && { total }), // Only include total if it exists
      };

      logger("Owner properties validated", {
        ownerId,
        count: validatedResponse.data.length,
        total: validatedResponse.total,
      });

      return validatedResponse;
    },
    enabled: Boolean(ownerId) && ownerId.length > 0,
    context: CACHE_KEYS.OWNER_PROPERTIES,
    cacheKey: `${CACHE_KEYS.OWNER_PROPERTIES}-${ownerId}-${includeTotal}`,
    ...CACHE_CONFIG.OWNER_PROPERTIES,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Enhanced mutation hook for creating properties with comprehensive optimistic updates
 * Features: enhanced error handling, rollback capabilities, and intelligent cache updates
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const logger = createDebugLogger("useCreateProperty");

  return useOptimisticMutation({
    mutationFn: (propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">) => propertyApi.createProperty(propertyData),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (oldData: unknown, newProperty: Property) => {
      const currentData = oldData as PropertiesResponse | undefined;
      if (!currentData?.data) {
        logger("No existing data for optimistic update");
        return currentData;
      }

      // Following sonarjs/prefer-immediate-return by returning directly
      return {
        ...currentData,
        data: [newProperty, ...currentData.data],
        total: currentData.total + 1,
        hasNext:
          currentData.hasNext ||
          currentData.data.length >= currentData.limit - 1,
      };
    },
    onError: (error, variables, context) => {
      logger("Property creation failed", {
        error: error.message,
        propertyTitle: variables?.title,
      });
      // Enhanced error reporting without exposing sensitive information
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Create property mutation failed:", {
          error: error.message,
          variables,
          context,
        });
      }
    },
    onSuccess: (data, variables) => {
      // Handle the data properly - extract property from API response
      const property =
        (data as unknown as { data?: ApiProperty })?.data ||
        (data as unknown as ApiProperty);
      const propertyId = property?.id || "unknown";
      logger("Property created successfully", {
        propertyId,
        title: variables?.title,
      });
    },
    onSettled: () => {
      // Strategic cache invalidation with improved granularity
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.PROPERTIES],
        exact: false,
      });

      // Invalidate owner properties if we know the owner
      const ownerQueries = queryClient.getQueryCache().findAll({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === CACHE_KEYS.OWNER_PROPERTIES,
      });

      ownerQueries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });

      logger("Cache invalidation completed after property creation");
    },
  });
}

/**
 * Enhanced mutation hook for updating properties with granular optimistic updates
 * Features: field-level updates, enhanced rollback, and smart cache synchronization
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const logger = createDebugLogger("useUpdateProperty");

  return useOptimisticMutation({
    mutationFn: ({
      id,
      updates,
      userId,
    }: {
      id: string;
      updates: Partial<Property>;
      userId: string;
    }) => propertyApi.updateProperty(id, updates, userId),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (
      oldData: unknown,
      variables: { id: string; updates: Partial<Property> }
    ) => {
      const currentData = oldData as PropertiesResponse | undefined;
      if (!currentData?.data) return currentData;

      // Following sonarjs/prefer-immediate-return by returning directly
      return {
        ...currentData,
        data: currentData.data.map((property: ApiProperty) => {
          if (property.id === variables.id) {
            const updatedProperty = { ...property, ...variables.updates };
            logger("Applied optimistic update", {
              propertyId: variables.id,
              updatedFields: Object.keys(variables.updates),
            });
            return updatedProperty;
          }
          return property;
        }),
      };
    },
    onError: (error, variables, context) => {
      logger("Property update failed", {
        error: error.message,
        propertyId: variables?.id,
        updatedFields: variables?.updates ? Object.keys(variables.updates) : [],
      });

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Update property mutation failed:", {
          error: error.message,
          propertyId: variables?.id,
          updates: variables?.updates,
          context,
        });
      }
    },
    onSuccess: (_data, variables) => {
      logger("Property updated successfully", {
        propertyId: variables.id,
        updatedFields: Object.keys(variables.updates),
      });
    },
    onSettled: (data, _error, variables) => {
      // Enhanced cache synchronization
      if (data) {
        // Update the specific property detail cache
        queryClient.setQueryData(
          [CACHE_KEYS.PROPERTY_DETAIL, variables.id],
          data
        );
        logger("Updated property detail cache", { propertyId: variables.id });
      }

      // Strategic invalidation of related queries
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.PROPERTIES],
        exact: false,
      });

      // Invalidate owner properties cache for the property owner
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.OWNER_PROPERTIES],
        exact: false,
      });
    },
  });
}

/**
 * Enhanced mutation hook for deleting properties with comprehensive cleanup
 * Features: optimistic removal, cascade cleanup, and enhanced error recovery
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const logger = createDebugLogger("useDeleteProperty");

  return useOptimisticMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      propertyApi.deleteProperty(id, userId),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (oldData: unknown, variables: { id: string }) => {
      const currentData = oldData as PropertiesResponse | undefined;
      if (!currentData?.data) return currentData;

      // Following sonarjs/prefer-immediate-return by returning directly
      return {
        ...currentData,
        data: currentData.data.filter(
          (property: ApiProperty) => property.id !== variables.id
        ),
        total: Math.max(0, currentData.total - 1),
      };
    },
    onError: (error, variables, context) => {
      logger("Property deletion failed", {
        error: error.message,
        propertyId: variables?.id,
      });

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Delete property mutation failed:", {
          error: error.message,
          propertyId: variables?.id,
          context,
        });
      }
    },
    onSuccess: (_data, variables) => {
      logger("Property deleted successfully", { propertyId: variables.id });
    },
    onSettled: (_data, _error, variables) => {
      // Comprehensive cache cleanup
      queryClient.removeQueries({
        queryKey: [CACHE_KEYS.PROPERTY_DETAIL, variables.id],
      });

      // Remove from all related query caches
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.PROPERTIES],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.OWNER_PROPERTIES],
        exact: false,
      });

      logger("Completed cache cleanup after property deletion", {
        propertyId: variables.id,
      });
    },
  });
}
