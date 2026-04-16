/**
 * Unified Multi-Level Cache Manager
 *
 * L1: In-memory LRU cache (10 K items, 5 min TTL) — microsecond access.
 * L2: Redis (1 hr TTL) — distributed persistence.
 *
 * Highlights vs. original:
 * - O(1) LRU via Map insertion-order trick (no more O(n) array splice).
 * - Tag index (in-memory Map + Redis Sets) eliminates full-scan invalidation.
 * - Redis round-trip latency tracked with an exponentially-weighted moving avg.
 * - Usage-pattern map is bounded and pruned to prevent unbounded growth.
 * - getOrSet timeout errors are re-thrown correctly instead of being silenced.
 * - sanitizeKey no longer lowercases (prevents User:1 ↔ user:1 collisions).
 */

import { createHash } from 'crypto';
import Redis, { RedisOptions } from 'ioredis';
import { cachePerformanceMonitor } from '../monitoring/CachePerformanceMonitor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface L1CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  tags: Set<string>;
  size: number; // bytes (estimated)
}

export interface UnifiedCacheConfig {
  // L1
  l1MaxItems: number;
  l1DefaultTtl: number;   // ms
  l1MaxMemoryMB: number;

  // L2
  l2DefaultTtl: number;   // seconds
  l2KeyPrefix: string;
  l2TagPrefix: string;    // prefix for Redis tag-index sets

  // Redis
  redisUrl?: string;
  redisOptions?: RedisOptions;

  // Pre-fetching
  enablePreFetching: boolean;
  preFetchThreshold: number;
  maxUsagePatterns: number;   // cap on tracked keys

  // Stampede protection
  enableStampedeProtection: boolean;
  stampedeTimeout: number;    // ms

  // Monitoring
  enableMetrics: boolean;
  metricsInterval: number;    // ms
}

export interface CacheResult<T = unknown> {
  value: T | null;
  hit: boolean;
  source: 'l1' | 'l2' | 'miss';
  latency: number;
  tags?: string[];
}

export interface CacheStats {
  l1: {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsageMB: number;
    maxMemoryMB: number;
    evictions: number;
  };
  l2: {
    connected: boolean;
    hitRate: number;
    errors: number;
    latencyMs: number;
  };
  overall: {
    hitRate: number;
    totalRequests: number;
    averageLatency: number;
  };
}

interface PendingOperation<T> {
  promise: Promise<T>;
  timestamp: number;
  requestCount: number;
}

interface UsagePattern {
  key: string;
  accessCount: number;
  lastAccessed: number;
  averageInterval: number; // ms, EWMA
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;

  // L1: Map preserves insertion order — we delete + re-insert on access for O(1) LRU.
  private l1Cache = new Map<string, L1CacheEntry>();
  private l1MemoryUsage = 0;

  // In-process tag → key index for O(1) L1 tag invalidation.
  private tagIndex = new Map<string, Set<string>>();

  // L2
  private redis?: Redis;
  private redisConnected = false;
  private l2LatencyEwma = 0; // ms, α = 0.1

  // Stampede protection
  private pendingOperations = new Map<string, PendingOperation<unknown>>();

  // Usage patterns (bounded)
  private usagePatterns = new Map<string, UsagePattern>();

