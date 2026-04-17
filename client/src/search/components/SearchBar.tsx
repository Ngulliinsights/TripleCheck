import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MapPin,
  Home,
  DollarSign,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Alert, AlertDescription } from "../../local/components/ui/alert";
import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Input } from "../../local/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../local/components/ui/select";
import { useDebounce } from "../../local/hooks/useDebounce";
import { SearchBarFilters } from "../../local/types/search";

// ============================================================================
// Types & Constants
// ============================================================================

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchBarFilters) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  isLoading?: boolean;
  error?: string | null;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

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

// ============================================================================
// Component
// ============================================================================

export default function SearchBar({
  onSearch,
  onSuggestionSelect,
  isLoading = false,
  error = null,
  suggestions = [],
  placeholder = "Search properties (e.g., 3 bedroom house in Westlands...)",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Auto-search on debounced query (min 2 chars)
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      triggerSearch(debouncedQuery, true);
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = useCallback(
    (searchQuery: string, isAuto = false) => {
      const trimmed = searchQuery.trim();
      const hasFilters = location || propertyType || priceRange;

      if (!trimmed && !hasFilters) return;
      if (!isAuto && trimmed.length > 0 && trimmed.length < 2) {
        setValidationError("Search query must be at least 2 characters");
        return;
      }

      setValidationError(null);
      onSearch(trimmed, { location: location.trim(), propertyType, priceRange });
    },
    [location, propertyType, priceRange, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerSearch(query);
        setShowSuggestions(false);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [query, triggerSearch]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowSuggestions(false);
      onSuggestionSelect?.(suggestion);
      triggerSearch(suggestion);
    },
    [onSuggestionSelect, triggerSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setLocation("");
    setPropertyType("");
    setPriceRange("");
    setValidationError(null);
    setShowSuggestions(false);
  }, []);

  const hasActiveFilters = location || propertyType || priceRange;

  const previewText = useMemo(() => {
    const parts = [query, location, propertyType, priceRange].filter(Boolean);
    return parts.length ? parts.join(" • ") : "No search terms entered";
  }, [query, location, propertyType, priceRange]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Search Input */}
        <div className="relative" ref={suggestionsRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              setShowSuggestions(val.length >= 2 && suggestions.length > 0);
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            className={`pl-10 h-12 text-lg ${validationError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            aria-describedby={validationError ? "search-error" : undefined}
          />

          {isLoading ? (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
          ) : null}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {validationError && (
          <p id="search-error" className="text-sm text-red-600">
            {validationError}
          </p>
        )}

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
            <Input
              placeholder="Location (e.g., Westlands, Karen)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
              aria-label="Location"
            />
          </div>

          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="pl-10" aria-label="Property type">
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
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="pl-10" aria-label="Price range">
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
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {location}
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="ml-1 hover:text-red-600"
                  aria-label="Remove location filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {propertyType && (
              <Badge variant="secondary" className="gap-1">
                <Home className="h-3 w-3" />
                {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label}
                <button
                  type="button"
                  onClick={() => setPropertyType("")}
                  className="ml-1 hover:text-red-600"
                  aria-label="Remove property type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {priceRange && (
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {PRICE_RANGES.find((r) => r.value === priceRange)?.label}
                <button
                  type="button"
                  onClick={() => setPriceRange("")}
                  className="ml-1 hover:text-red-600"
                  aria-label="Remove price filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => triggerSearch(query)}
            disabled={isLoading}
            className="flex-1 h-12 text-lg font-medium"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Searching..." : "Search Properties"}
          </Button>
          {(query || hasActiveFilters) && (
            <Button type="button" onClick={handleClear} variant="outline" className="px-6 h-12">
              Clear
            </Button>
          )}
        </div>

        {/* Search Preview */}
        {(query || hasActiveFilters) && (
          <div className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Search preview:</span>{" "}
              <span className="text-gray-800">{previewText}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}