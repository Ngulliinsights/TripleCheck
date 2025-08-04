import { Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';


import { CompareBar } from '../../property/components/CompareBar';
import { CompareModal } from '../../property/components/CompareModal';
import ListingCard from '../../property/components/ListingCard';
import { CompareProvider } from '../../property/contexts/CompareContext';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Property } from '../../shared/types/property';
import PropertySearch from '../components/PropertySearch';

// Enhanced type definitions for better TypeScript safety
interface SearchFilters {
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  propertyType: string;
  location: string;
}

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'relevance';

interface SortConfig {
  readonly label: string;
  readonly value: SortOption;
}

interface FilterOption {
  readonly label: string;
  readonly value: string;
}

interface FilterInputProps {
  label: string;
  type?: 'text' | 'number' | 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: readonly FilterOption[];
}

// Constants moved outside component to prevent recreation on each render
const SORT_OPTIONS: readonly SortConfig[] = [
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Most Relevant', value: 'relevance' }
] as const;

const BEDROOM_OPTIONS: readonly FilterOption[] = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' }
] as const;

const PROPERTY_TYPE_OPTIONS: readonly FilterOption[] = [
  { label: 'Any', value: '' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' }
] as const;

// Initial filter state - extracted for reusability
const INITIAL_FILTERS: SearchFilters = {
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  propertyType: '',
  location: ''
} as const;

// Mock data with enhanced TypeScript compliance
const mockProperties: readonly Property[] = [
  {
    id: 1,
    title: 'Modern 3-Bedroom Apartment in Westlands',
    description: 'Beautiful modern apartment with city views and premium amenities',
    location: 'Westlands, Nairobi',
    price: '150000',
    images: ['/assets/apartment-luxury-1.jpg', '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg'],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ['Swimming Pool', 'Gym', '24/7 Security'],
      propertyType: 'Apartment',
      petFriendly: true,
      furnished: false
    },
    status: 'verified'
  },
  {
    id: 2,
    title: 'Spacious Family Home in Karen',
    description: 'Perfect family home with large garden and quiet neighborhood setting',
    location: 'Karen, Nairobi',
    price: '280000',
    images: ['/assets/house-executive-1.jpg', '/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg'],
    features: {
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2500,
      parkingSpaces: 3,
      yearBuilt: 2018,
      amenities: ['Private Garden', 'Gated Community', 'Covered Parking'],
      propertyType: 'House',
      petFriendly: true,
      furnished: false
    },
    status: 'verified'
  }
] as const;

// Helper function to safely parse location string
const getLocationString = (location: Property['location']): string => {
  return typeof location === 'string' ? location : location.address || '';
};

// Helper function to safely convert price to number for comparison
const getPriceAsNumber = (price: Property['price']): number => {
  return parseInt(String(price), 10) || 0;
};

// Enhanced filter input component extracted for better reusability and type safety
const FilterInput: React.FC<FilterInputProps> = React.memo(({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  options 
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-label={label}
        title={label}
      >
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder={placeholder}
        aria-label={label}
      />
    )}
  </div>
));

// Set display name for better debugging experience
FilterInput.displayName = 'FilterInput';

