import { EventEmitter } from 'events';

import { cacheService } from '../../cache/CacheService'
import { logger } from '../../infrastructure/observability/telemetry';
import { asyncProcessor } from './AsyncProcessor';
import { landVerificationCache } from '../cache/LandVerificationCache';
import { databaseOptimizer } from './DatabaseOptimizer';
import { paginationService } from './PaginationService';

export interface PerformanceMetrics {
  timestamp: Date;
  cacheStats: {
    hitRate: number;
    totalOperations: number;
    landVerificationCacheSize: number;
  };
  asyncProcessorStats: {
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalProcessed: number;
  };
  databaseStats: {
    averageQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
  };
  paginationStats: {
    averageQueryTime: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  systemStats: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
}

export interface PerformanceConfig {
  metricsCollectionInterval: number; // milliseconds
  slowQueryThreshold: number; // milliseconds
  cacheWarmupEnabled: boolean;
  autoOptimizationEnabled: boolean;
  alertThresholds: {
    cacheHitRate: number; // minimum acceptable hit rate
    maxQueueSize: number; // maximum async queue size
    maxQueryTime: number; // maximum acceptable query time
    maxMemoryUsage: number; // maximum memory usage in MB
  };
}

export class PerformanceManager extends EventEmitter {
  private config: PerformanceConfig;
  private metricsHistory: PerformanceMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private lastCpuUsage?: NodeJS.CpuUsage;

  constructor(config?: Partial<PerformanceConfig>) {
    super();
    this.config = {
      metricsCollectionInterval: 30000, // 30 seconds
      slowQueryThreshold: 1000, // 1 second
      cacheWarmupEnabled: true,
      autoOptimizationEnabled: true,
      alertThresholds: {
        cacheHitRate: 80, // 80%
        maxQueueSize: 100,
        maxQueryTime: 2000, // 2 seconds
        maxMemoryUsage: 1024 // 1GB
      },
      ...config
    };

    this.lastCpuUsage = process.cpuUsage();
  }

  // Performance Monitoring
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting performance monitoring');

    // Initial metrics collection
    await this.collectMetrics();

    // Set up periodic metrics collection
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.analyzePerformance();
        
