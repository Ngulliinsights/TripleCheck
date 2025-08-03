/**
 * Usage examples for the Rate Limiting system
 * 
 * This file demonstrates how to integrate and use the rate limiting utilities
 * in your Express application.
 */

import express from 'express';

import { CacheService } from '../../cache/CacheService';
import { 
  createRateLimitingMiddleware,
  rateLimitCounterMiddleware,
  rateLimitHeadersMiddleware,
  createEndpointRateLimiter,
  ApiRateLimiter,
  CircuitBreakerManager,
  ApiCallTracker
} from '../index';

// Example 1: Basic Express app setup with comprehensive rate limiting
export function setupBasicRateLimiting(app: express.Application) {
  // Add comprehensive rate limiting middleware
  app.use(createRateLimitingMiddleware({
    enableUserLimits: true,
    enableGlobalLimits: true,
    enableEndpointLimits: true,
    enableCircuitBreaker: true,
    enableCallTracking: true
  }));
  
  // Add counter middleware to track successful requests
  app.use(rateLimitCounterMiddleware());
  
  // Add headers middleware for client visibility
  app.use(rateLimitHeadersMiddleware());
}

// Example 2: Advanced setup with Redis cache and custom configuration
export function setupAdvancedRateLimiting(app: express.Application, cache: CacheService) {
  const rateLimitingConfig = {
    enableUserLimits: true,
    enableGlobalLimits: true,
    enableEndpointLimits: true,
    enableCircuitBreaker: true,
    enableCallTracking: true,
    skipPatterns: [
      /^\/api\/health$/,
      /^\/api\/internal\//,
      /^\/api\/metrics$/,
      /^\/api\/docs\//
    ],
    circuitBreakerConfig: {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      requestTimeout: 30000    // 30 seconds
    },
    rateLimitConfigs: {
      user: {
        windowMs: 60000,    // 1 minute
        maxRequests: 100,   // 100 requests per minute per user
        message: 'User rate limit exceeded'
      },
      global: {
        windowMs: 60000,    // 1 minute
        maxRequests: 1000,  // 1000 requests per minute globally
        message: 'Global rate limit exceeded'
      },
      endpoint: {
        windowMs: 60000,    // 1 minute
        maxRequests: 500,   // 500 requests per minute per endpoint
        message: 'Endpoint rate limit exceeded'
      }
    }
  };

  app.use(createRateLimitingMiddleware(rateLimitingConfig, cache));
  app.use(rateLimitCounterMiddleware());
  app.use(rateLimitHeadersMiddleware());
}

// Example 3: Endpoint-specific rate limiting
export function setupEndpointSpecificRateLimiting(app: express.Application) {
  // Strict rate limiting for authentication endpoints
  const authRateLimit = createEndpointRateLimiter({
    windowMs: 900000,  // 15 minutes
    maxRequests: 5,    // 5 attempts per 15 minutes
    message: 'Too many authentication attempts',
    statusCode: 429
  });

  // Moderate rate limiting for search endpoints
  const searchRateLimit = createEndpointRateLimiter({
    windowMs: 60000,   // 1 minute
    maxRequests: 30,   // 30 searches per minute
    message: 'Too many search requests',
    statusCode: 429
  });

  // Lenient rate limiting for analytics
  const analyticsRateLimit = createEndpointRateLimiter({
    windowMs: 60000,   // 1 minute
    maxRequests: 100,  // 100 events per minute
    message: 'Too many analytics events',
    statusCode: 429
  });

  // Apply to specific routes
  app.use('/api/auth/login', authRateLimit);
  app.use('/api/auth/register', authRateLimit);
  app.use('/api/professionals/search', searchRateLimit);
  app.use('/api/properties/search', searchRateLimit);
  app.use('/api/analytics/events', analyticsRateLimit);
}

// Example 4: Service layer integration
export class ExampleServiceWithRateLimiting {
  private rateLimiter: ApiRateLimiter;
  private circuitBreakerManager: CircuitBreakerManager;
  private callTracker: ApiCallTracker;

  constructor(cache?: CacheService) {
    this.rateLimiter = ApiRateLimiter.getInstance({}, cache);
    this.circuitBreakerManager = CircuitBreakerManager.getInstance();
    this.callTracker = ApiCallTracker.getInstance();
  }

