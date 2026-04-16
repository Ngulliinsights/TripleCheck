import { useQuery } from "@tanstack/react-query"
import {
  Search,
  Filter,
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  Car,
  Calendar,
  DollarSign,
  Star,
  Shield,
  Sliders,
} from "lucide-react"
import React, { useState, useCallback, useMemo } from "react"

import { Badge } from '../../local/components/ui/badge"
import { Button } from '../../local/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../local/components/ui/card"
import { Checkbox } from '../../local/components/ui/checkbox"
import { Input } from '../../local/components/ui/input"
import { Label } from '../../local/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../local/components/ui/select"
import { Separator } from '../../local/components/ui/separator"
import { Slider } from '../../local/components/ui/slider"

import {
  PropertySearchFilters,
  SearchOptions,
} from '../../local/types/search"

// Enhanced interface with proper type definitions
interface AdvancedSearchFilters extends PropertySearchFilters {
  // Basic search properties - ensuring string types are non-nullable when needed
  query: string;
  location: string;

  // Property type as array to support multiple selections
  propertyType: string[];

  // Price ranges with proper tuple typing
  priceRange: [number, number];

  // Size ranges
  squareFeet: [number, number];
  yearBuilt: [number, number];

  // Trust and scoring
  trustScore?: number;

  // Sorting configuration
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters, options?: SearchOptions) => void;
  onReset: () => void;
  initialFilters?: Partial<AdvancedSearchFilters>;
  isLoading?: boolean;
  className?: string;
}

// Properly typed default filters that match the interface exactly
const DEFAULT_FILTERS: AdvancedSearchFilters = {
  query: "",
  location: "",
  propertyType: [] as string[], // Mutable array
  priceRange: [0, 10000000] as [number, number], // Mutable tuple
  squareFeet: [0, 10000] as [number, number], // Mutable tuple
  yearBuilt: [1950, new Date().getFullYear()] as [number, number], // Mutable tuple
  sortBy: "relevance",
  sortOrder: "desc",
  // Optional properties are omitted rather than set to undefined
};

// Property types configuration
const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Home },
  { value: "house", label: "House", icon: Home },
  { value: "condo", label: "Condo", icon: Home },
  { value: "townhouse", label: "Townhouse", icon: Home },
  { value: "studio", label: "Studio", icon: Home },
] as const;

// Available amenities
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

// Location options
const LOCATIONS = [
  "Nairobi CBD",
  "Westlands",
  "Karen",
  "Kilimani",
  // cspell:disable-next-line - These are real locations in Kenya
  "Lavington",
  "Runda",
  // cspell:disable-next-line - These are real locations in Nairobi, Kenya
  "Kileleshwa",
  "Parklands",
  "Kasarani",
  "Embakasi",
  // cspell:disable-next-line - These are real cities in Kenya
  "Mombasa",
  "Nakuru",
  "Kisumu",
  "Eldoret",
  "Thika",
] as const;

// Sorting options
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price", label: "Price" },
  { value: "date", label: "Date Listed" },
  { value: "size", label: "Size" },
  { value: "trust_score", label: "Trust Score" },
] as const;

