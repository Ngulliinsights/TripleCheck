import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/property-api';
import { Property, PropertySearchParams } from '../types/property.types';
import { cachePresets, queryKeys } from '../../infrastructure/api/queryClient';

// Use standardized query keys from infrastructure
export const propertyKeys = queryKeys.properties;

// Get properties with search and filters
export function useProperties(params: PropertySearchParams = {}) {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertyApi.getProperties(params),
    ...cachePresets.listings, // Use standardized cache preset
  });
}

// Get single property
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyApi.getProperty(id),
    enabled: !!id,
    ...cachePresets.listings, // Use standardized cache preset
  });
}

// Get properties by owner
export function useOwnerProperties(ownerId: string) {
  return useQuery({
    queryKey: propertyKeys.owner(ownerId),
    queryFn: () => propertyApi.getPropertiesByOwner(ownerId),
    enabled: !!ownerId,
    ...cachePresets.listings, // Use standardized cache preset
  });
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertyApi.createProperty,
    onSuccess: () => {
      // Invalidate and refetch property lists
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
  });
}

// Update property mutation
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, userId }: { id: string; updates: Partial<Property>; userId: string }) =>
      propertyApi.updateProperty(id, updates, userId),
    onSuccess: (data, variables) => {
      // Update the specific property in cache
      queryClient.setQueryData(propertyKeys.detail(variables.id), data);
      // Invalidate property lists to reflect changes
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
  });
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      propertyApi.deleteProperty(id, userId),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(variables.id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
  });
}