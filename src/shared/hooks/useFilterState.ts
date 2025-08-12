import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDebounce } from './useDebounce';

interface FilterStateOptions<T> {
  defaultFilters: T;
  debounceMs?: number;
  onChange?: (filters: T) => void;
  syncWithUrl?: boolean;
  validateFilters?: (filters: T) => { isValid: boolean; errors: Record<string, string> };
}

interface FilterStateReturn<T> {
  filters: T;
  setFilters: (filters: T | ((prev: T) => T)) => void;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  reset: () => void;
  debouncedFilters: T;
  isValid: boolean;
  errors: Record<string, string>;
  hasActiveFilters: boolean;
}

/**
 * Generic filter state management hook
 * Provides centralized filter logic with debouncing and URL sync
 */
export function useFilterState<T extends Record<string, unknown>>(
  options: FilterStateOptions<T>
): FilterStateReturn<T> {
  
  const {
    defaultFilters,
    debounceMs = 300,
    onChange,
    syncWithUrl = false,
    validateFilters,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL if sync is enabled
  const initialFilters = useMemo(() => {
    if (!syncWithUrl) {
      return defaultFilters;
    }

    try {
      const urlFilters = { ...defaultFilters };
      
      // Parse URL parameters and merge with defaults
      for (const [key, value] of searchParams.entries()) {
        if (key in defaultFilters) {
          const defaultValue = defaultFilters[key as keyof T];
          
          // Type-safe parsing based on default value type
          if (typeof defaultValue === 'boolean') {
            (urlFilters as any)[key] = value === 'true';
          } else if (typeof defaultValue === 'number') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              (urlFilters as any)[key] = numValue;
            }
          } else {
            (urlFilters as any)[key] = value;
          }
        }
      }
      
      return urlFilters;
    } catch (error) {
      console.warn('Failed to parse URL filters, using defaults:', error);
      return defaultFilters;
    }
  }, [defaultFilters, searchParams, syncWithUrl]);

  const [filters, setFiltersState] = useState<T>(initialFilters);
  
  // Debounced filters for API calls
  const debouncedFilters = useDebounce(filters, debounceMs);

  // Validation
  const validation = useMemo(() => {
    if (!validateFilters || !filters) {
      return { isValid: true, errors: {} };
    }
    return validateFilters(filters);
  }, [filters, validateFilters]);

  // Check if any filters are active (different from defaults)
  const hasActiveFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') {
      return false;
    }
    return Object.keys(filters).some(key => {
      const filterKey = key as keyof T;
      const currentValue = filters[filterKey];
      const defaultValue = defaultFilters[filterKey];
      
      // Handle different types of comparisons
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
      }
      
      return currentValue !== defaultValue;
    });
  }, [filters, defaultFilters]);

  // Update URL when filters change (if sync is enabled)
  useEffect(() => {
    if (!syncWithUrl) return;

    const newSearchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      const defaultValue = defaultFilters[key as keyof T];
      
      // Only add to URL if different from default
      if (value !== defaultValue && value !== null && value !== undefined && value !== '') {
        newSearchParams.set(key, String(value));
      }
    });

    // Update URL without triggering navigation
    setSearchParams(newSearchParams, { replace: true });
  }, [filters, defaultFilters, syncWithUrl, setSearchParams]);

  // Call onChange when debounced filters change
  useEffect(() => {
    if (onChange) {
      onChange(debouncedFilters);
    }
  }, [debouncedFilters, onChange]);

  // Set filters function
  const setFilters = useCallback((newFilters: T | ((prev: T) => T)) => {
    setFiltersState(prev => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      return { ...updated };
    });
  }, []);

  // Update single filter
  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Reset filters to defaults
  const reset = useCallback(() => {
    setFiltersState({ ...defaultFilters });
  }, [defaultFilters]);

  return {
    filters,
    setFilters,
    updateFilter,
    reset,
    debouncedFilters,
    isValid: validation.isValid,
    errors: validation.errors,
    hasActiveFilters,
  };
}

/**
 * Property-specific filter state hooks
 */
export function useResidentialFilterState(
  defaultFilters: any,
  options?: Omit<FilterStateOptions<any>, 'defaultFilters'>
) {
  return useFilterState({
    defaultFilters,
    ...options,
    validateFilters: (filters) => {
      const errors: Record<string, string> = {};
      
      // Validate price range
      if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
        errors.priceMin = 'Minimum price cannot be greater than maximum price';
      }
      
      // Validate bedrooms/bathrooms
      if (filters.bedrooms && filters.bedrooms < 0) {
        errors.bedrooms = 'Bedrooms must be a positive number';
      }
      
      if (filters.bathrooms && filters.bathrooms < 0) {
        errors.bathrooms = 'Bathrooms must be a positive number';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
  });
}

export function useCommercialFilterState(
  defaultFilters: any,
  options?: Omit<FilterStateOptions<any>, 'defaultFilters'>
) {
  return useFilterState({
    defaultFilters,
    ...options,
    validateFilters: (filters) => {
      const errors: Record<string, string> = {};
      
      // Validate price range
      if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
        errors.priceMin = 'Minimum price cannot be greater than maximum price';
      }
      
      // Validate area range
      if (filters.areaMin && filters.areaMax && filters.areaMin > filters.areaMax) {
        errors.areaMin = 'Minimum area cannot be greater than maximum area';
      }
      
      // Validate floors
      if (filters.floorsMin && filters.floorsMax && filters.floorsMin > filters.floorsMax) {
        errors.floorsMin = 'Minimum floors cannot be greater than maximum floors';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
  });
}

export function useLandFilterState(
  defaultFilters: any,
  options?: Omit<FilterStateOptions<any>, 'defaultFilters'>
) {
  return useFilterState({
    defaultFilters,
    ...options,
    validateFilters: (filters) => {
      const errors: Record<string, string> = {};
      
      // Validate price range
      if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
        errors.priceMin = 'Minimum price cannot be greater than maximum price';
      }
      
      // Validate size range
      if (filters.sizeMin && filters.sizeMax && filters.sizeMin > filters.sizeMax) {
        errors.sizeMin = 'Minimum size cannot be greater than maximum size';
      }
      
      // Validate size values are positive
      if (filters.sizeMin && filters.sizeMin < 0) {
        errors.sizeMin = 'Size must be a positive number';
      }
      
      if (filters.sizeMax && filters.sizeMax < 0) {
        errors.sizeMax = 'Size must be a positive number';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
  });
}

export default useFilterState;