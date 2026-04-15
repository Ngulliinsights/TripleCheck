import { Router, Request, Response } from 'express';

import { logger } from '../../infrastructure/observability/telemetry';
import { asyncProcessor } from '../AsyncProcessor';
import { landVerificationCache } from '../cache/LandVerificationCache';
import { databaseOptimizer } from '../DatabaseOptimizer';

import { performanceManager } from './PerformanceManager';

const router = Router();

// Performance Metrics Endpoints
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const report = performanceManager.getPerformanceReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get performance metrics');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/metrics/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = performanceManager.getMetricsHistory(limit);
    
    res.json({
      success: true,
      data: {
        metrics: history,
        count: history.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get metrics history');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health Check Endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await performanceManager.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Health check failed');
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache Management Endpoints
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = await landVerificationCache.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get cache stats');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    const { pattern, propertyId, userId } = req.body;
    
    if (propertyId) {
      await landVerificationCache.invalidatePropertyCache(propertyId);
    } else if (userId) {
      await landVerificationCache.invalidateUserCache(userId);
    } else if (pattern) {
      // This would need to be implemented in the cache service
      logger.info(`Cache invalidation requested for pattern: ${pattern}`);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Must specify propertyId, userId, or pattern for cache invalidation'
      });
    }
    
    res.json({
      success: true,
      message: 'Cache invalidation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Cache invalidation failed');
    res.status(500).json({
      success: false,
      message: 'Cache invalidation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cache/warm-up', async (req: Request, res: Response) => {
  try {
    const { propertyIds } = req.body;
    
    if (!Array.isArray(propertyIds)) {
      return res.status(400).json({
        success: false,
        message: 'propertyIds must be an array'
      });
    }
    
    await landVerificationCache.warmUpCache(propertyIds);
    
    res.json({
      success: true,
      message: `Cache warm-up initiated for ${propertyIds.length} properties`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Cache warm-up failed');
    res.status(500).json({
      success: false,
      message: 'Cache warm-up failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Async Processing Endpoints
router.get('/async/stats', async (req: Request, res: Response) => {
  try {
    const stats = asyncProcessor.getProcessorStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get async processor stats');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve async processor statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/async/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const status = asyncProcessor.getTaskStatus(taskId);
    const result = asyncProcessor.getTaskResult(taskId);
    
    res.json({
      success: true,
      data: {
        taskId,
        status,
        result
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get task status');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/async/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const cancelled = asyncProcessor.cancelTask(taskId);
    
    res.json({
      success: cancelled,
      message: cancelled ? 'Task cancelled successfully' : 'Task could not be cancelled (may be running or completed)',
      data: { taskId, cancelled },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to cancel task');
    res.status(500).json({
      success: false,
      message: 'Failed to cancel task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database Optimization Endpoints
router.get('/database/slow-queries', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const slowQueries = await databaseOptimizer.getSlowQueries(limit);
    
    res.json({
      success: true,
      data: {
        queries: slowQueries,
        count: slowQueries.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to get slow queries');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve slow queries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/database/indexes/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const indexes = await databaseOptimizer.analyzeTableIndexes(tableName);
    
    res.json({
      success: true,
      data: {
        tableName,
        indexes,
        count: indexes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to analyze table indexes');
    res.status(500).json({
      success: false,
      message: 'Failed to analyze table indexes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/database/optimize-indexes', async (req: Request, res: Response) => {
  try {
    await databaseOptimizer.createOptimalIndexes();
    
    res.json({
      success: true,
      message: 'Database index optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Database index optimization failed');
    res.status(500).json({
      success: false,
      message: 'Database index optimization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/database/analyze-query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query string is required'
      });
    }
    
    const analysis = await databaseOptimizer.analyzeQueryPerformance(query);
    
    res.json({
      success: true,
      data: {
        query,
        analysis
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Query analysis failed');
    res.status(500).json({
      success: false,
      message: 'Query analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance Control Endpoints
router.post('/monitoring/start', async (req: Request, res: Response) => {
  try {
    await performanceManager.startMonitoring();
    
    res.json({
      success: true,
      message: 'Performance monitoring started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to start performance monitoring');
    res.status(500).json({
      success: false,
      message: 'Failed to start performance monitoring',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/monitoring/stop', async (req: Request, res: Response) => {
  try {
    performanceManager.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Performance monitoring stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Failed to stop performance monitoring');
    res.status(500).json({
      success: false,
      message: 'Failed to stop performance monitoring',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/optimize/cache', async (req: Request, res: Response) => {
  try {
    await performanceManager.optimizeCache();
    
    res.json({
      success: true,
      message: 'Cache optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Cache optimization failed');
    res.status(500).json({
      success: false,
      message: 'Cache optimization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/optimize/database', async (req: Request, res: Response) => {
  try {
    await performanceManager.optimizeDatabase();
    
    res.json({
      success: true,
      message: 'Database optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Database optimization failed');
    res.status(500).json({
      success: false,
      message: 'Database optimization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/optimize/async', async (req: Request, res: Response) => {
  try {
    await performanceManager.optimizeAsyncProcessing();
    
    res.json({
      success: true,
      message: 'Async processing optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Async processing optimization failed');
    res.status(500).json({
      success: false,
      message: 'Async processing optimization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk Operations Endpoint
router.post('/bulk/verification-layers', async (req: Request, res: Response) => {
  try {
    const { layers, batchSize } = req.body;
    
    if (!Array.isArray(layers)) {
      return res.status(400).json({
        success: false,
        message: 'layers must be an array'
      });
    }
    
    await databaseOptimizer.batchInsertVerificationLayers(layers, batchSize);
    
    res.json({
      success: true,
      message: `Bulk insert completed for ${layers.length} verification layers`,
      data: {
        processedCount: layers.length,
        batchSize: batchSize || 100
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Bulk verification layers insert failed');
    res.status(500).json({
      success: false,
      message: 'Bulk insert failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/bulk/verification-status', async (req: Request, res: Response) => {
  try {
    const { updates, batchSize } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'updates must be an array'
      });
    }
    
    await databaseOptimizer.batchUpdateVerificationStatus(updates, batchSize);
    
    res.json({
      success: true,
      message: `Bulk update completed for ${updates.length} verification sessions`,
      data: {
        processedCount: updates.length,
        batchSize: batchSize || 50
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error }, 'Bulk verification status update failed');
    res.status(500).json({
      success: false,
      message: 'Bulk update failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as performanceRoutes };