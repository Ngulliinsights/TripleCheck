/**
 * AI Performance Dashboard
 * 
 * Real-time dashboard for monitoring AI service performance, costs, and health status.
 * Provides comprehensive insights and alerting for AI operations.
 */

import { logger as loggingService } from '../../../../../server/infrastructure/monitoring/logger'
import { BaseError, ErrorDomain, ErrorSeverity } from '../../../error-handling/errors/base-error'
import { aiMetricsCollector, AISystemMetrics, UsageAnalytics, CostBreakdown } from './ai-metrics-collector'
import { aiHealthMonitor, SystemHealthStatus, HealthAlert } from './ai-health-monitor'

export interface DashboardMetrics {
  timestamp: Date;
  systemHealth: SystemHealthStatus;
  systemMetrics: AISystemMetrics;
  usageAnalytics: UsageAnalytics;
  costBreakdown: CostBreakdown[];
  performanceInsights: PerformanceInsights;
  alerts: HealthAlert[];
  recommendations: DashboardRecommendation[];
}

export interface PerformanceInsights {
  trends: {
    responseTimetrend: 'improving' | 'stable' | 'degrading';
    errorRateTrend: 'improving' | 'stable' | 'degrading';
    costTrend: 'decreasing' | 'stable' | 'increasing';
    usageTrend: 'decreasing' | 'stable' | 'increasing';
  };
  bottlenecks: Array<{
    service: string;
    operation: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  optimizations: Array<{
    type: 'performance' | 'cost' | 'reliability';
    description: string;
    estimatedImpact: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  anomalies: Array<{
    service: string;
    metric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    timestamp: Date;
  }>;
}

export interface DashboardRecommendation {
  id: string;
  type: 'performance' | 'cost' | 'reliability' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface DashboardConfig {
  refreshInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    costIncrease: number;
    usageSpike: number;
  };
  insights: {
    trendAnalysisPeriod: number;
    anomalyDetectionSensitivity: number;
    recommendationEngine: boolean;
  };
}

class AIPerformanceDashboardError extends BaseError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, {
      code: 'AI_PERFORMANCE_DASHBOARD_ERROR',
      domain: ErrorDomain.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      cause,
      details: { operation }
    });
  }
}

