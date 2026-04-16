/**
 * Enhanced PropertyMap Component
 * 
 * Strategic consolidation of PropertyMap component and page functionality
 * Combines the best of both implementations for maximum flexibility
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Loader } from "@googlemaps/js-api-loader"
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
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  School,
  Hospital,
  ShoppingCart,
  Utensils,
  Bus,
  type LucideProps,
} from 'lucide-react'

import { Badge } from '../../local/components/ui/badge"
import { Button } from '../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card"
import { Input } from '../../local/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../local/components/ui/select"
import { Slider } from '../../local/components/ui/slider"
import { Skeleton } from '../../local/components/ui/skeleton"
import { useToast } from '../../local/hooks/use-toast"
import { formatPrice } from '../../local/utils/formatters"

// Declare Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
    }
    
    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latLng: LatLng | LatLngLiteral): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }
    
    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string | Node): void;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    
    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
    }
    
    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: any[], status: any) => void): void;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    class Point {
      constructor(x: number, y: number);
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      gestureHandling?: string;
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
      label?: string | MarkerLabel;
    }
    
    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }
    
    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
    }
    
    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }
    
    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
    }
    
    interface MapsEventListener {
      remove(): void;
    }
    
    namespace places {
      class PlacesService {
        constructor(map: Map);
        nearbySearch(request: any, callback: (results: any[], status: any) => void): void;
      }
      
      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS'
      }
    }
  }
}

/* ---------- TYPES ---------- */
interface PropertyLocation {
  lat: number;
  lng: number;
  address: string;
  title?: string;
  price?: number;
  verified?: boolean;
  id?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  status?: 'available' | 'under-offer' | 'sold' | 'rented';
}

interface NearbyPlace {
  name: string;
  type: string;
  distance: number;
  rating?: number;
  icon: React.ComponentType<LucideProps>;
}

interface MapFilters {
  priceRange: [number, number];
  propertyType: string;
  bedrooms: string;
  verifiedOnly: boolean;
  searchRadius: number;
}

/**
 * Component modes determine the layout and functionality
 * - embedded: Compact view for integration into property pages
 * - full-page: Expanded view with filters and search capabilities
 */
type ComponentMode = 'embedded' | 'full-page';

interface PropertyMapProps {
  // Core functionality
  readonly location: PropertyLocation;
  readonly nearbyProperties?: PropertyLocation[];
  readonly height?: string;
  readonly className?: string;
  readonly interactive?: boolean;
  
  // Enhanced functionality (from page version)
  readonly mode?: ComponentMode;
  readonly showFilters?: boolean;
  readonly showSearch?: boolean;
  readonly showNearbyPlaces?: boolean;
  readonly enableFullscreen?: boolean;
  readonly properties?: PropertyLocation[]; // For search mode
  
  // Callbacks
  readonly onLocationChange?: (location: PropertyLocation) => void;
  readonly onPropertySelect?: (property: PropertyLocation | null) => void;
  readonly onFiltersChange?: (filters: MapFilters) => void;
}

/* ---------- CONSTANTS ---------- */
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

const DEFAULT_FILTERS: MapFilters = {
  priceRange: [0, 100000000],
  propertyType: 'all',
  bedrooms: 'any',
  verifiedOnly: false,
  searchRadius: 10
};

// Default zoom levels for different modes
const DEFAULT_ZOOM = {
  embedded: 15,
  'full-page': 12
} as const;

