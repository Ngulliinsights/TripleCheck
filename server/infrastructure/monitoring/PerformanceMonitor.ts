/**
 * Comprehensive Performance Monitoring System
 * 
 * Provides real-time performance tracking, metrics collection,
 * and optimization recommendations across all services.
 */

import { EventEmitter } from 'events';

import { logger } from './logger';

export interface PerformanceMetric {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  timestamp: Date;
  context?: string;
  tags?: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export enum MetricCategory {
  RESPONSE_TIME = 'RESPONSE_TIME',
  THROUGHPUT = 'THROUGHPUT',
  ERROR_RATE = 'ERROR_RATE',
  RESOURCE_USAGE = 'RESOURCE_USAGE',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  BUSINESS_METRIC = 'BUSINESS_METRIC',
  SECURITY = 'SECURITY'
}

export enum MetricUnit {
  MILLISECONDS = 'ms',
  SECONDS = 's',
  REQUESTS_PER_SECOND = 'rps',
  PERCENTAGE = '%',
  BYTES = 'bytes',
  MEGABYTES = 'MB',
  COUNT = 'count',
  RATIO = 'ratio'
}

export interface PerformanceAlert {
  id: string;
  metricId: string;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  recommendations: string[];
  trends: {
    responseTime: 'improving' | 'stable' | 'degrading';
    errorRate: 'improving' | 'stable' | 'degrading';
    throughput: 'improving' | 'stable' | 'degrading';
  };
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private timers: Map<string, { start: number; context?: string }> = new Map();
  private counters: Map<string, number> = new Map();
  private isEnabled: boolean = true;
  private cleanupInterval: NodeJS.Timeout;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    super();
    this.startCleanupTask();
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId: string, context?: string): void {
    if (!this.isEnabled) return;
    
    this.timers.set(operationId, {
      start: performance.now(),
      context
    });
  }