export function AdvancedSearch({
  onSearch,
  onReset,
  initialFilters = {},
  isLoading = false,
  className = "",
}: AdvancedSearchProps) {
  // Initialize state with proper type merging
  const [filters, setFilters] = useState<AdvancedSearchFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  const [isExpanded, setIsExpanded] = useState(false);

  // Get saved searches for quick access
  const { data: savedSearches } = useQuery({
    queryKey: ["/api/searches/saved"],
    queryFn: async () => {
      // Mock data with proper typing
      return [
        {
          id: 1,
          name: "Westlands Apartments",
          filters: {
            location: "Westlands",
            propertyType: ["apartment"],
          } as Partial<AdvancedSearchFilters>,
        },
        {
          id: 2,
          name: "Family Homes Karen",
          filters: {
            location: "Karen",
            bedrooms: 3,
            propertyType: ["house"],
          } as Partial<AdvancedSearchFilters>,
        },
      ];
    },
  });

  // Type-safe filter update function
  const updateFilter = useCallback(
    <K extends keyof AdvancedSearchFilters>(
      key: K,
      value: AdvancedSearchFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Enhanced array filter toggle with proper typing
  const toggleArrayFilter = useCallback(
    (
      key: "amenities" | "verificationStatus" | "propertyType",
      value: string
    ) => {
      setFilters((prev) => {
        const currentArray = prev[key] || [];
        const newArray =
          currentArray.includes(value) ?
            currentArray.filter((item) => item !== value)
          : [...currentArray, value];
        return { ...prev, [key]: newArray };
      });
    },
    []
  );

  // Search handler with proper error handling
  const handleSearch = useCallback(() => {
    try {
      onSearch(filters);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [filters, onSearch]);

  // Reset handler that maintains type safety
  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    onReset();
  }, [onReset]);

  // Optimized filter count calculation
  const appliedFiltersCount = useMemo(() => {
    let count = 0;

    // Check each filter condition systematically
    if (filters.query.trim()) count++;
    if (filters.location) count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.bedrooms !== undefined) count++;
    if (filters.bathrooms !== undefined) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.verificationStatus && filters.verificationStatus.length > 0) count++;
    if (filters.furnished !== undefined) count++;
    if (filters.petFriendly !== undefined) count++;
    if (filters.parkingSpaces !== undefined) count++;

    return count;
  }, [filters]);

  // Price formatting utility
  const formatPrice = useCallback((price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  }, []);

  // Helper function to safely handle select values
  const handleSelectChange = useCallback(
    (key: "bedrooms" | "bathrooms" | "parkingSpaces", value: string) => {
      const numericValue = value ? parseInt(value, 10) : undefined;
      updateFilter(key, numericValue);
    },
    [updateFilter]
  );

  // Helper function for boolean select changes
  const handleBooleanSelectChange = useCallback(
    (key: "furnished" | "petFriendly", value: string) => {
      const booleanValue = value === "" ? undefined : value === "true";
      updateFilter(key, booleanValue);
    },
    [updateFilter]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
            {appliedFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {appliedFiltersCount} filter
                {appliedFiltersCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="advanced-filters"
            >
              <Sliders className="h-4 w-4 mr-2" />
              {isExpanded ? "Simple" : "Advanced"}
            </Button>
            {appliedFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Property title, description..."
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={filters.location || ""}
              onValueChange={(value) => updateFilter("location", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
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
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger className="flex-1">
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
                variant="outline"
                size="sm"
                onClick={() =>
                  updateFilter(
                    "sortOrder",
                    filters.sortOrder === "asc" ? "desc" : "asc"
                  )
                }
                title={`Currently sorting ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Section */}
        {isExpanded && (
          <div id="advanced-filters">
            <Separator />

            {/* Property Type Selection */}
            <div className="space-y-3 mt-6">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={
                      filters.propertyType.includes(type.value) ?
                        "default"
                      : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      toggleArrayFilter("propertyType", type.value)
                    }
                    className="flex items-center gap-2"
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3">
              <Label>Price Range (KES)</Label>
              <div className="px-3">
                <Slider
                  value={[...filters.priceRange]} // Spread to create mutable array for Slider
                  onValueChange={(value) =>
                    updateFilter("priceRange", value as [number, number])
                  }
                  max={10000000}
                  min={0}
                  step={50000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>KES {formatPrice(filters.priceRange[0])}</span>
                  <span>KES {formatPrice(filters.priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Room Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Select
                  value={filters.bedrooms?.toString() || ""}
                  onValueChange={(value) =>
                    handleSelectChange("bedrooms", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ?
                          "Studio"
                        : `${num}+ bed${num > 1 ? "s" : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Select
                  value={filters.bathrooms?.toString() || ""}
                  onValueChange={(value) =>
                    handleSelectChange("bathrooms", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+ bath{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parking</Label>
                <Select
                  value={filters.parkingSpaces?.toString() || ""}
                  onValueChange={(value) =>
                    handleSelectChange("parkingSpaces", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[0, 1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ?
                          "No parking"
                        : `${num}+ space${num > 1 ? "s" : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities Selection */}
            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${amenity}`}
                      checked={filters.amenities?.includes(amenity) || false}
                      onCheckedChange={() =>
                        toggleArrayFilter("amenities", amenity)
                      }
                    />
                    <Label
                      htmlFor={`amenity-${amenity}`}
                      className="text-sm cursor-pointer"
                    >
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Furnished</Label>
                <Select
                  value={
                    filters.furnished === undefined ?
                      ""
                    : filters.furnished.toString()
                  }
                  onValueChange={(value) =>
                    handleBooleanSelectChange("furnished", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="true">Furnished</SelectItem>
                    <SelectItem value="false">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pet Friendly</Label>
                <Select
                  value={
                    filters.petFriendly === undefined ?
                      ""
                    : filters.petFriendly.toString()
                  }
                  onValueChange={(value) =>
                    handleBooleanSelectChange("petFriendly", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="true">Pet Friendly</SelectItem>
                    <SelectItem value="false">No Pets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Verification Status</Label>
                <div className="flex flex-wrap gap-2">
                  {["verified", "pending"].map((status) => (
                    <Button
                      key={status}
                      variant={
                        filters.verificationStatus?.includes(status) ?
                          "default"
                        : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        toggleArrayFilter("verificationStatus", status)
                      }
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      {status === "verified" ? "Verified" : "Pending"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {savedSearches && savedSearches.length > 0 && (
              <Select
                onValueChange={(value) => {
                  const saved = savedSearches.find(
                    (s) => s.id.toString() === value
                  );
                  if (saved?.filters) {
                    setFilters((prev) => ({ ...prev, ...saved.filters }));
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Saved searches" />
                </SelectTrigger>
                <SelectContent>
                  {savedSearches.map((search) => (
                    <SelectItem key={search.id} value={search.id.toString()}>
                      {search.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ?
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              : <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedSearch;
