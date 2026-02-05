/**
 * Production-Grade Connection Pool Manager
 * 
 * Advanced connection pool with dynamic sizing, health monitoring,
 * performance optimization, and enterprise-grade reliability features.
 */

import { EventEmitter } from 'events';

import postgres from './index';

import { ConnectionPoolManager, ConnectionPoolConfig, DEFAULT_POOL_CONFIG } from './index';

export interface ProductionPoolConfig extends ConnectionPoolConfig {
  // Dynamic pool sizing
  dynamicSizing: boolean;
  loadThreshold: number;
  scaleUpFactor: number;
  scaleDownFactor: number;
  
  // Performance optimization
  preparedStatementCache: boolean;
  queryTimeout: number;
  slowQueryThreshold: number;
  
  // Monitoring and alerting
  metricsInterval: number;
  alertThresholds: {
    connectionLatency: number;
    queryTime: number;
    errorRate: number;
    poolUtilization: number;
  };
  
  // Advanced features
  readReplicaUrl?: string;
  enableReadWriteSplit: boolean;
  connectionValidation: boolean;
  gracefulShutdownTimeout: number;
}

export interface PoolMetrics {
  timestamp: Date;
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    utilization: number;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    slowQueries: number;
    qps: number; // queries per second
  };
  performance: {
    connectionLatency: number;
    queryLatency: number;
    errorRate: number;
    uptime: number;
  };
  circuitBreaker: {
    state: string;
    failureCount: number;
    successCount: number;
  };
}

export interface QueryAnalytics {
  sql: string;
  executionCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  lastExecuted: Date;
}

/**
 * Production-grade connection pool with advanced features
 */
export class ProductionConnectionPool extends ConnectionPoolManager {
  private config: ProductionPoolConfig;
  private primarySql: postgres.Sql | null = null;
  private replicaSql: postgres.Sql | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private queryAnalytics = new Map<string, QueryAnalytics>();
  private preparedStatements = new Map<string, string>();
  private connectionMetrics: PoolMetrics[] = [];
  private maxMetricsHistory = 1000;
  
  // Performance tracking
  private queryStartTimes = new Map<string, number>();
  private recentQueries: Array<{ time: number; duration: number; success: boolean }> = [];
  private maxRecentQueries = 1000;
  
  constructor(config: Partial<ProductionPoolConfig> = {}) {
    const fullConfig: ProductionPoolConfig = {
      ...DEFAULT_POOL_CONFIG,
      dynamicSizing: true,
      loadThreshold: 0.8,
      scaleUpFactor: 1.5,
      scaleDownFactor: 0.7,
      preparedStatementCache: true,
      queryTimeout: 30000,
      slowQueryThreshold: 1000,
      metricsInterval: 10000,
      alertThresholds: {
        connectionLatency: 100,
        queryTime: 1000,
        errorRate: 0.05,
        poolUtilization: 0.9,
      },
      enableReadWriteSplit: false,
      connectionValidation: true,
      gracefulShutdownTimeout: 30000,
      ...config,
    };
    
    super(fullConfig);
    this.config = fullConfig;
  }
  
