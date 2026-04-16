import { Property } from '../../types/property'
import { SafeQueryOptions } from '../useSafeQuery'

// Property-specific query configurations for common use cases
export interface PropertyQueryConfig<T = Property[]> extends Partial<SafeQueryOptions<T>> {
  name: string;
  description: string;
}

// Configuration for property listings with search
export const propertyListConfig: PropertyQueryConfig<Property[]> = {
  name: 'Property List',
  description: 'Standard configuration for property listings with search and filtering',
  endpoint: '/api/properties',
  method: 'GET',
  fallbackData: [],
  staleTime: 2 * 60 * 1000, // 2 minutes - frequent updates expected
  gcTime: 5 * 60 * 1000, // 5 minutes - reasonable cleanup time
  retry: 3,
  debounceMs: 500,
  deduplicate: true,
  context: 'properties',
  validator: (data): Property[] => {
    if (!Array.isArray(data)) {
      // Handle API response format that might wrap data
      if (data && typeof data === "object" && "data" in data) {
        const wrappedData = (data as { data: unknown }).data;
        if (Array.isArray(wrappedData)) {
          return wrappedData.filter((item): item is Property => {
            if (!item || typeof item !== "object") return false;
            const obj = item as Record<string, unknown>;
            return (
              (typeof obj.id === "string" || typeof obj.id === "number") && 
              obj.id != null && 
              typeof obj.title === "string" && 
              obj.title.length > 0 &&
              typeof obj.description === "string" && 
              obj.description.length > 0
            );
          });
        }
      }
      return [];
    }

    return data.filter((item): item is Property => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      return (
        (typeof obj.id === "string" || typeof obj.id === "number") && 
        obj.id != null && 
        typeof obj.title === "string" && 
        obj.title.length > 0 &&
        typeof obj.description === "string" && 
        obj.description.length > 0
      );
    });
  },
};

// Configuration for single property details
export const propertyDetailConfig: PropertyQueryConfig<Property | null> = {
  name: 'Property Detail',
  description: 'Configuration for fetching detailed property information',
  fallbackData: null,
  staleTime: 10 * 60 * 1000, // 10 minutes - more stable data
  gcTime: 30 * 60 * 1000, // 30 minutes - longer retention for detail views
  retry: 2,
  deduplicate: true,
  context: 'property',
  validator: (data): Property | null => {
    if (!data || typeof data !== "object") return null;

    const property = data as Record<string, unknown>;
    return {
      ...property,
      id: (property.id as string) || "",
      title: (property.title as string) || "Untitled Property",
      description: (property.description as string) || "No description available",
      price: typeof property.price === "number" ? property.price : 0,
      location: (property.location as string) || "",
      images: Array.isArray(property.images) ? property.images : [],
    } as Property;
  },
};

// Configuration for owner properties
export const ownerPropertiesConfig: PropertyQueryConfig<Property[]> = {
  name: 'Owner Properties',
  description: 'Configuration for fetching properties owned by a specific user',
  fallbackData: [],
  staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes frequently
  gcTime: 15 * 60 * 1000, // 15 minutes - moderate retention
  retry: 3,
  deduplicate: true,
  context: 'owner-properties',
  validator: (data): Property[] => {
    if (!Array.isArray(data)) {
      // Handle API response format that might wrap data
      if (data && typeof data === "object" && "data" in data) {
        const wrappedData = (data as { data: unknown }).data;
        if (Array.isArray(wrappedData)) {
          return wrappedData.filter((item): item is Property => {
            if (!item || typeof item !== "object") return false;
            const obj = item as Record<string, unknown>;
            return (
              (typeof obj.id === "string" || typeof obj.id === "number") && 
              obj.id != null && 
              typeof obj.title === "string" && 
              obj.title.length > 0
            );
          });
        }
      }
      return [];
    }

    return data.filter((item): item is Property => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      return (
        (typeof obj.id === "string" || typeof obj.id === "number") && 
        obj.id != null && 
        typeof obj.title === "string" && 
        obj.title.length > 0
      );
    });
  },
};

