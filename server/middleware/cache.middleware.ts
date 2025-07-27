import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheKeys, CacheOptions } from '../cache/CacheService';
import { Logger } from '../infrastructure/monitoring/logger';

export interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  tags?: string[] | ((req: Request) => string[]);
  varyBy?: string[]; // Headers to vary cache by (e.g., ['user-agent', 'accept-language'])
  skipCache?: (req: Request) => boolean;
  onHit?: (key: string, data: any) => void;
  onMiss?: (key: string) => void;
  onError?: (error: Error, key: string) => void;
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
  etag?: string;
}

const logger = new Logger('CacheMiddleware');

/**
 * Cache middleware for API responses
 */
export function cacheResponse(options: CacheMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition is not met
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req, options.varyBy);

    try {
      // Try to get cached response
      const cachedResponse = await cacheService.get<CachedResponse>(cacheKey);

      if (cachedResponse) {
        // Cache hit
        if (options.onHit) {
          options.onHit(cacheKey, cachedResponse);
        }

        // Check if cached response is still valid
        if (isResponseValid(cachedResponse, req)) {
          // Set cached headers
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });

          // Set cache headers
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);
          
          // Handle ETag for conditional requests
          if (cachedResponse.etag) {
            res.setHeader('ETag', cachedResponse.etag);
            
            // Check if client has the same version
            if (req.headers['if-none-match'] === cachedResponse.etag) {
              return res.status(304).end();
            }
          }

          return res.status(cachedResponse.statusCode).json(cachedResponse.body);
        }
      }

      // Cache miss - continue to route handler
      if (options.onMiss) {
        options.onMiss(cacheKey);
      }

      // Intercept response to cache it
      const originalJson = res.json;
      const originalStatus = res.status;
      let statusCode = 200;

      // Override status method to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Override json method to cache response
      res.json = function(body: any) {
        // Only cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          // Check caching condition
          if (!options.condition || options.condition(req, res)) {
            cacheResponseData(cacheKey, statusCode, res.getHeaders(), body, options)
              .catch(error => {
                logger.error(`Failed to cache response for key: ${cacheKey}`, error);
                if (options.onError) {
                  options.onError(error, cacheKey);
                }
              });
          }
        }

        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error for key: ${cacheKey}`, error);
      if (options.onError) {
        options.onError(error as Error, cacheKey);
      }
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(options: {
  keys?: string[] | ((req: Request) => string[]);
  tags?: string[] | ((req: Request) => string[]);
  pattern?: string | ((req: Request) => string);
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to invalidate cache after successful response
    res.json = function(body: any) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCacheEntries(req, options)
          .catch(error => {
            logger.error('Cache invalidation error', error);
          });
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Generate default cache key based on request
 */
function generateDefaultCacheKey(req: Request, varyBy?: string[]): string {
  const baseKey = `${req.method}:${req.path}`;
  const queryString = new URLSearchParams(req.query as any).toString();
  
  let varyString = '';
  if (varyBy && varyBy.length > 0) {
    const varyValues = varyBy.map(header => {
      const value = req.headers[header.toLowerCase()];
      return `${header}:${value || ''}`;
    }).join('|');
    varyString = `|vary:${varyValues}`;
  }

  return `api:${baseKey}${queryString ? `?${queryString}` : ''}${varyString}`;
}

/**
 * Check if cached response is still valid
 */
function isResponseValid(cachedResponse: CachedResponse, req: Request): boolean {
  // Check if response has expired (basic TTL check is handled by Redis)
  // Additional validation logic can be added here
  
  // Check conditional headers
  if (req.headers['cache-control']?.includes('no-cache')) {
    return false;
  }

  return true;
}

/**
 * Cache response data
 */
async function cacheResponseData(
  key: string,
  statusCode: number,
  headers: any,
  body: any,
  options: CacheMiddlewareOptions
): Promise<void> {
  try {
    // Generate ETag for response
    const etag = generateETag(body);

    const cachedResponse: CachedResponse = {
      statusCode,
      headers: {
        'content-type': headers['content-type'] || 'application/json',
        'etag': etag,
        ...extractCacheableHeaders(headers)
      },
      body,
      timestamp: Date.now(),
      etag
    };

    const cacheOptions: CacheOptions = {
      ttl: options.ttl,
      tags: typeof options.tags === 'function' 
        ? options.tags({ path: key } as Request)
        : options.tags
    };

    await cacheService.set(key, cachedResponse, cacheOptions);
  } catch (error) {
    logger.error(`Failed to cache response for key: ${key}`, error);
    throw error;
  }
}

/**
 * Invalidate cache entries based on options
 */
async function invalidateCacheEntries(req: Request, options: {
  keys?: string[] | ((req: Request) => string[]);
  tags?: string[] | ((req: Request) => string[]);
  pattern?: string | ((req: Request) => string);
}): Promise<void> {
  try {
    // Invalidate by keys
    if (options.keys) {
      const keys = typeof options.keys === 'function' ? options.keys(req) : options.keys;
      for (const key of keys) {
        await cacheService.delete(key);
      }
      logger.info(`Invalidated cache keys: ${keys.join(', ')}`);
    }

    // Invalidate by tags
    if (options.tags) {
      const tags = typeof options.tags === 'function' ? options.tags(req) : options.tags;
      const deletedCount = await cacheService.invalidateByTags(tags);
      logger.info(`Invalidated ${deletedCount} cache entries for tags: ${tags.join(', ')}`);
    }

    // Invalidate by pattern (would require additional Redis commands)
    if (options.pattern) {
      const pattern = typeof options.pattern === 'function' ? options.pattern(req) : options.pattern;
      logger.info(`Pattern-based invalidation requested: ${pattern}`);
      // Implementation would require SCAN command and pattern matching
    }
  } catch (error) {
    logger.error('Cache invalidation error', error);
    throw error;
  }
}

/**
 * Extract cacheable headers from response headers
 */
function extractCacheableHeaders(headers: any): Record<string, string> {
  const cacheableHeaders: Record<string, string> = {};
  
  const allowedHeaders = [
    'content-type',
    'content-encoding',
    'content-language',
    'last-modified',
    'expires',
    'cache-control'
  ];

  for (const header of allowedHeaders) {
    if (headers[header]) {
      cacheableHeaders[header] = headers[header];
    }
  }

  return cacheableHeaders;
}

/**
 * Generate ETag for response body
 */
function generateETag(body: any): string {
  const crypto = require('crypto');
  const content = typeof body === 'string' ? body : JSON.stringify(body);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

// Predefined cache configurations for common use cases
export const CacheConfigurations = {
  // Short-term cache for frequently changing data
  shortTerm: {
    ttl: 300, // 5 minutes
  },

  // Medium-term cache for moderately changing data
  mediumTerm: {
    ttl: 1800, // 30 minutes
  },

  // Long-term cache for rarely changing data
  longTerm: {
    ttl: 3600, // 1 hour
  },

  // Extended cache for static-like data
  extended: {
    ttl: 86400, // 24 hours
  },

  // Property-specific cache configuration
  properties: {
    ttl: 1800, // 30 minutes
    tags: ['properties'],
    keyGenerator: (req: Request) => {
      const { page = 1, limit = 20, ...filters } = req.query;
      const filterString = JSON.stringify(filters);
      return CacheKeys.properties(`page:${page}:limit:${limit}:filters:${filterString}`);
    }
  },

  // User-specific cache configuration
  users: {
    ttl: 3600, // 1 hour
    tags: ['users'],
    keyGenerator: (req: Request) => {
      const userId = req.params.id || req.params.userId;
      return CacheKeys.user(parseInt(userId));
    }
  },

  // Search results cache configuration
  search: {
    ttl: 900, // 15 minutes
    tags: ['search', 'properties'],
    keyGenerator: (req: Request) => {
      const query = JSON.stringify(req.query);
      return CacheKeys.searchResults(query);
    }
  },

  // Trust score cache configuration
  trustScore: {
    ttl: 1800, // 30 minutes
    tags: ['trust'],
    keyGenerator: (req: Request) => {
      const userId = req.params.userId || req.params.id;
      return CacheKeys.trustScore(userId);
    }
  }
};

export { cacheResponse as default };