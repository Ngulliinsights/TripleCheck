import { Request, Response, NextFunction } from 'express';

import { CacheService } from '../../core/src/cache'
import { ApiCallTracker } from '../infrastructure/rate-limiting/ApiCallTracker';
import { ApiRateLimiter, RateLimitConfig } from '../infrastructure/rate-limiting/ApiRateLimiter';
import { CircuitBreaker, CircuitBreakerManager } from '../infrastructure/rate-limiting/CircuitBreaker';

/**
 * Extended Request interface with rate limiting properties
 */
export interface RateLimitedRequest extends Request {
  rateLimiting?: {
    userLimit: any;
    globalLimit: any;
    endpointLimit: any;
    allowed: boolean;
    circuitBreakerName: string;
    suspiciousActivity: any;
  };
}

/**
 * Rate limiting middleware configuration
 */
export interface RateLimitingMiddlewareConfig {
  enableUserLimits: boolean;
  enableGlobalLimits: boolean;
  enableEndpointLimits: boolean;
  enableCircuitBreaker: boolean;
  enableCallTracking: boolean;
  skipPatterns: RegExp[];
  circuitBreakerConfig?: {
    failureThreshold: number;
    recoveryTimeout: number;
    requestTimeout: number;
  };
  rateLimitConfigs?: {
    user?: Partial<RateLimitConfig>;
    global?: Partial<RateLimitConfig>;
    endpoint?: Partial<RateLimitConfig>;
  };
}

/**
 * Create comprehensive rate limiting middleware
 */
