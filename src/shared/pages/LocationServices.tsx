import React, { useState, useCallback, useMemo } from 'react'
import { 
  MapPin, 
  Navigation, 
  Search, 
  Filter,
  Layers,
  Route,
  Clock,
  Star,
  Car,
  Bus,
  Train,
  Plane,
  School,
  Hospital,
  ShoppingCart,
  Coffee,
  Fuel,
  Building,
  TreePine,
  Zap
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { useToast } from '../hooks/use-toast'

interface LocationData {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'shopping' | 'transport' | 'restaurant' | 'fuel' | 'bank' | 'park';
  address: string;
  distance: number; // in km
  rating: number;
  coordinates: { lat: number; lng: number };
  description: string;
  operatingHours?: string;
  contact?: string;
}

interface PropertyLocation {
  id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  neighborhood: string;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
}

// Mock data
const mockProperty: PropertyLocation = {
  id: 'prop-123',
  address: '123 Westlands Road, Nairobi',
  coordinates: { lat: -1.2676, lng: 36.8108 },
  neighborhood: 'Westlands',
  walkScore: 78,
  transitScore: 65,
  bikeScore: 45
};

const mockNearbyLocations: LocationData[] = [
  {
    id: 'loc-1',
    name: 'Westlands Primary School',
    type: 'school',
    address: 'Westlands Road, Nairobi',
    distance: 0.3,
    rating: 4.2,
    coordinates: { lat: -1.2680, lng: 36.8115 },
    description: 'Well-established primary school with good academic record',
    operatingHours: '7:00 AM - 5:00 PM',
    contact: '+254712345678'
  },
  {
    id: 'loc-2',
    name: 'Aga Khan Hospital',
    type: 'hospital',
    address: '3rd Parklands Avenue, Nairobi',
    distance: 1.2,
    rating: 4.6,
    coordinates: { lat: -1.2634, lng: 36.8089 },
    description: 'Leading private hospital with comprehensive medical services',
    operatingHours: '24/7',
    contact: '+254202740000'
  },
  {
    id: 'loc-3',
    name: 'Westgate Shopping Mall',
    type: 'shopping',
    address: 'Mwanzi Road, Nairobi',
    distance: 0.8,
    rating: 4.1,
    coordinates: { lat: -1.2658, lng: 36.8045 },
    description: 'Major shopping center with retail stores, restaurants, and cinema',
    operatingHours: '10:00 AM - 10:00 PM',
    contact: '+254203892000'
  },
  {
    id: 'loc-4',
    name: 'Westlands Matatu Stage',
    type: 'transport',
    address: 'Westlands Road, Nairobi',
    distance: 0.2,
    rating: 3.8,
    coordinates: { lat: -1.2670, lng: 36.8100 },
    description: 'Main public transport hub for the area',
    operatingHours: '5:00 AM - 11:00 PM'
  },
  {
    id: 'loc-5',
    name: 'Java House Westlands',
    type: 'restaurant',
    address: 'Westlands Road, Nairobi',
    distance: 0.4,
    rating: 4.3,
    coordinates: { lat: -1.2685, lng: 36.8120 },
    description: 'Popular coffee shop and restaurant chain',
    operatingHours: '6:30 AM - 10:00 PM',
    contact: '+254709677000'
  },
  {
    id: 'loc-6',
    name: 'Shell Petrol Station',
    type: 'fuel',
    address: 'Waiyaki Way, Nairobi',
    distance: 0.6,
    rating: 4.0,
    coordinates: { lat: -1.2695, lng: 36.8095 },
    description: 'Full-service petrol station with convenience store',
    operatingHours: '24/7'
  }
];

const locationIcons = {
  school: School,
  hospital: Hospital,
  shopping: ShoppingCart,
  transport: Bus,
  restaurant: Coffee,
  fuel: Fuel,
  bank: Building,
  park: TreePine
};

const transportModes = [
  { id: 'walking', label: 'Walking', icon: '🚶', time: '5-15 min' },
  { id: 'driving', label: 'Driving', icon: '🚗', time: '2-8 min' },
  { id: 'transit', label: 'Public Transit', icon: '🚌', time: '10-25 min' },
  { id: 'cycling', label: 'Cycling', icon: '🚴', time: '3-12 min' }
];

export default function LocationServices() {
  const { toast } = useToast();
  const [property] = useState<PropertyLocation>(mockProperty);
  const [nearbyLocations] = useState<LocationData[]>(mockNearbyLocations);
  const [searchRadius, setSearchRadius] = useState([2]); // km
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('walking');
  const [showDirections, setShowDirections] = useState<string | null>(null);

  const filteredLocations = useMemo(() => {
    return nearbyLocations.filter(location => {
      const matchesRadius = location.distance <= searchRadius[0];
      const matchesType = selectedTypes.includes('all') || selectedTypes.includes(location.type);
      const matchesSearch = !searchQuery || 
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesRadius && matchesType && matchesSearch;
    });
  }, [nearbyLocations, searchRadius, selectedTypes, searchQuery]);

  const handleTypeFilter = useCallback((type: string) => {
    setSelectedTypes(prev => {
      if (type === 'all') {
        return ['all'];
      }
      
      const newTypes = prev.includes('all') ? [type] : 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      
      return newTypes.length === 0 ? ['all'] : newTypes;
    });
  }, []);

  const handleGetDirections = useCallback((location: LocationData) => {
    setShowDirections(location.id);
    toast({
      title: 'Directions requested',
      description: `Getting directions to ${location.name} via ${selectedTransport}.`,
    });
  }, [selectedTransport, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Fair';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MapPin className="w-8 h-8 text-green-500" />
            Location Services
          </h1>
          <p className="text-muted-foreground">
            Advanced location-based property services and mapping
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Location Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Property Location Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
                    <p className="text-muted-foreground">Neighborhood: {property.neighborhood}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(property.walkScore)}`}>
                        {property.walkScore}
                      </div>
                      <div className="text-sm font-medium">Walk Score</div>
                      <div className="text-xs text-muted-foreground">
                        {getScoreLabel(property.walkScore)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(property.transitScore)}`}>
                        {property.transitScore}
                      </div>
                      <div className="text-sm font-medium">Transit Score</div>
                      <div className="text-xs text-muted-foreground">
                        {getScoreLabel(property.transitScore)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(property.bikeScore)}`}>
                        {property.bikeScore}
                      </div>
                      <div className="text-sm font-medium">Bike Score</div>
                      <div className="text-xs text-muted-foreground">
                        {getScoreLabel(property.bikeScore)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
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

                  {/* Property Marker */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow text-sm font-medium">
                      Property Location
                    </div>
                  </div>

                  {/* Nearby Location Markers */}
                  {filteredLocations.slice(0, 5).map((location, index) => {
                    const IconComponent = locationIcons[location.type];
                    const angle = (index * 72) * (Math.PI / 180); // 72 degrees apart
                    const radius = 80;
                    const x = 50 + (radius * Math.cos(angle)) / 2;
                    const y = 50 + (radius * Math.sin(angle)) / 2;

                    return (
                      <div
                        key={location.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => handleGetDirections(location)}
                      >
                        <div className="bg-blue-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button size="sm" variant="secondary">
                      <Zap className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Layers className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-4 left-4 text-sm text-muted-foreground">
                    Interactive map with nearby amenities
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Nearby Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLocations.map((location) => {
                    const IconComponent = locationIcons[location.type];
                    
                    return (
                      <div key={location.id} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{location.name}</h3>
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm">{location.rating}</span>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {location.type}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {location.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{location.distance} km away</span>
                              </div>
                              {location.operatingHours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{location.operatingHours}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGetDirections(location)}
                              >
                                <Route className="w-4 h-4 mr-2" />
                                Directions
                              </Button>
                            </div>
                          </div>

                          {showDirections === location.id && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Route className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Route via {selectedTransport}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Distance:</span>
                                  <span className="ml-2 font-medium">{location.distance} km</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Est. Time:</span>
                                  <span className="ml-2 font-medium">
                                    {transportModes.find(t => t.id === selectedTransport)?.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search Radius: {searchRadius[0]} km
                  </label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    max={10}
                    min={0.5}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'All', icon: Filter },
                      { id: 'school', label: 'Schools', icon: School },
                      { id: 'hospital', label: 'Healthcare', icon: Hospital },
                      { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
                      { id: 'transport', label: 'Transport', icon: Bus },
                      { id: 'restaurant', label: 'Dining', icon: Coffee }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleTypeFilter(type.id)}
                        className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                          selectedTypes.includes(type.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Transport Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTransport} onValueChange={setSelectedTransport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transportModes.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id}>
                        <div className="flex items-center gap-2">
                          <span>{mode.icon}</span>
                          <span>{mode.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Location Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Location Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Locations:</span>
                  <span className="font-medium">{filteredLocations.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Within 1km:</span>
                  <span className="font-medium">
                    {filteredLocations.filter(l => l.distance <= 1).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Avg. Rating:</span>
                  <span className="font-medium">
                    {(filteredLocations.reduce((sum, l) => sum + l.rating, 0) / filteredLocations.length).toFixed(1)}
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-2">Quick Stats</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Schools:</span>
                      <span>{filteredLocations.filter(l => l.type === 'school').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Healthcare:</span>
                      <span>{filteredLocations.filter(l => l.type === 'hospital').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shopping:</span>
                      <span>{filteredLocations.filter(l => l.type === 'shopping').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport:</span>
                      <span>{filteredLocations.filter(l => l.type === 'transport').length}</span>
                    </div>
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