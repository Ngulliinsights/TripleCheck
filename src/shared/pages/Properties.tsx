import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  Building, 
  TreePine, 
  Bed, 
  Bath, 
  Square, 
  Shield,
  Star,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { Property } from '../types/property';
import ListingCard from '../../property/components/ListingCard';
import { Skeleton } from '../components/ui/skeleton';

// Enhanced type definitions for better type safety
interface PropertyCategory {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<any>;
  readonly href: string;
  readonly count: string;
  readonly color: string;
  readonly bgColor: string;
}

interface PriceRange {
  readonly label: string;
  readonly min: number;
  readonly max: number | null;
}

interface SearchFilters {
  query: string;
  location: string;
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  verified: boolean;
}

// Improved constant definitions with proper typing
const PROPERTY_CATEGORIES: readonly PropertyCategory[] = [
  {
    id: 'all',
    title: 'All Properties',
    description: 'Browse all verified properties',
    icon: Home,
    href: '/properties',
    count: '2,500+',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'residential',
    title: 'Residential',
    description: 'Houses, apartments, and condos',
    icon: Home,
    href: '/properties/residential',
    count: '1,800+',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Office spaces and retail properties',
    icon: Building,
    href: '/properties/commercial',
    count: '450+',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'land',
    title: 'Land',
    description: 'Verified land with comprehensive verification',
    icon: TreePine,
    href: '/properties/land',
    count: '250+',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
] as const;

const POPULAR_LOCATIONS: readonly string[] = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'
] as const;

const PRICE_RANGES: readonly PriceRange[] = [
  { label: 'Under KSh 5M', min: 0, max: 5000000 },
  { label: 'KSh 5M - 10M', min: 5000000, max: 10000000 },
  { label: 'KSh 10M - 20M', min: 10000000, max: 20000000 },
  { label: 'KSh 20M - 50M', min: 20000000, max: 50000000 },
  { label: 'Above KSh 50M', min: 50000000, max: null }
] as const;

// Debounce hook for search optimization
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Enhanced mock API function with better error handling
const fetchProperties = async (filters: SearchFilters): Promise<Property[]> => {
  try {
    // Simulate realistic API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Mock data with more comprehensive property information
    const mockProperties: Property[] = [
      {
        id: '1',
        title: 'Modern 3-Bedroom Apartment in Westlands',
        description: 'Beautiful modern apartment with stunning city views and premium amenities',
        location: 'Westlands, Nairobi',
        price: 15000000,
        images: ['/placeholder-property.jpg'],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Elevator'],
          propertyType: 'Apartment',
          petFriendly: false,
          furnished: true
        },
        status: 'verified'
      },
      {
        id: '2',
        title: 'Luxury Villa in Karen',
        description: 'Spacious family home with beautiful gardens and modern fixtures',
        location: 'Karen, Nairobi',
        price: 45000000,
        images: ['/placeholder-property-2.jpg'],
        features: {
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 3500,
          parkingSpaces: 3,
          yearBuilt: 2018,
          amenities: ['Swimming Pool', 'Garden', 'Staff Quarters', 'Generator'],
          propertyType: 'House',
          petFriendly: true,
          furnished: false
        },
        status: 'verified'
      }
    ];
    
    // Apply filters to mock data for demonstration
    let filteredProperties = mockProperties;
    
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredProperties = filteredProperties.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }
    
    if (filters.location) {
      filteredProperties = filteredProperties.filter(property =>
        property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.propertyType) {
      filteredProperties = filteredProperties.filter(property =>
        property.features?.propertyType?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }
    
    if (filters.bedrooms) {
      filteredProperties = filteredProperties.filter(property =>
        property.features?.bedrooms && property.features.bedrooms >= filters.bedrooms!
      );
    }
    
    if (filters.bathrooms) {
      filteredProperties = filteredProperties.filter(property =>
        property.features?.bathrooms && property.features.bathrooms >= filters.bathrooms!
      );
    }
    
    if (filters.verified) {
      filteredProperties = filteredProperties.filter(property =>
        property.status === 'verified'
      );
    }
    
    return filteredProperties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw new Error('Failed to fetch properties. Please try again later.');
  }
};

