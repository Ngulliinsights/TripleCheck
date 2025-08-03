/**
 * Centralized error handling middleware for consistent error responses
 * Integrates with existing error infrastructure and provides standardized API responses
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ErrorFactory,
  ErrorResponseFormatter,
  HttpStatusCode,
  ErrorCategory,
  ErrorCode,
  isOperationalError,
  shouldLogError,
  generateCorrelationId,
} from '../../src/shared/utils/errors';

// Enhanced request interface with correlation ID
interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

// API Response interface for consistent responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
  metadata?: {
    totalCount?: number;
    page?: number;
    limit?: number;
    filters?: Record<string, unknown>;
    verificationStatus?: string;
    riskLevel?: string;
    fraudDetectionPerformed?: boolean;
    requiresManualReview?: boolean;
  };
}

// Error response interface
interface ErrorApiResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    category: string;
    details?: Record<string, unknown>;
    timestamp: string;
    correlationId?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

// Constants for consistent error handling
const ERROR_CONSTANTS = {
  HTTP_STATUS: {
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
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },
  MESSAGES: {
    VALIDATION_FAILED: "Invalid data provided",
    USERNAME_EXISTS: "Username already exists",
    INVALID_CREDENTIALS: "Invalid username or password",
    AUTH_REQUIRED: "Authentication required",
    USER_NOT_FOUND: "User not found",
    PROPERTY_NOT_FOUND: "Property not found",
    REGISTRATION_FAILED: "Registration failed",
    LOGIN_FAILED: "Login failed",
    LOGOUT_FAILED: "Logout failed",
    REVIEW_CREATION_FAILED: "Failed to create review",
    INVALID_PROPERTY_ID: "Invalid property ID",
    VERIFICATION_ERROR: "Error retrieving verification status",
    SEARCH_QUERY_REQUIRED: "Search query is required",
    LOCATION_SEARCH_FAILED: "Failed to search locations",
    INVALID_SEARCH_FILTERS: "Invalid search filters",
    PROPERTY_SEARCH_FAILED: "Failed to search properties",
    DATABASE_ERROR: "Database operation failed",
    AI_VERIFICATION_FAILED: "AI verification process failed",
    INTERNAL_ERROR: "An unexpected error occurred",
    SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  },
} as const;

/**
 * Enhanced error logger with structured logging
 */
const logError = (error: Error, req: RequestWithCorrelation): void => {
  if (!shouldLogError(error)) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
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
    logEntry.error = {
      ...logEntry.error,
      code: error.code,
      category: error.category,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Add request body for non-GET requests (with sensitive data redaction)
  if (req.method !== 'GET' && req.body) {
    (logEntry as any).requestBody = redactSensitiveData(req.body);
  }

  // Log based on error severity
  if (error instanceof AppError && error.statusCode < 500) {
    console.warn('Client Error:', JSON.stringify(logEntry, null, 2));
  } else {
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
 * Handle different types of database errors with specific detection
 */
const handleDatabaseError = (error: unknown, correlationId?: string): DatabaseError => {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Check for common database constraint violations
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return new DatabaseError(
        'A record with this information already exists',
        ErrorCode.DUPLICATE_RECORD,
        { originalError: error.message },
        correlationId
      );
    }

    // Handle foreign key constraint violations
    if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      return new DatabaseError(
        'Referenced record does not exist',
        ErrorCode.CONSTRAINT_VIOLATION,
        { originalError: error.message },
        correlationId
      );
    }

    // Handle not null constraint violations
    if (errorMessage.includes('not null constraint') || errorMessage.includes('required')) {
      return new DatabaseError(
        'Required fields are missing',
        ErrorCode.MISSING_REQUIRED_FIELD,
        { originalError: error.message },
        correlationId
      );
    }

    // Handle connection errors
    if (errorMessage.includes('connect') || errorMessage.includes('econnrefused')) {
      return new DatabaseError(
        'Database connection failed',
        ErrorCode.DATABASE_CONNECTION_FAILED,
        { originalError: error.message },
        correlationId
      );
    }
  }

  // Use the existing DatabaseError.fromDrizzleError for comprehensive handling
  return DatabaseError.fromDrizzleError(error, correlationId);
};

