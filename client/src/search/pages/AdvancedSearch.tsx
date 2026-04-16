import React, { useState, useCallback, useMemo } from "react"
import {
  Search,
  Filter,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Shield,
  Star,
  RotateCcw, // Using RotateCcw instead of Reset which doesn't exist
  Save,
  X,
} from "lucide-react"

import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card"
import { Badge } from "../../shared/components/ui/badge"
import { Checkbox } from "../../shared/components/ui/checkbox"
import { Label } from "../../shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/ui/select"
import { Slider } from "../../shared/components/ui/slider"
import { PropertyCard } from "../../shared/components/property"
import { useToast } from "../../shared/hooks/use-toast"
import { NormalizedProperty } from "../../shared/types/property"

import { PropertySearchFilters } from "../../shared/types/search"

// Extended interface for advanced search with additional UI-specific fields
interface AdvancedSearchFilters extends PropertySearchFilters {
  // UI-specific fields for advanced search
  priceRange: [number, number];
  areaRange: [number, number];
  listingAge: number | null;
  sortBy: string;
  savedSearchName?: string;
}

// Interface for saved searches with proper typing
interface SavedSearch {
  id: string;
  name: string;
  filters: AdvancedSearchFilters;
  createdAt: Date;
  alertsEnabled: boolean;
}

// Comprehensive default filters with all required properties properly initialized
const defaultFilters: AdvancedSearchFilters = {
  query: "",
  location: "",
  propertyType: [], // Properly initialized as empty array
  priceRange: [0, 100000000],
  // Optional fields are omitted to satisfy exactOptionalPropertyTypes
  areaMin: 0,
  areaMax: 10000,
  areaRange: [0, 10000],
  amenities: [], // Properly initialized as empty array
  verificationStatus: [], // Properly initialized as empty array
  listingAge: null,
  sortBy: "relevance",
};

// Property type configurations with icons for better UX
const propertyTypes = [
  { id: "apartment", label: "Apartment", icon: "🏢" },
  { id: "house", label: "House", icon: "🏠" },
  { id: "villa", label: "Villa", icon: "🏡" },
  { id: "townhouse", label: "Townhouse", icon: "🏘️" },
  { id: "land", label: "Land", icon: "🌍" },
  { id: "commercial", label: "Commercial", icon: "🏢" },
];

// Amenity configurations with mixed icon types (components and emojis)
const amenities = [
  { id: "parking", label: "Parking", icon: Car },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "pool", label: "Swimming Pool", icon: "🏊" },
  { id: "garden", label: "Garden", icon: "🌳" },
  { id: "balcony", label: "Balcony", icon: "🏞️" },
  { id: "furnished", label: "Furnished", icon: "🛋️" },
];

// Verification status configurations with proper styling
const verificationStatuses = [
  { id: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
  {
    id: "pending",
    label: "Pending Verification",
    color: "bg-yellow-100 text-yellow-800",
  },
  { id: "unverified", label: "Unverified", color: "bg-gray-100 text-gray-800" },
];

// Sort options for organizing search results
const sortOptions = [
  { id: "relevance", label: "Most Relevant" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "area-large", label: "Largest Area" },
  { id: "area-small", label: "Smallest Area" },
];

// Mock search results for demonstration - in real app, this would come from API
const mockResults: NormalizedProperty[] = [
  {
    id: "1",
    title: "Modern 3BR Apartment in Westlands",
    description: "Spacious apartment with modern amenities",
    price: 15000000,
    location: "Westlands, Nairobi",
    // cspell:disable-next-line - Image filename from Unsplash
    images: ["/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg"],
    verified: true,
    type: "apartment",
    category: "residential",
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
    },
    createdAt: new Date().toISOString(),
    status: "available",
    verificationStatus: "verified",
  },
  {
    id: "2",
    title: "Luxury Villa in Karen",
    description: "Beautiful villa with garden and pool",
    price: 45000000,
    location: "Karen, Nairobi",
    // cspell:disable-next-line - Image filename from Unsplash
    images: ["/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg"],
    verified: true,
    type: "villa",
    category: "residential",
    features: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
    },
    createdAt: new Date().toISOString(),
    status: "available",
    verificationStatus: "verified",
  },
];

