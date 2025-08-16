/**
 * Consolidated Search Component
 * Combines SearchBar, SearchFilters, and search results functionality
 * Eliminates redundancy across search components
 */

import { Search, Filter, X, MapPin, Sliders, Loader2 } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Input } from '../../shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { PropertySearchFilters, SearchOptions, SortOption } from '../../shared/types/search';
import { useSearch } from '../hooks/useSearch';

interface ConsolidatedSearchProps {
  onResults?: (results: any[]) => void;
  onFiltersChange?: (filters: PropertySearchFilters) => void;
  initialFilters?: Partial<PropertySearchFilters>;
  showAdvancedFilters?: boolean;
  className?: string;
}

// Property types configuration
const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' }
] as const;

// Price ranges for quick selection
const PRICE_RANGES = [
  { value: '', label: 'Any Price' },
  { value: '0-1000000', label: 'Under KES 1M' },
  { value: '1000000-5000000', label: 'KES 1M - 5M' },
  { value: '5000000-10000000', label: 'KES 5M - 10M' },
  { value: '10000000-20000000', label: 'KES 10M - 20M' },
  { value: '20000000-', label: 'Over KES 20M' }
] as const;

// Sort options
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price', label: 'Price' },
  { value: 'date', label: 'Newest First' },
  { value: 'size', label: 'Size' }
] as const;

export function ConsolidatedSearch({
  onResults,
  onFiltersChange,
  initialFilters = {},
  showAdvancedFilters = false,
  className = ''
}: ConsolidatedSearchProps) {
  const [showFilters, setShowFilters] = useState(showAdvancedFilters);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use the consolidated search hook
  const {
    filters,
    searchResults,
    isLoading,
    updateFilter,
    updateFilters,
    clearFilters,
    search,
    activeFilterCount
  } = useSearch({
    initialFilters,
    autoSearch: true
  });

  // Handle search execution
  const handleSearch = useCallback(() => {
    search();
    if (searchResults?.items) {
      onResults?.(searchResults.items);
    }
  }, [search, searchResults, onResults]);

  // Handle filter changes
  const handleFilterChange = useCallback(<K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    updateFilter(key, value);
    onFiltersChange?.({ ...filters, [key]: value });
  }, [updateFilter, filters, onFiltersChange]);

  // Handle price range selection
  const handlePriceRangeChange = useCallback((value: string) => {
    if (!value) {
      updateFilters({ priceMin: undefined, priceMax: undefined });
      return;
    }

    const [min, max] = value.split('-').map(v => v ? parseInt(v, 10) : undefined);
    updateFilters({ priceMin: min, priceMax: max });
  }, [updateFilters]);

  // Get current price range value
  const currentPriceRange = useMemo(() => {
    if (!filters.priceMin && !filters.priceMax) return '';
    if (filters.priceMin && !filters.priceMax) return `${filters.priceMin}-`;
    if (!filters.priceMin && filters.priceMax) return `0-${filters.priceMax}`;
    return `${filters.priceMin}-${filters.priceMax}`;
  }, [filters.priceMin, filters.priceMax]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    // Sort handling would be done through search options, not filters
    // For now, we'll store it in local state
    console.log('Sort changed to:', sortBy);
  }, []);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    // Update search options would go here in a real implementation
  }, [sortOrder]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Primary search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search properties by location, type, or features..."
                value={filters.query || ''}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10 h-12 text-lg"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" />
              )}
            </div>

            {/* Quick filters row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  placeholder="Location"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select 
                value={Array.isArray(filters.propertyType) ? filters.propertyType[0] || '' : filters.propertyType || ''} 
                onValueChange={(value) => handleFilterChange('propertyType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentPriceRange} onValueChange={handlePriceRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value="relevance" onValueChange={handleSortChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortOrder}
                  title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Sliders className="h-4 w-4" />
                  Advanced Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>

              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
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
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium mb-2">Bedrooms</label>
                <Select 
                  value={filters.bedrooms?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('bedrooms', value ? parseInt(value, 10) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+ bedroom{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium mb-2">Bathrooms</label>
                <Select 
                  value={filters.bathrooms?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('bathrooms', value ? parseInt(value, 10) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+ bathroom{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parking */}
              <div>
                <label className="block text-sm font-medium mb-2">Parking Spaces</label>
                <Select 
                  value={filters.parkingSpaces?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('parkingSpaces', value ? parseInt(value, 10) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[0, 1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? 'No parking' : `${num}+ space${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Furnished */}
              <div>
                <label className="block text-sm font-medium mb-2">Furnished</label>
                <Select 
                  value={filters.furnished === undefined ? '' : filters.furnished.toString()} 
                  onValueChange={(value) => handleFilterChange('furnished', value === '' ? undefined : value === 'true')}
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

              {/* Pet Friendly */}
              <div>
                <label className="block text-sm font-medium mb-2">Pet Friendly</label>
                <Select 
                  value={filters.petFriendly === undefined ? '' : filters.petFriendly.toString()} 
                  onValueChange={(value) => handleFilterChange('petFriendly', value === '' ? undefined : value === 'true')}
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

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Verification</label>
                <Select 
                  value={filters.verified === undefined ? '' : filters.verified.toString()} 
                  onValueChange={(value) => handleFilterChange('verified', value === '' ? undefined : value === 'true')}
                >
                  <SelectTrigger>
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
          <span>
            {searchResults.total} properties found
            {searchResults.searchTime && ` in ${searchResults.searchTime}ms`}
          </span>
          {searchResults.hasMore && (
            <span>Showing {searchResults.items?.length} of {searchResults.total}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default ConsolidatedSearch;