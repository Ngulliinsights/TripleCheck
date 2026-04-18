import { useCallback, useMemo, useRef, useState } from 'react'

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager'
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect'

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
 * Enhanced geolocation hook with distance calculations and property proximity features.
 * Essential for location-based property search and mapping functionality.
 */
export function useGeolocation({
  enableHighAccuracy = true,
  timeout = 10_000,
  maximumAge = 300_000, // 5 minutes
  watch = false,
  onSuccess,
  onError,
}: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Keep callbacks fresh without destabilizing downstream memos
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useSafeEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useSafeEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Memoize the PositionOptions object so it is stable across renders
  const options = useMemo<PositionOptions>(
    () => ({ enableHighAccuracy, timeout, maximumAge }),
    [enableHighAccuracy, timeout, maximumAge]
  );

  const convertPosition = useCallback(
    (native: globalThis.GeolocationPosition): GeolocationPosition => {
      const { coords, timestamp } = native;
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude ?? undefined,
        altitudeAccuracy: coords.altitudeAccuracy ?? undefined,
        ...(coords.heading != null && { heading: coords.heading }),
        ...(coords.speed != null && { speed: coords.speed }),
        timestamp,
      };
    },
    []
  );

  const handleSuccess = useCallback(
    (native: globalThis.GeolocationPosition) => {
      const converted = convertPosition(native);
      setPosition(converted);
      setError(null);
      setLoading(false);
      onSuccessRef.current?.(converted);
    },
    [convertPosition]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err);
    setLoading(false);
    onErrorRef.current?.(err);
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLoading(false);
    }
  }, []);

  const getCurrentPosition = useCallback(
    (): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        if (!supported) {
          reject(
            Object.assign(new Error('Geolocation is not supported'), {
              code: 0,
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            }) as unknown as GeolocationPositionError
          );
          return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
          native => {
            const converted = convertPosition(native);
            setPosition(converted);
            setLoading(false);
            onSuccessRef.current?.(converted);
            resolve(converted);
          },
          err => {
            setError(err);
            setLoading(false);
            onErrorRef.current?.(err);
            reject(err);
          },
          options
        );
      }),
    [supported, convertPosition, options]
  );

  const watchPosition = useCallback(() => {
    if (!supported || watchIdRef.current !== null) return;

    setLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }, [supported, handleSuccess, handleError, options]);

  // Calculate distance between two points using the Haversine formula
  const calculateDistance = useCallback(
    (lat2: number, lon2: number): number | null => {
      if (!position) return null;

      const { latitude: lat1, longitude: lon1 } = position;
      const R = 6_371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;

      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(distance * 100) / 100;
    },
    [position]
  );

  const isNearby = useCallback(
    (lat2: number, lon2: number, radiusKm: number): boolean | null => {
      const distance = calculateDistance(lat2, lon2);
      return distance !== null ? distance <= radiusKm : null;
    },
    [calculateDistance]
  );

  // Auto-start watching if enabled
  useSafeEffect(() => {
    if (watch && supported) watchPosition();
    return clearWatch;
  }, [watch, supported, watchPosition, clearWatch]);

  // Cleanup on unmount
  useSafeEffect(() => clearWatch, [clearWatch]);

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

// ---------------------------------------------------------------------------

/**
 * Property location hook — extends useGeolocation with property-relative helpers.
 */
export function usePropertyLocation(
  propertyLocation?: { latitude: number; longitude: number }
) {
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 600_000, // 10 minutes for property searches
  });

  const distanceToProperty =
    propertyLocation && geolocation.position
      ? geolocation.calculateDistance(
          propertyLocation.latitude,
          propertyLocation.longitude
        )
      : null;

  const isPropertyNearby = useCallback(
    (radiusKm = 5) =>
      propertyLocation && geolocation.position
        ? geolocation.isNearby(
            propertyLocation.latitude,
            propertyLocation.longitude,
            radiusKm
          )
        : null,
    [propertyLocation, geolocation]
  );

  return { ...geolocation, distanceToProperty, isPropertyNearby };
}

// ---------------------------------------------------------------------------

/**
 * Location-based property search hook.
 */
export function useLocationBasedSearch() {
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [nearbyProperties, setNearbyProperties] = useState<Array<{
    latitude: number;
    longitude: number;
    distance?: number | null;
    [key: string]: unknown;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const cleanupManager = useEnhancedCleanupManager();

  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10_000,
  });

  const searchNearbyProperties = useCallback(
    async (radius = searchRadius) => {
      if (!geolocation.position) {
        await geolocation.getCurrentPosition();
        return;
      }

      setLoading(true);

      const controller = new AbortController();
      cleanupManager.addAbortController(controller, 'nearby-search');

      try {
        const { latitude, longitude } = geolocation.position;
        const token =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('authToken')
            : null;

        const response = await fetch(
          `/api/properties/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to search nearby properties: ${response.statusText}`
          );
        }

        const data = await response.json() as { properties?: Array<{ latitude: number; longitude: number }> };

        const propertiesWithDistance = (data.properties ?? [])
          .map((p: { latitude: number; longitude: number }) => ({
            ...p,
            distance: geolocation.calculateDistance(p.latitude, p.longitude),
          }))
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        setNearbyProperties(propertiesWithDistance);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error searching nearby properties:', err);
        setNearbyProperties([]);
      } finally {
        setLoading(false);
        cleanupManager.removeCleanup('nearby-search');
      }
    },
    [geolocation, searchRadius, cleanupManager]
  );

  const updateSearchRadius = useCallback(
    (radius: number) => {
      setSearchRadius(radius);
      if (geolocation.position) searchNearbyProperties(radius);
    },
    [geolocation.position, searchNearbyProperties]
  );

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

// ---------------------------------------------------------------------------

/**
 * Address geocoding hook.
 */
export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupManager = useEnhancedCleanupManager();

  const geocodeAddress = useCallback(
    async (address: string): Promise<GeolocationPosition | null> => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      cleanupManager.addAbortController(controller, 'geocode-request');

      try {
        const response = await fetch(
          `/api/geocode?address=${encodeURIComponent(address)}`,
          {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.results?.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          return { latitude: lat, longitude: lng, accuracy: 100, timestamp: Date.now() };
        }

        return null;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return null;
        setError(err instanceof Error ? err.message : 'Geocoding failed');
        return null;
      } finally {
        setLoading(false);
        cleanupManager.removeCleanup('geocode-request');
      }
    },
    [cleanupManager]
  );

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      cleanupManager.addAbortController(controller, 'reverse-geocode-request');

      try {
        const response = await fetch(
          `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`,
          {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Reverse geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results?.[0]?.formatted_address ?? null;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return null;
        setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
        return null;
      } finally {
        setLoading(false);
        cleanupManager.removeCleanup('reverse-geocode-request');
      }
    },
    [cleanupManager]
  );

  return { loading, error, geocodeAddress, reverseGeocode };
}