import { useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

import { useDebounce } from "../../local/hooks/useDebounce";
import { useOptimisticMutation, type OptimisticContext } from "../../local/hooks/useOptimisticMutation";
import { useSafeQuery } from "../../local/hooks/useSafeQuery";
import { Property } from "@shared/types/property";
import {
  fetchMockLandProperty,
  hasMockLandProperty,
  type MockLandProperty,
} from "../services/mock-land-data";
import { type ApiResponse } from "../../local/types/api.types";
import { propertyApi } from "../services/property-api";
import { PropertySearchParams } from "../types/property.types";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  searchMetrics?:
    | {
        responseTime: number;
        totalResults: number;
        appliedFilters: string[];
      }
    | undefined;
}

interface LandPropertyResult {
  data: MockLandProperty | null;
  isLoading: boolean;
  error: Error | null;
}

type SafeQueryResult<T> = ReturnType<typeof useSafeQuery<T>>;

// Per-mutation variable shapes.
type CreatePropertyVars = Omit<Property, "id" | "createdAt" | "updatedAt">;
type UpdatePropertyVars = { id: string; updates: Partial<Property>; userId: string };
type DeletePropertyVars = { id: string; userId: string };

// Specific result types — a shared ReturnType<typeof useOptimisticMutation> alias
// collapses all generics to unknown and fails due to function parameter contravariance.
type CreateMutationResult = UseMutationResult<ApiResponse<Property>, unknown, CreatePropertyVars, OptimisticContext<unknown>>;
type UpdateMutationResult = UseMutationResult<ApiResponse<Property>, unknown, UpdatePropertyVars, OptimisticContext<unknown>>;
type DeleteMutationResult = UseMutationResult<ApiResponse<void>,    unknown, DeletePropertyVars, OptimisticContext<unknown>>;

interface UnifiedPropertyHooks {
  usePropertyDetail: (id: string, options?: UnifiedPropertyOptions) => SafeQueryResult<PropertyDetailResponse | null>;
  useLandProperty: (id: string, options?: UnifiedPropertyOptions) => LandPropertyResult;
  useProperties: (params?: Partial<PropertySearchParams>, options?: UnifiedPropertyOptions) => SafeQueryResult<PropertiesResponse>;
  usePropertySearch: (query: string, filters?: Partial<PropertySearchParams>, options?: UnifiedPropertyOptions) => SafeQueryResult<SearchResult>;
  useCreateProperty: () => CreateMutationResult;
  useUpdateProperty: () => UpdateMutationResult;
  useDeleteProperty: () => DeleteMutationResult;
  invalidatePropertyQueries: () => void;
  clearPropertyCache: (propertyId?: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_CONFIG = {
  PROPERTY_DETAIL: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 2 },
  PROPERTIES_LIST: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 3 },
} as const;

const CTX = {
  PROPERTY_DETAIL: "property-detail",
  LAND_PROPERTY: "land-property",
  PROPERTIES_LIST: "properties-list",
  PROPERTY_SEARCH: "property-search",
} as const;

const cacheKey = {
  propertyDetail: (id: string) => `${CTX.PROPERTY_DETAIL}-${id}`,
  landProperty: (id: string) => `${CTX.LAND_PROPERTY}-${id}`,
  propertiesList: (params: Record<string, unknown>) =>
    `${CTX.PROPERTIES_LIST}-${JSON.stringify(params)}`,
  propertySearch: (params: Record<string, unknown>) =>
    `${CTX.PROPERTY_SEARCH}-${JSON.stringify(params)}`,
} as const;

// ─── Data helpers ─────────────────────────────────────────────────────────────

function safeStr(value: unknown, fallback: string): string {
  return value ? String(value) : fallback;
}