  /**
   * End timing and record metric
   */
  endTimer(
    operationId: string,
    metricName: string,
    category: MetricCategory = MetricCategory.RESPONSE_TIME,
    tags?: Record<string, string>
  ): number {
    if (!this.isEnabled) return 0;
    
    const timer = this.timers.get(operationId);
    if (!timer) {
      logger.warn('Timer not found for operation: ${operationId}');
      return 0;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(operationId);

    this.recordMetric({
      name: metricName,
      category,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      context: timer.context,
      tags,
      threshold: this.getDefaultThreshold(category)
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: new Date(),
      ...metric
    };

    // Store metric
    const metricKey = `${metric.category}:${metric.name}`;
    const existingMetrics = this.metrics.get(metricKey) || [];
    existingMetrics.push(fullMetric);
    
    // Keep only last 1000 metrics per key
    if (existingMetrics.length > 1000) {
      existingMetrics.shift();
    }
    
    this.metrics.set(metricKey, existingMetrics);

    // Check thresholds and create alerts
    this.checkThresholds(fullMetric);

    // Emit metric event
    this.emit('metric', fullMetric);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const counterKey = `${name}:${JSON.stringify(tags || {})}`;
    const currentValue = this.counters.get(counterKey) || 0;
    const newValue = currentValue + value;
    this.counters.set(counterKey, newValue);

    this.recordMetric({
      name,
      category: MetricCategory.BUSINESS_METRIC,
      value: newValue,
      unit: MetricUnit.COUNT,
      tags
    });
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number,
    success: boolean = true
  ): void {
    this.recordMetric({
      name: `db_${operation}`,
      category: MetricCategory.DATABASE,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      context: table,
      tags: {
        operation,
        table,
        success: success.toString(),
        ...(recordCount !== undefined && { recordCount: recordCount.toString() })
      },
      threshold: {
        warning: 1000, // 1 second
        critical: 5000  // 5 seconds
      }
    });

    // Track error rate
    if (!success) {
      this.incrementCounter('database_errors', 1, { operation, table });
    }
  }

  /**
   * Record API endpoint metrics
   */
  recordApiEndpoint(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: number
  ): void {
    const isError = statusCode >= 400;
    
    this.recordMetric({
      name: 'api_response_time',
      category: MetricCategory.RESPONSE_TIME,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      context: `${method} ${path}`,
      tags: {
        method,
        path,
        statusCode: statusCode.toString(),
        ...(userId && { userId: userId.toString() })
      },
      threshold: {
        warning: 2000, // 2 seconds
        critical: 10000 // 10 seconds
      }
    });

    // Track throughput
    this.incrementCounter('api_requests', 1, { method, path });

    // Track errors
    if (isError) {
      this.incrementCounter('api_errors', 1, { method, path, statusCode: statusCode.toString() });
    }
  }

  /**
   * Record external service call metrics
   */
  recordExternalService(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    statusCode?: number
  ): void {
    this.recordMetric({
      name: 'external_service_response_time',
      category: MetricCategory.EXTERNAL_SERVICE,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      context: service,
      tags: {
        service,
        operation,
        success: success.toString(),
        ...(statusCode && { statusCode: statusCode.toString() })
      },
      threshold: {
        warning: 5000,  // 5 seconds
        critical: 15000 // 15 seconds
      }
    });

    if (!success) {
      this.incrementCounter('external_service_errors', 1, { service, operation });
    }
  }

  /**
   * Record memory usage metrics
   */
  recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    Object.entries(memoryUsage).forEach(([key, value]) => {
      this.recordMetric({
        name: `memory_${key}`,
        category: MetricCategory.RESOURCE_USAGE,
        value: value / 1024 / 1024, // Convert to MB
        unit: MetricUnit.MEGABYTES,
        threshold: {
          warning: key === 'heapUsed' ? 500 : 1000,
          critical: key === 'heapUsed' ? 800 : 1500
        }
      });
    });
  }

  /**
   * Get performance metrics for a specific category
   */
  getMetrics(
    category?: MetricCategory,
    name?: string,
    timeRange?: { start: Date; end: Date }
  ): PerformanceMetric[] {
    let allMetrics: PerformanceMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      const [metricCategory, metricName] = key.split(':');
      
      if (category && metricCategory !== category) continue;
      if (name && metricName !== name) continue;
      
      let filteredMetrics = metrics;
      
      if (timeRange) {
        filteredMetrics = metrics.filter(metric => 
          metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
        );
      }
      
      allMetrics = allMetrics.concat(filteredMetrics);
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Generate performance report
   */
  generateReport(timeRange: { start: Date; end: Date }): PerformanceReport {
    const metrics = this.getMetrics(undefined, undefined, timeRange);
    const alerts = Array.from(this.alerts.values()).filter(alert => 
      alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
    );

    // Calculate summary statistics
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time');
    const errorMetrics = metrics.filter(m => m.name === 'api_errors');
    const requestMetrics = metrics.filter(m => m.name === 'api_requests');

    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const averageResponseTime = apiMetrics.length > 0 ? 
      apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length : 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const throughput = totalRequests / ((timeRange.end.getTime() - timeRange.start.getTime()) / 1000);

    return {
      period: timeRange,
      summary: {
        totalRequests,
        averageResponseTime,
        errorRate,
        throughput,
        uptime: this.calculateUptime(timeRange)
      },
      metrics,
      alerts,
      recommendations: this.generateRecommendations(metrics, alerts),
      trends: this.calculateTrends(metrics)
    };
  }

  /**
   * Get real-time performance dashboard data
   */
  getDashboardData(): {
    currentMetrics: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      memoryUsage: number;
    };
    recentAlerts: PerformanceAlert[];
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentMetrics = this.getMetrics(undefined, undefined, {
      start: fiveMinutesAgo,
      end: now
    });

    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
    const throughputMetrics = recentMetrics.filter(m => m.name === 'api_requests');
    const errorMetrics = recentMetrics.filter(m => m.name === 'api_errors');
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_heapUsed');

    const currentResponseTime = responseTimeMetrics.length > 0 ?
      responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length : 0;
    
    const currentThroughput = throughputMetrics.length > 0 ?
      throughputMetrics.reduce((sum, m) => sum + m.value, 0) / 5 : 0; // per minute average
    
    const totalRequests = throughputMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const currentErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    const currentMemoryUsage = memoryMetrics.length > 0 ?
      memoryMetrics[memoryMetrics.length - 1].value : 0;

    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= fiveMinutesAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const systemHealth = this.determineSystemHealth(recentAlerts, {
      responseTime: currentResponseTime,
      errorRate: currentErrorRate,
      memoryUsage: currentMemoryUsage
    });

    return {
      currentMetrics: {
        responseTime: currentResponseTime,
        throughput: currentThroughput,
        errorRate: currentErrorRate,
        memoryUsage: currentMemoryUsage
      },
      recentAlerts,
      systemHealth
    };
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`, 'PERFORMANCE_MONITOR');
  }

  /**
   * Clear old metrics and alerts
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean up old metrics
    for (const [key, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
      if (recentMetrics.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, recentMetrics);
      }
    }

    // Clean up old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffTime) {
        this.alerts.delete(id);
      }
    }

    logger.debug('Performance monitoring cleanup completed');
  }

  // Private helper methods

  private generateMetricId(): string {
    return `METRIC_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getDefaultThreshold(category: MetricCategory): { warning: number; critical: number } | undefined {
    const thresholds = {
      [MetricCategory.RESPONSE_TIME]: { warning: 2000, critical: 10000 },
      [MetricCategory.ERROR_RATE]: { warning: 5, critical: 10 },
      [MetricCategory.RESOURCE_USAGE]: { warning: 80, critical: 95 },
      [MetricCategory.DATABASE]: { warning: 1000, critical: 5000 },
      [MetricCategory.EXTERNAL_SERVICE]: { warning: 5000, critical: 15000 }
    };

    return thresholds[category];
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    const alertId = `${metric.name}_${metric.context || 'global'}`;
    const existingAlert = this.alerts.get(alertId);

    if (metric.value >= metric.threshold.critical) {
      if (!existingAlert || existingAlert.severity !== 'critical') {
        const alert: PerformanceAlert = {
          id: alertId,
          metricId: metric.id,
          severity: 'critical',
          message: `Critical threshold exceeded for ${metric.name}: ${metric.value}${metric.unit}`,
          value: metric.value,
          threshold: metric.threshold.critical,
          timestamp: new Date(),
          resolved: false
        };
        
        this.alerts.set(alertId, alert);
        this.emit('alert', alert);
        
        logger.error(alert.message, 'PERFORMANCE_MONITOR', {
          metricId: metric.id,
          value: metric.value,
          threshold: metric.threshold.critical
        });
      }
    } else if (metric.value >= metric.threshold.warning) {
      if (!existingAlert || existingAlert.severity !== 'warning') {
        const alert: PerformanceAlert = {
          id: alertId,
          metricId: metric.id,
          severity: 'warning',
          message: `Warning threshold exceeded for ${metric.name}: ${metric.value}${metric.unit}`,
          value: metric.value,
          threshold: metric.threshold.warning,
          timestamp: new Date(),
          resolved: false
        };
        
        this.alerts.set(alertId, alert);
        this.emit('alert', alert);
        
        logger.warn(alert.message, 'PERFORMANCE_MONITOR', {
          metricId: metric.id,
          value: metric.value,
          threshold: metric.threshold.warning
        });
      }
    } else if (existingAlert && !existingAlert.resolved) {
      // Resolve existing alert if metric is back to normal
      existingAlert.resolved = true;
      existingAlert.resolvedAt = new Date();
      this.emit('alertResolved', existingAlert);
      
      logger.info(`Alert resolved for ${metric.name}`, 'PERFORMANCE_MONITOR', {
        alertId: existingAlert.id,
        value: metric.value
      });
    }
  }

  private calculateUptime(timeRange: { start: Date; end: Date }): number {
    // Simplified uptime calculation - in production would track actual downtime
    const totalTime = timeRange.end.getTime() - timeRange.start.getTime();
    const downtime = 0; // Would calculate from error metrics
    return ((totalTime - downtime) / totalTime) * 100;
  }

  private generateRecommendations(metrics: PerformanceMetric[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze response time trends
    const responseTimeMetrics = metrics.filter(m => m.category === MetricCategory.RESPONSE_TIME);
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
      if (avgResponseTime > 2000) {
        recommendations.push('Consider implementing caching to improve response times');
        recommendations.push('Review database query performance and add indexes where needed');
      }
    }

    // Analyze error rates
    const errorAlerts = alerts.filter(a => a.metricId.includes('error'));
    if (errorAlerts.length > 0) {
      recommendations.push('Investigate and fix sources of errors to improve reliability');
    }

    // Analyze memory usage
    const memoryMetrics = metrics.filter(m => m.name.includes('memory'));
    const highMemoryMetrics = memoryMetrics.filter(m => m.value > 500);
    if (highMemoryMetrics.length > 0) {
      recommendations.push('Monitor memory usage and consider implementing memory optimization strategies');
    }

    return recommendations;
  }

  private calculateTrends(metrics: PerformanceMetric[]): PerformanceReport['trends'] {
    // Simplified trend calculation - would use more sophisticated analysis in production
    return {
      responseTime: 'stable',
      errorRate: 'stable',
      throughput: 'stable'
    };
  }

  private determineSystemHealth(
    alerts: PerformanceAlert[],
    currentMetrics: { responseTime: number; errorRate: number; memoryUsage: number }
  ): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) return 'critical';
    
    const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.resolved);
    if (warningAlerts.length > 0) return 'warning';
    
