/**
 * AI Metrics Collector
 * 
 * Comprehensive metrics collection system for AI services including
 * performance monitoring, usage analytics, and cost tracking.
 */

import { logger as loggingService } from '../../../../../server/infrastructure/monitoring/logger'
import { BaseError, ErrorDomain, ErrorSeverity } from '../../../error-handling/errors/base-error'

export interface AIOperationMetrics {
  operationId: string;
  service: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
  tokensUsed?: number;
  cost?: number;
  cacheHit?: boolean;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface AIServiceMetrics {
  service: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  successRate: number;
  totalTokensUsed: number;
  totalCost: number;
  cacheHitRate: number;
  averageRetryCount: number;
  lastUpdated: Date;
  operationBreakdown: Record<string, {
    count: number;
    averageTime: number;
    errorRate: number;
    totalCost: number;
  }>;
}

export interface AISystemMetrics {
  totalOperations: number;
  totalSuccessfulOperations: number;
  totalFailedOperations: number;
  overallErrorRate: number;
  overallSuccessRate: number;
  totalTokensUsed: number;
  totalCost: number;
  averageResponseTime: number;
  systemUptime: number;
  servicesStatus: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  lastMetricsUpdate: Date;
  services: Record<string, AIServiceMetrics>;
}

export interface CostBreakdown {
  service: string;
  operation: string;
  totalCost: number;
  operationCount: number;
  averageCostPerOperation: number;
  tokensUsed: number;
  costPerToken: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface UsageAnalytics {
  dailyUsage: Array<{
    date: string;
    operations: number;
    cost: number;
    tokensUsed: number;
    errorRate: number;
  }>;
  hourlyUsage: Array<{
    hour: number;
    operations: number;
    averageResponseTime: number;
  }>;
  serviceUsage: Array<{
    service: string;
    percentage: number;
    operations: number;
    cost: number;
  }>;
  topOperations: Array<{
    operation: string;
    service: string;
    count: number;
    totalTime: number;
    averageTime: number;
  }>;
  errorAnalysis: Array<{
    error: string;
    count: number;
    services: string[];
    lastOccurrence: Date;
  }>;
}

class AIMetricsCollectorError extends BaseError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, {
      code: 'AI_METRICS_COLLECTOR_ERROR',
      domain: ErrorDomain.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      cause,
      details: { operation }
    });
  }
}

export class AIMetricsCollector {
  private static instance: AIMetricsCollector;
  private operations: Map<string, AIOperationMetrics> = new Map();
  private serviceMetrics: Map<string, AIServiceMetrics> = new Map();
  private systemStartTime: number = Date.now();
  private metricsHistory: AIOperationMetrics[] = [];
  private maxHistorySize: number = 10000;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMetricsCollection();
    
