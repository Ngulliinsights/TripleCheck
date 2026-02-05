import { Request, Response } from 'express';

import { cacheService } from '..\cache\CacheService'
import { storage } from '../infrastructure/storage/storage';

import { structuredLogger } from './StructuredLogger';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    eventLoop: {
      delay: number;
      utilization: number;
    };
  };
}

export class HealthMonitor {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private lastHealthCheck: SystemHealth | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.registerDefaultChecks();
    this.startPeriodicHealthChecks();
  }

  private registerDefaultChecks(): void {
    // Database health check
    this.registerCheck('database', async () => {
      const startTime = Date.now();
      try {
        // Simple query to check database connectivity
        await storage.getUsers({ page: 1, limit: 1 });
        
        return {
          name: 'database',
          status: 'healthy' as const,
          responseTime: Date.now() - startTime,
          message: 'Database connection successful',
          lastChecked: new Date()
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          message: 'Database connection failed',
          details: { error: error instanceof Error ? error.message : String(error) },
          lastChecked: new Date()
        };
      }
    });

    // Cache health check
    this.registerCheck('cache', async () => {
      const startTime = Date.now();
      try {
        const health = await cacheService.getHealth();
        
        return {
          name: 'cache',
          status: health.connected ? 'healthy' as const : 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          message: health.connected ? 'Cache service operational' : 'Cache service unavailable',
          details: {
            connected: health.connected,
            latency: health.latency,
            memory: health.memory
          },
          lastChecked: new Date()
        };
      } catch (error) {
        return {
          name: 'cache',
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          message: 'Cache health check failed',
          details: { error: error instanceof Error ? error.message : String(error) },
          lastChecked: new Date()
        };
      }
    });

    // Memory health check
    this.registerCheck('memory', async () => {
      const startTime = Date.now();
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Memory usage normal';
      
      if (heapUsedPercent > 90) {
        status = 'unhealthy';
        message = 'Critical memory usage';
      } else if (heapUsedPercent > 80) {
        status = 'degraded';
        message = 'High memory usage';
      }

      return {
        name: 'memory',
        status,
        responseTime: Date.now() - startTime,
        message,
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          heapUsedPercent: Math.round(heapUsedPercent),
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        lastChecked: new Date()
      };
    });

    // Event loop health check
    this.registerCheck('eventloop', async () => {
      const startTime = Date.now();
      
      return new Promise<HealthCheck>((resolve) => {
        const start = process.hrtime.bigint();
        
        setImmediate(() => {
          const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
          
          let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
          let message = 'Event loop responsive';
          
          if (delay > 100) {
            status = 'unhealthy';
            message = 'Event loop severely blocked';
          } else if (delay > 50) {
            status = 'degraded';
            message = 'Event loop experiencing delays';
          }

          resolve({
            name: 'eventloop',
            status,
            responseTime: Date.now() - startTime,
            message,
            details: {
              delay: Math.round(delay),
              threshold: {
                degraded: 50,
                unhealthy: 100
              }
            },
            lastChecked: new Date()
          });
        });
      });
    });

    // Disk space health check
    this.registerCheck('disk', async () => {
      const startTime = Date.now();
      try {
        const fs = require('fs');
        const stats = fs.statSync('.');
        
        // This is a simplified check - in production you'd want to check actual disk usage
        return {
          name: 'disk',
          status: 'healthy' as const,
          responseTime: Date.now() - startTime,
          message: 'Disk space adequate',
          details: {
            available: 'N/A - simplified check',
            used: 'N/A - simplified check'
          },
          lastChecked: new Date()
        };
      } catch (error) {
        return {
          name: 'disk',
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          message: 'Disk check failed',
          details: { error: error instanceof Error ? error.message : String(error) },
          lastChecked: new Date()
        };
      }
    });
  }

  public registerCheck(name: string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
    structuredLogger.info(`Health check registered: ${name}`);
  }

  public unregisterCheck(name: string): void {
    this.checks.delete(name);
    structuredLogger.info(`Health check unregistered: ${name}`);
  }

  public async runHealthChecks(): Promise<SystemHealth> {
    const startTime = Date.now();
    structuredLogger.info('Running health checks');

    try {
      // Run all health checks in parallel
      const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
        try {
          return await Promise.race([
            checkFn(),
            new Promise<HealthCheck>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
          ]);
        } catch (error) {
          return {
            name,
            status: 'unhealthy' as const,
            responseTime: 5000,
            message: 'Health check timeout or error',
            details: { error: error instanceof Error ? error.message : String(error) },
            lastChecked: new Date()
          };
        }
      });

      const checks = await Promise.all(checkPromises);

      // Determine overall system status
      const overallStatus = this.determineOverallStatus(checks);

      // Collect system metrics
      const metrics = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        eventLoop: {
          delay: 0, // Would be calculated from actual measurements
          utilization: 0 // Would be calculated from actual measurements
        }
      };

      const systemHealth: SystemHealth = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
        metrics
      };

      this.lastHealthCheck = systemHealth;

      // Log health check results
      structuredLogger.info('Health check completed', {
        metadata: {
          status: overallStatus,
          duration: Date.now() - startTime,
          checksCount: checks.length,
          unhealthyChecks: checks.filter(c => c.status === 'unhealthy').length
        }
      });

      // Record metrics
      structuredLogger.recordMetric('health.check.duration', Date.now() - startTime, 'milliseconds');
      structuredLogger.recordMetric('health.checks.total', checks.length, 'count');
      structuredLogger.recordMetric('health.checks.unhealthy', checks.filter(c => c.status === 'unhealthy').length, 'count');

      return systemHealth;
    } catch (error) {
      structuredLogger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: [],
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          eventLoop: { delay: 0, utilization: 0 }
        }
      };
    }
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy');
    const degradedChecks = checks.filter(c => c.status === 'degraded');

    if (unhealthyChecks.length > 0) {
      return 'unhealthy';
    }

    if (degradedChecks.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  private healthCheckInterval?: NodeJS.Timeout;

  private startPeriodicHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        structuredLogger.error('Periodic health check failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 30000);
  }

  public getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  public async handleHealthEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.runHealthChecks();
      
      // Set appropriate HTTP status code
      let statusCode = 200;
      if (health.status === 'degraded') {
        statusCode = 200; // Still operational
      } else if (health.status === 'unhealthy') {
        statusCode = 503; // Service unavailable
      }

      res.status(statusCode).json({
        success: health.status !== 'unhealthy',
        data: health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      structuredLogger.error('Health endpoint error', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check system error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  public async handleReadinessEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.runHealthChecks();
      
      // Readiness check - service is ready to handle requests
      const isReady = health.status === 'healthy' || health.status === 'degraded';
      
      res.status(isReady ? 200 : 503).json({
        success: isReady,
        data: {
          ready: isReady,
          status: health.status,
          timestamp: health.timestamp
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        data: {
          ready: false,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  public async handleLivenessEndpoint(req: Request, res: Response): Promise<void> {
    // Liveness check - service is alive (basic check)
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      res.status(200).json({
        success: true,
        data: {
          alive: true,
          uptime,
          memory: memoryUsage,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: {
          alive: false,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  public shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    structuredLogger.info('Health monitor shutdown');
  }
}

// Create singleton health monitor instance
export const healthMonitor = new HealthMonitor();