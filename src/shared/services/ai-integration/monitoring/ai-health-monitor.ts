/**
 * AI Health Monitor
 * 
 * Comprehensive health monitoring system for AI services including
 * service availability, performance thresholds, and automated alerting.
 */

import { logger as loggingService } from '../../../../../core/src/logging';
import { BaseError, ErrorDomain, ErrorSeverity } from '../../../../../core/src/error-handling';
import { aiMetricsCollector, AIServiceMetrics } from './ai-metrics-collector';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: Date;
  error?: string;
  details?: Record<string, any>;
}

export interface ServiceHealthThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  minSuccessRate: number;
  maxConsecutiveFailures: number;
  healthCheckInterval: number;
  degradedThreshold: number;
  unhealthyThreshold: number;
}

export interface SystemHealthStatus {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, HealthCheckResult>;
  alerts: HealthAlert[];
  lastUpdate: Date;
  uptime: number;
  systemMetrics: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
}

export interface HealthAlert {
  id: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface HealthMonitorConfig {
  enabled: boolean;
  checkInterval: number;
  alerting: {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
    slackChannel?: string;
  };
  thresholds: {
    default: ServiceHealthThresholds;
    services: Record<string, Partial<ServiceHealthThresholds>>;
  };
  retentionPeriod: number; // Hours to keep health data
}

class AIHealthMonitorError extends BaseError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, {
      code: 'AI_HEALTH_MONITOR_ERROR',
      domain: ErrorDomain.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      cause,
      details: { operation }
    });
  }
}

export class AIHealthMonitor {
  private static instance: AIHealthMonitor;
  private config: HealthMonitorConfig;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private consecutiveFailures: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  private constructor(config?: Partial<HealthMonitorConfig>) {
    this.config = {
      enabled: true,
      checkInterval: 60000, // 1 minute
      alerting: {
        enabled: true
      },
      thresholds: {
        default: {
          maxResponseTime: 5000,
          maxErrorRate: 0.1,
          minSuccessRate: 0.9,
          maxConsecutiveFailures: 3,
          healthCheckInterval: 60000,
          degradedThreshold: 0.05,
          unhealthyThreshold: 0.15
        },
        services: {}
      },
      retentionPeriod: 24,
      ...config
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }

    loggingService.info('AI Health Monitor initialized', {
      module: 'AIHealthMonitor',
      config: this.config
    });
  }

  public static getInstance(config?: Partial<HealthMonitorConfig>): AIHealthMonitor {
    if (!AIHealthMonitor.instance) {
      AIHealthMonitor.instance = new AIHealthMonitor(config);
    }
    return AIHealthMonitor.instance;
  }

