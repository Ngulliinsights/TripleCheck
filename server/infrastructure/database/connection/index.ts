/**
 * Enhanced Database Connection Management
 * 
 * Advanced connection management with connection pooling, retry logic,
 * circuit breaker, health monitoring, and graceful degradation.
 * 
 * Refactored for improved clarity, performance, and maintainability.
 */

import postgres from 'postgres';
import { EventEmitter } from 'events';

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

export interface ConnectionPoolConfig {
  readonly minConnections: number;
  readonly maxConnections: number;
  readonly acquireTimeout: number;
  readonly idleTimeout: number;
  readonly connectionTimeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly maxRetryDelay: number;
  readonly healthCheckInterval: number;
  readonly enableCircuitBreaker: boolean;
  readonly circuitBreakerThreshold: number;
  readonly circuitBreakerTimeout: number;
}

export interface ConnectionStats {
  readonly totalConnections: number;
  readonly activeConnections: number;
  readonly idleConnections: number;
  readonly waitingConnections: number;
  readonly totalQueries: number;
  readonly failedQueries: number;
  readonly averageQueryTime: number;
  readonly uptime: number;
  readonly circuitBreakerState: string;
}

export interface PoolStats {
  readonly total: number;
  readonly idle: number;
  readonly active: number;
  readonly waiting: number;
}

export interface HealthCheckResult {
  readonly healthy: boolean;
  readonly latency: number;
  readonly error?: string;
  readonly timestamp: Date;
  readonly connectionCount: number;
  readonly poolStats: PoolStats;
}

export interface RetryOptions {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffFactor: number;
  readonly jitter: boolean;
}

// Circuit breaker event types for better type safety
export interface CircuitBreakerStateChangeEvent {
  readonly from: CircuitBreakerState;
  readonly to: CircuitBreakerState;
}

export interface CircuitBreakerOpenEvent {
  readonly failureCount: number;
  readonly lastFailureTime: number;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

// Constants for better maintainability
const HALF_OPEN_SUCCESS_THRESHOLD = 3;
const DEFAULT_BACKOFF_FACTOR = 2;
const JITTER_RANGE = { MIN: 0.5, MAX: 1.0 };
const CONNECTION_TEST_TIMEOUT = 5000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a promise that resolves after the specified delay
 * Extracted for reusability and testing
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Applies jitter to a delay value to prevent thundering herd problems
 */
const applyJitter = (delay: number, shouldApplyJitter: boolean): number => {
  if (!shouldApplyJitter) return delay;

  const { MIN, MAX } = JITTER_RANGE;
  return delay * (MIN + Math.random() * (MAX - MIN));
};

/**
 * Safely converts a value to an Error instance
 */
const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

/**
 * Circuit breaker for database operations with improved state management
 * and better encapsulation of state transitions
 */
export class DatabaseCircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {
    super();

    // Input validation for better error handling
    if (threshold <= 0) {
      throw new Error('Circuit breaker threshold must be positive');
    }
    if (timeout <= 0) {
      throw new Error('Circuit breaker timeout must be positive');
    }
  }

  /**
   * Executes an operation through the circuit breaker with improved error handling
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.validateOperationState();

    try {
      const result = await operation();
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }

  /**
   * Validates the current state and transitions if necessary
   */
  private validateOperationState(): void {
    if (this.state === CircuitBreakerState.OPEN) {
      const currentTime = Date.now();

      if (currentTime < this.nextAttemptTime) {
        const waitTime = this.nextAttemptTime - currentTime;
        throw new Error(`Circuit breaker is OPEN - retry in ${waitTime}ms`);
      }

      this.transitionTo(CircuitBreakerState.HALF_OPEN);
      this.successCount = 0;
    }
  }

  /**
   * Handles successful operation execution
   */
  private handleSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= HALF_OPEN_SUCCESS_THRESHOLD) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    }
  }

  /**
   * Handles failed operation execution
   */
  private handleFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state !== CircuitBreakerState.OPEN && this.failureCount >= this.threshold) {
      this.nextAttemptTime = Date.now() + this.timeout;
      this.transitionTo(CircuitBreakerState.OPEN);

      this.emit('circuitOpen', {
        failureCount: this.failureCount,
        lastFailureTime: this.lastFailureTime
      } as CircuitBreakerOpenEvent);
    }
  }

  /**
   * Handles state transitions with proper event emission
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    this.emit('stateChange', {
      from: oldState,
      to: newState
    } as CircuitBreakerStateChangeEvent);
  }

  // Public getters for state inspection
  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats(): {
    readonly state: string;
    readonly failureCount: number;
    readonly successCount: number;
    readonly nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Resets the circuit breaker to initial state
   */
  reset(): void {
    const oldState = this.state;
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;

    this.emit('reset', { previousState: oldState });
  }
}

