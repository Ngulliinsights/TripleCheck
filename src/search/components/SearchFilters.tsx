import { useQuery } from '@tanstack/react-query';
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
  Sliders
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Checkbox } from '../../shared/components/ui/checkbox';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Separator } from '../../shared/components/ui/separator';
import { Slider } from '../../shared/components/ui/slider';


interface SearchFilters {
  query: string;
  location: string;
  propertyType: string[];
  priceRange: [number, number];
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: [number, number];
  yearBuilt: [number, number];
  amenities: string[];
  verificationStatus: string[];
  trustScore: number;
  furnished: boolean | null;
  petFriendly: boolean | null;
  parkingSpaces: number | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  initialFilters?: Partial<SearchFilters>;
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  location: '',
  propertyType: [],
  priceRange: [0, 10000000], // KES 0 - 10M
  bedrooms: null,
  bathrooms: null,
  squareFeet: [0, 10000],
  yearBuilt: [1950, new Date().getFullYear()],
  amenities: [],
  verificationStatus: [],
  trustScore: 0,
  furnished: null,
  petFriendly: null,
  parkingSpaces: null,
  sortBy: 'relevance',
  sortOrder: 'desc'
};

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Home },
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condo', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Home },
  { value: 'studio', label: 'Studio', icon: Home }
];

const AMENITIES = [
  'Swimming Pool', 'Gym', 'Security', 'Parking', 'Garden', 
  'Balcony', 'Elevator', 'Generator', 'Water Tank', 'CCTV',
  'Playground', 'Clubhouse', 'Laundry', 'Internet', 'Air Conditioning'
];

const LOCATIONS = [
  'Nairobi CBD', 'Westlands', 'Karen', 'Kilimani', 'Lavington',
  'Runda', 'Kileleshwa', 'Parklands', 'Kasarani', 'Embakasi',
  'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Thika'
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price', label: 'Price' },
  { value: 'date', label: 'Date Listed' },
  { value: 'size', label: 'Size' },
  { value: 'trust_score', label: 'Trust Score' }
];

export function AdvancedSearch({ 
  onSearch, 
  onReset, 
  initialFilters = {}, 
  isLoading = false,
  className = '' 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Get saved searches for quick access
  const { data: savedSearches } = useQuery({
    queryKey: ['/api/searches/saved'],
    queryFn: async () => {
      // Mock data for now
      return [
        { id: 1, name: 'Westlands Apartments', filters: { location: 'Westlands', propertyType: ['apartment'] } },
        { id: 2, name: 'Family Homes Karen', filters: { location: 'Karen', bedrooms: 3, propertyType: ['house'] } }
      ];
    }
  });

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: string
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    onReset();
  }, [onReset]);

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.bedrooms !== null) count++;
    if (filters.bathrooms !== null) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.verificationStatus.length > 0) count++;
    if (filters.furnished !== null) count++;
    if (filters.petFriendly !== null) count++;
    return count;
  }, [filters]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
            {appliedFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {appliedFiltersCount} filters
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Sliders className="h-4 w-4 mr-2" />
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
            {appliedFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Property title, description..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {LOCATIONS.map(location => (
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
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
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
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <>
            <Separator />

            {/* Property Type */}
            <div className="space-y-3">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant={filters.propertyType.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('propertyType', type.value)}
                    className="flex items-center gap-2"
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label>Price Range (KES)</Label>
              <div className="px-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
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

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Select 
                  value={filters.bedrooms?.toString() || ''} 
                  onValueChange={(value) => updateFilter('bedrooms', value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? 'Studio' : `${num}+ bed${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Select 
                  value={filters.bathrooms?.toString() || ''} 
                  onValueChange={(value) => updateFilter('bathrooms', value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+ bath{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parking</Label>
                <Select 
                  value={filters.parkingSpaces?.toString() || ''} 
                  onValueChange={(value) => updateFilter('parkingSpaces', value ? parseInt(value) : null)}
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
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {AMENITIES.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={filters.amenities.includes(amenity)}
                      onCheckedChange={() => toggleArrayFilter('amenities', amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
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
                  value={filters.furnished === null ? '' : filters.furnished.toString()} 
                  onValueChange={(value) => updateFilter('furnished', value === '' ? null : value === 'true')}
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
                  value={filters.petFriendly === null ? '' : filters.petFriendly.toString()} 
                  onValueChange={(value) => updateFilter('petFriendly', value === '' ? null : value === 'true')}
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
                  {['verified', 'pending'].map(status => (
                    <Button
                      key={status}
                      variant={filters.verificationStatus.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter('verificationStatus', status)}
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      {status === 'verified' ? 'Verified' : 'Pending'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {savedSearches && savedSearches.length > 0 && (
              <Select onValueChange={(value) => {
                const saved = savedSearches.find(s => s.id.toString() === value);
                if (saved) {
                  setFilters({ ...DEFAULT_FILTERS, ...saved.filters });
                }
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Saved searches" />
                </SelectTrigger>
                <SelectContent>
                  {savedSearches.map(search => (
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

export default AdvancedSearch;