export default function AdvancedSearch() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AdvancedSearchFilters>(defaultFilters);
  const [results, setResults] = useState<NormalizedProperty[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Generic update function with proper typing and type safety
  // This function ensures we can only update properties that exist on AdvancedSearchFilters
  const updateFilter = useCallback(
    <K extends keyof AdvancedSearchFilters>(
      key: K,
      value: AdvancedSearchFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Specialized helper function for toggling array values with complete type safety
  // This prevents runtime errors when working with array-based filters
  const toggleArrayFilter = useCallback(
    (
      key: "propertyType" | "amenities" | "verificationStatus",
      value: string
    ) => {
      setFilters((prev) => {
        const currentValue = prev[key];
        let currentArray: string[];

        // Handle the case where propertyType might be a string or string[]
        if (key === "propertyType") {
          currentArray =
            Array.isArray(currentValue) ? currentValue
            : currentValue ? [currentValue]
            : [];
        } else {
          currentArray = (currentValue as string[]) || [];
        }

        const newArray =
          currentArray.includes(value) ?
            currentArray.filter((item) => item !== value)
          : [...currentArray, value];
        return { ...prev, [key]: newArray };
      });
    },
    []
  );

  // Enhanced search function with comprehensive filtering logic
  const handleSearch = useCallback(async () => {
    setIsSearching(true);

    // Simulate API call delay for realistic user experience
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Apply comprehensive filtering with proper null/undefined safety checks
    let filteredResults = mockResults;

    // Text-based filtering with proper null/undefined checks and trimming
    if (filters.query?.trim()) {
      const queryLower = filters.query.toLowerCase();
      filteredResults = filteredResults.filter(
        (property) =>
          property.title.toLowerCase().includes(queryLower) ||
          property.description.toLowerCase().includes(queryLower)
      );
    }

    if (filters.location?.trim()) {
      const locationLower = filters.location.toLowerCase();
      filteredResults = filteredResults.filter((property) =>
        property.location.toLowerCase().includes(locationLower)
      );
    }

    // Array-based filtering with length validation
    const propertyTypeArray =
      Array.isArray(filters.propertyType) ? filters.propertyType
      : filters.propertyType ? [filters.propertyType]
      : [];
    if (propertyTypeArray.length > 0) {
      filteredResults = filteredResults.filter((property) =>
        propertyTypeArray.includes(property.type)
      );
    }

    // Numerical filtering with proper undefined/null checks
    if (filters.bedrooms !== undefined && filters.bedrooms !== null) {
      filteredResults = filteredResults.filter(
        (property) => property.features?.bedrooms === filters.bedrooms
      );
    }

    if (filters.bathrooms !== undefined && filters.bathrooms !== null) {
      filteredResults = filteredResults.filter(
        (property) => property.features?.bathrooms === filters.bathrooms
      );
    }

    // Price range filtering with proper bounds checking
    filteredResults = filteredResults.filter(
      (property) =>
        property.price >= filters.priceRange[0] &&
        property.price <= filters.priceRange[1]
    );

    // Verification status filtering with fallback for missing status
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      filteredResults = filteredResults.filter((property) =>
        filters.verificationStatus!.includes(
          property.verificationStatus || "unverified"
        )
      );
    }

    setResults(filteredResults);
    setIsSearching(false);

    // Provide user feedback with result count
    toast({
      title: "Search completed",
      description: `Found ${filteredResults.length} properties matching your criteria.`,
    });
  }, [filters, toast]);

  // Reset function that restores all filters to default state
  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setResults([]);

    toast({
      title: "Filters reset",
      description: "All search filters have been cleared.",
    });
  }, [toast]);

  // Enhanced save search function with comprehensive validation
  const handleSaveSearch = useCallback(() => {
    // Validate search name with proper trimming
    if (!filters.savedSearchName?.trim()) {
      toast({
        title: "Please enter a name",
        description: "Give your saved search a name to continue.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate search names
    if (
      savedSearches.some(
        (search) =>
          search.name.toLowerCase() ===
          filters.savedSearchName!.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Name already exists",
        description: "Please choose a different name for this search.",
        variant: "destructive",
      });
      return;
    }

    // Create new saved search with proper data structure
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: filters.savedSearchName.trim(),
      filters: { ...filters }, // Deep copy to avoid reference issues
      createdAt: new Date(),
      alertsEnabled: true,
    };

    setSavedSearches((prev) => [...prev, newSavedSearch]);
    setShowSaveDialog(false);
    updateFilter("savedSearchName", "");

    toast({
      title: "Search saved",
      description: `"${newSavedSearch.name}" has been saved to your searches.`,
    });
  }, [filters, savedSearches, toast, updateFilter]);

  // Function to load a previously saved search
  const loadSavedSearch = useCallback(
    (savedSearch: SavedSearch) => {
      setFilters({ ...savedSearch.filters }); // Create new object to trigger re-render
      toast({
        title: "Search loaded",
        description: `Loaded "${savedSearch.name}" search criteria.`,
      });
    },
    [toast]
  );

  // Optimized calculation of active filters count using useMemo for performance
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // Count text-based filters
    if (filters.query?.trim()) count++;
    if (filters.location?.trim()) count++;

    // Count array-based filters
    if (filters.propertyType && filters.propertyType.length > 0) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.verificationStatus && filters.verificationStatus.length > 0)
      count++;

    // Count numerical filters
    if (filters.bedrooms !== undefined && filters.bedrooms !== null) count++;
    if (filters.bathrooms !== undefined && filters.bathrooms !== null) count++;

    // Count other filters
    if (filters.listingAge !== null) count++;

    // Count price range only if it's different from default
    if (
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1]
    )
      count++;

    return count;
  }, [filters]);

  // Helper function to remove individual filter badges
  const removeFilter = useCallback(
    (filterType: string, value?: string) => {
      switch (filterType) {
        case "query":
          updateFilter("query", "");
          break;
        case "location":
          updateFilter("location", "");
          break;
        case "bedrooms":
          updateFilter("bedrooms", undefined);
          break;
        case "bathrooms":
          updateFilter("bathrooms", undefined);
          break;
        case "propertyType":
          if (value) toggleArrayFilter("propertyType", value);
          break;
        case "amenities":
          if (value) toggleArrayFilter("amenities", value);
          break;
        case "verificationStatus":
          if (value) toggleArrayFilter("verificationStatus", value);
          break;
      }
    },
    [updateFilter, toggleArrayFilter]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Search className="w-8 h-8" />
            Advanced Search
          </h1>
          <p className="text-muted-foreground">
            Find your perfect property with detailed search filters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Searches Section */}
            {savedSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saved Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map((savedSearch) => (
                    <div
                      key={savedSearch.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => loadSavedSearch(savedSearch)}
                    >
                      <span className="text-sm font-medium truncate">
                        {savedSearch.name}
                      </span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {savedSearch.alertsEnabled ? "Alerts On" : "Alerts Off"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Basic Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="query">Keywords</Label>
                  <Input
                    id="query"
                    placeholder="e.g., modern apartment, villa..."
                    value={filters.query || ""}
                    onChange={(e) => updateFilter("query", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Westlands, Karen, Nairobi..."
                    value={filters.location || ""}
                    onChange={(e) => updateFilter("location", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Type Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={(Array.isArray(filters.propertyType) ?
                          filters.propertyType
                        : filters.propertyType ? [filters.propertyType]
                        : []
                        ).includes(type.id)}
                        onCheckedChange={() =>
                          toggleArrayFilter("propertyType", type.id)
                        }
                      />
                      <Label
                        htmlFor={type.id}
                        className="text-sm cursor-pointer"
                      >
                        {type.icon} {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Range Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Range (KES)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) =>
                      updateFilter("priceRange", value as [number, number])
                    }
                    max={100000000}
                    min={0}
                    step={1000000}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>KES {filters.priceRange[0].toLocaleString()}</span>
                  <span>KES {filters.priceRange[1].toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Bedrooms & Bathrooms Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bedrooms</Label>
                  <Select
                    value={filters.bedrooms?.toString() || ""}
                    onValueChange={(value) =>
                      updateFilter(
                        "bedrooms",
                        value ? parseInt(value) : undefined
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ Bedrooms
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Bathrooms</Label>
                  <Select
                    value={filters.bathrooms?.toString() || ""}
                    onValueChange={(value) =>
                      updateFilter(
                        "bathrooms",
                        value ? parseInt(value) : undefined
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ Bathrooms
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Amenities Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={amenity.id}
                        checked={
                          filters.amenities?.includes(amenity.id) || false
                        }
                        onCheckedChange={() =>
                          toggleArrayFilter("amenities", amenity.id)
                        }
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="text-sm flex items-center gap-2 cursor-pointer"
                      >
                        {typeof amenity.icon === "string" ?
                          <span>{amenity.icon}</span>
                        : <amenity.icon className="w-4 h-4" />}
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verification Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {verificationStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={status.id}
                        checked={
                          filters.verificationStatus?.includes(status.id) ||
                          false
                        }
                        onCheckedChange={() =>
                          toggleArrayFilter("verificationStatus", status.id)
                        }
                      />
                      <Label
                        htmlFor={status.id}
                        className="text-sm cursor-pointer"
                      >
                        <Badge className={status.color}>{status.label}</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleSearch}
                className="w-full"
                disabled={isSearching}
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Searching..." : "Search Properties"}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
                disabled={isSearching}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowSaveDialog(true)}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Search Results {results.length > 0 && `(${results.length})`}
                </h2>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} applied
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Sort by:</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter("sortBy", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {filters.query?.trim() && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      "{filters.query}"
                      <X
                        className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded"
                        onClick={() => removeFilter("query")}
                      />
                    </Badge>
                  )}
                  {filters.location?.trim() && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      {filters.location}
                      <X
                        className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded"
                        onClick={() => removeFilter("location")}
                      />
                    </Badge>
                  )}
                  {(Array.isArray(filters.propertyType) ? filters.propertyType
                  : filters.propertyType ? [filters.propertyType]
                  : []
                  ).map((type: string) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Home className="w-3 h-3" />
                      {propertyTypes.find((pt) => pt.id === type)?.label}
                      <X
                        className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded"
                        onClick={() => removeFilter("propertyType", type)}
                      />
                    </Badge>
                  ))}
                  {filters.bedrooms !== undefined &&
                    filters.bedrooms !== null && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Bed className="w-3 h-3" />
                        {filters.bedrooms}+ Bedrooms
                        <X
                          className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded"
                          onClick={() => removeFilter("bedrooms")}
                        />
                      </Badge>
                    )}
                  {filters.bathrooms !== undefined &&
                    filters.bathrooms !== null && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Bath className="w-3 h-3" />
                        {filters.bathrooms}+ Bathrooms
                        <X
                          className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded"
                          onClick={() => removeFilter("bathrooms")}
                        />
                      </Badge>
                    )}
                </div>
              </div>
            )}

            {/* Results Grid or Empty State */}
            {results.length === 0 ?
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">
                    {isSearching ? "Searching..." : "No properties found"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {isSearching ?
                      "Please wait while we search for properties matching your criteria."
                    : "Try adjusting your search filters or search criteria to find more properties."
                    }
                  </p>
                  {!isSearching && activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="mt-4"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            }
          </div>
        </div>

        {/* Save Search Modal Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Save Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    placeholder="e.g., 3BR Apartments in Westlands"
                    value={filters.savedSearchName || ""}
                    onChange={(e) =>
                      updateFilter("savedSearchName", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveSearch();
                      } else if (e.key === "Escape") {
                        setShowSaveDialog(false);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-alerts" defaultChecked />
                  <Label
                    htmlFor="enable-alerts"
                    className="text-sm cursor-pointer"
                  >
                    Enable email alerts for new matching properties
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveSearch}
                    className="flex-1"
                    disabled={!filters.savedSearchName?.trim()}
                  >
                    Save Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false);
                      updateFilter("savedSearchName", "");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
