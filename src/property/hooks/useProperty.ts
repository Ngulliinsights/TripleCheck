import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/property-api';
import { Property, PropertySearchParams } from '../types/property.types';
import { cachePresets, queryKeys } from '../../infrastructure/api/queryClient';
import { useSafeQuery } from '../../shared/hooks/useSafeQuery';
import { useOptimisticMutation } from '../../shared/hooks/useOptimisticMutation';
import { useDebounce } from '../../shared/hooks/useDebounce';

// Use standardized query keys from infrastructure
export const propertyKeys = queryKeys.properties;

// Get properties with search and filters - FIXED: Using safe query to prevent infinite loops
export function useProperties(params: PropertySearchParams = {}) {
  // Debounce search parameters to prevent excessive API calls
  const debouncedParams = useDebounce(params, 300);
  
  return useSafeQuery({
    endpoint: '/api/properties',
    method: 'GET',
    body: debouncedParams,
    fallbackData: { data: [], total: 0, page: 1, limit: 10, hasNext: false, hasPrev: false },
    validator: (data: any) => {
      if (!data || typeof data !== 'object') return null;
      return {
        data: Array.isArray(data.data) ? data.data : [],
        total: typeof data.total === 'number' ? data.total : 0,
        page: typeof data.page === 'number' ? data.page : 1,
        limit: typeof data.limit === 'number' ? data.limit : 10,
        hasNext: Boolean(data.hasNext),
        hasPrev: Boolean(data.hasPrev)
      };
    },
    debounceMs: 300,
    deduplicate: true,
    context: 'properties-list',
    cacheKey: `properties-${JSON.stringify(debouncedParams)}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: true
  });
}

// Get single property - FIXED: Using safe query to prevent infinite loops
export function useProperty(id: string) {
  return useSafeQuery({
    endpoint: `/api/properties/${id}`,
    method: 'GET',
    fallbackData: null,
    validator: (data: any) => {
      if (!data || typeof data !== 'object') return null;
      const property = data.data || data;
      if (!property || typeof property !== 'object') return null;
      
      return {
        ...property,
        id: property.id || '',
        title: property.title || 'Untitled Property',
        price: typeof property.price === 'number' ? property.price : 0,
        images: Array.isArray(property.images) ? property.images : [],
        location: property.location || '',
        features: property.features || {}
      };
    },
    enabled: Boolean(id) && id.length > 0,
    context: 'property-detail',
    cacheKey: `property-${id}`,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
}

// Get properties by owner - FIXED: Using safe query to prevent infinite loops
export function useOwnerProperties(ownerId: string) {
  return useSafeQuery({
    endpoint: `/api/properties/owner/${ownerId}`,
    method: 'GET',
    fallbackData: { data: [] },
    validator: (data: any) => {
      if (!data || typeof data !== 'object') return null;
      return {
        data: Array.isArray(data.data) ? data.data : []
      };
    },
    enabled: Boolean(ownerId) && ownerId.length > 0,
    context: 'owner-properties',
    cacheKey: `owner-properties-${ownerId}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
}

// Create property mutation - FIXED: Using optimistic mutation to prevent race conditions
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: propertyApi.createProperty,
    queryKey: ['properties', 'list'],
    optimisticUpdate: (oldData: any, newProperty: any) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: [newProperty, ...oldData.data],
        total: oldData.total + 1
      };
    },
    onError: (error, variables, context) => {
      console.error('Failed to create property:', error);
      // Rollback is handled automatically by useOptimisticMutation
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}

// Update property mutation - FIXED: Using optimistic mutation to prevent race conditions
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: ({ id, updates, userId }: { id: string; updates: Partial<Property>; userId: string }) =>
      propertyApi.updateProperty(id, updates, userId),
    queryKey: ['properties', 'list'],
    optimisticUpdate: (oldData: any, variables: { id: string; updates: Partial<Property> }) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((property: any) =>
          property.id === variables.id ? { ...property, ...variables.updates } : property
        )
      };
    },
    onError: (error, variables, context) => {
      console.error('Failed to update property:', error);
      // Rollback is handled automatically by useOptimisticMutation
    },
    onSettled: (data, error, variables) => {
      // Update specific property cache
      if (data && !error) {
        queryClient.setQueryData(['property', variables.id], data);
      }
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}

// Delete property mutation - FIXED: Using optimistic mutation to prevent race conditions
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      propertyApi.deleteProperty(id, userId),
    queryKey: ['properties', 'list'],
    optimisticUpdate: (oldData: any, variables: { id: string }) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.filter((property: any) => property.id !== variables.id),
        total: Math.max(0, oldData.total - 1)
      };
    },
    onError: (error, variables, context) => {
      console.error('Failed to delete property:', error);
      // Rollback is handled automatically by useOptimisticMutation
    },
    onSettled: (data, error, variables) => {
      // Remove from specific property cache
      queryClient.removeQueries({ queryKey: ['property', variables.id] });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}