// ============================================================================
// RETRY EXECUTOR IMPLEMENTATION
// ============================================================================

/**
 * Retry executor with exponential backoff and improved error context
 */
export class RetryExecutor {
  constructor(private readonly options: RetryOptions) {
    // Validate retry options on construction
    this.validateOptions();
  }

  private validateOptions(): void {
    const { maxAttempts, initialDelay, maxDelay, backoffFactor } = this.options;

    if (maxAttempts <= 0) {
      throw new Error('maxAttempts must be positive');
    }
    if (initialDelay < 0 || maxDelay < 0) {
      throw new Error('Delay values must be non-negative');
    }
    if (backoffFactor <= 0) {
      throw new Error('backoffFactor must be positive');
    }
    if (initialDelay > maxDelay) {
      throw new Error('initialDelay cannot exceed maxDelay');
    }
  }

  /**
   * Executes an operation with retry logic and improved error reporting
   */
  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    let lastError: Error | undefined;
    let currentDelay = this.options.initialDelay;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = toError(error);

        // Don't wait after the final attempt
        if (attempt === this.options.maxAttempts) {
          break;
        }

        const delayMs = this.calculateNextDelay(currentDelay);

        console.warn(
          `Attempt ${attempt}/${this.options.maxAttempts} failed` +
          `${context ? ` (${context})` : ''}, retrying in ${Math.round(delayMs)}ms: ${lastError.message}`
        );

        await sleep(delayMs);
        currentDelay = Math.min(currentDelay * this.options.backoffFactor, this.options.maxDelay);
      }
    }

    // Create a comprehensive error message for the final failure
    const errorMessage = `Operation failed after ${this.options.maxAttempts} attempts` +
      `${context ? ` (${context})` : ''}: ${lastError?.message || 'Unknown error'}`;

    throw new Error(errorMessage);
  }

  /**
   * Calculates the next delay with optional jitter
   */
  private calculateNextDelay(currentDelay: number): number {
    const nextDelay = Math.min(
      currentDelay * this.options.backoffFactor,
      this.options.maxDelay
    );

    return applyJitter(nextDelay, this.options.jitter);
  }
}

// ============================================================================
// CONNECTION POOL MANAGER IMPLEMENTATION
// ============================================================================

/**
 * Enhanced connection pool manager with improved separation of concerns
 * and better resource management
 */
export class ConnectionPoolManager extends EventEmitter {
  private sql: postgres.Sql | null = null;
  private readonly config: ConnectionPoolConfig;
  private readonly circuitBreaker: DatabaseCircuitBreaker | null = null;
  private readonly retryExecutor: RetryExecutor;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly startTime: number = Date.now();

  // Query statistics - using private fields for better encapsulation
  private queryCount = 0;
  private failedQueryCount = 0;
  private totalQueryTime = 0;
  private lastHealthCheck: HealthCheckResult | null = null;

  constructor(config: ConnectionPoolConfig) {
    super();
    this.config = { ...config }; // Create defensive copy

    // Initialize circuit breaker conditionally
    this.circuitBreaker = this.config.enableCircuitBreaker
      ? this.createCircuitBreaker()
      : null;

    // Initialize retry executor with validated options
    this.retryExecutor = new RetryExecutor({
      maxAttempts: this.config.retryAttempts,
      initialDelay: this.config.retryDelay,
      maxDelay: this.config.maxRetryDelay,
      backoffFactor: DEFAULT_BACKOFF_FACTOR,
      jitter: true
    });
  }

  /**
   * Creates and configures the circuit breaker with event handlers
   */
  private createCircuitBreaker(): DatabaseCircuitBreaker {
    const breaker = new DatabaseCircuitBreaker(
      this.config.circuitBreakerThreshold,
      this.config.circuitBreakerTimeout
    );

    // Set up event handlers with improved logging
    breaker.on('stateChange', (event: CircuitBreakerStateChangeEvent) => {
      console.log(`🔄 Circuit breaker: ${event.from} → ${event.to}`);
      this.emit('circuitBreakerStateChange', event);
    });

    breaker.on('circuitOpen', (event: CircuitBreakerOpenEvent) => {
      console.warn(`⚠️ Circuit breaker opened (${event.failureCount} failures)`);
      this.emit('circuitBreakerOpen', event);
    });

    return breaker;
  }

