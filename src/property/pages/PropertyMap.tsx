import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Map, 
  MapPin, 
  Search, 
  Filter, 
  Home, 
  DollarSign,
  Bed,
  Bath,
  Square,
  Star,
  Navigation,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';

import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Slider } from '../../shared/components/ui/slider';
import { useToast } from '../../shared/hooks/use-toast';
import { formatPrice } from '../../shared/utils/formatters';

interface PropertyMarker {
  id: string;
  title: string;
  price: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  verified: boolean;
  status: 'available' | 'under-offer' | 'sold' | 'rented';
}

interface MapFilters {
  priceRange: [number, number];
  propertyType: string;
  bedrooms: string;
  verifiedOnly: boolean;
  searchRadius: number; // in km
}

// Mock property data with Nairobi coordinates
const mockProperties: PropertyMarker[] = [
  {
    id: '1',
    title: 'Modern 3BR Apartment in Westlands',
    price: 15000000,
    propertyType: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    coordinates: { lat: -1.2676, lng: 36.8108 }, // Westlands
    images: ['/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg'],
    verified: true,
    status: 'available'
  },
  {
    id: '2',
    title: 'Luxury Villa in Karen',
    price: 45000000,
    propertyType: 'villa',
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    coordinates: { lat: -1.3197, lng: 36.6859 }, // Karen
    images: ['/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg'],
    verified: true,
    status: 'available'
  },
  {
    id: '3',
    title: 'Townhouse in Lavington',
    price: 25000000,
    propertyType: 'townhouse',
    bedrooms: 4,
    bathrooms: 3,
    area: 2200,
    coordinates: { lat: -1.2833, lng: 36.7833 }, // Lavington
    images: ['/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg'],
    verified: false,
    status: 'available'
  },
  {
    id: '4',
    title: 'Penthouse in Kilimani',
    price: 35000000,
    propertyType: 'apartment',
    bedrooms: 4,
    bathrooms: 3,
    area: 2800,
    coordinates: { lat: -1.2921, lng: 36.7833 }, // Kilimani
    images: ['/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg'],
    verified: true,
    status: 'under-offer'
  },
  {
    id: '5',
    title: 'Family Home in Runda',
    price: 55000000,
    propertyType: 'house',
    bedrooms: 6,
    bathrooms: 5,
    area: 4200,
    coordinates: { lat: -1.2167, lng: 36.7833 }, // Runda
    images: ['/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg'],
    verified: true,
    status: 'available'
  }
];

const defaultFilters: MapFilters = {
  priceRange: [0, 100000000],
  propertyType: 'all',
  bedrooms: 'any',
  verifiedOnly: false,
  searchRadius: 10
};

