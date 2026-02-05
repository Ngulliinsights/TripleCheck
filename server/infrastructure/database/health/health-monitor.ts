/**
 * Comprehensive Database Health Monitoring System
 * 
 * Advanced health monitoring with real-time metrics, alerting,
 * and automated recovery capabilities.
 */

import { EventEmitter } from 'events';

import postgres from './index';

export interface HealthThresholds {
  connectionLatency: { warning: number; critical: number };
  queryTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  poolUtilization: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  diskUsage: { warning: number; critical: number };
  replicationLag: { warning: number; critical: number };
}

export interface HealthCheckConfig {
  checkInterval: number;
  metricsRetention: number;
  alertRetention: number;
  thresholds: HealthThresholds;
  enableAutoRecovery: boolean;
  recoveryAttempts: number;
  recoveryDelay: number;
  enableDetailedMetrics: boolean;
}

export interface DatabaseHealthMetrics {
  timestamp: Date;
  overall: 'healthy' | 'warning' | 'critical' | 'unknown';
  
  // Connection health
  connection: {
    status: 'connected' | 'disconnected' | 'degraded';
    latency: number;
    activeConnections: number;
    totalConnections: number;
    utilization: number;
    errors: number;
  };
  
  // Query performance
  queries: {
    totalExecuted: number;
    averageTime: number;
    slowQueries: number;
    failedQueries: number;
    qps: number; // queries per second
    errorRate: number;
  };
  
  // System resources
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: number;
  };
  
  // Database-specific metrics
  database: {
    size: number;
    tableCount: number;
    indexCount: number;
    deadlocks: number;
    locks: number;
    replicationLag?: number;
  };
  
  // Circuit breaker status
  circuitBreaker: {
    state: string;
    failureCount: number;
    lastFailure?: Date;
  };
}

export interface HealthAlert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface RecoveryAction {
  id: string;
  timestamp: Date;
  action: string;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Comprehensive database health monitoring system
 */
export class DatabaseHealthMonitor extends EventEmitter {
  private config: HealthCheckConfig;
  private sql: postgres.Sql;
  private replicaSql?: postgres.Sql;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsHistory: DatabaseHealthMetrics[] = [];
  private activeAlerts = new Map<string, HealthAlert>();
  private alertHistory: HealthAlert[] = [];
  private recoveryHistory: RecoveryAction[] = [];
  private isMonitoring = false;
  private lastHealthCheck: DatabaseHealthMetrics | null = null;
  
  // Performance tracking
  private queryMetrics = {
    totalQueries: 0,
    failedQueries: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    recentQueries: [] as Array<{ timestamp: number; duration: number; success: boolean }>,
  };
  
  constructor(
    sql: postgres.Sql,
    config: Partial<HealthCheckConfig> = {},
    replicaSql?: postgres.Sql
  ) {
    super();
    
    this.sql = sql;
    this.replicaSql = replicaSql;
    this.config = {
      checkInterval: 30000, // 30 seconds
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      alertRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
      thresholds: {
        connectionLatency: { warning: 100, critical: 500 },
        queryTime: { warning: 1000, critical: 5000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        poolUtilization: { warning: 0.8, critical: 0.95 },
        memoryUsage: { warning: 0.8, critical: 0.95 },
        diskUsage: { warning: 0.8, critical: 0.9 },
        replicationLag: { warning: 5000, critical: 30000 },
      },
      enableAutoRecovery: true,
      recoveryAttempts: 3,
      recoveryDelay: 5000,
      enableDetailedMetrics: true,
      ...config,
    };
  }
  
  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Health monitoring is already running');
      return;
    }
    
    console.log('🏥 Starting database health monitoring...');
    
    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    // Perform initial health check
    this.performHealthCheck();
    
