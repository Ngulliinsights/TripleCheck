/**
 * Standardized Error Handling System for TripleCheck
 * 
 * Provides consistent error handling patterns across all services
 * with proper categorization, logging, and response formatting.
 */

import { logger } from '../monitoring/logger';

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface StandardError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: Record<string, any>;
  context?: string;
  timestamp: Date;
  correlationId?: string;
  userId?: number;
  stackTrace?: string;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorHandlingOptions {
  logError?: boolean;
  includeStackTrace?: boolean;
  notifyMonitoring?: boolean;
  retryable?: boolean;
  userMessage?: string;
  context?: string;
  correlationId?: string;
  userId?: number;
}

export class StandardErrorHandler {
  private static instance: StandardErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, Date> = new Map();

  static getInstance(): StandardErrorHandler {
    if (!StandardErrorHandler.instance) {
      StandardErrorHandler.instance = new StandardErrorHandler();
    }
    return StandardErrorHandler.instance;
  }

  /**
   * Create a standardized error with proper categorization
   */
  createError(
    category: ErrorCategory,
    code: string,
    message: string,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(category, code);
    
    const standardError: StandardError = {
      id: errorId,
      category,
      severity,
      code,
      message,
      details: options.context ? { context: options.context } : undefined,
      context: options.context,
      timestamp: new Date(),
      correlationId: options.correlationId,
      userId: options.userId,
      stackTrace: options.includeStackTrace ? new Error().stack : undefined,
      retryable: options.retryable ?? this.isRetryable(category),
      userMessage: options.userMessage ?? this.generateUserMessage(category, message)
    };

    // Log the error if requested
    if (options.logError !== false) {
      this.logError(standardError);
    }

    // Track error frequency
    this.trackError(code);

    // Notify monitoring if critical
    if (options.notifyMonitoring !== false && severity === ErrorSeverity.CRITICAL) {
      this.notifyMonitoring(standardError);
    }

    return standardError;
  }

