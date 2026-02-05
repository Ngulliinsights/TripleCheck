/**
 * Health Monitoring Hooks
 * React hooks for monitoring system health and performance
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { healthCheckService, SystemHealth, PerformanceMetrics, HealthCheckResult } from '../services/HealthCheckService'

/**
 * Hook for monitoring overall system health
 */
export const useSystemHealth = (autoStart: boolean = true) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const callbackId = useRef<string>();

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart]);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    callbackId.current = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    healthCheckService.onHealthUpdate(callbackId.current, (newHealth) => {
      setHealth(newHealth);
    });

    healthCheckService.startMonitoring(30000); // Check every 30 seconds
    setIsMonitoring(true);

    // Get initial health status
    const currentHealth = healthCheckService.getCurrentHealth();
    if (currentHealth) {
      setHealth(currentHealth);
    }
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    if (callbackId.current) {
      healthCheckService.offHealthUpdate(callbackId.current);
    }

    healthCheckService.stopMonitoring();
    setIsMonitoring(false);
  }, [isMonitoring]);

  const performHealthCheck = useCallback(async () => {
    const newHealth = await healthCheckService.performHealthChecks();
    setHealth(newHealth);
    return newHealth;
  }, []);

  return {
    health,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    performHealthCheck
  };
};

/**
 * Hook for monitoring specific endpoint health
 */
export const useEndpointHealth = (endpointName: string) => {
  const [healthHistory, setHealthHistory] = useState<HealthCheckResult[]>([]);
  const [currentHealth, setCurrentHealth] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = healthCheckService.getHealthHistory(endpointName, 50);
      setHealthHistory(history);
      
      if (history.length > 0) {
        setCurrentHealth(history[history.length - 1]);
      }
    } catch (error) {
      console.error('Failed to refresh endpoint health:', error);
    } finally {
      setIsLoading(false);
    }
  }, [endpointName]);

  useEffect(() => {
    refreshHealth();
    
    // Set up interval to refresh health data
    const interval = setInterval(refreshHealth, 30000);
    
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Find endpoint URL from service
      const endpoints = healthCheckService['criticalEndpoints'] || [];
      const endpoint = endpoints.find(e => e.name === endpointName);
      
      if (endpoint) {
        const result = await healthCheckService.checkEndpointHealth(
          endpointName, 
          endpoint.url, 
          endpoint.timeout
        );
        setCurrentHealth(result);
        await refreshHealth();
        return result;
      }
    } catch (error) {
      console.error('Failed to check endpoint health:', error);
    } finally {
      setIsLoading(false);
    }
  }, [endpointName, refreshHealth]);

  return {
    currentHealth,
    healthHistory,
    isLoading,
    refreshHealth,
    checkHealth
  };
};

/**
 * Hook for monitoring performance metrics
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<Map<string, PerformanceMetrics>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const refreshMetrics = useCallback(() => {
    setIsLoading(true);
    try {
      const currentMetrics = healthCheckService.getPerformanceMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
    
    // Refresh metrics every minute
    const interval = setInterval(refreshMetrics, 60000);
    
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  const getMetricsForEndpoint = useCallback((endpointName: string): PerformanceMetrics | null => {
    return metrics.get(endpointName) || null;
  }, [metrics]);

  const getAllMetrics = useCallback((): PerformanceMetrics[] => {
    return Array.from(metrics.values());
  }, [metrics]);

  return {
    metrics,
    isLoading,
    refreshMetrics,
    getMetricsForEndpoint,
    getAllMetrics
  };
};

/**
 * Hook for connection monitoring
 */
export const useConnectionMonitoring = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      setLastOnlineTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Test connection quality
    const testConnectionQuality = async () => {
      if (!navigator.onLine) return;

      try {
        const startTime = Date.now();
        const response = await fetch('/api/health/ping', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          if (responseTime < 500) {
            setConnectionQuality('good');
          } else if (responseTime < 2000) {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('poor');
          }
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection quality every 30 seconds
    const qualityInterval = setInterval(testConnectionQuality, 30000);
    
    // Initial quality test
    testConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  return {
    isOnline,
    connectionQuality,
    lastOnlineTime
  };
};

/**
 * Hook for API response time monitoring
 */
export const useApiResponseTimeMonitoring = () => {
  const [responseTimes, setResponseTimes] = useState<Map<string, number[]>>(new Map());

  const recordResponseTime = useCallback((endpoint: string, responseTime: number) => {
    setResponseTimes(prev => {
      const newMap = new Map(prev);
      const times = newMap.get(endpoint) || [];
      
      // Keep only last 50 response times
      const updatedTimes = [...times, responseTime].slice(-50);
      newMap.set(endpoint, updatedTimes);
      
      return newMap;
    });
  }, []);

  const getAverageResponseTime = useCallback((endpoint: string): number => {
    const times = responseTimes.get(endpoint) || [];
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }, [responseTimes]);

  const getResponseTimePercentile = useCallback((endpoint: string, percentile: number): number => {
    const times = responseTimes.get(endpoint) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }, [responseTimes]);

  const clearResponseTimes = useCallback((endpoint?: string) => {
    if (endpoint) {
      setResponseTimes(prev => {
        const newMap = new Map(prev);
        newMap.delete(endpoint);
        return newMap;
      });
    } else {
      setResponseTimes(new Map());
    }
  }, []);

  return {
    responseTimes,
    recordResponseTime,
    getAverageResponseTime,
    getResponseTimePercentile,
    clearResponseTimes
  };
};