// Main component with optimizations
export default function Properties(): JSX.Element {
  // State management with proper typing
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    propertyType: '',
    priceMin: null,
    priceMax: null,
    bedrooms: null,
    bathrooms: null,
    verified: false
  });
  
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Debounce search query to reduce API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Memoize the property query to prevent unnecessary re-renders
  const { data: properties, isLoading, error, refetch } = useQuery({
    queryKey: ['properties', debouncedFilters],
    queryFn: () => fetchProperties(debouncedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Optimized event handlers with useCallback to prevent unnecessary re-renders
  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Force immediate search by bypassing debounce
    refetch();
  }, [refetch]);

  const handleFilterChange = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      location: '',
      propertyType: '',
      priceMin: null,
      priceMax: null,
      bedrooms: null,
      bathrooms: null,
      verified: false
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Memoize category navigation handler
  const handleCategoryClick = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  // Memoize loading skeleton count
  const skeletonItems = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({ id: i })), []
  );

  // Memoize property count display
  const propertyCountText = useMemo(() => {
    if (isLoading) return 'Loading...';
    const count = properties?.length || 0;
    return `${count} ${count === 1 ? 'property' : 'properties'}`;
  }, [isLoading, properties?.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect
              <span className="text-blue-600"> Verified Property</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse thousands of verified properties across Kenya. Every listing is authenticated 
              and fraud-checked for your peace of mind.
            </p>
          </div>

          {/* Enhanced Search Bar with better accessibility */}
          <div className="max-w-4xl mx-auto">
            <Card className="p-6">
              <form onSubmit={handleSearch} className="space-y-4" role="search">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      className="pl-10"
                      aria-label="Search properties"
                    />
                  </div>
                  <div className="relative">
                    <MapPin 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
                      aria-hidden="true"
                    />
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Select location"
                    >
                      <option value="">All Locations</option>
                      {POPULAR_LOCATIONS.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      <Search className="w-4 h-4 mr-2" />
                      {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={toggleFilters}
                      aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                      aria-expanded={showFilters}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Advanced Filters with better accessibility */}
                {showFilters && (
                  <div className="border-t pt-4 mt-4" role="region" aria-label="Advanced filters">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select
                        value={filters.propertyType}
                        onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Property type"
                      >
                        <option value="">Property Type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="commercial">Commercial</option>
                        <option value="land">Land</option>
                      </select>
                      
                      <select
                        value={filters.bedrooms?.toString() || ''}
                        onChange={(e) => handleFilterChange('bedrooms', e.target.value ? parseInt(e.target.value, 10) : null)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Minimum bedrooms"
                      >
                        <option value="">Bedrooms</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>
                      
                      <select
                        value={filters.bathrooms?.toString() || ''}
                        onChange={(e) => handleFilterChange('bathrooms', e.target.value ? parseInt(e.target.value, 10) : null)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Minimum bathrooms"
                      >
                        <option value="">Bathrooms</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="verified-filter"
                          checked={filters.verified}
                          onChange={(e) => handleFilterChange('verified', e.target.checked)}
                          className="mr-2 rounded focus:ring-2 focus:ring-blue-500"
                          aria-describedby="verified-filter-description"
                        />
                        <label htmlFor="verified-filter" className="text-sm">
                          Verified Only
                        </label>
                        <span id="verified-filter-description" className="sr-only">
                          Show only verified properties
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600" aria-live="polite">
                        {propertyCountText}
                      </div>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Property Categories with improved interaction */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect property type for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROPERTY_CATEGORIES.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => handleCategoryClick(category.href)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category.href);
                  }
                }}
                aria-label={`Browse ${category.title} - ${category.description}`}
              >
                <CardHeader className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${category.bgColor} mx-auto mb-4`}>
                    <category.icon className={`w-8 h-8 ${category.color}`} aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <p className="text-gray-600">{category.description}</p>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {category.count}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Browse {category.title}
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Listings with enhanced error handling */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600" aria-live="polite">
                {propertyCountText}
              </span>
            </div>
          </div>

          {/* Improved Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Loading properties">
              {skeletonItems.map((item) => (
                <div key={item.id} className="space-y-4 animate-pulse">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading properties...</span>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className="text-center py-12" role="alert">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Properties</h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ? error.message : 'There was an error loading the properties. Please try again.'}
                </p>
                <Button onClick={() => refetch()} disabled={isLoading}>
                  {isLoading ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            </div>
          )}

          {/* Properties Grid with better empty state */}
          {!isLoading && !error && properties && (
            <>
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <ListingCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                    <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
                    <h3 className="text-xl font-medium mb-2">No Properties Found</h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search criteria or browse all properties.
                    </p>
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section with improved accessibility */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Let us help you find the perfect property or list your own with our verification services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/list-property'}
            >
              List Your Property
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Agent
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}