export function createRateLimitingMiddleware(
  config: Partial<RateLimitingMiddlewareConfig> = {},
  cache?: CacheService
) {
  const fullConfig: RateLimitingMiddlewareConfig = {
    enableUserLimits: true,
    enableGlobalLimits: true,
    enableEndpointLimits: true,
    enableCircuitBreaker: true,
    enableCallTracking: true,
    skipPatterns: [
      /^\/api\/health$/,
      /^\/api\/internal\//,
      /^\/api\/metrics$/
    ],
    circuitBreakerConfig: {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      requestTimeout: 30000
    },
    ...config
  };

  // Initialize services
  const rateLimiter = ApiRateLimiter.getInstance({}, cache);
  const circuitBreakerManager = CircuitBreakerManager.getInstance();
  const callTracker = ApiCallTracker.getInstance();

  return async (req: RateLimitedRequest, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for certain patterns
      if (shouldSkipRateLimiting(req, fullConfig)) {
        return next();
      }

      const userId = req.session?.userId || 0;
      const endpoint = req.path;
      const ipAddress = getClientIpAddress(req);
      const userAgent = req.headers['user-agent'];

      // Initialize rate limiting info
      req.rateLimiting = {
        userLimit: null,
        globalLimit: null,
        endpointLimit: null,
        allowed: true,
        circuitBreakerName: `${endpoint}:${req.method}`,
        suspiciousActivity: null
      };

      // 1. Check API call tracking for suspicious activity
      if (fullConfig.enableCallTracking && userId > 0) {
        const suspiciousActivity = callTracker.trackApiCall(
          userId,
          endpoint,
          req.method,
          ipAddress,
          userAgent
        );

        req.rateLimiting.suspiciousActivity = suspiciousActivity;

        if (suspiciousActivity.isSuspicious && suspiciousActivity.recommendedAction === 'block') {
          return res.status(429).json({
            success: false,
            error: 'Suspicious activity detected',
            message: suspiciousActivity.reason,
            retryAfter: 300, // 5 minutes
            requestId: req.headers['x-request-id']
          });
        }

        // Check if request is allowed by call tracker
        if (!callTracker.isRequestAllowed(userId, endpoint, ipAddress)) {
          return res.status(429).json({
            success: false,
            error: 'Request rate exceeded',
            message: 'Too many requests detected. Please slow down.',
            retryAfter: 60,
            requestId: req.headers['x-request-id']
          });
        }
      }

      // 2. Check rate limits
      let rateLimitResult;
      
      if (userId > 0) {
        // Check combined rate limits for authenticated users
        rateLimitResult = await rateLimiter.checkCombinedRateLimits(
          userId,
          endpoint,
          fullConfig.rateLimitConfigs
        );
      } else {
        // Check global and endpoint limits for anonymous users
        const [globalResult, endpointResult] = await Promise.all([
          fullConfig.enableGlobalLimits ? 
            rateLimiter.checkGlobalRateLimit(endpoint, fullConfig.rateLimitConfigs?.global) :
            Promise.resolve({ allowed: true, remaining: 999, resetTime: new Date(), totalRequests: 0, windowStart: new Date() }),
          fullConfig.enableEndpointLimits ?
            rateLimiter.checkEndpointRateLimit(endpoint, fullConfig.rateLimitConfigs?.endpoint) :
            Promise.resolve({ allowed: true, remaining: 999, resetTime: new Date(), totalRequests: 0, windowStart: new Date() })
        ]);

        rateLimitResult = {
          user: { allowed: true, remaining: 999, resetTime: new Date(), totalRequests: 0, windowStart: new Date() },
          global: globalResult,
          endpoint: endpointResult,
          allowed: globalResult.allowed && endpointResult.allowed,
          mostRestrictive: globalResult.remaining < endpointResult.remaining ? 'global' : 'endpoint'
        };
      }

      // Store rate limit results
      req.rateLimiting.userLimit = rateLimitResult.user;
      req.rateLimiting.globalLimit = rateLimitResult.global;
      req.rateLimiting.endpointLimit = rateLimitResult.endpoint;
      req.rateLimiting.allowed = rateLimitResult.allowed;

      // Add rate limit headers
      addRateLimitHeaders(res, rateLimitResult);

      // Check if rate limit exceeded
      if (!rateLimitResult.allowed) {
        const mostRestrictive = rateLimitResult[rateLimitResult.mostRestrictive];
        const retryAfter = Math.ceil((mostRestrictive.resetTime.getTime() - Date.now()) / 1000);

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${rateLimitResult.mostRestrictive}`,
          retryAfter,
          requestId: req.headers['x-request-id']
        });
      }

      // 3. Check circuit breaker
      if (fullConfig.enableCircuitBreaker) {
        const circuitBreaker = circuitBreakerManager.getCircuitBreaker(
          req.rateLimiting.circuitBreakerName,
          fullConfig.circuitBreakerConfig
        );

        try {
          // Execute request through circuit breaker
          await circuitBreaker.execute(async () => {
            // Continue with request processing
            return new Promise<void>((resolve, reject) => {
              // Override res.end to capture response
              const originalEnd = res.end.bind(res);
              res.end = function(chunk?: any, encoding?: any) {
                // Check if response indicates failure
                if (res.statusCode >= 500) {
                  reject(new Error(`Server error: ${res.statusCode}`));
                } else {
                  resolve();
                }
                return originalEnd(chunk, encoding);
              };

              next();
            });
          });
        } catch (error) {
          // Circuit breaker is open or request failed
          return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            message: 'The service is experiencing issues. Please try again later.',
            circuitBreakerState: circuitBreaker.getStats().state,
            requestId: req.headers['x-request-id']
          });
        }
      } else {
        // Continue without circuit breaker
        next();
      }

    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // Continue with request on error to avoid blocking legitimate requests
      next();
    }
  };
}

/**
 * Middleware to increment rate limit counters after request completion
 */
export function rateLimitCounterMiddleware() {
  return (req: RateLimitedRequest, res: Response, next: NextFunction) => {
    // Store original end method
    const originalEnd = res.end.bind(res);

    // Override end method to increment counters
    res.end = function(chunk?: any, encoding?: any) {
      // Increment rate limit counters
      const userId = req.session?.userId;
      if (userId && req.rateLimiting?.allowed) {
        const rateLimiter = ApiRateLimiter.getInstance();
        const success = res.statusCode < 400;
        
        rateLimiter.incrementRateLimit(userId, req.path, success)
          .catch(error => console.error('Failed to increment rate limit:', error));
      }

      return originalEnd(chunk, encoding);
    };

    next();
  };
}

/**
 * Middleware to add rate limiting headers to response
 */
export function rateLimitHeadersMiddleware() {
  return (req: RateLimitedRequest, res: Response, next: NextFunction) => {
    if (req.rateLimiting) {
      const { userLimit, globalLimit, endpointLimit } = req.rateLimiting;
      
      // Add user rate limit headers
      if (userLimit) {
        res.setHeader('X-RateLimit-User-Limit', userLimit.remaining + userLimit.totalRequests);
        res.setHeader('X-RateLimit-User-Remaining', userLimit.remaining);
        res.setHeader('X-RateLimit-User-Reset', Math.ceil(userLimit.resetTime.getTime() / 1000));
      }

      // Add global rate limit headers
      if (globalLimit) {
        res.setHeader('X-RateLimit-Global-Limit', globalLimit.remaining + globalLimit.totalRequests);
        res.setHeader('X-RateLimit-Global-Remaining', globalLimit.remaining);
        res.setHeader('X-RateLimit-Global-Reset', Math.ceil(globalLimit.resetTime.getTime() / 1000));
      }

      // Add endpoint rate limit headers
      if (endpointLimit) {
        res.setHeader('X-RateLimit-Endpoint-Limit', endpointLimit.remaining + endpointLimit.totalRequests);
        res.setHeader('X-RateLimit-Endpoint-Remaining', endpointLimit.remaining);
        res.setHeader('X-RateLimit-Endpoint-Reset', Math.ceil(endpointLimit.resetTime.getTime() / 1000));
      }

      // Add circuit breaker status
      if (req.rateLimiting.circuitBreakerName) {
        const circuitBreakerManager = CircuitBreakerManager.getInstance();
        const circuitBreaker = circuitBreakerManager.getCircuitBreaker(req.rateLimiting.circuitBreakerName);
        res.setHeader('X-Circuit-Breaker-State', circuitBreaker.getStats().state);
      }
    }

    next();
  };
}

/**
 * Create endpoint-specific rate limiting middleware
 */
export function createEndpointRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId || 0;
    const rateLimiter = ApiRateLimiter.getInstance();

    try {
      const result = await rateLimiter.checkUserRateLimit(userId, req.path, config);

      // Add headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000));

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
        
        return res.status(config.statusCode || 429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: config.message || 'Too many requests',
          retryAfter,
          requestId: req.headers['x-request-id']
        });
      }

      // Increment counter after successful check
      await rateLimiter.incrementRateLimit(userId, req.path, true);
      next();

    } catch (error) {
      console.error('Endpoint rate limiter error:', error);
      next(); // Continue on error
    }
  };
}

// Helper functions

function shouldSkipRateLimiting(req: RateLimitedRequest, config: RateLimitingMiddlewareConfig): boolean {
  return config.skipPatterns.some(pattern => pattern.test(req.path));
}

function getClientIpAddress(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

function addRateLimitHeaders(res: Response, rateLimitResult: any): void {
  const mostRestrictive = rateLimitResult[rateLimitResult.mostRestrictive];
  
  res.setHeader('X-RateLimit-Limit', mostRestrictive.remaining + mostRestrictive.totalRequests);
  res.setHeader('X-RateLimit-Remaining', mostRestrictive.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(mostRestrictive.resetTime.getTime() / 1000));
  res.setHeader('X-RateLimit-Policy', rateLimitResult.mostRestrictive);
}