export default function SearchResults(): JSX.Element {
  // State management with proper TypeScript typing
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Optimized event handlers using useCallback to prevent unnecessary re-renders
  const handleSearch = useCallback((query: string): void => {
    setSearchQuery(query);
    // In a real application, this would trigger an API call with debouncing
    // Example: debouncedSearchAPI(query, filters)
  }, []);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleClearFilters = useCallback((): void => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleShowCompareModal = useCallback((): void => {
    setShowCompareModal(true);
  }, []);

  const handleCloseCompareModal = useCallback((): void => {
    setShowCompareModal(false);
  }, []);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSortBy(event.target.value as SortOption);
  }, []);

  const toggleFilters = useCallback((): void => {
    setShowFilters(prev => !prev);
  }, []);

  // Memoized check for active filters to improve performance
  const hasActiveFilters = useMemo((): boolean => {
    return Object.values(filters).some(value => value !== '');
  }, [filters]);

  // Memoized filtered and sorted results to prevent unnecessary recalculations
  const processedProperties = useMemo((): Property[] => {
    let filtered = [...mockProperties]; // Create a shallow copy to avoid mutating the original array

    // Apply filters - in a real app, this would be handled by the backend
    if (filters.minPrice) {
      const minPrice = parseInt(filters.minPrice, 10);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(property => getPriceAsNumber(property.price) >= minPrice);
      }
    }

    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice, 10);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(property => getPriceAsNumber(property.price) <= maxPrice);
      }
    }

    if (filters.bedrooms) {
      const minBedrooms = parseInt(filters.bedrooms, 10);
      if (!isNaN(minBedrooms)) {
        filtered = filtered.filter(property => 
          property.features?.bedrooms !== undefined && property.features.bedrooms >= minBedrooms
        );
      }
    }

    if (filters.propertyType) {
      filtered = filtered.filter(property => 
        property.features?.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(property =>
        getLocationString(property.location).toLowerCase().includes(locationQuery)
      );
    }

    // Apply sorting with improved type safety and null checking
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return getPriceAsNumber(a.price) - getPriceAsNumber(b.price);
        case 'price-desc':
          return getPriceAsNumber(b.price) - getPriceAsNumber(a.price);
        case 'newest':
          return (b.features?.yearBuilt ?? 0) - (a.features?.yearBuilt ?? 0);
        case 'relevance':
        default:
          // In a real app, this would use a relevance score from the search API
          return 0;
      }
    });
  }, [filters, sortBy]);

  // Memoized results count to prevent unnecessary recalculations
  const resultCount = useMemo((): number => processedProperties.length, [processedProperties]);

  // Memoized search description for better UX
  const searchDescription = useMemo((): string => {
    const propertyText = resultCount === 1 ? 'property' : 'properties';
    const baseText = `${resultCount} ${propertyText} found`;
    
    if (searchQuery.trim()) {
      return `${baseText} for "${searchQuery}"`;
    }
    
    return baseText;
  }, [resultCount, searchQuery]);

  return (
    <CompareProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 navbar-offset pb-8">
          {/* Enhanced search header with better accessibility */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Search Properties</h1>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <PropertySearch 
                  onSearch={handleSearch}
                  placeholder="Search by location, property type, or features..."
                />
              </div>
              <Button
                variant="outline"
                onClick={toggleFilters}
                className="flex items-center transition-colors"
                aria-expanded={showFilters}
                aria-controls="filters-panel"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            </div>
          </header>

          {/* Enhanced filters panel with better organization */}
          {showFilters && (
            <Card className="mb-8" id="filters-panel">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Search Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <FilterInput
                    label="Min Price"
                    type="number"
                    value={filters.minPrice}
                    onChange={(value) => handleFilterChange('minPrice', value)}
                    placeholder="$0"
                  />
                  
                  <FilterInput
                    label="Max Price"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(value) => handleFilterChange('maxPrice', value)}
                    placeholder="No maximum"
                  />
                  
                  <FilterInput
                    label="Bedrooms"
                    type="select"
                    value={filters.bedrooms}
                    onChange={(value) => handleFilterChange('bedrooms', value)}
                    options={BEDROOM_OPTIONS}
                  />
                  
                  <FilterInput
                    label="Property Type"
                    type="select"
                    value={filters.propertyType}
                    onChange={(value) => handleFilterChange('propertyType', value)}
                    options={PROPERTY_TYPE_OPTIONS}
                  />
                  
                  <FilterInput
                    label="Location"
                    value={filters.location}
                    onChange={(value) => handleFilterChange('location', value)}
                    placeholder="Enter location"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-6">
                  <Button className="transition-colors">
                    Apply Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="transition-colors"
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced search results section */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Results list with improved header */}
            <main className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                  <p className="text-gray-600">{searchDescription}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-gray-600 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select 
                    id="sort-select"
                    value={sortBy}
                    onChange={handleSortChange}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    title="Sort search results by different criteria"
                    aria-label="Sort search results"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results grid with conditional rendering */}
              {resultCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {processedProperties.map((property) => (
                    <ListingCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-600 mb-4">No properties found matching your criteria.</p>
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced pagination with proper accessibility */}
              {resultCount > 0 && (
                <nav className="flex justify-center mt-8" aria-label="Search results pagination">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled aria-label="Previous page">
                      Previous
                    </Button>
                    <Button variant="outline" className="bg-blue-600 text-white" aria-current="page">
                      1
                    </Button>
                    <Button variant="outline" aria-label="Go to page 2">
                      2
                    </Button>
                    <Button variant="outline" aria-label="Go to page 3">
                      3
                    </Button>
                    <Button variant="outline" aria-label="Next page">
                      Next
                    </Button>
                  </div>
                </nav>
              )}
            </main>

            {/* Enhanced map sidebar */}
            <aside className="lg:w-96">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Map View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Interactive map will display here</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Showing {resultCount} properties
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        {/* Floating Compare Bar */}
        <CompareBar onQuickCompare={handleShowCompareModal} />

        {/* Compare Modal */}
        <CompareModal
          isOpen={showCompareModal}
          onClose={handleCloseCompareModal}
        />
      </div>
    </CompareProvider>
  );
}