import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';

import { SearchFilters } from '@/shared/types';

// Mock search API - replace with actual implementation
const searchApi = {
  search: async (filters: SearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/search?${params}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  getSuggestions: async (query: string) => {
    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to get suggestions');
    return response.json();
  },
};

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  results: (filters: SearchFilters) => [...searchKeys.all, 'results', filters] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
};

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
  });

  const [isSearchActive, setIsSearchActive] = useState(false);

  // Search results query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: searchKeys.results(filters),
    queryFn: () => searchApi.search(filters),
    enabled: isSearchActive && (!!filters.query || !!filters.location),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Search suggestions query
  const {
    data: suggestions,
    isLoading: isSuggestionsLoading,
  } = useQuery({
    queryKey: searchKeys.suggestions(filters.query || ''),
    queryFn: () => searchApi.getSuggestions(filters.query || ''),
    enabled: !!(filters.query && filters.query.length > 2),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const executeSearch = useCallback(() => {
    setIsSearchActive(true);
    refetch();
  }, [refetch]);

  const clearSearch = useCallback(() => {
    setFilters({
      query: '',
      location: '',
    });
    setIsSearchActive(false);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.query ||
      filters.location ||
      filters.priceMin ||
      filters.priceMax ||
      filters.propertyType ||
      filters.bedrooms ||
      filters.bathrooms
    );
  }, [filters]);

  return {
    filters,
    searchResults,
    suggestions,
    isLoading,
    isSuggestionsLoading,
    error,
    isSearchActive,
    hasActiveFilters,
    updateFilters,
    executeSearch,
    clearSearch,
  };
}