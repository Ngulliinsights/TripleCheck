import { AlertTriangle, RefreshCw, Grid, List, Search } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFilterState } from '../../hooks/useFilterState';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import type { 
  BasePropertyFilters, 
  PropertyTypeConfig, 
  NormalizedProperty,
  ViewMode,
  SortOption 
} from '../../types/property';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

interface PropertyListingPageProps<TFilters extends BasePropertyFilters, TProperty> {
  config: PropertyTypeConfig<TFilters, TProperty>;
  className?: string;
  enableCompare?: boolean;
  enablePhotoManagement?: boolean;
  heroConfig?: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
  };
}

/**
 * Generic property listing page component
 * Provides consistent layout and functionality across all property types
 */
export function PropertyListingPage<TFilters extends BasePropertyFilters, TProperty>({
  config,
  className = "",
  enableCompare = true,
  enablePhotoManagement = true,
  heroConfig,
}: PropertyListingPageProps<TFilters, TProperty>): React.ReactElement {
  const navigate = useNavigate();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter state management
  const {
    filters,
    setFilters,
    updateFilter,
    reset: resetFilters,
    debouncedFilters,
    isValid: filtersValid,
    errors: filterErrors,
    hasActiveFilters,
    clearFilter,
  } = useFilterState({
    defaultFilters: config.defaultFilters,
    debounceMs: 300,
    syncWithUrl: true,
    validateOnChange: true,
  });

  // Data fetching with pagination
  const {
    data,
    items,
    isLoading,
    isFetching,
    error,
    isError,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    setPage,
    nextPage,
    previousPage,
    refetch,
    isEmpty,
    getPageNumbers,
  } = usePaginatedQuery({
    queryKey: [...config.queryKey, debouncedFilters, sortBy],
    fetcher: (page, pageSize) => config.fetcher(debouncedFilters, page, pageSize),
    pageSize: 12,
    enabled: filtersValid,
  });

  // Adapt properties to normalized format
  const normalizedProperties = useMemo(() => {
    return items.map(item => config.adapter(item));
  }, [items, config.adapter]);

  // Event handlers
  const handleFilterChange = useCallback((newFilters: TFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, [setFilters, setPage]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setPage(1);
  }, [setPage]);

  const handlePropertyClick = useCallback((property: NormalizedProperty) => {
    const route = property.category === 'land' ? `/land/${property.id}` : `/property/${property.id}`;
    navigate(route);
  }, [navigate]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  }, [refetch]);

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
                      value={filters.query}
                      onChange={(e) => updateFilter('query', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Location"
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
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
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
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

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.query && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearFilter('query')}
                  className="h-7"
                >
                  Query: "{filters.query}" ×
                </Button>
              )}
              {filters.location && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearFilter('location')}
                  className="h-7"
                >
                  Location: "{filters.location}" ×
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Unable to Load Properties
              </h3>
              <p className="text-red-600 mb-4">
                {error instanceof Error ? error.message : 'An error occurred while loading properties.'}
              </p>
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
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
              <Button onClick={resetFilters}>Clear All Filters</Button>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && !isError && !isEmpty && (
          <div className={`grid gap-6 mb-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
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
                  className={viewMode === 'list' ? 'flex flex-row' : ''}
                />
              </React.Suspense>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={!hasPreviousPage || isFetching}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers(5).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(page)}
                  disabled={isFetching}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={nextPage}
              disabled={!hasNextPage || isFetching}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}