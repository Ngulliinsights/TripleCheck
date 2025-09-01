/**
 * AI Performance Monitoring Service
 * 
 * Comprehensive monitoring system for AI services including performance metrics,
 * usage analytics, cost tracking, and real-time health monitoring.
 */

import { EventEmitter } from 'events';
import { logger as loggingService } from '../../../../core/src/logging';
import { BaseError, ErrorDomain, ErrorSeverity } from '../../../../core/src/error-handling';

// Performance monitoring interfaces
export interface AIPerformanceMetrics {
  service: string;
  operation: string;
  timestamp: Date;
  responseTime: number;
  success: boolean;
  errorType?: string;
  inputSize?: number;
  outputSize?: number;
  cost?: number;
  modelUsed?: string;
  confidence?: number;
}

export interface AIUsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  totalCost: number;
  costPerRequest: number;
  requestsPerHour: number;
  requestsPerDay: number;
  topErrors: Array<{ error: string; count: number; percentage: number }>;
  serviceBreakdown: Record<string, {
    requests: number;
    averageResponseTime: number;
    errorRate: number;
    cost: number;
  }>;
  operationBreakdown: Record<string, {
    requests: number;
    averageResponseTime: number;
    errorRate: number;
    cost: number;
  }>;
}

export interface AIHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    errorRate: number;
    availability: number;
    issues: string[];
  }>;
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    service?: string;
    operation?: string;
  }>;
}

export interface AICostTracking {
  totalCost: number;
  costByService: Record<string, number>;
  costByOperation: Record<string, number>;
  costByTimeframe: Record<string, number>; // hourly, daily, monthly
  estimatedMonthlyCost: number;
  costPerRequest: number;
  budgetAlerts: Array<{
    threshold: number;
    currentSpend: number;
    percentage: number;
    triggered: boolean;
  }>;
}

// Configuration interfaces
export interface AIMonitoringConfig {
  enableMetricsCollection: boolean;
  enableUsageAnalytics: boolean;
  enableCostTracking: boolean;
  enableHealthMonitoring: boolean;
  metricsRetentionDays: number;
  healthCheckInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    availability: number;
    costPerHour: number;
  };
  costTracking: {
    enableBudgetAlerts: boolean;
    monthlyBudget?: number;
    alertThresholds: number[]; // percentage thresholds
  };
}

class AIPerformanceMonitorError extends BaseError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, {
      code: 'AI_PERFORMANCE_MONITOR_ERROR',
      domain: ErrorDomain.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      cause,
      details: { operation }
    });
  }
}

export class AIPerformanceMonitor extends EventEmitter {
  private static instance: AIPerformanceMonitor;
  private config: AIMonitoringConfig;
  private metrics: AIPerformanceMetrics[] = [];
  private healthStatus: AIHealthStatus;
  private costTracking: AICostTracking;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCleanupInterval?: NodeJS.Timeout;

  private constructor(config?: Partial<AIMonitoringConfig>) {
    super();
    
    this.config = {
      enableMetricsCollection: true,
      enableUsageAnalytics: true,
      enableCostTracking: true,
      enableHealthMonitoring: true,
      metricsRetentionDays: 30,
      healthCheckInterval: 60000, // 1 minute
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        availability: 0.95, // 95%
        costPerHour: 10 // $10 per hour
      },
      costTracking: {
        enableBudgetAlerts: true,
        monthlyBudget: 1000, // $1000 per month
        alertThresholds: [50, 75, 90, 95] // percentage thresholds
      },
      ...config
    };

    this.healthStatus = this.initializeHealthStatus();
    this.costTracking = this.initializeCostTracking();

    this.startHealthMonitoring();
    this.startMetricsCleanup();

