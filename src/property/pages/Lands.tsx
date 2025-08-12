import { TreePine, Shield, FileCheck, Zap } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Import shared components and hooks
import {
  PropertyDataGrid,
  PropertySkeletonGrid,
  PhotoManagementButton,
  BasePropertyFilters,
  useFilterState,
  usePaginatedQuery,
} from "../../shared";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent } from "../../shared/components/ui/card";
import type { BasePropertyFilters as BasePropertyFiltersType } from "../../shared/types/property";
import { CompareBar } from "../components/CompareBar";
import { CompareModal } from "../components/CompareModal";
import { EnhancedLandCard } from "../components/EnhancedLandCard";
import { CompareProvider } from "../contexts/CompareContext";

// Land-specific filter interface
interface LandFilters extends BasePropertyFiltersType {
  landType: string;
  sizeMin: string;
  sizeMax: string;
  waterAccess: boolean;
  roadAccess: boolean;
  electricityAccess: boolean;
  [key: string]: unknown; // Index signature for useFilterState compatibility
}

// Default filter values
const DEFAULT_FILTERS: LandFilters = {
  query: "",
  location: "",
  priceMin: null,
  priceMax: null,
  verified: false,
  category: "land",
  // Land-specific filters
  landType: "",
  sizeMin: "",
  sizeMax: "",
  waterAccess: false,
  roadAccess: false,
  electricityAccess: false,
};

// Verification status configurations
const VERIFICATION_STATUS_CONFIG = {
  verified: {
    label: "Verified",
    color: "bg-green-100 text-green-800",
    description: "Fully verified and safe to purchase",
  },
  pending: {
    label: "Verification Pending",
    color: "bg-yellow-100 text-yellow-800",
    description: "Verification in progress",
  },
  unverified: {
    label: "Unverified",
    color: "bg-gray-100 text-gray-800",
    description: "Not yet verified",
  },
  flagged: {
    label: "Flagged",
    color: "bg-red-100 text-red-800",
    description: "Potential issues detected",
  },
} as const;

/**
 * Migrated Lands page using shared architecture
 * This version eliminates code duplication and uses shared components
 */