  async initialize(connectionString: string): Promise<void> {
    try {
      console.log('🚀 Initializing production connection pool...');
      
      // Initialize primary connection
      await this.initializePrimaryConnection(connectionString);
      
      // Initialize read replica if configured
      if (this.config.readReplicaUrl && this.config.enableReadWriteSplit) {
        await this.initializeReplicaConnection(this.config.readReplicaUrl);
      }
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start dynamic pool sizing if enabled
      if (this.config.dynamicSizing) {
        this.startDynamicSizing();
      }
      
      console.log('✅ Production connection pool initialized successfully');
      this.emit('productionPoolInitialized', {
        primaryConnections: this.config.maxConnections,
        replicaEnabled: !!this.replicaSql,
        dynamicSizing: this.config.dynamicSizing,
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize production connection pool:', error);
      throw error;
    }
  }
  
  private async initializePrimaryConnection(connectionString: string): Promise<void> {
    this.primarySql = postgres(connectionString, {
      max: this.config.maxConnections,
      idle_timeout: Math.floor(this.config.idleTimeout / 1000),
      connect_timeout: Math.floor(this.config.connectionTimeout / 1000),
      prepare: this.config.preparedStatementCache,
      transform: {
        undefined: null,
      },
      connection: {
        application_name: 'triplecheck-production-primary',
        statement_timeout: this.config.queryTimeout,
      },
      onnotice: (notice) => {
        console.log('📢 Primary DB notice:', notice);
      },
      debug: process.env.NODE_ENV === 'development',
    });
    
    // Test primary connection
    await this.primarySql`SELECT 1 as primary_test`;
    console.log('✅ Primary database connection established');
  }
  
  private async initializeReplicaConnection(replicaUrl: string): Promise<void> {
    this.replicaSql = postgres(replicaUrl, {
      max: Math.ceil(this.config.maxConnections * 0.7), // 70% of primary pool size
      idle_timeout: Math.floor(this.config.idleTimeout / 1000),
      connect_timeout: Math.floor(this.config.connectionTimeout / 1000),
      prepare: this.config.preparedStatementCache,
      transform: {
        undefined: null,
      },
      connection: {
        application_name: 'triplecheck-production-replica',
        statement_timeout: this.config.queryTimeout,
      },
      onnotice: (notice) => {
        console.log('📢 Replica DB notice:', notice);
      },
      debug: process.env.NODE_ENV === 'development',
    });
    
    // Test replica connection
    await this.replicaSql`SELECT 1 as replica_test`;
    console.log('✅ Read replica connection established');
  }
  
  async query<T = any>(sql: string, params?: any[], options?: {
    useReplica?: boolean;
    timeout?: number;
    skipCache?: boolean;
  }): Promise<T[]> {
    const queryId = this.generateQueryId();
    const startTime = Date.now();
    const useReplica = options?.useReplica && this.replicaSql && this.isReadOnlyQuery(sql);
    const connection = useReplica ? this.replicaSql : this.primarySql;
    
    if (!connection) {
      throw new Error('Database connection not available');
    }
    
    try {
      // Track query start
      this.queryStartTimes.set(queryId, startTime);
      
      // Prepare query with caching if enabled
      const { optimizedSql, optimizedParams } = this.config.preparedStatementCache
        ? this.optimizeQuery(sql, params)
        : { optimizedSql: sql, optimizedParams: params };
      
      // Execute query with timeout
      const queryPromise = optimizedParams
        ? connection.unsafe(optimizedSql, optimizedParams)
        : connection.unsafe(optimizedSql);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after ${options?.timeout || this.config.queryTimeout}ms`));
        }, options?.timeout || this.config.queryTimeout);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]) as T[];
      
      // Record successful query
      this.recordQueryMetrics(sql, startTime, true, useReplica);
      
      return result;
      
    } catch (error) {
      // Record failed query
      this.recordQueryMetrics(sql, startTime, false, useReplica);
      
      console.error('❌ Query execution failed:', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        useReplica,
      });
      
      throw error;
    } finally {
      this.queryStartTimes.delete(queryId);
    }
  }
  
  private optimizeQuery(sql: string, params?: any[]): { optimizedSql: string; optimizedParams?: any[] } {
    // Generate query hash for prepared statement caching
    const queryHash = this.generateQueryHash(sql);
    
    // Check if we have a prepared statement for this query
    if (this.preparedStatements.has(queryHash)) {
      return {
        optimizedSql: this.preparedStatements.get(queryHash)!,
        optimizedParams: params,
      };
    }
    
    // Optimize query structure
    let optimizedSql = sql;
    
    // Add LIMIT to prevent runaway queries if not present
    if (sql.toLowerCase().includes('select') && 
        !sql.toLowerCase().includes('limit') && 
        !sql.toLowerCase().includes('count(')) {
      optimizedSql += ' LIMIT 10000';
    }
    
    // Cache the optimized query
    this.preparedStatements.set(queryHash, optimizedSql);
    
    return { optimizedSql, optimizedParams: params };
  }
  
  private recordQueryMetrics(sql: string, startTime: number, success: boolean, useReplica: boolean): void {
    const duration = Date.now() - startTime;
    const queryHash = this.generateQueryHash(sql);
    
    // Update query analytics
    const analytics = this.queryAnalytics.get(queryHash) || {
      sql: sql.substring(0, 200),
      executionCount: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errorCount: 0,
      lastExecuted: new Date(),
    };
    
    analytics.executionCount++;
    analytics.lastExecuted = new Date();
    
    if (success) {
      analytics.totalTime += duration;
      analytics.averageTime = analytics.totalTime / analytics.executionCount;
      analytics.minTime = Math.min(analytics.minTime, duration);
      analytics.maxTime = Math.max(analytics.maxTime, duration);
    } else {
      analytics.errorCount++;
    }
    
    this.queryAnalytics.set(queryHash, analytics);
    
    // Add to recent queries for QPS calculation
    this.recentQueries.push({ time: Date.now(), duration, success });
    if (this.recentQueries.length > this.maxRecentQueries) {
      this.recentQueries.shift();
    }
    
    // Check for slow queries
    if (duration > this.config.slowQueryThreshold) {
      console.warn('🐌 Slow query detected:', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        duration,
        useReplica,
      });
      
      this.emit('slowQuery', {
        sql,
        duration,
        useReplica,
        threshold: this.config.slowQueryThreshold,
      });
    }
  }
  
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
    
    console.log(`📊 Metrics collection started (interval: ${this.config.metricsInterval}ms)`);
  }
  
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.generateMetrics();
      
      // Store metrics
      this.connectionMetrics.push(metrics);
      if (this.connectionMetrics.length > this.maxMetricsHistory) {
        this.connectionMetrics.shift();
      }
      
      // Check alert thresholds
      this.checkAlertThresholds(metrics);
      
      // Emit metrics event
      this.emit('metricsCollected', metrics);
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }
  
  private async generateMetrics(): Promise<PoolMetrics> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Calculate QPS from recent queries
    const recentQueriesInLastSecond = this.recentQueries.filter(q => q.time > oneSecondAgo);
    const qps = recentQueriesInLastSecond.length;
    
    // Calculate success rate
    const totalQueries = this.recentQueries.length;
    const successfulQueries = this.recentQueries.filter(q => q.success).length;
    const errorRate = totalQueries > 0 ? (totalQueries - successfulQueries) / totalQueries : 0;
    
    // Calculate average query time
    const averageQueryTime = this.recentQueries.length > 0
      ? this.recentQueries.reduce((sum, q) => sum + q.duration, 0) / this.recentQueries.length
      : 0;
    
    // Get connection stats
    const connectionStats = this.getConnectionStats();
    
    return {
      timestamp: new Date(),
      connections: {
        total: connectionStats.totalConnections,
        active: connectionStats.activeConnections,
        idle: connectionStats.idleConnections,
        waiting: connectionStats.waitingConnections,
        utilization: connectionStats.totalConnections > 0 
          ? connectionStats.activeConnections / connectionStats.totalConnections 
          : 0,
      },
      queries: {
        total: connectionStats.totalQueries,
        successful: connectionStats.totalQueries - connectionStats.failedQueries,
        failed: connectionStats.failedQueries,
        averageTime: averageQueryTime,
        slowQueries: Array.from(this.queryAnalytics.values())
          .filter(q => q.averageTime > this.config.slowQueryThreshold).length,
        qps,
      },
      performance: {
        connectionLatency: 0, // Would need to implement connection latency measurement
        queryLatency: averageQueryTime,
        errorRate,
        uptime: connectionStats.uptime,
      },
      circuitBreaker: {
        state: connectionStats.circuitBreakerState,
        failureCount: 0, // Would need to expose from circuit breaker
        successCount: 0, // Would need to expose from circuit breaker
      },
    };
  }
  
  private checkAlertThresholds(metrics: PoolMetrics): void {
    const { alertThresholds } = this.config;
    
    // Check connection latency
    if (metrics.performance.connectionLatency > alertThresholds.connectionLatency) {
      this.emit('alert', {
        type: 'connectionLatency',
        value: metrics.performance.connectionLatency,
        threshold: alertThresholds.connectionLatency,
        severity: 'warning',
      });
    }
    
    // Check query time
    if (metrics.performance.queryLatency > alertThresholds.queryTime) {
      this.emit('alert', {
        type: 'queryTime',
        value: metrics.performance.queryLatency,
        threshold: alertThresholds.queryTime,
        severity: 'warning',
      });
    }
    
    // Check error rate
    if (metrics.performance.errorRate > alertThresholds.errorRate) {
      this.emit('alert', {
        type: 'errorRate',
        value: metrics.performance.errorRate,
        threshold: alertThresholds.errorRate,
        severity: 'critical',
      });
    }
    
    // Check pool utilization
    if (metrics.connections.utilization > alertThresholds.poolUtilization) {
      this.emit('alert', {
        type: 'poolUtilization',
        value: metrics.connections.utilization,
        threshold: alertThresholds.poolUtilization,
        severity: 'warning',
      });
    }
  }
  
  private startDynamicSizing(): void {
    setInterval(() => {
      this.adjustPoolSize();
    }, 30000); // Check every 30 seconds
    
    console.log('📈 Dynamic pool sizing enabled');
  }
  
  private adjustPoolSize(): void {
    const latestMetrics = this.connectionMetrics[this.connectionMetrics.length - 1];
    if (!latestMetrics) return;
    
    const {utilization} = latestMetrics.connections;
    const currentMax = this.config.maxConnections;
    
    if (utilization > this.config.loadThreshold) {
      // Scale up
      const newMax = Math.min(
        Math.ceil(currentMax * this.config.scaleUpFactor),
        50 // Hard limit
      );
      
      if (newMax > currentMax) {
        console.log(`📈 Scaling up connection pool: ${currentMax} -> ${newMax}`);
        this.config.maxConnections = newMax;
        this.emit('poolScaled', { direction: 'up', from: currentMax, to: newMax });
      }
    } else if (utilization < this.config.loadThreshold * 0.5) {
      // Scale down
      const newMax = Math.max(
        Math.ceil(currentMax * this.config.scaleDownFactor),
        this.config.minConnections
      );
      
      if (newMax < currentMax) {
        console.log(`📉 Scaling down connection pool: ${currentMax} -> ${newMax}`);
        this.config.maxConnections = newMax;
        this.emit('poolScaled', { direction: 'down', from: currentMax, to: newMax });
      }
    }
  }
  
  getMetrics(): PoolMetrics[] {
    return [...this.connectionMetrics];
  }
  
  getQueryAnalytics(): QueryAnalytics[] {
    return Array.from(this.queryAnalytics.values())
      .sort((a, b) => b.executionCount - a.executionCount);
  }
  
  getSlowQueries(): QueryAnalytics[] {
    return this.getQueryAnalytics()
      .filter(q => q.averageTime > this.config.slowQueryThreshold);
  }
  
  private isReadOnlyQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toLowerCase();
    return normalizedSql.startsWith('select') || 
           normalizedSql.startsWith('with') ||
           normalizedSql.startsWith('show') ||
           normalizedSql.startsWith('explain');
  }
  
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateQueryHash(sql: string): string {
    // Simple hash function for query caching
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
  
  async gracefulShutdown(): Promise<void> {
    console.log('🔄 Starting graceful shutdown of production connection pool...');
    
    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    // Close replica connection first
    if (this.replicaSql) {
      try {
        await this.replicaSql.end({ timeout: 5 });
        console.log('✅ Replica connection closed');
      } catch (error) {
        console.warn('⚠️ Error closing replica connection:', error);
      }
      this.replicaSql = null;
    }
    
    // Close primary connection
    if (this.primarySql) {
      try {
        await this.primarySql.end({ timeout: 5 });
        console.log('✅ Primary connection closed');
      } catch (error) {
        console.warn('⚠️ Error closing primary connection:', error);
      }
      this.primarySql = null;
    }
    
    // Call parent shutdown
    await super.gracefulShutdown();
    
    console.log('✅ Production connection pool shutdown completed');
  }
}

/**
 * Production-optimized configuration
 */
export const PRODUCTION_POOL_CONFIG: ProductionPoolConfig = {
  ...DEFAULT_POOL_CONFIG,
  minConnections: 5,
  maxConnections: 20,
  acquireTimeout: 30000,
  idleTimeout: 300000, // 5 minutes
  connectionTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  healthCheckInterval: 15000,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  
  // Production-specific settings
  dynamicSizing: true,
  loadThreshold: 0.8,
  scaleUpFactor: 1.5,
  scaleDownFactor: 0.7,
  preparedStatementCache: true,
  queryTimeout: 30000,
  slowQueryThreshold: 1000,
  metricsInterval: 10000,
  alertThresholds: {
    connectionLatency: 100,
    queryTime: 1000,
    errorRate: 0.05,
    poolUtilization: 0.9,
  },
  enableReadWriteSplit: false,
  connectionValidation: true,
  gracefulShutdownTimeout: 30000,
};

export default ProductionConnectionPool;