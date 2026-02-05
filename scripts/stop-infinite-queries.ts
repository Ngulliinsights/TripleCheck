#!/usr/bin/env tsx

/**
 * Advanced script to detect and prevent infinite API queries
 * Implements multiple detection strategies and adaptive thresholds
 * Optimized for performance, memory efficiency, and maintainability
 */

import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

// Simple logger to handle console statements in production
/* eslint-disable no-console */
const log = process.env.NODE_ENV === 'production' ? () => {} : console.log;
const warn = process.env.NODE_ENV === 'production' ? () => {} : console.warn;
const error = process.env.NODE_ENV === 'production' ? () => {} : console.error;
/* eslint-enable no-console */

// Enhanced type definitions for better type safety
interface QueryMetrics {
  readonly endpoint: string;
  readonly paramHash: string;
  callCount: number;
  readonly firstCallTime: number;
  lastCallTime: number;
  averageInterval: number;
  consecutiveRapidCalls: number;
  blocked: boolean;
}

interface CircuitBreakerState {
  isOpen: boolean;
  readonly openedAt: number;
  failureCount: number;
  readonly lastFailureTime: number;
}

// More descriptive detection strategy types
type DetectionStrategy = 'rapid_fire' | 'burst_pattern' | 'sustained_load';

// Configuration interface for better maintainability
interface DetectionThresholds {
  readonly rapidFire: {
    readonly maxCalls: number;
    readonly timeWindow: number;
    readonly penalty: number;
  };
  readonly burstPattern: {
    readonly maxBursts: number;
    readonly burstSize: number;
    readonly burstWindow: number;
    readonly penalty: number;
  };
  readonly sustainedLoad: {
    readonly maxCallsPerMinute: number;
    readonly evaluationWindow: number;
    readonly penalty: number;
  };
}

// Statistics interface for external consumption
interface QueryStatistics {
  readonly activeQueries: number;
  readonly circuitBreakers: number;
  readonly openCircuitBreakers: number;
  readonly queryMetrics: ReadonlyArray<{
    readonly endpoint: string;
    readonly calls: number;
    readonly avgInterval: number;
    readonly blocked: boolean;
  }>;
}

class AdvancedInfiniteQueryDetector {
  // Using private readonly for immutable references
  private readonly queryMetrics = new Map<string, QueryMetrics>();
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();
  
  // Configurable thresholds moved to readonly property for better encapsulation
  private readonly thresholds: DetectionThresholds = {
    rapidFire: {
      maxCalls: 10,        // Maximum calls in time window
      timeWindow: 5000,    // 5 seconds
      penalty: 30000       // 30 second circuit breaker
    },
    burstPattern: {
      maxBursts: 3,        // Maximum burst sequences
      burstSize: 5,        // Calls that constitute a burst
      burstWindow: 1000,   // 1 second for burst detection
      penalty: 60000       // 1 minute circuit breaker
    },
    sustainedLoad: {
      maxCallsPerMinute: 100,  // Reasonable sustained rate
      evaluationWindow: 60000, // 1 minute evaluation
      penalty: 120000          // 2 minute circuit breaker
    }
  } as const; // Using 'as const' for immutability

  private monitoringActive = true;
  private cleanupInterval?: NodeJS.Timeout | undefined;
  private statsInterval?: NodeJS.Timeout | undefined;

  // Constants for better maintainability
  private static readonly CLEANUP_INTERVAL = 120000; // 2 minutes
  private static readonly STATS_INTERVAL = 30000;    // 30 seconds
  private static readonly HASH_LENGTH = 8;
  private static readonly MEMORY_CLEANUP_MULTIPLIER = 2;

  constructor() {
    log('🔍 Advanced infinite query detection initialized');
    log('📋 Detection strategies: Rapid Fire, Burst Pattern, Sustained Load');
    this.startMonitoring();
  }

