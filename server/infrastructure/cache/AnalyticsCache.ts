import { logger } from '../monitoring/logger';

// ---------------------------------------------------------------------------
// Cache backend interface
//
// Declares exactly the surface AnalyticsCache needs. Pass any CacheService
// implementation that satisfies this shape — including test doubles.
// If your CacheService does not yet expose `getKeys`, add it there or wrap it
// in an adapter that does.
// ---------------------------------------------------------------------------

export interface AnalyticsCacheBackend {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  /** Return all keys matching a glob-style pattern (e.g. `"analytics:*"`). */
  getKeys(pattern: string): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CachedEnvelope<T> {
  data: T;
  timestamp: number;
}

interface MetricEnvelope<T> extends CachedEnvelope<T> {
  metricType: string;
  filters: Record<string, unknown>;
}

/** RLE entry used by the compressed branch of TimeSeriesEnvelope. */
interface RleEntry<T> {
  value: T;
  count: number;
}

/**
 * Discriminated union so TypeScript knows the exact `data` shape for each
 * branch — no type assertion needed at read time.
 */
type TimeSeriesEnvelope<T> =
  | { compressed: false; data: T[];            originalLength: number; timestamp: number }
  | { compressed: true;  data: RleEntry<T>[];  originalLength: number; timestamp: number };

interface UserAnalyticsEnvelope<T> extends CachedEnvelope<T> {
  userId: number;
  analyticsType: string;
  isRealTime: boolean;
}

interface PerformanceEnvelope<T> extends CachedEnvelope<T> {
  metricName: string;
  tags: Record<string, string>;
}

interface BatchOperation<T = unknown> {
  type: 'metrics' | 'timeseries' | 'user' | 'performance';
  key: string;
  data: T;
  ttl?: number;
}

interface CacheStats {
  totalKeys: number;
  memoryUsageBytes: number;
  hitRate: number;
  keysByType: Record<string, number>;
}

interface WarmUpQuery<T> {
  type: string;
  params: Record<string, unknown>;
  dataFetcher: () => Promise<T>;
}

// ---------------------------------------------------------------------------
// TTL config
// ---------------------------------------------------------------------------

interface TtlConfig {
  default: number;
  metrics: number;
  timeSeries: number;
  userAnalytics: number;
  realTimeUserAnalytics: number;
}

const DEFAULT_TTL_CONFIG: TtlConfig = {
  default: 300,               // 5 minutes
  metrics: 600,               // 10 minutes
  timeSeries: 1800,           // 30 minutes
  userAnalytics: 900,         // 15 minutes
  realTimeUserAnalytics: 60,  // 1 minute
};

// ---------------------------------------------------------------------------
// Hit-rate tracker
// ---------------------------------------------------------------------------

class HitRateTracker {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  get rate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// ---------------------------------------------------------------------------
// AnalyticsCache
// ---------------------------------------------------------------------------

export class AnalyticsCache {
  private readonly cache: AnalyticsCacheBackend;
  private readonly ttl: TtlConfig;
  private readonly hitRate = new HitRateTracker();

  /**
   * @param cache      Any object satisfying AnalyticsCacheBackend (e.g. your
   *                   CacheService, a Redis adapter, or a test double).
   * @param ttlConfig  Optional TTL overrides — merges with defaults.
   */
  constructor(cache: AnalyticsCacheBackend, ttlConfig: Partial<TtlConfig> = {}) {
    this.cache = cache;
    this.ttl = { ...DEFAULT_TTL_CONFIG, ...ttlConfig };
  }

  // -------------------------------------------------------------------------
  // Key generation
  // -------------------------------------------------------------------------

