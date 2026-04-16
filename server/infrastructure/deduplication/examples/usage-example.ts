/**
 * Usage examples for the Request Deduplication system
 * 
 * This file demonstrates how to integrate and use the deduplication utilities
 * in your Express application.
 */

import express from 'express';
import { RequestDeduplicator, CacheStatistics } from '../RequestDeduplicator';
import { 
  createDeduplicationMiddleware, 
  addRequestIdMiddleware, 
  idempotencyMiddleware,
  deduplicationResponseMiddleware,
  RequestDeduplicator 
} from '../index';

// Example 1: Basic Express app setup with deduplication
export function setupBasicDeduplication(app: express.Application) {
  // Add request ID tracking
  app.use(addRequestIdMiddleware());
  
  // Add idempotency key validation
  app.use(idempotencyMiddleware());
  
  // Add deduplication middleware with default config
  app.use(createDeduplicationMiddleware());
  
  // Add response headers for deduplication info
  app.use(deduplicationResponseMiddleware());
}

// Example 2: Advanced setup with Redis cache and custom configuration
export function setupAdvancedDeduplication(app: express.Application, cache: CacheService) {
  // Custom deduplication configuration
  const deduplicationConfig = {
    enabled: true,
    ttl: 600000, // 10 minutes
    skipPatterns: [
      /^\/api\/auth\//,           // Skip authentication endpoints
      /^\/api\/payments\//,       // Skip payment endpoints
      /^\/api\/uploads\//,        // Skip file uploads
    ],
    forcePatterns: [
      /^\/api\/search\//,         // Force deduplication for search
      /^\/api\/analytics\//,      // Force deduplication for analytics
    ],
    includeUserInKey: true,       // Include user ID in deduplication key
    includeHeaders: ['content-type', 'accept', 'authorization']
  };

  app.use(addRequestIdMiddleware());
  app.use(idempotencyMiddleware());
  app.use(createDeduplicationMiddleware(deduplicationConfig, cache));
  app.use(deduplicationResponseMiddleware());
}

// Example 3: Manual deduplication in service layer
export class ExampleService {
  private deduplicator: RequestDeduplicator;

  constructor(cache?: CacheService) {
    this.deduplicator = RequestDeduplicator.getInstance({
      defaultTtl: 300000, // 5 minutes
      enableRedisBackup: !!cache
    }, cache);
  }

  // Example: Deduplicated professional search
  async searchProfessionals(userId: number, criteria: any): Promise<any[]> {
    const key = this.deduplicator.generateIdempotencyKey(
      userId, 
      'search-professionals', 
      criteria
    );

    return this.deduplicator.handleIdempotentRequest(
      key,
      async () => {
        // Expensive search operation
        console.log('Executing professional search...');
        
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return [
          { id: 1, name: 'John Doe', type: 'lawyer' },
          { id: 2, name: 'Jane Smith', type: 'surveyor' }
        ];
      },
      300000 // 5 minutes TTL
    );
  }

  // Example: Deduplicated analytics event tracking
  async trackAnalyticsEvent(userId: number, event: any): Promise<void> {
    const key = this.deduplicator.generateIdempotencyKey(
      userId,
      'track-analytics',
      { type: event.type, timestamp: Math.floor(Date.now() / 60000) } // Round to minute
    );

    await this.deduplicator.handleIdempotentRequest(
      key,
      async () => {
        console.log('Tracking analytics event...');
        
        // Simulate event tracking
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return { tracked: true };
      },
      60000 // 1 minute TTL for analytics
    );
  }

  // Example: Cache management
  async clearUserCache(userId: number): Promise<void> {
    // Clear all cached requests for a specific user
    await this.deduplicator.clearCache(`*user:${userId}*`);
  }

  // Example: Get deduplication statistics
  getDeduplicationStats() {
    return this.deduplicator.getStats();
  }
}

// Example 4: Route-specific deduplication
export function setupRouteSpecificDeduplication(app: express.Application) {
  // Global middleware for basic functionality
  app.use(addRequestIdMiddleware());
  app.use(idempotencyMiddleware());

  // Route-specific deduplication for search endpoints
  const searchDeduplication = createDeduplicationMiddleware({
    enabled: true,
    ttl: 300000, // 5 minutes for search results
    forcePatterns: [/.*/], // Force deduplication for all routes using this middleware
    includeUserInKey: true
  });

  // Route-specific deduplication for analytics
  const analyticsDeduplication = createDeduplicationMiddleware({
    enabled: true,
    ttl: 60000, // 1 minute for analytics
    forcePatterns: [/.*/],
    includeUserInKey: true
  });

  // Apply to specific route groups
  app.use('/api/search', searchDeduplication);
  app.use('/api/analytics', analyticsDeduplication);
  
  // Global response middleware
  app.use(deduplicationResponseMiddleware());
}

// Example 5: Custom idempotency key handling
export function handleCustomIdempotency(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Custom logic for generating idempotency keys
  if (req.method === 'POST' && req.path.startsWith('/api/professionals')) {
    const deduplicator = RequestDeduplicator.getInstance();
    
    // Generate custom key based on request content
    const customKey = deduplicator.generateIdempotencyKey(
      req.session?.userId || 0,
      req.path,
      {
        ...req.body,
        timestamp: Math.floor(Date.now() / 300000) // 5-minute window
      }
    );
    
    // Add to request headers for middleware to use
    req.headers['idempotency-key'] = customKey;
  }
  
  next();
}

// Example 6: Error handling and monitoring
export function setupDeduplicationMonitoring(app: express.Application) {
  // Monitoring endpoint for deduplication stats
  app.get('/api/internal/deduplication/stats', (req, res) => {
    const deduplicator = RequestDeduplicator.getInstance();
    const stats = deduplicator.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  });

  // Health check endpoint
  app.get('/api/internal/deduplication/health', (req, res) => {
    try {
      const deduplicator = RequestDeduplicator.getInstance();
      const stats = deduplicator.getStats();
      
      // Check if memory usage is reasonable
      const isHealthy = stats.memoryUsage < 100 * 1024 * 1024; // 100MB limit
      
      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
          healthy: isHealthy,
          memoryUsage: stats.memoryUsage,
          pendingRequests: stats.pendingRequests,
          completedRequests: stats.completedRequests
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Deduplication health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Example 7: Testing utilities
export class DeduplicationTestUtils {
  static async waitForPendingRequests(timeout = 5000): Promise<void> {
    const deduplicator = RequestDeduplicator.getInstance();
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const stats = deduplicator.getStats();
      if (stats.pendingRequests === 0) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error('Timeout waiting for pending requests to complete');
  }
  
  static async clearAllCache(): Promise<void> {
    const deduplicator = RequestDeduplicator.getInstance();
    await deduplicator.clearCache('*');
  }
  
  static getStats() {
    const deduplicator = RequestDeduplicator.getInstance();
    return deduplicator.getStats();
  }
}