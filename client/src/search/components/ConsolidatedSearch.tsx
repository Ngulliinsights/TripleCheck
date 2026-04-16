/**
 * Consolidated Search Component
 * Combines SearchBar, SearchFilters, and search results functionality
 * Eliminates redundancy across search components
 */

import React, { useState, useCallback, useMemo } from "react";
import { Search, Filter, X, MapPin, Sliders, Loader2 } from "lucide-react";

import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card";
import { Input } from "../../local/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../local/components/ui/select";
import { PropertySearchFilters } from "../../local/types/search";
import { useSearch } from "../hooks/useSearch";

// ============================================================================
// Type Definitions
// ============================================================================

interface ConsolidatedSearchProps {
  readonly onResults?: (results: any[]) => void;
  readonly onFiltersChange?: (filters: PropertySearchFilters) => void;
  readonly initialFilters?: Partial<PropertySearchFilters>;
  readonly showAdvancedFilters?: boolean;
  readonly className?: string;
}

type SortOrder = "asc" | "desc";
type SortBy = "relevance" | "price" | "date" | "size";

// ============================================================================
// Constants
// ============================================================================

const PROPERTY_TYPES = [
  { value: "", label: "Any Type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
] as const;

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-1000000", label: "Under KES 1M" },
  { value: "1000000-5000000", label: "KES 1M - 5M" },
  { value: "5000000-10000000", label: "KES 5M - 10M" },
  { value: "10000000-20000000", label: "KES 10M - 20M" },
  { value: "20000000-", label: "Over KES 20M" },
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price", label: "Price" },
  { value: "date", label: "Newest First" },
  { value: "size", label: "Size" },
] as const;

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;
const BATHROOM_OPTIONS = [1, 2, 3, 4, 5] as const;
const PARKING_OPTIONS = [0, 1, 2, 3, 4] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse price range string into min and max values
 */
function parsePriceRange(value: string): {
  min: number | undefined;
  max: number | undefined;
} {
  if (!value) return { min: undefined, max: undefined };

  const [minStr, maxStr] = value.split("-");
  return {
    min: minStr ? parseInt(minStr, 10) : undefined,
    max: maxStr ? parseInt(maxStr, 10) : undefined,
  };
}

/**
 * Format price range for display
 */
function formatPriceRange(
  priceMin?: number,
  priceMax?: number
): string {
  if (!priceMin && !priceMax) return "";
  if (priceMin && !priceMax) return `${priceMin}-`;
  if (!priceMin && priceMax) return `0-${priceMax}`;
  return `${priceMin}-${priceMax}`;
}

// ============================================================================
// Main Component
// ============================================================================

