import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo, useEffect } from 'react'

import { searchService } from '../../local/services/SearchService'
import { 
  PropertySearchFilters, 
  SearchOptions, 
  SearchResult, 
  SearchSuggestion,
  UseSearchOptions,
  searchKeys
} from '../../local/types/search'

// Query keys are now imported from unified types

export function useSearch({
  initialFilters = {},
  initialOptions = { page: 1, limit: 20, sortBy: 'relevance', sortOrder: 'desc' },
  autoSearch = false,
  debounceMs = 300,
}: UseSearchOptions = {}) {
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<PropertySearchFilters>(initialFilters);
  const [options, setOptions] = useState<SearchOptions>(initialOptions);
  const [isSearchActive, setIsSearchActive] = useState(autoSearch);
  const [debouncedFilters, setDebouncedFilters] = useState<PropertySearchFilters>(filters);

  // Debounce filters to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  // Search results query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: searchKeys.results(debouncedFilters, options),
    queryFn: () => searchService.searchProperties(debouncedFilters, options),
    enabled: isSearchActive && Object.keys(debouncedFilters).some(key => debouncedFilters[key as keyof PropertySearchFilters]),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Suggestions query
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
  } = useQuery({
    queryKey: searchKeys.suggestions(filters.query || ''),
    queryFn: () => searchService.getSuggestions(filters.query || ''),
    enabled: Boolean(filters.query && filters.query.length >= 2),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Location suggestions query
  const {
    data: locationSuggestions,
    isLoading: isLoadingLocations,
  } = useQuery({
    queryKey: searchKeys.locations(filters.location || ''),
    queryFn: () => searchService.getLocationSuggestions(filters.location || ''),
    enabled: Boolean(filters.location && filters.location.length >= 2),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Popular searches query
  const {
    data: popularSearches,
  } = useQuery({
    queryKey: searchKeys.popular(),
    queryFn: () => searchService.getPopularSearches(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Search facets query
  const {
    data: facets,
    isLoading: isLoadingFacets,
  } = useQuery({
    queryKey: searchKeys.facets(debouncedFilters),
    queryFn: () => searchService.getSearchFacets(debouncedFilters),
    enabled: isSearchActive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update filter
  const updateFilter = useCallback(<K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple filters
  const updateFilters = useCallback((newFilters: Partial<PropertySearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setOptions(initialOptions);
  }, [initialOptions]);

  // Update options
  const updateOptions = useCallback((newOptions: Partial<SearchOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Perform search
  const search = useCallback(() => {
    setIsSearchActive(true);
    
    // Save search for analytics
    if (searchResults) {
      searchService.saveSearch(debouncedFilters, searchResults.total);
    }
  }, [debouncedFilters, searchResults]);

  // Reset search
  const resetSearch = useCallback(() => {
    setIsSearchActive(false);
    clearFilters();
  }, [clearFilters]);

  // Load more results (pagination)
  const loadMore = useCallback(() => {
    if (searchResults?.hasMore) {
      updateOptions({ page: (options.page || 1) + 1 });
    }
  }, [searchResults?.hasMore, options.page, updateOptions]);

  // Validate current filters
  const validation = useMemo(() => {
    return searchService.validateFilters(filters);
  }, [filters]);

  // Check if search has results
  const hasResults = useMemo(() => {
    return Boolean(searchResults?.items?.length);
  }, [searchResults?.items?.length]);

  // Check if search is empty
  const isEmpty = useMemo(() => {
    return isSearchActive && !isLoading && !hasResults;
  }, [isSearchActive, isLoading, hasResults]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    ).length;
  }, [filters]);

  // Clear cache
  const clearCache = useCallback(() => {
    searchService.clearCache();
    queryClient.invalidateQueries({ queryKey: searchKeys.all });
  }, [queryClient]);

  return {
    // Data
    searchResults,
    suggestions,
    locationSuggestions,
    popularSearches,
    facets,
    
    // State
    filters,
    options,
    isSearchActive,
    validation,
    hasResults,
    isEmpty,
    activeFilterCount,
    
    // Loading states
    isLoading,
    isFetching,
    isLoadingSuggestions,
    isLoadingLocations,
    isLoadingFacets,
    
    // Error
    error,
    
    // Actions
    updateFilter,
    updateFilters,
    clearFilters,
    updateOptions,
    search,
    resetSearch,
    loadMore,
    refetch,
    clearCache,
  };
}