// Configuration for property search with enhanced filtering
export const propertySearchConfig: PropertyQueryConfig<{ data: Property[]; total: number; hasNext: boolean; hasPrev: boolean }> = {
  name: 'Property Search',
  description: 'Configuration for advanced property search with pagination',
  endpoint: '/api/properties/search',
  method: 'GET',
  fallbackData: { data: [], total: 0, hasNext: false, hasPrev: false },
  staleTime: 30000, // 30 seconds - search results can change frequently
  gcTime: 2 * 60 * 1000, // 2 minutes - shorter cache for search results
  retry: 3,
  debounceMs: 500,
  deduplicate: true,
  context: 'property-search',
  validator: (data): { data: Property[]; total: number; hasNext: boolean; hasPrev: boolean } => {
    if (!data || typeof data !== "object") {
      return { data: [], total: 0, hasNext: false, hasPrev: false };
    }

    const response = data as Record<string, unknown>;
    const actualData = (response.success ? response.data || response : response) as Record<string, unknown>;

    return {
      data: Array.isArray(actualData.data) ? actualData.data.filter((item): item is Property => {
        if (!item || typeof item !== "object") return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === "string" || typeof obj.id === "number") && 
          obj.id != null && 
          typeof obj.title === "string" && 
          obj.title.length > 0
        );
      }) : [],
      total: typeof actualData.total === "number" ? actualData.total : 0,
      hasNext: Boolean(actualData.hasNext),
      hasPrev: Boolean(actualData.hasPrev),
    };
  },
};

// Configuration for property favorites
export const propertyFavoritesConfig: PropertyQueryConfig<Property[]> = {
  name: 'Property Favorites',
  description: 'Configuration for fetching user favorite properties',
  endpoint: '/api/properties/favorites',
  method: 'GET',
  fallbackData: [],
  staleTime: 1 * 60 * 1000, // 1 minute - favorites can change quickly
  gcTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  deduplicate: true,
  context: 'property-favorites',
  validator: (data): Property[] => {
    if (!Array.isArray(data)) {
      if (data && typeof data === "object" && "data" in data) {
        const wrappedData = (data as { data: unknown }).data;
        if (Array.isArray(wrappedData)) {
          return wrappedData.filter((item): item is Property => {
            if (!item || typeof item !== "object") return false;
            const obj = item as Record<string, unknown>;
            return (
              (typeof obj.id === "string" || typeof obj.id === "number") && 
              obj.id != null && 
              typeof obj.title === "string" && 
              obj.title.length > 0
            );
          });
        }
      }
      return [];
    }

    return data.filter((item): item is Property => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      return (
        (typeof obj.id === "string" || typeof obj.id === "number") && 
        obj.id != null && 
        typeof obj.title === "string" && 
        obj.title.length > 0
      );
    });
  },
};

// Configuration for similar properties
export const similarPropertiesConfig: PropertyQueryConfig<Property[]> = {
  name: 'Similar Properties',
  description: 'Configuration for fetching properties similar to a given property',
  fallbackData: [],
  staleTime: 15 * 60 * 1000, // 15 minutes - similar properties don't change often
  gcTime: 30 * 60 * 1000, // 30 minutes
  retry: 2,
  deduplicate: true,
  context: 'similar-properties',
  validator: (data): Property[] => {
    if (!Array.isArray(data)) {
      if (data && typeof data === "object" && "data" in data) {
        const wrappedData = (data as { data: unknown }).data;
        if (Array.isArray(wrappedData)) {
          return wrappedData.filter((item): item is Property => {
            if (!item || typeof item !== "object") return false;
            const obj = item as Record<string, unknown>;
            return (
              (typeof obj.id === "string" || typeof obj.id === "number") && 
              obj.id != null && 
              typeof obj.title === "string" && 
              obj.title.length > 0
            );
          });
        }
      }
      return [];
    }

    return data.filter((item): item is Property => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      return (
        (typeof obj.id === "string" || typeof obj.id === "number") && 
        obj.id != null && 
        typeof obj.title === "string" && 
        obj.title.length > 0
      );
    });
  },
};

// Export all configurations as a registry
export const propertyQueryConfigs = {
  propertyList: propertyListConfig,
  propertyDetail: propertyDetailConfig,
  ownerProperties: ownerPropertiesConfig,
  propertySearch: propertySearchConfig,
  propertyFavorites: propertyFavoritesConfig,
  similarProperties: similarPropertiesConfig,
} as const;

// Type for configuration keys
export type PropertyQueryConfigKey = keyof typeof propertyQueryConfigs;

// Helper function to get configuration by key
export function getPropertyQueryConfig<T = Property[]>(
  key: PropertyQueryConfigKey
): PropertyQueryConfig<T> {
  return propertyQueryConfigs[key] as PropertyQueryConfig<T>;
}

// Helper function to create a configured useSafeQuery call
export function createPropertyQuery<T = Property[]>(
  configKey: PropertyQueryConfigKey,
  overrides?: Partial<SafeQueryOptions<T>>
) {
  const config = getPropertyQueryConfig<T>(configKey);
  return {
    ...config,
    ...overrides,
  };
}