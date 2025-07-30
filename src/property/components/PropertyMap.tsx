// src/property/components/PropertyMap.tsx
/// <reference types="google.maps" />
import React, { useEffect, useRef, useState, useCallback } from "react";

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

// Google Maps types
interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: any) => any;
    Marker: new (options: any) => any;
    InfoWindow: new (options: any) => any;
    Size: new (width: number, height: number) => any;
    Point: new (x: number, y: number) => any;
    LatLngLiteral: { lat: number; lng: number };
  };
  places: {
    PlacesService: new (map: any) => unknown;
    PlacesServiceStatus: {
      OK: string;
    };
    PlaceResult: {
      geometry?: {
        location?: {
          lat(): number;
          lng(): number;
        };
      };
      name?: string;
      rating?: number;
    };
  };
}

declare const google: GoogleMapsAPI;
import { Loader } from "@googlemaps/js-api-loader";
import { Skeleton } from "@shared/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import {
  MapPin,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  School,
  Hospital,
  ShoppingCart,
  Utensils,
  Bus,
} from "lucide-react";

/* ---------- TYPES ---------- */
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
  icon: React.ComponentType<{ className?: string }>;
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

/* ---------- CONSTANTS ---------- */
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

/* ---------- COMPONENT ---------- */
export function PropertyMap({
  location,
  nearbyProperties = [],
  showNearbyPlaces = true,
  height = "400px",
  className = "",
  interactive = true,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">(
    "roadmap"
  );

  /* ---------- Load Google Maps ---------- */
  useEffect(() => {
    if (!GOOGLE_KEY) {
      setError("Google Maps API key not configured");
      return;
    }

    let isMounted = true;
    const loader = new Loader({ apiKey: GOOGLE_KEY, libraries: ["places"] });
    
    loader
      .importLibrary('maps')
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          // eslint-disable-next-line no-console
          console.error('Google Maps loading error:', err);
          setError("Failed to load Google Maps");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------- Nearby Places ---------- */
  const loadNearby = useCallback(
    (map: google.maps.Map, center: google.maps.LatLngLiteral) => {
      const service = new (google.maps as any).places.PlacesService(map);
      const collected: NearbyPlace[] = [];

      const types: Array<{ type: string; icon: React.ComponentType<any> }> = [
        { type: "school", icon: School },
        { type: "hospital", icon: Hospital },
        { type: "shopping_mall", icon: ShoppingCart },
        { type: "restaurant", icon: Utensils },
        { type: "bus_station", icon: Bus },
      ];

      types.forEach(({ type, icon }) =>
        service.nearbySearch(
          { location: center, radius: 2000, type: type as string },
          (
            results: google.maps.places.PlaceResult[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (
              status === (google.maps as any).places.PlacesServiceStatus.OK &&
              results
            ) {
              results
                .slice(0, 2)
                .forEach((place: google.maps.places.PlaceResult) => {
                  if (!place.geometry?.location || !place.name) return;
                  const d = distance(center, {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  collected.push({
                    name: place.name,
                    type,
                    distance: Math.round(d * 100) / 100,
                    rating: place.rating || 0,
                    icon,
                  });
                });
              setNearbyPlaces((prev: NearbyPlace[]) =>
                [...prev, ...collected]
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 10)
              );
            }
          }
        )
      );
    },
    []
  );

  /* ---------- Initialize Map ---------- */
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Clear existing markers to prevent duplicates
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: location.lat, lng: location.lng },
      zoom: 15,
      mapTypeId: mapType,
      gestureHandling: interactive ? "auto" : "none",
      zoomControl: interactive,
      streetViewControl: interactive,
      fullscreenControl: interactive,
      mapTypeControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    });
    mapInstanceRef.current = map;

    /* Main marker with teal color to match brand */
    const mainMarker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map,
      title: location.title || location.address,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#14B8A6" stroke="white" stroke-width="2"/><path d="M16 8L20 14H12L16 8Z" fill="white"/><circle cx="16" cy="20" r="2" fill="white"/></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32),
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-2 max-w-[200px]">
          <h3 class="text-sm font-bold mb-1">${location.title ?? "Property"}</h3>
          <p class="text-xs text-gray-600 mb-1">${location.address}</p>
          ${location.price ? `<p class="text-xs font-bold text-teal-700">KES ${location.price.toLocaleString()}</p>` : ""}
          ${location.verified ? '<span class="text-xs bg-green-200 text-green-800 px-1 rounded">✓ Verified</span>' : ""}
        </div>
      `,
    });
    mainMarker.addListener("click", () => infoWindow.open(map, mainMarker));
    markersRef.current.push(mainMarker);

    /* Nearby properties */
    nearbyProperties.forEach((p) => {
      const m = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: p.title || p.address,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>'
            ),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 24),
        },
      });
      markersRef.current.push(m);
    });

    if (showNearbyPlaces) {
      loadNearby(map, { lat: location.lat, lng: location.lng });
    }

    // Cleanup function to prevent memory leaks
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [
    isLoaded,
    location.lat,
    location.lng,
    location.address,
    location.title,
    location.price,
    location.verified,
    mapType,
    interactive,
    showNearbyPlaces,
    loadNearby,
    nearbyProperties
  ]);



  /* ---------- Helpers ---------- */
  const distance = (
    a: google.maps.LatLngLiteral,
    b: google.maps.LatLngLiteral
  ) => {
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  /* ---------- Controls ---------- */
  const zoomIn = () =>
    mapInstanceRef.current?.setZoom(
      (mapInstanceRef.current.getZoom() || 15) + 1
    );
  const zoomOut = () =>
    mapInstanceRef.current?.setZoom(
      (mapInstanceRef.current.getZoom() || 15) - 1
    );
  const resetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter({ lat: location.lat, lng: location.lng });
    mapInstanceRef.current.setZoom(15);
  };
  const openGoogle = () =>
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
      "_blank"
    );

  if (error)
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

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Location
            </CardTitle>
            <div className="flex gap-2">
              {interactive && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMapType((t: "roadmap" | "satellite" | "hybrid") =>
                        t === "roadmap" ? "satellite" : "roadmap"
                      )
                    }
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={openGoogle}>
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
              <Skeleton className="w-full h-96" />
            ) : (
              <div
                ref={mapRef}
                className="w-full rounded-b-lg h-96"
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

      {showNearbyPlaces && nearbyPlaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nearby Places</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyPlaces.map((p: NearbyPlace, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg border"
                >
                  <p.icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{p.distance} km</span>
                      {p.rating && (
                        <Badge className="text-xs">⭐ {p.rating}</Badge>
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