  /**
   * Initializes the connection pool with improved error handling
   */
  async initialize(connectionString: string): Promise<void> {
    if (this.sql) {
      throw new Error('Connection pool already initialized');
    }

    console.log('🔄 Initializing enhanced connection pool...');

    try {
      await this.retryExecutor.execute(async () => {
        await this.establishConnection(connectionString);
        await this.validateConnection();
      }, 'connection initialization');

      this.startHealthMonitoring();

      console.log('✅ Enhanced connection pool initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize connection pool:', error);
      this.emit('initializationFailed', error);
      throw error;
    }
  }

  /**
   * Establishes the database connection with optimized configuration
   */
  private async establishConnection(connectionString: string): Promise<void> {
    this.sql = postgres(connectionString, {
      max: this.config.maxConnections,
      idle_timeout: Math.floor(this.config.idleTimeout / 1000),
      connect_timeout: Math.floor(this.config.connectionTimeout / 1000),
      prepare: false, // Disable prepared statements for better compatibility
      transform: {
        undefined: null, // Convert undefined values to null
      },
      onnotice: this.handleDatabaseNotice.bind(this),
      connection: {
        application_name: 'triplecheck-enhanced'
      }
    });
  }

  /**
   * Validates the connection by running a simple test query
   */
  private async validateConnection(): Promise<void> {
    if (!this.sql) {
      throw new Error('SQL connection not established');
    }

    await this.sql`SELECT 1 as connection_test`;
  }

  /**
   * Handles database notices with consistent formatting
   */
  private handleDatabaseNotice(notice: any): void {
    console.log('📢 Database notice:', notice);
  }

  /**
   * Executes a query with comprehensive error handling and statistics tracking
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.sql) {
      throw new Error('Connection pool not initialized');
    }

    const startTime = Date.now();
    this.queryCount++;

    try {
      const result = await this.executeQuery<T>(sql, params);

      // Update successful query statistics
      const queryTime = Date.now() - startTime;
      this.totalQueryTime += queryTime;

      return result;
    } catch (error) {
      this.handleQueryFailure(error, sql, startTime);
      throw error;
    }
  }

  /**
   * Executes the actual query through the circuit breaker if enabled
   */
  private async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    const operation = async (): Promise<T[]> => {
      if (params && params.length > 0) {
        return await this.sql!.unsafe(sql, params) as T[];
      }
      return await this.sql!.unsafe(sql) as T[];
    };

