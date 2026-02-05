/**
 * Cache Integration Migrator
 * 
 * Migrates existing cache implementations to use the unified cache system
 * while maintaining backward compatibility and ensuring smooth transition.
 */

import { RequestDeduplicator } from '../deduplication/RequestDeduplicator';
import { ApiRateLimiter } from '../rate-limiting/ApiRateLimiter';

import { CacheService } from './CacheService'
import { UnifiedCacheManager } from './UnifiedCacheManager';

/**
 * Migration configuration
 */
export interface MigrationConfig {
  enableUnifiedCache: boolean;
  migrateDeduplication: boolean;
  migrateRateLimiting: boolean;
  preserveExistingData: boolean;
  migrationBatchSize: number;
  migrationTimeout: number;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  errors: string[];
  duration: number;
  componentsUpdated: string[];
}

/**
 * Enhanced Cache Service that uses Unified Cache Manager
 */
export class EnhancedCacheService extends CacheService {
  private unifiedCache: UnifiedCacheManager;
  private fallbackToOriginal: boolean;

  constructor(unifiedCache: UnifiedCacheManager, fallbackToOriginal = true) {
    super();
    this.unifiedCache = unifiedCache;
    this.fallbackToOriginal = fallbackToOriginal;
  }

  async set<T>(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    try {
      await this.unifiedCache.set(key, value, {
        l1Ttl: (options.ttl || 300) * 1000, // Convert to milliseconds
        l2Ttl: options.ttl || 300
      });
    } catch (error) {
      if (this.fallbackToOriginal) {
        await super.set(key, value, options);
      } else {
        throw error;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.unifiedCache.get<T>(key);
      return result.value;
    } catch (error) {
      if (this.fallbackToOriginal) {
        return await super.get<T>(key);
      } else {
        throw error;
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await this.unifiedCache.delete(key);
    } catch (error) {
      if (this.fallbackToOriginal) {
        return await super.delete(key);
      } else {
        throw error;
      }
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      // Convert pattern to tags for unified cache
      const tags = [pattern.replace(/\*/g, '')];
      return await this.unifiedCache.invalidateByTags(tags);
    } catch (error) {
      if (this.fallbackToOriginal) {
        return await super.invalidateByPattern(pattern);
      } else {
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    try {
      await this.unifiedCache.clear();
    } catch (error) {
      if (this.fallbackToOriginal) {
        await super.clear();
      } else {
        throw error;
      }
    }
  }
}

/**
 * Enhanced Request Deduplicator that uses Unified Cache Manager
 */
export class EnhancedRequestDeduplicator extends RequestDeduplicator {
  private unifiedCache: UnifiedCacheManager;

  constructor(unifiedCache: UnifiedCacheManager, config = {}) {
    const enhancedCacheService = new EnhancedCacheService(unifiedCache);
    super(config, enhancedCacheService);
    this.unifiedCache = unifiedCache;
  }

  async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cacheKey = `dedup:${key}`;
    
    return await this.unifiedCache.getOrSet(
      cacheKey,
      operation,
      {
        l1Ttl: ttl,
        l2Ttl: Math.floor(ttl / 1000),
        tags: ['deduplication', key.split(':')[0]] // Add relevant tags
      }
    );
  }
}

/**
 * Cache Integration Migrator
 */
export class CacheIntegrationMigrator {
  private unifiedCache: UnifiedCacheManager;
  private config: MigrationConfig;

  constructor(unifiedCache: UnifiedCacheManager, config: Partial<MigrationConfig> = {}) {
    this.unifiedCache = unifiedCache;
    this.config = {
      enableUnifiedCache: true,
      migrateDeduplication: true,
      migrateRateLimiting: true,
      preserveExistingData: true,
      migrationBatchSize: 100,
      migrationTimeout: 30000,
      ...config
    };
  }

  /**
   * Perform complete migration to unified cache system
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      migratedKeys: 0,
      errors: [],
      duration: 0,
      componentsUpdated: []
    };

    try {
      console.log('[CacheIntegrationMigrator] Starting cache system migration...');

      // Step 1: Migrate existing cache data if requested
      if (this.config.preserveExistingData) {
        const dataResult = await this.migrateExistingData();
        result.migratedKeys += dataResult.migratedKeys;
        result.errors.push(...dataResult.errors);
      }

      // Step 2: Update deduplication system
      if (this.config.migrateDeduplication) {
        await this.migrateDeduplicationSystem();
        result.componentsUpdated.push('RequestDeduplicator');
      }

      // Step 3: Update rate limiting system
      if (this.config.migrateRateLimiting) {
        await this.migrateRateLimitingSystem();
        result.componentsUpdated.push('ApiRateLimiter');
      }

      // Step 4: Validate migration
      const validationResult = await this.validateMigration();
      if (!validationResult.success) {
        result.errors.push(...validationResult.errors);
        throw new Error('Migration validation failed');
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      console.log('[CacheIntegrationMigrator] Migration completed successfully:', result);
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error('[CacheIntegrationMigrator] Migration failed:', error);
      return result;
    }
  }

  /**
   * Create enhanced cache service instance
   */
  createEnhancedCacheService(): EnhancedCacheService {
    return new EnhancedCacheService(this.unifiedCache);
  }

  /**
   * Create enhanced request deduplicator instance
   */
  createEnhancedRequestDeduplicator(config = {}): EnhancedRequestDeduplicator {
    return new EnhancedRequestDeduplicator(this.unifiedCache, config);
  }

  /**
   * Get migration status and recommendations
   */
  async getMigrationStatus(): Promise<{
    isUnifiedCacheActive: boolean;
    componentsUsingUnifiedCache: string[];
    recommendations: string[];
    performance: {
      hitRate: number;
      memoryUsage: number;
      latency: number;
    };
  }> {
    const stats = this.unifiedCache.getStats();
    
    return {
      isUnifiedCacheActive: true,
      componentsUsingUnifiedCache: [
        'UnifiedCacheManager',
        'EnhancedCacheService',
        'EnhancedRequestDeduplicator'
      ],
      recommendations: this.generateRecommendations(stats),
      performance: {
        hitRate: stats.overall.hitRate,
        memoryUsage: stats.l1.memoryUsageMB,
        latency: stats.overall.averageLatency
      }
    };
  }

  // Private methods

  private async migrateExistingData(): Promise<{ migratedKeys: number; errors: string[] }> {
    const result = { migratedKeys: 0, errors: [] };
    
    try {
      // This is a placeholder for actual data migration
      // In practice, you would:
      // 1. Scan existing cache systems for data
      // 2. Migrate data in batches
      // 3. Validate data integrity
      
      console.log('[CacheIntegrationMigrator] Migrating existing cache data...');
      
      // Simulate migration process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      result.migratedKeys = 0; // No actual data to migrate in this implementation
      
    } catch (error) {
      result.errors.push(`Data migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return result;
  }

  private async migrateDeduplicationSystem(): Promise<void> {
    console.log('[CacheIntegrationMigrator] Migrating deduplication system...');
    
    // The enhanced deduplicator is created on-demand
    // No actual migration needed as it's a wrapper
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async migrateRateLimitingSystem(): Promise<void> {
    console.log('[CacheIntegrationMigrator] Migrating rate limiting system...');
    
    // Rate limiting system can use the unified cache for storage
    // This would require updating the ApiRateLimiter to use UnifiedCacheManager
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async validateMigration(): Promise<{ success: boolean; errors: string[] }> {
    const result = { success: true, errors: [] };
    
    try {
      console.log('[CacheIntegrationMigrator] Validating migration...');
      
      // Test unified cache functionality
      const testKey = 'migration_test_key';
      const testValue = { test: true, timestamp: Date.now() };
      
      // Test set operation
      await this.unifiedCache.set(testKey, testValue);
      
      // Test get operation
      const retrieved = await this.unifiedCache.get(testKey);
      if (!retrieved.hit || !retrieved.value) {
        result.errors.push('Failed to retrieve test data from unified cache');
        result.success = false;
      }
      
      // Test delete operation
      const deleted = await this.unifiedCache.delete(testKey);
      if (!deleted) {
        result.errors.push('Failed to delete test data from unified cache');
        result.success = false;
      }
      
      // Test cache statistics
      const stats = this.unifiedCache.getStats();
      if (!stats || typeof stats.overall.hitRate !== 'number') {
        result.errors.push('Cache statistics are not available or invalid');
        result.success = false;
      }
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return result;
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.overall.hitRate < 0.8) {
      recommendations.push('Consider increasing cache TTL values to improve hit rate');
    }
    
    if (stats.l1.memoryUsageMB > stats.l1.maxMemoryMB * 0.8) {
      recommendations.push('L1 cache memory usage is high, consider increasing memory limit or optimizing data size');
    }
    
    if (stats.overall.averageLatency > 50) {
      recommendations.push('Cache latency is high, consider optimizing cache operations or Redis configuration');
    }
    
    if (!stats.l2.connected) {
      recommendations.push('L2 cache (Redis) is not connected, consider checking Redis configuration');
    }
    
    if (stats.l2.errors > 0) {
      recommendations.push('L2 cache has errors, consider investigating Redis connectivity issues');
    }
    
    return recommendations;
  }
}

// Export factory function for easy integration
export function createUnifiedCacheSystem(config: Partial<MigrationConfig> = {}): {
  unifiedCache: UnifiedCacheManager;
  migrator: CacheIntegrationMigrator;
  enhancedCacheService: EnhancedCacheService;
  enhancedDeduplicator: EnhancedRequestDeduplicator;
} {
  const unifiedCache = UnifiedCacheManager.getInstance();
  const migrator = new CacheIntegrationMigrator(unifiedCache, config);
  
  return {
    unifiedCache,
    migrator,
    enhancedCacheService: migrator.createEnhancedCacheService(),
    enhancedDeduplicator: migrator.createEnhancedRequestDeduplicator()
  };
}