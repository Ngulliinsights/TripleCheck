/**
 * Middleware Exports
 */

export {
  validateBody,
  validateQuery,
  validateParams,
  validate,
} from './validation';

export {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  createRateLimiter,
} from './rate-limit';

export {
  createDeduplicationMiddleware,
  addRequestIdMiddleware,
  idempotencyMiddleware,
  deduplicationResponseMiddleware,
  type DeduplicationMiddlewareConfig,
  type DeduplicatedRequest,
} from './deduplication.middleware';

export {
  cacheResponse,
  invalidateCache,
} from './cache.middleware';

export {
  requireAuth,
} from './auth.middleware';

export {
  asyncHandler,
} from './error.middleware';

export {
  loggingMiddleware,
} from './logging.middleware';
