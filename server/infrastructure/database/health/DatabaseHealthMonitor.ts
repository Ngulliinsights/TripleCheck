/**
 * Comprehensive Database Health Monitoring System
 * 
 * Implements real-time health checks, performance monitoring,
 * automated alerting, and health metrics collection.
 * 
 * Task 2.3: Implement comprehensive health monitoring system
 */

import { EventEmitter } from 'events';

import { DatabaseCircuitBreaker } from '../connection/DatabaseCircuitBreaker';
import { ProductionConnectionPool } from '../connection/ProductionConnectionPool';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical'
}

export interface HealthCheckConfig {
  // Check intervals
  healthCheckIntervalMs: number;
  detailedCheckIntervalMs: number;
  
  // Thresholds
  connectionThreshold: number; // Percentage of max connections
  queryTimeThreshold: number; // Milliseconds
  errorRateThreshold: number; // Percentage
  
  // Alert configuration
  enableAlerts: boolean;
  alertCooldownMs: number;
  criticalAlertTimeoutMs: number;
  
  // Health check queries
  basicHealthQuery: string;
  detailedHealthQueries: string[];
  
  // Monitoring
  metricsRetentionMs: number;
  maxMetricsPoints: number;
}

export interface HealthMetrics {
  status: HealthStatus;
  timestamp: Date;
  
  // Connection metrics
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  connectionUtilization: number; // Percentage
  
  // Performance metrics
  averageQueryTime: number;
  p95QueryTime: number;
  p99QueryTime: number;
  queriesPerSecond: number;
  
  // Error metrics
  errorRate: number;
  connectionErrors: number;
  queryErrors: number;
  timeouts: number;
  
  // Database metrics
  databaseSize: number;
  activeQueries: number;
  lockedQueries: number;
  replicationLag?: number;
  
  // System metrics
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  
  // Health check results
  basicHealthCheck: boolean;
  detailedHealthChecks: Record<string, boolean>;
  lastSuccessfulCheck: Date;
  consecutiveFailures: number;
}

export interface AlertConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  enabled: boolean;
  severity: HealthStatus[];
}

