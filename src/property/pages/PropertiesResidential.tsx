import { Home, Shield, Wifi, Zap } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Import shared components and hooks

import {
  PropertyDataGrid,
  PropertySkeletonGrid,
  ResidentialFilters,
  useFilterState,
  useResidentialPropertiesQuery,
  normalizeProperty,
} from "../../shared";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent } from "../../shared/components/ui/card";
import type { Property } from "../../shared/types/property";
import { CompareBar } from "../components/CompareBar";
import { CompareModal } from "../components/CompareModal";
import ListingCard from "../components/ListingCard";
import { CompareProvider } from "../contexts/CompareContext";

// Default filter values
const DEFAULT_FILTERS = {
  search: "",
  location: "",
  verified: false,
  sortBy: "date",
  sortOrder: "desc",
  // Residential-specific filters
  propertyType: "",
  furnished: false,
  parking: false,
  garden: false,
  pool: false,
  security: false,
  balcony: false,
} as const;

/**
 * Migrated Residential Properties page using shared architecture
 * This version eliminates code duplication and uses shared components
 */
export default function PropertiesResidential(): React.ReactElement {
  const navigate = useNavigate();

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Use shared filter state hook
  const {
    filters,
    setFilters,
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
  } = useResidentialPropertiesQuery(debouncedFilters, "date");

  // Handle property click navigation
  const handlePropertyClick = useCallback(
    (property: Property) => {
      navigate(`/property/${property.id}`);
    },
    [navigate]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // Render individual property item
  const renderPropertyItem = useCallback(
    (property: Property) => {
      // Ensure property has required description field
      const propertyWithDescription = {
        ...property,
        description: property.description || "No description available",
      };

      // Normalize the property data for consistent rendering
      const normalizedProperty = normalizeProperty(
        propertyWithDescription,
        "residential"
      );

      return (
        <div className="property-item-container">
          <ListingCard
            property={normalizedProperty}
            className={viewMode === "list" ? "flex flex-row max-w-none" : ""}
            onClick={() => handlePropertyClick(property)}
            viewMode={viewMode}
          />
        </div>
      );
    },
    [viewMode, handlePropertyClick]
  );

  // Hero section configuration
  const heroConfig = useMemo(
    () => ({
      title: "Residential Properties",
      subtitle:
        "Find your perfect home among Kenya's finest residential properties with verified listings and premium amenities.",
      icon: Home,
      pills: [
        { icon: Shield, text: "Verified Listings", color: "green" as const },
        { icon: Wifi, text: "Modern Amenities", color: "blue" as const },
        { icon: Zap, text: "Move-in Ready", color: "purple" as const },
      ],
      backgroundGradient:
        "from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950",
    }),
    []
  );

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Card className="m-8">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ?
                error.message
              : "Failed to fetch properties. Please try again."}
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
        <div
          className={`relative isolate overflow-hidden bg-gradient-to-br ${heroConfig.backgroundGradient}`}
        >
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
                const getColorClasses = (color: string) => {
                  switch (color) {
                    case "green":
                      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
                    case "blue":
                      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                    default:
                      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
                  }
                };
                const colorClasses = getColorClasses(pill.color);

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
              <ResidentialFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
              />

              {/* Active filters indicator */}
              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {
                        Object.keys(filters).filter((key) => {
                          const value = filters[key as keyof typeof filters];
                          const defaultValue =
                            DEFAULT_FILTERS[
                              key as keyof typeof DEFAULT_FILTERS
                            ];
                          return (
                            value != defaultValue &&
                            value !== "" &&
                            value !== false
                          );
                        }).length
                      }{" "}
                      active filters
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
          {isLoading ?
            <PropertySkeletonGrid
              count={12}
              viewMode={viewMode}
              itemHeight={viewMode === "grid" ? 340 : 200}
            />
          : <PropertyDataGrid
              items={
                (data?.items || []).map((item) => ({
                  ...item,
                  description: item.description || "No description available",
                })) as Property[]
              }
              loading={isLoading}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              renderItem={renderPropertyItem}
              itemHeight={viewMode === "grid" ? 340 : 200}
              gridItemSize={{ width: 320, height: 340 }}
              containerHeight={600}
              containerWidth={1200}
              emptyState={
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Home className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No residential properties found
                    </h3>
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
          }

          {/* Load more button for infinite scroll */}
          {hasNextPage && (
            <div className="text-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                size="lg"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Properties"}
              </Button>
            </div>
          )}

          {/* Results summary */}
          {data && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {data.items.length} of {data.totalCount} residential
              properties
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
PropertiesResidential.displayName = "PropertiesResidential";
