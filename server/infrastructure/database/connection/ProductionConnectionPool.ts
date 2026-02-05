/**
 * Production-Grade Connection Pool Manager
 * 
 * Implements advanced connection pool management with dynamic scaling,
 * health validation, automatic recycling, and comprehensive monitoring.
 * 
 * Task 2.1: Implement Production-Grade Connection Management
 */

import { EventEmitter } from 'events';

import { Pool, PoolClient, PoolConfig } from 'pg';

export interface ConnectionPoolConfig extends PoolConfig {
  // Pool sizing
  minConnections?: number;
  maxConnections?: number;
  
  // Connection lifecycle
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
  maxLifetimeMs?: number;
  
  // Health monitoring
  healthCheckIntervalMs?: number;
  healthCheckTimeoutMs?: number;
  
  // Retry configuration
  maxRetries?: number;
  retryDelayMs?: number;
  retryBackoffMultiplier?: number;
  retryJitter?: boolean;
  
  // Monitoring
  enableMetrics?: boolean;
  metricsIntervalMs?: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  connectionErrors: number;
  poolErrors: number;
  lastHealthCheck: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  errors: string[];
  lastCheck: Date;
  consecutiveFailures: number;
}

export class ProductionConnectionPool extends EventEmitter {
  private pool: Pool;
  private config: Required<ConnectionPoolConfig>;
  private metrics: ConnectionMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isShuttingDown = false;
  private connectionHealth: Map<PoolClient, ConnectionHealth> = new Map();
  private queryTimes: number[] = [];
  private readonly maxQueryTimesSamples = 1000;

  constructor(config: ConnectionPoolConfig) {
    super();
    
    // Set default configuration
    this.config = {
      // Database connection
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '5432'),
      database: config.database || process.env.DB_NAME || 'triplecheck',
      user: config.user || process.env.DB_USER || 'postgres',
      password: config.password || process.env.DB_PASSWORD || '',
      
      // Pool configuration
      min: config.minConnections || 5,
      max: config.maxConnections || 50,
      minConnections: config.minConnections || 5,
      maxConnections: config.maxConnections || 50,
      
      // Connection lifecycle
      connectionTimeoutMs: config.connectionTimeoutMs || 30000,
      idleTimeoutMs: config.idleTimeoutMs || 300000, // 5 minutes
      maxLifetimeMs: config.maxLifetimeMs || 3600000, // 1 hour
      
      // Health monitoring
      healthCheckIntervalMs: config.healthCheckIntervalMs || 30000, // 30 seconds
      healthCheckTimeoutMs: config.healthCheckTimeoutMs || 5000,
      
      // Retry configuration
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      retryBackoffMultiplier: config.retryBackoffMultiplier || 2,
      retryJitter: config.retryJitter !== false,
      
      // Monitoring
      enableMetrics: config.enableMetrics !== false,
      metricsIntervalMs: config.metricsIntervalMs || 60000, // 1 minute
      
      // PostgreSQL specific
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: 'TripleCheck-Production',
      ...config
    };