    console.log(`✅ Health monitoring started (interval: ${this.config.checkInterval}ms)`);
    this.emit('monitoringStarted');
  }
  
  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('🛑 Stopping database health monitoring...');
    
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('✅ Health monitoring stopped');
    this.emit('monitoringStopped');
  }
  
  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Collect all health metrics
      const metrics = await this.collectHealthMetrics();
      
      // Store metrics
      this.storeMetrics(metrics);
      
      // Analyze health status
      this.analyzeHealthStatus(metrics);
      
      // Check for alerts
      this.checkAlertConditions(metrics);
      
      // Clean up old data
      this.cleanupOldData();
      
      // Update last health check
      this.lastHealthCheck = metrics;
      
      // Emit health check event
      this.emit('healthCheckCompleted', {
        metrics,
        duration: Date.now() - startTime,
      });
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      this.emit('healthCheckFailed', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      
      // Trigger recovery if enabled
      if (this.config.enableAutoRecovery) {
        await this.attemptRecovery('health_check_failure', error);
      }
    }
  }
  
  /**
   * Collect comprehensive health metrics
   */
  private async collectHealthMetrics(): Promise<DatabaseHealthMetrics> {
    const timestamp = new Date();
    
    // Connection health
    const connectionHealth = await this.checkConnectionHealth();
    
    // Query performance
    const queryHealth = await this.checkQueryPerformance();
    
    // System resources
    const systemHealth = await this.checkSystemHealth();
    
    // Database-specific metrics
    const databaseHealth = await this.checkDatabaseHealth();
    
    // Circuit breaker status
    const circuitBreakerHealth = this.checkCircuitBreakerHealth();
    
    // Determine overall health status
    const overall = this.determineOverallHealth([
      connectionHealth.status === 'connected' ? 'healthy' : 'critical',
      queryHealth.errorRate > this.config.thresholds.errorRate.critical ? 'critical' :
      queryHealth.errorRate > this.config.thresholds.errorRate.warning ? 'warning' : 'healthy',
      systemHealth.memoryUsage > this.config.thresholds.memoryUsage.critical ? 'critical' :
      systemHealth.memoryUsage > this.config.thresholds.memoryUsage.warning ? 'warning' : 'healthy',
    ]);
    
    return {
      timestamp,
      overall,
      connection: connectionHealth,
      queries: queryHealth,
      system: systemHealth,
      database: databaseHealth,
      circuitBreaker: circuitBreakerHealth,
    };
  }
  
  /**
   * Check connection health
   */
  private async checkConnectionHealth(): Promise<DatabaseHealthMetrics['connection']> {
    const startTime = Date.now();
    
    try {
      // Test primary connection
      await this.sql`SELECT 1 as connection_test`;
      const latency = Date.now() - startTime;
      
      // Get connection stats (would need to be implemented based on connection pool)
      const connectionStats = {
        activeConnections: 0, // Would need actual implementation
        totalConnections: 20, // Would need actual implementation
        errors: 0, // Would need actual implementation
      };
      
      return {
        status: 'connected',
        latency,
        activeConnections: connectionStats.activeConnections,
        totalConnections: connectionStats.totalConnections,
        utilization: connectionStats.totalConnections > 0 
          ? connectionStats.activeConnections / connectionStats.totalConnections 
          : 0,
        errors: connectionStats.errors,
      };
      
    } catch (error) {
      return {
        status: 'disconnected',
        latency: Date.now() - startTime,
        activeConnections: 0,
        totalConnections: 0,
        utilization: 0,
        errors: 1,
      };
    }
  }
  
  /**
   * Check query performance
   */
  private async checkQueryPerformance(): Promise<DatabaseHealthMetrics['queries']> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Calculate QPS from recent queries
    const recentQueries = this.queryMetrics.recentQueries.filter(q => q.timestamp > oneSecondAgo);
    const qps = recentQueries.length;
    
    // Calculate error rate
    const {totalQueries} = this.queryMetrics;
    const errorRate = totalQueries > 0 ? this.queryMetrics.failedQueries / totalQueries : 0;
    
    // Calculate average query time
    const averageTime = totalQueries > 0 ? this.queryMetrics.totalQueryTime / totalQueries : 0;
    
    return {
      totalExecuted: totalQueries,
      averageTime,
      slowQueries: this.queryMetrics.slowQueries,
      failedQueries: this.queryMetrics.failedQueries,
      qps,
      errorRate,
    };
  }
  
  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<DatabaseHealthMetrics['system']> {
    try {
      // Get system stats from database
      const systemStats = await this.sql`
        SELECT 
          extract(epoch from now() - pg_postmaster_start_time()) as uptime
      `;
      
      // Note: In a real implementation, you'd get actual CPU, memory, and disk usage
      // This would typically come from system monitoring tools or database-specific queries
      
      return {
        cpuUsage: 0.5, // Placeholder - would need actual implementation
        memoryUsage: 0.6, // Placeholder - would need actual implementation
        diskUsage: 0.3, // Placeholder - would need actual implementation
        uptime: systemStats[0]?.uptime || 0,
      };
      
    } catch (error) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: 0,
      };
    }
  }
  
  /**
   * Check database-specific health
   */
  private async checkDatabaseHealth(): Promise<DatabaseHealthMetrics['database']> {
    try {
      // Get database size and table/index counts
      const dbStats = await this.sql`
        SELECT 
          pg_database_size(current_database()) as db_size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
          (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as index_count
      `;
      
      // Get lock and deadlock information
      const lockStats = await this.sql`
        SELECT 
          count(*) as active_locks
        FROM pg_locks 
        WHERE granted = true
      `;
      
      const stats = dbStats[0] || {};
      const locks = lockStats[0] || {};
      
      // Check replication lag if replica is available
      let replicationLag: number | undefined;
      if (this.replicaSql) {
        try {
          const lagResult = await this.replicaSql`
            SELECT 
              CASE 
                WHEN pg_is_in_recovery() THEN 
                  extract(epoch from now() - pg_last_xact_replay_timestamp()) * 1000
                ELSE 0 
              END as lag_ms
          `;
          replicationLag = lagResult[0]?.lag_ms || 0;
        } catch (error) {
          console.warn('⚠️ Could not check replication lag:', error);
        }
      }
      
      return {
        size: parseInt(stats.db_size) || 0,
        tableCount: parseInt(stats.table_count) || 0,
        indexCount: parseInt(stats.index_count) || 0,
        deadlocks: 0, // Would need to track this over time
        locks: parseInt(locks.active_locks) || 0,
        replicationLag,
      };
      
    } catch (error) {
      console.error('❌ Error checking database health:', error);
      return {
        size: 0,
        tableCount: 0,
        indexCount: 0,
        deadlocks: 0,
        locks: 0,
      };
    }
  }
  
  /**
   * Check circuit breaker health
   */
  private checkCircuitBreakerHealth(): DatabaseHealthMetrics['circuitBreaker'] {
    // This would need to be integrated with the actual circuit breaker implementation
    return {
      state: 'closed',
      failureCount: 0,
    };
  }
  
  /**
   * Determine overall health status
   */
  private determineOverallHealth(statuses: Array<'healthy' | 'warning' | 'critical' | 'unknown'>): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.includes('unknown')) return 'unknown';
    return 'healthy';
  }
  
  /**
   * Store metrics in history
   */
  private storeMetrics(metrics: DatabaseHealthMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Clean up old metrics
    const cutoffTime = Date.now() - this.config.metricsRetention;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp.getTime() > cutoffTime);
  }
  
  /**
   * Analyze health status and emit events
   */
  private analyzeHealthStatus(metrics: DatabaseHealthMetrics): void {
    // Emit status change events
    if (this.lastHealthCheck && this.lastHealthCheck.overall !== metrics.overall) {
      this.emit('healthStatusChanged', {
        from: this.lastHealthCheck.overall,
        to: metrics.overall,
        timestamp: metrics.timestamp,
      });
    }
    
    // Emit specific health events
    if (metrics.overall === 'critical') {
      this.emit('healthCritical', metrics);
    } else if (metrics.overall === 'warning') {
      this.emit('healthWarning', metrics);
    } else if (metrics.overall === 'healthy' && this.lastHealthCheck?.overall !== 'healthy') {
      this.emit('healthRecovered', metrics);
    }
  }
  
  /**
   * Check alert conditions and trigger alerts
   */
  private checkAlertConditions(metrics: DatabaseHealthMetrics): void {
    const { thresholds } = this.config;
    
    // Check connection latency
    this.checkThreshold('connectionLatency', metrics.connection.latency, thresholds.connectionLatency);
    
    // Check query time
    this.checkThreshold('queryTime', metrics.queries.averageTime, thresholds.queryTime);
    
    // Check error rate
    this.checkThreshold('errorRate', metrics.queries.errorRate, thresholds.errorRate);
    
    // Check pool utilization
    this.checkThreshold('poolUtilization', metrics.connection.utilization, thresholds.poolUtilization);
    
    // Check memory usage
    this.checkThreshold('memoryUsage', metrics.system.memoryUsage, thresholds.memoryUsage);
    
    // Check disk usage
    this.checkThreshold('diskUsage', metrics.system.diskUsage, thresholds.diskUsage);
    
    // Check replication lag
    if (metrics.database.replicationLag !== undefined) {
      this.checkThreshold('replicationLag', metrics.database.replicationLag, thresholds.replicationLag);
    }
  }
  
  /**
   * Check individual threshold and trigger alerts
   */
  private checkThreshold(
    type: string, 
    value: number, 
    threshold: { warning: number; critical: number }
  ): void {
    const alertId = `${type}_alert`;
    const existingAlert = this.activeAlerts.get(alertId);
    
    let severity: 'info' | 'warning' | 'critical' | null = null;
    let thresholdValue = 0;
    
    if (value >= threshold.critical) {
      severity = 'critical';
      thresholdValue = threshold.critical;
    } else if (value >= threshold.warning) {
      severity = 'warning';
      thresholdValue = threshold.warning;
    }
    
    if (severity) {
      // Create or update alert
      if (!existingAlert || existingAlert.severity !== severity) {
        const alert: HealthAlert = {
          id: alertId,
          timestamp: new Date(),
          severity,
          type,
          message: `${type} is ${severity}: ${value} (threshold: ${thresholdValue})`,
          value,
          threshold: thresholdValue,
          resolved: false,
        };
        
        this.activeAlerts.set(alertId, alert);
        this.alertHistory.push(alert);
        
        console.warn(`🚨 Alert triggered: ${alert.message}`);
        this.emit('alertTriggered', alert);
      }
    } else if (existingAlert && !existingAlert.resolved) {
      // Resolve alert
      existingAlert.resolved = true;
      existingAlert.resolvedAt = new Date();
      
      console.log(`✅ Alert resolved: ${existingAlert.message}`);
      this.emit('alertResolved', existingAlert);
      
      this.activeAlerts.delete(alertId);
    }
  }
  
  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(reason: string, error: any): Promise<void> {
    const recoveryId = `recovery_${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`🔧 Attempting automatic recovery for: ${reason}`);
    
    try {
      // Implement recovery strategies based on the issue
      await this.executeRecoveryStrategy(reason, error);
      
      const recovery: RecoveryAction = {
        id: recoveryId,
        timestamp: new Date(),
        action: reason,
        success: true,
        duration: Date.now() - startTime,
      };
      
      this.recoveryHistory.push(recovery);
      
      console.log(`✅ Recovery successful: ${reason}`);
      this.emit('autoRecoveryTriggered', recovery);
      
    } catch (recoveryError) {
      const recovery: RecoveryAction = {
        id: recoveryId,
        timestamp: new Date(),
        action: reason,
        success: false,
        error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
        duration: Date.now() - startTime,
      };
      
      this.recoveryHistory.push(recovery);
      
      console.error(`❌ Recovery failed: ${reason}`, recoveryError);
      this.emit('autoRecoveryFailed', recovery);
    }
  }
  
  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(reason: string, error: any): Promise<void> {
    switch (reason) {
      case 'health_check_failure':
        // Try to reconnect
        await this.sql`SELECT 1`;
        break;
        
      case 'high_error_rate':
        // Could implement connection pool reset or other strategies
        console.log('Implementing error rate recovery strategy...');
        break;
        
      default:
        console.log(`No specific recovery strategy for: ${reason}`);
    }
  }
  
  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = Date.now();
    
    // Clean up old alerts
    const alertCutoff = now - this.config.alertRetention;
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp.getTime() > alertCutoff);
    
    // Clean up old recovery history
    this.recoveryHistory = this.recoveryHistory.filter(recovery => recovery.timestamp.getTime() > alertCutoff);
  }
  
  /**
   * Record query metrics (to be called by connection pool)
   */
  recordQuery(duration: number, success: boolean): void {
    this.queryMetrics.totalQueries++;
    this.queryMetrics.totalQueryTime += duration;
    
    if (!success) {
      this.queryMetrics.failedQueries++;
    }
    
    if (duration > this.config.thresholds.queryTime.warning) {
      this.queryMetrics.slowQueries++;
    }
    
    // Add to recent queries for QPS calculation
    this.queryMetrics.recentQueries.push({
      timestamp: Date.now(),
      duration,
      success,
    });
    
    // Keep only recent queries (last 60 seconds)
    const oneMinuteAgo = Date.now() - 60000;
    this.queryMetrics.recentQueries = this.queryMetrics.recentQueries.filter(
      q => q.timestamp > oneMinuteAgo
    );
  }
  
  /**
   * Get current health status
   */
  getHealthStatus(): DatabaseHealthMetrics | null {
    return this.lastHealthCheck;
  }
  
  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): DatabaseHealthMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoffTime);
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  /**
   * Get alert history
   */
  getAlertHistory(hours: number = 24): HealthAlert[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.alertHistory.filter(alert => alert.timestamp.getTime() > cutoffTime);
  }
  
  /**
   * Get recovery history
   */
  getRecoveryHistory(hours: number = 24): RecoveryAction[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.recoveryHistory.filter(recovery => recovery.timestamp.getTime() > cutoffTime);
  }
}

export default DatabaseHealthMonitor;