  /**
   * Handle validation errors with field-specific details
   */
  createValidationError(
    fields: Array<{ field: string; message: string; value?: any }>,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.VALIDATION,
      'VALIDATION_FAILED',
      'Input validation failed',
      {
        ...options,
        details: { fields },
        userMessage: 'Please check your input and try again'
      }
    );
  }

  /**
   * Handle authentication errors
   */
  createAuthenticationError(
    reason: string,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.AUTHENTICATION,
      'AUTH_FAILED',
      `Authentication failed: ${reason}`,
      {
        ...options,
        userMessage: 'Please log in to continue',
        retryable: false
      }
    );
  }

  /**
   * Handle authorization errors
   */
  createAuthorizationError(
    resource: string,
    action: string,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.AUTHORIZATION,
      'INSUFFICIENT_PERMISSIONS',
      `Insufficient permissions to ${action} ${resource}`,
      {
        ...options,
        details: { resource, action },
        userMessage: 'You do not have permission to perform this action',
        retryable: false
      }
    );
  }

  /**
   * Handle database errors with categorization
   */
  createDatabaseError(
    operation: string,
    originalError: Error,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    const dbErrorCode = this.categorizeDatabaseError(originalError);
    
    return this.createError(
      ErrorCategory.DATABASE,
      dbErrorCode,
      `Database operation failed: ${operation}`,
      {
        ...options,
        details: { 
          operation, 
          originalMessage: originalError.message,
          errorType: originalError.constructor.name
        },
        stackTrace: originalError.stack,
        userMessage: this.getDatabaseUserMessage(dbErrorCode),
        retryable: this.isDatabaseErrorRetryable(dbErrorCode)
      }
    );
  }

  /**
   * Handle external service errors
   */
  createExternalServiceError(
    service: string,
    operation: string,
    statusCode?: number,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.EXTERNAL_SERVICE,
      'EXTERNAL_SERVICE_ERROR',
      `External service error: ${service} ${operation}`,
      {
        ...options,
        details: { service, operation, statusCode },
        userMessage: 'A third-party service is temporarily unavailable. Please try again later.',
        retryable: true
      }
    );
  }

  /**
   * Handle business logic errors
   */
  createBusinessLogicError(
    rule: string,
    context: Record<string, any>,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.BUSINESS_LOGIC,
      'BUSINESS_RULE_VIOLATION',
      `Business rule violation: ${rule}`,
      {
        ...options,
        details: { rule, context },
        userMessage: 'This action violates business rules',
        retryable: false
      }
    );
  }

  /**
   * Handle security-related errors
   */
  createSecurityError(
    threat: string,
    details: Record<string, any>,
    options: ErrorHandlingOptions = {}
  ): StandardError {
    return this.createError(
      ErrorCategory.SECURITY,
      'SECURITY_VIOLATION',
      `Security violation detected: ${threat}`,
      {
        ...options,
        details,
        userMessage: 'Security violation detected. This incident has been logged.',
        retryable: false,
        notifyMonitoring: true
      }
    );
  }

  /**
   * Convert standard error to HTTP response format
   */
  toHttpResponse(error: StandardError): {
    statusCode: number;
    body: {
      success: false;
      error: {
        id: string;
        code: string;
        message: string;
        category: string;
        retryable: boolean;
        details?: Record<string, any>;
      };
      timestamp: string;
      correlationId?: string;
    };
  } {
    return {
      statusCode: this.getHttpStatusCode(error.category),
      body: {
        success: false,
        error: {
          id: error.id,
          code: error.code,
          message: error.userMessage,
          category: error.category,
          retryable: error.retryable,
          details: error.details
        },
        timestamp: error.timestamp.toISOString(),
        correlationId: error.correlationId
      }
    };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsByCode: Record<string, number>;
    recentErrors: StandardError[];
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsByCode = {} as Record<string, number>;

    // Initialize categories
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });

    // Count errors by code
    this.errorCounts.forEach((count, code) => {
      errorsByCode[code] = count;
    });

    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByCategory,
      errorsByCode,
      recentErrors: [] // Would be populated from a recent errors cache
    };
  }

  // Private helper methods

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private determineSeverity(category: ErrorCategory, code: string): ErrorSeverity {
    const criticalCategories = [ErrorCategory.SECURITY, ErrorCategory.SYSTEM];
    const highSeverityCategories = [ErrorCategory.DATABASE, ErrorCategory.AUTHENTICATION];
    
    if (criticalCategories.includes(category)) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (highSeverityCategories.includes(category)) {
      return ErrorSeverity.HIGH;
    }
    
    if (category === ErrorCategory.BUSINESS_LOGIC || category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private isRetryable(category: ErrorCategory): boolean {
    const retryableCategories = [
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorCategory.DATABASE,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.SYSTEM
    ];
    
    return retryableCategories.includes(category);
  }

  private generateUserMessage(category: ErrorCategory, message: string): string {
    const userMessages = {
      [ErrorCategory.VALIDATION]: 'Please check your input and try again',
      [ErrorCategory.AUTHENTICATION]: 'Please log in to continue',
      [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action',
      [ErrorCategory.NOT_FOUND]: 'The requested resource was not found',
      [ErrorCategory.CONFLICT]: 'This action conflicts with existing data',
      [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please try again later',
      [ErrorCategory.EXTERNAL_SERVICE]: 'A service is temporarily unavailable',
      [ErrorCategory.DATABASE]: 'A database error occurred. Please try again',
      [ErrorCategory.BUSINESS_LOGIC]: 'This action violates business rules',
      [ErrorCategory.SYSTEM]: 'A system error occurred. Please try again later',
      [ErrorCategory.SECURITY]: 'Security violation detected'
    };
    
    return userMessages[category] || 'An error occurred. Please try again';
  }

  private logError(error: StandardError): void {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                    error.severity === ErrorSeverity.HIGH ? 'error' :
                    error.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info';
    
    logger[logLevel](
      `${error.category}: ${error.message}`,
      error.context || 'ERROR_HANDLER',
      {
        errorId: error.id,
        code: error.code,
        severity: error.severity,
        userId: error.userId,
        correlationId: error.correlationId,
        details: error.details,
        retryable: error.retryable
      },
      error.stackTrace ? new Error(error.stackTrace) : undefined
    );
  }

  private trackError(code: string): void {
    const currentCount = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, currentCount + 1);
    this.lastErrorTime.set(code, new Date());
  }

  private notifyMonitoring(error: StandardError): void {
    // In production, this would integrate with monitoring services
    logger.error(
      `CRITICAL ERROR ALERT: ${error.message}`,
      'MONITORING',
      {
        errorId: error.id,
        category: error.category,
        code: error.code,
        severity: error.severity,
        userId: error.userId,
        correlationId: error.correlationId
      }
    );
  }

  private categorizeDatabaseError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return 'DUPLICATE_ENTRY';
    }
    if (message.includes('foreign key') || message.includes('violates foreign key constraint')) {
      return 'FOREIGN_KEY_VIOLATION';
    }
    if (message.includes('not null') || message.includes('violates not-null constraint')) {
      return 'NULL_CONSTRAINT_VIOLATION';
    }
    if (message.includes('timeout') || message.includes('etimedout')) {
      return 'DATABASE_TIMEOUT';
    }
    if (message.includes('connect') || message.includes('econnrefused')) {
      return 'CONNECTION_FAILED';
    }
    
    return 'DATABASE_ERROR';
  }

  private getDatabaseUserMessage(code: string): string {
    const messages = {
      DUPLICATE_ENTRY: 'This record already exists',
      FOREIGN_KEY_VIOLATION: 'Referenced record not found',
      NULL_CONSTRAINT_VIOLATION: 'Required field is missing',
      DATABASE_TIMEOUT: 'Database operation timed out. Please try again',
      CONNECTION_FAILED: 'Database connection failed. Please try again later',
      DATABASE_ERROR: 'A database error occurred. Please try again'
    };
    
    return messages[code] || 'A database error occurred';
  }

  private isDatabaseErrorRetryable(code: string): boolean {
    const retryableCodes = ['DATABASE_TIMEOUT', 'CONNECTION_FAILED'];
    return retryableCodes.includes(code);
  }

  private getHttpStatusCode(category: ErrorCategory): number {
    const statusCodes = {
      [ErrorCategory.VALIDATION]: 400,
      [ErrorCategory.AUTHENTICATION]: 401,
      [ErrorCategory.AUTHORIZATION]: 403,
      [ErrorCategory.NOT_FOUND]: 404,
      [ErrorCategory.CONFLICT]: 409,
      [ErrorCategory.RATE_LIMIT]: 429,
      [ErrorCategory.EXTERNAL_SERVICE]: 502,
      [ErrorCategory.DATABASE]: 500,
      [ErrorCategory.BUSINESS_LOGIC]: 422,
      [ErrorCategory.SYSTEM]: 500,
      [ErrorCategory.SECURITY]: 403
    };
    
    return statusCodes[category] || 500;
  }
}

// Export singleton instance
export const standardErrorHandler = StandardErrorHandler.getInstance();

// Export convenience functions
export const createValidationError = (fields: Array<{ field: string; message: string; value?: any }>, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createValidationError(fields, options);

export const createAuthenticationError = (reason: string, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createAuthenticationError(reason, options);

export const createAuthorizationError = (resource: string, action: string, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createAuthorizationError(resource, action, options);

export const createDatabaseError = (operation: string, originalError: Error, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createDatabaseError(operation, originalError, options);

export const createExternalServiceError = (service: string, operation: string, statusCode?: number, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createExternalServiceError(service, operation, statusCode, options);

export const createBusinessLogicError = (rule: string, context: Record<string, any>, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createBusinessLogicError(rule, context, options);

export const createSecurityError = (threat: string, details: Record<string, any>, options?: ErrorHandlingOptions) =>
  standardErrorHandler.createSecurityError(threat, details, options);