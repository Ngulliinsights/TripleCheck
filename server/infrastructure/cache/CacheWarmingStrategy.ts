/**
 * Cache Warming Strategy System
 * 
 * Implements intelligent cache warming strategies to improve performance
 * by pre-loading frequently accessed data and related content.
 */

import { EnhancedCacheService } from './CacheIntegrationAdapter';
import { unifiedCacheManager } from './UnifiedCacheManager';

/**
 * Cache warming configuration
 */
export interface WarmingConfig {
  enabled: boolean;
  strategies: WarmingStrategy[];
  maxConcurrentWarmups: number;
  warmupInterval: number; // milliseconds
  warmupTimeout: number; // milliseconds per operation
  priorityThreshold: number; // Access count threshold for high priority
}

/**
 * Individual warming strategy
 */
export interface WarmingStrategy {
  name: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  trigger: 'schedule' | 'access' | 'invalidation' | 'startup';
  patterns: string[]; // Key patterns to warm
  relatedDataFetcher?: (key: string) => Promise<RelatedData[]>;
  condition?: (key: string, accessCount: number) => boolean;
}

/**
 * Related data for warming
 */
export interface RelatedData {
  key: string;
  fetcher: () => Promise<unknown>;
  tags: string[];
  ttl?: number;
}

/**
 * Warming operation result
 */
export interface WarmingResult {
  strategy: string;
  keysWarmed: number;
  keysSkipped: number;
  errors: number;
  duration: number;
  success: boolean;
}

/**
 * Cache warming statistics
 */
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
    lastExecution: Date;
  }>;
}

/**
 * Cache Warming Manager
 */
export class CacheWarmingManager {
  private static instance: CacheWarmingManager;
  private config: WarmingConfig;
  private cache: EnhancedCacheService;
  private stats: WarmingStats;
  private activeWarmups = new Set<string>();
  private warmupQueue: Array<{ strategy: WarmingStrategy; keys: string[] }> = [];
  private warmupInterval?: NodeJS.Timeout;

  constructor(config: Partial<WarmingConfig> = {}, cache?: EnhancedCacheService) {
    this.config = {
      enabled: true,
      strategies: this.getDefaultStrategies(),
      maxConcurrentWarmups: 3,
      warmupInterval: 300000, // 5 minutes
      warmupTimeout: 10000, // 10 seconds per operation
      priorityThreshold: 10,
      ...config
    };

    this.cache = cache || new EnhancedCacheService();
    this.stats = this.initializeStats();

    if (this.config.enabled) {
      this.startWarmupScheduler();
    }
  }

  static getInstance(config?: Partial<WarmingConfig>, cache?: EnhancedCacheService): CacheWarmingManager {
    if (!CacheWarmingManager.instance) {
      CacheWarmingManager.instance = new CacheWarmingManager(config, cache);
    }
    return CacheWarmingManager.instance;
  }

  /**
   * Warm cache based on access patterns
   */
  async warmOnAccess(key: string, accessCount: number): Promise<void> {
    if (!this.config.enabled) return;

    const accessStrategies = this.config.strategies.filter(s => 
      s.enabled && s.trigger === 'access'
    );

    for (const strategy of accessStrategies) {
      if (this.shouldWarmForStrategy(strategy, key, accessCount)) {
        await this.executeWarmingStrategy(strategy, [key]);
      }
    }
  }

  /**
   * Warm cache on invalidation
   */
  async warmOnInvalidation(invalidatedKeys: string[]): Promise<void> {
    if (!this.config.enabled || invalidatedKeys.length === 0) return;

    const invalidationStrategies = this.config.strategies.filter(s => 
      s.enabled && s.trigger === 'invalidation'
    );

    for (const strategy of invalidationStrategies) {
      const relevantKeys = invalidatedKeys.filter(key => 
        strategy.patterns.some(pattern => this.matchesPattern(key, pattern))
      );

      if (relevantKeys.length > 0) {
        await this.executeWarmingStrategy(strategy, relevantKeys);
      }
    }
  }

