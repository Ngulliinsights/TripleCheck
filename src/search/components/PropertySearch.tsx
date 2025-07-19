import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Slider } from "../../shared/components/ui/slider";
import { Switch } from "../../shared/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../shared/components/ui/select";
import { cn } from "../../shared/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useToast } from "../../shared/hooks/use-toast";

// Enhanced type definitions with better constraints
interface PropertyFilter {
  type: readonly string[];
  priceRange: readonly [number, number];
  bedrooms: number;
  bathrooms: number;
  area: readonly [number, number];
  features: readonly string[];
  verificationStatus: readonly string[];
  location?: string;
}

interface LocationSuggestion {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

interface SearchHistory {
  readonly id: string;
  readonly query: string;
  readonly timestamp: number;
}

// Type-safe API response interfaces
interface LocationSearchResponse {
  readonly suggestions: readonly LocationSuggestion[];
}

interface PropertySearchResponse {
  readonly properties: readonly unknown[]; // Replace with actual property type
  readonly totalCount: number;
}

// Constants moved outside component to prevent recreation on each render
const PROPERTY_TYPES = [
  "Apartment",
  "House", 
  "Commercial",
  "Land",
  "Industrial"
] as const;

const FEATURES = [
  "Parking",
  "Pool",
  "Security", 
  "Garden",
  "Furnished"
] as const;

const VERIFICATION_STATUSES = [
  { value: "verified", label: "Verified Only" },
  { value: "verified,pending", label: "Verified & Pending" },
  { value: "", label: "All Properties" }
] as const;

// Default filter values as a constant to ensure consistency
const DEFAULT_FILTERS: PropertyFilter = {
  type: [],
  priceRange: [0, 1000000],
  bedrooms: 0,
  bathrooms: 0,
  area: [0, 500],
  features: [],
  verificationStatus: [],
  location: undefined
} as const;

// Helper function to safely parse stored search history
const parseSearchHistory = (stored: string | null): SearchHistory[] => {
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Custom hook for search history management
const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    setSearchHistory(parseSearchHistory(history));
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToHistory = useCallback((query: string) => {
    if (!query || searchHistory.some(item => item.query === query)) return;
    
    const newHistoryItem: SearchHistory = {
      id: crypto.randomUUID(),
      query,
      timestamp: Date.now(),
    };
    
    setSearchHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
  }, [searchHistory]);

  return { searchHistory, addToHistory };
};

export function PropertySearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce(searchQuery, 300);
  const { toast } = useToast();
  const { searchHistory, addToHistory } = useSearchHistory();
  
  const [filters, setFilters] = useState<PropertyFilter>(DEFAULT_FILTERS);

  // Memoize active filters count to prevent unnecessary re-renders
  const activeFiltersCount = useMemo(() => 
    filters.type.length + filters.features.length, 
    [filters.type.length, filters.features.length]
  );

