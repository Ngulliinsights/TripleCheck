import { 
  Search, 
  MapPin, 
  Home, 
  Building, 
  Landmark,
  DollarSign,
  Calendar,
  Shield,
  Filter,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';

interface SearchFilters {
  query: string;
  location: string;
  country: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  verificationStatus: string;
  dateRange: string;
  features: string[];
}

export default function AdvancedSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    country: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    verificationStatus: '',
    dateRange: '',
    features: []
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const propertyTypes = [
    { value: 'residential', label: 'Residential', icon: Home },
    { value: 'commercial', label: 'Commercial', icon: Building },
    { value: 'land', label: 'Land', icon: Landmark }
  ];

  const countries = [
    { value: 'kenya', label: 'Kenya' },
    { value: 'nigeria', label: 'Nigeria' },
    { value: 'south-africa', label: 'South Africa' },
    { value: 'ghana', label: 'Ghana' },
    { value: 'uganda', label: 'Uganda' }
  ];

  const verificationStatuses = [
    { value: 'verified', label: 'Verified', color: 'bg-green-500' },
    { value: 'pending', label: 'Pending Verification', color: 'bg-yellow-500' },
    { value: 'unverified', label: 'Not Verified', color: 'bg-gray-500' }
  ];

  const availableFeatures = [
    'Swimming Pool', 'Parking', 'Security', 'Garden', 'Balcony', 
    'Air Conditioning', 'Furnished', 'Pet Friendly', 'Gym', 'Elevator'
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (key === 'features' && Array.isArray(value)) {
          value.forEach(feature => searchParams.append('features', feature));
        } else {
          searchParams.set(key, value as string);
        }
      }
    });

    navigate(`/search?${searchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      location: '',
      country: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      verificationStatus: '',
      dateRange: '',
      features: []
    });
    setActiveFilters([]);
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'features') {
        return count + (value as string[]).length;
      }
      return count + (value ? 1 : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Search className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Advanced Property Search
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Find your perfect property with our comprehensive search filters and AI-powered recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary">
                      {getActiveFilterCount()} active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Search */}
                <div>
                  <Label htmlFor="query">Search Query</Label>
                  <Input
                    id="query"
                    placeholder="Property name, ID, or keywords..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, neighborhood, or area..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Country */}
                <div>
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={filters.country}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <Label>Property Type</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {propertyTypes.map(type => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => handleFilterChange('propertyType', 
                            filters.propertyType === type.value ? '' : type.value
                          )}
                          className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                            filters.propertyType === type.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-input'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <Label>Price Range (KES)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Min price"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                    <Input
                      placeholder="Max price"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <select
                      id="bedrooms"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={filters.bedrooms}
                      onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num.toString()}>{num}+</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <select
                      id="bathrooms"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={filters.bathrooms}
                      onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num.toString()}>{num}+</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <Label>Verification Status</Label>
                  <div className="space-y-2 mt-2">
                    {verificationStatuses.map(status => (
                      <button
                        key={status.value}
                        onClick={() => handleFilterChange('verificationStatus',
                          filters.verificationStatus === status.value ? '' : status.value
                        )}
                        className={`flex items-center gap-2 w-full p-2 rounded-md border transition-colors ${
                          filters.verificationStatus === status.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-input'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFeatures.map(feature => (
                      <button
                        key={feature}
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          filters.features.includes(feature)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-input'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Search Properties
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters} 
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Results Preview */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Search Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Search</h3>
                  <p className="text-muted-foreground mb-6">
                    Configure your filters and click "Search Properties" to find your perfect match.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified Properties
                    </Badge>
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      54 African Countries
                    </Badge>
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Transparent Pricing
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}