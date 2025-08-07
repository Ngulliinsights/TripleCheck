/**
 * Database Health Monitoring System
 * 
 * Comprehensive health monitoring with metrics collection, alerting,
 * and automated recovery mechanisms for database operations.
 */

import { EventEmitter } from 'events';
import { ConnectionPoolManager, HealthCheckResult } from '../connection';

export interface HealthMetrics {
  timestamp: Date;
  connectionHealth: {
    healthy: boolean;
    latency: number;
    connectionCount: number;
    poolUtilization: number;
  };
  queryMetrics: {
    totalQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    queryRate: number;
  };
  systemMetrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'connection' | 'performance' | 'resource' | 'error';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface HealthThresholds {
  connectionLatency: {
    warning: number;
    critical: number;
  };
  queryTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  poolUtilization: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
}

export interface HealthMonitorConfig {
  checkInterval: number;
  metricsRetention: number;
  alertRetention: number;
  thresholds: HealthThresholds;
  enableAutoRecovery: boolean;
  recoveryAttempts: number;
  recoveryDelay: number;
}

/**
 * Database health monitoring service
 */
export class DatabaseHealthMonitor extends EventEmitter {
  private config: HealthMonitorConfig;
  private connectionPool: ConnectionPoolManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: HealthMetrics[] = [];
  private activeAlerts: Map<string, HealthAlert> = new Map();
  private lastMetrics: HealthMetrics | null = null;
  private startTime: number;
  private queryCountSnapshot = 0;
  private lastQueryCountTime = Date.now();

  constructor(connectionPool: ConnectionPoolManager, config: Partial<HealthMonitorConfig> = {}) {
    super();
    this.connectionPool = connectionPool;
    this.startTime = Date.now();
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      alertRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
      thresholds: {
        connectionLatency: { warning: 100, critical: 500 },
        queryTime: { warning: 1000, critical: 5000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        poolUtilization: { warning: 0.8, critical: 0.95 },
        memoryUsage: { warning: 0.8, critical: 0.95 }
      },
      enableAutoRecovery: true,
      recoveryAttempts: 3,
      recoveryDelay: 5000,
      ...config
    };

    // Listen to connection pool events
    this.setupConnectionPoolListeners();
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.monitoringInterval) {
      console.warn('⚠️ Health monitoring is already running');
      return;
    }