export interface HealthAlert {
  id: string;
  severity: HealthStatus;
  title: string;
  message: string;
  metrics: HealthMetrics;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class DatabaseHealthMonitor extends EventEmitter {
  private config: Required<HealthCheckConfig>;
  private connectionPool: ProductionConnectionPool;
  private circuitBreaker?: DatabaseCircuitBreaker;
  private currentMetrics: HealthMetrics;
  private metricsHistory: HealthMetrics[] = [];
  private queryTimes: number[] = [];
  private alerts: HealthAlert[] = [];
  private lastAlertTime = new Map<string, number>();
  
  private healthCheckInterval?: NodeJS.Timeout;
  private detailedCheckInterval?: NodeJS.Timeout;
  private metricsCleanupInterval?: NodeJS.Timeout;
  
  private isShuttingDown = false;

  constructor(
    connectionPool: ProductionConnectionPool,
    config: Partial<HealthCheckConfig> = {},
    circuitBreaker?: DatabaseCircuitBreaker
  ) {
    super();
    
    this.connectionPool = connectionPool;
    this.circuitBreaker = circuitBreaker;
    
    this.config = {
      healthCheckIntervalMs: config.healthCheckIntervalMs || 30000, // 30 seconds
      detailedCheckIntervalMs: config.detailedCheckIntervalMs || 300000, // 5 minutes
      
      connectionThreshold: config.connectionThreshold || 80, // 80% of max connections
      queryTimeThreshold: config.queryTimeThreshold || 1000, // 1 second
      errorRateThreshold: config.errorRateThreshold || 5, // 5% error rate
      
      enableAlerts: config.enableAlerts !== false,
      alertCooldownMs: config.alertCooldownMs || 300000, // 5 minutes
      criticalAlertTimeoutMs: config.criticalAlertTimeoutMs || 60000, // 1 minute
      
      basicHealthQuery: config.basicHealthQuery || 'SELECT 1 as health_check',
      detailedHealthQueries: config.detailedHealthQueries || [
        'SELECT COUNT(*) FROM pg_stat_activity',
        'SELECT pg_database_size(current_database()) as db_size',
        'SELECT COUNT(*) FROM pg_locks WHERE granted = false'
      ],
      
      metricsRetentionMs: config.metricsRetentionMs || 86400000, // 24 hours
      maxMetricsPoints: config.maxMetricsPoints || 2880 // 24 hours at 30s intervals
    };

    this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): void {
    this.currentMetrics = {
      status: HealthStatus.HEALTHY,
      timestamp: new Date(),
      
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      connectionUtilization: 0,
      
      averageQueryTime: 0,
      p95QueryTime: 0,
      p99QueryTime: 0,
      queriesPerSecond: 0,
      
      errorRate: 0,
      connectionErrors: 0,
      queryErrors: 0,
      timeouts: 0,
      
      databaseSize: 0,
      activeQueries: 0,
      lockedQueries: 0,
      
      basicHealthCheck: true,
      detailedHealthChecks: {},
      lastSuccessfulCheck: new Date(),
      consecutiveFailures: 0
    };
  }

  private startMonitoring(): void {
    // Basic health checks
    this.healthCheckInterval = setInterval(
      () => this.performBasicHealthCheck(),
      this.config.healthCheckIntervalMs
    );

    // Detailed health checks
    this.detailedCheckInterval = setInterval(
      () => this.performDetailedHealthCheck(),
      this.config.detailedCheckIntervalMs
    );

    // Metrics cleanup
    this.metricsCleanupInterval = setInterval(
      () => this.cleanupOldMetrics(),
      300000 // 5 minutes
    );

    // Initial health check
    this.performBasicHealthCheck();
  }

  private async performBasicHealthCheck(): Promise<void> {
    if (this.isShuttingDown) return;

    const startTime = Date.now();
    let healthCheckPassed = false;

    try {
      // Get connection pool metrics
      const poolMetrics = this.connectionPool.getMetrics();
      const poolInfo = this.connectionPool.getPoolInfo();

      // Perform basic health query
      await this.connectionPool.query(this.config.basicHealthQuery);
      healthCheckPassed = true;

      // Update metrics
      this.updateBasicMetrics(poolMetrics, poolInfo, Date.now() - startTime);
      
      if (healthCheckPassed) {
        this.currentMetrics.lastSuccessfulCheck = new Date();
        this.currentMetrics.consecutiveFailures = 0;
      }

    } catch (error) {
      this.currentMetrics.consecutiveFailures++;
      this.handleHealthCheckError(error as Error);
    }

    this.currentMetrics.basicHealthCheck = healthCheckPassed;
    this.currentMetrics.timestamp = new Date();
    
    // Determine overall health status
    this.updateHealthStatus();
    
    // Store metrics
    this.storeMetrics();
    
    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts();
    }

    this.emit('healthCheck', this.currentMetrics);
  }

  private async performDetailedHealthCheck(): Promise<void> {
    if (this.isShuttingDown) return;

    const detailedResults: Record<string, boolean> = {};

    for (const query of this.config.detailedHealthQueries) {
      try {
        const result = await this.connectionPool.query(query);
        detailedResults[query] = true;
        
        // Extract specific metrics from known queries
        this.extractDetailedMetrics(query, result);
        
      } catch (error) {
        detailedResults[query] = false;
        this.emit('detailedCheckFailed', { query, error });
      }
    }

    this.currentMetrics.detailedHealthChecks = detailedResults;
    this.emit('detailedHealthCheck', detailedResults);
  }

  private updateBasicMetrics(poolMetrics: any, poolInfo: any, queryTime: number): void {
    // Connection metrics
    this.currentMetrics.totalConnections = poolInfo.totalCount;
    this.currentMetrics.activeConnections = poolMetrics.activeConnections;
    this.currentMetrics.idleConnections = poolInfo.idleCount;
    this.currentMetrics.waitingClients = poolInfo.waitingCount;
    this.currentMetrics.connectionUtilization = 
      (poolInfo.totalCount / poolInfo.config.max) * 100;

    // Performance metrics
    this.recordQueryTime(queryTime);
    this.currentMetrics.averageQueryTime = poolMetrics.averageQueryTime;
    this.calculatePercentiles();

    // Error metrics
    this.currentMetrics.connectionErrors = poolMetrics.connectionErrors;
    this.currentMetrics.errorRate = poolMetrics.totalQueries > 0 
      ? (poolMetrics.failedQueries / poolMetrics.totalQueries) * 100 
      : 0;
  }