    loggingService.info('AI Metrics Collector initialized', {
      module: 'AIMetricsCollector',
      maxHistorySize: this.maxHistorySize
    });
  }

  public static getInstance(): AIMetricsCollector {
    if (!AIMetricsCollector.instance) {
      AIMetricsCollector.instance = new AIMetricsCollector();
    }
    return AIMetricsCollector.instance;
  }

  /**
   * Start tracking an AI operation
   */
  startOperation(
    service: string,
    operation: string,
    metadata?: Record<string, any>
  ): string {
    const operationId = `${service}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operationMetrics: AIOperationMetrics = {
      operationId,
      service,
      operation,
      startTime: Date.now(),
      success: false,
      metadata
    };

    this.operations.set(operationId, operationMetrics);

    loggingService.debug('AI operation started', {
      module: 'AIMetricsCollector',
      operationId,
      service,
      operation
    });

    return operationId;
  }

  /**
   * Complete an AI operation with success
   */
  completeOperation(
    operationId: string,
    result: {
      inputSize?: number;
      outputSize?: number;
      tokensUsed?: number;
      cost?: number;
      cacheHit?: boolean;
      retryCount?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      loggingService.warn('Attempted to complete unknown operation', {
        module: 'AIMetricsCollector',
        operationId
      });
      return;
    }

    const endTime = Date.now();
    const updatedOperation: AIOperationMetrics = {
      ...operation,
      endTime,
      duration: endTime - operation.startTime,
      success: true,
      ...result,
      metadata: { ...operation.metadata, ...result.metadata }
    };

    this.operations.set(operationId, updatedOperation);
    this.addToHistory(updatedOperation);
    this.updateServiceMetrics(updatedOperation);

    loggingService.debug('AI operation completed successfully', {
      module: 'AIMetricsCollector',
      operationId,
      service: operation.service,
      operation: operation.operation,
      duration: updatedOperation.duration,
      tokensUsed: result.tokensUsed,
      cost: result.cost
    });
  }

  /**
   * Fail an AI operation with error
   */
  failOperation(
    operationId: string,
    error: string,
    details: {
      retryCount?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      loggingService.warn('Attempted to fail unknown operation', {
        module: 'AIMetricsCollector',
        operationId
      });
      return;
    }

    const endTime = Date.now();
    const updatedOperation: AIOperationMetrics = {
      ...operation,
      endTime,
      duration: endTime - operation.startTime,
      success: false,
      error,
      ...details,
      metadata: { ...operation.metadata, ...details.metadata }
    };

    this.operations.set(operationId, updatedOperation);
    this.addToHistory(updatedOperation);
    this.updateServiceMetrics(updatedOperation);

    loggingService.error('AI operation failed', {
      module: 'AIMetricsCollector',
      operationId,
      service: operation.service,
      operation: operation.operation,
      duration: updatedOperation.duration,
      error,
      retryCount: details.retryCount
    });
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(service: string): AIServiceMetrics | null {
    return this.serviceMetrics.get(service) || null;
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): AISystemMetrics {
    const services = Object.fromEntries(this.serviceMetrics.entries());
    const allOperations = Array.from(this.operations.values()).concat(this.metricsHistory);
    
    const totalOperations = allOperations.length;
    const successfulOperations = allOperations.filter(op => op.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const responseTimes = allOperations
      .filter(op => op.duration !== undefined)
      .map(op => op.duration!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const totalTokensUsed = allOperations
      .filter(op => op.tokensUsed !== undefined)
      .reduce((sum, op) => sum + (op.tokensUsed || 0), 0);

    const totalCost = allOperations
      .filter(op => op.cost !== undefined)
      .reduce((sum, op) => sum + (op.cost || 0), 0);

    const servicesStatus: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    for (const [serviceName, metrics] of this.serviceMetrics.entries()) {
      if (metrics.errorRate > 0.2) {
        servicesStatus[serviceName] = 'unhealthy';
      } else if (metrics.errorRate > 0.1) {
        servicesStatus[serviceName] = 'degraded';
      } else {
        servicesStatus[serviceName] = 'healthy';
      }
    }

    return {
      totalOperations,
      totalSuccessfulOperations: successfulOperations,
      totalFailedOperations: failedOperations,
      overallErrorRate: totalOperations > 0 ? failedOperations / totalOperations : 0,
      overallSuccessRate: totalOperations > 0 ? successfulOperations / totalOperations : 0,
      totalTokensUsed,
      totalCost,
      averageResponseTime,
      systemUptime: Date.now() - this.systemStartTime,
      servicesStatus,
      lastMetricsUpdate: new Date(),
      services
    };
  }

  /**
   * Get cost breakdown by service and operation
   */
  getCostBreakdown(timeRange?: { start: Date; end: Date }): CostBreakdown[] {
    const operations = timeRange 
      ? this.getOperationsInTimeRange(timeRange.start, timeRange.end)
      : Array.from(this.operations.values()).concat(this.metricsHistory);

    const breakdown = new Map<string, {
      service: string;
      operation: string;
      operations: AIOperationMetrics[];
    }>();

    for (const op of operations) {
      if (op.cost === undefined) continue;
      
      const key = `${op.service}:${op.operation}`;
      if (!breakdown.has(key)) {
        breakdown.set(key, {
          service: op.service,
          operation: op.operation,
          operations: []
        });
      }
      breakdown.get(key)!.operations.push(op);
    }

    return Array.from(breakdown.values()).map(({ service, operation, operations }) => {
      const totalCost = operations.reduce((sum, op) => sum + (op.cost || 0), 0);
      const tokensUsed = operations.reduce((sum, op) => sum + (op.tokensUsed || 0), 0);
      
      return {
        service,
        operation,
        totalCost,
        operationCount: operations.length,
        averageCostPerOperation: operations.length > 0 ? totalCost / operations.length : 0,
        tokensUsed,
        costPerToken: tokensUsed > 0 ? totalCost / tokensUsed : 0,
        timeRange: timeRange || {
          start: new Date(Math.min(...operations.map(op => op.startTime))),
          end: new Date(Math.max(...operations.map(op => op.endTime || op.startTime)))
        }
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(days: number = 7): UsageAnalytics {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const operations = this.getOperationsInTimeRange(startDate, endDate);

    // Daily usage
    const dailyUsage = this.calculateDailyUsage(operations, days);
    
    // Hourly usage (last 24 hours)
    const hourlyUsage = this.calculateHourlyUsage(operations);
    
    // Service usage
    const serviceUsage = this.calculateServiceUsage(operations);
    
    // Top operations
    const topOperations = this.calculateTopOperations(operations);
    
    // Error analysis
    const errorAnalysis = this.calculateErrorAnalysis(operations);

    return {
      dailyUsage,
      hourlyUsage,
      serviceUsage,
      topOperations,
      errorAnalysis
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    // Clear old operations
    for (const [operationId, operation] of this.operations.entries()) {
      if (operation.startTime < cutoffTime) {
        this.operations.delete(operationId);
      }
    }

    // Clear old history
    this.metricsHistory = this.metricsHistory.filter(
      op => op.startTime >= cutoffTime
    );

    loggingService.info('Cleared old AI metrics', {
      module: 'AIMetricsCollector',
      cutoffTime: new Date(cutoffTime),
      remainingOperations: this.operations.size,
      remainingHistory: this.metricsHistory.length
    });
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const systemMetrics = this.getSystemMetrics();
    const usageAnalytics = this.getUsageAnalytics();
    const costBreakdown = this.getCostBreakdown();

    const exportData = {
      timestamp: new Date().toISOString(),
      systemMetrics,
      usageAnalytics,
      costBreakdown,
      rawOperations: this.metricsHistory.slice(-1000) // Last 1000 operations
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(exportData);
    }
  }

  // Private helper methods

  private startMetricsCollection(): void {
    // Update service metrics every 30 seconds
    this.metricsUpdateInterval = setInterval(() => {
      this.updateAllServiceMetrics();
      this.clearOldMetrics();
    }, 30000);
  }

  private addToHistory(operation: AIOperationMetrics): void {
    this.metricsHistory.push(operation);
    
    // Keep history size manageable
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  private updateServiceMetrics(operation: AIOperationMetrics): void {
    const service = operation.service;
    let metrics = this.serviceMetrics.get(service);

    if (!metrics) {
      metrics = {
        service,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        successRate: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        cacheHitRate: 0,
        averageRetryCount: 0,
        lastUpdated: new Date(),
        operationBreakdown: {}
      };
    }

    // Update basic counters
    metrics.totalOperations++;
    if (operation.success) {
      metrics.successfulOperations++;
    } else {
      metrics.failedOperations++;
    }

    // Update rates
    metrics.errorRate = metrics.failedOperations / metrics.totalOperations;
    metrics.successRate = metrics.successfulOperations / metrics.totalOperations;

    // Update operation breakdown
    const opKey = operation.operation;
    if (!metrics.operationBreakdown[opKey]) {
      metrics.operationBreakdown[opKey] = {
        count: 0,
        averageTime: 0,
        errorRate: 0,
        totalCost: 0
      };
    }

    const opBreakdown = metrics.operationBreakdown[opKey];
    opBreakdown.count++;
    if (operation.duration) {
      opBreakdown.averageTime = (opBreakdown.averageTime + operation.duration) / 2;
    }
    if (operation.cost) {
      opBreakdown.totalCost += operation.cost;
    }
    opBreakdown.errorRate = operation.success ? opBreakdown.errorRate : 
      (opBreakdown.errorRate + 1) / opBreakdown.count;

    // Update aggregated metrics
    if (operation.duration) {
      metrics.averageResponseTime = (metrics.averageResponseTime + operation.duration) / 2;
    }
    if (operation.tokensUsed) {
      metrics.totalTokensUsed += operation.tokensUsed;
    }
    if (operation.cost) {
      metrics.totalCost += operation.cost;
    }

    metrics.lastUpdated = new Date();
    this.serviceMetrics.set(service, metrics);
  }

  private updateAllServiceMetrics(): void {
    // Recalculate percentiles and other complex metrics
    for (const [serviceName, metrics] of this.serviceMetrics.entries()) {
      const serviceOperations = this.metricsHistory
        .filter(op => op.service === serviceName && op.duration !== undefined)
        .map(op => op.duration!)
        .sort((a, b) => a - b);

      if (serviceOperations.length > 0) {
        metrics.medianResponseTime = this.calculatePercentile(serviceOperations, 50);
        metrics.p95ResponseTime = this.calculatePercentile(serviceOperations, 95);
        metrics.p99ResponseTime = this.calculatePercentile(serviceOperations, 99);
      }

      // Calculate cache hit rate
      const serviceOps = this.metricsHistory.filter(op => op.service === serviceName);
      const cacheHits = serviceOps.filter(op => op.cacheHit).length;
      metrics.cacheHitRate = serviceOps.length > 0 ? cacheHits / serviceOps.length : 0;

      // Calculate average retry count
      const retriedOps = serviceOps.filter(op => op.retryCount !== undefined);
      metrics.averageRetryCount = retriedOps.length > 0 
        ? retriedOps.reduce((sum, op) => sum + (op.retryCount || 0), 0) / retriedOps.length 
        : 0;
    }
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
  }

  private getOperationsInTimeRange(start: Date, end: Date): AIOperationMetrics[] {
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    return Array.from(this.operations.values())
      .concat(this.metricsHistory)
      .filter(op => op.startTime >= startTime && op.startTime <= endTime);
  }

  private calculateDailyUsage(operations: AIOperationMetrics[], days: number): any[] {
    const dailyData = new Map<string, {
      operations: number;
      cost: number;
      tokensUsed: number;
      errors: number;
    }>();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { operations: 0, cost: 0, tokensUsed: 0, errors: 0 });
    }

    // Aggregate operations by day
    for (const op of operations) {
      const date = new Date(op.startTime).toISOString().split('T')[0];
      const dayData = dailyData.get(date);
      if (dayData) {
        dayData.operations++;
        dayData.cost += op.cost || 0;
        dayData.tokensUsed += op.tokensUsed || 0;
        if (!op.success) dayData.errors++;
      }
    }

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      operations: data.operations,
      cost: data.cost,
      tokensUsed: data.tokensUsed,
      errorRate: data.operations > 0 ? data.errors / data.operations : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateHourlyUsage(operations: AIOperationMetrics[]): any[] {
    const hourlyData = new Map<number, { operations: number; totalTime: number }>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { operations: 0, totalTime: 0 });
    }

    // Aggregate operations by hour
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    for (const op of operations) {
      if (op.startTime >= last24Hours) {
        const hour = new Date(op.startTime).getHours();
        const hourData = hourlyData.get(hour)!;
        hourData.operations++;
        hourData.totalTime += op.duration || 0;
      }
    }

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      operations: data.operations,
      averageResponseTime: data.operations > 0 ? data.totalTime / data.operations : 0
    }));
  }

  private calculateServiceUsage(operations: AIOperationMetrics[]): any[] {
    const serviceData = new Map<string, { operations: number; cost: number }>();

    for (const op of operations) {
      if (!serviceData.has(op.service)) {
        serviceData.set(op.service, { operations: 0, cost: 0 });
      }
      const data = serviceData.get(op.service)!;
      data.operations++;
      data.cost += op.cost || 0;
    }

    const totalOperations = operations.length;
    return Array.from(serviceData.entries()).map(([service, data]) => ({
      service,
      percentage: totalOperations > 0 ? (data.operations / totalOperations) * 100 : 0,
      operations: data.operations,
      cost: data.cost
    })).sort((a, b) => b.operations - a.operations);
  }

  private calculateTopOperations(operations: AIOperationMetrics[]): any[] {
    const operationData = new Map<string, {
      service: string;
      operation: string;
      count: number;
      totalTime: number;
    }>();

    for (const op of operations) {
      const key = `${op.service}:${op.operation}`;
      if (!operationData.has(key)) {
        operationData.set(key, {
          service: op.service,
          operation: op.operation,
          count: 0,
          totalTime: 0
        });
      }
      const data = operationData.get(key)!;
      data.count++;
      data.totalTime += op.duration || 0;
    }

    return Array.from(operationData.values())
      .map(data => ({
        operation: data.operation,
        service: data.service,
        count: data.count,
        totalTime: data.totalTime,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateErrorAnalysis(operations: AIOperationMetrics[]): any[] {
    const errorData = new Map<string, {
      error: string;
      count: number;
      services: Set<string>;
      lastOccurrence: Date;
    }>();

    for (const op of operations) {
      if (!op.success && op.error) {
        if (!errorData.has(op.error)) {
          errorData.set(op.error, {
            error: op.error,
            count: 0,
            services: new Set(),
            lastOccurrence: new Date(op.startTime)
          });
        }
        const data = errorData.get(op.error)!;
        data.count++;
        data.services.add(op.service);
        if (op.startTime > data.lastOccurrence.getTime()) {
          data.lastOccurrence = new Date(op.startTime);
        }
      }
    }

    return Array.from(errorData.values())
      .map(data => ({
        error: data.error,
        count: data.count,
        services: Array.from(data.services),
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count);
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for metrics export
    const lines = ['timestamp,service,operation,success,duration,cost,tokensUsed'];
    
    for (const op of data.rawOperations) {
      lines.push([
        new Date(op.startTime).toISOString(),
        op.service,
        op.operation,
        op.success,
        op.duration || '',
        op.cost || '',
        op.tokensUsed || ''
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
    
    this.operations.clear();
    this.serviceMetrics.clear();
    this.metricsHistory = [];
    
    loggingService.info('AI Metrics Collector destroyed', {
      module: 'AIMetricsCollector'
    });
  }
}

// Export singleton instance
export const aiMetricsCollector = AIMetricsCollector.getInstance();

export const aiMetricsCollector = AIMetricsCollector.getInstance();
