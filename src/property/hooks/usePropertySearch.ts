import { useState, useCallback, useMemo } from 'react';
import { useProperties } from './useProperty';
import { PropertySearchParams } from '../types/property.types';

export function usePropertySearch() {
  const [searchParams, setSearchParams] = useState<PropertySearchParams>({
    query: '',
    location: '',
    priceMin: undefined,
    priceMax: undefined,
    propertyType: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    page: 1,
    limit: 12,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const { data: searchResults, isLoading, error } = useProperties(searchParams);

  const updateSearch = useCallback((updates: Partial<PropertySearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...updates,
      page: updates.page || 1, // Reset to first page when search changes
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchParams({
      query: '',
      location: '',
      priceMin: undefined,
      priceMax: undefined,
      propertyType: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      page: 1,
      limit: 12,
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchParams.query ||
      searchParams.location ||
      searchParams.priceMin ||
      searchParams.priceMax ||
      searchParams.propertyType ||
      searchParams.bedrooms ||
      searchParams.bathrooms
    );
  }, [searchParams]);

  return {
    searchParams,
    searchResults,
    isLoading,
    error,
    updateSearch,
    clearSearch,
    hasActiveFilters,
  };
}