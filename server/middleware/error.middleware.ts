/**
 * Comprehensive error handling middleware with detailed logging and monitoring
 * Provides consistent error responses and proper error categorization
 */

import { Request, Response, NextFunction } from 'express';
// Create basic error classes since the import path doesn't exist
class AppError extends Error {
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
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('VALIDATION_ERROR', message, 400, 'VALIDATION', details, correlationId);
    this.name = 'ValidationError';
  }

  static fromZodError(error: any, correlationId?: string): ValidationError {
    const details: Record<string, string[]> = {};
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
    }
    return new ValidationError('Validation failed', details, correlationId);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('AUTHENTICATION_ERROR', message, 401, 'AUTH', details, correlationId);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('AUTHORIZATION_ERROR', message, 403, 'AUTH', details, correlationId);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message: string, correlationId?: string) {
    super('NOT_FOUND', message, 404, 'CLIENT', undefined, correlationId);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('CONFLICT', message, 409, 'CLIENT', details, correlationId);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('RATE_LIMIT', message, 429, 'CLIENT', details, correlationId);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, correlationId?: string) {
    super('DATABASE_ERROR', message, 500, 'SYSTEM', details, correlationId);
    this.name = 'DatabaseError';
  }
}

// Utility functions
const generateCorrelationId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const isOperationalError = (error: Error): boolean => {
  return error instanceof AppError;
};

const shouldLogError = (error: Error): boolean => {
  return !(error instanceof AppError && error.statusCode < 500);
};

// Error response formatter
class ErrorResponseFormatter {
  static format(error: AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        correlationId: error.correlationId,
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
        validationErrors: error.details
      }
    };
  }
}

// Error factory
class ErrorFactory {
  static fromError(error: Error, correlationId?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(
      'INTERNAL_ERROR',
      error.message || 'An unexpected error occurred',
      500,
      'SYSTEM',
      { originalError: error.message },
      correlationId
    );
  }
}

// Constants
const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  GATEWAY_TIMEOUT: 504,
} as const;

const ErrorCategory = {
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  CLIENT: 'CLIENT',
  SYSTEM: 'SYSTEM',
  NETWORK: 'NETWORK',
} as const;

const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Enhanced request interface with correlation ID
interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

// Error logging interface
interface ErrorLogEntry {
  timestamp: string;
  correlationId: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  error: {
    name: string;
    message: string;
    code?: string;
    category?: string;
    statusCode?: number;
    stack?: string;
    details?: Record<string, unknown>;
  };
  requestBody?: unknown;
  requestHeaders?: Record<string, string>;
}

// Error metrics for monitoring
interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
  lastReset: string;
}

class ErrorMetricsCollector {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {},
    errorsByCode: {},
    errorsByStatusCode: {},
    lastReset: new Date().toISOString(),
  };

  recordError(error: AppError): void {
    this.metrics.totalErrors++;
    
    // Track by category
    const category = error.category || ErrorCategory.SYSTEM;
    this.metrics.errorsByCategory[category] = (this.metrics.errorsByCategory[category] || 0) + 1;
    
    // Track by error code
    this.metrics.errorsByCode[error.code] = (this.metrics.errorsByCode[error.code] || 0) + 1;
    
    // Track by status code
    this.metrics.errorsByStatusCode[error.statusCode] = (this.metrics.errorsByStatusCode[error.statusCode] || 0) + 1;
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByCode: {},
      errorsByStatusCode: {},
      lastReset: new Date().toISOString(),
    };
  }
}

// Global error metrics collector
const errorMetrics = new ErrorMetricsCollector();

/**
 * Correlation ID middleware - adds unique ID to each request
 */
export const correlationIdMiddleware = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  // Check if correlation ID already exists in headers
  const existingCorrelationId = req.headers['x-correlation-id'] as string;
  req.correlationId = existingCorrelationId || generateCorrelationId();
  
  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  next();
};

/**
 * Enhanced error logger with structured logging
 */
