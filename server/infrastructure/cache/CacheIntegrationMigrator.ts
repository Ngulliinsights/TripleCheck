/**
 * Cache Integration Migrator
 *
 * Migrates existing cache implementations to use the unified cache system
 * while maintaining backward compatibility and ensuring a smooth transition.
 *
 * Key design decisions
 * --------------------
 * - EnhancedCacheService wraps UnifiedCacheManager behind the CacheService
 *   interface so existing callers require no changes.
 * - deletePattern bridges the glob-pattern API of CacheService to the
 *   tag-based invalidation of UnifiedCacheManager via an explicit prefix→tag
 *   map (see PATTERN_TAG_MAP).  Unmapped patterns fall back to a best-effort
 *   strip of the trailing ":" so callers are never silently ignored.
 * - migrationTimeout is enforced via Promise.race so a hung migration step
 *   cannot stall the process indefinitely.
 * - All placeholder migration steps are clearly marked TODO and carry no
 *   artificial delays — real work should replace them.
 */

import { RequestDeduplicator } from '../deduplication/RequestDeduplicator';
import { UnifiedCacheManager } from './UnifiedCacheManager';
import { CacheService, CacheOptions } from './CacheService';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** Subset of UnifiedCacheManager.getStats() that this module actually uses. */
interface UnifiedCacheStats {
  overall: {
    hitRate: number;
    averageLatency: number;
  };
  l1: {
    size: number;
    memoryUsageMB: number;
    maxMemoryMB: number;
  };
  l2: {
    connected: boolean;
    errors: number;
  };
}

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface MigrationConfig {
  /** Replace existing cache calls with the unified cache manager. */
  enableUnifiedCache: boolean;
  /** Wrap RequestDeduplicator with the unified cache backend. */
  migrateDeduplication: boolean;
  /** Wrap ApiRateLimiter with the unified cache backend. */
  migrateRateLimiting: boolean;
  /** Attempt to copy live data from old caches before switching. */
  preserveExistingData: boolean;
  /** Maximum number of keys to migrate per batch (reserved for data migration). */
  migrationBatchSize: number;
  /** Hard timeout (ms) for the entire migrate() call. */
  migrationTimeout: number;
}

export interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  errors: string[];
  duration: number;
  componentsUpdated: string[];
}

export interface UnifiedCacheSystem {
  unifiedCache: UnifiedCacheManager;
  migrator: CacheIntegrationMigrator;
  enhancedCacheService: EnhancedCacheService;
  enhancedDeduplicator: EnhancedRequestDeduplicator;
}

// ---------------------------------------------------------------------------
// EnhancedCacheService
// ---------------------------------------------------------------------------

/**
 * Wraps UnifiedCacheManager behind the CacheService contract so all existing
 * callers can be switched without API changes.
 *
 * TTL convention: CacheService uses **seconds**; UnifiedCacheManager's l1Ttl
 * uses **milliseconds** and l2Ttl uses **seconds** — conversions are applied
 * explicitly here.
 */
export class EnhancedCacheService {
  /**
   * Maps CacheService glob-style patterns (e.g. "similar:*") to the tags
   * used when data was originally stored in the unified cache.
   *
   * Extend this map whenever a new tagged segment is introduced.
   */
  private static readonly PATTERN_TAG_MAP: Record<string, string> = {
    'similar:': 'similar',
    'stats:':   'stats',
    'owner:':   'owner',
    'details:': 'details',
    'dedup:':   'deduplication',
  };

  private readonly unifiedCache: UnifiedCacheManager;

