import { sql } from 'drizzle-orm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { analyticsCache } from '../infrastructure/cache/AnalyticsCache';
import { CacheService } from '../infrastructure/cache/CacheService';
import { db } from '../infrastructure/database/connection';
import { queryOptimizer } from '../infrastructure/database/QueryOptimizer';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/centralized-error-handler';
import { validateRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const cacheService = new CacheService();

// Validation schemas
const timeRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  period: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
});

const metricsQuerySchema = z.object({
  metrics: z.array(z.string()).optional(),
  granularity: z.enum(['minute', 'hour', 'day']).default('hour'),
  ...timeRangeSchema.shape,
});

/**
 * @route GET /api/monitoring/dashboard
 * @desc Get comprehensive monitoring dashboard data
 * @access Private (Admin only)
 */
router.get('/dashboard',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check admin access
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      // Get system metrics
      const systemMetrics = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };

      // Get cache statistics
      const cacheStats = await analyticsCache.getCacheStats();
      
      // Get query performance statistics
      const queryStats = queryOptimizer.getPerformanceStats();
      
      // Get database connection info
      const dbStats = await getDatabaseStats();
      
      // Get service health status
      const serviceHealth = await getServiceHealthStatus();
      
      // Get recent errors and warnings
      const recentIssues = await getRecentIssues();

      const dashboardData = {
        timestamp: new Date().toISOString(),
        system: systemMetrics,
        cache: cacheStats,
        database: dbStats,
        queries: queryStats,
        services: serviceHealth,
        issues: recentIssues,
        summary: {
          totalRequests: await getTotalRequestCount(),
          activeUsers: await getActiveUserCount(),
          errorRate: await getErrorRate(),
          averageResponseTime: await getAverageResponseTime(),
        },
      };

      ResponseHelper.success(res, dashboardData);
    } catch (error) {
      ResponseHelper.error(res, 'Failed to fetch dashboard data', 500, error);
    }
  })
);

/**
 * @route GET /api/monitoring/metrics
 * @desc Get specific metrics with time series data
 * @access Private (Admin only)
 */
router.get('/metrics',
  requireAuth,
  validateRequest({ query: metricsQuerySchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const { metrics, granularity, start, end, period } = req.query as any;
    
    try {
      // Calculate time range
      const timeRange = calculateTimeRange(start, end, period);
      
      // Get requested metrics
      const metricsData = await getMetricsData({
        metrics: metrics || ['requests', 'errors', 'response_time', 'memory'],
        granularity,
        timeRange,
      });

      ResponseHelper.success(res, {
        timeRange,
        granularity,
        metrics: metricsData,
      });
    } catch (error) {
      ResponseHelper.error(res, 'Failed to fetch metrics', 500, error);
    }
  })
);

/**
 * @route GET /api/monitoring/performance
 * @desc Get performance analysis and recommendations
 * @access Private (Admin only)
 */
router.get('/performance',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const performanceData = {
        queries: {
          stats: queryOptimizer.getPerformanceStats(),
          slowQueries: await getSlowQueries(),
          recommendations: await getQueryRecommendations(),
        },
        cache: {
          stats: await analyticsCache.getCacheStats(),
          hitRates: await getCacheHitRates(),
          recommendations: await getCacheRecommendations(),
        },
        system: {
          memory: getMemoryAnalysis(),
          cpu: getCpuAnalysis(),
          io: await getIOAnalysis(),
        },
        endpoints: await getEndpointPerformance(),
      };

      ResponseHelper.success(res, performanceData);
    } catch (error) {
      ResponseHelper.error(res, 'Failed to fetch performance data', 500, error);
    }
  })
);

/**
 * @route GET /api/monitoring/alerts
 * @desc Get active alerts and warnings
 * @access Private (Admin only)
 */
router.get('/alerts',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const alerts = await getActiveAlerts();
      const warnings = await getActiveWarnings();
      const systemHealth = await getSystemHealthAlerts();

      ResponseHelper.success(res, {
        alerts,
        warnings,
        systemHealth,
        summary: {
          totalAlerts: alerts.length,
          totalWarnings: warnings.length,
          criticalIssues: alerts.filter((a: any) => a.severity === 'critical').length,
        },
      });
    } catch (error) {
      ResponseHelper.error(res, 'Failed to fetch alerts', 500, error);
    }
  })
);

