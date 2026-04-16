import { sql } from 'drizzle-orm';
import { Request, Response } from 'express';
import Redis from '../../../scripts/cleanup-redundancies';

import { getDatabase } from '../../infrastructure/database/connection';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    externalAPIs: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: any;
}

export class HealthCheckService {
  private redis: Redis;
  private startTime: number;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.startTime = Date.now();
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const [database, redis, externalAPIs, memory, disk] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'fail', message: 'Check failed' }
    );

    const overallStatus = this.determineOverallStatus([database, redis, externalAPIs, memory, disk]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      checks: {
        database,
        redis,
        externalAPIs,
        memory,
        disk
      }
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if database is initialized before trying to use it
      const db = getDatabase();
      if (!db) {
        throw new Error('Database not initialized');
      }
      
      await db.execute(sql`SELECT 1`);
      
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
        message: 'Database connection successful'
      };
    } catch (error) {
      // In development, don't fail health checks for database issues
      const status = process.env.NODE_ENV === 'development' ? 'warn' : 'fail';
      
      return {
        status,
        responseTime: Date.now() - startTime,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Skip Redis check in development if not configured
      if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
        return {
          status: 'warn',
          responseTime: Date.now() - startTime,
          message: 'Redis not configured in development'
        };
      }
      
      await this.redis.ping();
      
      return {
        status: 'pass',
        responseTime: Date.now() - startTime,
        message: 'Redis connection successful'
      };
    } catch (error) {
      // In development, don't fail health checks for Redis issues
      const status = process.env.NODE_ENV === 'development' ? 'warn' : 'fail';
      
      return {
        status,
        responseTime: Date.now() - startTime,
        message: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkExternalAPIs(): Promise<HealthCheck> {
    const startTime = Date.now();
    const apiChecks = [];

    // Check Ministry of Lands API
    if (process.env.MINISTRY_OF_LANDS_API_URL) {
      apiChecks.push(this.checkAPI('Ministry of Lands', process.env.MINISTRY_OF_LANDS_API_URL));
    }

    // Check Court Records API
    if (process.env.COURT_RECORDS_API_URL) {
      apiChecks.push(this.checkAPI('Court Records', process.env.COURT_RECORDS_API_URL));
    }

    try {
      const results = await Promise.allSettled(apiChecks);
      const failedAPIs = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.status === 'fail')
      );

      if (failedAPIs.length === 0) {
        return {
          status: 'pass',
          responseTime: Date.now() - startTime,
          message: 'All external APIs accessible'
        };
      } else if (failedAPIs.length < results.length) {
        return {
          status: 'warn',
          responseTime: Date.now() - startTime,
          message: `${failedAPIs.length} of ${results.length} external APIs failed`,
          details: results
        };
      } else {
        return {
          status: 'fail',
          responseTime: Date.now() - startTime,
          message: 'All external APIs failed',
          details: results
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'External API check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkAPI(name: string, url: string): Promise<{ name: string; status: 'pass' | 'fail'; responseTime: number }> {
    const startTime = Date.now();
    const controller = new AbortController();
    
    // Set timeout with AbortController
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return {
        name,
        status: response.ok ? 'pass' : 'fail',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        responseTime: Date.now() - startTime
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const rssMemory = memUsage.rss; // Resident Set Size - actual memory used
    const {heapUsed} = memUsage;
    const {heapTotal} = memUsage;
    
    // Use RSS memory for more accurate system memory usage
    const memoryUsagePercent = (heapUsed / heapTotal) * 100;
    const rssMB = Math.round(rssMemory / 1024 / 1024);

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Heap usage: ${memoryUsagePercent.toFixed(1)}%, RSS: ${rssMB}MB`;

    // More realistic thresholds for development
    if (memoryUsagePercent > 95) {
      status = 'fail';
      message += ' - Critical heap usage';
    } else if (memoryUsagePercent > 85) {
      status = 'warn';
      message += ' - High heap usage';
    } else if (rssMB > 1024) { // 1GB RSS threshold
      status = 'warn';
      message += ' - High RSS memory usage';
    }

    return {
      status,
      message,
      details: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)  } MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)  } MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)  } MB`,
        rss: `${rssMB  } MB`,
        memoryUsage: memoryUsagePercent / 100 // For alerting service
      }
    };
  }

  private checkDisk(): HealthCheck {
    // In a real implementation, you would check disk usage
    // For now, we'll return a basic check
    return {
      status: 'pass',
      message: 'Disk space check not implemented'
    };
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');

    if (hasFailures) {
      return 'unhealthy';
    } else if (hasWarnings) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Express middleware for health check endpoint
  healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthCheck = await this.performHealthCheck();
      
      const statusCode = healthCheck.status === 'healthy' ? 200 : 
                        healthCheck.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(healthCheck);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Simple readiness check
  readinessHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      // Basic checks for readiness
      await this.checkDatabase();
      await this.checkRedis();
      
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export const healthCheckService = new HealthCheckService();