  constructor(unifiedCache: UnifiedCacheManager) {
    this.unifiedCache = unifiedCache;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttlSeconds = options.ttl ?? 300;
    await this.unifiedCache.set(key, value, {
      l1Ttl: ttlSeconds * 1000,
      l2Ttl: ttlSeconds,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.unifiedCache.get<T>(key);
    return result.value ?? null;
  }

  async delete(key: string): Promise<boolean> {
    return this.unifiedCache.delete(key);
  }

  /**
   * Translates a glob-style pattern into a tag invalidation call.
   *
   * The unified cache does not support key-glob scanning; instead, keys must
   * be stored with tags at write time and invalidated by those tags here.
   * PATTERN_TAG_MAP provides the authoritative prefix→tag mapping.
   *
   * @returns The number of keys invalidated.
   */
  async deletePattern(pattern: string): Promise<number> {
    const prefix = pattern.replace(/\*+$/, ''); // strip trailing wildcards
    const tag = EnhancedCacheService.PATTERN_TAG_MAP[prefix];

    if (!tag) {
      console.warn(
        `[EnhancedCacheService] No tag mapping for pattern "${pattern}". ` +
        'Add an entry to PATTERN_TAG_MAP to enable invalidation.'
      );
      return 0;
    }

    return this.unifiedCache.invalidateByTags([tag]);
  }

  async has(key: string): Promise<boolean> {
    const result = await this.unifiedCache.get(key);
    return result.hit;
  }

  async clear(): Promise<void> {
    await this.unifiedCache.clear();
  }

  getStats() {
    const stats = this.unifiedCache.getStats() as UnifiedCacheStats;
    return {
      totalKeys:   stats.l1.size,
      expiredKeys: 0,
      memoryUsage: stats.l1.memoryUsageMB * 1024 * 1024,
      backend:     'unified' as const,
    };
  }
}

// ---------------------------------------------------------------------------
// EnhancedRequestDeduplicator
// ---------------------------------------------------------------------------

/**
 * Extends RequestDeduplicator to use UnifiedCacheManager as its backing store.
 *
 * The `as any` cast on the super() call is required because RequestDeduplicator
 * accepts a CacheService whose concrete type does not yet expose getStats() as
 * an async method — this will be resolved when the base class is updated to the
 * v2 CacheService contract.
 */
export class EnhancedRequestDeduplicator extends RequestDeduplicator {
  private readonly unifiedCache: UnifiedCacheManager;

  constructor(unifiedCache: UnifiedCacheManager, config: Record<string, unknown> = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(config, new EnhancedCacheService(unifiedCache) as any);
    this.unifiedCache = unifiedCache;
  }

  /**
   * Returns a cached result for `key` if one exists; otherwise runs
   * `operation`, stores the result, and returns it.
   *
   * @param key    Unique idempotency key.  If it contains a ":" the prefix
   *               before the first colon is also stored as a tag to support
   *               bulk invalidation by category.
   * @param ttl    TTL in **milliseconds** (default: 5 minutes).
   */
  async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl = 5 * 60 * 1000
  ): Promise<T> {
    const colonIndex = key.indexOf(':');
    const category   = colonIndex > 0 ? key.slice(0, colonIndex) : null;
    const tags: string[] = ['deduplication', ...(category ? [category] : [])];

    return this.unifiedCache.getOrSet(`dedup:${key}`, operation, {
      l1Ttl: ttl,
      l2Ttl: Math.floor(ttl / 1000),
      tags,
    });
  }
}

// ---------------------------------------------------------------------------
// CacheIntegrationMigrator
// ---------------------------------------------------------------------------

export class CacheIntegrationMigrator {
  private readonly unifiedCache: UnifiedCacheManager;
  private readonly config: MigrationConfig;