  /**
   * Perform health check for a specific service
   */
  async checkServiceHealth(service: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const thresholds = this.getServiceThresholds(service);

    try {
      loggingService.debug('Performing health check', {
        module: 'AIHealthMonitor',
        service
      });

      // Get service metrics
      const metrics = aiMetricsCollector.getServiceMetrics(service);
      
      let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';
      let details: Record<string, any> = {};

      if (metrics) {
        // Determine status based on metrics and thresholds
        status = this.determineServiceStatus(metrics, thresholds);
        details = {
          errorRate: metrics.errorRate,
          successRate: metrics.successRate,
          averageResponseTime: metrics.averageResponseTime,
          totalOperations: metrics.totalOperations,
          lastUpdated: metrics.lastUpdated
        };
      } else {
        // No metrics available - service might not be used yet
        status = 'unknown';
        details = { reason: 'No metrics available' };
      }

      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        service,
        status,
        responseTime,
        lastCheck: new Date(),
        details
      };

      // Update consecutive failures counter
      if (status === 'unhealthy') {
        this.consecutiveFailures.set(service, (this.consecutiveFailures.get(service) || 0) + 1);
      } else {
        this.consecutiveFailures.set(service, 0);
      }

      // Check for alerts
      await this.checkForAlerts(service, result, metrics);

      this.healthChecks.set(service, result);

      loggingService.debug('Health check completed', {
        module: 'AIHealthMonitor',
        service,
        status,
        responseTime,
        errorRate: details.errorRate
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const result: HealthCheckResult = {
        service,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: errorMessage,
        details: { checkFailed: true }
      };

      this.consecutiveFailures.set(service, (this.consecutiveFailures.get(service) || 0) + 1);
      this.healthChecks.set(service, result);

      // Create critical alert for health check failure
      await this.createAlert(service, 'critical', `Health check failed: ${errorMessage}`, {
        error: errorMessage,
        responseTime
      });

      loggingService.error('Health check failed', {
        module: 'AIHealthMonitor',
        service,
        error: errorMessage,
        responseTime
      });

      return result;
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    const services = Object.fromEntries(this.healthChecks.entries());
    const alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);

    // Calculate overall status
    const serviceStatuses = Array.from(this.healthChecks.values()).map(check => check.status);
    const overallStatus = this.calculateOverallStatus(serviceStatuses);

    // Calculate system metrics
    const totalServices = serviceStatuses.length;
    const healthyServices = serviceStatuses.filter(s => s === 'healthy').length;
    const degradedServices = serviceStatuses.filter(s => s === 'degraded').length;
    const unhealthyServices = serviceStatuses.filter(s => s === 'unhealthy').length;

    return {
      overallStatus,
      services,
      alerts,
      lastUpdate: new Date(),
      uptime: Date.now() - this.startTime,
      systemMetrics: {
        totalServices,
        healthyServices,
        degradedServices,
        unhealthyServices
      }
    };
  }

  /**
   * Get health history for a service
   */
  getServiceHealthHistory(service: string, hours: number = 24): HealthCheckResult[] {
    // In a real implementation, this would query a database
    // For now, return current status
    const current = this.healthChecks.get(service);
    return current ? [current] : [];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new AIHealthMonitorError(`Alert not found: ${alertId}`, 'resolveAlert');
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (resolvedBy) {
      alert.metadata = { ...alert.metadata, resolvedBy };
    }

    this.alerts.set(alertId, alert);

    loggingService.info('Alert resolved', {
      module: 'AIHealthMonitor',
      alertId,
      service: alert.service,
      resolvedBy
    });

    // Send resolution notification if alerting is enabled
    if (this.config.alerting.enabled) {
      await this.sendAlertNotification(alert, 'resolved');
    }
  }

  /**
   * Create a manual alert
   */
  async createManualAlert(
    service: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createAlert(service, severity, message, metadata);
  }

  /**
   * Update health monitor configuration
   */
  updateConfig(newConfig: Partial<HealthMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enabled && !this.monitoringInterval) {
      this.startMonitoring();
    } else if (!this.config.enabled && this.monitoringInterval) {
      this.stopMonitoring();
    }

    loggingService.info('Health monitor configuration updated', {
      module: 'AIHealthMonitor',
      config: this.config
    });
  }

  /**
   * Export health data for analysis
   */
  exportHealthData(): {
    healthChecks: HealthCheckResult[];
    alerts: HealthAlert[];
    systemStatus: SystemHealthStatus;
    exportTime: Date;
  } {
    return {
      healthChecks: Array.from(this.healthChecks.values()),
      alerts: Array.from(this.alerts.values()),
      systemStatus: this.getSystemHealthStatus() as any, // Will be resolved
      exportTime: new Date()
    };
  }

