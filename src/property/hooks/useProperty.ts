import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/property-api';
import { Property, PropertySearchParams } from '../types/property.types';

// Query keys for consistent caching
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params: PropertySearchParams) => [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  owner: (ownerId: string) => [...propertyKeys.all, 'owner', ownerId] as const,
};

// Get properties with search and filters
export function useProperties(params: PropertySearchParams = {}) {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertyApi.getProperties(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single property
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyApi.getProperty(id),
    enabled: !!id,
  });
}

// Get properties by owner
export function useOwnerProperties(ownerId: string) {
  return useQuery({
    queryKey: propertyKeys.owner(ownerId),
    queryFn: () => propertyApi.getPropertiesByOwner(ownerId),
    enabled: !!ownerId,
  });
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertyApi.createProperty,
    onSuccess: () => {
      // Invalidate and refetch property lists
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

// Update property mutation
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Property> }) =>
      propertyApi.updateProperty(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific property in cache
      queryClient.setQueryData(propertyKeys.detail(variables.id), data);
      // Invalidate property lists to reflect changes
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertyApi.deleteProperty,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}