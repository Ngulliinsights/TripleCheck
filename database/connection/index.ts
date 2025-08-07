/**
 * Enhanced Database Connection Management
 * 
 * Advanced connection management with connection pooling, retry logic,
 * circuit breaker, health monitoring, and graceful degradation.
 */

import postgres from 'postgres';
import { EventEmitter } from 'events';

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxRetryDelay: number;
  healthCheckInterval: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  totalQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  uptime: number;
  circuitBreakerState: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
  connectionCount: number;
  poolStats: {
    total: number;
    idle: number;
    active: number;
    waiting: number;
  };
}

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker for database operations
 */
export class DatabaseCircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {
    super();
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN - next attempt in ${this.nextAttemptTime - Date.now()}ms`);
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
      this.emit('stateChange', { from: CircuitBreakerState.OPEN, to: CircuitBreakerState.HALF_OPEN });
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {\n    this.failureCount = 0;\n    \n    if (this.state === CircuitBreakerState.HALF_OPEN) {\n      this.successCount++;\n      if (this.successCount >= 3) {\n        this.state = CircuitBreakerState.CLOSED;\n        this.emit('stateChange', { from: CircuitBreakerState.HALF_OPEN, to: CircuitBreakerState.CLOSED });\n      }\n    }\n  }\n  \n  private onFailure(): void {\n    this.failureCount++;\n    this.lastFailureTime = Date.now();\n    \n    if (this.failureCount >= this.threshold) {\n      this.state = CircuitBreakerState.OPEN;\n      this.nextAttemptTime = Date.now() + this.timeout;\n      this.emit('stateChange', { from: CircuitBreakerState.CLOSED, to: CircuitBreakerState.OPEN });\n      this.emit('circuitOpen', { failureCount: this.failureCount, lastFailureTime: this.lastFailureTime });\n    }\n  }\n  \n  getState(): CircuitBreakerState {\n    return this.state;\n  }\n  \n  getStats(): { state: string; failureCount: number; successCount: number; nextAttemptTime: number } {\n    return {\n      state: this.state,\n      failureCount: this.failureCount,\n      successCount: this.successCount,\n      nextAttemptTime: this.nextAttemptTime\n    };\n  }\n  \n  reset(): void {\n    this.state = CircuitBreakerState.CLOSED;\n    this.failureCount = 0;\n    this.successCount = 0;\n    this.lastFailureTime = 0;\n    this.nextAttemptTime = 0;\n    this.emit('reset');\n  }\n}\n\n/**\n * Retry executor with exponential backoff\n */\nexport class RetryExecutor {\n  constructor(private options: RetryOptions) {}\n  \n  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {\n    let lastError: Error;\n    let delay = this.options.initialDelay;\n    \n    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {\n      try {\n        return await operation();\n      } catch (error) {\n        lastError = error instanceof Error ? error : new Error(String(error));\n        \n        if (attempt === this.options.maxAttempts) {\n          throw new Error(`Operation failed after ${this.options.maxAttempts} attempts${context ? ` (${context})` : ''}: ${lastError.message}`);\n        }\n        \n        // Calculate next delay with jitter\n        const nextDelay = Math.min(delay * this.options.backoffFactor, this.options.maxDelay);\n        const jitteredDelay = this.options.jitter \n          ? nextDelay * (0.5 + Math.random() * 0.5)\n          : nextDelay;\n        \n        console.warn(`Attempt ${attempt} failed${context ? ` (${context})` : ''}, retrying in ${Math.round(jitteredDelay)}ms:`, lastError.message);\n        \n        await this.sleep(jitteredDelay);\n        delay = nextDelay;\n      }\n    }\n    \n    throw lastError!;\n  }\n  \n  private sleep(ms: number): Promise<void> {\n    return new Promise(resolve => setTimeout(resolve, ms));\n  }\n}\n\n/**\n * Enhanced connection pool manager\n */\nexport class ConnectionPoolManager extends EventEmitter {\n  private sql: postgres.Sql | null = null;\n  private config: ConnectionPoolConfig;\n  private circuitBreaker: DatabaseCircuitBreaker | null = null;\n  private retryExecutor: RetryExecutor;\n  private healthCheckInterval: NodeJS.Timeout | null = null;\n  private startTime: number;\n  private queryCount = 0;\n  private failedQueryCount = 0;\n  private totalQueryTime = 0;\n  private lastHealthCheck: HealthCheckResult | null = null;\n  \n  constructor(config: ConnectionPoolConfig) {\n    super();\n    this.config = config;\n    this.startTime = Date.now();\n    \n    // Initialize circuit breaker if enabled\n    if (this.config.enableCircuitBreaker) {\n      this.circuitBreaker = new DatabaseCircuitBreaker(\n        this.config.circuitBreakerThreshold,\n        this.config.circuitBreakerTimeout\n      );\n      \n      this.circuitBreaker.on('stateChange', (event) => {\n        console.log(`🔄 Circuit breaker state changed: ${event.from} -> ${event.to}`);\n        this.emit('circuitBreakerStateChange', event);\n      });\n      \n      this.circuitBreaker.on('circuitOpen', (event) => {\n        console.warn(`⚠️ Circuit breaker opened after ${event.failureCount} failures`);\n        this.emit('circuitBreakerOpen', event);\n      });\n    }\n    \n    // Initialize retry executor\n    this.retryExecutor = new RetryExecutor({\n      maxAttempts: this.config.retryAttempts,\n      initialDelay: this.config.retryDelay,\n      maxDelay: this.config.maxRetryDelay,\n      backoffFactor: 2,\n      jitter: true\n    });\n  }\n  \n  async initialize(connectionString: string): Promise<void> {\n    try {\n      console.log('🔄 Initializing enhanced connection pool...');\n      \n      await this.retryExecutor.execute(async () => {\n        this.sql = postgres(connectionString, {\n          max: this.config.maxConnections,\n          idle_timeout: Math.floor(this.config.idleTimeout / 1000),\n          connect_timeout: Math.floor(this.config.connectionTimeout / 1000),\n          prepare: false,\n          transform: {\n            undefined: null,\n          },\n          onnotice: (notice) => {\n            console.log('📢 Database notice:', notice);\n          },\n          connection: {\n            application_name: 'triplecheck-enhanced'\n          }\n        });\n        \n        // Test connection\n        await this.sql`SELECT 1 as connection_test`;\n      }, 'connection initialization');\n      \n      // Start health monitoring\n      this.startHealthMonitoring();\n      \n      console.log('✅ Enhanced connection pool initialized successfully');\n      this.emit('initialized');\n    } catch (error) {\n      console.error('❌ Failed to initialize connection pool:', error);\n      this.emit('initializationFailed', error);\n      throw error;\n    }\n  }\n  \n  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {\n    if (!this.sql) {\n      throw new Error('Connection pool not initialized');\n    }\n    \n    const startTime = Date.now();\n    this.queryCount++;\n    \n    try {\n      const operation = async () => {\n        if (params) {\n          return await this.sql!.unsafe(sql, params) as T[];\n        }\n        return await this.sql!.unsafe(sql) as T[];\n      };\n      \n      const result = this.circuitBreaker \n        ? await this.circuitBreaker.execute(operation)\n        : await operation();\n      \n      // Update query statistics\n      const queryTime = Date.now() - startTime;\n      this.totalQueryTime += queryTime;\n      \n      return result;\n    } catch (error) {\n      this.failedQueryCount++;\n      console.error('❌ Query failed:', error);\n      this.emit('queryFailed', { sql, error, duration: Date.now() - startTime });\n      throw error;\n    }\n  }\n  \n  async transaction<T>(callback: (sql: postgres.Sql) => Promise<T>): Promise<T> {\n    if (!this.sql) {\n      throw new Error('Connection pool not initialized');\n    }\n    \n    const startTime = Date.now();\n    \n    try {\n      const operation = async () => {\n        return await this.sql!.begin(callback);\n      };\n      \n      const result = this.circuitBreaker \n        ? await this.circuitBreaker.execute(operation)\n        : await operation();\n      \n      this.emit('transactionCompleted', { duration: Date.now() - startTime });\n      return result;\n    } catch (error) {\n      this.emit('transactionFailed', { error, duration: Date.now() - startTime });\n      throw error;\n    }\n  }\n  \n  async healthCheck(): Promise<HealthCheckResult> {\n    const startTime = Date.now();\n    \n    try {\n      if (!this.sql) {\n        throw new Error('Connection pool not initialized');\n      }\n      \n      await this.sql`SELECT 1 as health_check`;\n      \n      const latency = Date.now() - startTime;\n      const stats = this.getConnectionStats();\n      \n      const result: HealthCheckResult = {\n        healthy: true,\n        latency,\n        timestamp: new Date(),\n        connectionCount: stats.totalConnections,\n        poolStats: {\n          total: stats.totalConnections,\n          idle: stats.idleConnections,\n          active: stats.activeConnections,\n          waiting: stats.waitingConnections\n        }\n      };\n      \n      this.lastHealthCheck = result;\n      this.emit('healthCheckPassed', result);\n      \n      return result;\n    } catch (error) {\n      const result: HealthCheckResult = {\n        healthy: false,\n        latency: Date.now() - startTime,\n        error: error instanceof Error ? error.message : String(error),\n        timestamp: new Date(),\n        connectionCount: 0,\n        poolStats: {\n          total: 0,\n          idle: 0,\n          active: 0,\n          waiting: 0\n        }\n      };\n      \n      this.lastHealthCheck = result;\n      this.emit('healthCheckFailed', result);\n      \n      return result;\n    }\n  }\n  \n  getConnectionStats(): ConnectionStats {\n    const uptime = Date.now() - this.startTime;\n    const averageQueryTime = this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0;\n    \n    return {\n      totalConnections: this.config.maxConnections,\n      activeConnections: 0, // postgres.js doesn't expose this directly\n      idleConnections: 0,   // postgres.js doesn't expose this directly\n      waitingConnections: 0, // postgres.js doesn't expose this directly\n      totalQueries: this.queryCount,\n      failedQueries: this.failedQueryCount,\n      averageQueryTime,\n      uptime,\n      circuitBreakerState: this.circuitBreaker?.getState() || 'disabled'\n    };\n  }\n  \n  getLastHealthCheck(): HealthCheckResult | null {\n    return this.lastHealthCheck;\n  }\n  \n  private startHealthMonitoring(): void {\n    this.healthCheckInterval = setInterval(async () => {\n      try {\n        await this.healthCheck();\n      } catch (error) {\n        console.error('❌ Health check monitoring error:', error);\n      }\n    }, this.config.healthCheckInterval);\n    \n    console.log(`🏥 Health monitoring started (interval: ${this.config.healthCheckInterval}ms)`);\n  }\n  \n  async gracefulShutdown(): Promise<void> {\n    console.log('🔄 Starting graceful shutdown of connection pool...');\n    \n    // Stop health monitoring\n    if (this.healthCheckInterval) {\n      clearInterval(this.healthCheckInterval);\n      this.healthCheckInterval = null;\n    }\n    \n    // Close database connections\n    if (this.sql) {\n      try {\n        await this.sql.end({ timeout: 5 });\n        console.log('✅ Database connections closed gracefully');\n      } catch (error) {\n        console.warn('⚠️ Error during connection cleanup:', error);\n      }\n      this.sql = null;\n    }\n    \n    this.emit('shutdown');\n    console.log('✅ Connection pool shutdown completed');\n  }\n  \n  // Graceful degradation methods\n  async executeWithFallback<T>(\n    primaryOperation: () => Promise<T>,\n    fallbackOperation: () => Promise<T>,\n    context?: string\n  ): Promise<T> {\n    try {\n      return await primaryOperation();\n    } catch (error) {\n      console.warn(`⚠️ Primary operation failed${context ? ` (${context})` : ''}, falling back:`, error);\n      this.emit('fallbackTriggered', { context, error });\n      return await fallbackOperation();\n    }\n  }\n  \n  async executeWithTimeout<T>(\n    operation: () => Promise<T>,\n    timeoutMs: number,\n    context?: string\n  ): Promise<T> {\n    const timeoutPromise = new Promise<never>((_, reject) => {\n      setTimeout(() => {\n        reject(new Error(`Operation timeout after ${timeoutMs}ms${context ? ` (${context})` : ''}`));\n      }, timeoutMs);\n    });\n    \n    return Promise.race([operation(), timeoutPromise]);\n  }\n}\n\n/**\n * Default connection pool configuration\n */\nexport const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {\n  minConnections: 2,\n  maxConnections: 10,\n  acquireTimeout: 30000,\n  idleTimeout: 30000,\n  connectionTimeout: 10000,\n  retryAttempts: 3,\n  retryDelay: 1000,\n  maxRetryDelay: 10000,\n  healthCheckInterval: 30000,\n  enableCircuitBreaker: true,\n  circuitBreakerThreshold: 5,\n  circuitBreakerTimeout: 60000\n};\n\nexport default ConnectionPoolManager;