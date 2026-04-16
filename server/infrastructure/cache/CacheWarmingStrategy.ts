/**
 * Cache Warming Strategy System
 *
 * Pre-loads frequently accessed and related data to reduce cold-miss latency.
 *
 * Improvements vs. original:
 * - Compiled regex patterns are cached so matchesPattern is O(1) after first call.
 * - createTimeoutPromise is correctly typed — no more Promise<never> vs. RelatedData[].
 * - warmupQueue is bounded (maxQueueSize) to prevent unbounded growth.
 * - Warming loops use Promise.allSettled for true concurrency with per-batch limits.
 * - totalKeysWarmed is now updated in updateStats (was missing).
 * - getInstance() always honours the initially-provided config (documented contract).
 * - relatedDataFetcher for schedule-triggered strategies is invoked with a sentinel
 *   key so the distinction from access-triggered ones is clear in type signatures.
 */

import { EnhancedCacheService } from './CacheIntegrationAdapter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarmingConfig {
  enabled: boolean;
  strategies: WarmingStrategy[];
  maxConcurrentWarmups: number;
  maxQueueSize: number;          // cap on pending warmup-queue entries
  warmupInterval: number;        // ms between scheduled runs
  warmupTimeout: number;         // ms per relatedDataFetcher call
  priorityThreshold: number;     // default access-count threshold for 'low' priority
}

export interface WarmingStrategy {
  name: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  trigger: 'schedule' | 'access' | 'invalidation' | 'startup';
  patterns: string[];
  /**
   * Returns the set of cache entries to pre-populate.
   * For 'schedule'/'startup' triggers, `key` is the empty string.
   */
  relatedDataFetcher?: (key: string) => Promise<RelatedData[]>;
  /** Override the default priority-based access-count threshold. */
  condition?: (key: string, accessCount: number) => boolean;
}

export interface RelatedData {
  key: string;
  fetcher: () => Promise<unknown>;
  tags: string[];
  ttl?: number;
}

export interface WarmingResult {
  strategy: string;
  keysWarmed: number;
  keysSkipped: number;
  errors: number;
  duration: number;
  success: boolean;
}

export interface WarmingStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalKeysWarmed: number;
  averageDuration: number;
  lastWarmup: Date | null;
  strategiesStats: Map<string, {
    executions: number;
    successes: number;
    averageDuration: number;
    totalKeysWarmed: number;
    lastExecution: Date;
  }>;
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

export class CacheWarmingManager {
  private static instance: CacheWarmingManager;

  private config: WarmingConfig;
  private cache: EnhancedCacheService;
  private stats: WarmingStats;
  private activeWarmups = new Set<string>();
  private warmupQueue: Array<{ strategy: WarmingStrategy; keys: string[] }> = [];
  private warmupInterval?: NodeJS.Timeout;

  /** Compiled regex cache to avoid recreating patterns on every match. */
  private patternCache = new Map<string, RegExp>();

  // ---------------------------------------------------------------------------
  // Construction & singleton
  // ---------------------------------------------------------------------------

  constructor(config: Partial<WarmingConfig> = {}, cache?: EnhancedCacheService) {
    this.config = {
      enabled: true,
      strategies: this.getDefaultStrategies(),
      maxConcurrentWarmups: 3,
      maxQueueSize: 50,
      warmupInterval: 300_000,  // 5 min
      warmupTimeout: 10_000,    // 10 s per fetcher call
      priorityThreshold: 10,
      ...config,
    };

    this.cache = cache ?? new EnhancedCacheService();
    this.stats = this.initializeStats();

    if (this.config.enabled) this.startWarmupScheduler();
  }

