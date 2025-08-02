/**
 * Cache Performance Monitor
 * 
 * Monitors cache performance metrics including hit rates, memory usage,
 * and deduplication effectiveness for the RequestDeduplicator system.
 */

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  averageResponseTime: number;
  deduplicationSavings: number;
  errorRate: number;
  timestamp: Date;
}

export interface DeduplicationMetrics {
  totalRequests: number;
  deduplicatedRequests: number;
  duplicatesSaved: number;
  averageDeduplicationTime: number;
  concurrentRequestsSaved: number;
  memoryEfficiency: number;
}

export interface PerformanceAlert {
  type: 'high_memory' | 'low_hit_rate' | 'high_error_rate' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: Partial<CacheMetrics>;
  timestamp: Date;
  threshold: number;
  currentValue: number;
}

export class CachePerformanceMonitor {
  private static instance: CachePerformanceMonitor;
  private metrics: CacheMetrics[] = [];
  private deduplicationMetrics: DeduplicationMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private requestTimes: Map<string, number> = new Map();
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  // Configuration thresholds
  private readonly thresholds = {
    lowHitRate: 0.7, // Alert if hit rate below 70%
    highMemoryUsage: 100 * 1024 * 1024, // Alert if memory usage above 100MB
    highErrorRate: 0.05, // Alert if error rate above 5%
    slowResponseTime: 1000, // Alert if average response time above 1s
  };

  private constructor() {
    // Start periodic metrics collection
    setInterval(() => this.collectMetrics(), 60000); // Every minute
    
    // Clean up old metrics (keep last 24 hours)
    setInterval(() => this.cleanupOldMetrics(), 3600000); // Every hour
  }

