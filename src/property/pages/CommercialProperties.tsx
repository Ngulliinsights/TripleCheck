import { Building2, TrendingUp, Users, Calendar } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Import shared components and hooks

import {
  PropertyDataGrid,
  PropertySkeletonGrid,
  PhotoManagementButton,
  useFilterState,
  usePaginatedQuery,
  normalizeProperty,
} from '../../shared';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent } from '../../shared/components/ui/card';
import type { Property } from '../../shared/types/property';
import { CompareBar } from '../components/CompareBar';
import { CompareModal } from '../components/CompareModal';
import ListingCard from '../components/ListingCard';
import { CompareProvider } from '../contexts/CompareContext';



// Default filter values
const DEFAULT_FILTERS = {
  search: '',
  location: '',
  priceMin: '',
  priceMax: '',
  verified: false,
  sortBy: 'date',
  sortOrder: 'desc',
  // Commercial-specific filters
  commercialType: '',
  businessZone: '',
  areaMin: '',
  areaMax: '',
  floorsMin: '',
  floorsMax: '',
  parking: false,
  elevator: false,
  airConditioning: false,
  security: false,
  wifi: false,
  generator: false,
} as const;

/**
 * Migrated Commercial Properties page using shared architecture
 * This version eliminates code duplication and uses shared components
 */
export default function CommercialProperties(): React.ReactElement {
  const navigate = useNavigate();
  
  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Use shared filter state hook
  const {
    filters,
    reset: resetFilters,
    debouncedFilters,
    hasActiveFilters,
  } = useFilterState({
    defaultFilters: DEFAULT_FILTERS,
    debounceMs: 300,
    syncWithUrl: true,
  });

  // Use shared data fetching hook
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePaginatedQuery({
    queryKey: 'commercial-properties',
    fetcher: async (filters, page, sort) => {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/properties/commercial?page=${page}&filters=${JSON.stringify(filters)}&sort=${sort}`);
      return response.json();
    },
    filters: debouncedFilters,
    sortBy: 'date',
  });

  // Handle property click navigation
  const handlePropertyClick = useCallback((property: Property) => {
    navigate(`/property/${property.id}`);
  }, [navigate]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  // Render individual property item
  const renderPropertyItem = useCallback((property: Property, style: React.CSSProperties) => {
    // Normalize the property data for consistent rendering
    const normalizedProperty = normalizeProperty(property, 'commercial');
    
    return (
      <div style={style} className="p-2">
        <div className="group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <ListingCard
            property={normalizedProperty}
            className={viewMode === 'list' ? 'flex flex-row max-w-none' : ''}
            onClick={() => handlePropertyClick(property)}
          />
          
          {/* Add photo management button */}
          <div className="p-4 border-t">
            <PhotoManagementButton
              propertyId={typeof property.id === 'string' ? property.id : property.id.toString()}
              propertyType="commercial"
              photoCount={property.images?.length || 0}
              size="sm"
              variant="outline"
            />
          </div>
        </div>
      </div>
    );
  }, [viewMode, handlePropertyClick]);

  // Hero section configuration
  const heroConfig = useMemo(() => ({
    title: 'Commercial Properties',
    subtitle: 'Discover premium commercial real estate opportunities across Kenya\'s prime business locations.',
    icon: Building2,
    pills: [
      { icon: TrendingUp, text: 'High ROI Properties', color: 'green' as const },
      { icon: Users, text: 'Verified Tenants', color: 'blue' as const },
      { icon: Calendar, text: 'Ready to Move', color: 'purple' as const },
    ],
    backgroundGradient: 'from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950',
  }), []);

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Card className="m-8">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to fetch properties. Please try again.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CompareProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section using shared configuration */}
        <div className={`relative isolate overflow-hidden bg-gradient-to-br ${heroConfig.backgroundGradient}`}>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-20 bg-pattern"
          />
          <div className="container mx-auto px-4 py-20 md:py-28 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-secondary/20 rounded-full">
                <heroConfig.icon className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              {heroConfig.title}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              {heroConfig.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {heroConfig.pills.map((pill, index) => {
                const colorClasses = pill.color === 'green' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : pill.color === 'blue' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${colorClasses}`}
                  >
                    <pill.icon className="w-4 h-4" />
                    {pill.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters using shared component */}
          <Card className="mb-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
            <CardContent className="p-6">
              {/* TODO: Implement CommercialFilters component */}
              <div className="text-sm text-muted-foreground">
                Commercial filters will be implemented here
              </div>
              
              {/* Active filters indicator */}
              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {Object.keys(filters).filter(key => {
                        const value = filters[key as keyof typeof filters];
                        const defaultValue = DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS];
                        return value !== defaultValue && value !== '' && value !== false;
                      }).length} active filters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties Grid/List using shared component */}
          {isLoading ? (
            <PropertySkeletonGrid
              count={12}
              viewMode={viewMode}
              itemHeight={viewMode === 'grid' ? 360 : 200}
            />
          ) : (
            <PropertyDataGrid
              items={(data?.items || []) as Property[]}
              loading={isLoading}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              renderItem={renderPropertyItem}
              itemHeight={viewMode === 'grid' ? 360 : 200}
              gridItemSize={{ width: 350, height: 360 }}
              containerHeight={600}
              containerWidth={1200}
              emptyState={
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No commercial properties found</h3>
                    <p className="text-sm mb-4">
                      Try adjusting your filters to see more results.
                    </p>
                    <Button onClick={resetFilters} variant="outline">
                      Clear All Filters
                    </Button>
                  </div>
                </Card>
              }
            />
          )}

          {/* Load more button for infinite scroll */}
          {hasNextPage && (
            <div className="text-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                size="lg"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More Properties'}
              </Button>
            </div>
          )}

          {/* Results summary */}
          {data && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {data.items.length} of {data.totalCount} commercial properties
            </div>
          )}
        </div>

        {/* Compare functionality */}
        <CompareBar />
        {showCompareModal && (
          <CompareModal
            isOpen={showCompareModal}
            onClose={() => setShowCompareModal(false)}
          />
        )}
      </div>
    </CompareProvider>
  );
}

// Export display name for debugging
CommercialProperties.displayName = 'CommercialProperties';