    console.log('🏥 Starting database health monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.emit('monitoringError', error);
      }
    }, this.config.checkInterval);

    // Perform initial health check
    this.performHealthCheck().catch(error => {
      console.error('❌ Initial health check failed:', error);
    });

    this.emit('monitoringStarted');
    console.log(`✅ Health monitoring started (interval: ${this.config.checkInterval}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Health monitoring stopped');
      this.emit('monitoringStopped');
    }
  }

  /**
   * Get current health metrics
   */
  getCurrentMetrics(): HealthMetrics | null {
    return this.lastMetrics;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(since?: Date): HealthMetrics[] {
    if (!since) {
      return [...this.metricsHistory];
    }

    return this.metricsHistory.filter(metrics => metrics.timestamp >= since);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(since?: Date): HealthAlert[] {
    const alerts = Array.from(this.activeAlerts.values());
    
    if (!since) {
      return alerts;
    }

    return alerts.filter(alert => alert.timestamp >= since);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'warning' | 'critical';
    uptime: number;
    activeAlerts: number;
    criticalAlerts: number;
    lastCheck: Date | null;
    connectionHealth: boolean;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (criticalAlerts.length > 0) {
      overall = 'critical';
    } else if (activeAlerts.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      uptime: Date.now() - this.startTime,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastCheck: this.lastMetrics?.timestamp || null,
      connectionHealth: this.lastMetrics?.connectionHealth.healthy || false
    };
  }

  /**
   * Perform health check and collect metrics
   */
  private async performHealthCheck(): Promise<void> {
    const timestamp = new Date();
    
    // Get connection health
    const connectionHealth = await this.connectionPool.healthCheck();
    const connectionStats = this.connectionPool.getConnectionStats();
    
    // Calculate query rate
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastQueryCountTime;
    const queryDiff = connectionStats.totalQueries - this.queryCountSnapshot;
    const queryRate = timeDiff > 0 ? (queryDiff / timeDiff) * 1000 : 0; // queries per second
    
    this.queryCountSnapshot = connectionStats.totalQueries;
    this.lastQueryCountTime = currentTime;

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    // Build metrics
    const metrics: HealthMetrics = {
      timestamp,
      connectionHealth: {
        healthy: connectionHealth.healthy,
        latency: connectionHealth.latency,
        connectionCount: connectionHealth.connectionCount,
        poolUtilization: connectionStats.activeConnections / connectionStats.totalConnections
      },
      queryMetrics: {
        totalQueries: connectionStats.totalQueries,
        failedQueries: connectionStats.failedQueries,
        averageQueryTime: connectionStats.averageQueryTime,
        slowQueries: 0, // TODO: Implement slow query tracking
        queryRate
      },
      systemMetrics: {
        uptime: connectionStats.uptime,
        memoryUsage,
        cpuUsage: cpuPercent
      },
      alerts: []
    };

    // Analyze metrics and generate alerts
    const alerts = this.analyzeMetrics(metrics);
    metrics.alerts = alerts;

    // Store metrics
    this.lastMetrics = metrics;
    this.metricsHistory.push(metrics);
    
    // Clean up old metrics
    this.cleanupOldMetrics();
    
    // Process alerts
    this.processAlerts(alerts);

    // Emit metrics event
    this.emit('metricsCollected', metrics);

    // Log health status
    if (alerts.length > 0) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.warn(`🚨 Critical health issues detected: ${criticalAlerts.length} alerts`);
      } else {
        console.warn(`⚠️ Health warnings detected: ${alerts.length} alerts`);
      }
    }
  }

  /**
   * Analyze metrics and generate alerts
   */
  private analyzeMetrics(metrics: HealthMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // Connection health alerts
    if (!metrics.connectionHealth.healthy) {
      alerts.push(this.createAlert(
        'connection-unhealthy',
        'critical',
        'connection',
        'Database connection is unhealthy',
        { latency: metrics.connectionHealth.latency }
      ));
    } else if (metrics.connectionHealth.latency > this.config.thresholds.connectionLatency.critical) {
      alerts.push(this.createAlert(
        'connection-latency-critical',
        'critical',
        'performance',
        `Connection latency is critically high: ${metrics.connectionHealth.latency}ms`,
        { latency: metrics.connectionHealth.latency }
      ));
    } else if (metrics.connectionHealth.latency > this.config.thresholds.connectionLatency.warning) {
      alerts.push(this.createAlert(
        'connection-latency-warning',
        'medium',
        'performance',
        `Connection latency is high: ${metrics.connectionHealth.latency}ms`,
        { latency: metrics.connectionHealth.latency }
      ));
    }

    // Pool utilization alerts
    if (metrics.connectionHealth.poolUtilization > this.config.thresholds.poolUtilization.critical) {
      alerts.push(this.createAlert(
        'pool-utilization-critical',
        'critical',
        'resource',
        `Connection pool utilization is critically high: ${(metrics.connectionHealth.poolUtilization * 100).toFixed(1)}%`,
        { utilization: metrics.connectionHealth.poolUtilization }
      ));
    } else if (metrics.connectionHealth.poolUtilization > this.config.thresholds.poolUtilization.warning) {
      alerts.push(this.createAlert(
        'pool-utilization-warning',
        'medium',
        'resource',
        `Connection pool utilization is high: ${(metrics.connectionHealth.poolUtilization * 100).toFixed(1)}%`,
        { utilization: metrics.connectionHealth.poolUtilization }
      ));
    }

    // Query performance alerts
    if (metrics.queryMetrics.averageQueryTime > this.config.thresholds.queryTime.critical) {
      alerts.push(this.createAlert(
        'query-time-critical',
        'critical',
        'performance',
        `Average query time is critically high: ${metrics.queryMetrics.averageQueryTime.toFixed(2)}ms`,
        { averageQueryTime: metrics.queryMetrics.averageQueryTime }
      ));
    } else if (metrics.queryMetrics.averageQueryTime > this.config.thresholds.queryTime.warning) {
      alerts.push(this.createAlert(
        'query-time-warning',
        'medium',
        'performance',
        `Average query time is high: ${metrics.queryMetrics.averageQueryTime.toFixed(2)}ms`,
        { averageQueryTime: metrics.queryMetrics.averageQueryTime }
      ));
    }

    // Error rate alerts
    const errorRate = metrics.queryMetrics.totalQueries > 0 
      ? metrics.queryMetrics.failedQueries / metrics.queryMetrics.totalQueries 
      : 0;

    if (errorRate > this.config.thresholds.errorRate.critical) {
      alerts.push(this.createAlert(
        'error-rate-critical',
        'critical',
        'error',
        `Query error rate is critically high: ${(errorRate * 100).toFixed(2)}%`,
        { errorRate, failedQueries: metrics.queryMetrics.failedQueries, totalQueries: metrics.queryMetrics.totalQueries }
      ));
    } else if (errorRate > this.config.thresholds.errorRate.warning) {
      alerts.push(this.createAlert(
        'error-rate-warning',
        'medium',
        'error',
        `Query error rate is high: ${(errorRate * 100).toFixed(2)}%`,
        { errorRate, failedQueries: metrics.queryMetrics.failedQueries, totalQueries: metrics.queryMetrics.totalQueries }
      ));
    }

    // Memory usage alerts
    const memoryUsagePercent = metrics.systemMetrics.memoryUsage.heapUsed / metrics.systemMetrics.memoryUsage.heapTotal;
    
    if (memoryUsagePercent > this.config.thresholds.memoryUsage.critical) {
      alerts.push(this.createAlert(
        'memory-usage-critical',
        'critical',
        'resource',
        `Memory usage is critically high: ${(memoryUsagePercent * 100).toFixed(1)}%`,
        { memoryUsage: metrics.systemMetrics.memoryUsage }
      ));
    } else if (memoryUsagePercent > this.config.thresholds.memoryUsage.warning) {
      alerts.push(this.createAlert(
        'memory-usage-warning',
        'medium',
        'resource',
        `Memory usage is high: ${(memoryUsagePercent * 100).toFixed(1)}%`,
        { memoryUsage: metrics.systemMetrics.memoryUsage }
      ));
    }

    return alerts;
  }

  /**
   * Create a health alert
   */
  private createAlert(
    id: string,
    severity: HealthAlert['severity'],
    type: HealthAlert['type'],
    message: string,
    metadata?: Record<string, any>
  ): HealthAlert {
    return {
      id,
      severity,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };
  }

  /**
   * Process alerts (store, emit events, trigger recovery)
   */
  private processAlerts(alerts: HealthAlert[]): void {
    for (const alert of alerts) {
      const existingAlert = this.activeAlerts.get(alert.id);
      
      if (!existingAlert || existingAlert.resolved) {
        // New alert
        this.activeAlerts.set(alert.id, alert);
        this.emit('alertTriggered', alert);
        
        console.warn(`🚨 Health alert: [${alert.severity.toUpperCase()}] ${alert.message}`);
        
        // Trigger auto-recovery for critical alerts
        if (this.config.enableAutoRecovery && alert.severity === 'critical') {
          this.triggerAutoRecovery(alert);
        }
      } else {
        // Update existing alert timestamp
        existingAlert.timestamp = alert.timestamp;
        existingAlert.metadata = { ...existingAlert.metadata, ...alert.metadata };
      }
    }

    // Auto-resolve alerts that are no longer present
    const currentAlertIds = new Set(alerts.map(a => a.id));
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (!alert.resolved && !currentAlertIds.has(alertId)) {
        this.resolveAlert(alertId);
      }
    }
  }

  /**
   * Trigger auto-recovery for critical alerts
   */
  private async triggerAutoRecovery(alert: HealthAlert): Promise<void> {
    console.log(`🔄 Triggering auto-recovery for alert: ${alert.message}`);
    
    try {
      // Implement recovery strategies based on alert type
      switch (alert.type) {
        case 'connection':
          await this.recoverConnection();
          break;
        case 'performance':
          await this.recoverPerformance(alert);
          break;
        case 'resource':
          await this.recoverResources(alert);
          break;
        case 'error':
          await this.recoverFromErrors(alert);
          break;
      }
      
      this.emit('autoRecoveryTriggered', { alert, success: true });
    } catch (error) {
      console.error(`❌ Auto-recovery failed for alert ${alert.id}:`, error);
      this.emit('autoRecoveryTriggered', { alert, success: false, error });
    }
  }

  /**
   * Recover connection issues
   */
  private async recoverConnection(): Promise<void> {
    console.log('🔄 Attempting connection recovery...');
    
    // Force a health check to verify current state
    await this.connectionPool.healthCheck();
    
    // Additional recovery strategies could be implemented here
    // such as connection pool restart, failover, etc.
  }

  /**
   * Recover from performance issues
   */
  private async recoverPerformance(alert: HealthAlert): Promise<void> {
    console.log('🔄 Attempting performance recovery...');
    
    // Performance recovery strategies could include:
    // - Clearing query cache
    // - Reducing connection pool size temporarily
    // - Enabling query optimization hints
    
    // For now, just log the attempt
    console.log(`Performance recovery attempted for: ${alert.message}`);
  }

  /**
   * Recover from resource issues
   */
  private async recoverResources(alert: HealthAlert): Promise<void> {
    console.log('🔄 Attempting resource recovery...');
    
    // Resource recovery strategies could include:
    // - Garbage collection
    // - Connection pool size adjustment
    // - Memory cleanup
    
    if (global.gc) {
      global.gc();
      console.log('🧹 Forced garbage collection');
    }
  }

  /**
   * Recover from error conditions
   */
  private async recoverFromErrors(alert: HealthAlert): Promise<void> {
    console.log('🔄 Attempting error recovery...');
    
    // Error recovery strategies could include:
    // - Circuit breaker reset
    // - Connection pool restart
    // - Query retry with backoff
    
    console.log(`Error recovery attempted for: ${alert.message}`);
  }

  /**
   * Setup connection pool event listeners
   */
  private setupConnectionPoolListeners(): void {
    this.connectionPool.on('queryFailed', (event) => {
      this.emit('queryFailed', event);
    });

    this.connectionPool.on('circuitBreakerStateChange', (event) => {
      this.emit('circuitBreakerStateChange', event);
      
      if (event.to === 'open') {
        const alert = this.createAlert(
          'circuit-breaker-open',
          'critical',
          'error',
          'Circuit breaker has opened due to repeated failures',
          { stateChange: event }
        );
        this.processAlerts([alert]);
      }
    });

    this.connectionPool.on('fallbackTriggered', (event) => {
      this.emit('fallbackTriggered', event);
    });
  }

  /**
   * Clean up old metrics and alerts
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    
    // Clean up old metrics
    this.metricsHistory = this.metricsHistory.filter(
      metrics => now - metrics.timestamp.getTime() < this.config.metricsRetention
    );

    // Clean up old alerts
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (now - alert.timestamp.getTime() > this.config.alertRetention) {
        this.activeAlerts.delete(alertId);
      }
    }
  }
}

export default DatabaseHealthMonitor;