/**
 * Health Monitoring Hooks
 * React hooks for monitoring system health and performance.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  healthCheckService,
  SystemHealth,
  PerformanceMetrics,
  HealthCheckResult,
} from '../services/HealthCheckService'

// ---------------------------------------------------------------------------
// useSystemHealth
// ---------------------------------------------------------------------------

export function useSystemHealth(autoStart = true) {
  const [health,       setHealth]       = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const callbackIdRef                   = useRef<string>();

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    callbackIdRef.current = `health_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    healthCheckService.onHealthUpdate(callbackIdRef.current, setHealth);
    healthCheckService.startMonitoring(30_000);
    setIsMonitoring(true);

    const current = healthCheckService.getCurrentHealth();
    if (current) setHealth(current);
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    if (callbackIdRef.current) healthCheckService.offHealthUpdate(callbackIdRef.current);
    healthCheckService.stopMonitoring();
    setIsMonitoring(false);
  }, [isMonitoring]);

  const performHealthCheck = useCallback(async () => {
    const next = await healthCheckService.performHealthChecks();
    setHealth(next);
    return next;
  }, []);

  useEffect(() => {
    if (autoStart) startMonitoring();
    return () => stopMonitoring();
  }, [autoStart]); // eslint-disable-line

  return { health, isMonitoring, startMonitoring, stopMonitoring, performHealthCheck };
}

// ---------------------------------------------------------------------------
// useEndpointHealth
// ---------------------------------------------------------------------------

export function useEndpointHealth(endpointName: string) {
  const [healthHistory,  setHealthHistory]  = useState<HealthCheckResult[]>([]);
  const [currentHealth,  setCurrentHealth]  = useState<HealthCheckResult | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);

  const refreshHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = healthCheckService.getHealthHistory(endpointName, 50);
      setHealthHistory(history);
      if (history.length > 0) setCurrentHealth(history[history.length - 1]!);
    } catch (err) {
      console.error('Failed to refresh endpoint health:', err);
    } finally {
      setIsLoading(false);
    }
  }, [endpointName]);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Access the critical endpoints list through the public API if possible,
      // otherwise fall back to the internal property.
      const endpoints: Array<{ name: string; url: string; timeout: number }> =
        (healthCheckService as unknown as { criticalEndpoints?: Array<{ name: string; url: string; timeout: number }> })
          .criticalEndpoints ?? [];

      const endpoint = endpoints.find((e) => e.name === endpointName);
      if (!endpoint) return;

      const result = await healthCheckService.checkEndpointHealth(
        endpointName, endpoint.url, endpoint.timeout,
      );
      setCurrentHealth(result);
      await refreshHealth();
      return result;
    } catch (err) {
      console.error('Failed to check endpoint health:', err);
    } finally {
      setIsLoading(false);
    }
  }, [endpointName, refreshHealth]);

  useEffect(() => {
    refreshHealth();
    const id = setInterval(refreshHealth, 30_000);
    return () => clearInterval(id);
  }, [refreshHealth]);

  return { currentHealth, healthHistory, isLoading, refreshHealth, checkHealth };
}

// ---------------------------------------------------------------------------
// usePerformanceMetrics
// ---------------------------------------------------------------------------

export function usePerformanceMetrics() {
  const [metrics,   setMetrics]   = useState<Map<string, PerformanceMetrics>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const refreshMetrics = useCallback(() => {
    setIsLoading(true);
    try {
      setMetrics(healthCheckService.getPerformanceMetrics());
    } catch (err) {
      console.error('Failed to refresh performance metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
    const id = setInterval(refreshMetrics, 60_000);
    return () => clearInterval(id);
  }, [refreshMetrics]);

  const getMetricsForEndpoint = useCallback(
    (name: string) => metrics.get(name) ?? null,
    [metrics],
  );
  const getAllMetrics = useCallback(() => Array.from(metrics.values()), [metrics]);

  return { metrics, isLoading, refreshMetrics, getMetricsForEndpoint, getAllMetrics };
}

// ---------------------------------------------------------------------------
// useConnectionMonitoring
// ---------------------------------------------------------------------------

export function useConnectionMonitoring() {
  const [isOnline,          setIsOnline]          = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastOnlineTime,    setLastOnlineTime]    = useState<Date | null>(null);

  useEffect(() => {
    const testQuality = async () => {
      if (!navigator.onLine) return;
      try {
        const t0  = Date.now();
        const res = await fetch('/api/health/ping', { method: 'HEAD', cache: 'no-cache' });
        const ms  = Date.now() - t0;
        setConnectionQuality(res.ok && ms < 2_000 ? (ms < 500 ? 'good' : 'poor') : 'poor');
      } catch {
        setConnectionQuality('poor');
      }
    };

    const onOnline  = () => { setIsOnline(true);  setConnectionQuality('good'); setLastOnlineTime(new Date()); };
    const onOffline = () => { setIsOnline(false); setConnectionQuality('offline'); };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    const id = setInterval(testQuality, 30_000);
    testQuality();

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(id);
    };
  }, []);

  return { isOnline, connectionQuality, lastOnlineTime };
}

// ---------------------------------------------------------------------------
// useApiResponseTimeMonitoring
// ---------------------------------------------------------------------------

export function useApiResponseTimeMonitoring() {
  const [responseTimes, setResponseTimes] = useState<Map<string, number[]>>(new Map());

  const recordResponseTime = useCallback((endpoint: string, ms: number) => {
    setResponseTimes((prev) => {
      const map   = new Map(prev);
      const times = [...(map.get(endpoint) ?? []), ms].slice(-50);
      map.set(endpoint, times);
      return map;
    });
  }, []);

  const getAverageResponseTime = useCallback((endpoint: string) => {
    const times = responseTimes.get(endpoint) ?? [];
    return times.length === 0 ? 0 : times.reduce((a, b) => a + b, 0) / times.length;
  }, [responseTimes]);

  const getResponseTimePercentile = useCallback((endpoint: string, percentile: number) => {
    const times = responseTimes.get(endpoint) ?? [];
    if (times.length === 0) return 0;
    const sorted = [...times].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1)]!;
  }, [responseTimes]);

  const clearResponseTimes = useCallback((endpoint?: string) => {
    if (endpoint) {
      setResponseTimes((prev) => { const m = new Map(prev); m.delete(endpoint); return m; });
    } else {
      setResponseTimes(new Map());
    }
  }, []);

  return { responseTimes, recordResponseTime, getAverageResponseTime, getResponseTimePercentile, clearResponseTimes };
}