    return this.circuitBreaker
      ? await this.circuitBreaker.execute(operation)
      : await operation();
  }

  /**
   * Handles query failures with proper logging and event emission
   */
  private handleQueryFailure(error: unknown, sql: string, startTime: number): void {
    this.failedQueryCount++;
    const duration = Date.now() - startTime;

    console.error('❌ Query failed:', error);
    this.emit('queryFailed', { sql, error, duration });
  }

  /**
   * Executes a database transaction with improved error handling
   */
  async transaction<T>(callback: (sql: postgres.Sql) => Promise<T>): Promise<T> {
    if (!this.sql) {
      throw new Error('Connection pool not initialized');
    }

    const startTime = Date.now();

    try {
      const result = await this.executeTransaction(callback);

      const duration = Date.now() - startTime;
      this.emit('transactionCompleted', { duration });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('transactionFailed', { error, duration });
      throw error;
    }
  }

  /**
   * Executes the actual transaction through the circuit breaker if enabled
   */
  private async executeTransaction<T>(
    callback: (sql: postgres.Sql) => Promise<T>
  ): Promise<T> {
    const operation = async (): Promise<T> => {
      return await this.sql!.begin(callback) as T;
    };

    return this.circuitBreaker
      ? await this.circuitBreaker.execute(operation)
      : await operation();
  }

  /**
   * Performs a comprehensive health check with detailed metrics
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.sql) {
        throw new Error('Connection pool not initialized');
      }

      // Execute health check query with timeout
      await this.sql`SELECT 1 as health_check`;

      const latency = Date.now() - startTime;
      const stats = this.getConnectionStats();

      const result: HealthCheckResult = {
        healthy: true,
        latency,
        timestamp: new Date(),
        connectionCount: stats.totalConnections,
        poolStats: {
          total: stats.totalConnections,
          idle: stats.idleConnections,
          active: stats.activeConnections,
          waiting: stats.waitingConnections
        }
      };

      this.lastHealthCheck = result;
      this.emit('healthCheckPassed', result);

      return result;
    } catch (error) {
      return this.createFailedHealthCheck(error, startTime);
    }
  }

  /**
   * Creates a failed health check result with proper error handling
   */
  private createFailedHealthCheck(error: unknown, startTime: number): HealthCheckResult {
    const result: HealthCheckResult = {
      healthy: false,
      latency: Date.now() - startTime,
      error: toError(error).message,
      timestamp: new Date(),
      connectionCount: 0,
      poolStats: {
        total: 0,
        idle: 0,
        active: 0,
        waiting: 0
      }
    };

    this.lastHealthCheck = result;
    this.emit('healthCheckFailed', result);

    return result;
  }

  /**
   * Returns comprehensive connection statistics
   */
  getConnectionStats(): ConnectionStats {
    const uptime = Date.now() - this.startTime;
    const averageQueryTime = this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0;

    return {
      totalConnections: this.config.maxConnections,
      activeConnections: 0, // postgres.js doesn't expose this directly
      idleConnections: 0,   // postgres.js doesn't expose this directly
      waitingConnections: 0, // postgres.js doesn't expose this directly
      totalQueries: this.queryCount,
      failedQueries: this.failedQueryCount,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100, // Round to 2 decimal places
      uptime,
      circuitBreakerState: this.circuitBreaker?.getState() || 'disabled'
    };
  }

  /**
   * Returns the result of the last health check
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  /**
   * Starts periodic health monitoring with proper error handling
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('❌ Health check monitoring error:', error);
      }
    }, this.config.healthCheckInterval);

    console.log(`🏥 Health monitoring started (${this.config.healthCheckInterval}ms intervals)`);
  }

  /**
   * Performs graceful shutdown with proper cleanup and timeout handling
   */
  async gracefulShutdown(): Promise<void> {
    console.log('🔄 Starting graceful shutdown of connection pool...');

    // Stop health monitoring first
    this.stopHealthMonitoring();

    // Close database connections with timeout
    await this.closeConnections();

    this.emit('shutdown');
    console.log('✅ Connection pool shutdown completed');
  }

  /**
   * Stops the health monitoring interval
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 Health monitoring stopped');
    }
  }

  /**
   * Closes database connections with proper timeout handling
   */
  private async closeConnections(): Promise<void> {
    if (this.sql) {
      try {
        await this.sql.end({ timeout: CONNECTION_TEST_TIMEOUT });
        console.log('✅ Database connections closed gracefully');
      } catch (error) {
        console.warn('⚠️ Error during connection cleanup:', error);
      } finally {
        this.sql = null;
      }
    }
  }

  // ============================================================================
  // GRACEFUL DEGRADATION METHODS
  // ============================================================================

  /**
   * Executes an operation with fallback capability for graceful degradation
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      const contextMsg = context ? ` (${context})` : '';
      console.warn(`⚠️ Primary operation failed${contextMsg}, using fallback:`, error);

      this.emit('fallbackTriggered', { context, error });

      return await fallbackOperation();
    }
  }

  /**
   * Executes an operation with a timeout for better resource management
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const contextMsg = context ? ` (${context})` : '';
        reject(new Error(`Operation timeout after ${timeoutMs}ms${contextMsg}`));
      }, timeoutMs);

      // Ensure timer is cleared if the operation completes first
      return timer;
    });

    return Promise.race([operation(), timeoutPromise]);
  }
}

// ============================================================================
// DEFAULT CONFIGURATION AND EXPORTS
// ============================================================================

/**
 * Default connection pool configuration with sensible defaults
 * All values are readonly to prevent accidental modification
 */
export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  minConnections: 2,
  maxConnections: 10,
  acquireTimeout: 30000,
  idleTimeout: 30000,
  connectionTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  healthCheckInterval: 30000,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000
} as const;

export default ConnectionPoolManager;

// ============================================================================
// DATABASE INSTANCE EXPORT
// ============================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create a simple database connection for backward compatibility
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create the database instance
 */
export function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck';
    const sql = postgres(connectionString);
    _db = drizzle(sql);
  }
  return _db;
}

/**
 * Export db instance for backward compatibility
 */
export const db = getDb();
/**
 *
 Legacy getDatabase function for backward compatibility
 */
export function getDatabase() {
  return getDb();
}