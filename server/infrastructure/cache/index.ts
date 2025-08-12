/**
 * Unified Cache System - Main Export
 * 
 * Provides a comprehensive caching solution with L1/L2 architecture,
 * intelligent warming strategies, and backward compatibility.
 */

// Core cache manager
export { 
  UnifiedCacheManager, 
  unifiedCacheManager,
  type UnifiedCacheConfig,
  type CacheResult,
  type CacheStats
} from './UnifiedCacheManager';

// Integration adapters for backward compatibility
export {
  CacheServiceAdapter,
  EnhancedCacheService,
  CacheFactory,
  defaultCache,
  propertyCache,
  userCache,
  fraudCache,
  analyticsCache,
  cacheService // Backward compatibility
} from './CacheIntegrationAdapter';

// Cache warming strategies
export {
  CacheWarmingManager,
  cacheWarmingManager,
  type WarmingConfig,
  type WarmingStrategy,
  type WarmingResult,
  type WarmingStats
} from './CacheWarmingStrategy';

// Legacy cache service (for gradual migration)
export { CacheService, cacheService as legacyCacheService } from './CacheService';

// Performance monitoring
export { 
  cachePerformanceMonitor,
  type CacheMetrics,
  type UnifiedCacheMetrics
} from '../monitoring/CachePerformanceMonitor';

/**
 * Quick setup function for common cache configurations
 */
export function setupCache(environment: 'development' | 'production' | 'test' = 'development') {
  const config = {
    development: {
      l1MaxItems: 1000,
      l1DefaultTtl: 5 * 60 * 1000, // 5 minutes
      l2DefaultTtl: 1800, // 30 minutes
      enablePreFetching: false,
      enableMetrics: true,
      redisUrl: process.env.REDIS_URL
    },
    production: {
      l1MaxItems: 10000,
      l1DefaultTtl: 5 * 60 * 1000, // 5 minutes
      l2DefaultTtl: 3600, // 1 hour
      enablePreFetching: true,
      enableMetrics: true,
      redisUrl: process.env.REDIS_URL
    },
    test: {
      l1MaxItems: 100,
      l1DefaultTtl: 1000, // 1 second
      l2DefaultTtl: 10, // 10 seconds
      enablePreFetching: false,
      enableMetrics: false,
      redisUrl: undefined // Disable Redis for tests
    }
  };

  return UnifiedCacheManager.getInstance(config[environment]);
}

/**
 * Cache health check utility
 */
export async function checkCacheHealth() {
  const cache = unifiedCacheManager;
  const stats = cache.getStats();
  
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    l1Cache: {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      size: stats.l1.size,
      hitRate: stats.l1.hitRate,
      memoryUsage: stats.l1.memoryUsageMB
    },
    l2Cache: {
      status: stats.l2.connected ? 'healthy' : 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
      connected: stats.l2.connected,
      hitRate: stats.l2.hitRate,
      errors: stats.l2.errors
    },
    overall: {
      hitRate: stats.overall.hitRate,
      totalRequests: stats.overall.totalRequests,
      averageLatency: stats.overall.averageLatency
    }
  };

  // Determine overall health
  if (!stats.l2.connected && process.env.REDIS_URL) {
    health.status = 'degraded';
  }
  
  if (stats.l1.hitRate < 0.5 || stats.overall.averageLatency > 100) {
    health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy';
  }

  return health;
}

/**
 * Cache performance optimization recommendations
 */
export function getCacheRecommendations() {
  const stats = unifiedCacheManager.getStats();
  const recommendations: string[] = [];

  if (stats.l1.hitRate < 0.7) {
    recommendations.push('Consider increasing L1 cache TTL or size to improve hit rate');
  }

  if (stats.l1.memoryUsageMB > stats.l1.maxMemoryMB * 0.8) {
    recommendations.push('L1 cache memory usage is high, consider increasing memory limit or optimizing data size');
  }

  if (stats.l1.evictions > stats.l1.size * 0.1) {
    recommendations.push('High eviction rate detected, consider increasing L1 cache size');
  }

  if (!stats.l2.connected && process.env.REDIS_URL) {
    recommendations.push('L2 cache (Redis) is not connected, check Redis configuration');
  }

  if (stats.l2.errors > 0) {
    recommendations.push('L2 cache errors detected, check Redis connectivity and configuration');
  }

  if (stats.overall.averageLatency > 50) {
    recommendations.push('High average latency detected, consider optimizing cache operations or data serialization');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal');
  }

  return recommendations;
}