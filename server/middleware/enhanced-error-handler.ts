import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { CacheService } from '../infrastructure/cache/CacheService';

/**
 * Enhanced error types for better error categorization
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TRUST_SCORE_ERROR = 'TRUST_SCORE_ERROR',
  FRAUD_DETECTION_ERROR = 'FRAUD_DETECTION_ERROR',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  ANALYTICS_ERROR = 'ANALYTICS_ERROR',
  PROFESSIONAL_SERVICE_ERROR = 'PROFESSIONAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Enhanced error class with additional context
 */
export class EnhancedError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly userId?: number;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly service?: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    options: {
      requestId?: string;
      userId?: number;
      context?: Record<string, any>;
      service?: string;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'EnhancedError';
    this.type = type;
    this.statusCode = statusCode;
    this.requestId = options.requestId;
    this.userId = options.userId;
    this.context = options.context;
    this.timestamp = new Date();
    this.service = options.service;
    this.retryable = options.retryable || false;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnhancedError);
    }
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      requestId: this.requestId,
      userId: this.userId,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      service: this.service,
      retryable: this.retryable,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION_ERROR:
        return 'The provided data is invalid. Please check your input and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please log in and try again.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT_ERROR:
        return 'This action conflicts with the current state. Please refresh and try again.';
      case ErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorType.TRUST_SCORE_ERROR:
        return 'Trust score verification failed. Please contact support if this persists.';
      case ErrorType.FRAUD_DETECTION_ERROR:
        return 'This action has been flagged for security review. Please contact support.';
      case ErrorType.COMMUNICATION_ERROR:
        return 'Communication service is temporarily unavailable. Please try again later.';
      case ErrorType.ANALYTICS_ERROR:
        return 'Analytics service is temporarily unavailable. Please try again later.';
      case ErrorType.PROFESSIONAL_SERVICE_ERROR:
        return 'Professional service is temporarily unavailable. Please try again later.';
      case ErrorType.DATABASE_ERROR:
        return 'Database service is temporarily unavailable. Please try again later.';
      case ErrorType.EXTERNAL_SERVICE_ERROR:
        return 'External service is temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}

/**
 * Error monitoring and alerting service
 */
export class ErrorMonitoringService {
  private cache: CacheService;
  private errorCounts = new Map<string, number>();
  private readonly ALERT_THRESHOLD = 10; // Alert after 10 errors of same type in 5 minutes
  private readonly MONITORING_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
    
