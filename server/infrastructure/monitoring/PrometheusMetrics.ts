import { Request, Response, NextFunction } from 'express';

import { logger } from './logger';
import { observabilitySystem } from './ObservabilitySystem';

export interface MetricsCollectionOptions {
  collectDatabaseMetrics: boolean;
  collectHttpMetrics: boolean;
  collectBusinessMetrics: boolean;
  collectCacheMetrics: boolean;
  excludePaths?: string[];
}

export class PrometheusMetrics {
  private static instance: PrometheusMetrics;
  private options: MetricsCollectionOptions;
  private requestTimers: Map<string, number> = new Map();

  static getInstance(options?: MetricsCollectionOptions): PrometheusMetrics {
    if (!PrometheusMetrics.instance) {
      PrometheusMetrics.instance = new PrometheusMetrics(options);
    }
    return PrometheusMetrics.instance;
  }

  constructor(options?: MetricsCollectionOptions) {
    this.options = {
      collectDatabaseMetrics: true,
      collectHttpMetrics: true,
      collectBusinessMetrics: true,
      collectCacheMetrics: true,
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      ...options
    };
  }

  async initialize(): Promise<void> {
    try {
      await observabilitySystem.initialize();
      
      // Start periodic metrics collection
      this.startPeriodicCollection();
      
      logger.info('PrometheusMetrics initialized successfully');
    } catch (error) {
      logger.error({ error: error }, 'Failed to initialize PrometheusMetrics:');
      throw error;
    }
  }