const logError = (error: Error, req: RequestWithCorrelation): void => {
  if (!shouldLogError(error)) {
    return;
  }

  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id, // Assuming user is attached to request
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    requestHeaders: {
      'content-type': req.headers['content-type'] || '',
      'authorization': req.headers.authorization ? '[REDACTED]' : '',
      'user-agent': req.headers['user-agent'] || '',
    },
  };

  // Add AppError specific details
  if (error instanceof AppError) {
    logEntry.error.code = error.code;
    logEntry.error.category = error.category;
    logEntry.error.statusCode = error.statusCode;
    logEntry.error.details = error.details;
  }

  // Add request body for non-GET requests (with sensitive data redaction)
  if (req.method !== 'GET' && req.body) {
    logEntry.requestBody = redactSensitiveData(req.body);
  }

  // Log based on error severity
  if (error instanceof AppError && error.statusCode < 500) {
    // Client errors - log as warning
    console.warn('Client Error:', JSON.stringify(logEntry, null, 2));
  } else {
    // Server errors - log as error
    console.error('Server Error:', JSON.stringify(logEntry, null, 2));
  }
};

/**
 * Redact sensitive data from request body for logging
 */
const redactSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'credit_card', 'ssn'];
  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  // Recursively redact nested objects
  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

/**
 * Handle different types of errors and convert to AppError
 */
const normalizeError = (error: Error, correlationId?: string): AppError => {
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError' || (error as any).issues) {
    return ValidationError.fromZodError(error, correlationId);
  }

  // Handle Drizzle/Database errors
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

  if (error.message.includes('not null constraint')) {
    return new ValidationError(
      'Required field is missing',
      { field: ['This field is required'] },
      correlationId
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token', undefined, correlationId);
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired', undefined, correlationId);
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return new RateLimitError(error.message, undefined, correlationId);
  }

  // Handle network/timeout errors
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return new AppError(
      ErrorCode.TIMEOUT,
      'Request timeout',
      HttpStatusCode.GATEWAY_TIMEOUT,
      ErrorCategory.NETWORK,
      { originalError: error.message },
      correlationId
    );
  }

  // Default to internal server error for unknown errors
  return ErrorFactory.fromError(error, correlationId);
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  // Normalize error to AppError
  const appError = normalizeError(error, req.correlationId);

  // Record error metrics
  errorMetrics.recordError(appError);

  // Log error with context
  logError(appError, req);

  // Don't send error response if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Format error response based on error type
  let errorResponse;
  
  if (appError instanceof ValidationError) {
    errorResponse = ErrorResponseFormatter.formatValidationError(appError);
  } else {
    errorResponse = ErrorResponseFormatter.format(appError);
  }

  // Add additional headers for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Error-Code', appError.code);
    res.setHeader('X-Error-Category', appError.category);
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`, req.correlationId);
  next(error);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation middleware wrapper
 */
export const validateRequest = (schema: any) => {
  return (req: RequestWithCorrelation, res: Response, next: NextFunction): void => {
    try {
      // Validate request body, query, and params
      const validationResult = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!validationResult.success) {
        const validationError = ValidationError.fromZodError(
          validationResult.error,
          req.correlationId
        );
        return next(validationError);
      }

      // Attach validated data to request
      req.body = validationResult.data.body;
      req.query = validationResult.data.query;
      req.params = validationResult.data.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Error metrics endpoint handler
 */
export const getErrorMetrics = (req: Request, res: Response): void => {
  const metrics = errorMetrics.getMetrics();
  res.json({
    success: true,
    data: metrics,
  });
};

/**
 * Reset error metrics endpoint handler
 */
export const resetErrorMetrics = (req: Request, res: Response): void => {
  errorMetrics.resetMetrics();
  res.json({
    success: true,
    message: 'Error metrics reset successfully',
  });
};

/**
 * Health check with error status
 */
export const healthCheck = (req: Request, res: Response): void => {
  const metrics = errorMetrics.getMetrics();
  const recentErrorRate = metrics.totalErrors; // In a real app, calculate rate over time window
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    errors: {
      total: metrics.totalErrors,
      recentRate: recentErrorRate,
      categories: metrics.errorsByCategory,
    },
  };

  // Consider unhealthy if too many recent errors
  if (recentErrorRate > 100) { // Threshold can be configurable
    health.status = 'degraded';
  }

  res.json(health);
};

// Export error metrics collector for external use
export { errorMetrics };

// Export error classes for use in other modules
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ErrorFactory,
} from '../../src/shared/utils/errors';