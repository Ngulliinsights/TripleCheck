/**
 * Comprehensive Error Handling Service
 * 
 * Provides centralized error handling, logging, recovery mechanisms,
 * and user-friendly error reporting for the African Property Trust platform.
 * 
 * Features:
 * - Centralized error classification and handling
 * - Automatic error recovery strategies
 * - User-friendly error messages and guidance
 * - Error analytics and reporting
 * - Integration with audit trail and monitoring
 * - Offline error handling and queuing
 */

import { EventEmitter } from 'events';
import { auditTrailService, AuditEventType } from './audit-trail-service';

// Error Types and Classifications
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  USER_INPUT = 'USER_INPUT',
  CONFIGURATION = 'CONFIGURATION',
  PERFORMANCE = 'PERFORMANCE'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  REDIRECT = 'REDIRECT',
  REFRESH = 'REFRESH',
  LOGOUT = 'LOGOUT',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  IGNORE = 'IGNORE',
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ProcessedError {
  id: string;
  originalError: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  recoveryStrategies: RecoveryStrategy[];
  context: ErrorContext;
  isRetryable: boolean;
  retryCount: number;
  maxRetries: number;
  metadata: ErrorMetadata;
}

export interface ErrorMetadata {
  errorCode?: string;
  httpStatus?: number;
  component?: string;
  feature?: string;
  userImpact: UserImpact;
  businessImpact: BusinessImpact;
  tags: string[];
}

export enum UserImpact {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BusinessImpact {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorRecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  data?: any;
  nextSteps?: string[];
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  topErrors: Array<{ message: string; count: number; category: ErrorCategory }>;
  recoverySuccessRate: number;
  averageResolutionTime: number;
  userImpactDistribution: Record<UserImpact, number>;
}

// Error Classification Engine
export class ErrorClassifier {
  private classificationRules: Map<string, (error: Error, context: ErrorContext) => Partial<ProcessedError>> = new Map();

  constructor() {
    this.initializeClassificationRules();
  }

  private initializeClassificationRules(): void {
    // Network errors
    this.classificationRules.set('NetworkError', (error, context) => ({
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Connection problem. Please check your internet connection and try again.',
      technicalMessage: `Network error: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.REFRESH],
      isRetryable: true,
      maxRetries: 3,
      metadata: {
        userImpact: UserImpact.MEDIUM,
        businessImpact: BusinessImpact.LOW,
        tags: ['network', 'connectivity']
      }
    }));

    // Authentication errors
    this.classificationRules.set('AuthenticationError', (error, context) => ({
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Your session has expired. Please log in again.',
      technicalMessage: `Authentication failed: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.REDIRECT, RecoveryStrategy.LOGOUT],
      isRetryable: false,
      maxRetries: 0,
      metadata: {
        userImpact: UserImpact.HIGH,
        businessImpact: BusinessImpact.MEDIUM,
        tags: ['auth', 'security']
      }
    }));

    // Authorization errors
    this.classificationRules.set('AuthorizationError', (error, context) => ({
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'You don\'t have permission to perform this action.',
      technicalMessage: `Authorization denied: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.CONTACT_SUPPORT],
      isRetryable: false,
      maxRetries: 0,
      metadata: {
        userImpact: UserImpact.MEDIUM,
        businessImpact: BusinessImpact.LOW,
        tags: ['auth', 'permissions']
      }
    }));

    // Validation errors
    this.classificationRules.set('ValidationError', (error, context) => ({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      userMessage: 'Please check your input and try again.',
      technicalMessage: `Validation failed: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.IGNORE],
      isRetryable: false,
      maxRetries: 0,
      metadata: {
        userImpact: UserImpact.LOW,
        businessImpact: BusinessImpact.NONE,
        tags: ['validation', 'user-input']
      }
    }));