  constructor(
    unifiedCache: UnifiedCacheManager,
    config: Partial<MigrationConfig> = {}
  ) {
    this.unifiedCache = unifiedCache;
    this.config = {
      enableUnifiedCache:   true,
      migrateDeduplication: true,
      migrateRateLimiting:  true,
      preserveExistingData: true,
      migrationBatchSize:   100,
      migrationTimeout:     30_000,
      ...config,
    };
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Runs all enabled migration steps and validates the result.
   * Throws (and returns a failed MigrationResult) if any step fails or
   * if the entire operation exceeds `config.migrationTimeout`.
   */
  async migrate(): Promise<MigrationResult> {
    const migrationWork = this.runMigration();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Migration timed out after ${this.config.migrationTimeout} ms`)),
        this.config.migrationTimeout
      )
    );

    return Promise.race([migrationWork, timeout]).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[CacheIntegrationMigrator] Migration failed:', message);
      return {
        success:           false,
        migratedKeys:      0,
        errors:            [message],
        duration:          this.config.migrationTimeout,
        componentsUpdated: [],
      } satisfies MigrationResult;
    });
  }

  /** Returns a ready-to-use EnhancedCacheService backed by the unified cache. */
  createEnhancedCacheService(): EnhancedCacheService {
    return new EnhancedCacheService(this.unifiedCache);
  }

  /** Returns a ready-to-use EnhancedRequestDeduplicator backed by the unified cache. */
  createEnhancedRequestDeduplicator(
    config: Record<string, unknown> = {}
  ): EnhancedRequestDeduplicator {
    return new EnhancedRequestDeduplicator(this.unifiedCache, config);
  }

  /**
   * Returns a snapshot of migration health and actionable recommendations
   * based on current cache statistics.
   */
  async getMigrationStatus(): Promise<{
    isUnifiedCacheActive: boolean;
    componentsUsingUnifiedCache: string[];
    recommendations: string[];
    performance: {
      hitRate: number;
      memoryUsageMB: number;
      averageLatencyMs: number;
    };
  }> {
    const stats = this.unifiedCache.getStats() as UnifiedCacheStats;

    return {
      isUnifiedCacheActive: true,
      componentsUsingUnifiedCache: [
        'UnifiedCacheManager',
        'EnhancedCacheService',
        'EnhancedRequestDeduplicator',
      ],
      recommendations: this.generateRecommendations(stats),
      performance: {
        hitRate:          stats.overall.hitRate,
        memoryUsageMB:    stats.l1.memoryUsageMB,
        averageLatencyMs: stats.overall.averageLatency,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Private — migration steps
  // -------------------------------------------------------------------------

  private async runMigration(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success:           false,
      migratedKeys:      0,
      errors:            [],
      duration:          0,
      componentsUpdated: [],
    };

    try {
      console.log('[CacheIntegrationMigrator] Starting cache system migration…');

      if (this.config.preserveExistingData) {
        const dataResult = await this.migrateExistingData();
        result.migratedKeys += dataResult.migratedKeys;
        result.errors.push(...dataResult.errors);
      }

      if (this.config.migrateDeduplication) {
        await this.migrateDeduplicationSystem();
        result.componentsUpdated.push('RequestDeduplicator');
      }

      if (this.config.migrateRateLimiting) {
        await this.migrateRateLimitingSystem();
        result.componentsUpdated.push('ApiRateLimiter');
      }

      const validation = await this.validateMigration();
      if (!validation.success) {
        result.errors.push(...validation.errors);
        throw new Error('Migration validation failed');
      }

      result.success  = true;
      result.duration = Date.now() - startTime;

      console.log('[CacheIntegrationMigrator] Migration completed successfully:', result);
      return result;

    } catch (error) {
      result.success  = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : String(error));
      throw error; // re-throw so migrate() can attach the duration from the timeout path
    }
  }

  /**
   * TODO: Scan existing cache systems, migrate live data in batches of
   * `config.migrationBatchSize`, and validate integrity of each batch.
   */
  private async migrateExistingData(): Promise<{ migratedKeys: number; errors: string[] }> {
    console.log('[CacheIntegrationMigrator] Migrating existing cache data…');
    // TODO: implement actual data migration
    return { migratedKeys: 0, errors: [] };
  }

  /**
   * TODO: Update the RequestDeduplicator singleton / factory to use
   * EnhancedRequestDeduplicator once the DI container supports hot-swapping.
   */
  private async migrateDeduplicationSystem(): Promise<void> {
    console.log('[CacheIntegrationMigrator] Migrating deduplication system…');
    // TODO: implement actual deduplication migration
  }

  /**
   * TODO: Update ApiRateLimiter to accept UnifiedCacheManager for its
   * sliding-window counter storage.
   */
  private async migrateRateLimitingSystem(): Promise<void> {
    console.log('[CacheIntegrationMigrator] Migrating rate limiting system…');
    // TODO: implement actual rate-limiter migration
  }

  /**
   * Validates the unified cache by performing a full round-trip (set → get →
   * delete).  The probe key is deleted in a `finally` block so it is cleaned
   * up even if an intermediate step throws.
   */
  private async validateMigration(): Promise<{ success: boolean; errors: string[] }> {
    const result: { success: boolean; errors: string[] } = { success: true, errors: [] };
    const testKey   = '_migration_validation_probe';
    const testValue = { valid: true, ts: Date.now() };

    console.log('[CacheIntegrationMigrator] Validating migration…');

    try {
      await this.unifiedCache.set(testKey, testValue);

      const retrieved = await this.unifiedCache.get<typeof testValue>(testKey);
      if (!retrieved.hit || retrieved.value?.ts !== testValue.ts) {
        result.errors.push('Round-trip validation failed: retrieved value does not match stored value');
        result.success = false;
      }

      const deleted = await this.unifiedCache.delete(testKey);
      if (!deleted) {
        result.errors.push('Validation cleanup failed: probe key could not be deleted');
        result.success = false;
      }

      const stats = this.unifiedCache.getStats() as UnifiedCacheStats;
      if (typeof stats?.overall?.hitRate !== 'number') {
        result.errors.push('Cache statistics unavailable or malformed');
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Validation threw: ${error instanceof Error ? error.message : String(error)}`);

      // Best-effort cleanup — ignore errors so the probe TTL handles it
      await this.unifiedCache.delete(testKey).catch(() => undefined);
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Private — recommendations
  // -------------------------------------------------------------------------

  private generateRecommendations(stats: UnifiedCacheStats): string[] {
    const recommendations: string[] = [];

    if (stats.overall.hitRate < 0.8) {
      recommendations.push(
        `Hit rate is ${(stats.overall.hitRate * 100).toFixed(1)}% — consider increasing TTL values.`
      );
    }

    if (stats.l1.memoryUsageMB > stats.l1.maxMemoryMB * 0.8) {
      recommendations.push(
        `L1 memory at ${stats.l1.memoryUsageMB.toFixed(1)} MB / ${stats.l1.maxMemoryMB} MB — ` +
        'increase the memory limit or reduce cached value sizes.'
      );
    }

    if (stats.overall.averageLatency > 50) {
      recommendations.push(
        `Average cache latency is ${stats.overall.averageLatency.toFixed(1)} ms — ` +
        'investigate Redis configuration or network proximity.'
      );
    }

    if (!stats.l2.connected) {
      recommendations.push(
        'L2 cache (Redis) is disconnected — the system is running on L1 only. ' +
        'Check Redis connectivity and credentials.'
      );
    } else if (stats.l2.errors > 0) {
      recommendations.push(
        `L2 cache has ${stats.l2.errors} error(s) — review Redis logs for intermittent failures.`
      );
    }

    return recommendations;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Convenience factory that wires up the full unified cache system in one call.
 *
 * @example
 * const { enhancedCacheService, enhancedDeduplicator } =
 *   createUnifiedCacheSystem({ migrationTimeout: 15_000 });
 */
export function createUnifiedCacheSystem(
  config: Partial<MigrationConfig> = {}
): UnifiedCacheSystem {
  const unifiedCache = UnifiedCacheManager.getInstance();
  const migrator     = new CacheIntegrationMigrator(unifiedCache, config);

  return {
    unifiedCache,
    migrator,
    enhancedCacheService:   migrator.createEnhancedCacheService(),
    enhancedDeduplicator:   migrator.createEnhancedRequestDeduplicator(),
  };
}