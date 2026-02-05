import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  RefreshCw,
  Grid,
  List,
  Search,
  Filter,
  X,
} from "lucide-react"
import React, { useState, useCallback, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { useDebounce } from "../../hooks/useDebounce"
import { useFilterState } from "../../hooks/useFilterState"
import type {
  BasePropertyFilters,
  PropertyTypeConfig,
  NormalizedProperty,
  ViewMode,
  SortOption,
} from "../../types/property"
import {
  EnhancedVirtualizedPropertyList,
  useVirtualizedPropertyList,
} from "../EnhancedVirtualizedPropertyList"
import { Pagination } from "../Pagination"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Collapsible, CollapsibleContent } from "../ui/collapsible"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"

import { PropertySkeletonGrid } from "./PropertySkeletonGrid"

interface PropertyListingPageProps<
  TFilters extends BasePropertyFilters,
  TProperty,
> {
  readonly config: PropertyTypeConfig<TFilters, TProperty>;
  readonly className?: string;
  readonly enableCompare?: boolean;
  readonly enablePhotoManagement?: boolean;
  readonly heroConfig?: {
    readonly title: string;
    readonly subtitle: string;
    readonly backgroundImage?: string;
  };
}

/**
 * Generic property listing page component
 * Provides consistent layout and functionality across all property types
 */
export function PropertyListingPage<
  TFilters extends BasePropertyFilters,
  TProperty,
