import { useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "../../infrastructure/api/queryClient";
import { useDebounce } from "../../local/hooks/useDebounce";
import { useOptimisticMutation, type OptimisticContext } from "../../local/hooks/useOptimisticMutation";
import { useSafeQuery } from "../../local/hooks/useSafeQuery";
import {
  Property as ApiProperty,
  PropertySearchParams as ApiPropertySearchParams,
  type ApiResponse,
} from "../../local/types/api.types";
import { Property } from "@shared/types/property";
import { propertyApi } from "../services/property-api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: { lat: number; lng: number } | undefined;
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
  total?: number | undefined;
}

interface PropertyDetailResponse {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: LocationData;
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

// Per-mutation variable shapes — used both as explicit generic args and for callback typing.
type CreatePropertyVars = Omit<Property, "id" | "createdAt" | "updatedAt">;
type UpdatePropertyVars = { id: string; updates: Partial<Property>; userId: string };
type DeletePropertyVars = { id: string; userId: string };

// Specific return types inferred from the actual mutationFn signatures.
// A single ReturnType<typeof useOptimisticMutation> alias resolves to all-unknown
// generics and fails assignability checks due to function parameter contravariance.
type CreatePropertyResult = UseMutationResult<unknown,              Error, CreatePropertyVars, OptimisticContext<unknown>>;
type UpdatePropertyResult = UseMutationResult<ApiResponse<Property>, Error, UpdatePropertyVars, OptimisticContext<unknown>>;
type DeletePropertyResult = UseMutationResult<ApiResponse<void>,    Error, DeletePropertyVars, OptimisticContext<unknown>>;

// ─── Constants ───────────────────────────────────────────────────────────────

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

const CACHE_CONFIG = {
  PROPERTIES_LIST: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (i: number) => Math.min(1000 * 2 ** i, 30000),
  },
  PROPERTY_DETAIL: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (i: number) => Math.min(1000 * 2 ** i, 10000),
  },
  OWNER_PROPERTIES: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: (i: number) => Math.min(1000 * 2 ** i, 20000),
  },
} as const;

export const propertyKeys = queryKeys.properties;

// ─── Module-level utilities ───────────────────────────────────────────────────

// Tracks deprecation warnings so each fires only once per app lifetime,
// regardless of how many times a hook re-renders.
const deprecationWarned = new Set<string>();

