/**
 * Database Circuit Breaker Implementation
 * 
 * Implements circuit breaker pattern for database operations with
 * configurable failure thresholds, automatic recovery, and graceful degradation.
 * 
 * Task 2.2: Integrate circuit breaker patterns for reliability
 */

import { EventEmitter } from 'events';

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerConfig {
  // Failure thresholds
  failureThreshold: number;
  successThreshold: number;
  
  // Timing configuration
  timeoutMs: number;
  resetTimeoutMs: number;
  
  // Monitoring
  monitoringWindowMs: number;
  minimumThroughput: number;
  
  // Error classification
  errorFilter?: (error: Error) => boolean;
  
  // Fallback configuration
  enableFallback: boolean;
  fallbackTimeoutMs: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  failureRate: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangedAt: Date;
  timeInCurrentState: number;
  nextRetryAt?: Date;
}

export interface CircuitBreakerStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  timeouts: number;
  circuitOpenCount: number;
  circuitHalfOpenCount: number;
  averageExecutionTime: number;
  lastExecutionTime?: Date;
}

export class DatabaseCircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangedAt = new Date();
  private nextRetryAt?: Date;
  private executionTimes: number[] = [];
  private stats: CircuitBreakerStats;
  private readonly config: Required<CircuitBreakerConfig>;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();
    
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 3,
      timeoutMs: config.timeoutMs || 30000,
      resetTimeoutMs: config.resetTimeoutMs || 60000,
      monitoringWindowMs: config.monitoringWindowMs || 300000, // 5 minutes
      minimumThroughput: config.minimumThroughput || 10,
      errorFilter: config.errorFilter || this.defaultErrorFilter,
      enableFallback: config.enableFallback !== false,
      fallbackTimeoutMs: config.fallbackTimeoutMs || 5000
    };

    this.initializeStats();
    this.startMonitoring();
  }

  private initializeStats(): void {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      timeouts: 0,
      circuitOpenCount: 0,
      circuitHalfOpenCount: 0,
      averageExecutionTime: 0
    };
  }

  private defaultErrorFilter(error: Error): boolean {
    // Consider connection errors, timeouts, and database errors as circuit breaker triggers
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound') ||
      errorMessage.includes('database') ||
      errorMessage.includes('server')
    );
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.cleanupOldMetrics();
      this.evaluateCircuitState();
      this.emit('metrics', this.getMetrics());
    }, 10000); // Check every 10 seconds
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.monitoringWindowMs;
    
    // Reset counters if outside monitoring window
    if (this.lastFailureTime && this.lastFailureTime.getTime() < cutoffTime) {
      this.failureCount = 0;
    }
    
    if (this.lastSuccessTime && this.lastSuccessTime.getTime() < cutoffTime) {
      this.successCount = 0;
    }
  }

  private evaluateCircuitState(): void {
    const now = new Date();
    
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        if (this.shouldOpenCircuit()) {
          this.openCircuit();
        }
        break;
        
      case CircuitBreakerState.OPEN:
        if (this.shouldAttemptReset()) {
          this.halfOpenCircuit();
        }
        break;
        
      case CircuitBreakerState.HALF_OPEN:
        if (this.shouldCloseCircuit()) {
          this.closeCircuit();
        } else if (this.shouldReopenCircuit()) {
          this.openCircuit();
        }
        break;
    }
  }

  private shouldOpenCircuit(): boolean {
    if (this.totalRequests < this.config.minimumThroughput) {
      return false;
    }
    
    const failureRate = this.failureCount / this.totalRequests;
    return this.failureCount >= this.config.failureThreshold && failureRate > 0.5;
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextRetryAt) {
      return false;
    }
    
    return Date.now() >= this.nextRetryAt.getTime();
  }

  private shouldCloseCircuit(): boolean {
    return this.successCount >= this.config.successThreshold;
  }

  private shouldReopenCircuit(): boolean {
    return this.failureCount > 0;
  }

  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN;
    this.stateChangedAt = new Date();
    this.nextRetryAt = new Date(Date.now() + this.config.resetTimeoutMs);
    this.stats.circuitOpenCount++;
    
    this.emit('circuitOpened', {
      failureCount: this.failureCount,
      totalRequests: this.totalRequests,
      nextRetryAt: this.nextRetryAt
    });
  }

  private halfOpenCircuit(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.stateChangedAt = new Date();
    this.successCount = 0;
    this.failureCount = 0;
    this.stats.circuitHalfOpenCount++;
    
    this.emit('circuitHalfOpened');
  }

  private closeCircuit(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.stateChangedAt = new Date();
    this.failureCount = 0;
    this.successCount = 0;
    this.nextRetryAt = undefined;
    
    this.emit('circuitClosed');
  }

  public async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.config.enableFallback && fallback) {
        return this.executeFallback(fallback);
      }
      throw new Error(`Circuit breaker is OPEN. Next retry at: ${this.nextRetryAt?.toISOString()}`);
    }

    const startTime = Date.now();
    this.totalRequests++;
    this.stats.totalExecutions++;

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(error as Error, Date.now() - startTime);
      
      if (this.config.enableFallback && fallback) {
        try {
          return await this.executeFallback(fallback);
        } catch (fallbackError) {
          throw error; // Throw original error if fallback fails
        }
      }
      
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error(`Operation timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async executeFallback<T>(fallback: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Fallback timed out after ${this.config.fallbackTimeoutMs}ms`));
      }, this.config.fallbackTimeoutMs);

      fallback()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(executionTime: number): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.stats.successfulExecutions++;
    this.stats.lastExecutionTime = new Date();
    this.recordExecutionTime(executionTime);
    
    this.emit('success', { executionTime, state: this.state });
  }

  private onFailure(error: Error, executionTime: number): void {
    if (this.config.errorFilter(error)) {
      this.failureCount++;
      this.lastFailureTime = new Date();
    }
    
    this.stats.failedExecutions++;
    this.stats.lastExecutionTime = new Date();
    this.recordExecutionTime(executionTime);
    
    this.emit('failure', { 
      error, 
      executionTime, 
      state: this.state,
      failureCount: this.failureCount 
    });
  }

  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);
    
    // Keep only last 1000 execution times
    if (this.executionTimes.length > 1000) {
      this.executionTimes.shift();
    }
    
    // Update average execution time
    this.stats.averageExecutionTime = 
      this.executionTimes.reduce((sum, t) => sum + t, 0) / this.executionTimes.length;
  }

  public getMetrics(): CircuitBreakerMetrics {
    const now = Date.now();
    const totalRequests = Math.max(this.totalRequests, 1); // Avoid division by zero
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failureRate: this.failureCount / totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt,
      timeInCurrentState: now - this.stateChangedAt.getTime(),
      nextRetryAt: this.nextRetryAt
    };
  }

  public getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public isCallAllowed(): boolean {
    return this.state !== CircuitBreakerState.OPEN;
  }

  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.stateChangedAt = new Date();
    this.nextRetryAt = undefined;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    
    this.emit('reset');
  }

  public forceOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.stateChangedAt = new Date();
    this.nextRetryAt = new Date(Date.now() + this.config.resetTimeoutMs);
    
    this.emit('forceOpened');
  }

  public forceClose(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.stateChangedAt = new Date();
    this.failureCount = 0;
    this.successCount = 0;
    this.nextRetryAt = undefined;
    
    this.emit('forceClosed');
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.removeAllListeners();
  }
}

// Circuit breaker registry for managing multiple instances
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers = new Map<string, DatabaseCircuitBreaker>();

  public static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  public getOrCreate(
    name: string, 
    config?: Partial<CircuitBreakerConfig>
  ): DatabaseCircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new DatabaseCircuitBreaker(config));
    }
    return this.breakers.get(name)!;
  }

  public get(name: string): DatabaseCircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  public remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.destroy();
      return this.breakers.delete(name);
    }
    return false;
  }

  public getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  public resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  public destroyAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.destroy();
    }
    this.breakers.clear();
  }
}

// Convenience functions
export function createCircuitBreaker(
  name: string, 
  config?: Partial<CircuitBreakerConfig>
): DatabaseCircuitBreaker {
  return CircuitBreakerRegistry.getInstance().getOrCreate(name, config);
}

export function getCircuitBreaker(name: string): DatabaseCircuitBreaker | undefined {
  return CircuitBreakerRegistry.getInstance().get(name);
}

export function getAllCircuitBreakerMetrics(): Record<string, CircuitBreakerMetrics> {
  return CircuitBreakerRegistry.getInstance().getAllMetrics();
}