  private metrics = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalRequests: 0,
    l1Evictions: 0,
    l2Errors: 0,
    totalLatency: 0,
  };

  private config: UnifiedCacheConfig;

  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private preFetchInterval?: NodeJS.Timeout;

  // ---------------------------------------------------------------------------
  // Construction & singleton
  // ---------------------------------------------------------------------------

  constructor(config: Partial<UnifiedCacheConfig> = {}) {
    this.config = {
      l1MaxItems: 10_000,
      l1DefaultTtl: 5 * 60 * 1_000,
      l1MaxMemoryMB: 50,

      l2DefaultTtl: 3_600,
      l2KeyPrefix: 'unified:',
      l2TagPrefix: 'tag:',

      redisUrl: process.env.REDIS_URL,
      redisOptions: {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30_000,
      },

      enablePreFetching: true,
      preFetchThreshold: 5,
      maxUsagePatterns: 5_000,

      enableStampedeProtection: true,
      stampedeTimeout: 30_000,

      enableMetrics: true,
      metricsInterval: 60_000,

      ...config,
    };

    this.initializeRedis();
    this.startBackgroundTasks();
  }

  static getInstance(config?: Partial<UnifiedCacheConfig>): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager(config);
    }
    return UnifiedCacheManager.instance;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Read from L1 → L2 → miss. */
  async get<T>(key: string, tags?: string[]): Promise<CacheResult<T>> {
    const start = Date.now();
    this.metrics.totalRequests++;
    const k = this.sanitizeKey(key);
    this.updateUsagePattern(k);

    const l1 = this.getFromL1<T>(k);
    if (l1.hit) {
      const latency = Date.now() - start;
      this.metrics.l1Hits++;
      this.metrics.totalLatency += latency;
      this.config.enableMetrics && cachePerformanceMonitor.recordCacheHit(k, latency);
      return { value: l1.value, hit: true, source: 'l1', latency, tags: l1.tags && Array.from(l1.tags) };
    }
    this.metrics.l1Misses++;

    const l2 = await this.getFromL2<T>(k);
    if (l2.hit && l2.value !== null) {
      const latency = Date.now() - start;
      this.metrics.l2Hits++;
      this.metrics.totalLatency += latency;
      this.setInL1(k, l2.value, this.config.l1DefaultTtl, tags);
      this.config.enableMetrics && cachePerformanceMonitor.recordCacheHit(k, latency);
      return { value: l2.value, hit: true, source: 'l2', latency, tags };
    }
    this.metrics.l2Misses++;

    const latency = Date.now() - start;
    this.metrics.totalLatency += latency;
    this.config.enableMetrics && cachePerformanceMonitor.recordCacheMiss(k, latency);
    return { value: null, hit: false, source: 'miss', latency, tags };
  }

  /** Write to both L1 and L2. */
  async set<T>(
    key: string,
    value: T,
    options: { l1Ttl?: number; l2Ttl?: number; tags?: string[] } = {},
  ): Promise<void> {
    const k = this.sanitizeKey(key);
    this.setInL1(k, value, options.l1Ttl ?? this.config.l1DefaultTtl, options.tags);
    await this.setInL2(k, value, options.l2Ttl ?? this.config.l2DefaultTtl, options.tags);
  }

  /**
   * Cache-aside with stampede protection.
   * The factory is called at most once per key even under concurrent pressure.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: { l1Ttl?: number; l2Ttl?: number; tags?: string[] } = {},
  ): Promise<T> {
    const k = this.sanitizeKey(key);

    const cached = await this.get<T>(k, options.tags);
    if (cached.hit && cached.value !== null) return cached.value;

    if (this.config.enableStampedeProtection) {
      const pending = this.pendingOperations.get(k) as PendingOperation<T> | undefined;
      if (pending) {
        pending.requestCount++;
        // Re-throw any timeout so callers are aware.
        return Promise.race([
          pending.promise,
          this.createTimeoutPromise<T>(this.config.stampedeTimeout),
        ]);
      }
    }

    const operation = factory();

    if (this.config.enableStampedeProtection) {
      this.pendingOperations.set(k, { promise: operation as Promise<unknown>, timestamp: Date.now(), requestCount: 1 });
    }

    try {
      const result = await operation;
      await this.set(k, result, options);
      return result;
    } finally {
      this.config.enableStampedeProtection && this.pendingOperations.delete(k);
    }
  }

  /** Delete a single key from both tiers. */
  async delete(key: string): Promise<boolean> {
    const k = this.sanitizeKey(key);
    const l1 = this.deleteFromL1(k);
    const l2 = await this.deleteFromL2(k);
    return l1 || l2;
  }

  /**
   * Invalidate all keys sharing at least one of the given tags.
   *
   * L1: O(keys-per-tag) via in-process tag index.
   * L2: O(keys-per-tag) via Redis Set members — no full-scan needed.
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;

    // L1 invalidation via tag index
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (!keys) continue;
      for (const key of keys) {
        if (this.deleteFromL1(key)) count++;
      }
    }

    // L2 invalidation via Redis Sets
    if (this.redis && this.redisConnected) {
      try {
        const pipeline = this.redis.pipeline();

        for (const tag of tags) {
          pipeline.smembers(this.l2TagKey(tag));
        }

        const results = await pipeline.exec();
        if (!results) return count;

        const keysToDelete = new Set<string>();
        for (const [err, members] of results) {
          if (!err && Array.isArray(members)) {
            for (const m of members as string[]) keysToDelete.add(m);
          }
        }

        if (keysToDelete.size > 0) {
          const delPipeline = this.redis.pipeline();
          for (const k of keysToDelete) {
            delPipeline.del(k);
            count++;
          }
          // Remove keys from all tag sets
          for (const tag of tags) {
            delPipeline.del(this.l2TagKey(tag));
          }
          await delPipeline.exec();
        }
      } catch (err) {
        this.metrics.l2Errors++;
        console.warn('Redis tag invalidation failed:', err);
      }
    }

    return count;
  }

  /** Flush both tiers entirely. */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    this.tagIndex.clear();
    this.l1MemoryUsage = 0;

    if (this.redis && this.redisConnected) {
      try {
        const keys = await this.redis.keys(`${this.config.l2KeyPrefix}*`);
        if (keys.length > 0) await this.redis.del(...keys);
      } catch (err) {
        this.metrics.l2Errors++;
        console.warn('Redis clear failed:', err);
      }
    }
  }

  getStats(): CacheStats {
    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
    const l1Total = this.metrics.l1Hits + this.metrics.l1Misses;
    const l2Total = this.metrics.l2Hits + this.metrics.l2Misses;

    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.config.l1MaxItems,
        hitRate: safeDiv(this.metrics.l1Hits, l1Total),
        memoryUsageMB: this.l1MemoryUsage / (1024 * 1024),
        maxMemoryMB: this.config.l1MaxMemoryMB,
        evictions: this.metrics.l1Evictions,
      },
      l2: {
        connected: this.redisConnected,
        hitRate: safeDiv(this.metrics.l2Hits, l2Total),
        errors: this.metrics.l2Errors,
        latencyMs: this.l2LatencyEwma,
      },
      overall: {
        hitRate: safeDiv(
          this.metrics.l1Hits + this.metrics.l2Hits,
          this.metrics.totalRequests,
        ),
        totalRequests: this.metrics.totalRequests,
        averageLatency: safeDiv(this.metrics.totalLatency, this.metrics.totalRequests),
      },
    };
  }

  async destroy(): Promise<void> {
    clearInterval(this.cleanupInterval);
    clearInterval(this.metricsInterval);
    clearInterval(this.preFetchInterval);
    if (this.redis) await this.redis.quit();
    this.l1Cache.clear();
    this.tagIndex.clear();
    this.pendingOperations.clear();
    this.usagePatterns.clear();
  }

  // ---------------------------------------------------------------------------
  // Private — L1
  // ---------------------------------------------------------------------------

  private getFromL1<T>(key: string): { hit: boolean; value: T | null; tags?: Set<string> } {
    const entry = this.l1Cache.get(key);
    if (!entry) return { hit: false, value: null };

    if (Date.now() > entry.expiresAt) {
      this.deleteFromL1(key);
      return { hit: false, value: null };
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // O(1) LRU promotion: delete + re-insert moves to Map tail.
    this.l1Cache.delete(key);
    this.l1Cache.set(key, entry);

    return { hit: true, value: entry.value as T, tags: entry.tags };
  }

  private setInL1<T>(key: string, value: T, ttl: number, tags?: string[]): void {
    const size = this.estimateSize(value);
    this.ensureL1Capacity(size);

    const existing = this.l1Cache.get(key);
    if (existing) {
      this.l1MemoryUsage -= existing.size;
      // Remove from old tag index entries
      for (const tag of existing.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }

    const tagSet = new Set(tags ?? []);
    const entry: L1CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      tags: tagSet,
      size,
    };

    // Delete first so re-insert lands at Map tail (LRU order).
    this.l1Cache.delete(key);
    this.l1Cache.set(key, entry);
    this.l1MemoryUsage += size;

    // Update tag index
    for (const tag of tagSet) {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private deleteFromL1(key: string): boolean {
    const entry = this.l1Cache.get(key);
    if (!entry) return false;

    this.l1Cache.delete(key);
    this.l1MemoryUsage -= entry.size;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) this.tagIndex.delete(tag);
      }
    }

    return true;
  }

  /** Evict LRU entries (Map head = oldest) until capacity is satisfied. */
  private ensureL1Capacity(newEntrySize: number): void {
    const maxBytes = this.config.l1MaxMemoryMB * 1024 * 1024;

    while (
      this.l1Cache.size >= this.config.l1MaxItems ||
      this.l1MemoryUsage + newEntrySize > maxBytes
    ) {
      // Map.keys().next() returns the oldest (insertion-order head).
      const oldest = this.l1Cache.keys().next().value;
      if (!oldest) break;
      this.deleteFromL1(oldest);
      this.metrics.l1Evictions++;
    }
  }

  private cleanupExpiredL1Entries(): void {
    const now = Date.now();
    for (const [key, entry] of this.l1Cache) {
      if (now > entry.expiresAt) this.deleteFromL1(key);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — L2
  // ---------------------------------------------------------------------------

  private l2Key(key: string): string {
    return `${this.config.l2KeyPrefix}${key}`;
  }

  private l2TagKey(tag: string): string {
    return `${this.config.l2KeyPrefix}${this.config.l2TagPrefix}${tag}`;
  }

  private async getFromL2<T>(key: string): Promise<{ hit: boolean; value: T | null }> {
    if (!this.redis || !this.redisConnected) return { hit: false, value: null };

    const t0 = Date.now();
    try {
      const data = await this.redis.get(this.l2Key(key));
      this.recordL2Latency(Date.now() - t0);
      if (!data) return { hit: false, value: null };
      const parsed = JSON.parse(data) as { value: T };
      return { hit: true, value: parsed.value };
    } catch {
      this.metrics.l2Errors++;
      return { hit: false, value: null };
    }
  }

  private async setInL2<T>(key: string, value: T, ttl: number, tags?: string[]): Promise<void> {
    if (!this.redis || !this.redisConnected) return;

    const fullKey = this.l2Key(key);
    const t0 = Date.now();
    try {
      const pipeline = this.redis.pipeline();
      pipeline.setex(fullKey, ttl, JSON.stringify({ value, tags: tags ?? [], timestamp: Date.now() }));

      // Register key under each tag set with same TTL.
      for (const tag of tags ?? []) {
        pipeline.sadd(this.l2TagKey(tag), fullKey);
        pipeline.expire(this.l2TagKey(tag), ttl);
      }

      await pipeline.exec();
      this.recordL2Latency(Date.now() - t0);
    } catch (err) {
      this.metrics.l2Errors++;
      console.warn('Redis set failed:', err);
    }
  }

  private async deleteFromL2(key: string): Promise<boolean> {
    if (!this.redis || !this.redisConnected) return false;

    try {
      const result = await this.redis.del(this.l2Key(key));
      return result > 0;
    } catch {
      this.metrics.l2Errors++;
      return false;
    }
  }

  private recordL2Latency(ms: number): void {
    const α = 0.1;
    this.l2LatencyEwma = this.l2LatencyEwma === 0
      ? ms
      : α * ms + (1 - α) * this.l2LatencyEwma;
  }

  // ---------------------------------------------------------------------------
  // Private — Redis init
  // ---------------------------------------------------------------------------

  private initializeRedis(): void {
    if (!this.config.redisUrl) {
      console.warn('UnifiedCacheManager: Redis URL not set — L2 cache disabled.');
      return;
    }
    try {
      this.redis = new Redis(this.config.redisUrl, this.config.redisOptions || {});
      this.redis.on('connect', () => { this.redisConnected = true; });
      this.redis.on('error', (err: Error) => {
        this.redisConnected = false;
        this.metrics.l2Errors++;
        console.warn('Redis error:', err.message);
      });
      this.redis.on('close', () => { this.redisConnected = false; });
    } catch (err) {
      console.warn('UnifiedCacheManager: failed to init Redis:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — usage patterns & pre-fetching
  // ---------------------------------------------------------------------------

  private updateUsagePattern(key: string): void {
    if (!this.config.enablePreFetching) return;

    const now = Date.now();
    const existing = this.usagePatterns.get(key);

    if (existing) {
      const interval = now - existing.lastAccessed;
      existing.averageInterval = existing.averageInterval === 0
        ? interval
        : 0.2 * interval + 0.8 * existing.averageInterval; // EWMA α = 0.2
      existing.accessCount++;
      existing.lastAccessed = now;
    } else {
      // Evict oldest pattern if at cap
      if (this.usagePatterns.size >= this.config.maxUsagePatterns) {
        const oldest = this.usagePatterns.keys().next().value;
        if (oldest) this.usagePatterns.delete(oldest);
      }
      this.usagePatterns.set(key, { key, accessCount: 1, lastAccessed: now, averageInterval: 0 });
    }
  }

  private async performIntelligentPreFetch(): Promise<void> {
    if (!this.config.enablePreFetching || !this.redis || !this.redisConnected) return;

    const now = Date.now();
    const candidates: string[] = [];

    for (const [key, pattern] of this.usagePatterns) {
      if (
        pattern.accessCount >= this.config.preFetchThreshold &&
        pattern.averageInterval > 0 &&
        now - pattern.lastAccessed >= pattern.averageInterval * 0.8 &&
        !this.l1Cache.has(key)
      ) {
        candidates.push(key);
        if (candidates.length >= 10) break;
      }
    }

    await Promise.allSettled(
      candidates.map(async (key) => {
        const result = await this.getFromL2(key);
        if (result.hit && result.value !== null) {
          this.setInL1(key, result.value, this.config.l1DefaultTtl);
        }
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Private — background tasks & helpers
  // ---------------------------------------------------------------------------

  private startBackgroundTasks(): void {
    this.cleanupInterval = setInterval(
      () => this.cleanupExpiredL1Entries(),
      60_000,
    );

    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(
        () => this.reportMetrics(),
        this.config.metricsInterval,
      );
    }

    if (this.config.enablePreFetching) {
      this.preFetchInterval = setInterval(
        () => this.performIntelligentPreFetch(),
        300_000,
      );
    }
  }

  private reportMetrics(): void {
    const stats = this.getStats();
    cachePerformanceMonitor.recordCacheStats({
      l1HitRate: stats.l1.hitRate,
      l2HitRate: stats.l2.hitRate,
      overallHitRate: stats.overall.hitRate,
      l1MemoryUsage: stats.l1.memoryUsageMB,
      totalRequests: stats.overall.totalRequests,
      averageLatency: stats.overall.averageLatency,
      timestamp: new Date(),
    });
  }

  /**
   * Strip characters that could be problematic in Redis keys.
   * Deliberately NOT lowercased to avoid key collisions between
   * distinct-cased identifiers (e.g. userId "ABC" vs "abc").
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^\w\-.:]/g, '_').substring(0, 250);
  }

  private estimateSize(value: unknown): number {
    try {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      return 1_000;
    }
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Cache operation timed out after ${timeout}ms`)), timeout),
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton export & graceful shutdown
// ---------------------------------------------------------------------------

export const unifiedCacheManager = UnifiedCacheManager.getInstance();

const shutdown = async () => { await unifiedCacheManager.destroy(); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);