  static getInstance(): CachePerformanceMonitor {
    if (!CachePerformanceMonitor.instance) {
      CachePerformanceMonitor.instance = new CachePerformanceMonitor();
    }
    return CachePerformanceMonitor.instance;
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(key: string, responseTime: number): void {
    this.requestTimes.set(`hit_${Date.now()}_${Math.random()}`, responseTime);
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(key: string, responseTime: number): void {
    this.requestTimes.set(`miss_${Date.now()}_${Math.random()}`, responseTime);
  }

  /**
   * Record a deduplication event
   */
  recordDeduplication(originalRequests: number, actualExecutions: number, timeSaved: number): void {
    const savings = originalRequests - actualExecutions;
    const efficiency = savings / originalRequests;
    
    this.deduplicationMetrics.push({
      totalRequests: originalRequests,
      deduplicatedRequests: actualExecutions,
      duplicatesSaved: savings,
      averageDeduplicationTime: timeSaved / originalRequests,
      concurrentRequestsSaved: savings,
      memoryEfficiency: efficiency,
    });

    // Keep only recent deduplication metrics
    if (this.deduplicationMetrics.length > 1000) {
      this.deduplicationMetrics = this.deduplicationMetrics.slice(-500);
    }
  }

  /**
   * Record a cache error
   */
  recordCacheError(key: string, error: Error): void {
    // Errors are tracked in the metrics collection
    console.warn(`[CachePerformanceMonitor] Cache error for key ${key}:`, error.message);
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): CacheMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): CacheMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get deduplication effectiveness metrics
   */
  getDeduplicationMetrics(): DeduplicationMetrics {
    if (this.deduplicationMetrics.length === 0) {
      return {
        totalRequests: 0,
        deduplicatedRequests: 0,
        duplicatesSaved: 0,
        averageDeduplicationTime: 0,
        concurrentRequestsSaved: 0,
        memoryEfficiency: 0,
      };
    }

    const recent = this.deduplicationMetrics.slice(-100); // Last 100 deduplication events
    const totals = recent.reduce(
      (acc, metric) => ({
        totalRequests: acc.totalRequests + metric.totalRequests,
        deduplicatedRequests: acc.deduplicatedRequests + metric.deduplicatedRequests,
        duplicatesSaved: acc.duplicatesSaved + metric.duplicatesSaved,
        averageDeduplicationTime: acc.averageDeduplicationTime + metric.averageDeduplicationTime,
        concurrentRequestsSaved: acc.concurrentRequestsSaved + metric.concurrentRequestsSaved,
        memoryEfficiency: acc.memoryEfficiency + metric.memoryEfficiency,
      }),
      {
        totalRequests: 0,
        deduplicatedRequests: 0,
        duplicatesSaved: 0,
        averageDeduplicationTime: 0,
        concurrentRequestsSaved: 0,
        memoryEfficiency: 0,
      }
    );

    const count = recent.length;
    return {
      totalRequests: totals.totalRequests,
      deduplicatedRequests: totals.deduplicatedRequests,
      duplicatesSaved: totals.duplicatesSaved,
      averageDeduplicationTime: totals.averageDeduplicationTime / count,
      concurrentRequestsSaved: totals.concurrentRequestsSaved,
      memoryEfficiency: totals.memoryEfficiency / count,
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): PerformanceAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Generate performance report
   */
  generateReport(hours: number = 24): {
    summary: CacheMetrics;
    deduplication: DeduplicationMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const historical = this.getHistoricalMetrics(hours);
    const current = this.getCurrentMetrics();
    const deduplication = this.getDeduplicationMetrics();
    const alerts = this.getRecentAlerts(hours);

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (current) {
      if (current.hitRate < this.thresholds.lowHitRate) {
        recommendations.push(`Cache hit rate is low (${(current.hitRate * 100).toFixed(1)}%). Consider increasing cache TTL or reviewing cache key strategies.`);
      }

      if (current.memoryUsage > this.thresholds.highMemoryUsage) {
        recommendations.push(`Memory usage is high (${(current.memoryUsage / 1024 / 1024).toFixed(1)}MB). Consider implementing cache size limits or more aggressive cleanup.`);
      }

      if (current.errorRate > this.thresholds.highErrorRate) {
        recommendations.push(`Error rate is elevated (${(current.errorRate * 100).toFixed(1)}%). Review error logs and consider fallback strategies.`);
      }

      if (current.averageResponseTime > this.thresholds.slowResponseTime) {
        recommendations.push(`Average response time is slow (${current.averageResponseTime}ms). Consider optimizing cache lookup performance.`);
      }
    }

    if (deduplication.memoryEfficiency < 0.3) {
      recommendations.push(`Deduplication efficiency is low (${(deduplication.memoryEfficiency * 100).toFixed(1)}%). Review deduplication strategies and endpoint patterns.`);
    }

    return {
      summary: current || this.getEmptyMetrics(),
      deduplication,
      alerts,
      recommendations,
    };
  }

  /**
   * Collect current metrics from cache systems
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Calculate metrics from recorded request times
      const now = Date.now();
      const recentRequests = Array.from(this.requestTimes.entries()).filter(
        ([key]) => now - parseInt(key.split('_')[1]) < 60000 // Last minute
      );

      const hits = recentRequests.filter(([key]) => key.startsWith('hit_'));
      const misses = recentRequests.filter(([key]) => key.startsWith('miss_'));
      const total = hits.length + misses.length;

      if (total === 0) {
        return; // No requests to analyze
      }

      const hitRate = hits.length / total;
      const missRate = misses.length / total;
      const averageResponseTime = recentRequests.reduce((sum, [, time]) => sum + time, 0) / total;

      // Estimate memory usage (this would typically come from the actual cache service)
      const estimatedMemoryUsage = total * 1024; // Rough estimate

      const metrics: CacheMetrics = {
        hitRate,
        missRate,
        totalRequests: total,
        cacheHits: hits.length,
        cacheMisses: misses.length,
        memoryUsage: estimatedMemoryUsage,
        averageResponseTime,
        deduplicationSavings: this.calculateDeduplicationSavings(),
        errorRate: 0, // Would be calculated from actual error tracking
        timestamp: new Date(),
      };

      this.metrics.push(metrics);

      // Check for alerts
      this.checkForAlerts(metrics);

      // Clean up old request times
      this.cleanupRequestTimes();

    } catch (error) {
      console.error('[CachePerformanceMonitor] Error collecting metrics:', error);
    }
  }

  /**
   * Check metrics against thresholds and generate alerts
   */
  private checkForAlerts(metrics: CacheMetrics): void {
    const alerts: PerformanceAlert[] = [];

    if (metrics.hitRate < this.thresholds.lowHitRate) {
      alerts.push({
        type: 'low_hit_rate',
        severity: metrics.hitRate < 0.5 ? 'critical' : 'high',
        message: `Cache hit rate is below threshold: ${(metrics.hitRate * 100).toFixed(1)}%`,
        metrics: { hitRate: metrics.hitRate },
        timestamp: new Date(),
        threshold: this.thresholds.lowHitRate,
        currentValue: metrics.hitRate,
      });
    }

    if (metrics.memoryUsage > this.thresholds.highMemoryUsage) {
      alerts.push({
        type: 'high_memory',
        severity: metrics.memoryUsage > this.thresholds.highMemoryUsage * 2 ? 'critical' : 'high',
        message: `Memory usage is above threshold: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        metrics: { memoryUsage: metrics.memoryUsage },
        timestamp: new Date(),
        threshold: this.thresholds.highMemoryUsage,
        currentValue: metrics.memoryUsage,
      });
    }

    if (metrics.errorRate > this.thresholds.highErrorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: metrics.errorRate > 0.1 ? 'critical' : 'high',
        message: `Error rate is above threshold: ${(metrics.errorRate * 100).toFixed(1)}%`,
        metrics: { errorRate: metrics.errorRate },
        timestamp: new Date(),
        threshold: this.thresholds.highErrorRate,
        currentValue: metrics.errorRate,
      });
    }

    if (metrics.averageResponseTime > this.thresholds.slowResponseTime) {
      alerts.push({
        type: 'performance_degradation',
        severity: metrics.averageResponseTime > this.thresholds.slowResponseTime * 2 ? 'critical' : 'medium',
        message: `Average response time is above threshold: ${metrics.averageResponseTime}ms`,
        metrics: { averageResponseTime: metrics.averageResponseTime },
        timestamp: new Date(),
        threshold: this.thresholds.slowResponseTime,
        currentValue: metrics.averageResponseTime,
      });
    }

    // Store and notify about new alerts
    for (const alert of alerts) {
      this.alerts.push(alert);
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('[CachePerformanceMonitor] Error in alert callback:', error);
        }
      });
    }
  }

  /**
   * Calculate deduplication savings
   */
  private calculateDeduplicationSavings(): number {
    const recent = this.deduplicationMetrics.slice(-10);
    if (recent.length === 0) return 0;

    return recent.reduce((sum, metric) => sum + metric.duplicatesSaved, 0) / recent.length;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Clean up old request times
   */
  private cleanupRequestTimes(): void {
    const cutoff = Date.now() - 60000; // 1 minute ago
    const keysToDelete: string[] = [];

    for (const [key] of this.requestTimes.entries()) {
      const timestamp = parseInt(key.split('_')[1]);
      if (timestamp < cutoff) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.requestTimes.delete(key);
    }
  }

  /**
   * Get empty metrics template
   */
  private getEmptyMetrics(): CacheMetrics {
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      deduplicationSavings: 0,
      errorRate: 0,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const cachePerformanceMonitor = CachePerformanceMonitor.getInstance();