    if (currentMetrics.responseTime > 5000 || currentMetrics.errorRate > 5 || currentMetrics.memoryUsage > 800) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private startCleanupTask(): void {
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Shutdown the performance monitor
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.metrics.clear();
    this.alerts.clear();
    this.timers.clear();
    this.counters.clear();
    logger.info('Performance monitor shutdown completed');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const startTimer = (operationId: string, context?: string) => 
  performanceMonitor.startTimer(operationId, context);

export const endTimer = (operationId: string, metricName: string, category?: MetricCategory, tags?: Record<string, string>) =>
  performanceMonitor.endTimer(operationId, metricName, category, tags);

export const recordMetric = (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) =>
  performanceMonitor.recordMetric(metric);

export const recordDatabaseOperation = (operation: string, table: string, duration: number, recordCount?: number, success?: boolean) =>
  performanceMonitor.recordDatabaseOperation(operation, table, duration, recordCount, success);

export const recordApiEndpoint = (method: string, path: string, statusCode: number, duration: number, userId?: number) =>
  performanceMonitor.recordApiEndpoint(method, path, statusCode, duration, userId);

export const recordExternalService = (service: string, operation: string, duration: number, success: boolean, statusCode?: number) =>
  performanceMonitor.recordExternalService(service, operation, duration, success, statusCode);