  // Location search query with improved error handling
  const { data: locationSuggestions, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", debouncedSearch] as const,
    queryFn: async (): Promise<readonly LocationSuggestion[]> => {
      if (!debouncedSearch) return [];
      
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }
      
      const data: LocationSearchResponse = await response.json();
      return data.suggestions;
    },
    enabled: !!debouncedSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Property search mutation with improved error handling
  const searchMutation = useMutation({
    mutationFn: async (searchFilters: PropertyFilter): Promise<PropertySearchResponse> => {
      const response = await fetch("/api/properties/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchFilters),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Memoized filter update handlers to prevent unnecessary re-renders
  const handlePropertyTypeToggle = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  }, []);

  const handleFeatureToggle = useCallback((feature: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      features: checked
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }));
  }, []);

  const handlePriceRangeChange = useCallback((value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]] as const
    }));
  }, []);

  const handleAreaChange = useCallback((value: number[]) => {
    setFilters(prev => ({
      ...prev,
      area: [value[0], value[1]] as const
    }));
  }, []);

  const handleBedroomsChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      bedrooms: parseInt(value) || 0
    }));
  }, []);

  const handleBathroomsChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      bathrooms: parseInt(value) || 0
    }));
  }, []);

  const handleVerificationStatusChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      verificationStatus: value.split(",").filter(Boolean)
    }));
  }, []);

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    setSearchQuery(location.name);
    setFilters(prev => ({
      ...prev,
      location: location.name
    }));
  }, []);

  // Handle search submission
  const handleSearch = useCallback(() => {
    searchMutation.mutate(filters);
    setIsExpanded(false);
    addToHistory(searchQuery);
  }, [filters, searchQuery, searchMutation, addToHistory]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  }, []);

  // Clear active filters handler
  const handleClearActiveFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      type: [],
      features: []
    }));
  }, []);

  // Handle search history item click
  const handleHistoryItemClick = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Bedroom and bathroom options memoized
  const bedroomOptions = useMemo(() => 
    [0, 1, 2, 3, 4, "5+"].map(num => ({
      value: num.toString(),
      label: `${num} ${num === "5+" ? "" : num === 1 ? "Bedroom" : "Bedrooms"}`
    })), []
  );

  const bathroomOptions = useMemo(() => 
    [0, 1, 2, 3, "4+"].map(num => ({
      value: num.toString(),
      label: `${num} ${num === "4+" ? "" : num === 1 ? "Bathroom" : "Bathrooms"}`
    })), []
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <Input
          className="w-full h-12 pl-12 pr-4 rounded-full"
          placeholder="Search by location, property type, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={() => setIsExpanded(true)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        
        {isLoadingLocations && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
        )}

        {/* Location Suggestions Dropdown */}
        <AnimatePresence>
          {searchQuery && locationSuggestions && locationSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 w-full mt-2 bg-card rounded-lg shadow-lg z-50"
            >
              <div className="p-2">
                {locationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-accent rounded-md flex items-center space-x-2"
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{suggestion.name}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search History */}
        <AnimatePresence>
          {!searchQuery && searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 w-full mt-2 bg-card rounded-lg shadow-lg z-50"
            >
              <div className="p-2">
                <h4 className="px-4 py-2 text-sm font-medium text-muted-foreground">Recent Searches</h4>
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-accent rounded-md flex items-center justify-between"
                    onClick={() => handleHistoryItemClick(item.query)}
                  >
                    <span>{item.query}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Badge */}
        {activeFiltersCount > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {activeFiltersCount} filters active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearActiveFilters}
              aria-label="Clear active filters"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Search Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full mt-2 p-6 bg-card rounded-lg shadow-lg z-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Type */}
              <div className="space-y-4">
                <h3 className="font-medium">Property Type</h3>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant={filters.type.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePropertyTypeToggle(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="font-medium">Price Range</h3>
                <Slider
                  defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
                  max={1000000}
                  step={1000}
                  onValueChange={handlePriceRangeChange}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${filters.priceRange[0].toLocaleString()}</span>
                  <span>${filters.priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Rooms */}
              <div className="space-y-4">
                <h3 className="font-medium">Rooms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={filters.bedrooms.toString()}
                    onValueChange={handleBedroomsChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {bedroomOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.bathrooms.toString()}
                    onValueChange={handleBathroomsChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {bathroomOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="font-medium">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Switch
                        checked={filters.features.includes(feature)}
                        onCheckedChange={(checked) => handleFeatureToggle(feature, checked)}
                      />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-4">
                <h3 className="font-medium">Verification Status</h3>
                <Select
                  value={filters.verificationStatus.join(",")}
                  onValueChange={handleVerificationStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area Range Filter */}
              <div className="space-y-4">
                <h3 className="font-medium">Area (sq m)</h3>
                <Slider
                  defaultValue={[filters.area[0], filters.area[1]]}
                  max={500}
                  step={10}
                  onValueChange={handleAreaChange}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{filters.area[0]} m²</span>
                  <span>{filters.area[1]} m²</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                type="button"
              >
                Reset Filters
              </Button>
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                type="button"
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Show Results"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}