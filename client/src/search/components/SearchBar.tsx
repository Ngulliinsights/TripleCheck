import {
  Search,
  MapPin,
  Home,
  DollarSign,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useState, useCallback, useEffect, useMemo } from "react"

import { Alert, AlertDescription } from "../../local/components/ui/alert"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import { Input } from "../../local/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../local/components/ui/select"
import { useDebounce } from "../../local/hooks/useDebounce"

import { SearchBarFilters } from "../../local/types/search"

// SearchBarFilters is now imported from unified types

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchBarFilters) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  isLoading?: boolean;
  error?: string | null;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

// Kenya-specific property types and price ranges
const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "maisonette", label: "Maisonette" },
  { value: "bungalow", label: "Bungalow" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
] as const;

const PRICE_RANGES = [
  { value: "under-1m", label: "Under KES 1M" },
  { value: "1m-5m", label: "KES 1M - 5M" },
  { value: "5m-10m", label: "KES 5M - 10M" },
  { value: "10m-20m", label: "KES 10M - 20M" },
  { value: "20m-50m", label: "KES 20M - 50M" },
  { value: "over-50m", label: "Over KES 50M" },
] as const;

export default function SearchBar({
  onSearch,
  onSuggestionSelect,
  isLoading = false,
  error = null,
  suggestions = [],
  placeholder = "Search properties (e.g., 3 bedroom house in Westlands...)",
  className = "",
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Debounce search query for auto-search functionality
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Auto-search when debounced query changes (if enabled)
  useEffect(() => {
    if (debouncedSearchQuery.trim() && debouncedSearchQuery.length >= 2) {
      handleSearch(true); // Pass true for auto-search
    }
  }, [debouncedSearchQuery]);

  // Validate search inputs
  const validateInputs = useCallback(() => {
    const errors: Record<string, string> = {};

    if (searchQuery.trim().length > 0 && searchQuery.trim().length < 2) {
      errors.searchQuery = "Search query must be at least 2 characters";
    }

    if (location.trim().length > 0 && location.trim().length < 2) {
      errors.location = "Location must be at least 2 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [searchQuery, location]);

  // Enhanced search handler with validation and structured data
  const handleSearch = useCallback(
    (isAutoSearch = false) => {
      if (!isAutoSearch && !validateInputs()) {
        return;
      }

      const trimmedQuery = searchQuery.trim();
      const filters: SearchBarFilters = {
        location: location.trim(),
        propertyType,
        priceRange,
      };

      // Only call onSearch if we have a meaningful query or filters
      if (
        trimmedQuery ||
        filters.location ||
        filters.propertyType ||
        filters.priceRange
      ) {
        onSearch(trimmedQuery, filters);
      }
    },
    [searchQuery, location, propertyType, priceRange, onSearch, validateInputs]
  );

  // Handle Enter key press for better user experience
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
        setShowSuggestions(false);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [handleSearch]
  );

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      setShowSuggestions(false);
      onSuggestionSelect?.(suggestion);
    },
    [onSuggestionSelect]
  );

  // Clear all search filters
  const handleClear = useCallback(() => {
    setSearchQuery("");
    setLocation("");
    setPropertyType("");
    setPriceRange("");
    setValidationErrors({});
    setShowSuggestions(false);
  }, []);

  // Handle input focus for suggestions
  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Memoize active filters count for performance
  const activeFiltersCount = useMemo(() => {
    return [location, propertyType, priceRange].filter(Boolean).length;
  }, [location, propertyType, priceRange]);

  // Memoize search preview text
  const searchPreviewText = useMemo(() => {
    const terms = [searchQuery, location, propertyType, priceRange].filter(
      Boolean
    );
    return terms.length > 0 ? terms.join(" • ") : "No search terms entered";
  }, [searchQuery, location, propertyType, priceRange]);

  return (
    <div
      className={`w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main search input with icon and suggestions */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(
                e.target.value.length >= 2 && suggestions.length > 0
              );
            }}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow suggestion clicks
            className={`pl-10 h-12 text-lg ${validationErrors.searchQuery ? "border-red-500" : ""}`}
            aria-describedby={
              validationErrors.searchQuery ? "search-error" : undefined
            }
          />

          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
          )}

          {/* Clear button */}
          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Validation error */}
          {validationErrors.searchQuery && (
            <p id="search-error" className="text-sm text-red-600 mt-1">
              {validationErrors.searchQuery}
            </p>
          )}
        </div>

        {/* Filter row with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              placeholder="Location (e.g., Westlands, Karen, CBD)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`pl-10 ${validationErrors.location ? "border-red-500" : ""}`}
              aria-describedby={
                validationErrors.location ? "location-error" : undefined
              }
            />
            {validationErrors.location && (
              <p id="location-error" className="text-sm text-red-600 mt-1">
                {validationErrors.location}
              </p>
            )}
          </div>

          {/* Property type selector */}
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="pl-10">
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
          </div>

          {/* Price range selector */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="pl-10">
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
          </div>
        </div>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label="Remove location filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {propertyType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label}
                <button
                  type="button"
                  onClick={() => setPropertyType("")}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label="Remove property type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {priceRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {PRICE_RANGES.find((r) => r.value === priceRange)?.label}
                <button
                  type="button"
                  onClick={() => setPriceRange("")}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label="Remove price range filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={() => handleSearch()}
            disabled={isLoading || Object.keys(validationErrors).length > 0}
            className="flex-1 h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ?
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Search className="mr-2 h-4 w-4" />}
            {isLoading ? "Searching..." : "Search Properties"}
          </Button>
          <Button
            type="button"
            onClick={handleClear}
            variant="outline"
            className="px-6 h-12"
            disabled={isLoading}
          >
            Clear All
          </Button>
        </div>

        {/* Search preview (shows what will be searched) */}
        {(searchQuery || location || propertyType || priceRange) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Search preview:</span>{" "}
              <span className="text-gray-800">{searchPreviewText}</span>
            </p>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""}{" "}
                applied
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