>({
  config,
  className = "",
  enableCompare: _enableCompare = true,
  enablePhotoManagement: _enablePhotoManagement = true,
  heroConfig,
}: PropertyListingPageProps<TFilters, TProperty>): React.ReactElement {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);

  // Filter state management
  const {
    filters,
    setFilters,
    updateFilter,
    reset: resetFilters,
    debouncedFilters,
    isValid: filtersValid,
    hasActiveFilters,
  } = useFilterState({
    defaultFilters: config.defaultFilters as Record<string, unknown>,
    debounceMs: 300,
    syncWithUrl: true,
  });

  // Simple clear filter function
  const clearFilter = useCallback(
    (key: keyof TFilters) => {
      const clearedFilters = { ...filters } as Record<string, unknown>;
      const keyStr = String(key);
      if (keyStr === "query" || keyStr === "location") {
        // Use safe property assignment
        Object.assign(clearedFilters, { [keyStr]: "" });
        // Also clear local search state
        if (keyStr === "query") setSearchQuery("");
        if (keyStr === "location") setLocationQuery("");
      } else {
        // Use safe property assignment
        Object.assign(clearedFilters, { [keyStr]: null });
      }
      setFilters(clearedFilters);
    },
    [filters, setFilters]
  );

  // Enhanced search parameters combining filters with debounced search
  const searchParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ...debouncedFilters,
      page: currentPage,
      pageSize: 12,
      sortBy,
    };

    // Override with debounced search queries
    if (debouncedSearchQuery) {
      params.query = debouncedSearchQuery;
    }
    if (debouncedLocationQuery) {
      params.location = debouncedLocationQuery;
    }

    return params;
  }, [
    debouncedFilters,
    currentPage,
    sortBy,
    debouncedSearchQuery,
    debouncedLocationQuery,
  ]);

  // Data fetching using React Query with the configuration's fetcher function
  const {
    data: propertiesResult,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...config.queryKey, searchParams],
    queryFn: async () => {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔍 Fetching properties with params:", searchParams);
      }
      const page = (searchParams.page as number) || 1;
      const pageSize = (searchParams.pageSize as number) || 12;
      const filters = { ...searchParams } as unknown as TFilters;
      const filtersObj = filters as Record<string, unknown>;
      delete filtersObj.page;
      delete filtersObj.pageSize;
      delete filtersObj.sortBy;
      
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("📋 Calling fetcher with filters:", filters, "page:", page, "pageSize:", pageSize);
      }
      const result = await config.fetcher(filters, page, pageSize);
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("✅ Fetcher result:", result);
      }
      return result; // Return the full result object
    },
    enabled: filtersValid,
    staleTime: 30000, // 30 seconds cache
  });

  // Mock the additional properties that were expected from useSafePropertiesQuery
  const hasValidData = !!propertiesResult?.items;
  const requestStats = null;

  // Extract data properties with safe defaults
  const items = useMemo(() => {
    const result = propertiesResult?.items || [];
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("📊 Items extracted:", result.length, "items");
    }
    return result;
  }, [propertiesResult]);

  const totalCount = useMemo(() => {
    const count = propertiesResult?.totalCount || 0;
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("📈 Total count:", count);
    }
    return count;
  }, [propertiesResult]);

  const totalPages = propertiesResult?.totalPages || Math.ceil(totalCount / 12);
  const isEmpty = items.length === 0;
  const isError = !!error;
  const isFetching = isLoading || isRefetching;



  // Determine if virtualization should be used (1000+ items)
  const shouldUseVirtualization = totalCount >= 1000 || useVirtualization;

  // Pagination function
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Adapt properties to normalized format with enhanced memoization
  const normalizedProperties = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map((item) => config.adapter(item as TProperty));
  }, [items, config]); // Include full config to satisfy dependency

  // Virtualized list hook
  const { dimensions, itemsPerRow } = useVirtualizedPropertyList(
    normalizedProperties,
    viewMode,
    containerRef
  );

  // Event handlers - removed unused handleFilterChange

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const handlePropertyClick = useCallback(
    (property: NormalizedProperty) => {
      // All properties (including land) now use the unified /property/:id route
      // The PropertyDetails component handles different property types internally
      const route = `/property/${property.id}`;
      
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔗 Navigating to property:", {
          propertyId: property.id,
          propertyTitle: property.title,
          propertyCategory: property.category,
          route,
        });
      }
      
      navigate(route);
    },
    [navigate]
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      refetch();
    },
    [refetch]
  );

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const toggleVirtualization = useCallback(() => {
    setUseVirtualization((prev) => !prev);
  }, []);

  // Enhanced reset function that clears all state
  const handleResetFilters = useCallback(() => {
    resetFilters();
    setSearchQuery("");
    setLocationQuery("");
    setCurrentPage(1);
  }, [resetFilters]);

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              {heroConfig?.title || config.title}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {heroConfig?.subtitle || config.description}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        updateFilter("query", e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Location"
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        updateFilter("location", e.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {config.title}
                {!isLoading && totalCount > 0 && (
                  <span className="ml-2 text-lg font-normal text-muted-foreground">
                    ({totalCount.toLocaleString()} properties)
                  </span>
                )}
              </h2>
              {shouldUseVirtualization && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Virtualized View
                </div>
              )}
              {process.env.NODE_ENV === "development" && requestStats && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Debug info
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={toggleFilters}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                    {
                      Object.values(filters).filter(
                        (v) =>
                          v !== "" &&
                          v !== null &&
                          v !== false &&
                          (!Array.isArray(v) || v.length > 0)
                      ).length
                    }
                  </span>
                )}
              </Button>

              {/* Virtualization Toggle (for testing/performance) */}
              {totalCount >= 500 && (
                <Button
                  variant={useVirtualization ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVirtualization}
                  title="Toggle virtualization for better performance with large datasets"
                >
                  {useVirtualization ? "Virtual" : "Standard"}
                </Button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("list")}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                aria-label="Sort properties by"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Filters Section */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              <Card className="border-muted/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Property Filters
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFilters}
                      className="text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Render the appropriate filter component */}
                  <React.Suspense
                    fallback={
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    }
                  >
                    <config.filterComponent
                      filters={filters as TFilters}
                      onChange={(newFilters: TFilters) =>
                        setFilters(newFilters as Record<string, unknown>)
                      }
                      onReset={handleResetFilters}
                      errors={{}}
                    />
                  </React.Suspense>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearFilter("query")}
                  className="h-7"
                >
                  Query: &ldquo;{searchQuery}&rdquo; ×
                </Button>
              )}
              {locationQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearFilter("location")}
                  className="h-7"
                >
                  Location: &ldquo;{locationQuery}&rdquo; ×
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <PropertySkeletonGrid count={12} viewMode={viewMode} />}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Unable to Load Properties
              </h3>
              <p className="text-red-600 mb-4">
                {error instanceof Error ?
                  error.message
                : "An error occurred while loading properties."}
              </p>
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && isEmpty && (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Grid className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse all properties.
              </p>
              <Button onClick={handleResetFilters}>Clear All Filters</Button>
            </div>
          </div>
        )}

        {/* Properties Display */}
        {!isLoading && !isError && !isEmpty && (
          <div ref={containerRef} className="mb-8">
            {
              shouldUseVirtualization ?
                // Virtualized view for large datasets
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Using virtualized rendering for optimal performance
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{normalizedProperties.length} items loaded</span>
                      {hasValidData && (
                        <span className="flex items-center gap-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Live data
                        </span>
                      )}
                    </div>
                  </div>
                  <EnhancedVirtualizedPropertyList
                    properties={normalizedProperties}
                    viewMode={viewMode}
                    height={dimensions.height}
                    width={dimensions.width}
                    onPropertyClick={handlePropertyClick}
                    CardComponent={config.cardComponent}
                    itemsPerRow={itemsPerRow}
                    gridItemWidth={320}
                    gridItemHeight={400}
                    listItemHeight={200}
                    className="border rounded-lg overflow-hidden"
                  />
                </div>
                // Standard grid/list view
              : <div
                  className={`grid gap-6 ${
                    viewMode === "grid" ?
                      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                  }`}
                >
                  {normalizedProperties.map((property) => (
                    <React.Suspense
                      key={property.id}
                      fallback={
                        <Card className="overflow-hidden">
                          <Skeleton className="aspect-video w-full" />
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-6 w-1/3" />
                          </CardContent>
                        </Card>
                      }
                    >
                      <config.cardComponent
                        property={property}
                        onClick={handlePropertyClick}
                        className={viewMode === "list" ? "flex flex-row" : ""}
                      />
                    </React.Suspense>
                  ))}
                </div>

            }
          </div>
        )}

        {/* Enhanced Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isFetching}
              showPageInfo={true}
              showFirstLast={totalPages > 7}
              className="justify-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}