export const ConsolidatedSearch = React.memo<ConsolidatedSearchProps>(
  ({
    onResults,
    onFiltersChange,
    initialFilters = {},
    showAdvancedFilters = false,
    className = "",
  }) => {
    const [showFilters, setShowFilters] = useState(showAdvancedFilters);
    const [sortBy, setSortBy] = useState<SortBy>("relevance");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Use the consolidated search hook
    const {
      filters,
      searchResults,
      isLoading,
      updateFilter,
      updateFilters,
      clearFilters,
      search,
      activeFilterCount,
    } = useSearch({
      initialFilters,
      autoSearch: true,
    });

    // ========================================================================
    // Memoized Values
    // ========================================================================

    const currentPriceRange = useMemo(
      () => formatPriceRange(filters.priceMin, filters.priceMax),
      [filters.priceMin, filters.priceMax]
    );

    const propertyTypeValue = useMemo(() => {
      return Array.isArray(filters.propertyType)
        ? filters.propertyType[0] || ""
        : filters.propertyType || "";
    }, [filters.propertyType]);

    const resultsText = useMemo(() => {
      if (!searchResults) return null;
      return `${searchResults.total} properties found${
        searchResults.searchTime ? ` in ${searchResults.searchTime}ms` : ""
      }`;
    }, [searchResults]);

    const showingText = useMemo(() => {
      if (!searchResults?.hasMore) return null;
      return `Showing ${searchResults.items?.length || 0} of ${
        searchResults.total
      }`;
    }, [searchResults]);

    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleSearch = useCallback(() => {
      search();
      if (searchResults?.items) {
        onResults?.(searchResults.items);
      }
    }, [search, searchResults, onResults]);

    const handleFilterChange = useCallback(
      <K extends keyof PropertySearchFilters>(
        key: K,
        value: PropertySearchFilters[K]
      ) => {
        updateFilter(key, value);
        onFiltersChange?.({ ...filters, [key]: value });
      },
      [updateFilter, filters, onFiltersChange]
    );

    const handlePriceRangeChange = useCallback(
      (value: string) => {
        const { min, max } = parsePriceRange(value);
        updateFilters({ priceMin: min, priceMax: max });
      },
      [updateFilters]
    );

    const handleSortChange = useCallback((value: string) => {
      setSortBy(value as SortBy);
      // In a real implementation, this would trigger a new search with sort options
      console.log("Sort changed to:", value);
    }, []);

    const toggleSortOrder = useCallback(() => {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      // In a real implementation, this would trigger a new search
    }, []);

    const toggleFilters = useCallback(() => {
      setShowFilters((prev) => !prev);
    }, []);

    const handleQueryChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFilterChange("query", e.target.value);
      },
      [handleFilterChange]
    );

    const handleLocationChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFilterChange("location", e.target.value);
      },
      [handleFilterChange]
    );

    const handlePropertyTypeChange = useCallback(
      (value: string) => {
        handleFilterChange("propertyType", value);
      },
      [handleFilterChange]
    );

    const handleBedroomsChange = useCallback(
      (value: string) => {
        handleFilterChange("bedrooms", value ? parseInt(value, 10) : undefined);
      },
      [handleFilterChange]
    );

    const handleBathroomsChange = useCallback(
      (value: string) => {
        handleFilterChange(
          "bathrooms",
          value ? parseInt(value, 10) : undefined
        );
      },
      [handleFilterChange]
    );

    const handleParkingChange = useCallback(
      (value: string) => {
        handleFilterChange(
          "parkingSpaces",
          value ? parseInt(value, 10) : undefined
        );
      },
      [handleFilterChange]
    );

    const handleFurnishedChange = useCallback(
      (value: string) => {
        handleFilterChange(
          "furnished",
          value === "" ? undefined : value === "true"
        );
      },
      [handleFilterChange]
    );

    const handlePetFriendlyChange = useCallback(
      (value: string) => {
        handleFilterChange(
          "petFriendly",
          value === "" ? undefined : value === "true"
        );
      },
      [handleFilterChange]
    );

    const handleVerifiedChange = useCallback(
      (value: string) => {
        handleFilterChange(
          "verified",
          value === "" ? undefined : value === "true"
        );
      },
      [handleFilterChange]
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Main Search Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Primary search input */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search properties by location, type, or features..."
                  value={filters.query || ""}
                  onChange={handleQueryChange}
                  className="pl-10 h-12 text-lg"
                  aria-label="Search properties"
                />
                {isLoading && (
                  <Loader2
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin"
                    aria-label="Loading"
                  />
                )}
              </div>

              {/* Quick filters row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Location"
                    value={filters.location || ""}
                    onChange={handleLocationChange}
                    className="pl-10"
                    aria-label="Location"
                  />
                </div>

                <Select
                  value={propertyTypeValue}
                  onValueChange={handlePropertyTypeChange}
                >
                  <SelectTrigger aria-label="Property type">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentPriceRange}
                  onValueChange={handlePriceRangeChange}
                >
                  <SelectTrigger aria-label="Price range">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="flex-1" aria-label="Sort by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={toggleSortOrder}
                    aria-label={`Sort ${
                      sortOrder === "asc" ? "ascending" : "descending"
                    }`}
                    title={`Sort ${
                      sortOrder === "asc" ? "ascending" : "descending"
                    }`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleFilters}
                    className="flex items-center gap-2"
                  >
                    <Sliders className="h-4 w-4" aria-hidden="true" />
                    Advanced Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1">{activeFilterCount}</Badge>
                    )}
                  </Button>

                  {activeFilterCount > 0 && (
                    <Button onClick={clearFilters} className="flex items-center gap-2">
                      <X className="h-4 w-4" aria-hidden="true" />
                      Clear All
                    </Button>
                  )}
                </div>

                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2
                      className="h-4 w-4 mr-2 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" aria-hidden="true" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bedrooms */}
                <div>
                  <label
                    htmlFor="bedrooms-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Bedrooms
                  </label>
                  <Select
                    value={filters.bedrooms?.toString() || ""}
                    onValueChange={handleBedroomsChange}
                  >
                    <SelectTrigger id="bedrooms-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {BEDROOM_OPTIONS.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ bedroom{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label
                    htmlFor="bathrooms-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Bathrooms
                  </label>
                  <Select
                    value={filters.bathrooms?.toString() || ""}
                    onValueChange={handleBathroomsChange}
                  >
                    <SelectTrigger id="bathrooms-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {BATHROOM_OPTIONS.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ bathroom{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parking */}
                <div>
                  <label
                    htmlFor="parking-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Parking Spaces
                  </label>
                  <Select
                    value={filters.parkingSpaces?.toString() || ""}
                    onValueChange={handleParkingChange}
                  >
                    <SelectTrigger id="parking-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {PARKING_OPTIONS.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 0
                            ? "No parking"
                            : `${num}+ space${num > 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Furnished */}
                <div>
                  <label
                    htmlFor="furnished-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Furnished
                  </label>
                  <Select
                    value={
                      filters.furnished === undefined
                        ? ""
                        : filters.furnished.toString()
                    }
                    onValueChange={handleFurnishedChange}
                  >
                    <SelectTrigger id="furnished-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="true">Furnished</SelectItem>
                      <SelectItem value="false">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pet Friendly */}
                <div>
                  <label
                    htmlFor="pet-friendly-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Pet Friendly
                  </label>
                  <Select
                    value={
                      filters.petFriendly === undefined
                        ? ""
                        : filters.petFriendly.toString()
                    }
                    onValueChange={handlePetFriendlyChange}
                  >
                    <SelectTrigger id="pet-friendly-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="true">Pet Friendly</SelectItem>
                      <SelectItem value="false">No Pets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Status */}
                <div>
                  <label
                    htmlFor="verified-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Verification
                  </label>
                  <Select
                    value={
                      filters.verified === undefined
                        ? ""
                        : filters.verified.toString()
                    }
                    onValueChange={handleVerifiedChange}
                  >
                    <SelectTrigger id="verified-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="true">Verified Only</SelectItem>
                      <SelectItem value="false">Include Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Summary */}
        {searchResults && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{resultsText}</span>
            {showingText && <span>{showingText}</span>}
          </div>
        )}
      </div>
    );
  }
);

ConsolidatedSearch.displayName = "ConsolidatedSearch";

export default ConsolidatedSearch;