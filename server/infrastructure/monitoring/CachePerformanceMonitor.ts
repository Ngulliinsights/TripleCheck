/**
 * Cache Performance Monitor
 *
 * Monitors cache performance metrics including hit rates, memory usage,
 * and deduplication effectiveness for the RequestDeduplicator system.
 */

import { randomUUID } from 'crypto';          // ← cryptographically strong

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

export interface UnifiedCacheMetrics {
  l1HitRate: number;
  l2HitRate: number;
  overallHitRate: number;
  l1MemoryUsage: number;
  totalRequests: number;
  averageLatency: number;
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
    lowHitRate: 0.7,
    highMemoryUsage: 100 * 1024 * 1024,
    highErrorRate: 0.05,
    slowResponseTime: 1000,
  };

  private constructor() {
    setInterval(() => this.collectMetrics(), 60000);
    setInterval(() => this.cleanupOldMetrics(), 3600000);
  }

  static getInstance(): CachePerformanceMonitor {
    if (!CachePerformanceMonitor.instance) {
      CachePerformanceMonitor.instance = new CachePerformanceMonitor();
    }
    return CachePerformanceMonitor.instance;
  }

  recordCacheHit(key: string, responseTime: number): void {
    this.requestTimes.set(`hit_${Date.now()}_${randomUUID()}`, responseTime);
  }

  recordCacheMiss(key: string, responseTime: number): void {
    this.requestTimes.set(`miss_${Date.now()}_${randomUUID()}`, responseTime);
  }

  recordDeduplication(
    originalRequests: number,
    actualExecutions: number,
    timeSaved: number
  ): void {
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

    if (this.deduplicationMetrics.length > 1000) {
      this.deduplicationMetrics = this.deduplicationMetrics.slice(-500);
    }
  }

  recordCacheError(key: string, error: Error): void {
    console.warn(`[CachePerformanceMonitor] Cache error for key ${key}:`, error.message); // eslint-disable-line
  }

  recordCacheStats(stats: UnifiedCacheMetrics): void {
    // Store unified cache statistics for monitoring
    const enhancedStats = {
      ...stats,
      timestamp: new Date()
    };
    
    // You could store these in a separate array or integrate with existing metrics
    // For now, we'll just log them for monitoring purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('[CachePerformanceMonitor] Unified Cache Stats:', enhancedStats); // eslint-disable-line
    }
  }

  getCurrentMetrics(): CacheMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getHistoricalMetrics(hours = 24): CacheMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter((m) => m.timestamp >= cutoff);
  }

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

    const recent = this.deduplicationMetrics.slice(-100);
    const totals = recent.reduce(
      (acc, m) => ({
        totalRequests: acc.totalRequests + m.totalRequests,
        deduplicatedRequests: acc.deduplicatedRequests + m.deduplicatedRequests,
        duplicatesSaved: acc.duplicatesSaved + m.duplicatesSaved,
        averageDeduplicationTime: acc.averageDeduplicationTime + m.averageDeduplicationTime,
        concurrentRequestsSaved: acc.concurrentRequestsSaved + m.concurrentRequestsSaved,
        memoryEfficiency: acc.memoryEfficiency + m.memoryEfficiency,
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

  getRecentAlerts(hours = 24): PerformanceAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter((a) => a.timestamp >= cutoff);
  }

  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  generateReport(hours = 24) {
    const current = this.getCurrentMetrics();
    const deduplication = this.getDeduplicationMetrics();
    const alerts = this.getRecentAlerts(hours);

    const recommendations: string[] = [];

    if (current) {
      if (current.hitRate < this.thresholds.lowHitRate) {
        recommendations.push(
          `Cache hit rate is low (${(current.hitRate * 100).toFixed(1)}%). Consider increasing cache TTL or reviewing cache key strategies.`
        );
      }
      if (current.memoryUsage > this.thresholds.highMemoryUsage) {
        recommendations.push(
          `Memory usage is high (${(current.memoryUsage / 1024 / 1024).toFixed(1)}MB). Consider implementing cache size limits or more aggressive cleanup.`
        );
      }
      if (current.errorRate > this.thresholds.highErrorRate) {
        recommendations.push(
          `Error rate is elevated (${(current.errorRate * 100).toFixed(1)}%). Review error logs and consider fallback strategies.`
        );
      }
      if (current.averageResponseTime > this.thresholds.slowResponseTime) {
        recommendations.push(
          `Average response time is slow (${current.averageResponseTime}ms). Consider optimizing cache lookup performance.`
        );
      }
    }

    if (deduplication.memoryEfficiency < 0.3) {
      recommendations.push(
        `Deduplication efficiency is low (${(deduplication.memoryEfficiency * 100).toFixed(1)}%). Review deduplication strategies and endpoint patterns.`
      );
    }

    return {
      summary: current ?? this.getEmptyMetrics(),
      deduplication,
      alerts,
      recommendations,
    };
  }

  private async collectMetrics(): Promise<void> {
    try {
      const now = Date.now();
      const recent = Array.from(this.requestTimes.entries()).filter(
        ([k]) => now - parseInt(k.split('_')[1]!) < 60000 // non-null assertion
      );

      const hits = recent.filter(([k]) => k.startsWith('hit_'));
      const misses = recent.filter(([k]) => k.startsWith('miss_'));
      const total = hits.length + misses.length;

      if (total === 0) return;

      const hitRate = hits.length / total;
      const missRate = misses.length / total;
      const averageResponseTime =
        recent.reduce((sum, [, t]) => sum + t, 0) / total;

      const estimatedMemoryUsage = total * 1024;

      const metrics: CacheMetrics = {
        hitRate,
        missRate,
        totalRequests: total,
        cacheHits: hits.length,
        cacheMisses: misses.length,
        memoryUsage: estimatedMemoryUsage,
        averageResponseTime,
        deduplicationSavings: this.calculateDeduplicationSavings(),
        errorRate: 0,
        timestamp: new Date(),
      };

      this.metrics.push(metrics);
      this.checkForAlerts(metrics);
      this.cleanupRequestTimes();
    } catch (error) {
      console.error('[CachePerformanceMonitor] Error collecting metrics:', error); // eslint-disable-line
    }
  }

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
        severity:
          metrics.averageResponseTime > this.thresholds.slowResponseTime * 2 ? 'critical' : 'medium',
        message: `Average response time is above threshold: ${metrics.averageResponseTime}ms`,
        metrics: { averageResponseTime: metrics.averageResponseTime },
        timestamp: new Date(),
        threshold: this.thresholds.slowResponseTime,
        currentValue: metrics.averageResponseTime,
      });
    }

    alerts.forEach((alert) => {
      this.alerts.push(alert);
      this.alertCallbacks.forEach((cb) => {
        try {
          cb(alert);
        } catch (e) {
          console.error('[CachePerformanceMonitor] Error in alert callback:', e); // eslint-disable-line
        }
      });
    });
  }

  private calculateDeduplicationSavings(): number {
    const recent = this.deduplicationMetrics.slice(-10);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, m) => sum + m.duplicatesSaved, 0) / recent.length;
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
    this.alerts = this.alerts.filter((a) => a.timestamp >= cutoff);
  }

  private cleanupRequestTimes(): void {
    const cutoff = Date.now() - 60000;
    const toDelete: string[] = [];
    for (const [key] of this.requestTimes) {
      const ts = parseInt(key.split('_')[1]!); // non-null assertion
      if (ts < cutoff) toDelete.push(key);
    }
    toDelete.forEach((k) => this.requestTimes.delete(k));
  }

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

export const cachePerformanceMonitor = CachePerformanceMonitor.getInstance();