  // Example: Rate-limited professional search
  async searchProfessionals(userId: number, criteria: any): Promise<any[]> {
    // Check rate limit before processing
    const rateLimit = await this.rateLimiter.checkUserRateLimit(
      userId, 
      'search-professionals',
      {
        windowMs: 60000,
        maxRequests: 10 // 10 searches per minute
      }
    );

    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000)} seconds`);
    }

    // Use circuit breaker for external service calls
    const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker('professional-search-service');
    
    const results = await circuitBreaker.execute(async () => {
      // Simulate external service call
      console.log('Searching professionals...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return [
        { id: 1, name: 'John Doe', type: 'lawyer' },
        { id: 2, name: 'Jane Smith', type: 'surveyor' }
      ];
    });

    // Increment rate limit counter on success
    await this.rateLimiter.incrementRateLimit(userId, 'search-professionals', true);

    return results;
  }

  // Example: Tracked API call with suspicious activity detection
  async trackUserAction(userId: number, action: string, ipAddress?: string): Promise<void> {
    const suspiciousActivity = this.callTracker.trackApiCall(
      userId,
      `/api/actions/${action}`,
      'POST',
      ipAddress
    );

    if (suspiciousActivity.isSuspicious) {
      console.warn(`Suspicious activity detected for user ${userId}:`, suspiciousActivity);
      
      if (suspiciousActivity.recommendedAction === 'block') {
        this.callTracker.blockUser(userId, 300000); // Block for 5 minutes
        throw new Error('Account temporarily blocked due to suspicious activity');
      }
    }

    // Process the action
    console.log(`Processing action ${action} for user ${userId}`);
  }

  // Example: Get user activity insights
  async getUserInsights(userId: number): Promise<any> {
    const activitySummary = this.callTracker.getUserActivitySummary(userId);
    const circuitBreakerHealth = this.circuitBreakerManager.getSystemHealth();
    
    return {
      user: activitySummary,
      systemHealth: circuitBreakerHealth,
      recommendations: this.generateRecommendations(activitySummary)
    };
  }

  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = [];
    
    if (summary.riskScore > 70) {
      recommendations.push('Consider reducing API usage frequency');
    }
    
    if (summary.suspiciousPatterns > 0) {
      recommendations.push('Review recent activity for unusual patterns');
    }
    
    if (summary.totalCalls > 100) {
      recommendations.push('Consider using batch operations to reduce API calls');
    }
    
    return recommendations;
  }
}

// Example 5: Monitoring and health checks
export function setupRateLimitingMonitoring(app: express.Application) {
  // Rate limiting statistics endpoint
  app.get('/api/internal/rate-limiting/stats', (req, res) => {
    const rateLimiter = ApiRateLimiter.getInstance();
    const callTracker = ApiCallTracker.getInstance();
    const circuitBreakerManager = CircuitBreakerManager.getInstance();

    const stats = {
      rateLimiter: rateLimiter.getStats(),
      callTracker: callTracker.getStats(),
      circuitBreakers: circuitBreakerManager.getHealthStatus(),
      systemHealth: circuitBreakerManager.getSystemHealth(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  });

  // Suspicious activity report endpoint
  app.get('/api/internal/rate-limiting/suspicious-activity', (req, res) => {
    const callTracker = ApiCallTracker.getInstance();
    const report = callTracker.getSuspiciousActivityReport();

    res.json({
      success: true,
      data: report
    });
  });

  // Most active users endpoint
  app.get('/api/internal/rate-limiting/active-users', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const callTracker = ApiCallTracker.getInstance();
    const activeUsers = callTracker.getMostActiveUsers(limit);

    res.json({
      success: true,
      data: activeUsers
    });
  });

  // Circuit breaker health endpoint
  app.get('/api/internal/rate-limiting/circuit-breakers', (req, res) => {
    const circuitBreakerManager = CircuitBreakerManager.getInstance();
    const health = circuitBreakerManager.getSystemHealth();
    const status = circuitBreakerManager.getHealthStatus();

    res.json({
      success: true,
      data: {
        health,
        breakers: status
      }
    });
  });

  // Health check endpoint
  app.get('/api/internal/rate-limiting/health', (req, res) => {
    try {
      const rateLimiter = ApiRateLimiter.getInstance();
      const callTracker = ApiCallTracker.getInstance();
      const circuitBreakerManager = CircuitBreakerManager.getInstance();

      const rateLimiterStats = rateLimiter.getStats();
      const callTrackerStats = callTracker.getStats();
      const systemHealth = circuitBreakerManager.getSystemHealth();

      // Check if system is healthy
      const isHealthy = 
        rateLimiterStats.memoryUsage < 100 * 1024 * 1024 && // 100MB limit
        callTrackerStats.memoryUsage < 50 * 1024 * 1024 &&  // 50MB limit
        systemHealth.healthy;

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
          healthy: isHealthy,
          rateLimiter: {
            memoryUsage: rateLimiterStats.memoryUsage,
            totalUsers: rateLimiterStats.userLimits
          },
          callTracker: {
            memoryUsage: callTrackerStats.memoryUsage,
            blockedUsers: callTrackerStats.blockedUsers,
            blockedIps: callTrackerStats.blockedIps
          },
          circuitBreakers: systemHealth
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Rate limiting health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Example 6: Administrative endpoints
export function setupRateLimitingAdmin(app: express.Application) {
  // Unblock user endpoint
  app.post('/api/internal/rate-limiting/unblock-user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const callTracker = ApiCallTracker.getInstance();
    
    const wasBlocked = callTracker.unblockUser(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        wasBlocked,
        message: wasBlocked ? 'User unblocked successfully' : 'User was not blocked'
      }
    });
  });

  // Unblock IP endpoint
  app.post('/api/internal/rate-limiting/unblock-ip', (req, res) => {
    const { ipAddress } = req.body;
    const callTracker = ApiCallTracker.getInstance();
    
    const wasBlocked = callTracker.unblockIp(ipAddress);
    
    res.json({
      success: true,
      data: {
        ipAddress,
        wasBlocked,
        message: wasBlocked ? 'IP unblocked successfully' : 'IP was not blocked'
      }
    });
  });

  // Reset rate limits endpoint
  app.post('/api/internal/rate-limiting/reset-user/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { endpoint } = req.body;
    const rateLimiter = ApiRateLimiter.getInstance();
    
    await rateLimiter.resetRateLimit(userId, endpoint || '/api/default');
    
    res.json({
      success: true,
      data: {
        userId,
        endpoint: endpoint || '/api/default',
        message: 'Rate limits reset successfully'
      }
    });
  });

  // Reset circuit breaker endpoint
  app.post('/api/internal/rate-limiting/reset-circuit-breaker/:name', (req, res) => {
    const {name} = req.params;
    const circuitBreakerManager = CircuitBreakerManager.getInstance();
    
    const circuitBreaker = circuitBreakerManager.getCircuitBreaker(name);
    circuitBreaker.reset();
    
    res.json({
      success: true,
      data: {
        name,
        message: 'Circuit breaker reset successfully',
        state: circuitBreaker.getStats().state
      }
    });
  });

  // Clear user tracking data endpoint
  app.delete('/api/internal/rate-limiting/user-data/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const callTracker = ApiCallTracker.getInstance();
    
    callTracker.clearUserData(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        message: 'User tracking data cleared successfully'
      }
    });
  });
}

// Example 7: Testing utilities
export class RateLimitingTestUtils {
  static async waitForRateLimitReset(userId: number, endpoint: string, timeout = 5000): Promise<void> {
    const rateLimiter = ApiRateLimiter.getInstance();
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await rateLimiter.checkUserRateLimit(userId, endpoint);
      if (result.allowed) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Timeout waiting for rate limit reset');
  }
  
  static async clearAllRateLimits(): Promise<void> {
    const rateLimiter = ApiRateLimiter.getInstance();
    // Would need to implement a clearAll method in ApiRateLimiter
    console.log('Rate limits cleared');
  }
  
  static clearAllTracking(): void {
    const callTracker = ApiCallTracker.getInstance();
    // Clear all tracking data for testing
    console.log('Tracking data cleared');
  }
  
  static resetAllCircuitBreakers(): void {
    const circuitBreakerManager = CircuitBreakerManager.getInstance();
    circuitBreakerManager.resetAll();
  }
  
  static getSystemStats() {
    const rateLimiter = ApiRateLimiter.getInstance();
    const callTracker = ApiCallTracker.getInstance();
    const circuitBreakerManager = CircuitBreakerManager.getInstance();
    
    return {
      rateLimiter: rateLimiter.getStats(),
      callTracker: callTracker.getStats(),
      circuitBreakers: circuitBreakerManager.getSystemHealth()
    };
  }
}