function warnDeprecatedOnce(hookName: string, message: string): void {
  if (process.env.NODE_ENV === "development" && !deprecationWarned.has(hookName)) {
    deprecationWarned.add(hookName);
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

function createDebugLogger(context: string) {
  return (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(`[${context}] ${message}`, data);
    }
  };
}

// Instantiated once at module scope — not recreated on every render.
const log = {
  properties: createDebugLogger("useProperties"),
  property: createDebugLogger("useProperty"),
  ownerProperties: createDebugLogger("useOwnerProperties"),
  createProperty: createDebugLogger("useCreateProperty"),
  updateProperty: createDebugLogger("useUpdateProperty"),
  deleteProperty: createDebugLogger("useDeleteProperty"),
} as const;

// ─── Data helpers ─────────────────────────────────────────────────────────────

function validateLocationData(location: unknown): LocationData {
  if (typeof location === "string") {
    return { address: location, city: "", state: "", country: "", coordinates: undefined };
  }

  if (!location || typeof location !== "object") {
    return { address: "", city: "", state: "", country: "", coordinates: undefined };
  }

  const loc = location as Record<string, unknown>;
  const coords = loc.coordinates as Record<string, unknown> | null | undefined;
  const hasCoords = coords != null && typeof coords === "object";

  return {
    address: String(loc.address ?? ""),
    city: String(loc.city ?? ""),
    state: String(loc.state ?? ""),
    country: String(loc.country ?? ""),
    coordinates: hasCoords
      ? { lat: Number(coords.lat) || 0, lng: Number(coords.lng) || 0 }
      : undefined,
  };
}

function extractPropertyFromResponse(
  data: unknown,
  _id: string
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const response = data as Record<string, unknown>;
  const property = response.data ?? response;
  return property && typeof property === "object"
    ? (property as Record<string, unknown>)
    : null;
}

function validatePropertyData(
  propertyObj: Record<string, unknown>,
  id: string
): PropertyDetailResponse {
  const locationData = validateLocationData(propertyObj.location);

  const result: PropertyDetailResponse = {
    id: String(propertyObj.id ?? id),
    title: String(propertyObj.title ?? "Untitled Property"),
    price: typeof propertyObj.price === "number" ? propertyObj.price : 0,
    images: Array.isArray(propertyObj.images) ? propertyObj.images : [],
    location: locationData,
    features:
      propertyObj.features && typeof propertyObj.features === "object"
        ? (propertyObj.features as Record<string, unknown>)
        : {},
  };

  if (propertyObj.description) result.description = String(propertyObj.description);
  if (Array.isArray(propertyObj.amenities)) result.amenities = propertyObj.amenities;
  if (propertyObj.lastUpdated) result.lastUpdated = String(propertyObj.lastUpdated);
  if (typeof propertyObj.viewCount === "number") result.viewCount = propertyObj.viewCount;
  if (typeof propertyObj.bedrooms === "number") result.bedrooms = propertyObj.bedrooms;
  if (typeof propertyObj.bathrooms === "number") result.bathrooms = propertyObj.bathrooms;
  if (typeof propertyObj.size === "number") result.size = propertyObj.size;
  if (propertyObj.type) result.type = String(propertyObj.type);
  if (propertyObj.status) result.status = String(propertyObj.status);
  if (propertyObj.ownerId) result.ownerId = String(propertyObj.ownerId);
  if (propertyObj.createdAt) result.createdAt = String(propertyObj.createdAt);
  if (propertyObj.updatedAt) result.updatedAt = String(propertyObj.updatedAt);

  return result;
}

// ─── Query hooks (deprecated) ─────────────────────────────────────────────────

/**
 * @deprecated Use `useUnifiedProperty().useProperties` instead.
 */
export function useProperties(params: Partial<ApiPropertySearchParams> = {}) {
  warnDeprecatedOnce(
    "useProperties",
    "[DEPRECATED] useProperties is deprecated. Migrate to useUnifiedProperty().useProperties."
  );

  const searchComplexity = Object.keys(params).length;
  const debounceDelay = Math.min(300 + searchComplexity * 50, 800);
  const debouncedParams = useDebounce(params, debounceDelay);

  const cacheKey = useMemo(
    () => `${CACHE_KEYS.PROPERTIES}-${JSON.stringify(debouncedParams)}`,
    [debouncedParams]
  );

  log.properties("Fetching with params", debouncedParams);

  return useSafeQuery<PropertiesResponse>({
    endpoint: ENDPOINTS.PROPERTIES,
    method: "GET",
    body: debouncedParams as Record<string, unknown>,
    fallbackData: { data: [], total: 0, page: 1, limit: 10, hasNext: false, hasPrev: false },
    validator: (data: unknown): PropertiesResponse | null => {
      if (!data || typeof data !== "object") {
        log.properties("Invalid response structure");
        return null;
      }
      const response = data as Record<string, unknown>;
      const actual = (response.success ? response.data ?? response : response) as Record<string, unknown>;
      const validated = {
        data: Array.isArray(actual.data) ? actual.data : [],
        total: typeof actual.total === "number" ? actual.total : 0,
        page: typeof actual.page === "number" ? actual.page : 1,
        limit: typeof actual.limit === "number" ? actual.limit : 10,
        hasNext: Boolean(actual.hasNext),
        hasPrev: Boolean(actual.hasPrev),
      };
      log.properties("Validated", { count: validated.data.length, total: validated.total });
      return validated;
    },
    debounceMs: debounceDelay,
    deduplicate: true,
    context: "properties-list",
    cacheKey,
    ...CACHE_CONFIG.PROPERTIES_LIST,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: true,
  });
}

/**
 * @deprecated Use `useUnifiedProperty().usePropertyDetail` instead.
 */
export function useProperty(id: string) {
  warnDeprecatedOnce(
    "useProperty",
    "[DEPRECATED] useProperty is deprecated. Migrate to useUnifiedProperty().usePropertyDetail."
  );

  return useSafeQuery<PropertyDetailResponse | null>({
    endpoint: ENDPOINTS.PROPERTY_DETAIL(id),
    method: "GET",
    fallbackData: null,
    validator: (data: unknown): PropertyDetailResponse | null => {
      const propertyObj = extractPropertyFromResponse(data, id);
      if (!propertyObj) {
        log.property("Invalid property data", { id });
        return null;
      }
      const validated = validatePropertyData(propertyObj, id);
      log.property("Validated", { id, title: validated.title });
      return validated;
    },
    enabled: Boolean(id) && id.length > 0,
    context: "property-detail",
    cacheKey: `${CACHE_KEYS.PROPERTY_DETAIL}-${id}`,
    ...CACHE_CONFIG.PROPERTY_DETAIL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * @deprecated Use `useSafeQuery` with an owner-specific endpoint instead.
 */
export function useOwnerProperties(ownerId: string, includeTotal = false) {
  warnDeprecatedOnce(
    "useOwnerProperties",
    "[DEPRECATED] useOwnerProperties is deprecated. Use useSafeQuery with a custom owner endpoint."
  );

  return useSafeQuery<OwnerPropertiesResponse>({
    endpoint: ENDPOINTS.OWNER_PROPERTIES(ownerId),
    method: "GET",
    body: includeTotal ? { includeTotal: true } : undefined,
    fallbackData: { data: [] },
    validator: (data: unknown): OwnerPropertiesResponse | null => {
      if (!data || typeof data !== "object") {
        log.ownerProperties("Invalid data", { ownerId });
        return null;
      }
      const response = data as Record<string, unknown>;
      const total = typeof response.total === "number" ? response.total : undefined;
      const validated: OwnerPropertiesResponse = {
        data: Array.isArray(response.data) ? response.data : [],
        ...(total !== undefined && { total }),
      };
      log.ownerProperties("Validated", { ownerId, count: validated.data.length });
      return validated;
    },
    enabled: Boolean(ownerId) && ownerId.length > 0,
    context: CACHE_KEYS.OWNER_PROPERTIES,
    cacheKey: `${CACHE_KEYS.OWNER_PROPERTIES}-${ownerId}-${includeTotal}`,
    ...CACHE_CONFIG.OWNER_PROPERTIES,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateProperty(): CreatePropertyResult {
  const queryClient = useQueryClient();

  return useOptimisticMutation<unknown, Error, CreatePropertyVars>({
    mutationFn: (propertyData) => propertyApi.createProperty(propertyData),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (oldData: unknown, variables: CreatePropertyVars) => {
      const current = oldData as PropertiesResponse | undefined;
      if (!current?.data) return current;

      const optimistic: Property = {
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
    onError: (error: Error, variables: CreatePropertyVars) => {
      log.createProperty("Failed", { error: error.message, title: variables?.title });
    },
    onSuccess: (data: unknown, variables: CreatePropertyVars) => {
      const property = (data as { data?: ApiProperty })?.data ?? (data as ApiProperty);
      log.createProperty("Succeeded", { id: property?.id, title: variables?.title });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PROPERTIES], exact: false });

      queryClient
        .getQueryCache()
        .findAll({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === CACHE_KEYS.OWNER_PROPERTIES,
        })
        .forEach((q) => queryClient.invalidateQueries({ queryKey: q.queryKey }));
    },
  });
}

export function useUpdateProperty(): UpdatePropertyResult {
  const queryClient = useQueryClient();

  return useOptimisticMutation<ApiResponse<Property>, Error, UpdatePropertyVars>({
    mutationFn: ({ id, updates, userId }: UpdatePropertyVars) =>
      propertyApi.updateProperty(id, updates, userId),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (oldData: unknown, variables: UpdatePropertyVars) => {
      const current = oldData as PropertiesResponse | undefined;
      if (!current?.data) return current;

      return {
        ...current,
        data: current.data.map((p: ApiProperty) =>
          p.id === variables.id ? { ...p, ...variables.updates } : p
        ),
      };
    },
    onError: (error: Error, variables: UpdatePropertyVars) => {
      log.updateProperty("Failed", {
        error: error.message,
        id: variables?.id,
        fields: variables?.updates ? Object.keys(variables.updates) : [],
      });
    },
    onSuccess: (_data: ApiResponse<Property>, variables: UpdatePropertyVars) => {
      log.updateProperty("Succeeded", { id: variables.id, fields: Object.keys(variables.updates) });
    },
    onSettled: (data: ApiResponse<Property> | undefined, _error: Error | null, variables: UpdatePropertyVars) => {
      if (data) {
        queryClient.setQueryData([CACHE_KEYS.PROPERTY_DETAIL, variables.id], data);
      }
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PROPERTIES], exact: false });
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.OWNER_PROPERTIES], exact: false });
    },
  });
}