// Simple map component (in a real app, you'd use Google Maps, Mapbox, etc.)
const MapComponent: React.FC<{
  properties: PropertyMarker[];
  selectedProperty: PropertyMarker | null;
  onPropertySelect: (property: PropertyMarker | null) => void;
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ properties, selectedProperty, onPropertySelect, center, zoom }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
        `
      }}
    >
      {/* Map Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#000" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Property Markers */}
      {properties.map((property) => {
        // Convert lat/lng to pixel positions (simplified)
        const x = ((property.coordinates.lng - center.lng + 0.1) / 0.2) * 100;
        const y = ((center.lat - property.coordinates.lat + 0.1) / 0.2) * 100;
        
        const isSelected = selectedProperty?.id === property.id;
        const isAvailable = property.status === 'available';
        
        return (
          <div
            key={property.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
              isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
            }`}
            style={{
              left: `${Math.max(5, Math.min(95, x))}%`,
              top: `${Math.max(5, Math.min(95, y))}%`
            }}
            onClick={() => onPropertySelect(isSelected ? null : property)}
          >
            {/* Price Badge */}
            <div className={`
              px-2 py-1 rounded-full text-xs font-semibold mb-1 shadow-lg
              ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-800'}
              ${!isAvailable ? 'opacity-60' : ''}
            `}>
              {formatPrice(property.price)}
            </div>
            
            {/* Map Pin */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2
              ${isSelected ? 'bg-primary border-primary-foreground' : 
                property.verified ? 'bg-green-500 border-white' : 'bg-gray-500 border-white'}
              ${!isAvailable ? 'opacity-60' : ''}
            `}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            
            {/* Verification Badge */}
            {property.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Star className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        );
      })}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
          <Navigation className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
          <Layers className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Center Marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default function PropertyMap() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<MapFilters>(defaultFilters);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null);
  const [searchLocation, setSearchLocation] = useState('Nairobi, Kenya');
  const [mapCenter, setMapCenter] = useState({ lat: -1.2921, lng: 36.8219 }); // Nairobi center
  const [mapZoom, setMapZoom] = useState(12);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return mockProperties.filter(property => {
      // Price range filter
      if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) {
        return false;
      }

      // Property type filter
      if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms !== 'any') {
        const minBedrooms = parseInt(filters.bedrooms);
        if (!property.bedrooms || property.bedrooms < minBedrooms) {
          return false;
        }
      }

      // Verified only filter
      if (filters.verifiedOnly && !property.verified) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof MapFilters>(
    key: K,
    value: MapFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleLocationSearch = useCallback(() => {
    // In a real app, this would geocode the location
    toast({
      title: 'Location search',
      description: `Searching for properties near "${searchLocation}"`,
    });
  }, [searchLocation, toast]);

  const handlePropertySelect = useCallback((property: PropertyMarker | null) => {
    setSelectedProperty(property);
    if (property) {
      setMapCenter(property.coordinates);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedProperty(null);
  }, []);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-background`}>
      <div className="container mx-auto px-4 py-8 h-full">
        {!isFullscreen && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Map className="w-8 h-8" />
              Property Map
            </h1>
            <p className="text-muted-foreground">
              Explore properties on an interactive map
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
              {/* Location Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter location..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                    <Button onClick={handleLocationSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Search Radius: {filters.searchRadius}km
                    </label>
                    <Slider
                      value={[filters.searchRadius]}
                      onValueChange={(value) => updateFilter('searchRadius', value[0])}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Price Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
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

              {/* Property Type Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => updateFilter('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Bedrooms Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bedrooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(value) => updateFilter('bedrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+ Bedrooms</SelectItem>
                      <SelectItem value="2">2+ Bedrooms</SelectItem>
                      <SelectItem value="3">3+ Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
                      <SelectItem value="5">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Verification Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="verified-only"
                      checked={filters.verifiedOnly}
                      onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="verified-only" className="text-sm">
                      Show only verified properties
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Results Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {filteredProperties.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Properties found
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reset Filters */}
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          )}

          {/* Map */}
          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'} relative`}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Property Locations
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <MapComponent
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  onPropertySelect={handlePropertySelect}
                  center={mapCenter}
                  zoom={mapZoom}
                />
              </CardContent>
            </Card>

            {/* Property Details Popup */}
            {selectedProperty && (
              <div className="absolute bottom-4 left-4 right-4 z-30">
                <Card className="shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={selectedProperty.images[0]}
                        alt={selectedProperty.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {selectedProperty.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProperty(null)}
                          >
                            ×
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          {selectedProperty.bedrooms && (
                            <div className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              <span>{selectedProperty.bedrooms}</span>
                            </div>
                          )}
                          {selectedProperty.bathrooms && (
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4" />
                              <span>{selectedProperty.bathrooms}</span>
                            </div>
                          )}
                          {selectedProperty.area && (
                            <div className="flex items-center gap-1">
                              <Square className="w-4 h-4" />
                              <span>{selectedProperty.area} sqm</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-primary">
                            {formatPrice(selectedProperty.price)}
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProperty.verified && (
                              <Badge className="bg-green-100 text-green-800">
                                Verified
                              </Badge>
                            )}
                            <Badge variant="outline" className="capitalize">
                              {selectedProperty.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1"
                        onClick={() => window.open(`/property/${selectedProperty.id}`, '_blank')}
                      >
                        View Details
                      </Button>
                      <Button variant="outline">
                        Contact Owner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}