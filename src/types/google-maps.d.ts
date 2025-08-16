/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

// Extend the global google namespace to include all necessary types
declare namespace google {
  namespace maps {
    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      gestureHandling?: string;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      mapTypeControl?: boolean;
      styles?: MapTypeStyle[];
    }

    interface MarkerOptions {
      position?: LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
    }

    interface InfoWindowOptions {
      content?: string | Element;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: Array<{ [key: string]: string }>;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      setMapTypeId(mapTypeId: string): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: () => void): void;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    namespace places {
      interface PlaceResult {
        name?: string;
        geometry?: {
          location?: {
            lat(): number;
            lng(): number;
          };
        };
        rating?: number;
      }

      interface PlacesServiceStatus {
        OK: string;
      }

      class PlacesService {
        constructor(map: Map);
        nearbySearch(
          request: {
            location: LatLngLiteral;
            radius: number;
            type: string;
          },
          callback: (
            results: PlaceResult[] | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }
    }
  }
}

export { };