import React, { useCallback, useMemo, useState } from "react";
import { Search, Filter, X, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";

import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
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
// Types & Constants
// ============================================================================

interface ConsolidatedSearchProps {
  readonly onResults?: (results: unknown[]) => void;
  readonly onFiltersChange?: (filters: PropertySearchFilters) => void;
  readonly initialFilters?: Partial<PropertySearchFilters>;
  readonly showAdvancedFilters?: boolean;
  readonly className?: string;
}

type SortBy = "relevance" | "price" | "date" | "size";
type SortOrder = "asc" | "desc";

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

const COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;
const PARKING_OPTIONS = [0, 1, 2, 3, 4] as const;

const BOOLEAN_OPTIONS = [
  { value: "", label: "Any" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

// ============================================================================
// Utilities
// ============================================================================

function parsePriceRange(value: string): { min?: number; max?: number } {
  if (!value) return {};
  const [min, max] = value.split("-").map((v) => (v ? parseInt(v, 10) : undefined));
  return { min, max };
}

function formatPriceRange(min?: number, max?: number): string {
  if (!min && !max) return "";
  if (min && !max) return `${min}-`;
  if (!min && max) return `0-${max}`;
  return `${min}-${max}`;
}

function resolveBoolean(value: string): boolean | undefined {
  if (value === "") return undefined;
  return value === "true";
}

function resolveNumber(value: string): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

// ============================================================================
// Sub-Components
// ============================================================================

const FilterGroup = React.memo<{
  label: string;
  value: string;
  options: readonly { value: string; label: string }[] | readonly number[];
  onChange: (value: string) => void;
  placeholder?: string;
}>(({ label, value, options, onChange, placeholder = "Any" }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{placeholder}</SelectItem>
        {options.map((opt) =>
          typeof opt === "number" ? (
            <SelectItem key={opt} value={opt.toString()}>
              {opt === 0 ? "None" : `${opt}+`}
            </SelectItem>
          ) : (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  </div>
));

FilterGroup.displayName = "FilterGroup";

const IconInput = React.memo<{
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaLabel: string;
}>(({ icon, value, onChange, placeholder, ariaLabel }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      {icon}
    </span>
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="pl-10"
      aria-label={ariaLabel}
    />
  </div>
));

IconInput.displayName = "IconInput";

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

    const {
      filters,
      searchResults,
      isLoading,
      updateFilter,
      updateFilters,
      clearFilters,
      search,
      activeFilterCount,
    } = useSearch({ initialFilters, autoSearch: true });

    // Derived values
    const currentPriceRange = useMemo(
      () => formatPriceRange(filters.priceMin, filters.priceMax),
      [filters.priceMin, filters.priceMax]
    );

    const propertyTypeValue = Array.isArray(filters.propertyType)
      ? filters.propertyType[0] || ""
      : filters.propertyType || "";

    const resultsMeta = useMemo(() => {
      if (!searchResults) return null;
      const total = `${searchResults.total} properties found`;
      const timing = searchResults.searchTime ? ` in ${searchResults.searchTime}ms` : "";
      const pagination =
        searchResults.hasMore ?
          `Showing ${searchResults.items?.length ?? 0} of ${searchResults.total}`
        : null;
      return { total: `${total}${timing}`, pagination };
    }, [searchResults]);

    // Unified change handler to reduce callback creation
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

    const handleSearch = useCallback(() => {
      search();
      if (searchResults?.items) onResults?.(searchResults.items);
    }, [search, searchResults, onResults]);

    const handleClear = useCallback(() => {
      clearFilters();
      onFiltersChange?.({} as PropertySearchFilters);
    }, [clearFilters, onFiltersChange]);

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Main Search Bar */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Primary Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5"
                aria-hidden
              />
              <Input
                placeholder="Search properties by location, type, or features..."
                value={filters.query ?? ""}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="pl-10 h-12 text-lg"
                aria-label="Search properties"
              />
              {isLoading && (
                <Loader2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin"
                  aria-label="Loading"
                />
              )}
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <IconInput
                icon={<MapPin className="h-4 w-4" aria-hidden />}
                value={filters.location ?? ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                placeholder="Location"
                ariaLabel="Location"
              />

              <Select
                value={propertyTypeValue}
                onValueChange={(v) => handleFilterChange("propertyType", v)}
              >
                <SelectTrigger aria-label="Property type">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentPriceRange} onValueChange={handlePriceRangeChange}>
                <SelectTrigger aria-label="Price range">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="flex-1" aria-label="Sort by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
                  aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
                  title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters((p) => !p)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Advanced Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </Button>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={handleClear} className="gap-2">
                    <X className="h-4 w-4" aria-hidden />
                    Clear All
                  </Button>
                )}
              </div>

              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4 mr-2" aria-hidden />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" aria-hidden />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FilterGroup
                  label="Bedrooms"
                  value={filters.bedrooms?.toString() ?? ""}
                  options={COUNT_OPTIONS}
                  onChange={(v) => handleFilterChange("bedrooms", resolveNumber(v))}
                />
                <FilterGroup
                  label="Bathrooms"
                  value={filters.bathrooms?.toString() ?? ""}
                  options={COUNT_OPTIONS}
                  onChange={(v) => handleFilterChange("bathrooms", resolveNumber(v))}
                />
                <FilterGroup
                  label="Parking Spaces"
                  value={filters.parkingSpaces?.toString() ?? ""}
                  options={PARKING_OPTIONS}
                  onChange={(v) => handleFilterChange("parkingSpaces", resolveNumber(v))}
                />
                <FilterGroup
                  label="Furnished"
                  value={filters.furnished?.toString() ?? ""}
                  options={BOOLEAN_OPTIONS}
                  onChange={(v) => handleFilterChange("furnished", resolveBoolean(v))}
                />
                <FilterGroup
                  label="Pet Friendly"
                  value={filters.petFriendly?.toString() ?? ""}
                  options={BOOLEAN_OPTIONS}
                  onChange={(v) => handleFilterChange("petFriendly", resolveBoolean(v))}
                />
                <FilterGroup
                  label="Verification"
                  value={filters.verified?.toString() ?? ""}
                  options={BOOLEAN_OPTIONS}
                  onChange={(v) => handleFilterChange("verified", resolveBoolean(v))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {resultsMeta && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{resultsMeta.total}</span>
            {resultsMeta.pagination && <span>{resultsMeta.pagination}</span>}
          </div>
        )}
      </div>
    );
  }
);

ConsolidatedSearch.displayName = "ConsolidatedSearch";

export default ConsolidatedSearch;