    loggingService.info('AI Performance Monitor initialized', {
      module: 'AIPerformanceMonitor',
      config: this.config
    });
  }

  public static getInstance(config?: Partial<AIMonitoringConfig>): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor(config);
    }
    return AIPerformanceMonitor.instance;
  }

  /**
   * Record AI operation metrics
   */
  recordMetrics(metrics: Omit<AIPerformanceMetrics, 'timestamp'>): void {
    if (!this.config.enableMetricsCollection) return;

    const fullMetrics: AIPerformanceMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);

    // Update cost tracking
    if (this.config.enableCostTracking && metrics.cost) {
      this.updateCostTracking(fullMetrics);
    }

    // Check for alerts
    this.checkAlerts(fullMetrics);

    // Emit metrics event
    this.emit('metrics', fullMetrics);

    loggingService.debug('AI metrics recorded', {
      module: 'AIPerformanceMonitor',
      service: metrics.service,
      operation: metrics.operation,
      responseTime: metrics.responseTime,
      success: metrics.success,
      cost: metrics.cost
    });
  }

  /**
   * Get usage analytics for specified time range
   */
  getUsageAnalytics(
    startDate?: Date,
    endDate?: Date,
    service?: string
  ): AIUsageAnalytics {
    if (!this.config.enableUsageAnalytics) {
      throw new AIPerformanceMonitorError(
        'Usage analytics is disabled',
        'getUsageAnalytics'
      );
    }

    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || now;

    let filteredMetrics = this.metrics.filter(
      m => m.timestamp >= start && m.timestamp <= end
    );

    if (service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === service);
    }

    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = filteredMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length || 0;
    const medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)] || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const totalCost = filteredMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const costPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    const timeRangeHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const requestsPerHour = timeRangeHours > 0 ? totalRequests / timeRangeHours : 0;
    const requestsPerDay = requestsPerHour * 24;

    // Calculate top errors
    const errorCounts = filteredMetrics
      .filter(m => !m.success && m.errorType)
      .reduce((counts, m) => {
        counts[m.errorType!] = (counts[m.errorType!] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / failedRequests) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate service breakdown
    const serviceBreakdown = this.calculateServiceBreakdown(filteredMetrics);
    const operationBreakdown = this.calculateOperationBreakdown(filteredMetrics);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      medianResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      totalCost,
      costPerRequest,
      requestsPerHour,
      requestsPerDay,
      topErrors,
      serviceBreakdown,
      operationBreakdown
    };
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<AIHealthStatus> {
    if (!this.config.enableHealthMonitoring) {
      throw new AIPerformanceMonitorError(
        'Health monitoring is disabled',
        'getHealthStatus'
      );
    }

    // Update health status with latest metrics
    await this.updateHealthStatus();
    return { ...this.healthStatus };
  }

  /**
   * Get cost tracking information
   */
  getCostTracking(): AICostTracking {
    if (!this.config.enableCostTracking) {
      throw new AIPerformanceMonitorError(
        'Cost tracking is disabled',
        'getCostTracking'
      );
    }

    return { ...this.costTracking };
  }

  /**
   * Get performance metrics for specific service/operation
   */
  getPerformanceMetrics(
    service?: string,
    operation?: string,
    timeRange?: { start: Date; end: Date }
  ): AIPerformanceMetrics[] {
    let filteredMetrics = [...this.metrics];

    if (service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === service);
    }

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filteredMetrics;
  }

  /**
   * Set budget alert thresholds
   */
  setBudgetAlerts(monthlyBudget: number, thresholds: number[]): void {
    this.config.costTracking.monthlyBudget = monthlyBudget;
    this.config.costTracking.alertThresholds = thresholds;

    // Update budget alerts
    this.updateBudgetAlerts();

    loggingService.info('Budget alerts updated', {
      module: 'AIPerformanceMonitor',
      monthlyBudget,
      thresholds
    });
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        metrics: this.metrics,
        usageAnalytics: this.getUsageAnalytics(),
        healthStatus: this.healthStatus,
        costTracking: this.costTracking,
        exportedAt: new Date()
      }, null, 2);
    }

    // CSV format
    const headers = [
      'timestamp', 'service', 'operation', 'responseTime', 'success',
      'errorType', 'inputSize', 'outputSize', 'cost', 'modelUsed', 'confidence'
    ];

    const csvRows = [
      headers.join(','),
      ...this.metrics.map(m => [
        m.timestamp.toISOString(),
        m.service,
        m.operation,
        m.responseTime,
        m.success,
        m.errorType || '',
        m.inputSize || '',
        m.outputSize || '',
        m.cost || '',
        m.modelUsed || '',
        m.confidence || ''
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Clear old metrics based on retention policy
   */
  clearOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.metricsRetentionDays);

    const originalCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    const removedCount = originalCount - this.metrics.length;

    if (removedCount > 0) {
      loggingService.info('Cleared old metrics', {
        module: 'AIPerformanceMonitor',
        removedCount,
        retentionDays: this.config.metricsRetentionDays
      });
    }
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }

    this.removeAllListeners();

    loggingService.info('AI Performance Monitor shutdown', {
      module: 'AIPerformanceMonitor'
    });
  }

  // Private methods

  private initializeHealthStatus(): AIHealthStatus {
    return {
      overall: 'healthy',
      services: {},
      alerts: []
    };
  }

  private initializeCostTracking(): AICostTracking {
    return {
      totalCost: 0,
      costByService: {},
      costByOperation: {},
      costByTimeframe: {},
      estimatedMonthlyCost: 0,
      costPerRequest: 0,
      budgetAlerts: []
    };
  }

  private startHealthMonitoring(): void {
    if (!this.config.enableHealthMonitoring) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.updateHealthStatus();
      } catch (error) {
        loggingService.error('Health check failed', {
          module: 'AIPerformanceMonitor',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.healthCheckInterval);
  }

  private startMetricsCleanup(): void {
    // Clean up old metrics daily
    this.metricsCleanupInterval = setInterval(() => {
      this.clearOldMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  private async updateHealthStatus(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    const services = [...new Set(recentMetrics.map(m => m.service))];

    for (const service of services) {
      const serviceMetrics = recentMetrics.filter(m => m.service === service);
      const successfulRequests = serviceMetrics.filter(m => m.success).length;
      const totalRequests = serviceMetrics.length;
      
      const errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;
      const availability = totalRequests > 0 ? successfulRequests / totalRequests : 1;
      const averageResponseTime = serviceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests || 0;

      const issues: string[] = [];
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (errorRate > this.config.alertThresholds.errorRate) {
        issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
        status = 'unhealthy';
      }

      if (availability < this.config.alertThresholds.availability) {
        issues.push(`Low availability: ${(availability * 100).toFixed(1)}%`);
        status = 'unhealthy';
      }

      if (averageResponseTime > this.config.alertThresholds.responseTime) {
        issues.push(`High response time: ${averageResponseTime.toFixed(0)}ms`);
        if (status === 'healthy') status = 'degraded';
      }

      this.healthStatus.services[service] = {
        status,
        lastCheck: now,
        responseTime: averageResponseTime,
        errorRate,
        availability,
        issues
      };
    }

    // Determine overall status
    const serviceStatuses = Object.values(this.healthStatus.services).map(s => s.status);
    if (serviceStatuses.some(s => s === 'unhealthy')) {
      this.healthStatus.overall = 'unhealthy';
    } else if (serviceStatuses.some(s => s === 'degraded')) {
      this.healthStatus.overall = 'degraded';
    } else {
      this.healthStatus.overall = 'healthy';
    }
  }

  private updateCostTracking(metrics: AIPerformanceMetrics): void {
    if (!metrics.cost) return;

    this.costTracking.totalCost += metrics.cost;

    // Update cost by service
    this.costTracking.costByService[metrics.service] = 
      (this.costTracking.costByService[metrics.service] || 0) + metrics.cost;

    // Update cost by operation
    this.costTracking.costByOperation[metrics.operation] = 
      (this.costTracking.costByOperation[metrics.operation] || 0) + metrics.cost;

    // Update cost by timeframe
    const hour = metrics.timestamp.toISOString().slice(0, 13);
    const day = metrics.timestamp.toISOString().slice(0, 10);
    
    this.costTracking.costByTimeframe[hour] = 
      (this.costTracking.costByTimeframe[hour] || 0) + metrics.cost;

    // Calculate estimated monthly cost
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000) && m.cost
    );
    const dailyCost = recentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    this.costTracking.estimatedMonthlyCost = dailyCost * 30;

    // Update cost per request
    const totalRequests = this.metrics.length;
    this.costTracking.costPerRequest = totalRequests > 0 ? this.costTracking.totalCost / totalRequests : 0;

    // Update budget alerts
    this.updateBudgetAlerts();
  }

  private updateBudgetAlerts(): void {
    if (!this.config.costTracking.enableBudgetAlerts || !this.config.costTracking.monthlyBudget) {
      return;
    }

    const monthlyBudget = this.config.costTracking.monthlyBudget;
    const currentSpend = this.costTracking.estimatedMonthlyCost;

    this.costTracking.budgetAlerts = this.config.costTracking.alertThresholds.map(threshold => {
      const thresholdAmount = (threshold / 100) * monthlyBudget;
      const percentage = (currentSpend / monthlyBudget) * 100;
      const triggered = currentSpend >= thresholdAmount;

      return {
        threshold,
        currentSpend,
        percentage,
        triggered
      };
    });
  }

  private checkAlerts(metrics: AIPerformanceMetrics): void {
    const alerts: AIHealthStatus['alerts'] = [];

    // Response time alert
    if (metrics.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        level: 'warning',
        message: `High response time: ${metrics.responseTime}ms for ${metrics.service}.${metrics.operation}`,
        timestamp: new Date(),
        service: metrics.service,
        operation: metrics.operation
      });
    }

    // Error alert
    if (!metrics.success) {
      alerts.push({
        level: 'error',
        message: `Operation failed: ${metrics.service}.${metrics.operation} - ${metrics.errorType || 'Unknown error'}`,
        timestamp: new Date(),
        service: metrics.service,
        operation: metrics.operation
      });
    }

    // Cost alert
    if (metrics.cost && metrics.cost > this.config.alertThresholds.costPerHour / 3600) {
      alerts.push({
        level: 'warning',
        message: `High cost operation: $${metrics.cost.toFixed(4)} for ${metrics.service}.${metrics.operation}`,
        timestamp: new Date(),
        service: metrics.service,
        operation: metrics.operation
      });
    }

    // Add alerts to health status
    this.healthStatus.alerts.push(...alerts);

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.healthStatus.alerts = this.healthStatus.alerts.filter(
      alert => alert.timestamp >= oneDayAgo
    );

    // Emit alert events
    alerts.forEach(alert => {
      this.emit('alert', alert);
    });
  }

  private calculateServiceBreakdown(metrics: AIPerformanceMetrics[]): Record<string, any> {
    const services = [...new Set(metrics.map(m => m.service))];
    
    return services.reduce((breakdown, service) => {
      const serviceMetrics = metrics.filter(m => m.service === service);
      const successfulRequests = serviceMetrics.filter(m => m.success).length;
      
      breakdown[service] = {
        requests: serviceMetrics.length,
        averageResponseTime: serviceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / serviceMetrics.length || 0,
        errorRate: serviceMetrics.length > 0 ? (serviceMetrics.length - successfulRequests) / serviceMetrics.length : 0,
        cost: serviceMetrics.reduce((sum, m) => sum + (m.cost || 0), 0)
      };
      
      return breakdown;
    }, {} as Record<string, any>);
  }

  private calculateOperationBreakdown(metrics: AIPerformanceMetrics[]): Record<string, any> {
    const operations = [...new Set(metrics.map(m => m.operation))];
    
    return operations.reduce((breakdown, operation) => {
      const operationMetrics = metrics.filter(m => m.operation === operation);
      const successfulRequests = operationMetrics.filter(m => m.success).length;
      
      breakdown[operation] = {
        requests: operationMetrics.length,
        averageResponseTime: operationMetrics.reduce((sum, m) => sum + m.responseTime, 0) / operationMetrics.length || 0,
        errorRate: operationMetrics.length > 0 ? (operationMetrics.length - successfulRequests) / operationMetrics.length : 0,
        cost: operationMetrics.reduce((sum, m) => sum + (m.cost || 0), 0)
      };
      
      return breakdown;
    }, {} as Record<string, any>);
  }
}

