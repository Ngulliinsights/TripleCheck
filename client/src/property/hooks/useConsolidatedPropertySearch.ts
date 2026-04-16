import { useState, useCallback, useMemo, useRef, useEffect } from "react"

import { useDebounce } from "../../local/hooks/useDebounce"
import { useSafePropertiesQuery } from "../../local/hooks/useSafeQuery"
import { Property } from "@shared/types/property"
import { SearchSuggestion } from "../../local/types/search"
import { PropertySearchParams } from "../types/property.types"

// Enhanced interfaces for consolidated search functionality
interface SearchHistoryEntry {
  id: string;
  params: PropertySearchParams;
  timestamp: number;
  resultCount?: number;
}

interface SearchMetrics {
  totalSearches: number;
  averageResponseTime: number;
  lastSearchTime: number;
  popularFilters: Record<string, number>;
}

// Using unified SearchSuggestion from shared types

interface ConsolidatedSearchOptions {
  debounceMs?: number;
  maxHistoryEntries?: number;
  enableSuggestions?: boolean;
  enableMetrics?: boolean;
  adaptiveDebounce?: boolean;
}

interface ConsolidatedSearchResult {
  // Data
  properties: Property[];
  totalCount: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Search state
  searchParams: PropertySearchParams;
  debouncedSearchParams: PropertySearchParams;
  
  // Actions
  updateSearch: (updates: Partial<PropertySearchParams>) => void;
  clearSearch: (options?: { keepLocation?: boolean; keepPriceRange?: boolean }) => void;
  resetFilters: () => void;
  goToPage: (page: number) => void;
  sortBy: (sortBy: PropertySearchParams["sortBy"], sortOrder?: PropertySearchParams["sortOrder"]) => void;
  
  // Advanced features
  searchHistory: SearchHistoryEntry[];
  searchSuggestions: SearchSuggestion[];
  metrics: SearchMetrics;
  hasActiveFilters: boolean;
  isSearchOptimal: boolean;
  
  // Utility functions
  applyFilterSet: (filters: Partial<PropertySearchParams>) => void;
  applyPreset: (preset: 'luxury' | 'budget' | 'family' | 'studio') => void;
  duplicateSearch: (historyId: string) => void;
}

const DEFAULT_SEARCH_PARAMS: PropertySearchParams = {
  query: "",
  location: "",
  page: 1,
  limit: 12,
  sortBy: "relevance",
  sortOrder: "desc",
} as const;

// Helper function to safely build PropertySearchParams
const buildSearchParams = (
  base: PropertySearchParams,
  updates: Partial<PropertySearchParams>
): PropertySearchParams => {
  const result: PropertySearchParams = {
    query: updates.query ?? base.query ?? "",
    location: updates.location ?? base.location ?? "",
    page: updates.page ?? base.page ?? 1,
    limit: updates.limit ?? base.limit ?? 12,
    sortBy: updates.sortBy ?? base.sortBy ?? "relevance",
    sortOrder: updates.sortOrder ?? base.sortOrder ?? "desc",
  };

  // Optional properties - only include if they have concrete values
  if (updates.priceMin !== undefined) {
    result.priceMin = updates.priceMin;
  } else if (base.priceMin !== undefined) {
    result.priceMin = base.priceMin;
  }

  if (updates.priceMax !== undefined) {
    result.priceMax = updates.priceMax;
  } else if (base.priceMax !== undefined) {
    result.priceMax = base.priceMax;
  }

  if (updates.propertyType !== undefined) {
    result.propertyType = updates.propertyType;
  } else if (base.propertyType !== undefined) {
    result.propertyType = base.propertyType;
  }

  if (updates.bedrooms !== undefined) {
    result.bedrooms = updates.bedrooms;
  } else if (base.bedrooms !== undefined) {
    result.bedrooms = base.bedrooms;
  }

  if (updates.bathrooms !== undefined) {
    result.bathrooms = updates.bathrooms;
  } else if (base.bathrooms !== undefined) {
    result.bathrooms = base.bathrooms;
  }

  if (updates.areaMin !== undefined) {
    result.areaMin = updates.areaMin;
  } else if (base.areaMin !== undefined) {
    result.areaMin = base.areaMin;
  }

  if (updates.areaMax !== undefined) {
    result.areaMax = updates.areaMax;
  } else if (base.areaMax !== undefined) {
    result.areaMax = base.areaMax;
  }

  return result;
};

// Check if search criteria (non-pagination) have changed
const hasSearchCriteriaChanged = (updates: Partial<PropertySearchParams>): boolean => {
  return Object.keys(updates).some(
    (key) => key !== "page" && key !== "limit" && 
    updates[key as keyof PropertySearchParams] !== undefined
  );
};