export function useDeleteProperty(): DeletePropertyResult {
  const queryClient = useQueryClient();

  return useOptimisticMutation<ApiResponse<void>, Error, DeletePropertyVars>({
    mutationFn: ({ id, userId }: DeletePropertyVars) =>
      propertyApi.deleteProperty(id, userId),
    queryKey: [CACHE_KEYS.PROPERTIES, "list"],
    optimisticUpdate: (oldData: unknown, variables: DeletePropertyVars) => {
      const current = oldData as PropertiesResponse | undefined;
      if (!current?.data) return current;

      return {
        ...current,
        data: current.data.filter((p: ApiProperty) => p.id !== variables.id),
        total: Math.max(0, current.total - 1),
      };
    },
    onError: (error: Error, variables: DeletePropertyVars) => {
      log.deleteProperty("Failed", { error: error.message, id: variables?.id });
    },
    onSuccess: (_data: ApiResponse<void>, variables: DeletePropertyVars) => {
      log.deleteProperty("Succeeded", { id: variables.id });
    },
    onSettled: (_data: ApiResponse<void> | undefined, _error: Error | null, variables: DeletePropertyVars) => {
      queryClient.removeQueries({ queryKey: [CACHE_KEYS.PROPERTY_DETAIL, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.PROPERTIES], exact: false });
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.OWNER_PROPERTIES], exact: false });
    },
  });
}