  /**
   * Generates a consistent hash for query parameters with improved error handling
   * This prevents memory issues with large parameter objects and handles edge cases
   */
  private generateParamHash(params: unknown): string {
    try {
      // Handle null, undefined, or primitive types more efficiently
      if (params === null || params === undefined) {
        return '00000000'; // Consistent hash for empty params
      }
      
      if (typeof params !== 'object') {
        // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
        //       only for lightweight, collision-resistant cache keys.
        return createHash('sha256')
          .update(String(params))
          .digest('hex')
          .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
      }
      
      // More robust object handling with circular reference protection
      const sortedParams = this.createSortedParamsObject(params as Record<string, unknown>);
      
      // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
      //       only for lightweight, collision-resistant cache keys.
      return createHash('sha256')
        .update(JSON.stringify(sortedParams))
        .digest('hex')
        .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
    } catch (error) {
      // Fallback hash generation for problematic objects
      console.warn('Parameter hashing failed, using fallback:', error);
      // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
      //       only for lightweight, collision-resistant cache keys.
      return createHash('sha256')
        .update(String(params))
        .digest('hex')
        .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
    }
  }

  /**
   * Creates a sorted parameters object while handling circular references
   * This helper method improves code organization and error handling
   */
  private createSortedParamsObject(params: Record<string, unknown>): Record<string, unknown> {
    const seen = new WeakSet(); // Track circular references
    
    const sortObject = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (seen.has(obj as object)) {
        return '[Circular Reference]';
      }
      
      seen.add(obj as object);
      
      if (Array.isArray(obj)) {
        return obj.map(sortObject);
      }
      
      const sortedObj: Record<string, unknown> = {};
      Object.keys(obj as Record<string, unknown>)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .forEach(key => {
          /* eslint-disable security/detect-object-injection -- safe, keys are sorted literals */
          sortedObj[key] = sortObject((obj as Record<string, unknown>)[key]);
          /* eslint-enable security/detect-object-injection */
        });
      
      return sortedObj;
    };
    