// Generate secure UUID for history entries
const generateId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * @deprecated This hook is deprecated in favor of the unified useSearch hook from src/search/hooks/useSearch.ts
 * Please migrate to useSearch for better error handling, caching, and enhanced features.
 * Migration guide: Use useSearch() instead of useConsolidatedPropertySearch()
 * 
 * Consolidated property search hook that combines functionality from:
 * - usePropertySearch.ts (search and filtering)
 * - Enhanced with intelligent suggestions, metrics, and history
 */
export function useConsolidatedPropertySearch(
  initialParams: Partial<PropertySearchParams> = {},
  options: ConsolidatedSearchOptions = {}
): ConsolidatedSearchResult {
  const {
    debounceMs = 500,
    maxHistoryEntries = 20,
    enableSuggestions = true,
    enableMetrics = true,
    adaptiveDebounce = true,
  } = options;

  // Core search state
  const [searchParams, setSearchParams] = useState<PropertySearchParams>({
    ...DEFAULT_SEARCH_PARAMS,
    ...initialParams,
  });
  
  // Advanced features state
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [metrics, setMetrics] = useState<SearchMetrics>({
    totalSearches: 0,
    averageResponseTime: 0,
    lastSearchTime: 0,
    popularFilters: {},
  });

  // Performance tracking
  const searchStartTime = useRef<number>(0);
  const lastKeystrokeTime = useRef<number>(0);
  const [adaptiveDelay, setAdaptiveDelay] = useState(debounceMs);

  // Adaptive debouncing based on typing speed
  const updateAdaptiveDelay = useCallback(() => {
    if (!adaptiveDebounce) return;
    
    const now = Date.now();
    const timeSinceLastKeystroke = now - lastKeystrokeTime.current;

    if (timeSinceLastKeystroke < 200) {
      setAdaptiveDelay(300); // Fast typing - reduce delay
    } else if (timeSinceLastKeystroke > 1000) {
      setAdaptiveDelay(800); // Slow typing - increase delay
    } else {
      setAdaptiveDelay(500); // Normal typing speed
    }

    lastKeystrokeTime.current = now;
  }, [adaptiveDebounce]);

  const debouncedSearchParams = useDebounce(searchParams, adaptiveDelay);

  // Convert to query parameters for API call
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    const entries = Object.entries(debouncedSearchParams) as Array<[keyof PropertySearchParams, unknown]>;
    
    entries.forEach(([key, value]) => {
      if (value !== undefined) {
        params[String(key)] = value;
      }
    });

    return params;
  }, [debouncedSearchParams]);

  // Use the safe properties query for actual data fetching
  const {
    data: searchResults,
    isLoading,
    error,
    cancelRequest,
  } = useSafePropertiesQuery(queryParams);

  // Resolve filter conflicts
  const resolveFilterConflicts = useCallback((params: PropertySearchParams): PropertySearchParams => {
    const resolved = { ...params };

    // Fix inverted price ranges
    if (resolved.priceMin && resolved.priceMax && resolved.priceMin > resolved.priceMax) {
      [resolved.priceMin, resolved.priceMax] = [resolved.priceMax, resolved.priceMin];
    }

    // Ensure reasonable bedroom/bathroom counts
    if (resolved.bedrooms !== undefined && resolved.bedrooms < 0) {
      resolved.bedrooms = 0;
    }
    if (resolved.bathrooms !== undefined && resolved.bathrooms < 0) {
      resolved.bathrooms = 0;
    }

    // Clear contradictory location filters
    if (resolved.query?.toLowerCase().includes("location:") && resolved.location) {
      resolved.location = "";
    }

    return resolved;
  }, []);

  // Main search update function
  const updateSearch = useCallback((updates: Partial<PropertySearchParams>) => {
    updateAdaptiveDelay();
    cancelRequest();

    setSearchParams((prev) => {
      const shouldResetPage = hasSearchCriteriaChanged(updates) && updates.page === undefined;
      const updatesWithPage = shouldResetPage ? { ...updates, page: 1 } : updates;
      const mergedParams = buildSearchParams(prev, updatesWithPage);
      return resolveFilterConflicts(mergedParams);
    });

    searchStartTime.current = Date.now();
  }, [cancelRequest, updateAdaptiveDelay, resolveFilterConflicts]);

  // Add search to history
  const addToHistory = useCallback((params: PropertySearchParams, resultCount?: number) => {
    if (!enableMetrics) return;

    const baseEntry = {
      id: generateId(),
      params: { ...params },
      timestamp: Date.now(),
    };

    const historyEntry: SearchHistoryEntry = 
      resultCount !== undefined ? { ...baseEntry, resultCount } : baseEntry;

    setSearchHistory((prev) => {
      // Deduplicate based on search criteria
      const isDuplicate = prev.some((entry) => {
        const { page, limit, ...existingCriteria } = entry.params;
        const { page: newPage, limit: newLimit, ...newCriteria } = params;
        return JSON.stringify(existingCriteria) === JSON.stringify(newCriteria);
      });

      if (isDuplicate) return prev;
      return [historyEntry, ...prev].slice(0, maxHistoryEntries);
    });
  }, [enableMetrics, maxHistoryEntries]);

  // Track filter usage for metrics
  const trackFilterUsage = useCallback((newPopularFilters: Record<string, number>) => {
    if (!enableMetrics) return;

    const params = debouncedSearchParams;
    
    if (params.query?.trim()) {
      newPopularFilters.query = (newPopularFilters.query || 0) + 1;
    }
    if (params.location?.trim()) {
      newPopularFilters.location = (newPopularFilters.location || 0) + 1;
    }
    if (params.sortBy && params.sortBy !== "relevance") {
      newPopularFilters.sortBy = (newPopularFilters.sortBy || 0) + 1;
    }
    if (params.priceMin !== undefined) {
      newPopularFilters.priceMin = (newPopularFilters.priceMin || 0) + 1;
    }
    if (params.priceMax !== undefined) {
      newPopularFilters.priceMax = (newPopularFilters.priceMax || 0) + 1;
    }
    if (params.propertyType) {
      newPopularFilters.propertyType = (newPopularFilters.propertyType || 0) + 1;
    }
    if (params.bedrooms !== undefined) {
      newPopularFilters.bedrooms = (newPopularFilters.bedrooms || 0) + 1;
    }
    if (params.bathrooms !== undefined) {
      newPopularFilters.bathrooms = (newPopularFilters.bathrooms || 0) + 1;
    }
  }, [debouncedSearchParams, enableMetrics]);

  // Update metrics when search completes
  useEffect(() => {
    if (!enableMetrics || !searchStartTime.current || isLoading) return;

    const responseTime = Date.now() - searchStartTime.current;

    setMetrics((prev) => {
      const newTotalSearches = prev.totalSearches + 1;
      const newAverageResponseTime = 
        (prev.averageResponseTime * prev.totalSearches + responseTime) / newTotalSearches;

      const newPopularFilters = { ...prev.popularFilters };
      trackFilterUsage(newPopularFilters);

      return {
        totalSearches: newTotalSearches,
        averageResponseTime: newAverageResponseTime,
        lastSearchTime: responseTime,
        popularFilters: newPopularFilters,
      };
    });

    // Add to history if successful
    if (searchResults && !error) {
      const resultCount = Array.isArray(searchResults) ? searchResults.length : 0;
      addToHistory(debouncedSearchParams, resultCount);
    }

    searchStartTime.current = 0;
  }, [isLoading, searchResults, error, debouncedSearchParams, addToHistory, trackFilterUsage, enableMetrics]);

  // Generate search suggestions
  const searchSuggestions = useMemo((): SearchSuggestion[] => {
    if (!enableSuggestions) return [];

    const suggestions: SearchSuggestion[] = [];
    const currentInput = searchParams.query?.toLowerCase() || "";

    if (!currentInput.trim()) return suggestions;

    // Extract suggestions from search history
    searchHistory.forEach((entry) => {
      if (entry.params.query?.toLowerCase().includes(currentInput)) {
        const suggestion: SearchSuggestion = {
          text: entry.params.query,
          type: 'query',
        };
        if (entry.resultCount !== undefined) {
          suggestion.count = entry.resultCount;
        }
        suggestions.push(suggestion);
      }
      if (entry.params.location?.toLowerCase().includes(currentInput)) {
        const suggestion: SearchSuggestion = {
          text: entry.params.location,
          type: 'location',
        };
        if (entry.resultCount !== undefined) {
          suggestion.count = entry.resultCount;
        }
        suggestions.push(suggestion);
      }
    });

    // Add popular patterns
    Object.entries(metrics.popularFilters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([key, count]) => {
        if (key.toLowerCase().includes(currentInput)) {
          suggestions.push({
            text: key,
            type: 'property',
            count,
          });
        }
      });

    // Deduplicate and limit
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        self.findIndex(s => s.text === suggestion.text) === index
      )
      .slice(0, 8);

    return uniqueSuggestions;
  }, [enableSuggestions, searchParams.query, searchHistory, metrics.popularFilters]);

  // Computed states
  const hasActiveFilters = useMemo(() => {
    const { query, location, priceMin, priceMax, propertyType, bedrooms, bathrooms } = debouncedSearchParams;
    return !!(query?.trim() || location?.trim() || priceMin || priceMax || propertyType || bedrooms || bathrooms);
  }, [debouncedSearchParams]);

  const isSearchOptimal = useMemo(() => {
    const hasLocation = !!debouncedSearchParams.location?.trim();
    const hasPriceRange = !!(debouncedSearchParams.priceMin || debouncedSearchParams.priceMax);
    const hasPropertyDetails = !!(debouncedSearchParams.bedrooms || debouncedSearchParams.bathrooms || debouncedSearchParams.propertyType);
    
    return hasLocation && (hasPriceRange || hasPropertyDetails);
  }, [debouncedSearchParams]);

  // Action functions
  const clearSearch = useCallback((options?: { keepLocation?: boolean; keepPriceRange?: boolean }) => {
    cancelRequest();

    let clearedParams = { ...DEFAULT_SEARCH_PARAMS };

    if (options?.keepLocation && searchParams.location) {
      clearedParams = { ...clearedParams, location: searchParams.location };
    }

    if (options?.keepPriceRange) {
      if (searchParams.priceMin !== undefined) {
        clearedParams = { ...clearedParams, priceMin: searchParams.priceMin };
      }
      if (searchParams.priceMax !== undefined) {
        clearedParams = { ...clearedParams, priceMax: searchParams.priceMax };
      }
    }

    setSearchParams(clearedParams);
  }, [cancelRequest, searchParams.location, searchParams.priceMin, searchParams.priceMax]);

  const resetFilters = useCallback(() => clearSearch({ keepLocation: true }), [clearSearch]);

  const goToPage = useCallback((page: number) => updateSearch({ page }), [updateSearch]);

  const sortBy = useCallback((
    sortBy: PropertySearchParams["sortBy"],
    sortOrder: PropertySearchParams["sortOrder"] = "desc"
  ) => {
    if (sortBy != null) {
      updateSearch({ sortBy, sortOrder });
    }
  }, [updateSearch]);

  const applyFilterSet = useCallback((filters: Partial<PropertySearchParams>) => {
    updateSearch({ ...filters, page: 1 });
  }, [updateSearch]);

  const applyPreset = useCallback((preset: 'luxury' | 'budget' | 'family' | 'studio') => {
    let presetConfig: Partial<PropertySearchParams>;

    switch (preset) {
      case "luxury":
        presetConfig = {
          priceMin: 500000,
          bedrooms: 3,
          bathrooms: 2,
          sortBy: "price",
          sortOrder: "desc",
        };
        break;
      case "budget":
        presetConfig = {
          priceMax: 200000,
          sortBy: "price",
          sortOrder: "asc",
        };
        break;
      case "family":
        presetConfig = {
          bedrooms: 3,
          bathrooms: 2,
          propertyType: "house",
        };
        break;
      case "studio":
        presetConfig = {
          bedrooms: 0,
          bathrooms: 1,
          propertyType: "apartment",
        };
        break;
      default:
        return;
    }

    applyFilterSet(presetConfig);
  }, [applyFilterSet]);

  const duplicateSearch = useCallback((historyId: string) => {
    const historyEntry = searchHistory.find(entry => entry.id === historyId);
    if (historyEntry) {
      setSearchParams({ ...historyEntry.params, page: 1 });
    }
  }, [searchHistory]);

  // Extract properties and metadata from search results
  const properties = useMemo(() => {
    return Array.isArray(searchResults) ? searchResults : [];
  }, [searchResults]);

  const totalCount = useMemo(() => {
    return properties.length;
  }, [properties]);

  const hasNextPage = useMemo(() => {
    return searchParams.page * searchParams.limit < totalCount;
  }, [searchParams.page, searchParams.limit, totalCount]);

  return {
    // Data
    properties,
    totalCount,
    hasNextPage,
    isLoading,
    error: error || null,
    
    // Search state
    searchParams,
    debouncedSearchParams,
    
    // Actions
    updateSearch,
    clearSearch,
    resetFilters,
    goToPage,
    sortBy,
    
    // Advanced features
    searchHistory,
    searchSuggestions,
    metrics,
    hasActiveFilters,
    isSearchOptimal,
    
    // Utility functions
    applyFilterSet,
    applyPreset,
    duplicateSearch,
  };
}

export default useConsolidatedPropertySearch;