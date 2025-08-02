/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests are rejected
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  recoveryTimeout: number;     // Time to wait before trying to close circuit (ms)
  requestTimeout: number;      // Timeout for individual requests (ms)
  monitoringPeriod: number;    // Period for monitoring failures (ms)
  minimumRequests: number;     // Minimum requests before circuit can open
  successThreshold: number;    // Successful requests needed to close circuit in HALF_OPEN
  volumeThreshold: number;     // Minimum volume of requests in monitoring period
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttempt?: Date;
  uptime: number;
  errorRate: number;
}

/**
 * Request result for circuit breaker
 */
interface RequestResult {
  success: boolean;
  timestamp: Date;
  duration: number;
  error?: Error;
}

/**
 * Circuit Breaker implementation with configurable thresholds
 * Prevents cascading failures by temporarily blocking requests to failing services
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private requestHistory: RequestResult[] = [];
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5,        // 5 failures
      recoveryTimeout: 60000,     // 1 minute
      requestTimeout: 30000,      // 30 seconds
      monitoringPeriod: 300000,   // 5 minutes
      minimumRequests: 10,        // 10 requests minimum
      successThreshold: 3,        // 3 successes to close
      volumeThreshold: 20,        // 20 requests minimum volume
      ...config
    };

    // Clean up old request history periodically
    setInterval(() => this.cleanupHistory(), 60000); // Every minute
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log(`Circuit breaker ${this.name} moved to HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt at ${this.nextAttempt}`);
      }
    }

    const startTime = Date.now();
    this.requests++;

    try {
      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise<T>(this.config.requestTimeout)
      ]);

      // Record success
      this.onSuccess(Date.now() - startTime);
      return result;

    } catch (error) {
      // Record failure
      this.onFailure(Date.now() - startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const now = Date.now();
    const recentRequests = this.getRecentRequests();
    const totalRequests = recentRequests.length;
    const failedRequests = recentRequests.filter(r => !r.success).length;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
      uptime: this.calculateUptime(),
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = undefined;
    this.requestHistory = [];
    console.log(`Circuit breaker ${this.name} manually reset to CLOSED state`);
  }

  /**
   * Force circuit breaker to open
   */
  forceOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
    console.log(`Circuit breaker ${this.name} forced to OPEN state`);
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    return stats.state === CircuitBreakerState.CLOSED && stats.errorRate < 50;
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`Circuit breaker ${this.name} configuration updated`);
  }

  // Private methods

  private onSuccess(duration: number): void {
    this.successes++;
    this.lastSuccessTime = new Date();
    
    // Record request result
    this.requestHistory.push({
      success: true,
      timestamp: new Date(),
      duration
    });

    // Handle state transitions
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failures = 0;
        this.nextAttempt = undefined;
        console.log(`Circuit breaker ${this.name} closed after successful recovery`);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure(duration: number, error: Error): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    // Record request result
    this.requestHistory.push({
      success: false,
      timestamp: new Date(),
      duration,
      error
    });

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Go back to open state if we fail in half-open
      this.openCircuit();
    }
  }

  private shouldOpenCircuit(): boolean {
    if (this.state === CircuitBreakerState.OPEN) {
      return false;
    }

    const recentRequests = this.getRecentRequests();
    const totalRequests = recentRequests.length;
    const failedRequests = recentRequests.filter(r => !r.success).length;

    // Check minimum volume threshold
    if (totalRequests < this.config.volumeThreshold) {
      return false;
    }

    // Check minimum requests threshold
    if (this.requests < this.config.minimumRequests) {
      return false;
    }

    // Check failure threshold
    if (this.failures >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate
    const errorRate = (failedRequests / totalRequests) * 100;
    return errorRate > 50 && totalRequests >= this.config.minimumRequests;
  }

  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
    this.successes = 0; // Reset success count
    
    console.log(`Circuit breaker ${this.name} opened due to failures. Next attempt at ${this.nextAttempt}`);
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  private getRecentRequests(): RequestResult[] {
    const cutoff = new Date(Date.now() - this.config.monitoringPeriod);
    return this.requestHistory.filter(r => r.timestamp >= cutoff);
  }

  private calculateUptime(): number {
    const recentRequests = this.getRecentRequests();
    if (recentRequests.length === 0) return 100;

    const successfulRequests = recentRequests.filter(r => r.success).length;
    return (successfulRequests / recentRequests.length) * 100;
  }

  private cleanupHistory(): void {
    const cutoff = new Date(Date.now() - this.config.monitoringPeriod * 2); // Keep 2x monitoring period
    this.requestHistory = this.requestHistory.filter(r => r.timestamp >= cutoff);
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout);
    });
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create circuit breaker
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAllCircuitBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Get health status of all circuit breakers
   */
  getHealthStatus(): Record<string, CircuitBreakerStats> {
    const status: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      status[name] = breaker.getStats();
    }
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Remove circuit breaker
   */
  removeCircuitBreaker(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    healthy: boolean;
    totalBreakers: number;
    healthyBreakers: number;
    openBreakers: number;
    halfOpenBreakers: number;
  } {
    const breakers = Array.from(this.circuitBreakers.values());
    const totalBreakers = breakers.length;
    const healthyBreakers = breakers.filter(b => b.isHealthy()).length;
    const openBreakers = breakers.filter(b => b.getStats().state === CircuitBreakerState.OPEN).length;
    const halfOpenBreakers = breakers.filter(b => b.getStats().state === CircuitBreakerState.HALF_OPEN).length;

    return {
      healthy: openBreakers === 0,
      totalBreakers,
      healthyBreakers,
      openBreakers,
      halfOpenBreakers
    };
  }
}

/**
 * Default circuit breaker manager instance
 */
export const circuitBreakerManager = CircuitBreakerManager.getInstance();