// Export singleton instance
export const aiPerformanceMonitor = AIPerformanceMonitor.getInstance();

// Export utility functions
export const aiMonitoringUtils = {
  /**
   * Create performance monitor with custom config
   */
  createMonitor(config?: Partial<AIMonitoringConfig>): AIPerformanceMonitor {
    return AIPerformanceMonitor.getInstance(config);
  },

  /**
   * Record AI operation with automatic metrics collection
   */
  async monitorAIOperation<T>(
    service: string,
    operation: string,
    aiOperation: () => Promise<T>,
    options: {
      inputSize?: number;
      modelUsed?: string;
      costEstimate?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let errorType: string | undefined;
    let result: T;
    let confidence: number | undefined;

    try {
      result = await aiOperation();
      success = true;

      // Extract confidence if available
      if (typeof result === 'object' && result !== null && 'confidence' in result) {
        confidence = (result as any).confidence;
      }

      return result;
    } catch (error) {
      errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      
      // Calculate output size if result is available
      let outputSize: number | undefined;
      if (success && result) {
        try {
          outputSize = JSON.stringify(result).length;
        } catch {
          // Ignore serialization errors
        }
      }

      aiPerformanceMonitor.recordMetrics({
        service,
        operation,
        responseTime,
        success,
        errorType,
        inputSize: options.inputSize,
        outputSize,
        cost: options.costEstimate,
        modelUsed: options.modelUsed,
        confidence
      });
    }
  },

  /**
   * Get performance summary for dashboard
   */
  async getPerformanceSummary(): Promise<{
    overview: AIUsageAnalytics;
    health: AIHealthStatus;
    costs: AICostTracking;
    recentAlerts: AIHealthStatus['alerts'];
  }> {
    const [overview, health, costs] = await Promise.all([
      aiPerformanceMonitor.getUsageAnalytics(),
      aiPerformanceMonitor.getHealthStatus(),
      Promise.resolve(aiPerformanceMonitor.getCostTracking())
    ]);

    const recentAlerts = health.alerts
      .filter(alert => alert.timestamp >= new Date(Date.now() - 60 * 60 * 1000))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      overview,
      health,
      costs,
      recentAlerts
    };
  }
};