/* ---------- MAIN COMPONENT ---------- */
function PropertyMapComponent({
  location,
  nearbyProperties = [],
  height = "400px",
  className = "",
  interactive = true,
  mode = 'embedded',
  showFilters = false,
  showSearch = false,
  showNearbyPlaces = true,
  enableFullscreen = false,
  properties = [],
  onLocationChange,
  onPropertySelect,
  onFiltersChange
}: PropertyMapProps) {
  const { toast } = useToast();
  
  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("roadmap");
  
  // Enhanced state (from page version)
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: location.lat, lng: location.lng });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(showFilters);

  // Determine which properties to display based on mode and filters
  const displayProperties = useMemo(() => {
    if (mode === 'full-page' && properties.length > 0) {
      // Apply filtering logic for full-page mode
      return properties.filter(property => {
        // Price range filter
        if (property.price && (property.price < filters.priceRange[0] || property.price > filters.priceRange[1])) {
          return false;
        }
        // Property type filter
        if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
          return false;
        }
        // Bedroom filter
        if (filters.bedrooms !== 'any') {
          const minBedrooms = parseInt(filters.bedrooms);
          if (!property.bedrooms || property.bedrooms < minBedrooms) {
            return false;
          }
        }
        // Verification filter
        if (filters.verifiedOnly && !property.verified) {
          return false;
        }
        return true;
      });
    }
    // For embedded mode, show the main location plus nearby properties
    return [location, ...nearbyProperties];
  }, [mode, properties, location, nearbyProperties, filters]);

  /* ---------- Google Maps Loading ---------- */
  useEffect(() => {
    if (!GOOGLE_KEY) {
      setError("Google Maps API key not configured");
      return;
    }

    let isMounted = true;
    const loader = new Loader({ apiKey: GOOGLE_KEY, libraries: ["places"] });

    (loader as any)
      .importLibrary("maps")
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
        return undefined;
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error("Google Maps loading error:", err);
          setError("Failed to load Google Maps");
        }
        throw err;
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------- Map Initialization and Updates ---------- */
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Clear existing markers to prevent memory leaks
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Initialize the map with appropriate settings
    const map = new window.google.maps.Map(mapRef.current as HTMLDivElement, {
      center: mapCenter,
      zoom: DEFAULT_ZOOM[mode],
      mapTypeId: mapType,
      gestureHandling: interactive ? "auto" : "none",
      zoomControl: interactive,
      streetViewControl: interactive,
      fullscreenControl: interactive && !enableFullscreen, // Hide if we have custom fullscreen
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    // Add markers for all display properties
    displayProperties.forEach((property, index) => {
      const isMainProperty = index === 0 && mode === 'embedded';
      
      // Create custom marker icons
      const marker = new window.google.maps.Marker({
        position: { lat: property.lat, lng: property.lng },
        map,
        title: property.title || property.address,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            isMainProperty ? 
              '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#14B8A6" stroke="white" stroke-width="2"/><path d="M16 8L20 14H12L16 8Z" fill="white"/><circle cx="16" cy="20" r="2" fill="white"/></svg>' :
              '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>'
          )}`,
          scaledSize: new window.google.maps.Size(isMainProperty ? 32 : 24, isMainProperty ? 32 : 24),
          anchor: new window.google.maps.Point(isMainProperty ? 16 : 12, isMainProperty ? 32 : 24),
        },
      });

      // Add click listeners based on mode
      if (mode === 'full-page') {
        // For full-page mode, handle property selection
        marker.addListener("click", () => {
          const newSelection = selectedProperty?.id === property.id ? null : property;
          setSelectedProperty(newSelection);
          onPropertySelect?.(newSelection);
        });
      } else {
        // For embedded mode, show info windows
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2 max-w-[200px]">
              <h3 class="text-sm font-bold mb-1">${property.title ?? "Property"}</h3>
              <p class="text-xs text-gray-600 mb-1">${property.address}</p>
              ${property.price ? `<p class="text-xs font-bold text-teal-700">KES ${property.price.toLocaleString()}</p>` : ""}
              ${property.verified ? '<span class="text-xs bg-green-200 text-green-800 px-1 rounded">✓ Verified</span>' : ""}
            </div>
          `,
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
      }

      markersRef.current.push(marker);
    });

    // Load nearby places for embedded mode
    if (showNearbyPlaces && mode === 'embedded') {
      loadNearbyPlaces(map, mapCenter);
    }

    // Cleanup function
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, mapCenter, mapType, interactive, displayProperties, mode, selectedProperty, showNearbyPlaces]);

  /* ---------- Nearby Places Loading ---------- */
  const processPlaceResults = useCallback(
    (
      results: google.maps.places.PlaceResult[] | null,
      type: string,
      icon: React.ComponentType<LucideProps>,
      center: { lat: number; lng: number }
    ) => {
      if (!results) return;

      const newPlaces = results
        .slice(0, 2) // Limit to 2 places per category
        .map((place): NearbyPlace | null => {
          if (!place.geometry?.location || !place.name) return null;
          const distanceKm = calculateDistance(center, {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
          return {
            name: place.name,
            type,
            distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
            rating: place.rating ?? 0,
            icon,
          };
        })
        .filter((place): place is NearbyPlace => place !== null);

      setNearbyPlaces((prev: NearbyPlace[]) => {
        const combined = [...prev, ...newPlaces];
        const sorted = [...combined].sort((a, b) => a.distance - b.distance);
        return sorted.slice(0, 10); // Keep only top 10 closest places
      });
    },
    []
  );

  const loadNearbyPlaces = useCallback(
    (map: google.maps.Map, center: google.maps.LatLngLiteral) => {
      if (!window.google?.maps?.places) return;

      const service = new window.google.maps.places.PlacesService(map);
      const placeTypes: Array<{ type: string; icon: React.ComponentType<LucideProps> }> = [
        { type: "school", icon: School },
        { type: "hospital", icon: Hospital },
        { type: "shopping_mall", icon: ShoppingCart },
        { type: "restaurant", icon: Utensils },
        { type: "bus_station", icon: Bus },
      ];

      // Search for each type of place
      placeTypes.forEach(({ type, icon }) => {
        service.nearbySearch(
          {
            location: center,
            radius: 2000, // 2km radius
            type: type as string,
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              processPlaceResults(results, type, icon, center);
            }
          }
        );
      });
    },
    [processPlaceResults]
  );

  /* ---------- Helper Functions ---------- */
  /**
   * Calculate distance between two geographic points using Haversine formula
   */
  const calculateDistance = (
    pointA: { lat: number; lng: number },
    pointB: { lat: number; lng: number }
  ) => {
    const earthRadiusKm = 6371; // Earth's radius in kilometers
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    
    const deltaLat = toRadians(pointB.lat - pointA.lat);
    const deltaLng = toRadians(pointB.lng - pointA.lng);
    
    const haversineValue =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRadians(pointA.lat)) * Math.cos(toRadians(pointB.lat)) * Math.sin(deltaLng / 2) ** 2;
    
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
  };

  /* ---------- Map Control Functions ---------- */
  const zoomIn = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() ?? DEFAULT_ZOOM[mode];
    mapInstanceRef.current.setZoom(currentZoom + 1);
  };

  const zoomOut = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() ?? DEFAULT_ZOOM[mode];
    mapInstanceRef.current.setZoom(Math.max(1, currentZoom - 1)); // Prevent zoom below 1
  };

  const resetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter(mapCenter);
    mapInstanceRef.current.setZoom(DEFAULT_ZOOM[mode]);
  };

  const toggleMapType = () => {
    setMapType((currentType: "roadmap" | "satellite" | "hybrid") =>
      currentType === "roadmap" ? "satellite" : "roadmap"
    );
  };

  /* ---------- Filter Management ---------- */
  const updateFilter = useCallback(<K extends keyof MapFilters>(
    key: K,
    value: MapFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const handleLocationSearch = useCallback(() => {
    if (!searchLocation.trim()) return;
    toast({
      title: 'Location search',
      description: `Searching for properties near "${searchLocation}"`,
    });
    // Here you would typically integrate with a geocoding service
  }, [searchLocation, toast]);

  /* ---------- Error State Rendering ---------- */
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ---------- Main Render Logic ---------- */
  const mapHeight = mode === 'full-page' ? 'h-[calc(100vh-200px)]' : `h-[${height}]`;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      <div className={`${mode === 'full-page' ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'space-y-4'} h-full`}>
        
        {/* Filters Sidebar (full-page mode only) */}
        {mode === 'full-page' && showFiltersPanel && (
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            {/* Location Search */}
            {showSearch && (
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
                      onValueChange={(value) => updateFilter('searchRadius', value[0] as number)}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Results Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {displayProperties.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Properties found
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Container */}
        <div className={`${mode === 'full-page' && showFiltersPanel ? 'lg:col-span-3' : 'lg:col-span-4'} relative`}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {mode === 'full-page' ? 'Property Locations' : 'Property Location'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {mode === 'full-page' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  )}
                  {interactive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMapType}
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(
                          `https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`,
                          "_blank"
                        )}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {enableFullscreen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <div className="relative h-full">
                {!isLoaded ? (
                  <Skeleton className={`w-full ${mapHeight}`} />
                ) : (
                  <div ref={mapRef} className={`w-full rounded-b-lg ${mapHeight}`} />
                )}

                {/* Map Controls */}
                {interactive && isLoaded && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={zoomIn}
                      className="w-8 h-8 p-0"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={zoomOut}
                      className="w-8 h-8 p-0"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetView}
                      className="w-8 h-8 p-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Details Popup (full-page mode) */}
          {mode === 'full-page' && selectedProperty && (
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {selectedProperty.images?.[0] && (
                      <img
                        src={selectedProperty.images[0]}
                        alt={selectedProperty.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
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
                        {selectedProperty.price && (
                          <div className="text-xl font-bold text-primary">
                            {formatPrice(selectedProperty.price)}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {selectedProperty.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          )}
                          {selectedProperty.status && (
                            <Badge variant="outline" className="capitalize">
                              {selectedProperty.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => selectedProperty.id && window.open(`/property/${selectedProperty.id}`, '_blank')}
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

      {/* Nearby Places (embedded mode only) */}
      {mode === 'embedded' && showNearbyPlaces && nearbyPlaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nearby Places</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyPlaces.map((place: NearbyPlace, index: number) => (
                <div
                  key={`${place.name}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg border"
                >
                  <place.icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{place.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{place.distance} km</span>
                      {place.rating && (
                        <Badge className="text-xs">⭐ {place.rating}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- EXPORTS ---------- */

// Main export - renamed to avoid conflicts
export const PropertyMap = PropertyMapComponent;

// Convenience wrappers for specific use cases
export function PropertyMapEmbedded(props: Omit<PropertyMapProps, 'mode'>) {
  return <PropertyMapComponent {...props} mode="embedded" />;
}

export function PropertyMapPage(props: Omit<PropertyMapProps, 'mode'>) {
  return (
    <PropertyMapComponent 
      {...props} 
      mode="full-page" 
      showFilters={true} 
      showSearch={true} 
      enableFullscreen={true} 
    />
  );
}

// Type exports for external use
export type { PropertyLocation, NearbyPlace, MapFilters, PropertyMapProps, ComponentMode };