    // Clean up error counts periodically
    setInterval(() => this.cleanupErrorCounts(), 60000); // Every minute
  }

  /**
   * Record an error for monitoring
   */
  async recordError(error: EnhancedError): Promise<void> {
    const errorKey = `${error.type}:${error.service || 'unknown'}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Check if we should alert
    if (currentCount + 1 >= this.ALERT_THRESHOLD) {
      await this.sendAlert(error, currentCount + 1);
    }

    // Store error details in cache for analysis
    const cacheKey = `error:${error.requestId || uuidv4()}`;
    await this.cache.set(cacheKey, error.toJSON(), { ttl: 3600 }); // 1 hour
  }

  /**
   * Send alert for high error rates
   */
  private async sendAlert(error: EnhancedError, count: number): Promise<void> {
    // In a real implementation, this would send alerts to monitoring systems
    console.error(`🚨 HIGH ERROR RATE ALERT: ${error.type} in ${error.service || 'unknown'} service - ${count} errors in ${this.MONITORING_WINDOW / 60000} minutes`);
    
    // Could integrate with services like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - DataDog
    // - Sentry
  }

  /**
   * Clean up old error counts
   */
  private cleanupErrorCounts(): void {
    // Reset error counts every monitoring window
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

/**
 * Request ID middleware to track requests across services
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  // Add to request object for easy access
  (req as any).requestId = requestId;
  
  next();
};

/**
 * Enhanced error handler middleware
 */
export class EnhancedErrorHandler {
  private errorMonitoring: ErrorMonitoringService;
  private isDevelopment: boolean;

  constructor(cache?: CacheService) {
    this.errorMonitoring = new ErrorMonitoringService(cache);
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Main error handling middleware
   */
  handle = async (error: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Generate request ID if not present
    const requestId = (req as any).requestId || req.headers['x-request-id'] as string || uuidv4();
    const userId = (req as any).user?.id;

    // Convert to EnhancedError if not already
    let enhancedError: EnhancedError;
    if (error instanceof EnhancedError) {
      enhancedError = error;
      if (!enhancedError.requestId) {
        enhancedError = new EnhancedError(
          enhancedError.message,
          enhancedError.type,
          enhancedError.statusCode,
          {
            ...enhancedError,
            requestId,
            userId,
          }
        );
      }
    } else {
      enhancedError = this.convertToEnhancedError(error, requestId, userId, req);
    }

    // Record error for monitoring
    await this.errorMonitoring.recordError(enhancedError);

    // Log error with structured format
    this.logError(enhancedError, req);

    // Send response
    this.sendErrorResponse(enhancedError, res);
  };

  /**
   * Convert regular error to EnhancedError
   */
  private convertToEnhancedError(
    error: Error,
    requestId: string,
    userId?: number,
    req?: Request
  ): EnhancedError {
    let type = ErrorType.INTERNAL_SERVER_ERROR;
    let statusCode = 500;
    let service = 'unknown';

    // Determine error type based on error message or properties
    if (error.message.includes('validation')) {
      type = ErrorType.VALIDATION_ERROR;
      statusCode = 400;
    } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      type = ErrorType.AUTHENTICATION_ERROR;
      statusCode = 401;
    } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
      type = ErrorType.AUTHORIZATION_ERROR;
      statusCode = 403;
    } else if (error.message.includes('not found')) {
      type = ErrorType.NOT_FOUND_ERROR;
      statusCode = 404;
    } else if (error.message.includes('conflict') || error.message.includes('duplicate')) {
      type = ErrorType.CONFLICT_ERROR;
      statusCode = 409;
    } else if (error.message.includes('rate limit')) {
      type = ErrorType.RATE_LIMIT_ERROR;
      statusCode = 429;
    } else if (error.message.includes('trust') || error.message.includes('Trust')) {
      type = ErrorType.TRUST_SCORE_ERROR;
      statusCode = 403;
      service = 'trust-integration';
    } else if (error.message.includes('fraud') || error.message.includes('Fraud')) {
      type = ErrorType.FRAUD_DETECTION_ERROR;
      statusCode = 403;
      service = 'fraud-detection';
    } else if (error.message.includes('communication') || error.message.includes('message')) {
      type = ErrorType.COMMUNICATION_ERROR;
      statusCode = 503;
      service = 'communication';
    } else if (error.message.includes('analytics')) {
      type = ErrorType.ANALYTICS_ERROR;
      statusCode = 503;
      service = 'analytics';
    } else if (error.message.includes('professional')) {
      type = ErrorType.PROFESSIONAL_SERVICE_ERROR;
      statusCode = 503;
      service = 'professional';
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      type = ErrorType.DATABASE_ERROR;
      statusCode = 503;
      service = 'database';
    }

    // Determine service from request path
    if (req?.path && service === 'unknown') {
      if (req.path.includes('/api/trust')) service = 'trust-integration';
      else if (req.path.includes('/api/communication')) service = 'communication';
      else if (req.path.includes('/api/analytics')) service = 'analytics';
      else if (req.path.includes('/api/professionals')) service = 'professional';
      else if (req.path.includes('/api/properties')) service = 'property';
      else if (req.path.includes('/api/auth')) service = 'auth';
      else if (req.path.includes('/api/users')) service = 'user';
    }

    return new EnhancedError(
      error.message,
      type,
      statusCode,
      {
        requestId,
        userId,
        service,
        context: {
          path: req?.path,
          method: req?.method,
          userAgent: req?.headers['user-agent'],
          ip: req?.ip,
        },
        cause: error,
        retryable: this.isRetryableError(type),
      }
    );
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.DATABASE_ERROR,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      ErrorType.COMMUNICATION_ERROR,
      ErrorType.ANALYTICS_ERROR,
      ErrorType.PROFESSIONAL_SERVICE_ERROR,
    ];
    return retryableTypes.includes(type);
  }

  /**
   * Log error with structured format
   */
  private logError(error: EnhancedError, req: Request): void {
    const logData = {
      level: 'error',
      timestamp: error.timestamp.toISOString(),
      requestId: error.requestId,
      userId: error.userId,
      type: error.type,
      service: error.service,
      message: error.message,
      statusCode: error.statusCode,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      context: error.context,
      stack: this.isDevelopment ? error.stack : undefined,
    };

    // In production, this would go to a structured logging service
    console.error('Enhanced Error:', JSON.stringify(logData, null, 2));
  }

  /**
   * Send error response to client
   */
  private sendErrorResponse(error: EnhancedError, res: Response): void {
    // Don't send response if already sent
    if (res.headersSent) {
      return;
    }

    const responseData: any = {
      success: false,
      error: {
        type: error.type,
        message: error.getUserMessage(),
        requestId: error.requestId,
        timestamp: error.timestamp.toISOString(),
      },
    };

    // Add retry information for retryable errors
    if (error.retryable) {
      responseData.error.retryable = true;
      responseData.error.retryAfter = this.getRetryAfter(error.type);
    }

    // Add development-specific information
    if (this.isDevelopment) {
      responseData.error.details = {
        originalMessage: error.message,
        service: error.service,
        context: error.context,
        stack: error.stack,
      };
    }

    // Add specific error context for certain error types
    if (error.type === ErrorType.TRUST_SCORE_ERROR && error.context) {
      responseData.error.trustInfo = error.context.trustInfo;
    }

    if (error.type === ErrorType.RATE_LIMIT_ERROR && error.context) {
      responseData.error.rateLimitInfo = error.context.rateLimitInfo;
    }

    res.status(error.statusCode).json(responseData);
  }

  /**
   * Get retry-after time for retryable errors
   */
  private getRetryAfter(type: ErrorType): number {
    switch (type) {
      case ErrorType.RATE_LIMIT_ERROR:
        return 60; // 1 minute
      case ErrorType.DATABASE_ERROR:
        return 30; // 30 seconds
      case ErrorType.EXTERNAL_SERVICE_ERROR:
        return 120; // 2 minutes
      default:
        return 60; // 1 minute default
    }
  }

  /**
   * Get error monitoring statistics
   */
  getStats(): Record<string, any> {
    return {
      errorCounts: this.errorMonitoring.getErrorStats(),
      isDevelopment: this.isDevelopment,
    };
  }
}

/**
 * Factory function to create error handler middleware
 */
export const createEnhancedErrorHandler = (cache?: CacheService) => {
  const handler = new EnhancedErrorHandler(cache);
  return handler.handle;
};

/**
 * Utility function to create enhanced errors
 */
export const createError = (
  message: string,
  type: ErrorType,
  statusCode?: number,
  options?: {
    requestId?: string;
    userId?: number;
    context?: Record<string, any>;
    service?: string;
    retryable?: boolean;
    cause?: Error;
  }
): EnhancedError => {
  return new EnhancedError(message, type, statusCode, options);
};

/**
 * Async wrapper for route handlers with enhanced error handling
 */
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export default instance
export const enhancedErrorHandler = createEnhancedErrorHandler();