import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  Car,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
import { Checkbox } from "../../local/components/ui/checkbox";
import { Input } from "../../local/components/ui/input";
import { Label } from "../../local/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../local/components/ui/select";
import { Separator } from "../../local/components/ui/separator";
import { Slider } from "../../local/components/ui/slider";

import { PropertySearchFilters, SearchOptions } from "../../local/types/search";

// ============================================================================
// Local Types
// ============================================================================

/**
 * AdvancedSearchFilters extends the base PropertySearchFilters with UI-specific
 * fields that only exist in the advanced search panel (range tuples, sorting, etc.)
 */
interface AdvancedSearchFilters extends PropertySearchFilters {
  priceRange: [number, number];
  squareFeet: [number, number];
  yearBuilt: [number, number];
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface SavedSearch {
  id: number;
  name: string;
  filters: Partial<AdvancedSearchFilters>;
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters, options?: SearchOptions) => void;
  onReset: () => void;
  initialFilters?: Partial<AdvancedSearchFilters>;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FILTERS: AdvancedSearchFilters = {
  query: "",
  location: "",
  propertyType: [],
  priceRange: [0, 10_000_000],
  squareFeet: [0, 10_000],
  yearBuilt: [1950, new Date().getFullYear()],
  sortBy: "relevance",
  sortOrder: "desc",
};

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
] as const;

const AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Security",
  "Parking",
  "Garden",
  "Balcony",
  "Elevator",
  "Generator",
  "Water Tank",
  "CCTV",
  "Playground",
  "Clubhouse",
  "Laundry",
  "Internet",
  "Air Conditioning",
] as const;

const LOCATIONS = [
  "Nairobi CBD",
  "Westlands",
  "Karen",
  "Kilimani",
  "Lavington",
  "Runda",
  "Kileleshwa",
  "Parklands",
  "Kasarani",
  "Embakasi",
  "Mombasa",
  "Nakuru",
  "Kisumu",
  "Eldoret",
  "Thika",
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price", label: "Price" },
  { value: "date", label: "Date Listed" },
  { value: "size", label: "Size" },
  { value: "trust_score", label: "Trust Score" },
] as const;

const COUNT_OPTS = [0, 1, 2, 3, 4, 5] as const;
const PARKING_OPTS = [0, 1, 2, 3, 4] as const;

// ============================================================================
// Utilities
// ============================================================================

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return price.toString();
}

// ============================================================================
// Component
// ============================================================================

export default function AdvancedSearch({
  onSearch,
  onReset,
  initialFilters = {},
  isLoading = false,
  className = "",
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: savedSearches } = useQuery<SavedSearch[]>({
    queryKey: ["saved-searches"],
    queryFn: async () => [
      {
        id: 1,
        name: "Westlands Apartments",
        filters: { location: "Westlands", propertyType: ["apartment"] },
      },
      {
        id: 2,
        name: "Family Homes Karen",
        filters: { location: "Karen", bedrooms: 3, propertyType: ["house"] },
      },
    ],
    staleTime: Infinity,
  });

  const updateFilter = useCallback(<K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleInArray = useCallback(<K extends "amenities" | "verificationStatus" | "propertyType">(
    key: K,
    value: string
  ) => {
    setFilters((prev) => {
      const current = (prev[key] ?? []) as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleSearch = useCallback(() => onSearch(filters), [filters, onSearch]);

  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    onReset();
  }, [onReset]);

  const appliedCount = useMemo(() => {
    let count = 0;
    if (filters.query?.trim()) count++;
    if (filters.location) count++;
    if (filters.propertyType?.length) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10_000_000) count++;
    if (filters.bedrooms !== undefined) count++;
    if (filters.bathrooms !== undefined) count++;
    if (filters.amenities?.length) count++;
    if (filters.verificationStatus?.length) count++;
    if (filters.furnished !== undefined) count++;
    if (filters.petFriendly !== undefined) count++;
    if (filters.parkingSpaces !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" aria-hidden />
            Advanced Search
            {appliedCount > 0 && (
              <Badge variant="secondary">
                {appliedCount} filter{appliedCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((p) => !p)}
              aria-expanded={isExpanded}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? "Simple" : "Advanced"}
            </Button>
            {appliedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adv-query">Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="adv-query"
                placeholder="Title, description..."
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-location">Location</Label>
            <Select
              value={filters.location ?? ""}
              onValueChange={(v) => updateFilter("location", v || undefined)}
            >
              <SelectTrigger id="adv-location">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(v) => updateFilter("sortBy", v)}
              >
                <SelectTrigger className="flex-1">
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
                variant="outline"
                size="sm"
                onClick={() =>
                  updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
                }
                title={`Sort ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Section */}
        {isExpanded && (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <Separator />

            {/* Property Types */}
            <div className="space-y-3">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => {
                  const active = filters.propertyType?.includes(type.value);
                  return (
                    <Button
                      key={type.value}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInArray("propertyType", type.value)}
                      className="gap-2"
                    >
                      <Home className="h-4 w-4" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-3">
              <Label>Price Range (KES)</Label>
              <Slider
                value={[filters.priceRange[0], filters.priceRange[1]]}
                onValueChange={(v) => updateFilter("priceRange", v as [number, number])}
                max={10_000_000}
                step={50_000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>KES {formatPrice(filters.priceRange[0])}</span>
                <span>KES {formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>

            {/* Room Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: "bedrooms" as const, label: "Bedrooms", icon: Bed, opts: COUNT_OPTS },
                { key: "bathrooms" as const, label: "Bathrooms", icon: Bath, opts: COUNT_OPTS },
                { key: "parkingSpaces" as const, label: "Parking", icon: Car, opts: PARKING_OPTS },
              ] as const).map(({ key, label, icon: Icon, opts }) => (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Label>
                  <Select
                    value={filters[key]?.toString() ?? ""}
                    onValueChange={(v) =>
                      updateFilter(key, v ? parseInt(v, 10) : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {opts.map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n === 0 && key === "bedrooms" ? "Studio" : n === 0 ? "None" : `${n}+`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`am-${amenity}`}
                      checked={filters.amenities?.includes(amenity) ?? false}
                      onCheckedChange={() => toggleInArray("amenities", amenity)}
                    />
                    <Label htmlFor={`am-${amenity}`} className="text-sm cursor-pointer">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["furnished", "petFriendly"] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <Select
                    value={filters[key] === undefined ? "" : filters[key].toString()}
                    onValueChange={(v) =>
                      updateFilter(key, v === "" ? undefined : v === "true")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["verified", "pending"].map((status) => (
                    <Button
                      key={status}
                      variant={filters.verificationStatus?.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInArray("verificationStatus", status)}
                    >
                      {status === "verified" ? "Verified" : "Pending"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {savedSearches && savedSearches.length > 0 ? (
            <Select
              onValueChange={(val) => {
                const saved = savedSearches.find((s) => s.id.toString() === val);
                if (saved?.filters) setFilters((p) => ({ ...p, ...saved.filters }));
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Saved searches" />
              </SelectTrigger>
              <SelectContent>
                {savedSearches.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              Reset
            </Button>
            <Button onClick={handleSearch} disabled={isLoading} className="min-w-24">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}