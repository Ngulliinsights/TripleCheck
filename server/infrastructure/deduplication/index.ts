/**
 * Request Deduplication Infrastructure
 * 
 * This module provides utilities for preventing race conditions and duplicate API requests
 * through intelligent request deduplication and idempotency key management.
 */

export { 
  RequestDeduplicator, 
  requestDeduplicator,
  type IdempotentRequest,
  type DeduplicationConfig 
} from './RequestDeduplicator';

export {
  createDeduplicationMiddleware,
  addRequestIdMiddleware,
  idempotencyMiddleware,
  deduplicationResponseMiddleware,
  type DeduplicationMiddlewareConfig,
  type DeduplicatedRequest
} from '../../middleware/deduplication.middleware';

// Re-export from middleware for convenience
export { 
  createDeduplicationMiddleware as deduplicationMiddleware 
} from '../../middleware/deduplication.middleware';