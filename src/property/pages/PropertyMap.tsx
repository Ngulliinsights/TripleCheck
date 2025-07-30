import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { 
  Map, 
  Search, 
  Filter,
  MapPin,
  Home,
  Building,
  TreePine,
  Layers,
  Maximize,
  Navigation
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  type: 'residential' | 'commercial' | 'land';
  coordinates: { lat: number; lng: number };
  verified: boolean;
  images: string[];
}

interface MapFilters {
  propertyType: string;
  priceRange: { min: number; max: number };
  verified: boolean;
  searchQuery: string;
}

export default function PropertyMap() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapView, setMapView] = useState<'satellite' | 'roadmap' | 'hybrid'>('roadmap');
  const [filters, setFilters] = useState<MapFilters>({
    propertyType: 'all',
    priceRange: { min: 0, max: 100000000 },
    verified: false,
    searchQuery: ''
  });

  // Mock property data with coordinates
  const properties: Property[] = useMemo(() => [
    {
      id: '1',
      title: 'Modern Apartment in Westlands',
      price: 15000000,
      location: 'Westlands, Nairobi',
      type: 'residential',
      coordinates: { lat: -1.2676, lng: 36.8108 },
      verified: true,
      images: ['/assets/property1.jpg']
    },
    {
      id: '2',
      title: 'Commercial Office Space',
      price: 25000000,
      location: 'Upper Hill, Nairobi',
      type: 'commercial',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      verified: true,
      images: ['/assets/property2.jpg']
    },
    {
      id: '3',
      title: '5-Acre Land in Kiambu',
      price: 12000000,
      location: 'Kiambu County',
      type: 'land',
      coordinates: { lat: -1.1748, lng: 36.8356 },
      verified: false,
      images: ['/assets/property3.jpg']
    }
  ], []);

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesType = filters.propertyType === 'all' || property.type === filters.propertyType;
      const matchesPrice = property.price >= filters.priceRange.min && property.price <= filters.priceRange.max;
      const matchesVerified = !filters.verified || property.verified;
      const matchesSearch = !filters.searchQuery || 
        property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      return matchesType && matchesPrice && matchesVerified && matchesSearch;
    });
  }, [properties, filters]);

  const handlePropertyClick = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  const handleFilterChange = useCallback((key: keyof MapFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const propertyTypeIcons = {
    residential: Home,
    commercial: Building,
    land: TreePine
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Map className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Interactive Property Map
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Explore properties on an interactive map with advanced filtering and location-based insights.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search properties..."
                      value={filters.searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Types</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range (KSH)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min || ''}
                      onChange={(e) => handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        min: Number(e.target.value) || 0
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max === 100000000 ? '' : filters.priceRange.max}
                      onChange={(e) => handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        max: Number(e.target.value) || 100000000
                      })}
                    />
                  </div>
                </div>

                {/* Verified Only */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="verified" className="text-sm font-medium">
                    Verified properties only
                  </label>
                </div>

                {/* Results Count */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {filteredProperties.length} properties found
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Map Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Map View
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['roadmap', 'satellite', 'hybrid'].map((view) => (
                  <Button
                    key={view}
                    variant={mapView === view ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setMapView(view as any)}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Property Locations</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Navigation className="w-4 h-4 mr-2" />
                    My Location
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                {/* Map Placeholder */}
                <div className="h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="text-center z-10">
                    <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Interactive map will be displayed here</p>
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredProperties.length} properties in Nairobi area
                    </p>
                  </div>
                  
                  {/* Mock Property Markers */}
                  <div className="absolute inset-0">
                    {filteredProperties.map((property, index) => {
                      const IconComponent = propertyTypeIcons[property.type];
                      return (
                        <div
                          key={property.id}
                          className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                            selectedProperty?.id === property.id ? 'z-20' : 'z-10'
                          }`}
                          style={{
                            left: `${20 + index * 25}%`,
                            top: `${30 + index * 15}%`
                          }}
                          onClick={() => handlePropertyClick(property)}
                        >
                          <div className={`p-2 rounded-full shadow-lg transition-all ${
                            selectedProperty?.id === property.id 
                              ? 'bg-primary text-primary-foreground scale-125' 
                              : 'bg-background border-2 border-primary text-primary hover:scale-110'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          {selectedProperty?.id === property.id && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-background border rounded-lg shadow-lg p-4 z-30">
                              <h4 className="font-semibold mb-2">{property.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-primary">
                                  KSH {property.price.toLocaleString()}
                                </span>
                                {property.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <Button size="sm" className="w-full mt-3">
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Property List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Properties on Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
                const IconComponent = propertyTypeIcons[property.type];
                return (
                  <div
                    key={property.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedProperty?.id === property.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground capitalize">{property.type}</span>
                      </div>
                      {property.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mb-2">{property.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      {property.location}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      KSH {property.price.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}