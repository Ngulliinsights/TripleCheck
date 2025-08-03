import { useCallback, useRef, useState } from 'react';

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  onSuccess?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  supported: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition>;
  watchPosition: () => void;
  clearWatch: () => void;
  calculateDistance: (lat2: number, lon2: number) => number | null;
  isNearby: (lat2: number, lon2: number, radiusKm: number) => boolean | null;
}

/**
 * Enhanced geolocation hook with distance calculations and property proximity features
 * Essential for location-based property search and mapping functionality
 */
export function useGeolocation({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 300000, // 5 minutes
  watch = false,
  onSuccess,
  onError,
}: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const supported = 'geolocation' in navigator;

  const options: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  // Convert native position to our format
  const convertPosition = useCallback((nativePosition: globalThis.GeolocationPosition): GeolocationPosition => {
    const { coords, timestamp } = nativePosition;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude ?? 0,
      altitudeAccuracy: coords.altitudeAccuracy ?? 0,
      ...(coords.heading !== null && { heading: coords.heading }),
      ...(coords.speed !== null && { speed: coords.speed }),
      timestamp,
    };
  }, []);

  // Success handler
  const handleSuccess = useCallback((nativePosition: globalThis.GeolocationPosition) => {
    const convertedPosition = convertPosition(nativePosition);
    setPosition(convertedPosition);
    setError(null);
    setLoading(false);
    onSuccess?.(convertedPosition);
  }, [convertPosition, onSuccess]);

  // Error handler
  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err);
    setLoading(false);
    onError?.(err);
  }, [onError]);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!supported) {
        const error = {
          code: 0,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError;
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (nativePosition) => {
          const convertedPosition = convertPosition(nativePosition);
          setPosition(convertedPosition);
          setLoading(false);
          onSuccess?.(convertedPosition);
          resolve(convertedPosition);
        },
        (err) => {
          setError(err);
          setLoading(false);
          onError?.(err);
          reject(err);
        },
        options
      );
    });
  }, [supported, convertPosition, onSuccess, onError, options]);

  // Watch position
  const watchPosition = useCallback(() => {
    if (!supported || watchIdRef.current !== null) {
      return;
    }

    setLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }, [supported, handleSuccess, handleError, options]);

  // Clear watch
  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLoading(false);
    }
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat2: number, lon2: number): number | null => {
    if (!position) return null;

    const { latitude: lat1, longitude: lon1 } = position;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }, [position]);

  // Check if a location is within a certain radius
  const isNearby = useCallback((lat2: number, lon2: number, radiusKm: number): boolean | null => {
    const distance = calculateDistance(lat2, lon2);
    return distance !== null ? distance <= radiusKm : null;
  }, [calculateDistance]);

  // Auto-start watching if enabled
  useSafeEffect(() => {
    if (watch && supported) {
      watchPosition();
    }

    return () => {
      clearWatch();
    };
  }, [watch, supported, watchPosition, clearWatch]);

  // Cleanup on unmount
  useSafeEffect(() => {
    return () => {
      clearWatch();
    };
  }, [clearWatch]);

  return {
    position,
    error,
    loading,
    supported,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    calculateDistance,
    isNearby,
  };
}

/**
 * Property location hook with distance calculations
 */
export function usePropertyLocation(propertyLocation?: { latitude: number; longitude: number }) {
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 600000, // 10 minutes for property searches
  });

  const distanceToProperty = propertyLocation && geolocation.position
    ? geolocation.calculateDistance(propertyLocation.latitude, propertyLocation.longitude)
    : null;

  const isPropertyNearby = (radiusKm: number = 5) => {
    return propertyLocation && geolocation.position
      ? geolocation.isNearby(propertyLocation.latitude, propertyLocation.longitude, radiusKm)
      : null;
  };

  return {
    ...geolocation,
    distanceToProperty,
    isPropertyNearby,
  };
}

/**
 * Location-based property search hook
 */
export function useLocationBasedSearch() {
  const [searchRadius, setSearchRadius] = useState(10); // Default 10km radius
  const [nearbyProperties, setNearbyProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const cleanupManager = useEnhancedCleanupManager();

  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  const searchNearbyProperties = useCallback(async (radius: number = searchRadius) => {
    if (!geolocation.position) {
      await geolocation.getCurrentPosition();
      return;
    }

    setLoading(true);
    
    const controller = new AbortController();
    cleanupManager.addAbortController(controller, 'nearby-search');

    try {
      const { latitude, longitude } = geolocation.position;
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `/api/properties/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search nearby properties: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add distance to each property
      const propertiesWithDistance = data.properties.map((property: any) => ({
        ...property,
        distance: geolocation.calculateDistance(property.latitude, property.longitude),
      }));

      // Sort by distance
      propertiesWithDistance.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

      setNearbyProperties(propertiesWithDistance);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('Error searching nearby properties:', error);
      setNearbyProperties([]);
    } finally {
      setLoading(false);
      cleanupManager.removeCleanup('nearby-search');
    }
  }, [geolocation, searchRadius, cleanupManager]);

  const updateSearchRadius = useCallback((radius: number) => {
    setSearchRadius(radius);
    if (geolocation.position) {
      searchNearbyProperties(radius);
    }
  }, [geolocation.position, searchNearbyProperties]);

  return {
    position: geolocation.position,
    error: geolocation.error,
    loading: loading || geolocation.loading,
    supported: geolocation.supported,
    searchRadius,
    nearbyProperties,
    searchNearbyProperties,
    updateSearchRadius,
    getCurrentPosition: geolocation.getCurrentPosition,
  };
}

/**
 * Address geocoding hook
 */
export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupManager = useEnhancedCleanupManager();

  const geocodeAddress = useCallback(async (address: string): Promise<GeolocationPosition | null> => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    cleanupManager.addAbortController(controller, 'geocode-request');

    try {
      // Using a geocoding service (you'd replace this with your preferred service)
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          accuracy: 100, // Estimated accuracy for geocoded addresses
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      const errorMessage = err instanceof Error ? err.message : 'Geocoding failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
      cleanupManager.removeCleanup('geocode-request');
    }
  }, [cleanupManager]);

  const reverseGeocode = useCallback(async (
    latitude: number, 
    longitude: number
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    cleanupManager.addAbortController(controller, 'reverse-geocode-request');

    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      const errorMessage = err instanceof Error ? err.message : 'Reverse geocoding failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
      cleanupManager.removeCleanup('reverse-geocode-request');
    }
  }, [cleanupManager]);

  return {
    loading,
    error,
    geocodeAddress,
    reverseGeocode,
  };
}