  // Private helper methods

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performScheduledHealthChecks();
    }, this.config.checkInterval);

    loggingService.info('Health monitoring started', {
      module: 'AIHealthMonitor',
      interval: this.config.checkInterval
    });
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    loggingService.info('Health monitoring stopped', {
      module: 'AIHealthMonitor'
    });
  }

  private async performScheduledHealthChecks(): Promise<void> {
    try {
      // Get list of services from metrics collector
      const systemMetrics = aiMetricsCollector.getSystemMetrics();
      const services = Object.keys(systemMetrics.services);

      // Add any services that have been used but don't have recent health checks
      const additionalServices = ['propertyAnalysis', 'documentProcessing', 'fraudDetection', 'recommendations'];
      for (const service of additionalServices) {
        if (!services.includes(service)) {
          services.push(service);
        }
      }

      // Perform health checks for all services
      const healthCheckPromises = services.map(service => 
        this.checkServiceHealth(service).catch(error => {
          loggingService.error('Scheduled health check failed', {
            module: 'AIHealthMonitor',
            service,
            error: error instanceof Error ? error.message : String(error)
          });
        })
      );

      await Promise.all(healthCheckPromises);

      // Clean up old alerts
      this.cleanupOldAlerts();
    } catch (error) {
      loggingService.error('Scheduled health checks failed', {
        module: 'AIHealthMonitor',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private getServiceThresholds(service: string): ServiceHealthThresholds {
    const serviceSpecific = this.config.thresholds.services[service] || {};
    return { ...this.config.thresholds.default, ...serviceSpecific };
  }

  private determineServiceStatus(
    metrics: AIServiceMetrics,
    thresholds: ServiceHealthThresholds
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Check for unhealthy conditions
    if (
      metrics.errorRate > thresholds.unhealthyThreshold ||
      metrics.successRate < thresholds.minSuccessRate ||
      metrics.averageResponseTime > thresholds.maxResponseTime
    ) {
      return 'unhealthy';
    }

    // Check for degraded conditions
    if (
      metrics.errorRate > thresholds.degradedThreshold ||
      metrics.averageResponseTime > (thresholds.maxResponseTime * 0.8)
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  private calculateOverallStatus(serviceStatuses: string[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (serviceStatuses.length === 0) return 'healthy';

    const unhealthyCount = serviceStatuses.filter(s => s === 'unhealthy').length;
    const degradedCount = serviceStatuses.filter(s => s === 'degraded').length;

    // If any service is unhealthy, system is unhealthy
    if (unhealthyCount > 0) return 'unhealthy';

    // If any service is degraded, system is degraded
    if (degradedCount > 0) return 'degraded';

    return 'healthy';
  }

  private async checkForAlerts(
    service: string,
    healthResult: HealthCheckResult,
    metrics?: AIServiceMetrics
  ): Promise<void> {
    const thresholds = this.getServiceThresholds(service);
    const consecutiveFailures = this.consecutiveFailures.get(service) || 0;

    // Check for consecutive failures alert
    if (consecutiveFailures >= thresholds.maxConsecutiveFailures) {
      await this.createAlert(
        service,
        'high',
        `Service has ${consecutiveFailures} consecutive failures`,
        { consecutiveFailures, threshold: thresholds.maxConsecutiveFailures }
      );
    }

    // Check for performance degradation alerts
    if (metrics) {
      if (metrics.errorRate > thresholds.unhealthyThreshold) {
        await this.createAlert(
          service,
          'critical',
          `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
          { errorRate: metrics.errorRate, threshold: thresholds.unhealthyThreshold }
        );
      } else if (metrics.errorRate > thresholds.degradedThreshold) {
        await this.createAlert(
          service,
          'medium',
          `Elevated error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
          { errorRate: metrics.errorRate, threshold: thresholds.degradedThreshold }
        );
      }

      if (metrics.averageResponseTime > thresholds.maxResponseTime) {
        await this.createAlert(
          service,
          'high',
          `Slow response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
          { responseTime: metrics.averageResponseTime, threshold: thresholds.maxResponseTime }
        );
      }
    }
  }

  private async createAlert(
    service: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const alertId = `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if similar alert already exists and is not resolved
    const existingAlert = Array.from(this.alerts.values()).find(
      alert => alert.service === service && 
               alert.message === message && 
               !alert.resolved &&
               Date.now() - alert.timestamp.getTime() < 300000 // 5 minutes
    );

    if (existingAlert) {
      // Don't create duplicate alerts within 5 minutes
      return existingAlert.id;
    }

    const alert: HealthAlert = {
      id: alertId,
      service,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.set(alertId, alert);

    loggingService.warn('Health alert created', {
      module: 'AIHealthMonitor',
      alertId,
      service,
      severity,
      message,
      metadata
    });

    // Send alert notification if alerting is enabled
    if (this.config.alerting.enabled) {
      await this.sendAlertNotification(alert, 'created');
    }

    return alertId;
  }

  private async sendAlertNotification(
    alert: HealthAlert,
    action: 'created' | 'resolved'
  ): Promise<void> {
    try {
      const notification = {
        alertId: alert.id,
        service: alert.service,
        severity: alert.severity,
        message: alert.message,
        action,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      };

      // In a real implementation, this would send to configured channels
      // For now, just log the notification
      loggingService.info('Alert notification sent', {
        module: 'AIHealthMonitor',
        notification
      });

      // TODO: Implement actual notification sending
      // - Webhook
      // - Email
      // - Slack
      // - SMS for critical alerts
    } catch (error) {
      loggingService.error('Failed to send alert notification', {
        module: 'AIHealthMonitor',
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt.getTime() < cutoffTime) {
        this.alerts.delete(alertId);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.healthChecks.clear();
    this.alerts.clear();
    this.consecutiveFailures.clear();

    loggingService.info('AI Health Monitor destroyed', {
      module: 'AIHealthMonitor'
    });
  }
}

// Export singleton instance
export const aiHealthMonitor = AIHealthMonitor.getInstance();