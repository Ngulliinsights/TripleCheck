import { useState, useCallback, useMemo, useRef, useEffect } from "react";

import { useDebounce } from "../../local/hooks/useDebounce";
import { useSafePropertiesQuery } from "../../local/hooks/useSafeQuery";
import { PropertySearchParams } from "../types/property.types";

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

const OPTIONAL_FILTER_KEYS = [
  "priceMin",
  "priceMax",
  "propertyType",
  "bedrooms",
  "bathrooms",
  "areaMin",
  "areaMax",
] as const satisfies ReadonlyArray<keyof PropertySearchParams>;

type OptionalFilterKey = (typeof OPTIONAL_FILTER_KEYS)[number];

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

  for (const key of OPTIONAL_FILTER_KEYS) {
    const value = (updates[key] ?? base[key]) as
      | PropertySearchParams[OptionalFilterKey]
      | undefined;
    if (value !== undefined) {
      result[key as OptionalFilterKey] = value as never;
    }
  }

  return result;
};

const hasSearchCriteriaChanged = (
  updates: Partial<PropertySearchParams>
): boolean =>
  Object.keys(updates).some(
    (key) =>
      key !== "page" &&
      key !== "limit" &&
      updates[key as keyof PropertySearchParams] !== undefined
  );

const DEFAULT_SEARCH_PARAMS: PropertySearchParams = {
  query: "",
  location: "",
  page: 1,
  limit: 12,
  sortBy: "relevance",
  sortOrder: "desc",
} as const;

/**
 * @deprecated Use `useSearch` from `src/search/hooks/useSearch.ts` instead.
 * This hook will be removed in a future release.
 */