function safeNum(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function safeStrArr(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((v): v is string => typeof v === "string");
  return filtered.length > 0 ? filtered : undefined;
}

function extractLocation(location: unknown): string {
  if (typeof location === "string") return location;
  if (location && typeof location === "object") {
    return (location as { address?: string }).address ?? "Location not specified";
  }
  return "Location not specified";
}

function validatePropertyData(
  propertyObj: Record<string, unknown>,
  id: string
): PropertyDetailResponse {
  const result: PropertyDetailResponse = {
    id: safeStr(propertyObj.id, id),
    title: safeStr(propertyObj.title, "Untitled Property"),
    price: safeNum(propertyObj.price) ?? 0,
    images: Array.isArray(propertyObj.images) ? propertyObj.images : [],
    location: extractLocation(propertyObj.location),
    features:
      propertyObj.features && typeof propertyObj.features === "object"
        ? (propertyObj.features as Record<string, unknown>)
        : {},
  };

  if (propertyObj.description) result.description = String(propertyObj.description);
  const amenities = safeStrArr(propertyObj.amenities);
  if (amenities) result.amenities = amenities;
  if (propertyObj.lastUpdated) result.lastUpdated = String(propertyObj.lastUpdated);

  const numFields = ["viewCount", "bedrooms", "bathrooms", "size"] as const;
  for (const field of numFields) {
    const v = safeNum(propertyObj[field]);
    if (v !== undefined) (result as unknown as Record<string, unknown>)[field] = v;
  }

  const strFields = ["type", "status", "ownerId", "createdAt", "updatedAt"] as const;
  for (const field of strFields) {
    if (propertyObj[field]) (result as unknown as Record<string, unknown>)[field] = String(propertyObj[field]);
  }

  return result;
}

function extractProperties(data: Record<string, unknown>): Property[] {
  if (Array.isArray(data.properties)) return data.properties;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function extractTotal(data: Record<string, unknown>): number {
  if (typeof data.totalCount === "number") return data.totalCount;
  if (typeof data.total === "number") return data.total;
  return 0;
}

function handleAsyncError(error: unknown, context: string): Error {
  const message = `${context}: ${error instanceof Error ? error.message : "Unknown error"}`;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(message, error);
  }
  return error instanceof Error ? error : new Error(message);
}

// ─── Unified hook ─────────────────────────────────────────────────────────────

export function useUnifiedProperty(): UnifiedPropertyHooks {
  const queryClient = useQueryClient();

  const usePropertyDetail = (
    id: string,
    options: UnifiedPropertyOptions = {}
  ): SafeQueryResult<PropertyDetailResponse | null> => {
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
        const property = response.data ?? response;
        if (!property || typeof property !== "object") return null;
        return validatePropertyData(property as Record<string, unknown>, id);
      },
      enabled: Boolean(id) && id.length > 0 && enabled,
      context: CTX.PROPERTY_DETAIL,
      cacheKey: cacheKey.propertyDetail(id),
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  const useLandProperty = (
    id: string,
    options: UnifiedPropertyOptions = {}
  ): LandPropertyResult => {
    const { enabled = true } = options;

    const [landData, setLandData] = useState<MockLandProperty | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (!id || id.length === 0 || !enabled) return;

      const fetchLandData = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch(`/api/land-properties/${id}`);
          if (response.ok) {
            const data = await response.json();
            setLandData(data.data ?? data);
            return;
          }
        } catch (apiError) {
          const err = handleAsyncError(apiError, "API fetch failed");
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("Falling back to mock data:", err.message);
          }
        }

        try {
          if (hasMockLandProperty(id)) {
            setLandData(await fetchMockLandProperty(id));
          } else {
            setLandData(null);
          }
        } catch (mockError) {
          setError(handleAsyncError(mockError, "Mock data fetch failed"));
        }
      };

      void fetchLandData()
        .catch((err) => setError(handleAsyncError(err, "Failed to fetch land property")))
        .finally(() => setIsLoading(false));
    }, [id, enabled]);

    return { data: landData, isLoading, error };
  };

  const useProperties = (
    searchParams: Partial<PropertySearchParams> = {},
    options: UnifiedPropertyOptions = {}
  ): SafeQueryResult<PropertiesResponse> => {
    const {
      enabled = true,
      staleTime = CACHE_CONFIG.PROPERTIES_LIST.staleTime,
      gcTime = CACHE_CONFIG.PROPERTIES_LIST.gcTime,
      debounceMs = 300,
    } = options;

    const debouncedParams = useDebounce(searchParams, debounceMs);
    const key = useMemo(
      () => cacheKey.propertiesList(debouncedParams as Record<string, unknown>),
      [debouncedParams]
    );

    return useSafeQuery<PropertiesResponse>({
      endpoint: "/api/properties",
      method: "GET",
      body: debouncedParams as Record<string, unknown>,
      fallbackData: { data: [], total: 0, page: 1, limit: 10, hasNext: false, hasPrev: false },
      validator: (data: unknown): PropertiesResponse | null => {
        if (!data || typeof data !== "object") return null;
        const response = data as Record<string, unknown>;
        const actual = (response.success ? response.data ?? response : response) as Record<string, unknown>;
        return {
          data: Array.isArray(actual.data) ? actual.data : [],
          total: typeof actual.total === "number" ? actual.total : 0,
          page: typeof actual.page === "number" ? actual.page : 1,
          limit: typeof actual.limit === "number" ? actual.limit : 10,
          hasNext: Boolean(actual.hasNext),
          hasPrev: Boolean(actual.hasPrev),
        };
      },
      enabled,
      context: CTX.PROPERTIES_LIST,
      cacheKey: key,
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  const usePropertySearch = (
    searchQuery: string,
    filters: Partial<PropertySearchParams> = {},
    options: UnifiedPropertyOptions = {}
  ): SafeQueryResult<SearchResult> => {
    const {
      enabled = true,
      staleTime = CACHE_CONFIG.PROPERTIES_LIST.staleTime,
      gcTime = CACHE_CONFIG.PROPERTIES_LIST.gcTime,
      debounceMs = 500,
    } = options;

    const searchParams = useMemo(
      () => ({ ...filters, query: searchQuery }),
      [searchQuery, filters]
    );
    const debouncedSearchParams = useDebounce(searchParams, debounceMs);
    const key = useMemo(
      () => cacheKey.propertySearch(debouncedSearchParams as Record<string, unknown>),
      [debouncedSearchParams]
    );

    return useSafeQuery<SearchResult>({
      endpoint: "/api/properties/search",
      method: "POST",
      body: debouncedSearchParams as Record<string, unknown>,
      fallbackData: { properties: [], totalCount: 0, hasNextPage: false, searchMetrics: undefined },
      validator: (data: unknown): SearchResult | null => {
        if (!data || typeof data !== "object") return null;
        const response = data as Record<string, unknown>;
        const actual = (response.success ? response.data ?? response : response) as Record<string, unknown>;
        return {
          properties: extractProperties(actual),
          totalCount: extractTotal(actual),
          hasNextPage: Boolean(actual.hasNextPage ?? actual.hasNext),
          searchMetrics: actual.searchMetrics as SearchResult["searchMetrics"],
        };
      },
      enabled: enabled && searchQuery.trim().length > 0,
      context: CTX.PROPERTY_SEARCH,
      cacheKey: key,
      staleTime,
      gcTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  };

  const useCreateProperty = (): CreateMutationResult =>
    useOptimisticMutation<ApiResponse<Property>, unknown, CreatePropertyVars>({
      mutationFn: (data: CreatePropertyVars) => propertyApi.createProperty(data),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, variables: CreatePropertyVars) => {
        const current = oldData as PropertiesResponse | undefined;
        if (!current?.data) return current;
        const optimistic = {
          ...variables,
          id: `temp-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Property;
        return {
          ...current,
          data: [optimistic, ...current.data],
          total: current.total + 1,
          hasNext: current.hasNext || current.data.length >= current.limit - 1,
        };
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [CTX.PROPERTY_SEARCH] });
      },
    });

  const useUpdateProperty = (): UpdateMutationResult =>
    useOptimisticMutation<ApiResponse<Property>, unknown, UpdatePropertyVars>({
      mutationFn: ({ id, updates, userId }: UpdatePropertyVars) =>
        propertyApi.updateProperty(id, updates, userId),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, variables: UpdatePropertyVars) => {
        const current = oldData as PropertiesResponse | undefined;
        if (!current?.data) return current;
        return {
          ...current,
          data: current.data.map((p: Property) =>
            p.id === variables.id ? { ...p, ...variables.updates } : p
          ),
        };
      },
      onSettled: (data: ApiResponse<Property> | undefined, _error: unknown, variables: UpdatePropertyVars) => {
        if (data) {
          queryClient.setQueryData([cacheKey.propertyDetail(variables.id)], data);
        }
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [CTX.PROPERTY_SEARCH] });
      },
    });

  const useDeleteProperty = (): DeleteMutationResult =>
    useOptimisticMutation<ApiResponse<void>, unknown, DeletePropertyVars>({
      mutationFn: ({ id, userId }: DeletePropertyVars) =>
        propertyApi.deleteProperty(id, userId),
      queryKey: ["properties", "list"],
      optimisticUpdate: (oldData: unknown, variables: DeletePropertyVars) => {
        const current = oldData as PropertiesResponse | undefined;
        if (!current?.data) return current;
        return {
          ...current,
          data: current.data.filter((p: Property) => p.id !== variables.id),
          total: Math.max(0, current.total - 1),
        };
      },
      onSettled: (_data: ApiResponse<void> | undefined, _error: unknown, variables: DeletePropertyVars) => {
        queryClient.removeQueries({ queryKey: [cacheKey.propertyDetail(variables.id)] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: [CTX.PROPERTY_SEARCH] });
      },
    });

  return {
    usePropertyDetail,
    useLandProperty,
    useProperties,
    usePropertySearch,
    useCreateProperty,
    useUpdateProperty,
    useDeleteProperty,
    invalidatePropertyQueries: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: [CTX.PROPERTY_SEARCH] });
      queryClient.invalidateQueries({ queryKey: [CTX.LAND_PROPERTY] });
    },
    clearPropertyCache: (propertyId?: string) => {
      if (propertyId) {
        queryClient.removeQueries({ queryKey: [cacheKey.propertyDetail(propertyId)] });
        queryClient.removeQueries({ queryKey: [cacheKey.landProperty(propertyId)] });
      } else {
        queryClient.removeQueries({ queryKey: ["properties"] });
        queryClient.removeQueries({ queryKey: [CTX.PROPERTY_SEARCH] });
        queryClient.removeQueries({ queryKey: [CTX.LAND_PROPERTY] });
      }
    },
  };
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export function usePropertySearch(
  initialQuery = "",
  initialFilters: Partial<PropertySearchParams> = {}
) {
  // Alias the inner sub-hook to avoid shadowing this function's own name.
  const { usePropertySearch: searchHook } = useUnifiedProperty();
  return searchHook(initialQuery, initialFilters, {
    debounceMs: 400,
    staleTime: 3 * 60 * 1000,
  });
}

export function useLandProperty(id: string) {
  const { useLandProperty: landHook } = useUnifiedProperty();
  return landHook(id);
}

export default useUnifiedProperty;

// Backward-compatible aliases
export { usePropertySearch as useEnhancedPropertySearch };
export { useLandProperty as useEnhancedLandProperty };