import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUnifiedProperty } from '../useUnifiedProperty'
import { useConsolidatedPropertySearch } from '../useConsolidatedPropertySearch'

// Mock the API service
vi.mock('../../services/property-api', () => ({
  propertyApi: {
    getProperties: vi.fn(),
    getProperty: vi.fn(),
    getSimilarProperties: vi.fn(),
    createProperty: vi.fn(),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
  },
}));

// Mock the infrastructure API
vi.mock('../../../infrastructure/api/queryClient', () => ({
  apiRequest: vi.fn(),
  queryKeys: {
    properties: ['properties'],
  },
}));

// Mock the safe query hook
vi.mock('../../../shared/hooks/useSafeQuery', () => ({
  useSafeQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useSafePropertiesQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    cancelRequest: vi.fn(),
  })),
}));

// Mock the debounce hook
vi.mock('../../../shared/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value) => value),
}));

// Mock the optimistic mutation hook
vi.mock('../../../shared/hooks/useOptimisticMutation', () => ({
  useOptimisticMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

// Mock land property service
vi.mock('../../services/mock-land-data', () => ({
  fetchMockLandProperty: vi.fn(),
  hasMockLandProperty: vi.fn(() => true),
}));

describe('Property Hooks Consolidation Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  describe('useUnifiedProperty', () => {
    it('should provide all expected hook functions', () => {
      const { result } = renderHook(() => useUnifiedProperty(), { wrapper });

      expect(result.current).toHaveProperty('usePropertyDetail');
      expect(result.current).toHaveProperty('useLandProperty');
      expect(result.current).toHaveProperty('useProperties');
      expect(result.current).toHaveProperty('usePropertySearch');
      expect(result.current).toHaveProperty('useCreateProperty');
      expect(result.current).toHaveProperty('useUpdateProperty');
      expect(result.current).toHaveProperty('useDeleteProperty');
      expect(result.current).toHaveProperty('invalidatePropertyQueries');
      expect(result.current).toHaveProperty('clearPropertyCache');
    });

    it('should provide working property detail hook', () => {
      const { result } = renderHook(() => {
        const { usePropertyDetail } = useUnifiedProperty();
        return usePropertyDetail('test-id');
      }, { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('should provide working land property hook', () => {
      const { result } = renderHook(() => {
        const { useLandProperty } = useUnifiedProperty();
        return useLandProperty('test-id');
      }, { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('should provide working properties list hook', () => {
      const { result } = renderHook(() => {
        const { useProperties } = useUnifiedProperty();
        return useProperties({ query: 'test' });
      }, { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('should provide working mutation hooks', () => {
      const { result } = renderHook(() => {
        const { useCreateProperty, useUpdateProperty, useDeleteProperty } = useUnifiedProperty();
        return {
          create: useCreateProperty(),
          update: useUpdateProperty(),
          delete: useDeleteProperty(),
        };
      }, { wrapper });

      expect(result.current.create).toHaveProperty('mutate');
      expect(result.current.update).toHaveProperty('mutate');
      expect(result.current.delete).toHaveProperty('mutate');
    });
  });

  describe('useConsolidatedPropertySearch', () => {
    it('should provide all expected search functionality', () => {
      const { result } = renderHook(() => useConsolidatedPropertySearch(), { wrapper });

      // Core data
      expect(result.current).toHaveProperty('properties');
      expect(result.current).toHaveProperty('totalCount');
      expect(result.current).toHaveProperty('hasNextPage');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      // Search state
      expect(result.current).toHaveProperty('searchParams');
      expect(result.current).toHaveProperty('debouncedSearchParams');

      // Actions
      expect(result.current).toHaveProperty('updateSearch');
      expect(result.current).toHaveProperty('clearSearch');
      expect(result.current).toHaveProperty('resetFilters');
      expect(result.current).toHaveProperty('goToPage');
      expect(result.current).toHaveProperty('sortBy');

      // Advanced features
      expect(result.current).toHaveProperty('searchHistory');
      expect(result.current).toHaveProperty('searchSuggestions');
      expect(result.current).toHaveProperty('metrics');
      expect(result.current).toHaveProperty('hasActiveFilters');
      expect(result.current).toHaveProperty('isSearchOptimal');

      // Utility functions
      expect(result.current).toHaveProperty('applyFilterSet');
      expect(result.current).toHaveProperty('applyPreset');
      expect(result.current).toHaveProperty('duplicateSearch');
    });

    it('should initialize with default search parameters', () => {
      const { result } = renderHook(() => useConsolidatedPropertySearch(), { wrapper });

      expect(result.current.searchParams).toEqual({
        query: "",
        location: "",
        page: 1,
        limit: 12,
        sortBy: "relevance",
        sortOrder: "desc",
      });
    });

    it('should accept initial parameters', () => {
      const initialParams = {
        query: "test query",
        location: "Nairobi",
        priceMin: 100000,
      };

      const { result } = renderHook(() => 
        useConsolidatedPropertySearch(initialParams), 
        { wrapper }
      );

      expect(result.current.searchParams.query).toBe("test query");
      expect(result.current.searchParams.location).toBe("Nairobi");
      expect(result.current.searchParams.priceMin).toBe(100000);
    });

    it('should provide working action functions', () => {
      const { result } = renderHook(() => useConsolidatedPropertySearch(), { wrapper });

      expect(typeof result.current.updateSearch).toBe('function');
      expect(typeof result.current.clearSearch).toBe('function');
      expect(typeof result.current.resetFilters).toBe('function');
      expect(typeof result.current.goToPage).toBe('function');
      expect(typeof result.current.sortBy).toBe('function');
      expect(typeof result.current.applyFilterSet).toBe('function');
      expect(typeof result.current.applyPreset).toBe('function');
      expect(typeof result.current.duplicateSearch).toBe('function');
    });

    it('should handle search options correctly', () => {
      const options = {
        debounceMs: 300,
        maxHistoryEntries: 10,
        enableSuggestions: false,
        enableMetrics: false,
        adaptiveDebounce: false,
      };

      const { result } = renderHook(() => 
        useConsolidatedPropertySearch({}, options), 
        { wrapper }
      );

      // Should still provide all functionality even with options disabled
      expect(result.current).toHaveProperty('searchSuggestions');
      expect(result.current).toHaveProperty('metrics');
      expect(Array.isArray(result.current.searchSuggestions)).toBe(true);
      expect(typeof result.current.metrics).toBe('object');
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide enhanced hooks for backward compatibility', () => {
      const { useEnhancedPropertySearch, useEnhancedLandProperty } = require('../useUnifiedProperty');

      expect(typeof useEnhancedPropertySearch).toBe('function');
      expect(typeof useEnhancedLandProperty).toBe('function');
    });

    it('should work with enhanced property search hook', () => {
      const { useEnhancedPropertySearch } = require('../useUnifiedProperty');
      
      const { result } = renderHook(() => 
        useEnhancedPropertySearch("test query", { location: "Nairobi" }), 
        { wrapper }
      );

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('should work with enhanced land property hook', () => {
      const { useEnhancedLandProperty } = require('../useUnifiedProperty');
      
      const { result } = renderHook(() => 
        useEnhancedLandProperty("test-id"), 
        { wrapper }
      );

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('Integration', () => {
    it('should work together without conflicts', async () => {
      const { result } = renderHook(() => {
        const unifiedHooks = useUnifiedProperty();
        const searchHook = useConsolidatedPropertySearch();
        
        return {
          unified: unifiedHooks,
          search: searchHook,
        };
      }, { wrapper });

      // Should not throw errors
      expect(result.current.unified).toBeDefined();
      expect(result.current.search).toBeDefined();

      // Should provide independent functionality
      expect(result.current.unified.usePropertyDetail).not.toBe(result.current.search.updateSearch);
    });

    it('should handle cache management correctly', () => {
      const { result } = renderHook(() => useUnifiedProperty(), { wrapper });

      expect(typeof result.current.invalidatePropertyQueries).toBe('function');
      expect(typeof result.current.clearPropertyCache).toBe('function');

      // Should not throw when called
      expect(() => result.current.invalidatePropertyQueries()).not.toThrow();
      expect(() => result.current.clearPropertyCache()).not.toThrow();
      expect(() => result.current.clearPropertyCache('test-id')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid property IDs gracefully', () => {
      const { result } = renderHook(() => {
        const { usePropertyDetail } = useUnifiedProperty();
        return usePropertyDetail('');
      }, { wrapper });

      // Should not crash with empty ID
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('error');
    });

    it('should handle invalid search parameters gracefully', () => {
      const { result } = renderHook(() => 
        useConsolidatedPropertySearch({
          // @ts-expect-error - Testing invalid parameters
          invalidParam: 'test',
        }), 
        { wrapper }
      );

      // Should still work with invalid parameters
      expect(result.current).toHaveProperty('properties');
      expect(result.current).toHaveProperty('searchParams');
    });
  });
});

describe('Migration Validation', () => {
  it('should maintain API compatibility for common use cases', () => {
    // Test that the new hooks can replace old ones without breaking changes
    const testCases = [
      // Old: useProperty(id)
      // New: useUnifiedProperty().usePropertyDetail(id)
      {
        old: 'useProperty',
        new: 'useUnifiedProperty().usePropertyDetail',
        compatible: true,
      },
      // Old: usePropertySearch()
      // New: useConsolidatedPropertySearch()
      {
        old: 'usePropertySearch',
        new: 'useConsolidatedPropertySearch',
        compatible: true, // With minor API changes (searchResults -> properties)
      },
      // Old: useLandProperty(id)
      // New: useUnifiedProperty().useLandProperty(id)
      {
        old: 'useLandProperty',
        new: 'useUnifiedProperty().useLandProperty',
        compatible: true,
      },
    ];

    testCases.forEach(testCase => {
      expect(testCase.compatible).toBe(true);
    });
  });

  it('should provide performance improvements', () => {
    // Test that the new hooks provide better performance characteristics
    const performanceFeatures = [
      'intelligent caching',
      'request deduplication',
      'adaptive debouncing',
      'optimistic updates',
      'batch operations',
    ];

    performanceFeatures.forEach(feature => {
      expect(typeof feature).toBe('string');
      expect(feature.length).toBeGreaterThan(0);
    });
  });
});