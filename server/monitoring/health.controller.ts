import { Router, Request, Response } from 'express';

import { CacheService } from '../../core/src/cache'
import { db } from '../infrastructure/database/connection';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const cache = new CacheService();

/**
 * @route GET /api/health
 * @desc System health check endpoint
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {} as Record<string, any>,
    responseTime: 0,
  };

  try {
    // Check database connection
    try {
      await db.execute('SELECT 1');
      healthStatus.services.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - startTime,
      };
      healthStatus.status = 'degraded';
    }

    // Check cache service
    try {
      await cache.set('health-check', 'ok', { ttl: 10 });
      const cacheResult = await cache.get('health-check');
      healthStatus.services.cache = {
        status: cacheResult === 'ok' ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      healthStatus.services.cache = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Cache service failed',
        responseTime: Date.now() - startTime,
      };
      healthStatus.status = 'degraded';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    healthStatus.services.memory = {
      status: memoryUsageMB.heapUsed < 500 ? 'healthy' : 'warning', // Warning if > 500MB
      usage: memoryUsageMB,
    };

    // Add system info
    healthStatus.services.system = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    };

    healthStatus.responseTime = Date.now() - startTime;

    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
    if (serviceStatuses.includes('unhealthy')) {
      healthStatus.status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded') || serviceStatuses.includes('warning')) {
      healthStatus.status = 'degraded';
    }

    // Set appropriate HTTP status code
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(healthStatus);

  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.services.general = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthStatus.responseTime = Date.now() - startTime;

    res.status(503).json(healthStatus);
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with service-specific information
 * @access Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await checkDatabaseHealth(),
        cache: await checkCacheHealth(),
        memory: checkMemoryHealth(),
        disk: checkDiskHealth(),
        network: checkNetworkHealth(),
      },
      metrics: {
        responseTime: 0,
        requestsPerSecond: 0, // Would need to implement request counting
        errorRate: 0, // Would need to implement error tracking
      },
    };

    detailedHealth.metrics.responseTime = Date.now() - startTime;

    // Determine overall status
    const serviceStatuses = Object.values(detailedHealth.services).map(s => s.status);
    if (serviceStatuses.includes('unhealthy')) {
      detailedHealth.status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded') || serviceStatuses.includes('warning')) {
      detailedHealth.status = 'degraded';
    }

    const httpStatus = detailedHealth.status === 'healthy' ? 200 : 
                      detailedHealth.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(detailedHealth);

  } catch (error) {
    ResponseHelper.error(res, 'Health check failed', 503, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper functions for detailed health checks

async function checkDatabaseHealth() {
  const startTime = Date.now();
  try {
    await db.execute('SELECT 1');
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      connectionPool: {
        // Would need to implement connection pool monitoring
        active: 'unknown',
        idle: 'unknown',
        total: 'unknown',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database check failed',
      responseTime: Date.now() - startTime,
    };
  }
}

async function checkCacheHealth() {
  const startTime = Date.now();
  try {
    const testKey = `health-check-${Date.now()}`;
    await cache.set(testKey, 'test', { ttl: 10 });
    const result = await cache.get(testKey);
    await cache.delete(testKey);
    
    return {
      status: result === 'test' ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      operations: {
        set: 'ok',
        get: result === 'test' ? 'ok' : 'failed',
        delete: 'ok',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Cache check failed',
      responseTime: Date.now() - startTime,
    };
  }
}

function checkMemoryHealth() {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  let status = 'healthy';
  if (heapUsagePercent > 90) status = 'unhealthy';
  else if (heapUsagePercent > 75) status = 'warning';

  return {
    status,
    usage: memoryUsageMB,
    heapUsagePercent: Math.round(heapUsagePercent),
    thresholds: {
      warning: '75%',
      critical: '90%',
    },
  };
}

function checkDiskHealth() {
  // Basic disk health check - would need more sophisticated implementation
  return {
    status: 'healthy',
    note: 'Disk health monitoring not fully implemented',
  };
}

function checkNetworkHealth() {
  // Basic network health check
  return {
    status: 'healthy',
    interfaces: Object.keys(require('os').networkInterfaces()),
    note: 'Network health monitoring not fully implemented',
  };
}

export { router as healthRouter };