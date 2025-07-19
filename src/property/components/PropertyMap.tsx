import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Car,
  Bus,
  School,
  ShoppingCart,
  Hospital,
  Utensils
} from 'lucide-react';

interface PropertyLocation {
  lat: number;
  lng: number;
  address: string;
  title?: string;
  price?: number;
  verified?: boolean;
}

interface NearbyPlace {
  name: string;
  type: string;
  distance: number;
  rating?: number;
  icon: React.ComponentType<any>;
}

interface PropertyMapProps {
  location: PropertyLocation;
  nearbyProperties?: PropertyLocation[];
  showNearbyPlaces?: boolean;
  height?: string;
  className?: string;
  onLocationChange?: (location: PropertyLocation) => void;
  interactive?: boolean;
}

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export function PropertyMap({
  location,
  nearbyProperties = [],
  showNearbyPlaces = true,
  height = '400px',
  className = '',
  onLocationChange,
  interactive = true
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured');
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !location) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 15,
        mapTypeId: mapType,
        gestureHandling: interactive ? 'auto' : 'none',
        zoomControl: interactive,
        streetViewControl: interactive,
        fullscreenControl: interactive,
        mapTypeControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add main property marker
      const mainMarker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.title || location.address,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#2C5282" stroke="white" stroke-width="2"/>
              <path d="M16 8L20 14H12L16 8Z" fill="white"/>
              <circle cx="16" cy="20" r="2" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      markersRef.current = [mainMarker];

      // Add info window for main property
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${location.title || 'Property Location'}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
              ${location.address}
            </p>
            ${location.price ? `
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #2C5282;">
                KES ${location.price.toLocaleString()}
              </p>
            ` : ''}
            ${location.verified ? `
              <div style="margin-top: 4px;">
                <span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                  ✓ Verified
                </span>
              </div>
            ` : ''}
          </div>
        `
      });

      mainMarker.addListener('click', () => {
        infoWindow.open(map, mainMarker);
      });

      // Add nearby property markers
      nearbyProperties.forEach((property, index) => {
        const marker = new google.maps.Marker({
          position: { lat: property.lat, lng: property.lng },
          map,
          title: property.title || property.address,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 24)
          }
        });

        const propertyInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 180px;">
              <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">
                ${property.title || 'Property'}
              </h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">
                ${property.address}
              </p>
              ${property.price ? `
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #10B981;">
                  KES ${property.price.toLocaleString()}
                </p>
              ` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          propertyInfoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });

      // Load nearby places if enabled
      if (showNearbyPlaces) {
        loadNearbyPlaces(map, { lat: location.lat, lng: location.lng });
      }

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [isLoaded, location, nearbyProperties, mapType, interactive, showNearbyPlaces]);

  // Load nearby places
  const loadNearbyPlaces = useCallback((map: google.maps.Map, center: google.maps.LatLngLiteral) => {
    const service = new google.maps.places.PlacesService(map);
    const places: NearbyPlace[] = [];

    const placeTypes = [
      { type: 'school', icon: School, name: 'Schools' },
      { type: 'hospital', icon: Hospital, name: 'Hospitals' },
      { type: 'shopping_mall', icon: ShoppingCart, name: 'Shopping' },
      { type: 'restaurant', icon: Utensils, name: 'Restaurants' },
      { type: 'bus_station', icon: Bus, name: 'Transport' }
    ];

    placeTypes.forEach(({ type, icon }) => {
      service.nearbySearch({
        location: center,
        radius: 2000, // 2km radius
        type: type as any
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.slice(0, 3).forEach(place => {
            if (place.geometry?.location && place.name) {
              const distance = calculateDistance(
                center.lat,
                center.lng,
                place.geometry.location.lat(),
                place.geometry.location.lng()
              );

              places.push({
                name: place.name,
                type: type,
                distance: Math.round(distance * 100) / 100,
                rating: place.rating,
                icon
              });
            }
          });

          // Update state with collected places
          setNearbyPlaces([...places].sort((a, b) => a.distance - b.distance).slice(0, 10));
        }
      });
    });
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Map controls
  const zoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const resetView = () => {
    if (mapInstanceRef.current && location) {
      mapInstanceRef.current.setCenter({ lat: location.lat, lng: location.lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const changeMapType = (type: 'roadmap' | 'satellite' | 'hybrid') => {
    setMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">
              {location.address}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Location
            </CardTitle>
            <div className="flex items-center gap-2">
              {interactive && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInGoogleMaps}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {!isLoaded ? (
              <Skeleton className="w-full" style={{ height }} />
            ) : (
              <div
                ref={mapRef}
                style={{ height }}
                className="w-full rounded-b-lg"
              />
            )}
            
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

      {/* Nearby Places */}
      {showNearbyPlaces && nearbyPlaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nearby Places</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyPlaces.map((place, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                  <place.icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{place.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{place.distance} km away</span>
                      {place.rating && (
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {place.rating}
                        </Badge>
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

export default PropertyMap;