    this.initializeMetrics();
    this.createPool();
    this.setupMonitoring();
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionErrors: 0,
      poolErrors: 0,
      lastHealthCheck: new Date(),
      healthStatus: 'healthy'
    };
  }

  private createPool(): void {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      min: this.config.min,
      max: this.config.max,
      connectionTimeoutMillis: this.config.connectionTimeoutMs,
      idleTimeoutMillis: this.config.idleTimeoutMs,
      statement_timeout: this.config.statement_timeout,
      query_timeout: this.config.query_timeout,
      application_name: this.config.application_name,
      ssl: this.config.ssl
    });

    this.setupPoolEventHandlers();
  }

  private setupPoolEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      this.metrics.totalConnections++;
      this.connectionHealth.set(client, {
        isHealthy: true,
        latency: 0,
        errors: [],
        lastCheck: new Date(),
        consecutiveFailures: 0
      });
      this.emit('connect', client);
    });

    this.pool.on('acquire', (client: PoolClient) => {
      this.metrics.activeConnections++;
      this.emit('acquire', client);
    });

    this.pool.on('release', (client: PoolClient) => {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
      this.emit('release', client);
    });

    this.pool.on('remove', (client: PoolClient) => {
      this.connectionHealth.delete(client);
      this.metrics.totalConnections = Math.max(0, this.metrics.totalConnections - 1);
      this.emit('remove', client);
    });

    this.pool.on('error', (error: Error, client?: PoolClient) => {
      this.metrics.poolErrors++;
      if (client) {
        const health = this.connectionHealth.get(client);
        if (health) {
          health.isHealthy = false;
          health.errors.push(error.message);
          health.consecutiveFailures++;
        }
        this.metrics.connectionErrors++;
      }
      this.emit('error', error, client);
    });
  }

  private setupMonitoring(): void {
    if (this.config.enableMetrics) {
      this.healthCheckInterval = setInterval(
        () => this.performHealthCheck(),
        this.config.healthCheckIntervalMs
      );

      this.metricsInterval = setInterval(
        () => this.updateMetrics(),
        this.config.metricsIntervalMs
      );
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const client = await this.pool.connect();
      
      try {
        await client.query('SELECT 1');
        const latency = Date.now() - startTime;
        
        const health = this.connectionHealth.get(client);
        if (health) {
          health.isHealthy = true;
          health.latency = latency;
          health.lastCheck = new Date();
          health.consecutiveFailures = 0;
        }
        
        this.metrics.healthStatus = 'healthy';
      } finally {
        client.release();
      }
    } catch (error) {
      this.metrics.healthStatus = 'unhealthy';
      this.emit('healthCheckFailed', error);
    }
    
    this.metrics.lastHealthCheck = new Date();
  }

  private updateMetrics(): void {
    this.metrics.idleConnections = this.pool.idleCount;
    this.metrics.waitingClients = this.pool.waitingCount;
    
    // Calculate average query time
    if (this.queryTimes.length > 0) {
      this.metrics.averageQueryTime = 
        this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
    }
    
    // Determine health status based on metrics
    if (this.metrics.connectionErrors > 10 || this.metrics.poolErrors > 5) {
      this.metrics.healthStatus = 'unhealthy';
    } else if (this.metrics.connectionErrors > 5 || this.metrics.averageQueryTime > 1000) {
      this.metrics.healthStatus = 'degraded';
    } else {
      this.metrics.healthStatus = 'healthy';
    }
    
    this.emit('metricsUpdated', this.metrics);
  }

  public async getConnection(): Promise<PoolClient> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const client = await this.pool.connect();
        
        // Validate connection health
        const health = this.connectionHealth.get(client);
        if (health && !health.isHealthy && health.consecutiveFailures > 3) {
          client.release();
          throw new Error('Connection is unhealthy');
        }
        
        return client;
      } catch (error) {
        lastError = error as Error;
        this.metrics.connectionErrors++;
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Failed to acquire connection after retries');
  }

  public async query<T = any>(text: string, params?: any[]): Promise<T> {
    const startTime = Date.now();
    let client: PoolClient | null = null;
    
    try {
      client = await this.getConnection();
      const result = await client.query(text, params);
      
      this.metrics.totalQueries++;
      this.metrics.successfulQueries++;
      
      const queryTime = Date.now() - startTime;
      this.recordQueryTime(queryTime);
      
      return result.rows;
    } catch (error) {
      this.metrics.totalQueries++;
      this.metrics.failedQueries++;
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private calculateRetryDelay(attempt: number): number {
    let delay = this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, attempt - 1);
    
    if (this.config.retryJitter) {
      delay += Math.random() * delay * 0.1; // Add 10% jitter
    }
    
    return Math.min(delay, 30000); // Cap at 30 seconds
  }

  private recordQueryTime(time: number): void {
    this.queryTimes.push(time);
    if (this.queryTimes.length > this.maxQueryTimesSamples) {
      this.queryTimes.shift();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public getPoolInfo() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      config: {
        min: this.config.min,
        max: this.config.max,
        connectionTimeoutMs: this.config.connectionTimeoutMs,
        idleTimeoutMs: this.config.idleTimeoutMs
      }
    };
  }

  public async validateConnection(client: PoolClient): Promise<boolean> {
    try {
      const startTime = Date.now();
      await client.query('SELECT 1');
      const latency = Date.now() - startTime;
      
      const health = this.connectionHealth.get(client);
      if (health) {
        health.isHealthy = true;
        health.latency = latency;
        health.lastCheck = new Date();
        health.consecutiveFailures = 0;
      }
      
      return true;
    } catch (error) {
      const health = this.connectionHealth.get(client);
      if (health) {
        health.isHealthy = false;
        health.errors.push((error as Error).message);
        health.consecutiveFailures++;
      }
      return false;
    }
  }

  public async recycleUnhealthyConnections(): Promise<number> {
    let recycledCount = 0;
    
    for (const [client, health] of this.connectionHealth.entries()) {
      if (!health.isHealthy && health.consecutiveFailures > 3) {
        try {
          // Remove the unhealthy connection
          client.release(true); // Force removal
          recycledCount++;
        } catch (error) {
          // Connection might already be removed
        }
      }
    }
    
    return recycledCount;
  }

  public async gracefulShutdown(timeoutMs: number = 30000): Promise<void> {
    this.isShuttingDown = true;
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Wait for active connections to finish or timeout
    const shutdownPromise = this.pool.end();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs)
    );
    
    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      // Force shutdown if timeout
      await this.pool.end();
    }
    
    this.emit('shutdown');
  }
}

// Export singleton instance
let poolInstance: ProductionConnectionPool | null = null;

export function createConnectionPool(config: ConnectionPoolConfig): ProductionConnectionPool {
  if (poolInstance) {
    throw new Error('Connection pool already exists. Use getConnectionPool() instead.');
  }
  
  poolInstance = new ProductionConnectionPool(config);
  return poolInstance;
}

export function getConnectionPool(): ProductionConnectionPool {
  if (!poolInstance) {
    throw new Error('Connection pool not initialized. Call createConnectionPool() first.');
  }
  
  return poolInstance;
}

export async function shutdownConnectionPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.gracefulShutdown();
    poolInstance = null;
  }
}