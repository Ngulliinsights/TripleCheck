/**
 * Production Monitoring Dashboard for Request Deduplication System
 * 
 * Provides real-time monitoring, alerting, and performance analytics
 * for the RequestDeduplicator system in production environments.
 */

import { EventEmitter } from 'events';
import { cachePerformanceMonitor, CacheMetrics, DeduplicationMetrics, PerformanceAlert } from './CachePerformanceMonitor';
import { RequestDeduplicator } from '../deduplication/RequestDeduplicator';

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  retentionPeriod: number; // hours
  alertThresholds: {
    criticalHitRate: number;
    criticalMemoryUsage: number;
    criticalResponseTime: number;
    criticalErrorRate: number;
  };
  enableRealTimeUpdates: boolean;
  enableEmailAlerts: boolean;
  enableSlackAlerts: boolean;
}

export interface DashboardMetrics {
  timestamp: Date;
  system: {
    uptime: number;
    version: string;
    environment: string;
  };
  cache: CacheMetrics;
  deduplication: DeduplicationMetrics;
  performance: {
    requestsPerSecond: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  alerts: PerformanceAlert[];
  trends: {
    hitRateTrend: number[]; // Last 24 hours
    memoryUsageTrend: number[];
    responseTimeTrend: number[];
  };
}

export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export class MonitoringDashboard extends EventEmitter {
  private static instance: MonitoringDashboard;
  private config: DashboardConfig;
  private metrics: DashboardMetrics[] = [];
  private alertChannels: AlertChannel[] = [];
  private refreshTimer?: NodeJS.Timeout;
  private startTime: Date;
  private responseTimes: number[] = [];
  private requestCounts: number[] = [];

  private constructor(config: Partial<DashboardConfig> = {}) {
    super();
    
    this.config = {
      refreshInterval: 5000, // 5 seconds
      retentionPeriod: 24, // 24 hours
      alertThresholds: {
        criticalHitRate: 0.5, // 50%
        criticalMemoryUsage: 100 * 1024 * 1024, // 100MB
        criticalResponseTime: 1000, // 1 second
        criticalErrorRate: 0.1 // 10%
      },
      enableRealTimeUpdates: true,
      enableEmailAlerts: false,
      enableSlackAlerts: false,
      ...config
    };

    this.startTime = new Date();
    this.setupMonitoring();
  }

  static getInstance(config?: Partial<DashboardConfig>): MonitoringDashboard {
    if (!MonitoringDashboard.instance) {
      MonitoringDashboard.instance = new MonitoringDashboard(config);
    }
    return MonitoringDashboard.instance;
  }

  /**
   * Start the monitoring dashboard
   */
  start(): void {
    console.log('📊 Starting monitoring dashboard...');
    
    if (this.config.enableRealTimeUpdates) {
      this.refreshTimer = setInterval(() => {
        this.collectMetrics();
      }, this.config.refreshInterval);
    }

    // Subscribe to performance alerts
    cachePerformanceMonitor.onAlert((alert) => {
      this.handleAlert(alert);
    });

    // Initial metrics collection
    this.collectMetrics();
    
    console.log('✅ Monitoring dashboard started');
  }

  /**
   * Stop the monitoring dashboard
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    console.log('🛑 Monitoring dashboard stopped');
  }

  /**
   * Get current dashboard metrics
   */
  getCurrentMetrics(): DashboardMetrics {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : this.createEmptyMetrics();
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): DashboardMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Add alert channel
   */
  addAlertChannel(channel: AlertChannel): void {
    this.alertChannels.push(channel);
    console.log(`📢 Added alert channel: ${channel.name} (${channel.type})`);
  }

  /**
   * Remove alert channel
   */
  removeAlertChannel(channelName: string): void {
    this.alertChannels = this.alertChannels.filter(channel => channel.name !== channelName);
    console.log(`🗑️  Removed alert channel: ${channelName}`);
  }

  /**
   * Generate performance report
   */
  generateReport(hours: number = 24): {
    summary: DashboardMetrics;
    trends: {
      hitRateImprovement: number;
      memoryEfficiency: number;
      responseTimeReduction: number;
    };
    recommendations: string[];
    alerts: PerformanceAlert[];
  } {
    const historical = this.getHistoricalMetrics(hours);
    const current = this.getCurrentMetrics();
    
    if (historical.length === 0) {
      return {
        summary: current,
        trends: { hitRateImprovement: 0, memoryEfficiency: 0, responseTimeReduction: 0 },
        recommendations: ['Insufficient data for trend analysis'],
        alerts: current.alerts
      };
    }

    const oldest = historical[0];
    const trends = {
      hitRateImprovement: current.cache.hitRate - oldest.cache.hitRate,
      memoryEfficiency: (oldest.cache.memoryUsage - current.cache.memoryUsage) / oldest.cache.memoryUsage,
      responseTimeReduction: (oldest.cache.averageResponseTime - current.cache.averageResponseTime) / oldest.cache.averageResponseTime
    };

    const recommendations = this.generateRecommendations(current, trends);

    return {
      summary: current,
      trends,
      recommendations,
      alerts: current.alerts
    };
  }

  /**
   * Record response time for performance tracking
   */
  recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times (last 1000)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }
  }

  /**
   * Record request count
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestCounts.push(now);
    
    // Keep only recent requests (last 5 minutes)
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    this.requestCounts = this.requestCounts.filter(timestamp => timestamp > fiveMinutesAgo);
  }

  /**
   * Get real-time dashboard data for web interface
   */
  getDashboardData(): {
    metrics: DashboardMetrics;
    charts: {
      hitRateChart: { labels: string[]; data: number[] };
      memoryUsageChart: { labels: string[]; data: number[] };
      responseTimeChart: { labels: string[]; data: number[] };
      requestVolumeChart: { labels: string[]; data: number[] };
    };
    status: 'healthy' | 'warning' | 'critical';
  } {
    const current = this.getCurrentMetrics();
    const historical = this.getHistoricalMetrics(1); // Last hour
    
    const labels = historical.map(m => m.timestamp.toLocaleTimeString());
    
    const charts = {
      hitRateChart: {
        labels,
        data: historical.map(m => m.cache.hitRate * 100)
      },
      memoryUsageChart: {
        labels,
        data: historical.map(m => m.cache.memoryUsage / 1024 / 1024) // MB
      },
      responseTimeChart: {
        labels,
        data: historical.map(m => m.cache.averageResponseTime)
      },
      requestVolumeChart: {
        labels,
        data: historical.map(m => m.performance.requestsPerSecond)
      }
    };

    const status = this.getSystemStatus(current);

    return { metrics: current, charts, status };
  }

  private setupMonitoring(): void {
    // Set up default alert channels
    this.addAlertChannel({
      name: 'console',
      type: 'console',
      config: {},
      enabled: true
    });

    if (this.config.enableEmailAlerts) {
      this.addAlertChannel({
        name: 'email',
        type: 'email',
        config: {
          recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
        },
        enabled: true
      });
    }

    if (this.config.enableSlackAlerts) {
      this.addAlertChannel({
        name: 'slack',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts'
        },
        enabled: true
      });
    }
  }

  private collectMetrics(): void {
    const deduplicator = RequestDeduplicator.getInstance();
    const cacheMetrics = cachePerformanceMonitor.getCurrentMetrics();
    const deduplicationMetrics = cachePerformanceMonitor.getDeduplicationMetrics();
    const deduplicatorStats = deduplicator.getStats();

    const performanceMetrics = this.calculatePerformanceMetrics();
    const trends = this.calculateTrends();

    const dashboardMetrics: DashboardMetrics = {
      timestamp: new Date(),
      system: {
        uptime: Date.now() - this.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      cache: cacheMetrics || this.createEmptyCacheMetrics(),
      deduplication: deduplicationMetrics,
      performance: performanceMetrics,
      alerts: cachePerformanceMonitor.getRecentAlerts(1),
      trends
    };

    this.metrics.push(dashboardMetrics);
    this.cleanupOldMetrics();

    // Emit update event for real-time updates
    this.emit('metricsUpdate', dashboardMetrics);
  }

  private calculatePerformanceMetrics(): DashboardMetrics['performance'] {
    const requestsPerSecond = this.requestCounts.length / 5; // 5-minute window
    
    let averageResponseTime = 0;
    let p95ResponseTime = 0;
    let p99ResponseTime = 0;

    if (this.responseTimes.length > 0) {
      const sorted = [...this.responseTimes].sort((a, b) => a - b);
      averageResponseTime = sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
      p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || 0;
      p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || 0;
    }

    return {
      requestsPerSecond,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime
    };
  }

  private calculateTrends(): DashboardMetrics['trends'] {
    const recentMetrics = this.metrics.slice(-24); // Last 24 data points
    
    return {
      hitRateTrend: recentMetrics.map(m => m.cache.hitRate),
      memoryUsageTrend: recentMetrics.map(m => m.cache.memoryUsage),
      responseTimeTrend: recentMetrics.map(m => m.cache.averageResponseTime)
    };
  }

  private handleAlert(alert: PerformanceAlert): void {
    console.warn(`🚨 Performance Alert: ${alert.message}`);
    
    // Send alert to all enabled channels
    for (const channel of this.alertChannels.filter(c => c.enabled)) {
      this.sendAlert(channel, alert);
    }

    // Emit alert event
    this.emit('alert', alert);
  }

  private async sendAlert(channel: AlertChannel, alert: PerformanceAlert): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          console.log(`[${channel.name}] ${alert.severity.toUpperCase()}: ${alert.message}`);
          break;
          
        case 'email':
          // In a real implementation, this would send an email
          console.log(`[EMAIL] Would send alert to: ${channel.config.recipients?.join(', ')}`);
          break;
          
        case 'slack':
          // In a real implementation, this would send to Slack
          console.log(`[SLACK] Would send alert to: ${channel.config.channel}`);
          break;
          
        case 'webhook':
          // In a real implementation, this would call a webhook
          console.log(`[WEBHOOK] Would send alert to: ${channel.config.url}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to send alert via ${channel.name}:`, error);
    }
  }

  private generateRecommendations(current: DashboardMetrics, trends: any): string[] {
    const recommendations: string[] = [];

    if (current.cache.hitRate < 0.7) {
      recommendations.push('Consider increasing cache TTL or reviewing cache key strategies to improve hit rate');
    }

    if (current.cache.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('Memory usage is high. Consider implementing more aggressive cleanup or cache size limits');
    }

    if (trends.hitRateImprovement < 0) {
      recommendations.push('Cache hit rate is declining. Review recent changes and cache invalidation patterns');
    }

    if (current.performance.averageResponseTime > 100) {
      recommendations.push('Average response time is elevated. Consider optimizing cache lookup performance');
    }

    if (current.deduplication.memoryEfficiency < 0.3) {
      recommendations.push('Deduplication efficiency is low. Review endpoint patterns and key generation strategies');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well. Continue monitoring for any changes in patterns');
    }

    return recommendations;
  }

  private getSystemStatus(metrics: DashboardMetrics): 'healthy' | 'warning' | 'critical' {
    const { alertThresholds } = this.config;
    
    // Critical conditions
    if (
      metrics.cache.hitRate < alertThresholds.criticalHitRate ||
      metrics.cache.memoryUsage > alertThresholds.criticalMemoryUsage ||
      metrics.cache.averageResponseTime > alertThresholds.criticalResponseTime ||
      metrics.cache.errorRate > alertThresholds.criticalErrorRate
    ) {
      return 'critical';
    }

    // Warning conditions
    if (
      metrics.cache.hitRate < 0.8 ||
      metrics.cache.memoryUsage > alertThresholds.criticalMemoryUsage * 0.8 ||
      metrics.cache.averageResponseTime > alertThresholds.criticalResponseTime * 0.8
    ) {
      return 'warning';
    }

    return 'healthy';
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  private createEmptyMetrics(): DashboardMetrics {
    return {
      timestamp: new Date(),
      system: {
        uptime: 0,
        version: '1.0.0',
        environment: 'unknown'
      },
      cache: this.createEmptyCacheMetrics(),
      deduplication: {
        totalRequests: 0,
        deduplicatedRequests: 0,
        duplicatesSaved: 0,
        averageDeduplicationTime: 0,
        concurrentRequestsSaved: 0,
        memoryEfficiency: 0
      },
      performance: {
        requestsPerSecond: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      alerts: [],
      trends: {
        hitRateTrend: [],
        memoryUsageTrend: [],
        responseTimeTrend: []
      }
    };
  }

  private createEmptyCacheMetrics(): CacheMetrics {
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
      timestamp: new Date()
    };
  }
}

// Export singleton instance
export const monitoringDashboard = MonitoringDashboard.getInstance();