    // System errors
    this.classificationRules.set('SystemError', (error, context) => ({
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      userMessage: 'A system error occurred. Our team has been notified.',
      technicalMessage: `System error: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.CONTACT_SUPPORT, RecoveryStrategy.REFRESH],
      isRetryable: true,
      maxRetries: 1,
      metadata: {
        userImpact: UserImpact.HIGH,
        businessImpact: BusinessImpact.HIGH,
        tags: ['system', 'critical']
      }
    }));

    // External service errors
    this.classificationRules.set('ExternalServiceError', (error, context) => ({
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'A third-party service is temporarily unavailable. Please try again later.',
      technicalMessage: `External service error: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK],
      isRetryable: true,
      maxRetries: 2,
      metadata: {
        userImpact: UserImpact.MEDIUM,
        businessImpact: BusinessImpact.MEDIUM,
        tags: ['external', 'service']
      }
    }));

    // Performance errors
    this.classificationRules.set('TimeoutError', (error, context) => ({
      category: ErrorCategory.PERFORMANCE,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'The request is taking longer than expected. Please try again.',
      technicalMessage: `Request timeout: ${error.message}`,
      recoveryStrategies: [RecoveryStrategy.RETRY],
      isRetryable: true,
      maxRetries: 2,
      metadata: {
        userImpact: UserImpact.MEDIUM,
        businessImpact: BusinessImpact.LOW,
        tags: ['performance', 'timeout']
      }
    }));
  }

  classify(error: Error, context: ErrorContext): Partial<ProcessedError> {
    // Try to match by error name/type
    const rule = this.classificationRules.get(error.name) || 
                  this.classificationRules.get(error.constructor.name);
    
    if (rule) {
      return rule(error, context);
    }

    // Try to match by error message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return this.classificationRules.get('NetworkError')!(error, context);
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return this.classificationRules.get('AuthenticationError')!(error, context);
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return this.classificationRules.get('AuthorizationError')!(error, context);
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return this.classificationRules.get('ValidationError')!(error, context);
    }
    
    if (message.includes('timeout')) {
      return this.classificationRules.get('TimeoutError')!(error, context);
    }

    // Default classification for unknown errors
    return {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: error.message,
      recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.REFRESH],
      isRetryable: true,
      maxRetries: 1,
      metadata: {
        userImpact: UserImpact.MEDIUM,
        businessImpact: BusinessImpact.LOW,
        tags: ['unknown']
      }
    };
  }
}

// Error Recovery Engine
export class ErrorRecoveryEngine {
  private recoveryHandlers: Map<RecoveryStrategy, (error: ProcessedError) => Promise<ErrorRecoveryResult>> = new Map();

  constructor() {
    this.initializeRecoveryHandlers();
  }

