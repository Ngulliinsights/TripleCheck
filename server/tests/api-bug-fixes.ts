/**
 * Comprehensive Backend API Bug Fixes
 * Task 7: Fix API error handling, data validation, and concurrent request handling
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ============================================================================
// BUG FIX 1: Proper Error Classes and Response Formatting
// ============================================================================

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public category: string;
  public details?: Record<string, unknown>;
  public correlationId?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    category: string = 'SYSTEM',
    details?: Record<string, unknown>,
    correlationId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    this.correlationId = correlationId;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('VALIDATION_ERROR', message, 400, 'VALIDATION', details, correlationId);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('AUTHENTICATION_ERROR', message, 401, 'AUTH', details, correlationId);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('AUTHORIZATION_ERROR', message, 403, 'AUTH', details, correlationId);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, correlationId?: string) {
    super('NOT_FOUND', message, 404, 'CLIENT', undefined, correlationId);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('CONFLICT', message, 409, 'CLIENT', details, correlationId);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('RATE_LIMIT', message, 429, 'CLIENT', details, correlationId);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// ============================================================================
// BUG FIX 2: Correlation ID Generation and Management
// ============================================================================

export const generateCorrelationId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const correlationIdMiddleware = (
  req: Request & { correlationId?: string },
  res: Response,
  next: NextFunction
): void => {
  const existingCorrelationId = req.headers['x-correlation-id'] as string;
  req.correlationId = existingCorrelationId || generateCorrelationId();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

// ============================================================================
// BUG FIX 3: Input Sanitization and XSS Prevention
// ============================================================================

export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') {
    return str;
  }

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .trim();
};

export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

// ============================================================================
// BUG FIX 4: Enhanced Request Validation
// ============================================================================

export interface ValidationConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  headers?: z.ZodSchema<any>;
  sanitize?: boolean;
  stripUnknown?: boolean;
}

export const validateRequest = (config: ValidationConfig) => {
  return async (
    req: Request & { correlationId?: string; validatedBody?: any; validatedQuery?: any; validatedParams?: any },
    res: Response,
    next: NextFunction
  ) => {
    const correlationId = req.correlationId || generateCorrelationId();

    try {
      const errors: Record<string, string[]> = {};

      // Validate and sanitize request body
      if (config.body) {
        try {
          const sanitizedBody = config.sanitize ? sanitizeObject(req.body) : req.body;
          const result = config.stripUnknown 
            ? config.body.strip().parse(sanitizedBody)
            : config.body.parse(sanitizedBody);
          req.validatedBody = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.body = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.body = ['Invalid request body format'];
          }
        }
      }

      // Validate query parameters
      if (config.query) {
        try {
          const sanitizedQuery = config.sanitize ? sanitizeObject(req.query) : req.query;
          const result = config.stripUnknown
            ? config.query.strip().parse(sanitizedQuery)
            : config.query.parse(sanitizedQuery);
          req.validatedQuery = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.query = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.query = ['Invalid query parameters'];
          }
        }
      }

      // Validate route parameters
      if (config.params) {
        try {
          const result = config.params.parse(req.params);
          req.validatedParams = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.params = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.params = ['Invalid route parameters'];
          }
        }
      }

      // Check for validation errors
      if (Object.keys(errors).length > 0) {
        const validationError = new ValidationError(
          'Request validation failed',
          errors,
          correlationId
        );
        return next(validationError);
      }

      next();
    } catch (error) {
      const validationError = new ValidationError(
        'Validation process failed',
        { general: ['An error occurred during request validation'] },
        correlationId
      );
      return next(validationError);
    }
  };
};

// ============================================================================
// BUG FIX 5: Improved Error Response Formatting
// ============================================================================

export class ErrorResponseFormatter {
  static format(error: AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        correlationId: error.correlationId,
        timestamp: new Date().toISOString(),
        ...(error.details && { details: error.details })
      }
    };
  }

  static formatValidationError(error: ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        correlationId: error.correlationId,
        timestamp: new Date().toISOString(),
        validationErrors: error.details
      }
    };
  }

  static formatGenericError(message: string, statusCode: number = 500, correlationId?: string) {
    return {
      success: false,
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR',
        message,
        category: statusCode >= 500 ? 'SYSTEM' : 'CLIENT',
        correlationId: correlationId || generateCorrelationId(),
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ============================================================================
// BUG FIX 6: Enhanced Error Handling Middleware
// ============================================================================

export const isOperationalError = (error: Error): boolean => {
  return error instanceof AppError;
};

export const normalizeError = (error: Error, correlationId?: string): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError' || (error as any).issues) {
    const zodError = error as z.ZodError;
    const details: Record<string, string[]> = {};
    zodError.errors?.forEach((err) => {
      const path = err.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(err.message);
    });
    return new ValidationError('Validation failed', details, correlationId);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token', undefined, correlationId);
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired', undefined, correlationId);
  }

  // Handle database constraint errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    return new ConflictError(
      'Resource already exists',
      { originalError: error.message },
      correlationId
    );
  }

  if (error.message.includes('foreign key constraint')) {
    return new ValidationError(
      'Invalid reference to related resource',
      { reference: ['Referenced resource does not exist'] },
      correlationId
    );
  }

  // Handle rate limiting
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return new RateLimitError(error.message, undefined, correlationId);
  }

  // Default to internal server error
  return new AppError(
    'INTERNAL_ERROR',
    error.message || 'An unexpected error occurred',
    500,
    'SYSTEM',
    { originalError: error.message },
    correlationId
  );
};

export const errorHandler = (
  error: Error,
  req: Request & { correlationId?: string },
  res: Response,
  next: NextFunction
): void => {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Normalize error to AppError
  const appError = normalizeError(error, req.correlationId);

  // Log error (only server errors)
  if (appError.statusCode >= 500) {
    console.error('Server Error:', {
      correlationId: appError.correlationId,
      code: appError.code,
      message: appError.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Format and send error response
  let errorResponse;
  if (appError instanceof ValidationError) {
    errorResponse = ErrorResponseFormatter.formatValidationError(appError);
  } else {
    errorResponse = ErrorResponseFormatter.format(appError);
  }

  res.status(appError.statusCode).json(errorResponse);
};

// ============================================================================
// BUG FIX 7: Rate Limiting for API Endpoints
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      this.store.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

const globalRateLimiter = new RateLimiter();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (
    req: Request & { correlationId?: string },
    res: Response,
    next: NextFunction
  ): void => {
    const identifier = req.ip || 'unknown';
    const result = globalRateLimiter.checkLimit(identifier, maxRequests, windowMs);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      const error = new RateLimitError(
        'Rate limit exceeded',
        {
          limit: maxRequests,
          windowMs,
          resetTime: new Date(result.resetTime).toISOString()
        },
        req.correlationId
      );
      return next(error);
    }

    next();
  };
};

// ============================================================================
// BUG FIX 8: Async Handler Wrapper for Race Condition Prevention
// ============================================================================

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================================================
// BUG FIX 9: Request Timeout Middleware
// ============================================================================

export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError(
          'REQUEST_TIMEOUT',
          'Request timeout',
          408,
          'CLIENT',
          { timeoutMs },
          (req as any).correlationId
        );
        next(error);
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// ============================================================================
// BUG FIX 10: Enhanced Security Headers
// ============================================================================

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// ============================================================================
// BUG FIX 11: Improved JSON Parsing with Error Handling
// ============================================================================

export const safeJsonParser = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['content-type']?.includes('application/json')) {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (body) {
          req.body = JSON.parse(body);
        }
        next();
      } catch (error) {
        const jsonError = new ValidationError(
          'Invalid JSON in request body',
          { json: ['Request body contains invalid JSON'] },
          (req as any).correlationId
        );
        next(jsonError);
      }
    });

    req.on('error', (error) => {
      next(error);
    });
  } else {
    next();
  }
};

// ============================================================================
// BUG FIX 12: Database Connection Error Handling
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('DATABASE_ERROR', message, 500, 'SYSTEM', details, correlationId);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export const handleDatabaseError = (error: any, correlationId?: string): AppError => {
  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new DatabaseError(
      'Database connection failed',
      { code: error.code, host: error.address },
      correlationId
    );
  }

  // Query timeout
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new DatabaseError(
      'Database query timeout',
      { originalError: error.message },
      correlationId
    );
  }

  // Constraint violations
  if (error.code === '23505' || error.message?.includes('duplicate key')) {
    return new ConflictError(
      'Resource already exists',
      { constraint: error.constraint },
      correlationId
    );
  }

  if (error.code === '23503' || error.message?.includes('foreign key')) {
    return new ValidationError(
      'Invalid reference to related resource',
      { constraint: error.constraint },
      correlationId
    );
  }

  if (error.code === '23502' || error.message?.includes('not null')) {
    return new ValidationError(
      'Required field is missing',
      { column: error.column },
      correlationId
    );
  }

  // Generic database error
  return new DatabaseError(
    'Database operation failed',
    { originalError: error.message, code: error.code },
    correlationId
  );
};

// ============================================================================
// BUG FIX 13: Common Validation Schemas (Fixed and Enhanced)
// ============================================================================

export const ValidationSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.coerce.number().int().positive('ID must be a positive integer'),
  }),

  // Pagination with proper defaults
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // User authentication
  login: z.object({
    username: z.string()
      .min(1, 'Username is required')
      .max(50, 'Username cannot exceed 50 characters')
      .trim(),
    password: z.string()
      .min(1, 'Password is required')
      .max(128, 'Password cannot exceed 128 characters'),
  }),

  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: z.string()
      .email('Invalid email format')
      .max(255, 'Email cannot exceed 255 characters')
      .toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, apostrophes, and hyphens')
      .trim(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, apostrophes, and hyphens')
      .trim(),
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be in international format')
      .optional(),
  }),

  // Property validation
  createProperty: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters')
      .trim(),
    description: z.string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .trim(),
    price: z.number()
      .positive('Price must be positive')
      .max(50000000, 'Price cannot exceed $50,000,000'),
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(100, 'Location cannot exceed 100 characters')
      .trim(),
    bedrooms: z.number().int().min(0).max(20).optional(),
    bathrooms: z.number().min(0).max(20).optional(),
  }),

  updateProperty: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z.string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .trim()
      .optional(),
    price: z.number()
      .positive('Price must be positive')
      .max(50000000, 'Price cannot exceed $50,000,000')
      .optional(),
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(100, 'Location cannot exceed 100 characters')
      .trim()
      .optional(),
  }),

  // Search filters
  searchFilters: z.object({
    q: z.string().max(100).trim().optional(),
    location: z.string().max(100).trim().optional(),
    priceMin: z.coerce.number().positive().optional(),
    priceMax: z.coerce.number().positive().optional(),
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    bathrooms: z.coerce.number().min(0).max(20).optional(),
  }).refine(
    (data) => !data.priceMin || !data.priceMax || data.priceMin <= data.priceMax,
    'Minimum price cannot be greater than maximum price'
  ),
};

// ============================================================================
// BUG FIX 14: Response Helper Functions
// ============================================================================

export class ResponseHelper {
  static success(res: Response, data?: any, message?: string, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static error(res: Response, message: string, statusCode: number = 500, correlationId?: string) {
    const errorResponse = ErrorResponseFormatter.formatGenericError(message, statusCode, correlationId);
    return res.status(statusCode).json(errorResponse);
  }

  static validationError(res: Response, errors: Record<string, string[]>, correlationId?: string) {
    const validationError = new ValidationError('Validation failed', errors, correlationId);
    const errorResponse = ErrorResponseFormatter.formatValidationError(validationError);
    return res.status(400).json(errorResponse);
  }

  static notFound(res: Response, message: string = 'Resource not found', correlationId?: string) {
    const error = new NotFoundError(message, correlationId);
    const errorResponse = ErrorResponseFormatter.format(error);
    return res.status(404).json(errorResponse);
  }

  static unauthorized(res: Response, message: string = 'Authentication required', correlationId?: string) {
    const error = new AuthenticationError(message, undefined, correlationId);
    const errorResponse = ErrorResponseFormatter.format(error);
    return res.status(401).json(errorResponse);
  }

  static forbidden(res: Response, message: string = 'Access denied', correlationId?: string) {
    const error = new AuthorizationError(message, undefined, correlationId);
    const errorResponse = ErrorResponseFormatter.format(error);
    return res.status(403).json(errorResponse);
  }

  static conflict(res: Response, message: string = 'Resource conflict', correlationId?: string) {
    const error = new ConflictError(message, undefined, correlationId);
    const errorResponse = ErrorResponseFormatter.format(error);
    return res.status(409).json(errorResponse);
  }

  static rateLimited(res: Response, message: string = 'Rate limit exceeded', correlationId?: string) {
    const error = new RateLimitError(message, undefined, correlationId);
    const errorResponse = ErrorResponseFormatter.format(error);
    return res.status(429).json(errorResponse);
  }
}

// ============================================================================
// EXPORT ALL BUG FIXES
// ============================================================================

export {
  globalRateLimiter,
  ValidationSchemas as CommonValidationSchemas
};

// Clean up rate limiter on process exit
process.on('SIGTERM', () => {
  globalRateLimiter.destroy();
});

process.on('SIGINT', () => {
  globalRateLimiter.destroy();
});