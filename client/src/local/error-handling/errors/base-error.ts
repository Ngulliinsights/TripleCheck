/* ---------------------------------------------------------
   Base Error Classes
   Core application error system with categorization
--------------------------------------------------------- */

import { ErrorCategory } from '../constants/error-categories'

export interface BaseError {
    readonly code: string;
    readonly message: string;
    readonly details: Record<string, unknown> | undefined;
    readonly timestamp: string;
    readonly correlationId: string | undefined;
  }
  
  /**
   * Application error severity levels
   */
  export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM', 
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
  }
  

  
  /**
   * Recovery strategies for client handling
   */
  export enum RecoveryStrategy {
    RETRY = 'RETRY',
    FALLBACK = 'FALLBACK',
    REDIRECT = 'REDIRECT',
    REFRESH = 'REFRESH',
    LOGOUT = 'LOGOUT',
    CONTACT_SUPPORT = 'CONTACT_SUPPORT',
    IGNORE = 'IGNORE',
    MANUAL_INTERVENTION = 'MANUAL_INTERVENTION',
  }
  
  /**
   * Main application error class
   */
  export class AppError extends Error implements BaseError {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly category: ErrorCategory;
    public readonly severity: ErrorSeverity;
    public readonly recoveryStrategies: RecoveryStrategy[];
    public readonly details: Record<string, unknown> | undefined;
    public readonly timestamp: string;
    public readonly correlationId: string | undefined;
    public readonly isOperational: boolean;
    public readonly retryable: boolean;
    public readonly cause?: Error;
  
    constructor(
      code: string,
      message: string,
      statusCode: number = 500,
      category: ErrorCategory = ErrorCategory.SYSTEM,
      options: {
        severity?: ErrorSeverity;
        recoveryStrategies?: RecoveryStrategy[];
        details?: Record<string, unknown>;
        correlationId?: string;
        isOperational?: boolean;
        cause?: Error;
      } = {}
    ) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.statusCode = statusCode;
      this.category = category;
      this.severity = options.severity || this.getDefaultSeverity(category);
      this.recoveryStrategies = options.recoveryStrategies || this.getDefaultRecoveryStrategies(category);
      this.details = options.details;
      this.timestamp = new Date().toISOString();
      this.correlationId = options.correlationId;
      this.isOperational = options.isOperational ?? true;
      this.retryable = this.isRetryableCategory(category);
  
      if (options.cause) {
        this.cause = options.cause;
      }
  
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  
    private getDefaultSeverity(category: ErrorCategory): ErrorSeverity {
      const severityMap: Record<ErrorCategory, ErrorSeverity> = {
        [ErrorCategory.VALIDATION]: ErrorSeverity.LOW,
        [ErrorCategory.AUTHENTICATION]: ErrorSeverity.HIGH,
        [ErrorCategory.AUTHORIZATION]: ErrorSeverity.HIGH,
        [ErrorCategory.NOT_FOUND]: ErrorSeverity.LOW,
        [ErrorCategory.CONFLICT]: ErrorSeverity.MEDIUM,
        [ErrorCategory.RATE_LIMIT]: ErrorSeverity.MEDIUM,
        [ErrorCategory.EXTERNAL_SERVICE]: ErrorSeverity.MEDIUM,
        [ErrorCategory.DATABASE]: ErrorSeverity.CRITICAL,
        [ErrorCategory.BUSINESS_LOGIC]: ErrorSeverity.MEDIUM,
        [ErrorCategory.SYSTEM]: ErrorSeverity.CRITICAL,
        [ErrorCategory.SECURITY]: ErrorSeverity.CRITICAL,
        [ErrorCategory.NETWORK]: ErrorSeverity.MEDIUM,
        [ErrorCategory.PERFORMANCE]: ErrorSeverity.MEDIUM,
        [ErrorCategory.CONFIGURATION]: ErrorSeverity.HIGH,
      };
      return severityMap[category] || ErrorSeverity.MEDIUM;
    }
  
    private getDefaultRecoveryStrategies(category: ErrorCategory): RecoveryStrategy[] {
      const strategyMap: Record<ErrorCategory, RecoveryStrategy[]> = {
        [ErrorCategory.VALIDATION]: [RecoveryStrategy.IGNORE],
        [ErrorCategory.AUTHENTICATION]: [RecoveryStrategy.LOGOUT, RecoveryStrategy.REDIRECT],
        [ErrorCategory.AUTHORIZATION]: [RecoveryStrategy.CONTACT_SUPPORT],
        [ErrorCategory.NOT_FOUND]: [RecoveryStrategy.IGNORE],
        [ErrorCategory.CONFLICT]: [RecoveryStrategy.REFRESH],
        [ErrorCategory.RATE_LIMIT]: [RecoveryStrategy.RETRY],
        [ErrorCategory.EXTERNAL_SERVICE]: [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK],
        [ErrorCategory.DATABASE]: [RecoveryStrategy.RETRY, RecoveryStrategy.CONTACT_SUPPORT],
        [ErrorCategory.BUSINESS_LOGIC]: [RecoveryStrategy.CONTACT_SUPPORT],
        [ErrorCategory.SYSTEM]: [RecoveryStrategy.CONTACT_SUPPORT],
        [ErrorCategory.SECURITY]: [RecoveryStrategy.LOGOUT, RecoveryStrategy.CONTACT_SUPPORT],
        [ErrorCategory.NETWORK]: [RecoveryStrategy.RETRY],
        [ErrorCategory.PERFORMANCE]: [RecoveryStrategy.RETRY],
        [ErrorCategory.CONFIGURATION]: [RecoveryStrategy.CONTACT_SUPPORT],
      };
      return strategyMap[category] || [RecoveryStrategy.CONTACT_SUPPORT];
    }
  
    private isRetryableCategory(category: ErrorCategory): boolean {
      return [
        ErrorCategory.NETWORK,
        ErrorCategory.EXTERNAL_SERVICE,
        ErrorCategory.DATABASE,
        ErrorCategory.RATE_LIMIT,
      ].includes(category);
    }
  
    toJSON(): BaseError & {
      category: ErrorCategory;
      severity: ErrorSeverity;
      recoveryStrategies: RecoveryStrategy[];
      retryable: boolean;
    } {
      return {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
        category: this.category,
        severity: this.severity,
        recoveryStrategies: this.recoveryStrategies,
        retryable: this.retryable,
        ...(this.details !== undefined && { details: this.details }),
        ...(this.correlationId !== undefined && { correlationId: this.correlationId }),
      };
    }
  
    getUserMessage(): string {
      // Implementation for user-friendly messages
      return this.message;
    }
  }