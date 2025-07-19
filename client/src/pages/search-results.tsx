import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import ListingCard from "@/components/listing-card";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ArrowUpDown,
  X,
  MapPin,
} from "lucide-react";

// Type definitions for better type safety
interface SearchFilters {
  location: string;
  priceRange: [number, number];
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  verificationStatus: string;
  sortBy: string;
}

type ViewMode = "grid" | "list";
type SortOption =
  | "relevance"
  | "price_low"
  | "price_high"
  | "newest"
  | "oldest"
  | "verified";

// Constants moved outside component to prevent recreation on every render
const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
] as const;

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
] as const;

const BATHROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
] as const;

const AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Garden",
  "Balcony",
  "Air Conditioning",
  "Internet",
  "Furnished",
  "Pet Friendly",
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "verified", label: "Verified First" },
] as const;

// Default filter values as a constant to prevent object recreation
const DEFAULT_FILTERS: SearchFilters = {
  location: "",
  priceRange: [0, 1000000],
  propertyType: "all",
  bedrooms: "all",
  bathrooms: "all",
  amenities: [],
  verificationStatus: "all",
  sortBy: "relevance",
};

// Helper function to extract search query from URL
const extractSearchQuery = (location: string): string => {
  const searchParams = location.split("?")[1];
  if (!searchParams) return "";
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.get("q") || "";
};

// Helper function to build query parameters
const buildQueryParams = (
  searchQuery: string,
  filters: SearchFilters
): Record<string, any> => {
  const params: Record<string, any> = {};

  if (searchQuery) params.q = searchQuery;
  if (filters.location) params.location = filters.location;
  if (filters.propertyType !== "all")
    params.propertyType = filters.propertyType;
  if (filters.bedrooms !== "all") params.bedrooms = filters.bedrooms;
  if (filters.bathrooms !== "all") params.bathrooms = filters.bathrooms;
  if (filters.verificationStatus !== "all")
    params.verificationStatus = filters.verificationStatus;
  if (filters.amenities.length > 0)
    params.amenities = filters.amenities.join(",");
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) {
    params.minPrice = filters.priceRange[0];
    params.maxPrice = filters.priceRange[1];
  }
  params.sortBy = filters.sortBy;

  return params;
};

// Helper function to count active filters
const countActiveFilters = (filters: SearchFilters): number => {
  let count = 0;
  if (filters.location) count++;
  if (filters.propertyType !== "all") count++;
  if (filters.bedrooms !== "all") count++;
  if (filters.bathrooms !== "all") count++;
  if (filters.verificationStatus !== "all") count++;
  if (filters.amenities.length > 0) count++;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) count++;
  return count;
};

// Helper function to sort properties
const sortProperties = (
  properties: Property[],
  sortBy: SortOption
): Property[] => {
  const result = [...properties];

  switch (sortBy) {
    case "price_low":
      return result.sort((a, b) => a.price - b.price);
    case "price_high":
      return result.sort((a, b) => b.price - a.price);
    case "newest":
      return result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    case "oldest":
      return result.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    case "verified":
      return result.sort((a, b) => {
        if (
          a.verificationStatus === "verified" &&
          b.verificationStatus !== "verified"
        )
          return -1;
        if (
          a.verificationStatus !== "verified" &&
          b.verificationStatus === "verified"
        )
          return 1;
        return 0;
      });
    default:
      return result; // Keep original order for relevance
  }
};

export default function SearchResultsPage() {
  const [location, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // Memoized search query extraction
  const searchQuery = useMemo(() => extractSearchQuery(location), [location]);

  // Memoized query parameters for API
  const queryParams = useMemo(
    () => buildQueryParams(searchQuery, filters),
    [searchQuery, filters]
  );

  // React Query for fetching properties - FIXED RACE CONDITION
  const {
    data: properties,
    isLoading,
    error,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/search", queryParams],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      // Build search parameters safely
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      
      const url = `/api/properties/search?${searchParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry on client errors
      if (error?.message?.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Memoized active filters count
  const activeFiltersCount = useMemo(
    () => countActiveFilters(filters),
    [filters]
  );

  // Memoized sorted properties
  const sortedProperties = useMemo(() => {
    if (!properties) return [];
    return sortProperties(properties, filters.sortBy as SortOption);
  }, [properties, filters.sortBy]);

  // Optimized filter change handler with proper typing
  const handleFilterChange = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Optimized amenity toggle handler
  const handleAmenityToggle = useCallback((amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities:
        prev.amenities.includes(amenity) ?
          prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  // Clear filters handler
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // View mode toggle handlers
  const setGridView = useCallback(() => setViewMode("grid"), []);
  const setListView = useCallback(() => setViewMode("list"), []);
  const toggleFilters = useCallback(() => setShowFilters((prev) => !prev), []);

  // Error state component
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Search Error
            </h3>
            <p className="text-red-600 mb-4">
              There was an error performing your search. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate grid classes based on view mode
  const gridClasses =
    viewMode === "grid" ?
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {searchQuery ?
              `Search Results for "${searchQuery}"`
            : "Browse Properties"}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ?
              "Searching..."
            : `${sortedProperties.length} properties found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFilters}>
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={setGridView}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={setListView}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Filters</CardTitle>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter location..."
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: KES {filters.priceRange[0].toLocaleString()} -
                    KES {filters.priceRange[1].toLocaleString()}
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "priceRange",
                        value as [number, number]
                      )
                    }
                    max={1000000}
                    min={0}
                    step={10000}
                    className="w-full"
                  />
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Property Type
                  </label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) =>
                      handleFilterChange("propertyType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Bedrooms
                  </label>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(value) =>
                      handleFilterChange("bedrooms", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BEDROOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Bathrooms
                  </label>
                  <Select
                    value={filters.bathrooms}
                    onValueChange={(value) =>
                      handleFilterChange("bathrooms", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BATHROOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Verification Status
                  </label>
                  <Select
                    value={filters.verificationStatus}
                    onValueChange={(value) =>
                      handleFilterChange("verificationStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="pending">
                        Pending Verification
                      </SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amenities Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Amenities
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AMENITIES.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={amenity}
                          checked={filters.amenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <label
                          htmlFor={amenity}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
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
            </div>
          </div>

          {/* Results Display */}
          {isLoading ?
            <div className={`grid gap-6 ${gridClasses}`}>
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          : sortedProperties.length > 0 ?
            <div className={`grid gap-6 ${gridClasses}`}>
              {sortedProperties.map((property) => (
                <ListingCard key={property.id} property={property} />
              ))}
            </div>
          : <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  No properties found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or browse all properties.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                  <Button onClick={() => setLocation("/")} className="w-full">
                    Browse All Properties
                  </Button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
