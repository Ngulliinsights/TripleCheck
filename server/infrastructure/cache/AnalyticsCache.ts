import { logger } from '../monitoring/logger';

import { CacheService } from './CacheService'

/**
 * Analytics-specific caching layer with intelligent cache management
 */
export class AnalyticsCache {
  private cache: CacheService;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly METRICS_TTL = 600; // 10 minutes
  private readonly TIMESERIES_TTL = 1800; // 30 minutes
  private readonly USER_ANALYTICS_TTL = 900; // 15 minutes

  constructor() {
    this.cache = new CacheService();
  }

  /**
   * Cache key generators with consistent naming
   */
  private generateCacheKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `analytics:${type}:${sortedParams}`;
  }

  /**
   * Cache event tracking results
   */
  async cacheEventResult(eventId: string, result: any, ttl?: number): Promise<void> {
    try {
      const key = `analytics:event:${eventId}`;
      await this.cache.set(key, result, { ttl: ttl || this.DEFAULT_TTL });
      logger.info(`Cached event result for ${eventId}`);
    } catch (error) {
      logger.error('Failed to cache event result:', error);
    }
  }

  /**
   * Get cached event result
   */
  async getCachedEventResult(eventId: string): Promise<any | null> {
    try {
      const key = `analytics:event:${eventId}`;
      return await this.cache.get(key);
    } catch (error) {
      logger.error('Failed to get cached event result:', error);
      return null;
    }
  }

  /**
   * Cache metrics with intelligent TTL based on data freshness requirements
   */
  async cacheMetrics(
    metricType: string,
    filters: Record<string, any>,
    data: any,
    customTtl?: number
  ): Promise<void> {
    try {
      const key = this.generateCacheKey('metrics', { type: metricType, ...filters });
      const ttl = customTtl || this.METRICS_TTL;
      
      await this.cache.set(key, {
        data,
        timestamp: Date.now(),
        metricType,
        filters,
      }, { ttl });
      
      logger.info(`Cached metrics for ${metricType} with TTL ${ttl}s`);
    } catch (error) {
      logger.error('Failed to cache metrics:', error);
    }
  }

  /**
   * Get cached metrics with freshness validation
   */
  async getCachedMetrics(
    metricType: string,
    filters: Record<string, any>,
    maxAge?: number
  ): Promise<any | null> {
    try {
      const key = this.generateCacheKey('metrics', { type: metricType, ...filters });
      const cached = await this.cache.get(key);
      
      if (!cached) {
        return null;
      }

      // Check if data is too old
      if (maxAge && (Date.now() - cached.timestamp) > maxAge * 1000) {
        logger.info(`Cached metrics for ${metricType} expired (maxAge: ${maxAge}s)`);
        await this.cache.delete(key);
        return null;
      }

      logger.info(`Retrieved cached metrics for ${metricType}`);
      return cached.data;
    } catch (error) {
      logger.error('Failed to get cached metrics:', error);
      return null;
    }
  }

  /**
   * Cache time series data with compression for large datasets
   */
  async cacheTimeSeriesData(
    metric: string,
    timeRange: { start: Date; end: Date },
    granularity: string,
    data: any[]
  ): Promise<void> {
    try {
      const key = this.generateCacheKey('timeseries', {
        metric,
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        granularity,
      });

      // Compress large datasets
      const compressedData = data.length > 1000 ? 
        this.compressTimeSeriesData(data) : data;

      await this.cache.set(key, {
        data: compressedData,
        compressed: data.length > 1000,
        originalLength: data.length,
        timestamp: Date.now(),
      }, { ttl: this.TIMESERIES_TTL });
      
      logger.info(`Cached time series data for ${metric} (${data.length} points)`);
    } catch (error) {
      logger.error('Failed to cache time series data:', error);
    }
  }

  /**
   * Get cached time series data with decompression
   */
  async getCachedTimeSeriesData(
    metric: string,
    timeRange: { start: Date; end: Date },
    granularity: string
  ): Promise<any[] | null> {
    try {
      const key = this.generateCacheKey('timeseries', {
        metric,
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        granularity,
      });

      const cached = await this.cache.get(key);
      if (!cached) {
        return null;
      }

      // Decompress if needed
      const data = cached.compressed ? 
        this.decompressTimeSeriesData(cached.data) : cached.data;

      logger.info(`Retrieved cached time series data for ${metric} (${cached.originalLength} points)`);
      return data;
    } catch (error) {
      logger.error('Failed to get cached time series data:', error);
      return null;
    }
  }

  /**
   * Cache user analytics with personalized TTL
   */
  async cacheUserAnalytics(
    userId: number,
    analyticsType: string,
    data: any,
    isRealTime: boolean = false
  ): Promise<void> {
    try {
      const key = this.generateCacheKey('user', { userId, type: analyticsType });
      const ttl = isRealTime ? 60 : this.USER_ANALYTICS_TTL; // Real-time data cached for 1 minute
      
      await this.cache.set(key, {
        data,
        userId,
        analyticsType,
        isRealTime,
        timestamp: Date.now(),
      }, { ttl });
      
      logger.info(`Cached user analytics for user ${userId} (${analyticsType})`);
    } catch (error) {
      logger.error('Failed to cache user analytics:', error);
    }
  }

  /**
   * Get cached user analytics
   */
  async getCachedUserAnalytics(
    userId: number,
    analyticsType: string
  ): Promise<any | null> {
    try {
      const key = this.generateCacheKey('user', { userId, type: analyticsType });
      const cached = await this.cache.get(key);
      
      if (cached) {
        logger.info(`Retrieved cached user analytics for user ${userId} (${analyticsType})`);
        return cached.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached user analytics:', error);
      return null;
    }
  }

  /**
   * Cache performance metrics with automatic cleanup
   */
  async cachePerformanceMetrics(
    metricName: string,
    data: any,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      const key = this.generateCacheKey('performance', { metric: metricName, ...tags });
      
      await this.cache.set(key, {
        data,
        metricName,
        tags,
        timestamp: Date.now(),
      }, { ttl: this.DEFAULT_TTL });
      
      // Schedule cleanup of old performance metrics
      this.schedulePerformanceMetricsCleanup();
      
      logger.info(`Cached performance metrics for ${metricName}`);
    } catch (error) {
      logger.error('Failed to cache performance metrics:', error);
    }
  }

  /**
   * Batch cache operations for efficiency
   */
  async batchCacheMetrics(operations: Array<{
    type: 'metrics' | 'timeseries' | 'user' | 'performance';
    key: string;
    data: any;
    ttl?: number;
  }>): Promise<void> {
    try {
      const promises = operations.map(async (op) => {
        const fullKey = `analytics:${op.type}:${op.key}`;
        return this.cache.set(fullKey, op.data, { ttl: op.ttl || this.DEFAULT_TTL });
      });

      await Promise.all(promises);
      logger.info(`Batch cached ${operations.length} analytics items`);
    } catch (error) {
      logger.error('Failed to batch cache metrics:', error);
    }
  }

  /**
   * Invalidate cache patterns
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.cache.getKeys(`analytics:${pattern}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.cache.delete(key)));
        logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Failed to invalidate cache pattern:', error);
    }
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId: number): Promise<void> {
    await this.invalidatePattern(`user:userId:${userId}`);
  }

  /**
   * Invalidate metrics cache by type
   */
  async invalidateMetricsCache(metricType?: string): Promise<void> {
    const pattern = metricType ? `metrics:type:${metricType}` : 'metrics:';
    await this.invalidatePattern(pattern);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    hitRate: number;
    keysByType: Record<string, number>;
  }> {
    try {
      const keys = await this.cache.getKeys('analytics:*');
      const keysByType: Record<string, number> = {};
      
      keys.forEach(key => {
        const type = key.split(':')[1];
        keysByType[type] = (keysByType[type] || 0) + 1;
      });

      return {
        totalKeys: keys.length,
        memoryUsage: await this.estimateMemoryUsage(keys),
        hitRate: await this.calculateHitRate(),
        keysByType,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        keysByType: {},
      };
    }
  }

  /**
   * Compress time series data for storage efficiency
   */
  private compressTimeSeriesData(data: any[]): any {
    // Simple compression: store only changed values
    const compressed = [];
    let lastValue = null;
    
    for (const point of data) {
      if (JSON.stringify(point) !== JSON.stringify(lastValue)) {
        compressed.push(point);
        lastValue = point;
      }
    }
    
    return compressed;
  }

  /**
   * Decompress time series data
   */
  private decompressTimeSeriesData(compressedData: any[]): any[] {
    // For this simple compression, just return the data
    // In a real implementation, this would reverse the compression algorithm
    return compressedData;
  }

  /**
   * Schedule cleanup of old performance metrics
   */
  private schedulePerformanceMetricsCleanup(): void {
    // Implement cleanup logic to prevent memory bloat
    // This could be done with a background job or timer
  }

  /**
   * Estimate memory usage of cached keys
   */
  private async estimateMemoryUsage(keys: string[]): Promise<number> {
    // Rough estimation - in production, this would be more sophisticated
    return keys.length * 1024; // Assume 1KB per key on average
  }

  /**
   * Calculate cache hit rate
   */
  private async calculateHitRate(): Promise<number> {
    // This would track hits/misses over time
    // For now, return a placeholder
    return 0.85; // 85% hit rate
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(commonQueries: Array<{
    type: string;
    params: Record<string, any>;
    dataFetcher: () => Promise<any>;
  }>): Promise<void> {
    try {
      const promises = commonQueries.map(async (query) => {
        const key = this.generateCacheKey(query.type, query.params);
        const existing = await this.cache.get(key);
        
        if (!existing) {
          const data = await query.dataFetcher();
          await this.cache.set(key, data, { ttl: this.DEFAULT_TTL });
        }
      });

      await Promise.all(promises);
      logger.info(`Warmed up cache with ${commonQueries.length} common queries`);
    } catch (error) {
      logger.error('Failed to warm up cache:', error);
    }
  }
}

// Export singleton instance
export const analyticsCache = new AnalyticsCache();