  /**
   * Warm cache on application startup
   */
  async warmOnStartup(): Promise<WarmingResult[]> {
    if (!this.config.enabled) return [];

    const startupStrategies = this.config.strategies.filter(s => 
      s.enabled && s.trigger === 'startup'
    );

    const results: WarmingResult[] = [];
    for (const strategy of startupStrategies) {
      const result = await this.executeWarmingStrategy(strategy, []);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute scheduled warming
   */
  async executeScheduledWarming(): Promise<WarmingResult[]> {
    if (!this.config.enabled) return [];

    const scheduledStrategies = this.config.strategies.filter(s => 
      s.enabled && s.trigger === 'schedule'
    );

    const results: WarmingResult[] = [];
    for (const strategy of scheduledStrategies) {
      if (this.activeWarmups.size < this.config.maxConcurrentWarmups) {
        const result = await this.executeWarmingStrategy(strategy, []);
        results.push(result);
      } else {
        // Queue for later execution
        this.warmupQueue.push({ strategy, keys: [] });
      }
    }

    return results;
  }

  /**
   * Get warming statistics
   */
  getStats(): WarmingStats {
    return { ...this.stats };
  }

  /**
   * Add custom warming strategy
   */
  addStrategy(strategy: WarmingStrategy): void {
    this.config.strategies.push(strategy);
  }

  /**
   * Remove warming strategy
   */
  removeStrategy(name: string): boolean {
    const index = this.config.strategies.findIndex(s => s.name === name);
    if (index > -1) {
      this.config.strategies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enable/disable warming
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.warmupInterval) {
      this.startWarmupScheduler();
    } else if (!enabled && this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = undefined;
    }
  }

  /**
   * Graceful shutdown
   */
  async destroy(): Promise<void> {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
    }
    
    // Wait for active warmups to complete
    while (this.activeWarmups.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Private methods

  private getDefaultStrategies(): WarmingStrategy[] {
    return [
      {
        name: 'property-related-data',
        enabled: true,
        priority: 'high',
        trigger: 'access',
        patterns: ['property:*'],
        condition: (key, accessCount) => accessCount >= 5,
        relatedDataFetcher: async (key) => {
          const propertyId = key.split(':')[1];
          return [
            {
              key: `property:${propertyId}:reviews`,
              fetcher: () => this.fetchPropertyReviews(propertyId),
              tags: ['property', 'reviews'],
              ttl: 1800 // 30 minutes
            },
            {
              key: `property:${propertyId}:similar`,
              fetcher: () => this.fetchSimilarProperties(propertyId),
              tags: ['property', 'recommendations'],
              ttl: 3600 // 1 hour
            }
          ];
        }
      },
      {
        name: 'user-dashboard-data',
        enabled: true,
        priority: 'medium',
        trigger: 'access',
        patterns: ['user:*:profile'],
        condition: (key, accessCount) => accessCount >= 3,
        relatedDataFetcher: async (key) => {
          const userId = key.split(':')[1];
          return [
            {
              key: `user:${userId}:properties`,
              fetcher: () => this.fetchUserProperties(userId),
              tags: ['user', 'properties'],
              ttl: 900 // 15 minutes
            },
            {
              key: `user:${userId}:notifications`,
              fetcher: () => this.fetchUserNotifications(userId),
              tags: ['user', 'notifications'],
              ttl: 300 // 5 minutes
            }
          ];
        }
      },
      {
        name: 'popular-properties',
        enabled: true,
        priority: 'low',
        trigger: 'schedule',
        patterns: ['property:popular:*'],
        relatedDataFetcher: async () => {
          const popularProperties = await this.fetchPopularProperties();
          return popularProperties.map(id => ({
            key: `property:${id}`,
            fetcher: () => this.fetchPropertyDetails(id),
            tags: ['property', 'popular'],
            ttl: 3600
          }));
        }
      },
      {
        name: 'search-results-preload',
        enabled: true,
        priority: 'medium',
        trigger: 'invalidation',
        patterns: ['search:*'],
        relatedDataFetcher: async (key) => {
          const searchParams = this.parseSearchKey(key);
          return [
            {
              key: `search:${searchParams}:page:2`,
              fetcher: () => this.fetchSearchResults(searchParams, 2),
              tags: ['search', 'pagination'],
              ttl: 600 // 10 minutes
            }
          ];
        }
      }
    ];
  }

  private async executeWarmingStrategy(
    strategy: WarmingStrategy, 
    triggerKeys: string[]
  ): Promise<WarmingResult> {
    const startTime = Date.now();
    const operationId = `${strategy.name}_${startTime}`;
    
    this.activeWarmups.add(operationId);
    
    let keysWarmed = 0;
    let keysSkipped = 0;
    let errors = 0;

    try {
      // Get keys to warm
      const keysToWarm = triggerKeys.length > 0 
        ? triggerKeys 
        : await this.getKeysForStrategy(strategy);

      // Execute warming for each key
      for (const key of keysToWarm) {
        try {
          if (strategy.relatedDataFetcher) {
            const relatedData = await Promise.race([
              strategy.relatedDataFetcher(key),
              this.createTimeoutPromise(this.config.warmupTimeout)
            ]);

            for (const data of relatedData) {
              try {
                const value = await data.fetcher();
                await this.cache.setWithTags(data.key, value, data.tags, {
                  ttl: data.ttl || 3600
                });
                keysWarmed++;
              } catch (error) {
                errors++;
                console.warn(`Failed to warm ${data.key}:`, error);
              }
            }
          } else {
            keysSkipped++;
          }
        } catch (error) {
          errors++;
          console.warn(`Failed to process key ${key} for strategy ${strategy.name}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const success = errors === 0 || (keysWarmed > 0 && errors < keysWarmed);

      // Update statistics
      this.updateStats(strategy.name, duration, success);

      return {
        strategy: strategy.name,
        keysWarmed,
        keysSkipped,
        errors,
        duration,
        success
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStats(strategy.name, duration, false);
      
      return {
        strategy: strategy.name,
        keysWarmed,
        keysSkipped,
        errors: errors + 1,
        duration,
        success: false
      };
    } finally {
      this.activeWarmups.delete(operationId);
    }
  }

  private shouldWarmForStrategy(
    strategy: WarmingStrategy, 
    key: string, 
    accessCount: number
  ): boolean {
    // Check if key matches strategy patterns
    const matchesPattern = strategy.patterns.some(pattern => 
      this.matchesPattern(key, pattern)
    );

    if (!matchesPattern) return false;

    // Check custom condition if provided
    if (strategy.condition) {
      return strategy.condition(key, accessCount);
    }

    // Default condition based on priority and access count
    switch (strategy.priority) {
      case 'high':
        return accessCount >= 3;
      case 'medium':
        return accessCount >= 5;
      case 'low':
        return accessCount >= this.config.priorityThreshold;
      default:
        return false;
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private async getKeysForStrategy(strategy: WarmingStrategy): Promise<string[]> {
    // This would typically query your cache or database for keys matching the patterns
    // For now, return empty array as this depends on your specific implementation
    return [];
  }

  private startWarmupScheduler(): void {
    this.warmupInterval = setInterval(async () => {
      try {
        await this.executeScheduledWarming();
        await this.processWarmupQueue();
      } catch (error) {
        console.warn('Scheduled warming failed:', error);
      }
    }, this.config.warmupInterval);
  }

  private async processWarmupQueue(): Promise<void> {
    while (
      this.warmupQueue.length > 0 && 
      this.activeWarmups.size < this.config.maxConcurrentWarmups
    ) {
      const { strategy, keys } = this.warmupQueue.shift()!;
      await this.executeWarmingStrategy(strategy, keys);
    }
  }

  private initializeStats(): WarmingStats {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalKeysWarmed: 0,
      averageDuration: 0,
      lastWarmup: null,
      strategiesStats: new Map()
    };
  }

  private updateStats(strategyName: string, duration: number, success: boolean): void {
    this.stats.totalOperations++;
    this.stats.lastWarmup = new Date();
    
    if (success) {
      this.stats.successfulOperations++;
    } else {
      this.stats.failedOperations++;
    }

    // Update strategy-specific stats
    const strategyStats = this.stats.strategiesStats.get(strategyName) || {
      executions: 0,
      successes: 0,
      averageDuration: 0,
      lastExecution: new Date()
    };

    strategyStats.executions++;
    strategyStats.lastExecution = new Date();
    strategyStats.averageDuration = 
      (strategyStats.averageDuration * (strategyStats.executions - 1) + duration) / 
      strategyStats.executions;

    if (success) {
      strategyStats.successes++;
    }

    this.stats.strategiesStats.set(strategyName, strategyStats);
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Warmup timeout')), timeout);
    });
  }

  // Mock data fetchers - replace with actual implementations
  private async fetchPropertyReviews(propertyId: string): Promise<unknown> {
    // Mock implementation
    return { propertyId, reviews: [] };
  }

  private async fetchSimilarProperties(propertyId: string): Promise<unknown> {
    // Mock implementation
    return { propertyId, similar: [] };
  }

  private async fetchUserProperties(userId: string): Promise<unknown> {
    // Mock implementation
    return { userId, properties: [] };
  }

  private async fetchUserNotifications(userId: string): Promise<unknown> {
    // Mock implementation
    return { userId, notifications: [] };
  }

  private async fetchPopularProperties(): Promise<string[]> {
    // Mock implementation
    return ['1', '2', '3'];
  }

  private async fetchPropertyDetails(id: string): Promise<unknown> {
    // Mock implementation
    return { id, details: {} };
  }

  private async fetchSearchResults(params: string, page: number): Promise<unknown> {
    // Mock implementation
    return { params, page, results: [] };
  }

  private parseSearchKey(key: string): string {
    // Mock implementation
    return key.replace('search:', '');
  }
}

// Export singleton instance
export const cacheWarmingManager = CacheWarmingManager.getInstance();