  private initializeRecoveryHandlers(): void {
    // Retry strategy
    this.recoveryHandlers.set(RecoveryStrategy.RETRY, async (error: ProcessedError) => {
      if (error.retryCount >= error.maxRetries) {
        return {
          success: false,
          strategy: RecoveryStrategy.RETRY,
          message: 'Maximum retry attempts exceeded',
          nextSteps: ['Contact support if the problem persists']
        };
      }

      // Implement exponential backoff
      const delay = Math.min(1000 * Math.pow(2, error.retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return {
        success: true,
        strategy: RecoveryStrategy.RETRY,
        message: `Retrying operation (attempt ${error.retryCount + 1}/${error.maxRetries})`,
        data: { delay, attempt: error.retryCount + 1 }
      };
    });

    // Fallback strategy
    this.recoveryHandlers.set(RecoveryStrategy.FALLBACK, async (error: ProcessedError) => {
      return {
        success: true,
        strategy: RecoveryStrategy.FALLBACK,
        message: 'Using alternative method',
        nextSteps: ['Some features may be limited while using fallback mode']
      };
    });

    // Redirect strategy
    this.recoveryHandlers.set(RecoveryStrategy.REDIRECT, async (error: ProcessedError) => {
      const redirectUrl = this.determineRedirectUrl(error);
      return {
        success: true,
        strategy: RecoveryStrategy.REDIRECT,
        message: 'Redirecting to resolve the issue',
        data: { redirectUrl },
        nextSteps: [`You will be redirected to ${redirectUrl}`]
      };
    });

    // Refresh strategy
    this.recoveryHandlers.set(RecoveryStrategy.REFRESH, async (error: ProcessedError) => {
      return {
        success: true,
        strategy: RecoveryStrategy.REFRESH,
        message: 'Please refresh the page to continue',
        nextSteps: ['Click the refresh button or press F5']
      };
    });

    // Logout strategy
    this.recoveryHandlers.set(RecoveryStrategy.LOGOUT, async (error: ProcessedError) => {
      return {
        success: true,
        strategy: RecoveryStrategy.LOGOUT,
        message: 'Please log in again to continue',
        data: { logoutRequired: true },
        nextSteps: ['You will be redirected to the login page']
      };
    });

    // Contact support strategy
    this.recoveryHandlers.set(RecoveryStrategy.CONTACT_SUPPORT, async (error: ProcessedError) => {
      return {
        success: true,
        strategy: RecoveryStrategy.CONTACT_SUPPORT,
        message: 'Please contact support for assistance',
        data: { 
          supportEmail: 'support@africanpropertytrust.com',
          errorId: error.id 
        },
        nextSteps: [
          'Include the error ID when contacting support',
          'Describe what you were trying to do when the error occurred'
        ]
      };
    });
  }

  async executeRecovery(error: ProcessedError, strategy: RecoveryStrategy): Promise<ErrorRecoveryResult> {
    const handler = this.recoveryHandlers.get(strategy);
    if (!handler) {
      return {
        success: false,
        strategy,
        message: `No recovery handler available for strategy: ${strategy}`
      };
    }

    try {
      return await handler(error);
    } catch (recoveryError) {
      return {
        success: false,
        strategy,
        message: `Recovery strategy failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      };
    }
  }

  private determineRedirectUrl(error: ProcessedError): string {
    if (error.category === ErrorCategory.AUTHENTICATION) {
      return '/login';
    }
    if (error.category === ErrorCategory.AUTHORIZATION) {
      return '/dashboard';
    }
    return '/';
  }
}

// Main Error Handling Service
export class ErrorHandlingService extends EventEmitter {
  private errors: ProcessedError[] = [];
  private classifier: ErrorClassifier;
  private recoveryEngine: ErrorRecoveryEngine;
  private readonly maxErrors = 1000;
  private offlineQueue: ProcessedError[] = [];

  constructor() {
    super();
    this.classifier = new ErrorClassifier();
    this.recoveryEngine = new ErrorRecoveryEngine();
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
    
    // Set up offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processOfflineQueue());
      window.addEventListener('offline', () => this.handleOfflineMode());
    }
  }

  /**
   * Process and handle an error with automatic classification and recovery
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): Promise<ProcessedError> {
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      stackTrace: error.stack,
      ...context
    };

    // Classify the error
    const classification = this.classifier.classify(error, fullContext);
    
    // Create processed error
    const processedError: ProcessedError = {
      id: this.generateErrorId(),
      originalError: error,
      retryCount: 0,
      ...classification,
      context: fullContext
    } as ProcessedError;

    // Store error
    this.errors.push(processedError);
    
    // Emit error event
    this.emit('errorProcessed', processedError);

    // Log to audit trail
    await this.logToAuditTrail(processedError);

    // Handle offline scenarios
    if (!navigator.onLine) {
      this.offlineQueue.push(processedError);
      return processedError;
    }

    // Attempt automatic recovery for retryable errors
    if (processedError.isRetryable && processedError.retryCount < processedError.maxRetries) {
      await this.attemptRecovery(processedError);
    }

    // Emit high-severity errors for immediate attention
    if (processedError.severity === ErrorSeverity.CRITICAL || 
        processedError.severity === ErrorSeverity.HIGH) {
      this.emit('criticalError', processedError);
    }

    return processedError;
  }

  /**
   * Attempt to recover from an error using available strategies
   */
  async attemptRecovery(error: ProcessedError): Promise<ErrorRecoveryResult[]> {
    const results: ErrorRecoveryResult[] = [];

    for (const strategy of error.recoveryStrategies) {
      try {
        const result = await this.recoveryEngine.executeRecovery(error, strategy);
        results.push(result);

        if (result.success) {
          error.retryCount++;
          this.emit('errorRecovered', { error, strategy, result });
          
          // If it's a retry strategy and successful, we might want to re-attempt the original operation
          if (strategy === RecoveryStrategy.RETRY) {
            break; // Stop trying other strategies for retry
          }
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy} failed:`, recoveryError);
      }
    }

    return results;
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getUserErrorMessage(errorId: string): { message: string; actions: string[]; canRetry: boolean } | null {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) return null;

    const actions: string[] = [];
    
    // Add recovery strategy descriptions
    for (const strategy of error.recoveryStrategies) {
      switch (strategy) {
        case RecoveryStrategy.RETRY:
          actions.push('Try again');
          break;
        case RecoveryStrategy.REFRESH:
          actions.push('Refresh the page');
          break;
        case RecoveryStrategy.REDIRECT:
          actions.push('Go to a different page');
          break;
        case RecoveryStrategy.LOGOUT:
          actions.push('Log in again');
          break;
        case RecoveryStrategy.CONTACT_SUPPORT:
          actions.push('Contact support');
          break;
        case RecoveryStrategy.FALLBACK:
          actions.push('Use alternative method');
          break;
      }
    }

    return {
      message: error.userMessage,
      actions,
      canRetry: error.isRetryable && error.retryCount < error.maxRetries
    };
  }

  /**
   * Get error analytics and insights
   */
  getErrorAnalytics(timeRange?: { start: Date; end: Date }): ErrorAnalytics {
    let errors = this.errors;

    if (timeRange) {
      errors = errors.filter(e => 
        e.context.timestamp >= timeRange.start && 
        e.context.timestamp <= timeRange.end
      );
    }

    const errorsByCategory: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    const userImpactDistribution: Record<UserImpact, number> = {} as Record<UserImpact, number>;
    const errorCounts = new Map<string, number>();

    let totalRecoveryAttempts = 0;
    let successfulRecoveries = 0;
    let totalResolutionTime = 0;

    for (const error of errors) {
      // Count by category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Count by user impact
      userImpactDistribution[error.metadata.userImpact] = 
        (userImpactDistribution[error.metadata.userImpact] || 0) + 1;
      
      // Count error messages
      const key = `${error.category}:${error.userMessage}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      
      // Recovery statistics
      if (error.retryCount > 0) {
        totalRecoveryAttempts++;
        if (error.retryCount < error.maxRetries) {
          successfulRecoveries++;
        }
      }
      
      // Resolution time (simplified calculation)
      totalResolutionTime += 5000; // Average 5 seconds per error
    }

    const topErrors = Array.from(errorCounts.entries())
      .map(([key, count]) => {
        const [category, message] = key.split(':');
        return { 
          message, 
          count, 
          category: category as ErrorCategory 
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      recoverySuccessRate: totalRecoveryAttempts > 0 ? successfulRecoveries / totalRecoveryAttempts : 0,
      averageResolutionTime: errors.length > 0 ? totalResolutionTime / errors.length : 0,
      userImpactDistribution
    };
  }

  /**
   * Export error data for analysis or reporting
   */
  exportErrors(format: 'json' | 'csv' = 'json', filter?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    dateRange?: { start: Date; end: Date };
  }): string {
    let filteredErrors = [...this.errors];

    if (filter) {
      if (filter.category) {
        filteredErrors = filteredErrors.filter(e => e.category === filter.category);
      }
      if (filter.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filter.severity);
      }
      if (filter.dateRange) {
        filteredErrors = filteredErrors.filter(e => 
          e.context.timestamp >= filter.dateRange!.start && 
          e.context.timestamp <= filter.dateRange!.end
        );
      }
    }

    if (format === 'json') {
      return JSON.stringify(filteredErrors, null, 2);
    } else {
      return this.convertErrorsToCSV(filteredErrors);
    }
  }

  // Private helper methods
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logToAuditTrail(error: ProcessedError): Promise<void> {
    try {
      await auditTrailService.logEvent(
        AuditEventType.SYSTEM_ERROR,
        'error_occurred',
        {
          errorId: error.id,
          category: error.category,
          severity: error.severity,
          userMessage: error.userMessage,
          technicalMessage: error.technicalMessage,
          userImpact: error.metadata.userImpact,
          businessImpact: error.metadata.businessImpact,
          component: error.context.component,
          action: error.context.action
        },
        {
          userId: error.context.userId,
          sessionId: error.context.sessionId,
          ipAddress: undefined, // Would be populated from request context
          userAgent: error.context.userAgent,
          roles: [],
          permissions: [],
          isAuthenticated: !!error.context.userId
        }
      );
    } catch (auditError) {
      console.error('Failed to log error to audit trail:', auditError);
    }
  }

  private handleOfflineMode(): void {
    this.emit('offlineMode', { timestamp: new Date() });
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    this.emit('onlineMode', { 
      timestamp: new Date(), 
      queuedErrors: this.offlineQueue.length 
    });

    // Process queued errors
    const queuedErrors = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const error of queuedErrors) {
      if (error.isRetryable && error.retryCount < error.maxRetries) {
        await this.attemptRecovery(error);
      }
    }
  }

  private cleanup(): void {
    // Remove old errors (keep last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.errors = this.errors.filter(e => e.context.timestamp.getTime() > sevenDaysAgo);

    // Limit memory usage
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  private convertErrorsToCSV(errors: ProcessedError[]): string {
    if (errors.length === 0) return '';

    const headers = [
      'ID', 'Timestamp', 'Category', 'Severity', 'User Message', 
      'Technical Message', 'Component', 'User ID', 'User Impact', 'Business Impact'
    ];

    const rows = errors.map(error => [
      error.id,
      error.context.timestamp.toISOString(),
      error.category,
      error.severity,
      error.userMessage,
      error.technicalMessage,
      error.context.component || '',
      error.context.userId || '',
      error.metadata.userImpact,
      error.metadata.businessImpact
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

// Singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Convenience functions for common error scenarios
export const errorHandler = {
  // Network errors
  handleNetworkError: (error: Error, context?: Partial<ErrorContext>) =>
    errorHandlingService.handleError(Object.assign(error, { name: 'NetworkError' }), context),

  // Authentication errors
  handleAuthError: (error: Error, context?: Partial<ErrorContext>) =>
    errorHandlingService.handleError(Object.assign(error, { name: 'AuthenticationError' }), context),

  // Validation errors
  handleValidationError: (error: Error, context?: Partial<ErrorContext>) =>
    errorHandlingService.handleError(Object.assign(error, { name: 'ValidationError' }), context),

  // System errors
  handleSystemError: (error: Error, context?: Partial<ErrorContext>) =>
    errorHandlingService.handleError(Object.assign(error, { name: 'SystemError' }), context),

  // Generic error handler
  handle: (error: Error, context?: Partial<ErrorContext>) =>
    errorHandlingService.handleError(error, context),

  // Get user-friendly error info
  getUserMessage: (errorId: string) =>
    errorHandlingService.getUserErrorMessage(errorId),

  // Get analytics
  getAnalytics: (timeRange?: { start: Date; end: Date }) =>
    errorHandlingService.getErrorAnalytics(timeRange)
};

// Global error handlers for unhandled errors
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      { component: 'global', action: 'unhandled_promise' }
    );
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorHandler.handle(
      event.error || new Error(event.message),
      { 
        component: 'global', 
        action: 'uncaught_error',
        url: event.filename,
        additionalData: {
          line: event.lineno,
          column: event.colno
        }
      }
    );
  });
}