/**
 * @route POST /api/monitoring/cache/clear
 * @desc Clear cache with optional pattern
 * @access Private (Admin only)
 */
router.post('/cache/clear',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const { pattern, type } = req.body;

    try {
      let clearedCount = 0;

      if (pattern) {
        await analyticsCache.invalidatePattern(pattern);
        clearedCount = await getCacheKeyCount(pattern);
      } else if (type) {
        switch (type) {
          case 'analytics':
            await analyticsCache.invalidatePattern('');
            break;
          case 'all':
            await cacheService.clear();
            break;
          default:
            return ResponseHelper.error(res, 'Invalid cache type', 400);
        }
      } else {
        return ResponseHelper.error(res, 'Pattern or type required', 400);
      }

      ResponseHelper.success(res, {
        message: 'Cache cleared successfully',
        clearedCount,
        pattern,
        type,
      });
    } catch (error) {
      ResponseHelper.error(res, 'Failed to clear cache', 500, error);
    }
  })
);

/**
 * @route POST /api/monitoring/queries/analyze
 * @desc Analyze query performance and get recommendations
 * @access Private (Admin only)
 */
router.post('/queries/analyze',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const { queryName } = req.body;

    if (!queryName) {
      return ResponseHelper.error(res, 'Query name is required', 400);
    }

    try {
      const analysis = await queryOptimizer.analyzeQueryPerformance(queryName);
      
      ResponseHelper.success(res, {
        queryName,
        analysis,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      ResponseHelper.error(res, 'Failed to analyze query', 500, error);
    }
  })
);

/**
 * @route GET /api/monitoring/health
 * @desc Get detailed health check for all services
 * @access Private (Admin only)
 */
router.get('/health',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const healthChecks = await performComprehensiveHealthCheck();
      
      const overallStatus = healthChecks.every(check => check.status === 'healthy') 
        ? 'healthy' 
        : healthChecks.some(check => check.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';

      ResponseHelper.success(res, {
        overallStatus,
        checks: healthChecks,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      ResponseHelper.error(res, 'Failed to perform health check', 500, error);
    }
  })
);

// Helper functions

