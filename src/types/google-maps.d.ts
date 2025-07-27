/**
 * Optimized Google Maps TypeScript declarations
 * Provides comprehensive type safety for Google Maps JavaScript API integration
 */

// Global window interface extension for Google Maps API
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    /**
     * Core Map class for creating and managing map instances
     * Represents the main map container with comprehensive control options
     */
    class Map {
      /**
       * Creates a new Map instance
       * @param mapDiv - The HTML element that will contain the map
       * @param opts - Configuration options for map initialization
       */
      constructor(mapDiv: Element | null, opts?: MapOptions);
      
      /**
       * Sets the center point of the map
       * @param latlng - The latitude/longitude coordinate to center on
       */
      setCenter(latlng: LatLng | LatLngLiteral): void;
      
      /**
       * Sets the zoom level of the map
       * @param zoom - Zoom level (typically 0-20, where higher is more zoomed in)
       */
      setZoom(zoom: number): void;
      
      /**
       * Gets the current zoom level
       * @returns The current zoom level as a number
       */
      getZoom(): number;
      
      /**
       * Smoothly pans the map to a new center point
       * @param latLng - The target coordinate to pan to
       */
      panTo(latLng: LatLng | LatLngLiteral): void;
    }

    /**
     * Configuration options for Map initialization
     * Controls appearance, behavior, and available UI elements
     */
    interface MapOptions {
      /** Initial center point of the map */
      center?: LatLng | LatLngLiteral;
      /** Initial zoom level (0-20) */
      zoom?: number;
      /** Visual style of the map (roadmap, satellite, etc.) */
      mapTypeId?: MapTypeId;
      /** Disable all default UI controls when true */
      disableDefaultUI?: boolean;
      /** Show/hide zoom control buttons */
      zoomControl?: boolean;
      /** Show/hide map type selector */
      mapTypeControl?: boolean;
      /** Show/hide distance scale indicator */
      scaleControl?: boolean;
      /** Show/hide Street View pegman control */
      streetViewControl?: boolean;
      /** Show/hide rotation control for 45° imagery */
      rotateControl?: boolean;
      /** Show/hide fullscreen toggle button */
      fullscreenControl?: boolean;
    }

    /**
     * Simple coordinate representation as plain object
     * Preferred for performance when you don't need LatLng methods
     */
    interface LatLngLiteral {
      /** Latitude in decimal degrees (-90 to 90) */
      lat: number;
      /** Longitude in decimal degrees (-180 to 180) */
      lng: number;
    }

    /**
     * Full-featured coordinate class with utility methods
     * Use when you need coordinate manipulation or Google Maps API integration
     */
    class LatLng {
      /**
       * Creates a new LatLng coordinate
       * @param lat - Latitude in decimal degrees
       * @param lng - Longitude in decimal degrees
       */
      constructor(lat: number, lng: number);
      
      /**
       * Gets the latitude value
       * @returns Latitude in decimal degrees
       */
      lat(): number;
      
      /**
       * Gets the longitude value
       * @returns Longitude in decimal degrees
       */
      lng(): number;
    }

    /**
     * Map marker for displaying points of interest
     * Supports custom icons, click handlers, and positioning
     */
    class Marker {
      /**
       * Creates a new marker
       * @param opts - Configuration options for the marker
       */
      constructor(opts?: MarkerOptions);
      
      /**
       * Updates marker position on the map
       * @param latlng - New coordinate position
       */
      setPosition(latlng: LatLng | LatLngLiteral): void;
      
      /**
       * Associates marker with a map instance
       * @param map - Map to display marker on (null to hide)
       */
      setMap(map: Map | null): void;
      
      /**
       * Attaches event listener to marker
       * @param eventName - Event type (e.g., 'click', 'mouseover')
       * @param handler - Function to execute when event occurs
       */
      addListener(eventName: string, handler: (event?: MapMouseEvent) => void): void;
    }

    /**
     * Configuration options for Marker creation
     * Defines appearance, behavior, and initial state
     */
    interface MarkerOptions {
      /** Initial position coordinate */
      position?: LatLng | LatLngLiteral;
      /** Map instance to display marker on */
      map?: Map;
      /** Tooltip text shown on hover */
      title?: string;
      /** Custom icon (URL string or Icon object) */
      icon?: string | Icon;
      /** Whether marker responds to click events */
      clickable?: boolean;
    }

    /**
     * Custom icon configuration for markers
     * Allows precise control over marker appearance and positioning
     */
    interface Icon {
      /** URL to the icon image file */
      url: string;
      /** Scaled size of the icon in pixels */
      scaledSize?: Size;
      /** Anchor point for positioning (relative to icon's top-left) */
      anchor?: Point;
    }

    /**
     * Represents dimensions in pixels
     * Used for sizing UI elements and icons
     */
    class Size {
      /**
       * Creates a new Size object
       * @param width - Width in pixels
       * @param height - Height in pixels
       */
      constructor(width: number, height: number);
    }

    /**
     * Represents a pixel coordinate point
     * Used for precise positioning within UI elements
     */
    class Point {
      /**
       * Creates a new Point coordinate
       * @param x - Horizontal pixel offset
       * @param y - Vertical pixel offset
       */
      constructor(x: number, y: number);
    }

    /**
     * Information popup window for displaying content
     * Can be attached to markers or positioned independently
     */
    class InfoWindow {
      /**
       * Creates a new InfoWindow
       * @param opts - Configuration options for the info window
       */
      constructor(opts?: InfoWindowOptions);
      
      /**
       * Sets the content displayed in the info window
       * @param content - HTML string or DOM element to display
       */
      setContent(content: string | Element): void;
      
      /**
       * Opens the info window on the map
       * @param map - Map instance to display on (optional if anchor provided)
       * @param anchor - Marker to attach to (optional if position provided)
       */
      open(map?: Map, anchor?: Marker): void;
      
      /**
       * Closes and hides the info window
       */
      close(): void;
    }

    /**
     * Configuration options for InfoWindow creation
     * Controls content, positioning, and initial state
     */
    interface InfoWindowOptions {
      /** HTML content or DOM element to display */
      content?: string | Element;
      /** Map coordinate position (if not anchored to marker) */
      position?: LatLng | LatLngLiteral;
    }

    /**
     * Mouse event data provided to map and marker event handlers
     * Contains coordinate information and interaction details
     */
    interface MapMouseEvent {
      /** Geographic coordinate where the event occurred */
      latLng: LatLng;
      /** Indicates if event should stop propagation to parent elements */
      stop?: () => void;
    }

    /**
     * Available map display types
     * Each provides different visual representation of geographic data
     */
    enum MapTypeId {
      /** Standard road map view with streets and labels */
      ROADMAP = 'roadmap',
      /** Aerial/satellite imagery view */
      SATELLITE = 'satellite',
      /** Combination of satellite imagery with road overlays */
      HYBRID = 'hybrid',
      /** Topographical view showing elevation and natural features */
      TERRAIN = 'terrain'
    }

    /**
     * Places API namespace for location search and discovery
     * Provides functionality to find nearby businesses and points of interest
     */
    namespace places {
      /**
       * Service for searching and retrieving place information
       * Requires a map or container element for attribution
       */
      class PlacesService {
        /**
         * Creates a new PlacesService instance
         * @param attrContainer - Map or HTML element for displaying attributions
         */
        constructor(attrContainer: Map | HTMLDivElement);
        
        /**
         * Searches for nearby places within a specified radius
         * @param request - Search criteria and location parameters
         * @param callback - Function to handle search results and status
         */
        nearbySearch(
          request: PlaceSearchRequest, 
          callback: (
            results: PlaceResult[] | null, 
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      /**
       * Parameters for nearby place searches
       * Defines location, search radius, and optional filtering criteria
       */
      interface PlaceSearchRequest {
        /** Center point for the search area */
        location: LatLng | LatLngLiteral;
        /** Search radius in meters (maximum 50000) */
        radius: number;
        /** Optional array of place types to filter results */
        type?: string[];
      }

      /**
       * Individual place result from search operations
       * Contains basic information about a discovered location
       */
      interface PlaceResult {
        /** Display name of the place */
        name?: string;
        /** Geographic location information */
        geometry?: {
          location: LatLng;
        };
        /** User rating (1.0 to 5.0 scale) */
        rating?: number;
        /** Array of place type classifications */
        types?: string[];
        /** Street address or general area description */
        vicinity?: string;
      }

      /**
       * Status codes returned by Places service operations
       * Indicates success, failure, or specific error conditions
       */
      enum PlacesServiceStatus {
        /** Request completed successfully */
        OK = 'OK',
        /** Search completed but found no matching results */
        ZERO_RESULTS = 'ZERO_RESULTS',
        /** API quota exceeded, retry later */
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        /** API key invalid or request unauthorized */
        REQUEST_DENIED = 'REQUEST_DENIED',
        /** Request parameters are malformed or missing */
        INVALID_REQUEST = 'INVALID_REQUEST',
        /** Unexpected server error occurred */
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }
  }
}

// Export empty object to ensure this file is treated as a module
export {};