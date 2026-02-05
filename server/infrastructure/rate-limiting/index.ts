/**
 * Rate Limiting Infrastructure
 * 
 * This module provides comprehensive rate limiting, circuit breaking, and API call tracking
 * to prevent abuse, handle failures gracefully, and maintain system stability.
 */

// API Rate Limiter
export { 
  ApiRateLimiter, 
  apiRateLimiter,
  type RateLimitConfig,
  type RateLimitResult 
} from './ApiRateLimiter';

// Circuit Breaker
export { 
  CircuitBreaker,
  CircuitBreakerManager,
  circuitBreakerManager,
  CircuitBreakerState,
  type CircuitBreakerConfig,
  type CircuitBreakerStats
} from './CircuitBreaker';

// API Call Tracker
export { 
  ApiCallTracker,
  apiCallTracker,
  type ApiCallTrackerConfig
} from './ApiCallTracker';

// Middleware
export {
  createRateLimitingMiddleware,
  rateLimitCounterMiddleware,
  rateLimitHeadersMiddleware,
  createEndpointRateLimiter,
  type RateLimitingMiddlewareConfig,
  type RateLimitedRequest
} from '../middleware/rate-limiting.middleware';

// Re-export middleware for convenience
export { 
  createRateLimitingMiddleware as rateLimitingMiddleware 
} from '../middleware/rate-limiting.middleware';