/**
 * Handle validation errors with standardized formatting
 */
const processValidationError = (error: unknown, correlationId?: string): ValidationError => {
  if (error instanceof ValidationError) {
    return error;
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return ValidationError.fromZodError(error, correlationId);
  }

  // Handle generic validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return new ValidationError(error.message, {}, correlationId);
  }

  // Default validation error
  return new ValidationError(
    ERROR_CONSTANTS.MESSAGES.VALIDATION_FAILED,
    {},
    correlationId
  );
};

/**
 * Normalize different error types to AppError
 */
const normalizeError = (error: Error, correlationId?: string): AppError => {
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError || error.name === 'ZodError') {
    return processValidationError(error, correlationId);
  }

  // Handle database errors with specific detection
  if (isDatabaseError(error)) {
    return handleDatabaseError(error, correlationId);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token', ErrorCode.TOKEN_INVALID, correlationId);
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired', ErrorCode.TOKEN_EXPIRED, correlationId);
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return new RateLimitError(error.message, undefined, correlationId);
  }

  // Handle timeout errors
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

  // Handle file upload errors
  if (error.message.includes('Multer') || error.message.includes('upload') || error.message.includes('file')) {
    return new ValidationError(
      'File upload failed',
      { file: ['Please check your file and try again'] },
      correlationId
    );
  }

  // Use ErrorFactory for comprehensive error handling
  return ErrorFactory.fromError(error, correlationId);
};

/**
 * Check if error is database-related
 */
const isDatabaseError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('constraint') ||
    message.includes('duplicate') ||
    message.includes('foreign key') ||
    message.includes('not null') ||
    message.includes('drizzle') ||
    message.includes('postgres') ||
    message.includes('connection') ||
    error.name.includes('Database')
  );
};

/**
 * Format error response based on error type
 */
const formatErrorResponse = (appError: AppError): ErrorApiResponse => {
  const baseResponse: ErrorApiResponse = {
    success: false,
    message: appError.message,
    error: {
      code: appError.code,
      category: appError.category,
      details: appError.details,
      timestamp: appError.timestamp,
      correlationId: appError.correlationId,
    },
  };

  // Add field-specific errors for validation errors
  if (appError instanceof ValidationError) {
    baseResponse.errors = Object.entries(appError.fieldErrors).flatMap(([field, messages]) =>
      messages.map(message => ({
        field,
        message,
        code: 'VALIDATION_ERROR',
      }))
    );
  }

  return baseResponse;
};

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
 * Main centralized error handling middleware
 * Provides consistent error responses across all routes
 */
export const centralizedErrorHandler = (
  error: Error,
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  // Normalize error to AppError
  const appError = normalizeError(error, req.correlationId);

  // Log error with context
  logError(appError, req);

  // Don't send error response if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Format error response
  const errorResponse = formatErrorResponse(appError);

  // Add additional headers for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Error-Code', appError.code);
    res.setHeader('X-Error-Category', appError.category);
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Database error handler specifically for legacy handleDrizzleError compatibility
 * Provides consistent error responses for database operations
 */
export const handleDrizzleError = (
  error: unknown,
  res: Response,
  defaultMessage: string,
  correlationId?: string
): void => {
  const dbError = handleDatabaseError(error, correlationId);
  
  // Log the error
  console.error('Database operation error:', {
    error: dbError.toJSON(),
    defaultMessage,
    timestamp: new Date().toISOString(),
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(dbError);
  res.status(dbError.statusCode).json(errorResponse);
};

/**
 * Validation error handler for consistent validation error responses
 */
export const handleValidationError = (
  error: unknown,
  res: Response,
  correlationId?: string
): void => {
  const validationError = processValidationError(error, correlationId);
  
  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(validationError);
  res.status(validationError.statusCode).json(errorResponse);
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
 * Success response helper for consistent API responses
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  metadata?: ApiResponse['metadata']
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    metadata,
  };
};

/**
 * Error response helper for consistent error responses
 */
export const createErrorResponse = (
  message: string,
  errors?: Array<{ field: string; message: string; code?: string }>
): ErrorApiResponse => {
  return {
    success: false,
    message,
    errors,
  };
};

// Export constants for use in other modules
export { ERROR_CONSTANTS };

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