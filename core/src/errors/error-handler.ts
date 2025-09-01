import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { BaseError, ErrorDomain, ErrorSeverity } from './base-error';
import { Logger } from '../logging';

type ErrorLogContext = {
  error: {
    message: string;
    stack?: string | undefined;
    name: string;
    code: string;
    id?: string | undefined;
    domain?: string | undefined;
    severity?: string | undefined;
    source?: string | undefined;
    correlationId?: string | undefined;
    parentErrorId?: string | undefined;
    context?: Record<string, any> | undefined;
  };
  request: {
    id: string | string[];
    method: string;
    url: string;
    userId: string;
    ip: string | undefined;
    userAgent?: string | undefined;
    referrer?: string | string[] | undefined;
  };
};

interface ErrorHandlerOptions {
  /**
   * Whether to include stack traces in error responses
   */
  includeStackTrace?: boolean;

  /**
   * Whether to enable Sentry error reporting
   */
  enableSentry?: boolean;

  /**
   * Whether to attempt automatic error recovery
   */
  enableAutoRecovery?: boolean;

  /**
   * Function to determine if an error should be reported to Sentry
   */
  shouldReportToSentry?: (error: Error) => boolean;

  /**
   * Additional error response formatting
   */
  formatError?: (error: BaseError) => Record<string, any>;
}

const defaultOptions: ErrorHandlerOptions = {
  includeStackTrace: process.env.NODE_ENV === 'development',
  enableSentry: process.env.NODE_ENV === 'production',
  enableAutoRecovery: true,
  shouldReportToSentry: (error: Error) => {
    if (error instanceof BaseError) {
      return !error.isOperational || error.metadata.severity === ErrorSeverity.CRITICAL;
    }
    return true;
  },
};

/**
 * Creates a unified error response object
 */
function createErrorResponse(error: BaseError, includeStack: boolean) {
  const response = {
    error: {
      id: error.errorId,
      code: error.code,
      message: error.getUserMessage(),
      statusCode: error.statusCode,
      domain: error.metadata.domain,
      severity: error.metadata.severity,
      correlationId: error.metadata.correlationId,
      timestamp: error.metadata.timestamp.toISOString(),
      retryable: error.metadata.retryable,
      recoveryStrategies: error.metadata.recoveryStrategies
        .filter(s => !s.automatic)
        .map(({ name, description }) => ({ name, description })),
    },
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Normalizes different error types into UnifiedError
 */
function normalizeError(error: Error): BaseError {
  if (error instanceof BaseError) {
    return error;
  }

  // Handle ValidationError from express-validator
  if (error.name === 'ValidationError') {
    return new BaseError(error.message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      domain: ErrorDomain.VALIDATION,
      severity: ErrorSeverity.LOW,
      details: (error as any).errors,
      isOperational: true,
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new BaseError('Invalid token', {
      statusCode: 401,
      code: 'INVALID_TOKEN',
      domain: ErrorDomain.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      isOperational: true,
    });
  }

  // Handle unknown errors
  return new BaseError(error.message || 'Internal Server Error', {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    domain: ErrorDomain.SYSTEM,
    severity: ErrorSeverity.HIGH,
    cause: error,
    isOperational: false,
  });
}

export function unifiedErrorHandler(options: ErrorHandlerOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const logger = new Logger({
    name: 'ErrorHandler',
    level: 'info'
  });

  return async (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(error);
    }

    const normalizedError = normalizeError(error);
    const requestId = req.headers['x-request-id'] || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';

    // Attempt recovery if enabled
    if (
      mergedOptions.enableAutoRecovery &&
      normalizedError.metadata.retryable &&
      normalizedError.metadata.recoveryStrategies.length > 0
    ) {
      try {
        const recovered = await normalizedError.attemptRecovery();
        if (recovered) {
          logger.info({
            msg: 'Error automatically recovered',
            errorId: normalizedError.errorId,
            attemptCount: normalizedError.metadata.attemptCount,
          });
          return next(); // Continue with the request
        }
      } catch (recoveryError) {
        logger.error({
          msg: 'Recovery attempt failed',
          errorId: normalizedError.errorId,
          recoveryError,
        });
      }
    }

    // Enhanced error logging with context
    const errorContext = {
      error: {
        id: normalizedError.errorId,
        message: normalizedError.message,
        code: normalizedError.code,
        domain: normalizedError.metadata.domain,
        severity: normalizedError.metadata.severity,
        stack: normalizedError.stack,
        cause: normalizedError.cause instanceof Error ? normalizedError.cause.message : undefined,
      },
      request: {
        id: requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer || req.headers.referrer,
      },
      metadata: normalizedError.metadata,
    };

    // Log based on severity
    const logData = {
      msg: 'Error encountered',
      ...errorContext
    };

    switch (normalizedError.metadata.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(logData);
        break;
      default:
        logger.info(logData);
    }

    // Report to Sentry if enabled and meets criteria
    if (
      mergedOptions.enableSentry &&
      mergedOptions.shouldReportToSentry?.(normalizedError)
    ) {
      Sentry.withScope((scope) => {
        scope.setUser({ id: userId });
        scope.setTag('requestId', requestId as string);
        scope.setTag('errorId', normalizedError.errorId);
        scope.setTag('domain', normalizedError.metadata.domain);
        scope.setTag('severity', normalizedError.metadata.severity);
        scope.setContext('error', errorContext);
        Sentry.captureException(normalizedError);
      });
    }

    // Create error response
    let errorResponse = createErrorResponse(
      normalizedError,
      mergedOptions.includeStackTrace || false
    );

    // Apply custom formatting if provided
    if (mergedOptions.formatError) {
      const customFormatting = mergedOptions.formatError(normalizedError);
      errorResponse = {
        ...errorResponse,
        ...customFormatting,
      };
    }

    // Send response
    res.status(normalizedError.statusCode).json(errorResponse);
  };
}

/**
 * Sets up global error handlers for uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(logger: Logger) {
  process.on('uncaughtException', (error: Error) => {
    const normalizedError = normalizeError(error);
    logger.error({
      msg: 'Uncaught Exception',
      error: normalizedError.toJSON(),
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(normalizedError);
    }

    // Give time for logs/sentry to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any) => {
    const normalizedError = normalizeError(
      reason instanceof Error ? reason : new Error(String(reason))
    );

    logger.error({
      msg: 'Unhandled Rejection',
      error: normalizedError.toJSON(),
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(normalizedError);
    }
  });
}
