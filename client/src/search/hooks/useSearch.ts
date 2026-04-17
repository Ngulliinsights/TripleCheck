import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";

import { searchService } from "../../local/services/SearchService";
import {
  PropertySearchFilters,
  SearchOptions,
  UseSearchOptions,
  searchKeys,
} from "../../local/types/search";

const DEFAULT_OPTIONS: SearchOptions = {
  page: 1,
  limit: 20,
  sortBy: "relevance",
  sortOrder: "desc",
};

const hasActiveFilters = (filters: PropertySearchFilters): boolean =>
  Object.values(filters).some((v) => {
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

export function useSearch({
  initialFilters = {},
  initialOptions = DEFAULT_OPTIONS,
  autoSearch = false,
  debounceMs = 300,
}: UseSearchOptions = {}) {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<PropertySearchFilters>(initialFilters);
  const [options, setOptions] = useState<SearchOptions>(initialOptions);
  const [isSearchActive, setIsSearchActive] = useState(autoSearch);
  const [debouncedFilters, setDebouncedFilters] =
    useState<PropertySearchFilters>(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), debounceMs);
    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: searchKeys.results(debouncedFilters, options),
    queryFn: () => searchService.searchProperties(debouncedFilters, options),
    enabled: isSearchActive && hasActiveFilters(debouncedFilters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: searchKeys.suggestions(filters.query ?? ""),
    queryFn: () => searchService.getSuggestions(filters.query ?? ""),
    enabled: (filters.query?.length ?? 0) >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: locationSuggestions, isLoading: isLoadingLocations } = useQuery({
    queryKey: searchKeys.locations(filters.location ?? ""),
    queryFn: () => searchService.getLocationSuggestions(filters.location ?? ""),
    enabled: (filters.location?.length ?? 0) >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const { data: popularSearches } = useQuery({
    queryKey: searchKeys.popular(),
    queryFn: () => searchService.getPopularSearches(),
    staleTime: 60 * 60 * 1000,
  });

  const { data: facets, isLoading: isLoadingFacets } = useQuery({
    queryKey: searchKeys.facets(debouncedFilters),
    queryFn: () => searchService.getSearchFacets(debouncedFilters),
    enabled: isSearchActive,
    staleTime: 5 * 60 * 1000,
  });

  const updateFilter = useCallback(
    <K extends keyof PropertySearchFilters>(
      key: K,
      value: PropertySearchFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateFilters = useCallback(
    (newFilters: Partial<PropertySearchFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setOptions(initialOptions);
  }, [initialOptions]);

  const updateOptions = useCallback((newOptions: Partial<SearchOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const search = useCallback(() => {
    setIsSearchActive(true);
    // Save search for analytics — use current results if available, otherwise 0
    searchService.saveSearch(debouncedFilters, searchResults?.total ?? 0);
  }, [debouncedFilters, searchResults?.total]);

  const resetSearch = useCallback(() => {
    setIsSearchActive(false);
    clearFilters();
  }, [clearFilters]);

  const loadMore = useCallback(() => {
    if (searchResults?.hasMore) {
      updateOptions({ page: (options.page ?? 1) + 1 });
    }
  }, [searchResults?.hasMore, options.page, updateOptions]);

  const validation = useMemo(
    () => searchService.validateFilters(filters),
    [filters]
  );

  const hasResults = useMemo(
    () => Boolean(searchResults?.items?.length),
    [searchResults?.items?.length]
  );

  const isEmpty = useMemo(
    () => isSearchActive && !isLoading && !hasResults,
    [isSearchActive, isLoading, hasResults]
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((v) => {
        if (v === undefined || v === null || v === "") return false;
        if (Array.isArray(v)) return v.length > 0;
        return true;
      }).length,
    [filters]
  );

  const clearCache = useCallback(() => {
    searchService.clearCache();
    queryClient.invalidateQueries({ queryKey: [searchKeys.all] });
  }, [queryClient]);

  return {
    searchResults,
    suggestions,
    locationSuggestions,
    popularSearches,
    facets,
    filters,
    options,
    isSearchActive,
    validation,
    hasResults,
    isEmpty,
    activeFilterCount,
    isLoading,
    isFetching,
    isLoadingSuggestions,
    isLoadingLocations,
    isLoadingFacets,
    error,
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