    return sortObject(params) as Record<string, unknown>;
  }

  /**
   * Creates a unique identifier for tracking queries with improved validation
   */
  private generateQueryKey(endpoint: string, params: unknown): string {
    // Input validation for better error handling
    if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
      throw new Error('Endpoint must be a non-empty string');
    }
    
    const cleanEndpoint = endpoint.trim();
    const paramHash = this.generateParamHash(params);
    return `${cleanEndpoint}:${paramHash}`;
  }

  /**
   * Detects rapid-fire queries with improved readability and performance
   */
  private detectRapidFire(metrics: QueryMetrics): DetectionStrategy | null {
    const timeSpan = metrics.lastCallTime - metrics.firstCallTime;
    const { maxCalls, timeWindow } = this.thresholds.rapidFire;
    
    // Early return for better performance
    if (metrics.callCount < maxCalls) {
      return null;
    }
    
    return timeSpan <= timeWindow ? 'rapid_fire' : null;
  }

  /**
   * Detects burst patterns with enhanced logic and better performance
   */
  private detectBurstPattern(metrics: QueryMetrics): DetectionStrategy | null {
    const { burstSize, burstWindow, maxBursts } = this.thresholds.burstPattern;
    
    // Early return if we don't have enough calls for a burst
    if (metrics.callCount < burstSize) {
      return null;
    }
    
    const now = performance.now();
    const recentTimeSpan = now - metrics.firstCallTime;
    
    if (recentTimeSpan <= burstWindow) {
      // We're in a rapid calling period - increment burst counter
      metrics.consecutiveRapidCalls++;
      
      if (metrics.consecutiveRapidCalls >= maxBursts) {
        return 'burst_pattern';
      }
    } else {
      // Reset burst counter if we're outside the burst window
      metrics.consecutiveRapidCalls = 0;
    }
    
    return null;
  }

  /**
   * Detects sustained high load with improved calculations
   */
  private detectSustainedLoad(metrics: QueryMetrics): DetectionStrategy | null {
    const { maxCallsPerMinute, evaluationWindow } = this.thresholds.sustainedLoad;
    const timeSpan = metrics.lastCallTime - metrics.firstCallTime;
    
    // Need sufficient time span for meaningful evaluation
    if (timeSpan < evaluationWindow) {
      return null;
    }
    
    // Calculate calls per minute more accurately
    const callsPerMinute = (metrics.callCount / timeSpan) * 60000;
    
    return callsPerMinute > maxCallsPerMinute ? 'sustained_load' : null;
  }

  /**
   * Creates appropriate error messages for different detection strategies
   * This helper improves code organization and makes messages more consistent
   */
  private createDetectionMessage(strategy: DetectionStrategy, metrics: QueryMetrics): string {
    switch (strategy) {
      case 'rapid_fire': {
        const timeSpan = (metrics.lastCallTime - metrics.firstCallTime).toFixed(0);
        return `🔥 Rapid-fire detected: ${metrics.callCount} calls in ${timeSpan}ms`;
      }
      
      case 'burst_pattern': {
        return `💥 Burst pattern detected: ${metrics.consecutiveRapidCalls} consecutive bursts`;
      }
      
      case 'sustained_load': {
        const rate = ((metrics.callCount / (metrics.lastCallTime - metrics.firstCallTime)) * 60000).toFixed(1);
        return `⚡ Sustained overload: ${rate} calls/minute`;
      }
      
      default: {
        // TypeScript exhaustiveness check - this should never happen
        const _exhaustiveCheck: never = strategy;
        return `Unknown detection strategy: ${_exhaustiveCheck}`;
      }
    }
  }

  /**
   * Applies the appropriate circuit breaker with improved error handling and logging
   */
  private activateCircuitBreaker(queryKey: string, strategy: DetectionStrategy, metrics: QueryMetrics): void {
    const now = performance.now();
    
    // Get penalty duration based on strategy
    const penaltyMap: Record<DetectionStrategy, number> = {
      rapid_fire: this.thresholds.rapidFire.penalty,
      burst_pattern: this.thresholds.burstPattern.penalty,
      sustained_load: this.thresholds.sustainedLoad.penalty
    };
    
    const penalty = penaltyMap[strategy];
    const message = this.createDetectionMessage(strategy, metrics);

    // Create or update circuit breaker state
    const existingState = this.circuitBreakers.get(queryKey);
    const circuitState: CircuitBreakerState = {
      isOpen: true,
      openedAt: now,
      failureCount: (existingState?.failureCount ?? 0) + 1,
      lastFailureTime: now
    };

    this.circuitBreakers.set(queryKey, circuitState);
    
    // Enhanced logging with more context
    console.warn(`🚨 Circuit breaker activated for: ${metrics.endpoint}`);
    console.warn(`   Strategy: ${strategy.replace('_', ' ').toUpperCase()}`);
    console.warn(`   ${message}`);
    console.warn(`   Penalty duration: ${(penalty / 1000).toFixed(0)} seconds`);
    console.warn(`   Failure count: ${circuitState.failureCount}`);

    // Auto-reset after penalty period with improved cleanup
    const timeoutId = setTimeout(() => {
      const current = this.circuitBreakers.get(queryKey);
      if (current?.isOpen && current.openedAt === circuitState.openedAt) {
        current.isOpen = false;
        console.log(`✅ Circuit breaker reset for: ${metrics.endpoint}`);
      }
    }, penalty);

    // Ensure timeout is cleaned up to prevent memory leaks
    timeoutId.unref();
  }

  /**
   * Main method to track and evaluate queries with enhanced error handling
   */
  public trackQuery(endpoint: string, params: unknown = {}): boolean {
    try {
      if (!this.monitoringActive) {
        return true;
      }

      const queryKey = this.generateQueryKey(endpoint, params);
      const now = performance.now();

      // Check circuit breaker status first
      const circuitState = this.circuitBreakers.get(queryKey);
      if (circuitState?.isOpen) {
        console.warn(`⛔ Query blocked by circuit breaker: ${endpoint}`);
        return false;
      }

      // Get or initialize metrics with better initialization
      let metrics = this.queryMetrics.get(queryKey);
      if (!metrics) {
        metrics = this.createInitialMetrics(endpoint, params, now);
        this.queryMetrics.set(queryKey, metrics);
      }

      // Update metrics with improved calculations
      this.updateMetrics(metrics, now);

      // Apply detection strategies with early termination
      const detectionStrategies = [
        this.detectRapidFire.bind(this),
        this.detectBurstPattern.bind(this),
        this.detectSustainedLoad.bind(this)
      ] as const;

      for (const detectStrategy of detectionStrategies) {
        const detectedStrategy = detectStrategy(metrics);
        if (detectedStrategy) {
          this.activateCircuitBreaker(queryKey, detectedStrategy, metrics);
          metrics.blocked = true;
          return false;
        }
      }

      return true;
    } catch (error) {
      // Graceful error handling - log error but don't block legitimate requests
      console.error('Error in query tracking:', error);
      return true; // Fail open for better availability
    }
  }

  /**
   * Helper method to create initial metrics with better organization
   */
  private createInitialMetrics(endpoint: string, params: unknown, now: number): QueryMetrics {
    return {
      endpoint,
      paramHash: this.generateParamHash(params),
      callCount: 0,
      firstCallTime: now,
      lastCallTime: now,
      averageInterval: 0,
      consecutiveRapidCalls: 0,
      blocked: false
    };
  }

  /**
   * Helper method to update metrics with improved calculations
   */
  private updateMetrics(metrics: QueryMetrics, now: number): void {
    metrics.callCount++;
    metrics.lastCallTime = now;
    
    // Calculate average interval more efficiently
    if (metrics.callCount > 1) {
      const totalTime = now - metrics.firstCallTime;
      metrics.averageInterval = totalTime / (metrics.callCount - 1);
    }
  }

  /**
   * Starts background monitoring with improved error handling
   */
  private startMonitoring(): void {
    try {
      // Clean up stale metrics periodically
      this.cleanupInterval = setInterval(() => {
        try {
          this.cleanupStaleMetrics();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }, AdvancedInfiniteQueryDetector.CLEANUP_INTERVAL);

      // Log statistics periodically
      this.statsInterval = setInterval(() => {
        try {
          this.logStatistics();
        } catch (error) {
          console.error('Error during statistics logging:', error);
        }
      }, AdvancedInfiniteQueryDetector.STATS_INTERVAL);

      // Prevent intervals from keeping process alive unnecessarily
      this.cleanupInterval.unref();
      this.statsInterval.unref();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  }

  /**
   * Removes old metrics with improved memory management
   */
  private cleanupStaleMetrics(): void {
    const now = performance.now();
    const maxAge = this.thresholds.sustainedLoad.evaluationWindow * 
                   AdvancedInfiniteQueryDetector.MEMORY_CLEANUP_MULTIPLIER;
    
    let cleanedQueryMetrics = 0;
    let cleanedCircuitBreakers = 0;

    // Clean up stale query metrics
    for (const [key, metrics] of this.queryMetrics.entries()) {
      if (now - metrics.lastCallTime > maxAge) {
        this.queryMetrics.delete(key);
        cleanedQueryMetrics++;
      }
    }

    // Clean up closed circuit breakers that are old
    for (const [key, state] of this.circuitBreakers.entries()) {
      if (!state.isOpen && now - state.openedAt > maxAge) {
        this.circuitBreakers.delete(key);
        cleanedCircuitBreakers++;
      }
    }

    const totalCleaned = cleanedQueryMetrics + cleanedCircuitBreakers;
    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned up ${cleanedQueryMetrics} query metrics and ${cleanedCircuitBreakers} circuit breakers`);
    }
  }

  /**
   * Provides detailed monitoring statistics with improved formatting
   */
  private logStatistics(): void {
    const activeQueries = this.queryMetrics.size;
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(state => state.isOpen).length;
    const totalCircuitBreakers = this.circuitBreakers.size;

    // Only log if there's something interesting to report
    if (activeQueries === 0 && openCircuitBreakers === 0) {
      return;
    }

    console.log(`📊 Query Monitor Statistics:`);
    console.log(`   Active tracked queries: ${activeQueries}`);
    console.log(`   Open circuit breakers: ${openCircuitBreakers}/${totalCircuitBreakers}`);

    // Show most active endpoints with better formatting
    this.logTopQueries();
    this.logBlockedQueries();
  }

  /**
   * Helper method to log top queries with improved organization
   */
  private logTopQueries(): void {
    const topQueries = Array.from(this.queryMetrics.entries())
      .sort(([, a], [, b]) => b.callCount - a.callCount)
      .slice(0, 3);

    if (topQueries.length > 0) {
      console.log(`   Most active endpoints:`);
      topQueries.forEach(([, metrics]) => {
        const rate = metrics.averageInterval > 0 
          ? (60000 / metrics.averageInterval).toFixed(1) 
          : 'N/A';
        console.log(`     ${metrics.endpoint}: ${metrics.callCount} calls (${rate}/min avg)`);
      });
    }
  }

  /**
   * Helper method to log blocked queries
   */
  private logBlockedQueries(): void {
    const blockedQueries = Array.from(this.queryMetrics.values())
      .filter(metrics => metrics.blocked);
    
    if (blockedQueries.length > 0) {
      console.log(`   Recently blocked: ${blockedQueries.length} query types`);
    }
  }

  /**
   * Public API methods for external control with improved type safety
   */
  public getStatistics(): QueryStatistics {
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(state => state.isOpen).length;

    return {
      activeQueries: this.queryMetrics.size,
      circuitBreakers: this.circuitBreakers.size,
      openCircuitBreakers,
      queryMetrics: Array.from(this.queryMetrics.entries()).map(([, metrics]) => ({
        endpoint: metrics.endpoint,
        calls: metrics.callCount,
        avgInterval: metrics.averageInterval,
        blocked: metrics.blocked
      }))
    };
  }

  public resetCircuitBreaker(endpoint: string, params: unknown = {}): boolean {
    try {
      const queryKey = this.generateQueryKey(endpoint, params);
      const state = this.circuitBreakers.get(queryKey);
      
      if (state?.isOpen) {
        state.isOpen = false;
        console.log(`🔄 Manually reset circuit breaker for: ${endpoint}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      return false;
    }
  }

  public resetAllCircuitBreakers(): number {
    let resetCount = 0;
    
    for (const state of this.circuitBreakers.values()) {
      if (state.isOpen) {
        state.isOpen = false;
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      console.log(`🔄 Reset ${resetCount} circuit breakers`);
    }
    
    return resetCount;
  }

  public stop(): void {
    this.monitoringActive = false;
    
    // Clean up intervals with null checks
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = undefined;
    }
    
    console.log('🛑 Query monitoring stopped');
  }

  /**
   * New method for graceful shutdown with resource cleanup
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Initiating graceful shutdown...');
    
    this.stop();
    
    // Clear all data structures
    this.queryMetrics.clear();
    this.circuitBreakers.clear();
    
    console.log('✅ Shutdown complete');
  }
}

// Create and export global instance
const queryDetector = new AdvancedInfiniteQueryDetector();

export { queryDetector, AdvancedInfiniteQueryDetector };
export type { QueryStatistics, DetectionStrategy };

// CLI interface and testing with improved error handling
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🛡️  Advanced Infinite Query Detector started');
  console.log('   Multi-strategy detection: Rapid Fire | Burst Pattern | Sustained Load');
  console.log('   Press Ctrl+C to stop\n');

  // Enhanced graceful shutdown with proper cleanup
  const shutdown = async (): Promise<void> => {
    console.log('\n👋 Shutting down detector...');
    await queryDetector.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Enhanced testing suite with better error handling
  const runTests = async (): Promise<void> => {
    try {
      console.log('🧪 Running comprehensive test suite...\n');

      await runNormalUsageTest();
      await runRapidFireTest();
      await runBurstPatternTest();
      
      // Show final statistics after a brief delay
      setTimeout(() => {
        console.log('\n📊 Final Statistics:');
        const stats = queryDetector.getStatistics();
        console.log(JSON.stringify(stats, null, 2));
      }, 2000);
    } catch (error) {
      console.error('Test suite failed:', error);
    }
  };

  const runNormalUsageTest = async (): Promise<void> => {
    console.log('📋 Test 1: Normal API usage');
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const allowed = queryDetector.trackQuery('/api/properties', { page: i });
      console.log(`  Normal query ${i + 1}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const runRapidFireTest = async (): Promise<void> => {
    console.log('\n📋 Test 2: Rapid-fire detection');
    for (let i = 0; i < 12; i++) {
      const allowed = queryDetector.trackQuery('/api/search', { 
        term: 'apartments', 
        location: 'Nairobi' 
      });
      console.log(`  Rapid query ${i + 1}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
      if (i < 8) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  };

  const runBurstPatternTest = async (): Promise<void> => {
    console.log('\n📋 Test 3: Burst pattern detection');
    for (let burst = 0; burst < 4; burst++) {
      console.log(`  Burst ${burst + 1}:`);
      for (let i = 0; i < 6; i++) {
        const allowed = queryDetector.trackQuery('/api/similar', { propertyId: 123 });
        console.log(`    Call ${i + 1}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Start tests after initialization
  setTimeout(runTests, 1000);
}