/**
 * Performance Optimizer Service
 * AI-powered performance optimization and recommendation engine
 */

import { CacheService } from '../../../core/src/cache'

import { CachePerformanceMonitor } from './CachePerformanceMonitor';

export interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  requestCount: number;
  errorRate: number;
  timestamp: Date;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'cache' | 'memory' | 'query' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
  estimatedEffort: string;
  createdAt: Date;
}

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class PerformanceOptimizer {
  private monitor: CachePerformanceMonitor;
  private cacheService: CacheService;
  private recommendations: Map<string, OptimizationRecommendation> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private optimizationHistory: PerformanceMetrics[] = [];
  private isRunning: boolean = false;

  // Performance thresholds
  private readonly thresholds = {
    responseTime: 1000, // 1 second
    cacheHitRate: 0.6, // 60%
    memoryUsage: 128 * 1024 * 1024, // 128MB
    errorRate: 0.05, // 5%
  };

  constructor(monitor: CachePerformanceMonitor, cacheService: CacheService) {
    this.monitor = monitor;
    this.cacheService = cacheService;
  }

  /**
   * Start the performance optimization engine
   */
  public start(): void {
    if (this.isRunning) {
      // Already running, no action needed
      return;
    }

    this.isRunning = true;
    // Start monitoring and optimization cycles
    this.startOptimizationCycle();
    this.startAlertMonitoring();
  }

  /**
   * Stop the performance optimization engine
   */
  public stop(): void {
    this.isRunning = false;
    // Performance optimizer stopped
  }

  /**
   * Get current performance metrics
   */
  public async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const metrics = this.monitor.getMetrics();
    
    return {
      responseTime: metrics.averageResponseTime,
      cacheHitRate: metrics.hitRate,
      memoryUsage: process.memoryUsage().heapUsed,
      requestCount: metrics.totalRequests,
      errorRate: metrics.errorCount / Math.max(metrics.totalRequests, 1),
      timestamp: new Date()
    };
  }

  /**
   * Generate optimization recommendations based on current performance
   */
  public async generateRecommendations(): Promise<OptimizationRecommendation[]> {
    const metrics = await this.getCurrentMetrics();
    const recommendations: OptimizationRecommendation[] = [];

    // Cache hit rate optimization
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      recommendations.push({
        id: `cache-hit-rate-${Date.now()}`,
        type: 'cache',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: `Current cache hit rate is ${(metrics.cacheHitRate * 100).toFixed(1)}%, below the target of ${(this.thresholds.cacheHitRate * 100).toFixed(1)}%`,
        expectedImpact: '20-40% improvement in response times',
        implementation: 'Increase cache TTL, optimize cache keys, implement cache warming',
        estimatedEffort: '2-4 hours',
        createdAt: new Date()
      });
    }

    // Response time optimization
    if (metrics.responseTime > this.thresholds.responseTime) {
      recommendations.push({
        id: `response-time-${Date.now()}`,
        type: 'query',
        priority: 'high',
        title: 'Optimize Response Time',
        description: `Average response time is ${metrics.responseTime.toFixed(0)}ms, above the target of ${this.thresholds.responseTime}ms`,
        expectedImpact: '30-50% reduction in response times',
        implementation: 'Optimize database queries, implement request deduplication, add caching layers',
        estimatedEffort: '4-8 hours',
        createdAt: new Date()
      });
    }

    // Memory usage optimization
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push({
        id: `memory-usage-${Date.now()}`,
        type: 'memory',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: `Memory usage is ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB, above the target of ${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        expectedImpact: '15-25% reduction in memory usage',
        implementation: 'Implement cache cleanup, optimize data structures, add memory monitoring',
        estimatedEffort: '3-6 hours',
        createdAt: new Date()
      });
    }

    // Error rate optimization
    if (metrics.errorRate > this.thresholds.errorRate) {
      recommendations.push({
        id: `error-rate-${Date.now()}`,
        type: 'infrastructure',
        priority: 'critical',
        title: 'Reduce Error Rate',
        description: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%, above the target of ${(this.thresholds.errorRate * 100).toFixed(2)}%`,
        expectedImpact: 'Improved system reliability and user experience',
        implementation: 'Implement better error handling, add retry logic, improve monitoring',
        estimatedEffort: '6-12 hours',
        createdAt: new Date()
      });
    }

    // Store recommendations
    recommendations.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });

    return recommendations;
  }

  /**
   * Get all current recommendations
   */
  public getRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.recommendations.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Get performance alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve a performance alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get performance history
   */
  public getPerformanceHistory(limit: number = 100): PerformanceMetrics[] {
    return this.optimizationHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Apply automatic optimizations
   */
  public async applyAutomaticOptimizations(): Promise<void> {
    const metrics = await this.getCurrentMetrics();

    // Auto-optimize cache settings
    if (metrics.cacheHitRate < 0.7) {
      await this.optimizeCacheSettings();
    }

    // Auto-cleanup memory if usage is high
    if (metrics.memoryUsage > this.thresholds.memoryUsage * 0.8) {
      await this.performMemoryCleanup();
    }
  }

  /**
   * Start the optimization cycle
   */
  private startOptimizationCycle(): void {
    const runCycle = async () => {
      if (!this.isRunning) return;

      try {
        // Collect current metrics
        const metrics = await this.getCurrentMetrics();
        this.optimizationHistory.push(metrics);

        // Keep only last 1000 metrics
        if (this.optimizationHistory.length > 1000) {
          this.optimizationHistory = this.optimizationHistory.slice(-1000);
        }

        // Generate recommendations
        await this.generateRecommendations();

        // Apply automatic optimizations
        await this.applyAutomaticOptimizations();

      } catch (error) {
        // Log error through proper logging system
        this.createAlert('critical', 'system', 0, 0, `Optimization cycle error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Schedule next cycle
      setTimeout(runCycle, 60000); // Run every minute
    };

    runCycle();
  }

  /**
   * Start alert monitoring
   */
  private startAlertMonitoring(): void {
    const checkAlerts = async () => {
      if (!this.isRunning) return;

      try {
        const metrics = await this.getCurrentMetrics();

        // Check response time alert
        if (metrics.responseTime > this.thresholds.responseTime) {
          this.createAlert('error', 'responseTime', metrics.responseTime, this.thresholds.responseTime,
            `Response time ${metrics.responseTime.toFixed(0)}ms exceeds threshold`);
        }

        // Check cache hit rate alert
        if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
          this.createAlert('warning', 'cacheHitRate', metrics.cacheHitRate, this.thresholds.cacheHitRate,
            `Cache hit rate ${(metrics.cacheHitRate * 100).toFixed(1)}% below threshold`);
        }

        // Check memory usage alert
        if (metrics.memoryUsage > this.thresholds.memoryUsage) {
          this.createAlert('warning', 'memoryUsage', metrics.memoryUsage, this.thresholds.memoryUsage,
            `Memory usage ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB exceeds threshold`);
        }

        // Check error rate alert
        if (metrics.errorRate > this.thresholds.errorRate) {
          this.createAlert('critical', 'errorRate', metrics.errorRate, this.thresholds.errorRate,
            `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold`);
        }

      } catch (error) {
        // Log error through proper logging system
        this.createAlert('critical', 'monitoring', 0, 0, `Alert monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Schedule next check
      setTimeout(checkAlerts, 30000); // Check every 30 seconds
    };

    checkAlerts();
  }

  /**
   * Create a performance alert
   */
  private createAlert(severity: PerformanceAlert['severity'], metric: string, 
                     currentValue: number, threshold: number, message: string): void {
    const alertId = `${metric}-${Date.now()}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      severity,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    // Alert created and stored for monitoring dashboard
  }

  /**
   * Optimize cache settings automatically
   */
  private async optimizeCacheSettings(): Promise<void> {
    try {
      // Increase TTL for frequently accessed items
      // This would integrate with the CacheService to adjust settings
      // Cache settings optimization completed
    } catch (error) {
      this.createAlert('error', 'cache', 0, 0, `Cache optimization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform memory cleanup
   */
  private async performMemoryCleanup(): Promise<void> {
    try {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear expired cache entries
      await this.cacheService.cleanup();

      // Memory cleanup completed
    } catch (error) {
      this.createAlert('error', 'memory', 0, 0, `Memory cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimization summary
   */
  public getOptimizationSummary(): {
    activeRecommendations: number;
    activeAlerts: number;
    lastOptimization: Date | null;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const recommendations = this.getRecommendations();
    const alerts = this.getAlerts();
    const criticalIssues = alerts.filter(a => a.severity === 'critical').length;
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length;

    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (criticalIssues > 0) {
      systemHealth = 'poor';
    } else if (highPriorityRecs > 2) {
      systemHealth = 'fair';
    } else if (alerts.length > 0 || recommendations.length > 0) {
      systemHealth = 'good';
    } else {
      systemHealth = 'excellent';
    }

    return {
      activeRecommendations: recommendations.length,
      activeAlerts: alerts.length,
      lastOptimization: this.optimizationHistory.length > 0 ? 
        this.optimizationHistory[this.optimizationHistory.length - 1].timestamp : null,
      systemHealth
    };
  }
}

export default PerformanceOptimizer;