  private extractDetailedMetrics(query: string, result: any[]): void {
    if (query.includes('pg_stat_activity')) {
      this.currentMetrics.activeQueries = result[0]?.count || 0;
    } else if (query.includes('pg_database_size')) {
      this.currentMetrics.databaseSize = result[0]?.db_size || 0;
    } else if (query.includes('pg_locks')) {
      this.currentMetrics.lockedQueries = result[0]?.count || 0;
    }
  }

  private recordQueryTime(time: number): void {
    this.queryTimes.push(time);
    
    // Keep only last 1000 query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }
  }

  private calculatePercentiles(): void {
    if (this.queryTimes.length === 0) return;

    const sorted = [...this.queryTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    this.currentMetrics.p95QueryTime = sorted[p95Index] || 0;
    this.currentMetrics.p99QueryTime = sorted[p99Index] || 0;
  }

  private updateHealthStatus(): void {
    let status = HealthStatus.HEALTHY;

    // Check critical conditions
    if (this.currentMetrics.consecutiveFailures >= 5) {
      status = HealthStatus.CRITICAL;
    } else if (
      this.currentMetrics.connectionUtilization > 95 ||
      this.currentMetrics.errorRate > 20 ||
      this.currentMetrics.averageQueryTime > 5000
    ) {
      status = HealthStatus.CRITICAL;
    } else if (
      this.currentMetrics.connectionUtilization > this.config.connectionThreshold ||
      this.currentMetrics.errorRate > this.config.errorRateThreshold ||
      this.currentMetrics.averageQueryTime > this.config.queryTimeThreshold
    ) {
      status = HealthStatus.DEGRADED;
    } else if (
      this.currentMetrics.connectionUtilization > 60 ||
      this.currentMetrics.errorRate > 2 ||
      this.currentMetrics.averageQueryTime > 500
    ) {
      status = HealthStatus.DEGRADED;
    }

    // Check circuit breaker status
    if (this.circuitBreaker) {
      const cbMetrics = this.circuitBreaker.getMetrics();
      if (cbMetrics.state === 'open') {
        status = HealthStatus.CRITICAL;
      } else if (cbMetrics.state === 'half_open') {
        status = HealthStatus.DEGRADED;
      }
    }

    this.currentMetrics.status = status;
  }

  private storeMetrics(): void {
    this.metricsHistory.push({ ...this.currentMetrics });
    
    // Limit history size
    if (this.metricsHistory.length > this.config.maxMetricsPoints) {
      this.metricsHistory.shift();
    }
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.metricsRetentionMs;
    
    this.metricsHistory = this.metricsHistory.filter(
      metrics => metrics.timestamp.getTime() > cutoffTime
    );

    // Clean up resolved alerts older than 24 hours
    this.alerts = this.alerts.filter(alert => {
      if (alert.resolvedAt) {
        return Date.now() - alert.resolvedAt.getTime() < 86400000;
      }
      return true;
    });
  }

  private checkForAlerts(): void {
    const now = Date.now();
    const {status} = this.currentMetrics;

    // Check if we should send an alert
    if (status === HealthStatus.HEALTHY) {
      return;
    }

    const alertKey = `${status}_${this.getAlertReason()}`;
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;

    // Check cooldown period
    if (now - lastAlert < this.config.alertCooldownMs) {
      return;
    }

    // Create and send alert
    const alert = this.createAlert(status);
    this.alerts.push(alert);
    this.lastAlertTime.set(alertKey, now);

    this.emit('alert', alert);
  }

  private getAlertReason(): string {
    const reasons: string[] = [];

    if (this.currentMetrics.connectionUtilization > this.config.connectionThreshold) {
      reasons.push('high_connection_usage');
    }
    if (this.currentMetrics.errorRate > this.config.errorRateThreshold) {
      reasons.push('high_error_rate');
    }
    if (this.currentMetrics.averageQueryTime > this.config.queryTimeThreshold) {
      reasons.push('slow_queries');
    }
    if (this.currentMetrics.consecutiveFailures > 0) {
      reasons.push('health_check_failures');
    }

    return reasons.join('_') || 'unknown';
  }

  private createAlert(severity: HealthStatus): HealthAlert {
    const reasons = this.getAlertReason().split('_');
    const title = `Database Health Alert: ${severity.toUpperCase()}`;
    
    let message = `Database health status is ${severity}. `;
    
    if (reasons.includes('high_connection_usage')) {
      message += `Connection utilization: ${this.currentMetrics.connectionUtilization.toFixed(1)}%. `;
    }
    if (reasons.includes('high_error_rate')) {
      message += `Error rate: ${this.currentMetrics.errorRate.toFixed(1)}%. `;
    }
    if (reasons.includes('slow_queries')) {
      message += `Average query time: ${this.currentMetrics.averageQueryTime.toFixed(0)}ms. `;
    }
    if (reasons.includes('health_check_failures')) {
      message += `Consecutive failures: ${this.currentMetrics.consecutiveFailures}. `;
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      message: message.trim(),
      metrics: { ...this.currentMetrics },
      timestamp: new Date(),
      acknowledged: false
    };
  }

  private handleHealthCheckError(error: Error): void {
    this.emit('healthCheckError', error);
    
    // Update error metrics
    this.currentMetrics.queryErrors++;
    
    if (error.message.includes('timeout')) {
      this.currentMetrics.timeouts++;
    }
  }

  // Public methods
  public getCurrentMetrics(): HealthMetrics {
    return { ...this.currentMetrics };
  }

  public getMetricsHistory(
    startTime?: Date, 
    endTime?: Date
  ): HealthMetrics[] {
    let history = this.metricsHistory;

    if (startTime) {
      history = history.filter(m => m.timestamp >= startTime);
    }
    if (endTime) {
      history = history.filter(m => m.timestamp <= endTime);
    }

    return history.map(m => ({ ...m }));
  }

  public getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(alert => !alert.resolvedAt);
  }