export class AIPerformanceDashboard {
  private static instance: AIPerformanceDashboard;
  private config: DashboardConfig;
  private metricsHistory: DashboardMetrics[] = [];
  private recommendations: Map<string, DashboardRecommendation> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      retentionPeriod: 24, // 24 hours
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        costIncrease: 0.5, // 50% increase
        usageSpike: 2.0 // 200% of normal
      },
      insights: {
        trendAnalysisPeriod: 3600000, // 1 hour
        anomalyDetectionSensitivity: 2.0, // 2 standard deviations
        recommendationEngine: true
      },
      ...config
    };

    this.startDashboardUpdates();

    loggingService.info('AI Performance Dashboard initialized', {
      module: 'AIPerformanceDashboard',
      config: this.config
    });
  }

  public static getInstance(config?: Partial<DashboardConfig>): AIPerformanceDashboard {
    if (!AIPerformanceDashboard.instance) {
      AIPerformanceDashboard.instance = new AIPerformanceDashboard(config);
    }
    return AIPerformanceDashboard.instance;
  }

  /**
   * Get current dashboard metrics
   */
  async getCurrentMetrics(): Promise<DashboardMetrics> {
    try {
      const [systemHealth, systemMetrics, usageAnalytics, costBreakdown] = await Promise.all([
        aiHealthMonitor.getSystemHealthStatus(),
        Promise.resolve(aiMetricsCollector.getSystemMetrics()),
        Promise.resolve(aiMetricsCollector.getUsageAnalytics(7)),
        Promise.resolve(aiMetricsCollector.getCostBreakdown())
      ]);

      const performanceInsights = this.generatePerformanceInsights(systemMetrics, usageAnalytics);
      const alerts = aiHealthMonitor.getActiveAlerts();
      const recommendations = this.generateRecommendations(systemMetrics, usageAnalytics, performanceInsights);

      const dashboardMetrics: DashboardMetrics = {
        timestamp: new Date(),
        systemHealth,
        systemMetrics,
        usageAnalytics,
        costBreakdown,
        performanceInsights,
        alerts,
        recommendations
      };

      // Store in history
      this.addToHistory(dashboardMetrics);

      return dashboardMetrics;
    } catch (error) {
      loggingService.error('Failed to get current dashboard metrics', {
        module: 'AIPerformanceDashboard',
        error: error instanceof Error ? error.message : String(error)
      });

      throw new AIPerformanceDashboardError(
        'Failed to get current dashboard metrics',
        'getCurrentMetrics',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get dashboard metrics history
   */
  getMetricsHistory(hours: number = 24): DashboardMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(
      metrics => metrics.timestamp.getTime() >= cutoffTime
    );
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(hours: number = 24): {
    responseTime: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
    cost: Array<{ timestamp: Date; value: number }>;
    usage: Array<{ timestamp: Date; value: number }>;
  } {
    const history = this.getMetricsHistory(hours);

    return {
      responseTime: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.averageResponseTime
      })),
      errorRate: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.overallErrorRate
      })),
      cost: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.totalCost
      })),
      usage: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.totalOperations
      }))
    };
  }

  /**
   * Get service-specific performance data
   */
  getServicePerformance(service: string): {
    currentMetrics: any;
    trends: any;
    recommendations: DashboardRecommendation[];
  } {
    const systemMetrics = aiMetricsCollector.getSystemMetrics();
    const serviceMetrics = systemMetrics.services[service];
    
    const serviceRecommendations = Array.from(this.recommendations.values())
      .filter(rec => rec.description.toLowerCase().includes(service.toLowerCase()));

    const history = this.getMetricsHistory(24);
    const serviceTrends = {
      responseTime: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.services[service]?.averageResponseTime || 0
      })),
      errorRate: history.map(h => ({
        timestamp: h.timestamp,
        value: h.systemMetrics.services[service]?.errorRate || 0
      }))
    };

    return {
      currentMetrics: serviceMetrics,
      trends: serviceTrends,
      recommendations: serviceRecommendations
    };
  }

  /**
   * Get cost analysis and projections
   */
  getCostAnalysis(): {
    currentCosts: CostBreakdown[];
    projections: Array<{
      period: string;
      projectedCost: number;
      confidence: number;
    }>;
    optimizations: Array<{
      description: string;
      potentialSavings: number;
      implementationEffort: string;
    }>;
  } {
    const costBreakdown = aiMetricsCollector.getCostBreakdown();
    const history = this.getMetricsHistory(168); // 7 days

    // Simple cost projection based on recent trends
    const recentCosts = history.slice(-24).map(h => h.systemMetrics.totalCost); // Last 24 hours
    const averageHourlyCost = recentCosts.length > 0 
      ? recentCosts.reduce((sum, cost) => sum + cost, 0) / recentCosts.length 
      : 0;

    const projections = [
      {
        period: 'Next 24 hours',
        projectedCost: averageHourlyCost * 24,
        confidence: 0.8
      },
      {
        period: 'Next 7 days',
        projectedCost: averageHourlyCost * 24 * 7,
        confidence: 0.6
      },
      {
        period: 'Next 30 days',
        projectedCost: averageHourlyCost * 24 * 30,
        confidence: 0.4
      }
    ];

    const optimizations = [
      {
        description: 'Implement intelligent caching to reduce API calls',
        potentialSavings: averageHourlyCost * 24 * 0.3, // 30% savings
        implementationEffort: 'Medium'
      },
      {
        description: 'Optimize batch processing for document analysis',
        potentialSavings: averageHourlyCost * 24 * 0.2, // 20% savings
        implementationEffort: 'Low'
      },
      {
        description: 'Use smaller models for simple operations',
        potentialSavings: averageHourlyCost * 24 * 0.15, // 15% savings
        implementationEffort: 'High'
      }
    ];

    return {
      currentCosts: costBreakdown,
      projections,
      optimizations
    };
  }

  /**
   * Export dashboard data for reporting
   */
  exportDashboardData(format: 'json' | 'csv' = 'json'): string {
    const currentMetrics = this.getCurrentMetrics();
    const history = this.getMetricsHistory(24);
    const trends = this.getPerformanceTrends(24);
    const costAnalysis = this.getCostAnalysis();

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      currentMetrics,
      history,
      trends,
      costAnalysis,
      summary: {
        totalMetricsPoints: history.length,
        timeRange: {
          start: history.length > 0 ? history[0].timestamp : new Date(),
          end: history.length > 0 ? history[history.length - 1].timestamp : new Date()
        }
      }
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      return this.convertDashboardDataToCSV(exportData);
    }
  }

  // Private helper methods

  private startDashboardUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.getCurrentMetrics();
        this.cleanupOldMetrics();
      } catch (error) {
        loggingService.error('Dashboard update failed', {
          module: 'AIPerformanceDashboard',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.refreshInterval);
  }

  private addToHistory(metrics: DashboardMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep history size manageable
    const maxHistorySize = Math.ceil((this.config.retentionPeriod * 60 * 60 * 1000) / this.config.refreshInterval);
    if (this.metricsHistory.length > maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-maxHistorySize);
    }
  }

  private generatePerformanceInsights(
    systemMetrics: AISystemMetrics,
    usageAnalytics: UsageAnalytics
  ): PerformanceInsights {
    const history = this.getMetricsHistory(this.config.insights.trendAnalysisPeriod / (60 * 60 * 1000));
    
    // Analyze trends
    const trends = this.analyzeTrends(history);
    
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(systemMetrics, usageAnalytics);
    
    // Generate optimizations
    const optimizations = this.generateOptimizations(systemMetrics, usageAnalytics, trends);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(systemMetrics, history);

    return {
      trends,
      bottlenecks,
      optimizations,
      anomalies
    };
  }

  private analyzeTrends(history: DashboardMetrics[]): PerformanceInsights['trends'] {
    if (history.length < 2) {
      return {
        responseTimetrend: 'stable',
        errorRateTrend: 'stable',
        costTrend: 'stable',
        usageTrend: 'stable'
      };
    }

    const recent = history.slice(-Math.min(10, history.length));
    const older = history.slice(0, Math.min(10, history.length));

    const recentAvgResponseTime = recent.reduce((sum, h) => sum + h.systemMetrics.averageResponseTime, 0) / recent.length;
    const olderAvgResponseTime = older.reduce((sum, h) => sum + h.systemMetrics.averageResponseTime, 0) / older.length;

    const recentAvgErrorRate = recent.reduce((sum, h) => sum + h.systemMetrics.overallErrorRate, 0) / recent.length;
    const olderAvgErrorRate = older.reduce((sum, h) => sum + h.systemMetrics.overallErrorRate, 0) / older.length;

    const recentAvgCost = recent.reduce((sum, h) => sum + h.systemMetrics.totalCost, 0) / recent.length;
    const olderAvgCost = older.reduce((sum, h) => sum + h.systemMetrics.totalCost, 0) / older.length;

    const recentAvgUsage = recent.reduce((sum, h) => sum + h.systemMetrics.totalOperations, 0) / recent.length;
    const olderAvgUsage = older.reduce((sum, h) => sum + h.systemMetrics.totalOperations, 0) / older.length;

    return {
      responseTimetrend: this.determineTrend(recentAvgResponseTime, olderAvgResponseTime),
      errorRateTrend: this.determineTrend(recentAvgErrorRate, olderAvgErrorRate, true), // Lower is better
      costTrend: this.determineTrend(recentAvgCost, olderAvgCost),
      usageTrend: this.determineTrend(recentAvgUsage, olderAvgUsage)
    };
  }

  private determineTrend(recent: number, older: number, lowerIsBetter: boolean = false): 'improving' | 'stable' | 'degrading' {
    const changePercent = older > 0 ? (recent - older) / older : 0;
    const threshold = 0.1; // 10% change threshold

    if (Math.abs(changePercent) < threshold) {
      return 'stable';
    }

    if (lowerIsBetter) {
      return changePercent < 0 ? 'improving' : 'degrading';
    } else {
      return changePercent > 0 ? 'improving' : 'degrading';
    }
  }

  private identifyBottlenecks(
    systemMetrics: AISystemMetrics,
    usageAnalytics: UsageAnalytics
  ): PerformanceInsights['bottlenecks'] {
    const bottlenecks: PerformanceInsights['bottlenecks'] = [];

    // Check for slow services
    Object.entries(systemMetrics.services).forEach(([service, metrics]) => {
      if (metrics.averageResponseTime > this.config.alertThresholds.responseTime) {
        bottlenecks.push({
          service,
          operation: 'general',
          issue: `High response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
          severity: metrics.averageResponseTime > this.config.alertThresholds.responseTime * 2 ? 'high' : 'medium',
          impact: 'User experience degradation'
        });
      }

      if (metrics.errorRate > this.config.alertThresholds.errorRate) {
        bottlenecks.push({
          service,
          operation: 'general',
          issue: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          severity: metrics.errorRate > this.config.alertThresholds.errorRate * 2 ? 'high' : 'medium',
          impact: 'Service reliability issues'
        });
      }
    });

    // Check for expensive operations
    usageAnalytics.topOperations.forEach(op => {
      if (op.averageTime > this.config.alertThresholds.responseTime) {
        bottlenecks.push({
          service: op.service,
          operation: op.operation,
          issue: `Slow operation: ${op.averageTime.toFixed(0)}ms average`,
          severity: 'medium',
          impact: 'Performance bottleneck'
        });
      }
    });

    return bottlenecks;
  }

  private generateOptimizations(
    systemMetrics: AISystemMetrics,
    usageAnalytics: UsageAnalytics,
    trends: PerformanceInsights['trends']
  ): PerformanceInsights['optimizations'] {
    const optimizations: PerformanceInsights['optimizations'] = [];

    // Performance optimizations
    if (trends.responseTimetrend === 'degrading') {
      optimizations.push({
        type: 'performance',
        description: 'Implement response time optimization strategies',
        estimatedImpact: '20-30% response time improvement',
        priority: 'high'
      });
    }

    // Cost optimizations
    if (trends.costTrend === 'increasing') {
      optimizations.push({
        type: 'cost',
        description: 'Optimize AI model usage and implement intelligent caching',
        estimatedImpact: '15-25% cost reduction',
        priority: 'medium'
      });
    }

    // Reliability optimizations
    if (systemMetrics.overallErrorRate > 0.05) {
      optimizations.push({
        type: 'reliability',
        description: 'Enhance error handling and retry mechanisms',
        estimatedImpact: '50% error rate reduction',
        priority: 'high'
      });
    }

    // Cache optimization
    const lowCacheHitServices = Object.entries(systemMetrics.services)
      .filter(([_, metrics]) => metrics.cacheHitRate < 0.5);
    
    if (lowCacheHitServices.length > 0) {
      optimizations.push({
        type: 'performance',
        description: `Improve caching strategy for ${lowCacheHitServices.map(([name]) => name).join(', ')}`,
        estimatedImpact: '30-40% response time improvement',
        priority: 'medium'
      });
    }

    return optimizations;
  }

  private detectAnomalies(
    systemMetrics: AISystemMetrics,
    history: DashboardMetrics[]
  ): PerformanceInsights['anomalies'] {
    const anomalies: PerformanceInsights['anomalies'] = [];

    if (history.length < 10) {
      return anomalies; // Need sufficient history for anomaly detection
    }

    // Analyze response time anomalies
    const responseTimes = history.map(h => h.systemMetrics.averageResponseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const stdDevResponseTime = Math.sqrt(
      responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length
    );

    if (Math.abs(systemMetrics.averageResponseTime - avgResponseTime) > 
        stdDevResponseTime * this.config.insights.anomalyDetectionSensitivity) {
      anomalies.push({
        service: 'system',
        metric: 'averageResponseTime',
        currentValue: systemMetrics.averageResponseTime,
        expectedValue: avgResponseTime,
        deviation: Math.abs(systemMetrics.averageResponseTime - avgResponseTime) / stdDevResponseTime,
        timestamp: new Date()
      });
    }

    // Analyze error rate anomalies
    const errorRates = history.map(h => h.systemMetrics.overallErrorRate);
    const avgErrorRate = errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
    const stdDevErrorRate = Math.sqrt(
      errorRates.reduce((sum, rate) => sum + Math.pow(rate - avgErrorRate, 2), 0) / errorRates.length
    );

    if (Math.abs(systemMetrics.overallErrorRate - avgErrorRate) > 
        stdDevErrorRate * this.config.insights.anomalyDetectionSensitivity) {
      anomalies.push({
        service: 'system',
        metric: 'errorRate',
        currentValue: systemMetrics.overallErrorRate,
        expectedValue: avgErrorRate,
        deviation: Math.abs(systemMetrics.overallErrorRate - avgErrorRate) / stdDevErrorRate,
        timestamp: new Date()
      });
    }

    return anomalies;
  }

  private generateRecommendations(
    systemMetrics: AISystemMetrics,
    usageAnalytics: UsageAnalytics,
    insights: PerformanceInsights
  ): DashboardRecommendation[] {
    if (!this.config.insights.recommendationEngine) {
      return [];
    }

    const recommendations: DashboardRecommendation[] = [];

    // Performance recommendations
    if (insights.trends.responseTimetrend === 'degrading') {
      recommendations.push({
        id: `perf_${Date.now()}`,
        type: 'performance',
        priority: 'high',
        title: 'Response Time Degradation Detected',
        description: 'System response times are trending upward. Immediate optimization needed.',
        actionItems: [
          'Review and optimize slow operations',
          'Implement or improve caching strategies',
          'Consider scaling resources',
          'Analyze and fix performance bottlenecks'
        ],
        estimatedImpact: '20-30% response time improvement',
        implementationEffort: 'medium',
        createdAt: new Date()
      });
    }

    // Cost recommendations
    if (systemMetrics.totalCost > 100) { // Arbitrary threshold
      recommendations.push({
        id: `cost_${Date.now()}`,
        type: 'cost',
        priority: 'medium',
        title: 'Cost Optimization Opportunity',
        description: 'AI service costs are significant. Consider optimization strategies.',
        actionItems: [
          'Implement intelligent caching to reduce API calls',
          'Optimize model selection for different use cases',
          'Review and eliminate unnecessary operations',
          'Consider batch processing for bulk operations'
        ],
        estimatedImpact: '15-25% cost reduction',
        implementationEffort: 'medium',
        createdAt: new Date()
      });
    }

    // Reliability recommendations
    if (systemMetrics.overallErrorRate > 0.05) {
      recommendations.push({
        id: `rel_${Date.now()}`,
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate Detected',
        description: 'System error rate is above acceptable threshold. Reliability improvements needed.',
        actionItems: [
          'Enhance error handling and retry logic',
          'Implement circuit breaker patterns',
          'Add comprehensive monitoring and alerting',
          'Review and fix common error patterns'
        ],
        estimatedImpact: '50% error rate reduction',
        implementationEffort: 'high',
        createdAt: new Date()
      });
    }

    // Store recommendations
    recommendations.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });

    return recommendations;
  }

  private convertDashboardDataToCSV(data: any): string {
    const lines = ['timestamp,service,metric,value'];
    
    // Add system metrics over time
    if (data.history) {
      data.history.forEach((point: DashboardMetrics) => {
        lines.push(`${point.timestamp.toISOString()},system,responseTime,${point.systemMetrics.averageResponseTime}`);
        lines.push(`${point.timestamp.toISOString()},system,errorRate,${point.systemMetrics.overallErrorRate}`);
        lines.push(`${point.timestamp.toISOString()},system,totalCost,${point.systemMetrics.totalCost}`);
        lines.push(`${point.timestamp.toISOString()},system,totalOperations,${point.systemMetrics.totalOperations}`);
      });
    }
    
    return lines.join('\n');
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(
      metrics => metrics.timestamp.getTime() >= cutoffTime
    );

    // Cleanup old recommendations
    for (const [id, rec] of this.recommendations.entries()) {
      if (rec.createdAt.getTime() < cutoffTime) {
        this.recommendations.delete(id);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.metricsHistory = [];
    this.recommendations.clear();

    loggingService.info('AI Performance Dashboard destroyed', {
      module: 'AIPerformanceDashboard'
    });
  }
}

// Export singleton instance
export const aiPerformanceDashboard = AIPerformanceDashboard.getInstance();