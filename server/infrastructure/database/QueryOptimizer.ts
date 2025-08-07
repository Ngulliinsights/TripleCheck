import { sql, SQL } from 'drizzle-orm';
import { db } from './connection';
import { logger } from '../monitoring/logger';

/**
 * Database query optimization utilities
 */
export class QueryOptimizer {
  private queryCache = new Map<string, { query: SQL; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes
  private performanceMetrics = new Map<string, {
    totalExecutions: number;
    totalTime: number;
    averageTime: number;
    slowestTime: number;
    fastestTime: number;
  }>();

  /**
   * Execute query with performance monitoring
   */
  async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    options: {
      timeout?: number;
      retries?: number;
      cacheKey?: string;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const { timeout = 30000, retries = 3, cacheKey } = options;

    try {
      // Check cache first if cache key provided
      if (cacheKey) {
        const cached = this.getCachedResult<T>(cacheKey);
        if (cached) {
          logger.info(`Query ${queryName} served from cache`);
          return cached;
        }
      }

      // Execute query with timeout
      const result = await this.executeWithTimeout(queryFn, timeout);
      const executionTime = Date.now() - startTime;

      // Update performance metrics
      this.updatePerformanceMetrics(queryName, executionTime);

      // Cache result if cache key provided
      if (cacheKey) {
        this.cacheResult(cacheKey, result);
      }

      // Log slow queries
      if (executionTime > 1000) {
        logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Query ${queryName} failed after ${executionTime}ms:`, error);

      // Retry logic
      if (retries > 0 && this.isRetryableError(error)) {
        logger.info(`Retrying query ${queryName}, ${retries} attempts remaining`);
        return this.executeWithMonitoring(
          queryName,
          queryFn,
          { ...options, retries: retries - 1 }
        );
      }

      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [queryName, metrics] of this.performanceMetrics.entries()) {
      stats[queryName] = {
        ...metrics,
        efficiency: this.calculateQueryEfficiency(metrics),
        recommendation: this.getPerformanceRecommendation(metrics),
      };
    }

    return stats;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
    logger.info('Query performance metrics cleared');
  }

  /**
   * Execute query with timeout
   */
  private async executeWithTimeout<T>(
    queryFn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      queryFn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Update performance metrics for a query
   */
  private updatePerformanceMetrics(queryName: string, executionTime: number): void {
    const existing = this.performanceMetrics.get(queryName);
    
    if (existing) {
      existing.totalExecutions++;
      existing.totalTime += executionTime;
      existing.averageTime = existing.totalTime / existing.totalExecutions;
      existing.slowestTime = Math.max(existing.slowestTime, executionTime);
      existing.fastestTime = Math.min(existing.fastestTime, executionTime);
    } else {
      this.performanceMetrics.set(queryName, {
        totalExecutions: 1,
        totalTime: executionTime,
        averageTime: executionTime,
        slowestTime: executionTime,
        fastestTime: executionTime,
      });
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'connection terminated',
      'server closed the connection',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  /**
   * Cache query result
   */
  private cacheResult<T>(key: string, result: T): void {
    this.queryCache.set(key, {
      query: result as any,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached query result
   */
  private getCachedResult<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.query as T;
    }

    if (cached) {
      this.queryCache.delete(key);
    }

    return null;
  }

  /**
   * Calculate query efficiency score
   */
  private calculateQueryEfficiency(metrics: any): number {
    // Simple efficiency calculation based on execution time and frequency
    const frequencyScore = Math.min(metrics.totalExecutions / 1000, 1);
    const speedScore = Math.max(0, 1 - (metrics.averageTime / 5000));
    const consistencyScore = 1 - ((metrics.slowestTime - metrics.fastestTime) / metrics.slowestTime);
    
    return (frequencyScore + speedScore + consistencyScore) / 3;
  }

  /**
   * Get performance recommendation
   */
  private getPerformanceRecommendation(metrics: any): string {
    if (metrics.averageTime > 2000) {
      return 'Critical: Query is very slow, immediate optimization required';
    } else if (metrics.averageTime > 1000) {
      return 'Warning: Query is slow, optimization recommended';
    } else if (metrics.totalExecutions > 10000 && metrics.averageTime > 100) {
      return 'Info: High-frequency query, consider caching';
    } else {
      return 'Good: Query performance is acceptable';
    }
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();