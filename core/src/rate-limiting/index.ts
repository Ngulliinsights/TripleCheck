/**
 * Rate Limiting Module
 * 
 * Comprehensive rate limiting system with multiple algorithms,
 * Redis and memory stores, circuit breaker patterns, and metrics collection
 */

// Core types and interfaces
export type {
  RateLimitResult,
  RateLimitConfig,
  RateLimitStore,
  RateLimitMetricsInterface,
  RateLimitMiddlewareOptions
} from './types';

// Algorithms
export { SlidingWindowStore } from './algorithms/sliding-window';
export { TokenBucketStore } from './algorithms/token-bucket';
export { FixedWindowStore } from './algorithms/fixed-window';

// Stores
export { MemoryRateLimitStore } from './stores/memory-store';
export { RedisRateLimitStore } from './stores/redis-store';

// Middleware
export { 
  rateLimitMiddleware, 
  rateLimitMiddlewareLegacy 
} from './middleware';

// Factory
export { 
  RateLimitFactory,
  createRateLimitFactory,
  createMemoryRateLimitFactory,
  createRedisRateLimitStore,
  type RateLimitFactoryOptions
} from './factory';

// Metrics
export {
  RateLimitMetricsCollector,
  getMetricsCollector,
  resetMetricsCollector,
  type RateLimitMetrics,
  type RateLimitEvent,
  type AlgorithmStats
} from './metrics';

// Convenience functions for common use cases
export function createApiRateLimit(redis?: any, options: { strict?: boolean; burst?: boolean } = {}) {
  const factory = redis 
    ? createRateLimitFactory(redis)
    : createMemoryRateLimitFactory();

  if (options.strict) {
    return {
      store: factory.createStore('sliding-window'),
      config: RateLimitFactory.configs.api.strict
    };
  }

  if (options.burst) {
    return {
      store: factory.createStore('token-bucket'),
      config: RateLimitFactory.configs.api.burst
    };
  }

  return {
    store: factory.createStore('fixed-window'),
    config: RateLimitFactory.configs.api.normal
  };
}

export function createAuthRateLimit(redis?: any, type: 'login' | 'signup' | 'resetPassword' = 'login') {
  const factory = redis 
    ? createRateLimitFactory(redis)
    : createMemoryRateLimitFactory();

  return {
    store: factory.createStore('fixed-window'),
    config: RateLimitFactory.configs.auth[type]
  };
}

export function createContentRateLimit(redis?: any, type: 'upload' | 'post' = 'post') {
  const factory = redis 
    ? createRateLimitFactory(redis)
    : createMemoryRateLimitFactory();

  const algorithm = type === 'upload' ? 'token-bucket' : 'sliding-window';
  
  return {
    store: factory.createStore(algorithm),
    config: RateLimitFactory.configs.content[type]
  };
}

// Default rate limiter for quick setup
export function createDefaultRateLimit(redis?: any) {
  return createApiRateLimit(redis);
}