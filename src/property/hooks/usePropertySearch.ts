import { useState, useCallback, useMemo } from 'react';
import { useProperties } from './useProperty';
import { PropertySearchParams } from '../types/property.types';
import { useDebounce } from '../../shared/hooks/useDebounce';

export function usePropertySearch() {
  const [searchParams, setSearchParams] = useState<PropertySearchParams>({
    query: '',
    location: '',
    page: 1,
    limit: 12,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  // FIXED: Debounce search parameters to prevent infinite API calls
  const debouncedSearchParams = useDebounce(searchParams, 500);

  const { data: searchResults, isLoading, error, cancelRequest } = useProperties(debouncedSearchParams);

  const updateSearch = useCallback((updates: Partial<PropertySearchParams>) => {
    // Cancel any pending requests before updating search
    cancelRequest();
    
    setSearchParams(prev => ({
      ...prev,
      ...updates,
      page: updates.page || 1, // Reset to first page when search changes
    }));
  }, [cancelRequest]);

  const clearSearch = useCallback(() => {
    // Cancel any pending requests before clearing search
    cancelRequest();
    
    setSearchParams({
      query: '',
      location: '',
      page: 1,
      limit: 12,
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  }, [cancelRequest]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      debouncedSearchParams.query ||
      debouncedSearchParams.location ||
      debouncedSearchParams.priceMin ||
      debouncedSearchParams.priceMax ||
      debouncedSearchParams.propertyType ||
      debouncedSearchParams.bedrooms ||
      debouncedSearchParams.bathrooms
    );
  }, [debouncedSearchParams]);

  return {
    searchParams,
    debouncedSearchParams,
    searchResults,
    isLoading,
    error,
    updateSearch,
    clearSearch,
    hasActiveFilters,
    cancelRequest, // Expose cancel function for manual cancellation
  };
}