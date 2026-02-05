import { logger } from './logger';

interface QueryMetrics {
  query: string;
  params?: unknown[];
  executionTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  rowCount?: number;
}

export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: QueryMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 queries
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  // Track query execution
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    params?: unknown[]
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let result: T;
    let rowCount: number | undefined;

    try {
      result = await queryFn();
      
      // Try to determine row count
      if (Array.isArray(result)) {
        rowCount = result.length;
      } else if (result && typeof result === 'object' && 'length' in result) {
        rowCount = (result as any).length;
      }

      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const executionTime = Date.now() - startTime;
      
      const metric: QueryMetrics = {
        query: queryName,
        params,
        executionTime,
        timestamp: new Date(),
        success,
        error,
        rowCount,
      };

      this.addMetric(metric);

      // Log slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        logger.warn('Slow query detected', 'QUERY_MONITOR', {
          query: queryName,
          executionTime,
          params: params ? JSON.stringify(params).substring(0, 200) : undefined,
          rowCount,
        });
      }

      // Log failed queries
      if (!success) {
        logger.error('Query failed', 'QUERY_MONITOR', {
          query: queryName,
          executionTime,
          error,
          params: params ? JSON.stringify(params).substring(0, 200) : undefined,
        });
      }
    }
  }

  private addMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Get performance statistics
  getStats(timeWindowMinutes = 60): {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    topSlowQueries: Array<{
      query: string;
      executionTime: number;
      timestamp: Date;
    }>;
    errorRate: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    const totalQueries = recentMetrics.length;
    const successfulQueries = recentMetrics.filter(m => m.success).length;
    const failedQueries = totalQueries - successfulQueries;
    
    const totalExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;
    
    const slowQueries = recentMetrics.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
    
    const topSlowQueries = recentMetrics
      .filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)
      .map(m => ({
        query: m.query,
        executionTime: m.executionTime,
        timestamp: m.timestamp,
      }));

    const errorRate = totalQueries > 0 ? (failedQueries / totalQueries) * 100 : 0;

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageExecutionTime,
      slowQueries,
      topSlowQueries,
      errorRate,
    };
  }

  // Get metrics for a specific query pattern
  getQueryStats(queryPattern: string, timeWindowMinutes = 60): {
    count: number;
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    successRate: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const matchingMetrics = this.metrics.filter(
      m => m.timestamp > cutoffTime && m.query.includes(queryPattern)
    );

    if (matchingMetrics.length === 0) {
      return {
        count: 0,
        averageExecutionTime: 0,
        minExecutionTime: 0,
        maxExecutionTime: 0,
        successRate: 0,
      };
    }

    const executionTimes = matchingMetrics.map(m => m.executionTime);
    const successfulCount = matchingMetrics.filter(m => m.success).length;

    return {
      count: matchingMetrics.length,
      averageExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      successRate: (successfulCount / matchingMetrics.length) * 100,
    };
  }

  // Clear old metrics
  clearOldMetrics(olderThanHours = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    
    logger.info('Cleared old query metrics', 'QUERY_MONITOR', {
      cutoffTime,
      remainingMetrics: this.metrics.length,
    });
  }

  // Export metrics for analysis
  exportMetrics(timeWindowMinutes = 60): QueryMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }
}

// Global instance
export const queryMonitor = QueryPerformanceMonitor.getInstance();

// Cleanup old metrics every hour
setInterval(() => {
  queryMonitor.clearOldMetrics(24); // Keep 24 hours of metrics
}, 60 * 60 * 1000);