  // Express middleware for HTTP metrics collection
  httpMetricsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.options.collectHttpMetrics) {
        return next();
      }

      // Skip excluded paths
      if (this.options.excludePaths?.some(path => req.path.startsWith(path))) {
        return next();
      }

      const startTime = Date.now();
      const requestId = `${req.method}-${req.path}-${startTime}`;
      
      this.requestTimers.set(requestId, startTime);

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const duration = Date.now() - startTime;
        
        // Record HTTP request metrics
        observabilitySystem.recordHttpRequest(
          req.method,
          req.path,
          res.statusCode,
          duration,
          req.user?.id
        );

        // Clean up timer
        PrometheusMetrics.instance.requestTimers.delete(requestId);

        // Call original end method
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  // Database query metrics wrapper
  wrapDatabaseQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (!this.options.collectDatabaseMetrics) {
      return queryFn();
    }

    const startTime = Date.now();

    return queryFn()
      .then(result => {
        const duration = Date.now() - startTime;
        observabilitySystem.recordDatabaseQuery(operation, table, duration, 'success');
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        observabilitySystem.recordDatabaseQuery(operation, table, duration, 'error');
        observabilitySystem.recordDatabaseError(error.code || 'unknown', table, operation);
        throw error;
      });
  }

  // Cache metrics wrapper
  wrapCacheOperation<T>(
    operation: 'get' | 'set' | 'delete',
    cacheType: 'L1' | 'L2' | 'redis',
    keyPattern: string,
    cacheFn: () => Promise<T>
  ): Promise<T> {
    if (!this.options.collectCacheMetrics) {
      return cacheFn();
    }

    return cacheFn()
      .then(result => {
        if (operation === 'get') {
          if (result !== null && result !== undefined) {
            if (cacheType === 'redis') {
              observabilitySystem.recordRedisCacheHit(keyPattern);
            } else {
              observabilitySystem.recordCacheHit(cacheType, keyPattern);
            }
          } else {
            if (cacheType === 'redis') {
              observabilitySystem.recordRedisCacheMiss(keyPattern);
            } else {
              observabilitySystem.recordCacheMiss(cacheType, keyPattern);
            }
          }
        }
        return result;
      })
      .catch(error => {
        if (operation === 'get') {
          if (cacheType === 'redis') {
            observabilitySystem.recordRedisCacheMiss(keyPattern);
          } else {
            observabilitySystem.recordCacheMiss(cacheType, keyPattern);
          }
        }
        throw error;
      });
  }

  // Business metrics recording methods
  recordLandVerificationStarted(region: string, propertyType: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordLandVerificationStarted(region, propertyType);
    }
  }

  recordLandVerificationCompleted(
    status: 'success' | 'failure',
    region: string,
    propertyType: string,
    duration: number
  ): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordLandVerificationCompleted(status, region, propertyType, duration);
    }
  }

  recordFraudAlert(severity: 'low' | 'medium' | 'high' | 'critical', type: string, region: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordFraudAlert(severity, type, region);
    }
  }

  recordUserRegistration(userType: string, region: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordUserRegistration(userType, region);
    }
  }

  recordUserLogin(userType: string, method: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordUserLogin(userType, method);
    }
  }

  recordPropertyListing(propertyType: string, region: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordPropertyListing(propertyType, region);
    }
  }

  recordPropertyView(propertyType: string, region: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordPropertyView(propertyType, region);
    }
  }

  recordPropertyInquiry(propertyType: string, inquiryType: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordPropertyInquiry(propertyType, inquiryType);
    }
  }

  recordDocumentAuthentication(documentType: string, duration: number, status: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordDocumentAuthentication(documentType, duration, status);
    }
  }

  recordFraudAnalysis(analysisType: string, duration: number, complexity: string): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordFraudAnalysis(analysisType, duration, complexity);
    }
  }

  recordExternalApiCall(api: string, endpoint: string, status: 'success' | 'failure'): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.recordExternalApiCall(api, endpoint, status);
    }
  }

  updateActiveUsers(userType: string, count: number): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.updateActiveUsers(userType, count);
    }
  }

  updateTrustScore(userType: string, region: string, averageScore: number): void {
    if (this.options.collectBusinessMetrics) {
      observabilitySystem.updateTrustScore(userType, region, averageScore);
    }
  }

  updateConnectionPoolMetrics(active: number, idle: number, waiting: number): void {
    if (this.options.collectDatabaseMetrics) {
      observabilitySystem.updateConnectionPoolMetrics(active, idle, waiting);
    }
  }

  private startPeriodicCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect business metrics every 60 seconds
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);

    // Collect database metrics every 15 seconds
    setInterval(() => {
      this.collectDatabaseMetrics();
    }, 15000);

    logger.info('Started periodic metrics collection');
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Collect Node.js process metrics
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // These would be recorded as custom metrics if needed
      // For now, we rely on the default Node.js metrics from prom-client

      logger.debug('Collected system metrics');
    } catch (error) {
      logger.error({ error: error }, 'Error collecting system metrics:');
    }
  }

  private async collectBusinessMetrics(): Promise<void> {
    try {
      // This would typically query the database for current business metrics
      // For example, active user counts, recent activity, etc.
      
      // Example: Update active user counts
      // const activeUsers = await this.getActiveUserCounts();
      // activeUsers.forEach(({ userType, count }) => {
      //   this.updateActiveUsers(userType, count);
      // });

      logger.debug('Collected business metrics');
    } catch (error) {
      logger.error({ error: error }, 'Error collecting business metrics:');
    }
  }

  private async collectDatabaseMetrics(): Promise<void> {
    try {
      // This would typically collect database-specific metrics
      // Connection pool status, query performance, etc.
      
      // Example: Update connection pool metrics
      // const poolStats = await this.getConnectionPoolStats();
      // this.updateConnectionPoolMetrics(
      //   poolStats.active,
      //   poolStats.idle,
      //   poolStats.waiting
      // );

      logger.debug('Collected database metrics');
    } catch (error) {
      logger.error({ error: error }, 'Error collecting database metrics:');
    }
  }

  // Metrics endpoint for Prometheus scraping
  async getMetrics(): Promise<string> {
    try {
      return await observabilitySystem.getMetrics();
    } catch (error) {
      logger.error({ error: error }, 'Error getting metrics:');
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const observabilityHealth = await observabilitySystem.healthCheck();
      
      const details = {
        observabilitySystem: observabilityHealth,
        activeTimers: this.requestTimers.size,
        options: this.options
      };

      return {
        status: observabilityHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const prometheusMetrics = PrometheusMetrics.getInstance();

// Export convenience functions for easy use
export const recordDatabaseQuery = (operation: string, table: string, queryFn: () => Promise<any>) =>
  prometheusMetrics.wrapDatabaseQuery(operation, table, queryFn);

export const recordCacheOperation = <T>(
  operation: 'get' | 'set' | 'delete',
  cacheType: 'L1' | 'L2' | 'redis',
  keyPattern: string,
  cacheFn: () => Promise<T>
) => prometheusMetrics.wrapCacheOperation(operation, cacheType, keyPattern, cacheFn);

export const httpMetricsMiddleware = () => prometheusMetrics.httpMetricsMiddleware();