  public getAllAlerts(): HealthAlert[] {
    return this.alerts.map(alert => ({ ...alert }));
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  public async forceHealthCheck(): Promise<HealthMetrics> {
    await this.performBasicHealthCheck();
    return this.getCurrentMetrics();
  }

  public async forceDetailedCheck(): Promise<Record<string, boolean>> {
    await this.performDetailedHealthCheck();
    return this.currentMetrics.detailedHealthChecks;
  }

  public getHealthSummary(): {
    status: HealthStatus;
    uptime: number;
    totalChecks: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const totalChecks = this.metricsHistory.length;
    const successfulChecks = this.metricsHistory.filter(m => m.basicHealthCheck).length;
    const uptime = this.metricsHistory.length > 0 
      ? Date.now() - this.metricsHistory[0].timestamp.getTime()
      : 0;

    return {
      status: this.currentMetrics.status,
      uptime,
      totalChecks,
      successRate: totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0,
      averageResponseTime: this.currentMetrics.averageQueryTime
    };
  }

  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.detailedCheckInterval) {
      clearInterval(this.detailedCheckInterval);
    }
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }

    this.removeAllListeners();
  }
}

// Export singleton instance
let monitorInstance: DatabaseHealthMonitor | null = null;

export function createHealthMonitor(
  connectionPool: ProductionConnectionPool,
  config?: Partial<HealthCheckConfig>,
  circuitBreaker?: DatabaseCircuitBreaker
): DatabaseHealthMonitor {
  if (monitorInstance) {
    throw new Error('Health monitor already exists. Use getHealthMonitor() instead.');
  }
  
  monitorInstance = new DatabaseHealthMonitor(connectionPool, config, circuitBreaker);
  return monitorInstance;
}

export function getHealthMonitor(): DatabaseHealthMonitor {
  if (!monitorInstance) {
    throw new Error('Health monitor not initialized. Call createHealthMonitor() first.');
  }
  
  return monitorInstance;
}

export async function shutdownHealthMonitor(): Promise<void> {
  if (monitorInstance) {
    await monitorInstance.shutdown();
    monitorInstance = null;
  }
}