export default function Lands(): React.ReactElement {
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
    isValid,
    errors,
    hasActiveFilters,
  } = useFilterState<LandFilters>({
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
    queryKey: "land-properties",
    fetcher: async (filters, page) => {
      // Mock API call - replace with actual API
      const response = await fetch(
        `/api/properties/land?page=${page}&filters=${JSON.stringify(filters)}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch land properties: ${response.statusText}`
        );
      }
      return response.json();
    },
    filters: debouncedFilters,
    sortBy: "date",
    enabled: isValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle property click navigation
  const handlePropertyClick = useCallback(
    (property: { id: string | number }) => {
      navigate(`/land/${property.id}`);
    },
    [navigate]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // Helper function for pill color classes
  const getPillColorClass = (color: "green" | "blue" | "purple") => {
    switch (color) {
      case "green":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "blue":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "purple":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  // Render individual land property item
  const renderLandItem = useCallback(
    (property: any, style: React.CSSProperties) => {
      // Transform property to match EnhancedLandProperty interface
      const enhancedProperty = {
        id: String(property.id),
        title: property.title,
        description: property.description,
        location: property.location,
        price: Number(property.price),
        size: property.size || "N/A",
        images: property.images || [],
        verificationStatus: property.verificationStatus || "unverified",
        trustScore: property.trustScore || 0,
        landType: property.landType || "residential",
        titleDeedStatus: property.titleDeedStatus || "pending",
        riskLevel: property.riskLevel || "medium",
        features: property.features || {},
        lastVerified: property.lastVerified,
        dateAdded: property.dateAdded ? new Date(property.dateAdded) : new Date(),
        viewCount: property.viewCount,
        isNew: property.isNew,
        isFeatured: property.isFeatured,
      };

      const verificationStatus = property.verificationStatus || "unverified";
      const statusConfig =
        VERIFICATION_STATUS_CONFIG[
          verificationStatus as keyof typeof VERIFICATION_STATUS_CONFIG
        ];

      return (
        <div 
          className="p-2" 
          style={style}
        >
          <div className="group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
            <EnhancedLandCard
              property={enhancedProperty}
              className={viewMode === "list" ? "flex flex-row max-w-none" : ""}
              onViewDetails={() => handlePropertyClick(property)}
            />

            {/* Verification status badge */}
            <div className="absolute top-2 right-2">
              <Badge
                className={statusConfig?.color || "bg-gray-100 text-gray-800"}
              >
                {statusConfig?.label || "Unknown"}
              </Badge>
            </div>

            {/* Trust score indicator */}
            {property.trustScore && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-white/90">
                  Trust: {property.trustScore}%
                </Badge>
              </div>
            )}

            {/* Photo management button */}
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <PhotoManagementButton
                  propertyId={property.id}
                  propertyType="land"
                  photoCount={property.images?.length || 0}
                  size="sm"
                  variant="outline"
                />

                {/* Land verification features */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {property.landFeatures?.waterAccess && (
                    <Badge variant="outline" className="text-xs">
                      Water
                    </Badge>
                  )}
                  {property.landFeatures?.roadAccess && (
                    <Badge variant="outline" className="text-xs">
                      Road
                    </Badge>
                  )}
                  {property.landFeatures?.electricityAccess && (
                    <Badge variant="outline" className="text-xs">
                      Power
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [viewMode, handlePropertyClick]
  );

  // Hero section configuration
  const heroConfig = useMemo(
    () => ({
      title: "Land Properties",
      subtitle:
        "Discover verified land opportunities across Kenya with comprehensive verification and fraud protection.",
      icon: TreePine,
      pills: [
        { icon: Shield, text: "Fraud Protection", color: "green" as const },
        { icon: FileCheck, text: "Title Verification", color: "blue" as const },
        { icon: Zap, text: "Ready to Develop", color: "purple" as const },
      ],
      backgroundGradient:
        "from-green-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-900 dark:to-green-950",
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
              : "Failed to fetch land properties. Please try again."}
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
              {heroConfig.pills.map((pill, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getPillColorClass(pill.color)}`}
                >
                  <pill.icon className="w-4 h-4" />
                  {pill.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Land Verification Notice */}
          <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-400">
                    TripleCheck Land Verification
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All land listings undergo comprehensive verification
                    including title deed validation, fraud detection, and
                    community intelligence checks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters using shared component */}
          <Card className="mb-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
            <CardContent className="p-6">
              <BasePropertyFilters
                filters={filters as BasePropertyFiltersType}
                onChange={(newFilters: BasePropertyFiltersType) => {
                  setFilters({ ...filters, ...newFilters });
                }}
                onReset={resetFilters}
                errors={errors}
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
                            value !== defaultValue &&
                            value !== "" &&
                            value !== false &&
                            value !== null
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

          {/* Land Properties Grid/List using shared component */}
          {isLoading ?
            <PropertySkeletonGrid
              count={12}
              viewMode={viewMode}
              itemHeight={viewMode === "grid" ? 320 : 200}
            />
          : <PropertyDataGrid
              items={(data?.items || []) as any[]}
              loading={isLoading}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              renderItem={renderLandItem}
              itemHeight={viewMode === "grid" ? 320 : 200}
              gridItemSize={{ width: 350, height: 320 }}
              containerHeight={600}
              containerWidth={1200}
              emptyState={
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <TreePine className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No land properties found
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
                {isFetchingNextPage ?
                  "Loading..."
                : "Load More Land Properties"}
              </Button>
            </div>
          )}

          {/* Results summary */}
          {data && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {data.items.length} of {data.totalCount} land properties
            </div>
          )}

          {/* Land Investment Tips */}
          <Card className="mt-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-4">
                🌾 Land Investment Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-700 dark:text-blue-300">
                <div>
                  <strong>Title Verification:</strong> Always verify title deed
                  authenticity and ownership history
                </div>
                <div>
                  <strong>Soil Analysis:</strong> Check soil quality and water
                  table levels for agricultural land
                </div>
                <div>
                  <strong>Development Plans:</strong> Research future
                  development plans in the area
                </div>
                <div>
                  <strong>Access Roads:</strong> Ensure reliable road access for
                  transportation
                </div>
                <div>
                  <strong>Utilities:</strong> Verify availability of water,
                  electricity, and other utilities
                </div>
                <div>
                  <strong>Legal Compliance:</strong> Ensure compliance with
                  local zoning and land use regulations
                </div>
              </div>
            </CardContent>
          </Card>
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
Lands.displayName = "Lands";