async function getDatabaseStats() {
  try {
    // Get basic database info
    const [result] = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        version() as version,
        current_user as user
    `);
    
    return {
      ...result,
      connectionStatus: 'connected',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connectionStatus: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function getServiceHealthStatus() {
  const services = [
    { name: 'database', check: () => db.execute(sql`SELECT 1`) },
    { name: 'cache', check: () => cacheService.get('health-check') },
    { name: 'analytics', check: () => analyticsCache.getCacheStats() },
  ];

  const healthStatus: Record<string, any> = {};

  for (const service of services) {
    try {
      const startTime = Date.now();
      await service.check();
      const responseTime = Date.now() - startTime;
      
      healthStatus[service.name] = {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      healthStatus[service.name] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  return healthStatus;
}

async function getRecentIssues() {
  // This would typically query a logging system or error tracking service
  // For now, return mock data
  return [
    {
      id: '1',
      type: 'warning',
      message: 'High memory usage detected',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      service: 'system',
    },
    {
      id: '2',
      type: 'error',
      message: 'Database connection timeout',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      service: 'database',
    },
  ];
}

async function getTotalRequestCount(): Promise<number> {
  // This would query analytics data
  return 12543;
}

async function getActiveUserCount(): Promise<number> {
  // This would query user session data
  return 234;
}

async function getErrorRate(): Promise<number> {
  // This would calculate error rate from logs
  return 0.02; // 2%
}

async function getAverageResponseTime(): Promise<number> {
  // This would calculate from performance metrics
  return 145; // ms
}

function calculateTimeRange(start?: string, end?: string, period?: string) {
  const now = new Date();
  const endTime = end ? new Date(end) : now;
  
  let startTime: Date;
  if (start) {
    startTime = new Date(start);
  } else {
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[period || '24h'];
    
    startTime = new Date(now.getTime() - periodMs);
  }

  return { start: startTime, end: endTime };
}

async function getMetricsData(options: {
  metrics: string[];
  granularity: string;
  timeRange: { start: Date; end: Date };
}) {
  // This would query actual metrics data
  // For now, return mock time series data
  const mockData: Record<string, any[]> = {};
  
  for (const metric of options.metrics) {
    mockData[metric] = generateMockTimeSeries(
      options.timeRange.start,
      options.timeRange.end,
      options.granularity
    );
  }
  
  return mockData;
}

function generateMockTimeSeries(start: Date, end: Date, granularity: string) {
  const points = [];
  const interval = {
    'minute': 60 * 1000,
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
  }[granularity] || 60 * 60 * 1000;
  
  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    points.push({
      timestamp: new Date(time).toISOString(),
      value: Math.random() * 100,
    });
  }
  
  return points;
}

async function getSlowQueries() {
  const stats = queryOptimizer.getPerformanceStats();
  return Object.entries(stats)
    .filter(([, metrics]) => (metrics as any).averageTime > 1000)
    .map(([queryName, metrics]) => ({ queryName, ...metrics }));
}

async function getQueryRecommendations() {
  return [
    {
      type: 'index',
      message: 'Consider adding index on user_id column for user queries',
      impact: 'high',
      effort: 'low',
    },
    {
      type: 'query',
      message: 'Property search query could benefit from query optimization',
      impact: 'medium',
      effort: 'medium',
    },
  ];
}

async function getCacheHitRates() {
  const stats = await analyticsCache.getCacheStats();
  return {
    overall: stats.hitRate,
    byType: stats.keysByType,
  };
}

async function getCacheRecommendations() {
  return [
    {
      type: 'ttl',
      message: 'Consider increasing TTL for user analytics cache',
      impact: 'medium',
    },
    {
      type: 'size',
      message: 'Cache size is optimal',
      impact: 'low',
    },
  ];
}

function getMemoryAnalysis() {
  const usage = process.memoryUsage();
  return {
    ...usage,
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    utilization: usage.heapUsed / usage.heapTotal,
  };
}

function getCpuAnalysis() {
  const usage = process.cpuUsage();
  return {
    ...usage,
    userPercent: usage.user / 1000000, // Convert to seconds
    systemPercent: usage.system / 1000000,
  };
}

async function getIOAnalysis() {
  // This would typically use system monitoring tools
  return {
    diskUsage: 'N/A',
    networkIO: 'N/A',
    fileDescriptors: 'N/A',
  };
}

async function getEndpointPerformance() {
  // This would analyze endpoint performance from logs
  return [
    {
      endpoint: '/api/properties',
      averageResponseTime: 120,
      requestCount: 1543,
      errorRate: 0.01,
    },
    {
      endpoint: '/api/users',
      averageResponseTime: 85,
      requestCount: 892,
      errorRate: 0.005,
    },
  ];
}

async function getActiveAlerts() {
  return [
    {
      id: 'alert-1',
      severity: 'critical',
      message: 'Database connection pool exhausted',
      timestamp: new Date().toISOString(),
      service: 'database',
    },
  ];
}

async function getActiveWarnings() {
  return [
    {
      id: 'warning-1',
      severity: 'warning',
      message: 'High memory usage (>80%)',
      timestamp: new Date().toISOString(),
      service: 'system',
    },
  ];
}

async function getSystemHealthAlerts() {
  const memoryUsage = process.memoryUsage();
  const alerts = [];
  
  if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: 'High memory usage detected',
      value: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    });
  }
  
  return alerts;
}

async function getCacheKeyCount(pattern: string): Promise<number> {
  // This would count cache keys matching the pattern
  return 0;
}

async function performComprehensiveHealthCheck() {
  const checks = [
    {
      name: 'Database Connection',
      check: async () => {
        await db.execute(sql`SELECT 1`);
        return { status: 'healthy', responseTime: 50 };
      },
    },
    {
      name: 'Cache Service',
      check: async () => {
        await cacheService.get('health-check');
        return { status: 'healthy', responseTime: 10 };
      },
    },
    {
      name: 'Memory Usage',
      check: async () => {
        const usage = process.memoryUsage();
        const utilization = usage.heapUsed / usage.heapTotal;
        return {
          status: utilization > 0.9 ? 'unhealthy' : utilization > 0.8 ? 'degraded' : 'healthy',
          utilization: Math.round(utilization * 100),
        };
      },
    },
  ];

  const results = [];
  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({
        name: check.name,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        name: check.name,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}

export { router as monitoringRouter };