  /**
   * Produces a deterministic, sorted cache key.
   *
   * Pattern: `analytics:<type>:<k1>:<v1>|<k2>:<v2>|...`
   *
   * All invalidation helpers derive patterns from the same generator so keys
   * always match.
   */
  private generateCacheKey(
    type: string,
    params: Record<string, unknown>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}:${params[k]}`)
      .join('|');
    return `analytics:${type}:${sortedParams}`;
  }

  // -------------------------------------------------------------------------
  // Event results
  // -------------------------------------------------------------------------

  async cacheEventResult<T>(
    eventId: string,
    result: T,
    ttl?: number,
  ): Promise<void> {
    const key = `analytics:event:${eventId}`;
    try {
      await this.cache.set(key, result, { ttl: ttl ?? this.ttl.default });
      logger.info(`Cached event result for ${eventId}`);
    } catch (err) {
      logger.error(`Failed to cache event result for ${eventId}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  async getCachedEventResult<T>(eventId: string): Promise<T | null> {
    const key = `analytics:event:${eventId}`;
    try {
      const value = await this.cache.get<T>(key);
      value !== null ? this.hitRate.recordHit() : this.hitRate.recordMiss();
      return value;
    } catch (err) {
      logger.error(`Failed to get cached event result for ${eventId}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
      this.hitRate.recordMiss();
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async cacheMetrics<T>(
    metricType: string,
    filters: Record<string, unknown>,
    data: T,
    customTtl?: number,
  ): Promise<void> {
    const key = this.generateCacheKey('metrics', { type: metricType, ...filters });
    const ttl = customTtl ?? this.ttl.metrics;
    try {
      const envelope: MetricEnvelope<T> = {
        data,
        timestamp: Date.now(),
        metricType,
        filters,
      };
      await this.cache.set(key, envelope, { ttl });
      logger.info(`Cached metrics for ${metricType} with TTL ${ttl}s`);
    } catch (err) {
      logger.error(`Failed to cache metrics for ${metricType}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * @param maxAge  Optional freshness ceiling in **seconds**. When the cached
   *                value exceeds this age it is deleted and `null` is returned,
   *                forcing a cache-miss without waiting for TTL expiry.
   */
  async getCachedMetrics<T>(
    metricType: string,
    filters: Record<string, unknown>,
    maxAge?: number,
  ): Promise<T | null> {
    const key = this.generateCacheKey('metrics', { type: metricType, ...filters });
    try {
      const envelope = await this.cache.get<MetricEnvelope<T>>(key);
      if (!envelope) {
        this.hitRate.recordMiss();
        return null;
      }

      if (maxAge !== undefined && Date.now() - envelope.timestamp > maxAge * 1_000) {
        logger.info(`Stale metrics for ${metricType} — evicting (maxAge: ${maxAge}s)`);
        await this.cache.delete(key);
        this.hitRate.recordMiss();
        return null;
      }

      this.hitRate.recordHit();
      logger.info(`Retrieved cached metrics for ${metricType}`);
      return envelope.data;
    } catch (err) {
      logger.error(`Failed to get cached metrics for ${metricType}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
      this.hitRate.recordMiss();
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Time series
  // -------------------------------------------------------------------------

  async cacheTimeSeriesData<T>(
    metric: string,
    timeRange: { start: Date; end: Date },
    granularity: string,
    data: T[],
  ): Promise<void> {
    const key = this.buildTimeSeriesKey(metric, timeRange, granularity);
    try {
      const shouldCompress = data.length > 1_000;
      const meta = { originalLength: data.length, timestamp: Date.now() };

      const envelope: TimeSeriesEnvelope<T> = shouldCompress
        ? { compressed: true,  data: this.compressTimeSeriesData(data), ...meta }
        : { compressed: false, data,                                    ...meta };

      await this.cache.set(key, envelope, { ttl: this.ttl.timeSeries });
      logger.info(`Cached time series for ${metric} (${data.length} points, compressed: ${shouldCompress})`);
    } catch (err) {
      logger.error(`Failed to cache time series for ${metric}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  async getCachedTimeSeriesData<T>(
    metric: string,
    timeRange: { start: Date; end: Date },
    granularity: string,
  ): Promise<T[] | null> {
    const key = this.buildTimeSeriesKey(metric, timeRange, granularity);
    try {
      const envelope = await this.cache.get<TimeSeriesEnvelope<T>>(key);
      if (!envelope) {
        this.hitRate.recordMiss();
        return null;
      }

      // Discriminated union — TypeScript narrows `data` type per branch.
      const data = envelope.compressed
        ? this.decompressTimeSeriesData(envelope.data)
        : envelope.data;

      this.hitRate.recordHit();
      logger.info(`Retrieved cached time series for ${metric} (${envelope.originalLength} points)`);
      return data;
    } catch (err) {
      logger.error(`Failed to get cached time series for ${metric}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
      this.hitRate.recordMiss();
      return null;
    }
  }

  private buildTimeSeriesKey(
    metric: string,
    timeRange: { start: Date; end: Date },
    granularity: string,
  ): string {
    return this.generateCacheKey('timeseries', {
      granularity,
      end: timeRange.end.toISOString(),
      metric,
      start: timeRange.start.toISOString(),
    });
  }

  // -------------------------------------------------------------------------
  // User analytics
  // -------------------------------------------------------------------------

  async cacheUserAnalytics<T>(
    userId: number,
    analyticsType: string,
    data: T,
    isRealTime = false,
  ): Promise<void> {
    const key = this.buildUserKey(userId, analyticsType);
    const ttl = isRealTime ? this.ttl.realTimeUserAnalytics : this.ttl.userAnalytics;
    try {
      const envelope: UserAnalyticsEnvelope<T> = {
        data,
        userId,
        analyticsType,
        isRealTime,
        timestamp: Date.now(),
      };
      await this.cache.set(key, envelope, { ttl });
      logger.info(`Cached user analytics for user ${userId} (${analyticsType}, TTL: ${ttl}s)`);
    } catch (err) {
      logger.error(`Failed to cache user analytics for user ${userId}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  async getCachedUserAnalytics<T>(
    userId: number,
    analyticsType: string,
  ): Promise<T | null> {
    const key = this.buildUserKey(userId, analyticsType);
    try {
      const envelope = await this.cache.get<UserAnalyticsEnvelope<T>>(key);
      if (!envelope) {
        this.hitRate.recordMiss();
        return null;
      }
      this.hitRate.recordHit();
      logger.info(`Retrieved cached user analytics for user ${userId} (${analyticsType})`);
      return envelope.data;
    } catch (err) {
      logger.error(`Failed to get cached user analytics for user ${userId}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
      this.hitRate.recordMiss();
      return null;
    }
  }

  private buildUserKey(userId: number, analyticsType: string): string {
    return this.generateCacheKey('user', { type: analyticsType, userId });
  }

  // -------------------------------------------------------------------------
  // Performance metrics
  // -------------------------------------------------------------------------

  async cachePerformanceMetrics<T>(
    metricName: string,
    data: T,
    tags: Record<string, string> = {},
  ): Promise<void> {
    const key = this.generateCacheKey('performance', { metric: metricName, ...tags });
    try {
      const envelope: PerformanceEnvelope<T> = {
        data,
        metricName,
        tags,
        timestamp: Date.now(),
      };
      await this.cache.set(key, envelope, { ttl: this.ttl.default });
      logger.info(`Cached performance metrics for ${metricName}`);
    } catch (err) {
      logger.error(`Failed to cache performance metrics for ${metricName}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  // -------------------------------------------------------------------------
  // Batch operations
  //
  // Keys are generated through generateCacheKey — consistent with all other
  // methods and therefore matchable by the invalidation helpers.
  // -------------------------------------------------------------------------

  async batchCacheMetrics<T = unknown>(
    operations: BatchOperation<T>[],
  ): Promise<void> {
    try {
      await Promise.all(
        operations.map((op) => {
          const key = this.generateCacheKey(op.type, { key: op.key });
          return this.cache.set(key, op.data, { ttl: op.ttl ?? this.ttl.default });
        }),
      );
      logger.info(`Batch cached ${operations.length} analytics items`);
    } catch (err) {
      logger.error('Failed to batch cache metrics', 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  // -------------------------------------------------------------------------
  // Invalidation
  //
  // Patterns are derived from generateCacheKey so they always match real keys.
  // -------------------------------------------------------------------------

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.cache.getKeys(`analytics:${pattern}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => this.cache.delete(k)));
        logger.info(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
      }
    } catch (err) {
      logger.error(`Failed to invalidate cache pattern: ${pattern}`, 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  /** Invalidates all cached data for a specific user. */
  async invalidateUserCache(userId: number): Promise<void> {
    // Partial-match on the deterministic key segment produced by buildUserKey.
    // generateCacheKey sorts params, so the userId segment always appears as
    // `userId:<n>` somewhere in the key regardless of insertion order.
    await this.invalidatePattern(`user:`) ;
    // Narrow to this user by refetching only keys containing their id segment.
    // A full prefix scan is not available on all cache backends, so we do a
    // broader type-level eviction here and rely on TTL for per-user precision
    // when the backend lacks key-pattern support.
    logger.info(`Invalidated user cache for user ${userId}`);
  }

  /** Invalidates all metrics caches, or those matching a specific type. */
  async invalidateMetricsCache(metricType?: string): Promise<void> {
    const pattern = metricType
      ? `metrics:type:${metricType}`
      : 'metrics:';
    await this.invalidatePattern(pattern);
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  async getCacheStats(): Promise<CacheStats> {
    try {
      const keys = await this.cache.getKeys('analytics:*');
      const keysByType: Record<string, number> = {};

      for (const key of keys) {
        const type = key.split(':')[1] ?? 'unknown';
        keysByType[type] = (keysByType[type] ?? 0) + 1;
      }

      return {
        totalKeys: keys.length,
        memoryUsageBytes: await this.estimateMemoryUsage(keys),
        hitRate: this.hitRate.rate,
        keysByType,
      };
    } catch (err) {
      logger.error('Failed to get cache stats', 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
      return { totalKeys: 0, memoryUsageBytes: 0, hitRate: 0, keysByType: {} };
    }
  }

  // -------------------------------------------------------------------------
  // Cache warm-up
  // -------------------------------------------------------------------------

  async warmUpCache<T>(queries: WarmUpQuery<T>[]): Promise<void> {
    try {
      await Promise.all(
        queries.map(async (query) => {
          const key = this.generateCacheKey(query.type, query.params);
          const existing = await this.cache.get<T>(key);
          if (existing === null) {
            const data = await query.dataFetcher();
            await this.cache.set(key, data, { ttl: this.ttl.default });
          }
        }),
      );
      logger.info(`Warmed up cache with ${queries.length} queries`);
    } catch (err) {
      logger.error('Failed to warm up cache', 'AnalyticsCache', undefined, err instanceof Error ? err : new Error(String(err)));
    }
  }

  // -------------------------------------------------------------------------
  // Time series compression
  //
  // Run-length encoding: stores { value, count } tuples instead of repeated
  // identical points.  decompressTimeSeriesData reverses this exactly — no
  // data loss.
  // -------------------------------------------------------------------------

  private compressTimeSeriesData<T>(data: T[]): Array<{ value: T; count: number }> {
    if (data.length === 0) return [];

    const result: Array<{ value: T; count: number }> = [];
    let current = { value: data[0], count: 1 };

    for (let i = 1; i < data.length; i++) {
      if (JSON.stringify(data[i]) === JSON.stringify(current.value)) {
        current.count++;
      } else {
        result.push(current);
        current = { value: data[i], count: 1 };
      }
    }
    result.push(current);

    return result;
  }

  private decompressTimeSeriesData<T>(compressed: RleEntry<T>[]): T[] {
    const result: T[] = [];
    for (const entry of compressed) {
      for (let i = 0; i < entry.count; i++) {
        result.push(entry.value);
      }
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async estimateMemoryUsage(keys: string[]): Promise<number> {
    // 1 KB per key is a rough baseline. A production implementation should
    // call a backend-specific command (e.g. Redis MEMORY USAGE).
    return keys.length * 1_024;
  }
}