import { useState, useCallback, useMemo, useRef, useEffect } from "react";

import { useDebounce } from "../../shared/hooks/useDebounce";
import { PropertySearchParams } from "../types/property.types";

import { useProperties } from "./useProperty";

// Enhanced interface for search history management
interface SearchHistoryEntry {
  id: string;
  params: PropertySearchParams;
  timestamp: number;
  resultCount?: number; // Optional property for result count
}

// Interface for search analytics and performance tracking
interface SearchMetrics {
  totalSearches: number;
  averageResponseTime: number;
  lastSearchTime: number;
  popularFilters: Record<string, number>;
}

// Helper function to safely build PropertySearchParams without undefined values
// This ensures we never assign undefined to required properties
const buildSearchParams = (
  base: PropertySearchParams,
  updates: Partial<PropertySearchParams>
): PropertySearchParams => {
  // Start with a clean base that satisfies all required properties
  // We ensure each required property has a concrete value, never undefined
  const result: PropertySearchParams = {
    // Required properties - always provide concrete values by using nullish coalescing
    query: updates.query ?? base.query ?? "",
    location: updates.location ?? base.location ?? "",
    page: updates.page ?? base.page ?? 1,
    limit: updates.limit ?? base.limit ?? 12,
    sortBy: updates.sortBy ?? base.sortBy ?? "relevance",
    sortOrder: updates.sortOrder ?? base.sortOrder ?? "desc",
  };

  // Optional properties - only include if they have concrete values from either source
  // This approach satisfies exactOptionalPropertyTypes by never setting properties to undefined
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

// Determines if search criteria (non-pagination) have changed
// This helps us decide when to reset pagination
const hasSearchCriteriaChanged = (
  updates: Partial<PropertySearchParams>
): boolean => {
  return Object.keys(updates).some(
    (key) =>
      key !== "page" &&
      key !== "limit" &&
      updates[key as keyof PropertySearchParams] !== undefined
  );
};

const DEFAULT_SEARCH_PARAMS: PropertySearchParams = {
  query: "",
  location: "",
  page: 1,
  limit: 12,
  sortBy: "relevance",
  sortOrder: "desc",
} as const;

export function usePropertySearch() {
  const [searchParams, setSearchParams] = useState<PropertySearchParams>(
    DEFAULT_SEARCH_PARAMS
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [metrics, setMetrics] = useState<SearchMetrics>({
    totalSearches: 0,
    averageResponseTime: 0,
    lastSearchTime: 0,
    popularFilters: {},
  });

  // Performance tracking references
  const searchStartTime = useRef<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Smart debouncing that adapts based on user behavior
  // Fast typers get shorter delays, slow typers get longer delays to save API calls
  const [adaptiveDelay, setAdaptiveDelay] = useState(500);
  const lastKeystrokeTime = useRef<number>(0);

  const debouncedSearchParams = useDebounce(searchParams, adaptiveDelay);

  const {
    data: searchResults,
    isLoading,
    error,
    cancelRequest,
  } = useProperties(debouncedSearchParams);

  // Resolve conflicts between filter combinations (e.g., price ranges, bed/bath counts)
  // This function ensures that user input doesn't create impossible search criteria
  const resolveFilterConflicts = useCallback(
    (params: PropertySearchParams): PropertySearchParams => {
      const resolved = { ...params };

      // Fix inverted price ranges - swap min/max if they're backwards
      if (
        resolved.priceMin &&
        resolved.priceMax &&
        resolved.priceMin > resolved.priceMax
      ) {
        [resolved.priceMin, resolved.priceMax] = [
          resolved.priceMax,
          resolved.priceMin,
        ];
      }

      // Ensure reasonable bedroom/bathroom counts - negative values don't make sense
      if (resolved.bedrooms !== undefined && resolved.bedrooms < 0) {
        resolved.bedrooms = 0;
      }
      if (resolved.bathrooms !== undefined && resolved.bathrooms < 0) {
        resolved.bathrooms = 0;
      }

      // Clear contradictory location filters to avoid confusion
      if (
        resolved.query?.toLowerCase().includes("location:") &&
        resolved.location
      ) {
        // If query contains location specification, clear separate location field
        resolved.location = "";
      }

      return resolved;
    },
    []
  );

  // Adaptive debounce delay calculation based on typing speed
  // This creates a more responsive search experience by adapting to user behavior
  const updateAdaptiveDelay = useCallback(() => {
    const now = Date.now();
    const timeSinceLastKeystroke = now - lastKeystrokeTime.current;

    if (timeSinceLastKeystroke < 200) {
      // Fast typing detected - reduce delay for better responsiveness
      setAdaptiveDelay(300);
    } else if (timeSinceLastKeystroke > 1000) {
      // Slow typing detected - increase delay to reduce unnecessary API calls
      setAdaptiveDelay(800);
    } else {
      // Normal typing speed - use standard delay
      setAdaptiveDelay(500);
    }

    lastKeystrokeTime.current = now;
  }, []);

  // Simplified search update function with reduced cognitive complexity
  // This is the core function that handles all search parameter updates
  const updateSearch = useCallback(
    (updates: Partial<PropertySearchParams>) => {
      updateAdaptiveDelay();

      // Cancel any pending requests and timeouts to prevent race conditions
      cancelRequest();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      setSearchParams((prev) => {
        // Determine if we need to reset pagination based on search criteria changes
        const shouldResetPage =
          hasSearchCriteriaChanged(updates) && updates.page === undefined;

        // Build the updated parameters with proper page handling
        const updatesWithPage =
          shouldResetPage ? { ...updates, page: 1 } : updates;

        // Use our helper function to safely build the new parameters
        const mergedParams = buildSearchParams(prev, updatesWithPage);

        // Apply conflict resolution and return the final parameters
        return resolveFilterConflicts(mergedParams);
      });

      // Track search metrics for performance optimization
      searchStartTime.current = Date.now();
    },
    [cancelRequest, updateAdaptiveDelay, resolveFilterConflicts]
  );

  // Generate secure UUID using modern browser API with proper fallback
  // Using a more robust approach that handles browser compatibility
  const generateId = useCallback((): string => {
    // Use optional chaining for cleaner, more readable code
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    // Fallback implementation for environments without crypto.randomUUID
    // This generates a UUID v4-compliant string using Math.random
    // Note: This is acceptable for UI component IDs, not security-critical operations
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      // Using Math.random is acceptable here as this is only for UI component IDs, not security tokens
      // eslint-disable-next-line sonarjs/pseudo-random
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  // Advanced search history management with deduplication and intelligent suggestions
  // This function prevents duplicate entries while preserving useful search history
  const addToHistory = useCallback(
    (params: PropertySearchParams, resultCount?: number) => {
      // Create history entry with proper typing to satisfy exactOptionalPropertyTypes
      const baseEntry = {
        id: generateId(),
        params: { ...params },
        timestamp: Date.now(),
      };

      // Only add resultCount if it's actually defined - this satisfies exact optional types
      const historyEntry: SearchHistoryEntry =
        resultCount !== undefined ? { ...baseEntry, resultCount } : baseEntry;

      setSearchHistory((prev) => {
        // Deduplicate based on search criteria (ignoring pagination parameters)
        const isDuplicate = prev.some((entry) => {
          // Compare search criteria without page/limit parameters
          const entryCriteria = { ...entry.params };
          const newCriteria = { ...params };

          // Remove pagination parameters from comparison
          delete entryCriteria.page;
          delete entryCriteria.limit;
          delete newCriteria.page;
          delete newCriteria.limit;

          // Use JSON comparison for deep equality (simple but effective for our use case)
          return JSON.stringify(entryCriteria) === JSON.stringify(newCriteria);
        });

        if (isDuplicate) return prev;

        // Keep only the 20 most recent unique searches for performance
        return [historyEntry, ...prev].slice(0, 20);
      });
    },
    [generateId]
  );

  // Safe metrics tracking that explicitly handles each property
  // This function explicitly handles each property to avoid security warnings
  const trackFilterUsage = useCallback(
    (newPopularFilters: Record<string, number>) => {
      // Explicitly check each property to avoid security warnings about dynamic access
      // This approach is more verbose but eliminates all security concerns
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
      if (params.sortOrder && params.sortOrder !== "desc") {
        newPopularFilters.sortOrder = (newPopularFilters.sortOrder || 0) + 1;
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
      if (params.areaMin !== undefined) {
        newPopularFilters.areaMin = (newPopularFilters.areaMin || 0) + 1;
      }
      if (params.areaMax !== undefined) {
        newPopularFilters.areaMax = (newPopularFilters.areaMax || 0) + 1;
      }
    },
    [debouncedSearchParams]
  );

  // Performance metrics tracking with safe property access
  // This useEffect monitors search performance and builds analytics data
  useEffect(() => {
    if (!isLoading && searchStartTime.current > 0) {
      const responseTime = Date.now() - searchStartTime.current;

      setMetrics((prev) => {
        const newTotalSearches = prev.totalSearches + 1;
        // Calculate running average of response times
        const newAverageResponseTime =
          (prev.averageResponseTime * prev.totalSearches + responseTime) /
          newTotalSearches;

        // Track popular filter usage for analytics using safe property access
        const newPopularFilters = { ...prev.popularFilters };
        trackFilterUsage(newPopularFilters);

        return {
          totalSearches: newTotalSearches,
          averageResponseTime: newAverageResponseTime,
          lastSearchTime: responseTime,
          popularFilters: newPopularFilters,
        };
      });

      // Add successful searches to history for future reference
      if (searchResults && !error) {
        // Extract result count in a type-safe manner
        let resultCount: number | undefined;

        // Handle different possible response structures safely
        if (searchResults && typeof searchResults === "object") {
          // Check if response has a total property (common API pattern)
          if (
            "total" in searchResults &&
            typeof searchResults.total === "number"
          ) {
            resultCount = searchResults.total;
          }
          // Check if response is an array (direct results)
          else if (Array.isArray(searchResults)) {
            resultCount = searchResults.length;
          }
        }

        addToHistory(debouncedSearchParams, resultCount);
      }

      // Reset the timing tracker
      searchStartTime.current = 0;
    }
  }, [
    isLoading,
    searchResults,
    error,
    debouncedSearchParams,
    addToHistory,
    trackFilterUsage,
  ]);

  // Intelligent search suggestions based on history and popular patterns
  // This function provides autocomplete-style suggestions to improve user experience
  const getSearchSuggestions = useCallback(
    (currentInput: string): string[] => {
      if (!currentInput.trim()) return [];

      const suggestions = new Set<string>();
      const input = currentInput.toLowerCase();

      // Extract suggestions from search history
      searchHistory.forEach((entry) => {
        // Check query field for matches
        if (entry.params.query?.toLowerCase().includes(input)) {
          suggestions.add(entry.params.query);
        }
        // Check location field for matches
        if (entry.params.location?.toLowerCase().includes(input)) {
          suggestions.add(entry.params.location);
        }
      });

      // Add popular search patterns based on usage metrics
      const popularQueries = Object.entries(metrics.popularFilters)
        .sort(([, a], [, b]) => b - a) // Sort by popularity (descending)
        .slice(0, 5) // Take top 5 most popular
        .map(([key]) => key)
        .filter((key) => key.toLowerCase().includes(input));

      popularQueries.forEach((query) => suggestions.add(query));

      // Return up to 8 suggestions to avoid overwhelming the UI
      return Array.from(suggestions).slice(0, 8);
    },
    [searchHistory, metrics.popularFilters]
  );

  // Bulk filter operations for advanced filtering UI components
  // This allows applying multiple filters simultaneously
  const applyFilterSet = useCallback(
    (filters: Partial<PropertySearchParams>) => {
      updateSearch({ ...filters, page: 1 });
    },
    [updateSearch]
  );

  // Quick filter presets for common search scenarios with safe property access
  // This provides one-click access to popular search configurations
  const applyPreset = useCallback(
    (preset: "luxury" | "budget" | "family" | "studio") => {
      // Define presets with explicit typing to avoid dynamic access issues
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
          // This should never happen with the typed parameter, but we handle it for completeness
          return;
      }

      applyFilterSet(presetConfig);
    },
    [applyFilterSet]
  );

  // Enhanced clear function with selective clearing options
  // This provides flexible reset functionality for different use cases
  const clearSearch = useCallback(
    (options?: { keepLocation?: boolean; keepPriceRange?: boolean }) => {
      cancelRequest();

      let clearedParams = { ...DEFAULT_SEARCH_PARAMS };

      // Optionally preserve location if requested
      if (options?.keepLocation && searchParams.location) {
        clearedParams = { ...clearedParams, location: searchParams.location };
      }

      // Optionally preserve price range if requested
      if (options?.keepPriceRange) {
        if (searchParams.priceMin !== undefined) {
          clearedParams = { ...clearedParams, priceMin: searchParams.priceMin };
        }
        if (searchParams.priceMax !== undefined) {
          clearedParams = { ...clearedParams, priceMax: searchParams.priceMax };
        }
      }

      setSearchParams(clearedParams);
    },
    [
      cancelRequest,
      searchParams.location,
      searchParams.priceMin,
      searchParams.priceMax,
    ]
  );

  // Advanced computed states for complex UI scenarios
  // This determines if any search filters are currently active
  const hasActiveFilters = useMemo(() => {
    const {
      query,
      location,
      priceMin,
      priceMax,
      propertyType,
      bedrooms,
      bathrooms,
    } = debouncedSearchParams;
    return !!(
      query?.trim() ||
      location?.trim() ||
      priceMin ||
      priceMax ||
      propertyType ||
      bedrooms ||
      bathrooms
    );
  }, [debouncedSearchParams]);

  // Determines if current search parameters are likely to return good results
  // This can be used to show search optimization hints to users
  const isSearchOptimal = useMemo(() => {
    const hasLocation = !!debouncedSearchParams.location?.trim();
    const hasPriceRange = !!(
      debouncedSearchParams.priceMin || debouncedSearchParams.priceMax
    );
    const hasPropertyDetails = !!(
      debouncedSearchParams.bedrooms ||
      debouncedSearchParams.bathrooms ||
      debouncedSearchParams.propertyType
    );

    return hasLocation && (hasPriceRange || hasPropertyDetails);
  }, [debouncedSearchParams]);

  // Helper functions for common operations
  const goToPage = useCallback(
    (page: number) => updateSearch({ page }),
    [updateSearch]
  );

  const sortBy = useCallback(
    (
      sortBy: PropertySearchParams["sortBy"],
      sortOrder: PropertySearchParams["sortOrder"] = "desc"
    ) => {
      // Ensure we don't pass undefined values to updateSearch
      if (sortBy !== undefined) {
        updateSearch({ sortBy, sortOrder });
      }
    },
    [updateSearch]
  );

  // Reset all filters but keep location for user convenience
  const resetFilters = useCallback(
    () => clearSearch({ keepLocation: true }),
    [clearSearch]
  );

  // Restore a search from history
  const duplicateSearch = useCallback(
    (historyId: string) => {
      const historyEntry = searchHistory.find(
        (entry) => entry.id === historyId
      );
      if (historyEntry) {
        setSearchParams({ ...historyEntry.params, page: 1 });
      }
    },
    [searchHistory]
  );

  return {
    // Core search state
    searchParams,
    debouncedSearchParams,
    searchResults,
    isLoading,
    error,

    // Enhanced actions
    updateSearch,
    clearSearch,
    cancelRequest,
    applyFilterSet,
    applyPreset,

    // Intelligence features
    searchHistory,
    getSearchSuggestions,
    metrics,

    // Advanced computed state
    hasActiveFilters,
    isSearchOptimal,
    adaptiveDelay,

    // Utility functions
    goToPage,
    sortBy,
    resetFilters,
    duplicateSearch,
  } as const;
}