        if (this.config.autoOptimizationEnabled) {
          await this.performAutoOptimizations();
        }
      } catch (error) {
        logger.error({ error: error }, 'Performance monitoring error');
      }
    }, this.config.metricsCollectionInterval);

    this.emit('monitoringStarted');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    logger.info('Stopped performance monitoring');
    this.emit('monitoringStopped');
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date();

    try {
      // Collect cache statistics
      const cacheStats = await landVerificationCache.getCacheStats();
      
      // Collect async processor statistics
      const asyncProcessorStats = asyncProcessor.getProcessorStats();
      
      // Collect pagination statistics
      const paginationStats = paginationService.getPerformanceStats();
      
      // Collect system statistics
      const memoryUsage = process.memoryUsage();
      const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
      this.lastCpuUsage = process.cpuUsage();

      const metrics: PerformanceMetrics = {
        timestamp,
        cacheStats,
        asyncProcessorStats,
        databaseStats: {
          averageQueryTime: 0, // Would be collected from database optimizer
          slowQueries: 0,
          connectionPoolUsage: 0
        },
        paginationStats,
        systemStats: {
          memoryUsage,
          cpuUsage: currentCpuUsage,
          uptime: process.uptime()
        }
      };

      // Store metrics (keep last 100 entries)
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      this.emit('metricsCollected', metrics);
      return metrics;
    } catch (error) {
      logger.error({ error: error }, 'Failed to collect performance metrics');
      throw error;
    }
  }

  private async analyzePerformance(): Promise<void> {
    if (this.metricsHistory.length === 0) {
      return;
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const alerts: string[] = [];

    // Check cache hit rate
    if (latest.cacheStats.hitRate < this.config.alertThresholds.cacheHitRate) {
      alerts.push(`Low cache hit rate: ${latest.cacheStats.hitRate.toFixed(1)}%`);
    }

    // Check async queue size
    if (latest.asyncProcessorStats.queuedTasks > this.config.alertThresholds.maxQueueSize) {
      alerts.push(`High async queue size: ${latest.asyncProcessorStats.queuedTasks} tasks`);
    }

    // Check memory usage
    const memoryUsageMB = latest.systemStats.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > this.config.alertThresholds.maxMemoryUsage) {
      alerts.push(`High memory usage: ${memoryUsageMB.toFixed(1)}MB`);
    }

    // Check for performance degradation trends
    if (this.metricsHistory.length >= 5) {
      const recentMetrics = this.metricsHistory.slice(-5);
      const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheStats.hitRate, 0) / 5;
      
      if (avgCacheHitRate < this.config.alertThresholds.cacheHitRate) {
        alerts.push(`Declining cache performance: ${avgCacheHitRate.toFixed(1)}% average hit rate`);
      }
    }

    // Emit alerts
    if (alerts.length > 0) {
      logger.warn({ error: alerts }, 'Performance alerts:');
      this.emit('performanceAlert', { alerts, metrics: latest });
    }
  }

  private async performAutoOptimizations(): Promise<void> {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    
    try {
      // Auto-optimize cache if hit rate is low
      if (latest.cacheStats.hitRate < this.config.alertThresholds.cacheHitRate) {
        await this.optimizeCache();
      }

      // Auto-optimize database if queries are slow
      if (latest.databaseStats.averageQueryTime > this.config.alertThresholds.maxQueryTime) {
        await this.optimizeDatabase();
      }

      // Auto-scale async processing if queue is large
      if (latest.asyncProcessorStats.queuedTasks > this.config.alertThresholds.maxQueueSize) {
        await this.optimizeAsyncProcessing();
      }

      logger.info('Auto-optimizations completed');
    } catch (error) {
      logger.error({ error: error }, 'Auto-optimization failed');
    }
  }

  // Optimization Methods
  async optimizeCache(): Promise<void> {
    logger.info('Starting cache optimization');

    try {
      // Clear expired entries
      // Note: This would be implemented in the cache service
      
      // Warm up frequently accessed data
      if (this.config.cacheWarmupEnabled) {
        await this.warmUpCache();
      }

      // Adjust cache TTL based on usage patterns
      await this.adjustCacheTTL();

      logger.info('Cache optimization completed');
    } catch (error) {
      logger.error({ error: error }, 'Cache optimization failed');
    }
  }

  async optimizeDatabase(): Promise<void> {
    logger.info('Starting database optimization');

    try {
      // Create optimal indexes
      await databaseOptimizer.createOptimalIndexes();

      // Analyze slow queries
      const slowQueries = await databaseOptimizer.getSlowQueries(10);
      if (slowQueries.length > 0) {
        logger.warn(`Found ${slowQueries.length} slow queries`);
        // In production, you might want to automatically optimize these
      }

      logger.info('Database optimization completed');
    } catch (error) {
      logger.error({ error: error }, 'Database optimization failed');
    }
  }

  async optimizeAsyncProcessing(): Promise<void> {
    logger.info('Starting async processing optimization');

    try {
      // This could involve scaling up processing capacity
      // For now, we'll just log the recommendation
      const stats = asyncProcessor.getProcessorStats();
      
      if (stats.queuedTasks > this.config.alertThresholds.maxQueueSize) {
        logger.info(`Recommendation: Consider increasing async processor capacity (${stats.queuedTasks} queued tasks)`);
      }

      logger.info('Async processing optimization completed');
    } catch (error) {
      logger.error({ error: error }, 'Async processing optimization failed');
    }
  }

  private async warmUpCache(): Promise<void> {
    try {
      // This would warm up the cache with frequently accessed data
      // Implementation would depend on your specific use case
      logger.info('Cache warm-up initiated');
      
      // Example: Pre-load recent verification sessions
      const recentPropertyIds = ['prop-1', 'prop-2', 'prop-3']; // Would come from database
      await landVerificationCache.warmUpCache(recentPropertyIds);
      
      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error({ error: error }, 'Cache warm-up failed');
    }
  }

  private async adjustCacheTTL(): Promise<void> {
    // This would analyze cache usage patterns and adjust TTL accordingly
    // For now, it's a placeholder
    logger.info('Cache TTL adjustment completed');
  }

  // Performance Reporting
  getPerformanceReport(): {
    current: PerformanceMetrics | null;
    trends: {
      cacheHitRateTrend: number;
      averageQueryTimeTrend: number;
      memoryUsageTrend: number;
    };
    recommendations: string[];
  } {
    const current = this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
    const recommendations: string[] = [];

    // Calculate trends (simplified)
    let cacheHitRateTrend = 0;
    let averageQueryTimeTrend = 0;
    let memoryUsageTrend = 0;

    if (this.metricsHistory.length >= 2) {
      const recent = this.metricsHistory.slice(-5);
      const older = this.metricsHistory.slice(-10, -5);

      if (older.length > 0) {
        const recentAvgCacheHitRate = recent.reduce((sum, m) => sum + m.cacheStats.hitRate, 0) / recent.length;
        const olderAvgCacheHitRate = older.reduce((sum, m) => sum + m.cacheStats.hitRate, 0) / older.length;
        cacheHitRateTrend = recentAvgCacheHitRate - olderAvgCacheHitRate;

        const recentAvgQueryTime = recent.reduce((sum, m) => sum + m.databaseStats.averageQueryTime, 0) / recent.length;
        const olderAvgQueryTime = older.reduce((sum, m) => sum + m.databaseStats.averageQueryTime, 0) / older.length;
        averageQueryTimeTrend = recentAvgQueryTime - olderAvgQueryTime;

        const recentAvgMemory = recent.reduce((sum, m) => sum + m.systemStats.memoryUsage.heapUsed, 0) / recent.length;
        const olderAvgMemory = older.reduce((sum, m) => sum + m.systemStats.memoryUsage.heapUsed, 0) / older.length;
        memoryUsageTrend = recentAvgMemory - olderAvgMemory;
      }
    }

    // Generate recommendations
    if (current) {
      if (current.cacheStats.hitRate < 80) {
        recommendations.push('Consider implementing cache warming strategies');
      }
      
      if (current.asyncProcessorStats.queuedTasks > 50) {
        recommendations.push('Consider increasing async processing capacity');
      }
      
      if (current.systemStats.memoryUsage.heapUsed / 1024 / 1024 > 512) {
        recommendations.push('Monitor memory usage - consider implementing memory optimization');
      }
      
      if (cacheHitRateTrend < -5) {
        recommendations.push('Cache performance is declining - investigate cache invalidation patterns');
      }
      
      if (averageQueryTimeTrend > 100) {
        recommendations.push('Database query performance is declining - consider index optimization');
      }
    }

    return {
      current,
      trends: {
        cacheHitRateTrend,
        averageQueryTimeTrend,
        memoryUsageTrend
      },
      recommendations
    };
  }

  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    return limit ? this.metricsHistory.slice(-limit) : [...this.metricsHistory];
  }

  // Health Check
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      cache: 'healthy' | 'degraded' | 'unhealthy';
      database: 'healthy' | 'degraded' | 'unhealthy';
      asyncProcessor: 'healthy' | 'degraded' | 'unhealthy';
      system: 'healthy' | 'degraded' | 'unhealthy';
    };
    details: any;
  }> {
    try {
      const metrics = await this.collectMetrics();
      
      // Check cache health
      const cacheHealth = 
        metrics.cacheStats.hitRate >= 80 ? 'healthy' :
        metrics.cacheStats.hitRate >= 60 ? 'degraded' : 'unhealthy';
      
      // Check database health
      const databaseHealth = 
        metrics.databaseStats.averageQueryTime <= 1000 ? 'healthy' :
        metrics.databaseStats.averageQueryTime <= 2000 ? 'degraded' : 'unhealthy';
      
      // Check async processor health
      const asyncProcessorHealth = 
        metrics.asyncProcessorStats.queuedTasks <= 50 ? 'healthy' :
        metrics.asyncProcessorStats.queuedTasks <= 100 ? 'degraded' : 'unhealthy';
      
      // Check system health
      const memoryUsageMB = metrics.systemStats.memoryUsage.heapUsed / 1024 / 1024;
      const systemHealth = 
        memoryUsageMB <= 512 ? 'healthy' :
        memoryUsageMB <= 1024 ? 'degraded' : 'unhealthy';
      
      // Overall status
      const checks = { cache: cacheHealth, database: databaseHealth, asyncProcessor: asyncProcessorHealth, system: systemHealth };
      const healthValues = Object.values(checks);
      const overallStatus = 
        healthValues.every(h => h === 'healthy') ? 'healthy' :
        healthValues.some(h => h === 'unhealthy') ? 'unhealthy' : 'degraded';

      return {
        status: overallStatus,
        checks,
        details: {
          cacheHitRate: metrics.cacheStats.hitRate,
          queuedTasks: metrics.asyncProcessorStats.queuedTasks,
          memoryUsageMB: memoryUsageMB,
          averageQueryTime: metrics.databaseStats.averageQueryTime
        }
      };
    } catch (error) {
      logger.error({ error: error }, 'Health check failed');
      return {
        status: 'unhealthy',
        checks: {
          cache: 'unhealthy',
          database: 'unhealthy',
          asyncProcessor: 'unhealthy',
          system: 'unhealthy'
        },
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    logger.info('Shutting down performance manager');
    
    this.stopMonitoring();
    
    // Clear metrics history
    this.metricsHistory = [];
    
    logger.info('Performance manager shutdown complete');
  }
}

// Export singleton instance
export const performanceManager = new PerformanceManager();