export function usePropertySearch() {
  const deprecationWarned = useRef(false);
  if (process.env.NODE_ENV === "development" && !deprecationWarned.current) {
    deprecationWarned.current = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] usePropertySearch is deprecated. Migrate to useSearch for better error handling, caching, and enhanced features."
    );
  }

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

  const searchStartTime = useRef<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastKeystrokeTime = useRef<number>(0);
  const [adaptiveDelay, setAdaptiveDelay] = useState(500);

  const debouncedSearchParams = useDebounce(searchParams, adaptiveDelay);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(debouncedSearchParams)) {
      if (value !== undefined) params[key] = value;
    }
    return params;
  }, [debouncedSearchParams]);

  const {
    data: searchResults,
    isLoading,
    error,
    cancelRequest,
  } = useSafePropertiesQuery(queryParams);

  const resolveFilterConflicts = useCallback(
    (params: PropertySearchParams): PropertySearchParams => {
      const resolved = { ...params };

      if (
        resolved.priceMin !== undefined &&
        resolved.priceMax !== undefined &&
        resolved.priceMin > resolved.priceMax
      ) {
        [resolved.priceMin, resolved.priceMax] = [
          resolved.priceMax,
          resolved.priceMin,
        ];
      }

      if (resolved.bedrooms !== undefined && resolved.bedrooms < 0) {
        resolved.bedrooms = 0;
      }
      if (resolved.bathrooms !== undefined && resolved.bathrooms < 0) {
        resolved.bathrooms = 0;
      }

      if (
        resolved.query?.toLowerCase().includes("location:") &&
        resolved.location
      ) {
        resolved.location = "";
      }

      return resolved;
    },
    []
  );

  const updateAdaptiveDelay = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastKeystrokeTime.current;

    if (elapsed < 200) {
      setAdaptiveDelay(300);
    } else if (elapsed > 1000) {
      setAdaptiveDelay(800);
    } else {
      setAdaptiveDelay(500);
    }

    lastKeystrokeTime.current = now;
  }, []);

  const updateSearch = useCallback(
    (updates: Partial<PropertySearchParams>) => {
      updateAdaptiveDelay();
      cancelRequest();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      setSearchParams((prev) => {
        const shouldResetPage =
          hasSearchCriteriaChanged(updates) && updates.page === undefined;
        const mergedParams = buildSearchParams(
          prev,
          shouldResetPage ? { ...updates, page: 1 } : updates
        );
        return resolveFilterConflicts(mergedParams);
      });

      searchStartTime.current = Date.now();
    },
    [cancelRequest, updateAdaptiveDelay, resolveFilterConflicts]
  );

  const generateId = (): string => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  const getSearchCriteriaOnly = useCallback(
    (params: PropertySearchParams) => {
      const { page: _page, limit: _limit, ...criteria } = params;
      return criteria;
    },
    []
  );

  const isDuplicateSearch = useCallback(
    (a: PropertySearchParams, b: PropertySearchParams) =>
      JSON.stringify(getSearchCriteriaOnly(a)) ===
      JSON.stringify(getSearchCriteriaOnly(b)),
    [getSearchCriteriaOnly]
  );

  const addToHistory = useCallback(
    (params: PropertySearchParams, resultCount?: number) => {
      const baseEntry = {
        id: generateId(),
        params: { ...params },
        timestamp: Date.now(),
      };

      const historyEntry: SearchHistoryEntry =
        resultCount !== undefined ? { ...baseEntry, resultCount } : baseEntry;

      setSearchHistory((prev) => {
        if (prev.some((entry) => isDuplicateSearch(entry.params, params))) {
          return prev;
        }
        return [historyEntry, ...prev].slice(0, 20);
      });
    },
    [isDuplicateSearch]
  );

  const trackFilterUsage = useCallback(
    (filters: Record<string, number>) => {
      const p = debouncedSearchParams;
      if (p.query?.trim()) filters.query = (filters.query ?? 0) + 1;
      if (p.location?.trim()) filters.location = (filters.location ?? 0) + 1;
      if (p.sortBy && p.sortBy !== "relevance") filters.sortBy = (filters.sortBy ?? 0) + 1;
      if (p.sortOrder && p.sortOrder !== "desc") filters.sortOrder = (filters.sortOrder ?? 0) + 1;
      if (p.priceMin !== undefined) filters.priceMin = (filters.priceMin ?? 0) + 1;
      if (p.priceMax !== undefined) filters.priceMax = (filters.priceMax ?? 0) + 1;
      if (p.propertyType) filters.propertyType = (filters.propertyType ?? 0) + 1;
      if (p.bedrooms !== undefined) filters.bedrooms = (filters.bedrooms ?? 0) + 1;
      if (p.bathrooms !== undefined) filters.bathrooms = (filters.bathrooms ?? 0) + 1;
      if (p.areaMin !== undefined) filters.areaMin = (filters.areaMin ?? 0) + 1;
      if (p.areaMax !== undefined) filters.areaMax = (filters.areaMax ?? 0) + 1;
    },
    [debouncedSearchParams]
  );

  useEffect(() => {
    if (!isLoading && searchStartTime.current > 0) {
      const responseTime = Date.now() - searchStartTime.current;

      setMetrics((prev) => {
        const newTotal = prev.totalSearches + 1;
        const newAvg =
          (prev.averageResponseTime * prev.totalSearches + responseTime) /
          newTotal;
        const newFilters = { ...prev.popularFilters };
        trackFilterUsage(newFilters);
        return {
          totalSearches: newTotal,
          averageResponseTime: newAvg,
          lastSearchTime: responseTime,
          popularFilters: newFilters,
        };
      });

      if (searchResults && !error) {
        const resultCount = Array.isArray(searchResults)
          ? searchResults.length
          : undefined;
        addToHistory(debouncedSearchParams, resultCount);
      }

      searchStartTime.current = 0;
    }
  }, [isLoading, searchResults, error, debouncedSearchParams, addToHistory, trackFilterUsage]);

  const getSearchSuggestions = useCallback(
    (currentInput: string): string[] => {
      if (!currentInput.trim()) return [];

      const suggestions = new Set<string>();
      const input = currentInput.toLowerCase();

      for (const entry of searchHistory) {
        if (entry.params.query?.toLowerCase().includes(input)) {
          suggestions.add(entry.params.query);
        }
        if (entry.params.location?.toLowerCase().includes(input)) {
          suggestions.add(entry.params.location);
        }
      }

      Object.entries(metrics.popularFilters)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([key]) => key)
        .filter((key) => key.toLowerCase().includes(input))
        .forEach((key) => suggestions.add(key));

      return Array.from(suggestions).slice(0, 8);
    },
    [searchHistory, metrics.popularFilters]
  );

  const applyFilterSet = useCallback(
    (filters: Partial<PropertySearchParams>) =>
      updateSearch({ ...filters, page: 1 }),
    [updateSearch]
  );

  const applyPreset = useCallback(
    (preset: "luxury" | "budget" | "family" | "studio") => {
      const presets: Record<typeof preset, Partial<PropertySearchParams>> = {
        luxury: { priceMin: 500000, bedrooms: 3, bathrooms: 2, sortBy: "price", sortOrder: "desc" },
        budget: { priceMax: 200000, sortBy: "price", sortOrder: "asc" },
        family: { bedrooms: 3, bathrooms: 2, propertyType: "house" },
        studio: { bedrooms: 0, bathrooms: 1, propertyType: "apartment" },
      };
      applyFilterSet(presets[preset]);
    },
    [applyFilterSet]
  );

  const clearSearch = useCallback(
    (options?: { keepLocation?: boolean; keepPriceRange?: boolean }) => {
      cancelRequest();
      let cleared = { ...DEFAULT_SEARCH_PARAMS };

      if (options?.keepLocation && searchParams.location) {
        cleared = { ...cleared, location: searchParams.location };
      }
      if (options?.keepPriceRange) {
        if (searchParams.priceMin !== undefined) cleared = { ...cleared, priceMin: searchParams.priceMin };
        if (searchParams.priceMax !== undefined) cleared = { ...cleared, priceMax: searchParams.priceMax };
      }

      setSearchParams(cleared);
    },
    [cancelRequest, searchParams.location, searchParams.priceMin, searchParams.priceMax]
  );

  const hasActiveFilters = useMemo(() => {
    const { query, location, priceMin, priceMax, propertyType, bedrooms, bathrooms } =
      debouncedSearchParams;
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

  const isSearchOptimal = useMemo(() => {
    const hasLocation = !!debouncedSearchParams.location?.trim();
    const hasPriceRange = !!(debouncedSearchParams.priceMin || debouncedSearchParams.priceMax);
    const hasPropertyDetails = !!(
      debouncedSearchParams.bedrooms ||
      debouncedSearchParams.bathrooms ||
      debouncedSearchParams.propertyType
    );
    return hasLocation && (hasPriceRange || hasPropertyDetails);
  }, [debouncedSearchParams]);

  const goToPage = useCallback(
    (page: number) => updateSearch({ page }),
    [updateSearch]
  );

  const sortBy = useCallback(
    (
      field: PropertySearchParams["sortBy"],
      order: PropertySearchParams["sortOrder"] = "desc"
    ) => {
      if (field != null) updateSearch({ sortBy: field, sortOrder: order });
    },
    [updateSearch]
  );

  const resetFilters = useCallback(
    () => clearSearch({ keepLocation: true }),
    [clearSearch]
  );

  const duplicateSearch = useCallback(
    (historyId: string) => {
      const entry = searchHistory.find((e) => e.id === historyId);
      if (entry) setSearchParams({ ...entry.params, page: 1 });
    },
    [searchHistory]
  );

  return {
    searchParams,
    debouncedSearchParams,
    searchResults,
    isLoading,
    error,
    updateSearch,
    clearSearch,
    cancelRequest,
    applyFilterSet,
    applyPreset,
    searchHistory,
    getSearchSuggestions,
    metrics,
    hasActiveFilters,
    isSearchOptimal,
    adaptiveDelay,
    goToPage,
    sortBy,
    resetFilters,
    duplicateSearch,
  } as const;
}