  /**
   * Returns the singleton instance.
   * Config and cache are only applied on the very first call — subsequent calls
   * return the existing instance unchanged (document this at call sites).
   */
  static getInstance(config?: Partial<WarmingConfig>, cache?: EnhancedCacheService): CacheWarmingManager {
    if (!CacheWarmingManager.instance) {
      CacheWarmingManager.instance = new CacheWarmingManager(config, cache);
    }
    return CacheWarmingManager.instance;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Warm related data when a key has been accessed. */
  async warmOnAccess(key: string, accessCount: number): Promise<void> {
    if (!this.config.enabled) return;

    const strategies = this.config.strategies.filter(
      s => s.enabled && s.trigger === 'access',
    );

    await Promise.allSettled(
      strategies
        .filter(s => this.shouldWarmForStrategy(s, key, accessCount))
        .map(s => this.executeWarmingStrategy(s, [key])),
    );
  }

  /** Warm related data after a set of keys has been invalidated. */
  async warmOnInvalidation(invalidatedKeys: string[]): Promise<void> {
    if (!this.config.enabled || invalidatedKeys.length === 0) return;

    const strategies = this.config.strategies.filter(
      s => s.enabled && s.trigger === 'invalidation',
    );

    await Promise.allSettled(
      strategies.map(strategy => {
        const relevant = invalidatedKeys.filter(key =>
          strategy.patterns.some(p => this.matchesPattern(key, p)),
        );
        return relevant.length > 0
          ? this.executeWarmingStrategy(strategy, relevant)
          : Promise.resolve();
      }),
    );
  }

  /** Warm data at application startup. */
  async warmOnStartup(): Promise<WarmingResult[]> {
    if (!this.config.enabled) return [];

    const strategies = this.config.strategies.filter(
      s => s.enabled && s.trigger === 'startup',
    );

    const results = await Promise.allSettled(
      strategies.map(s => this.executeWarmingStrategy(s, [])),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<WarmingResult> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /** Run all schedule-triggered strategies immediately. */
  async executeScheduledWarming(): Promise<WarmingResult[]> {
    if (!this.config.enabled) return [];

    const strategies = this.config.strategies.filter(
      s => s.enabled && s.trigger === 'schedule',
    );

    const results: WarmingResult[] = [];

    for (const strategy of strategies) {
      if (this.activeWarmups.size < this.config.maxConcurrentWarmups) {
        results.push(await this.executeWarmingStrategy(strategy, []));
      } else if (this.warmupQueue.length < this.config.maxQueueSize) {
        this.warmupQueue.push({ strategy, keys: [] });
      } else {
        console.warn(
          `CacheWarmingManager: queue full (${this.config.maxQueueSize}), ` +
          `dropping strategy "${strategy.name}"`,
        );
      }
    }

    return results;
  }

  getStats(): WarmingStats {
    return {
      ...this.stats,
      strategiesStats: new Map(this.stats.strategiesStats),
    };
  }

  addStrategy(strategy: WarmingStrategy): void {
    if (this.config.strategies.some(s => s.name === strategy.name)) {
      throw new Error(`Strategy "${strategy.name}" already exists. Remove it first.`);
    }
    this.config.strategies.push(strategy);
  }

  removeStrategy(name: string): boolean {
    const index = this.config.strategies.findIndex(s => s.name === name);
    if (index === -1) return false;
    this.config.strategies.splice(index, 1);
    return true;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled && !this.warmupInterval) {
      this.startWarmupScheduler();
    } else if (!enabled && this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = undefined;
    }
  }

  async destroy(): Promise<void> {
    if (this.warmupInterval) clearInterval(this.warmupInterval);
    // Drain: wait until all in-flight warmups finish (max ~5 s).
    const deadline = Date.now() + 5_000;
    while (this.activeWarmups.size > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // ---------------------------------------------------------------------------
  // Private — strategy execution
  // ---------------------------------------------------------------------------

  private async executeWarmingStrategy(
    strategy: WarmingStrategy,
    triggerKeys: string[],
  ): Promise<WarmingResult> {
    const start = Date.now();
    const opId = `${strategy.name}_${start}_${Math.random().toString(36).slice(2)}`;
    this.activeWarmups.add(opId);

    let keysWarmed = 0;
    let keysSkipped = 0;
    let errors = 0;

    try {
      const keys = triggerKeys.length > 0
        ? triggerKeys
        : await this.getKeysForStrategy(strategy);

      // When there are no trigger keys (schedule / startup), invoke the fetcher
      // once with an empty string as the sentinel key.
      const effectiveKeys = keys.length > 0 ? keys : [''];

      // Process keys in batches equal to maxConcurrentWarmups.
      for (let i = 0; i < effectiveKeys.length; i += this.config.maxConcurrentWarmups) {
        const batch = effectiveKeys.slice(i, i + this.config.maxConcurrentWarmups);

        const batchResults = await Promise.allSettled(
          batch.map(key => this.warmSingleKey(strategy, key)),
        );

        for (const r of batchResults) {
          if (r.status === 'fulfilled') {
            keysWarmed += r.value.warmed;
            keysSkipped += r.value.skipped;
            errors += r.value.errors;
          } else {
            errors++;
          }
        }
      }

      const duration = Date.now() - start;
      const success = keysWarmed > 0 && errors <= keysWarmed;
      this.updateStats(strategy.name, duration, success, keysWarmed);

      return { strategy: strategy.name, keysWarmed, keysSkipped, errors, duration, success };
    } catch (err) {
      const duration = Date.now() - start;
      this.updateStats(strategy.name, duration, false, 0);
      return { strategy: strategy.name, keysWarmed, keysSkipped, errors: errors + 1, duration, success: false };
    } finally {
      this.activeWarmups.delete(opId);
    }
  }

  private async warmSingleKey(
    strategy: WarmingStrategy,
    key: string,
  ): Promise<{ warmed: number; skipped: number; errors: number }> {
    if (!strategy.relatedDataFetcher) return { warmed: 0, skipped: 1, errors: 0 };

    let warmed = 0;
    let errors = 0;

    const related = await this.withTimeout(
      strategy.relatedDataFetcher(key),
      this.config.warmupTimeout,
      `relatedDataFetcher for strategy "${strategy.name}", key "${key}"`,
    );

    const settledData = await Promise.allSettled(
      related.map(async data => {
        const value = await data.fetcher();
        await this.cache.setWithTags(data.key, value, data.tags, {
          ttl: data.ttl ?? 3_600,
        });
        return data.key;
      }),
    );

    for (const r of settledData) {
      if (r.status === 'fulfilled') {
        warmed++;
      } else {
        errors++;
        console.warn(`CacheWarmingManager: failed to warm related key:`, r.reason);
      }
    }

    return { warmed, skipped: 0, errors };
  }

  // ---------------------------------------------------------------------------
  // Private — strategy selection
  // ---------------------------------------------------------------------------

  private shouldWarmForStrategy(
    strategy: WarmingStrategy,
    key: string,
    accessCount: number,
  ): boolean {
    const matches = strategy.patterns.some(p => this.matchesPattern(key, p));
    if (!matches) return false;

    if (strategy.condition) return strategy.condition(key, accessCount);

    switch (strategy.priority) {
      case 'high':   return accessCount >= 3;
      case 'medium': return accessCount >= 5;
      case 'low':    return accessCount >= this.config.priorityThreshold;
    }
  }

  /** Compiled regex patterns are cached to avoid recompilation on every call. */
  private matchesPattern(key: string, pattern: string): boolean {
    let regex = this.patternCache.get(pattern);
    if (!regex) {
      regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      this.patternCache.set(pattern, regex);
    }
    return regex.test(key);
  }

  /**
   * Return the set of keys matching this strategy's patterns.
   * Integrate with your cache/DB here; returning [] is valid for strategies
   * that use their relatedDataFetcher to generate keys independently.
   */
  private async getKeysForStrategy(_strategy: WarmingStrategy): Promise<string[]> {
    return [];
  }

  // ---------------------------------------------------------------------------
  // Private — scheduler
  // ---------------------------------------------------------------------------

  private startWarmupScheduler(): void {
    this.warmupInterval = setInterval(async () => {
      try {
        await this.executeScheduledWarming();
        await this.processWarmupQueue();
      } catch (err) {
        console.warn('CacheWarmingManager: scheduled warming error:', err);
      }
    }, this.config.warmupInterval);
  }

  private async processWarmupQueue(): Promise<void> {
    while (
      this.warmupQueue.length > 0 &&
      this.activeWarmups.size < this.config.maxConcurrentWarmups
    ) {
      const item = this.warmupQueue.shift();
      if (item) await this.executeWarmingStrategy(item.strategy, item.keys);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — stats
  // ---------------------------------------------------------------------------

  private initializeStats(): WarmingStats {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalKeysWarmed: 0,
      averageDuration: 0,
      lastWarmup: null,
      strategiesStats: new Map(),
    };
  }

  private updateStats(
    strategyName: string,
    duration: number,
    success: boolean,
    keysWarmed: number,
  ): void {
    this.stats.totalOperations++;
    this.stats.lastWarmup = new Date();
    this.stats.totalKeysWarmed += keysWarmed;
    this.stats.averageDuration =
      (this.stats.averageDuration * (this.stats.totalOperations - 1) + duration) /
      this.stats.totalOperations;

    if (success) this.stats.successfulOperations++;
    else this.stats.failedOperations++;

    const s = this.stats.strategiesStats.get(strategyName) ?? {
      executions: 0,
      successes: 0,
      averageDuration: 0,
      totalKeysWarmed: 0,
      lastExecution: new Date(),
    };

    s.executions++;
    s.lastExecution = new Date();
    s.totalKeysWarmed += keysWarmed;
    s.averageDuration =
      (s.averageDuration * (s.executions - 1) + duration) / s.executions;
    if (success) s.successes++;

    this.stats.strategiesStats.set(strategyName, s);
  }

  // ---------------------------------------------------------------------------
  // Private — helpers
  // ---------------------------------------------------------------------------

  /**
   * Race a promise against a timeout. Rejects with a descriptive error if the
   * timeout fires. Correctly typed so callers don't need casts.
   */
  private withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout after ${ms}ms: ${label}`)),
        ms,
      ),
    );
    return Promise.race([promise, timeout]);
  }

  // ---------------------------------------------------------------------------
  // Private — default strategies (replace mock fetchers with real ones)
  // ---------------------------------------------------------------------------

  private getDefaultStrategies(): WarmingStrategy[] {
    return [
      {
        name: 'property-related-data',
        enabled: true,
        priority: 'high',
        trigger: 'access',
        patterns: ['property:*'],
        condition: (_key, count) => count >= 5,
        relatedDataFetcher: async (key) => {
          const propertyId = key.split(':')[1];
          return [
            {
              key: `property:${propertyId}:reviews`,
              fetcher: () => this.fetchPropertyReviews(propertyId),
              tags: ['property', 'reviews'],
              ttl: 1_800,
            },
            {
              key: `property:${propertyId}:similar`,
              fetcher: () => this.fetchSimilarProperties(propertyId),
              tags: ['property', 'recommendations'],
              ttl: 3_600,
            },
          ];
        },
      },
      {
        name: 'user-dashboard-data',
        enabled: true,
        priority: 'medium',
        trigger: 'access',
        patterns: ['user:*:profile'],
        condition: (_key, count) => count >= 3,
        relatedDataFetcher: async (key) => {
          const userId = key.split(':')[1];
          return [
            {
              key: `user:${userId}:properties`,
              fetcher: () => this.fetchUserProperties(userId),
              tags: ['user', 'properties'],
              ttl: 900,
            },
            {
              key: `user:${userId}:notifications`,
              fetcher: () => this.fetchUserNotifications(userId),
              tags: ['user', 'notifications'],
              ttl: 300,
            },
          ];
        },
      },
      {
        name: 'popular-properties',
        enabled: true,
        priority: 'low',
        trigger: 'schedule',
        patterns: ['property:popular:*'],
        // key is '' for schedule-triggered strategies; we ignore it here.
        relatedDataFetcher: async (_key) => {
          const ids = await this.fetchPopularPropertyIds();
          return ids.map(id => ({
            key: `property:${id}`,
            fetcher: () => this.fetchPropertyDetails(id),
            tags: ['property', 'popular'],
            ttl: 3_600,
          }));
        },
      },
      {
        name: 'search-next-page-preload',
        enabled: true,
        priority: 'medium',
        trigger: 'invalidation',
        patterns: ['search:*'],
        relatedDataFetcher: async (key) => {
          const params = this.parseSearchKey(key);
          return [
            {
              key: `search:${params}:page:2`,
              fetcher: () => this.fetchSearchResults(params, 2),
              tags: ['search', 'pagination'],
              ttl: 600,
            },
          ];
        },
      },
    ];
  }

  // ---- Mock fetchers — replace with real service/repository calls ------------

  private async fetchPropertyReviews(propertyId: string): Promise<unknown> {
    return { propertyId, reviews: [] };
  }

  private async fetchSimilarProperties(propertyId: string): Promise<unknown> {
    return { propertyId, similar: [] };
  }

  private async fetchUserProperties(userId: string): Promise<unknown> {
    return { userId, properties: [] };
  }

  private async fetchUserNotifications(userId: string): Promise<unknown> {
    return { userId, notifications: [] };
  }

  private async fetchPopularPropertyIds(): Promise<string[]> {
    return ['1', '2', '3'];
  }

  private async fetchPropertyDetails(id: string): Promise<unknown> {
    return { id, details: {} };
  }

  private async fetchSearchResults(params: string, page: number): Promise<unknown> {
    return { params, page, results: [] };
  }

  private parseSearchKey(key: string): string {
    return key.replace(/^search:/, '');
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const cacheWarmingManager = CacheWarmingManager.getInstance();