/**
 * Rate Limiting Middleware
 * Uses express-rate-limit for robust rate limiting
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../infrastructure/observability/telemetry';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Rate limiter for AI/ML endpoints (more restrictive)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 AI requests per hour
  message: 'AI service rate limit exceeded',
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).user?.id,
    });

    res.status(429).json({
      error: 'AI service rate limit exceeded',
      message: 'Please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: 'Upload rate limit exceeded',
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Create custom rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        limit: options.max,
        window: options.windowMs,
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message || 'Too many requests',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
}

export default {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  createRateLimiter,
};
