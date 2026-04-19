/**
 * Shared Error Types and Utilities
 * 
 * Centralizes the application error system to resolve circular dependencies
 * and provide a unified error foundation for client and server.
 */

/**
 * Application error domains
 */
export enum ErrorDomain {
  AI = 'AI',
  PROPERTY = 'PROPERTY',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  NETWORK = 'NETWORK',
  FINANCE = 'FINANCE',
  STORAGE = 'STORAGE',
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
 * Application error categories
 */
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
  SECURITY = 'SECURITY',
  NETWORK = 'NETWORK',
  PERFORMANCE = 'PERFORMANCE',
  CONFIGURATION = 'CONFIGURATION',
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
 * Standard HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Application-specific error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  USERNAME_EXISTS = 'USERNAME_EXISTS',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT_FAILED = 'LOGOUT_FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_SESSION = 'INVALID_SESSION',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  PASSWORD_RESET_REQUIRED = 'PASSWORD_RESET_REQUIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_USERNAME = 'INVALID_USERNAME',
  USERNAME_TOO_SHORT = 'USERNAME_TOO_SHORT',
  USERNAME_TOO_LONG = 'USERNAME_TOO_LONG',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG = 'PASSWORD_TOO_LONG',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
  INVALID_PROPERTY_ID = 'INVALID_PROPERTY_ID',
  INVALID_USER_ID = 'INVALID_USER_ID',
  INVALID_REVIEW_ID = 'INVALID_REVIEW_ID',
  
  // Database
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  INSERT_FAILED = 'INSERT_FAILED',
  
  // Business Logic & Domain
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Property Management
  PROPERTY_NOT_FOUND = 'PROPERTY_NOT_FOUND',
  PROPERTY_CREATION_FAILED = 'PROPERTY_CREATION_FAILED',
  PROPERTY_UPDATE_FAILED = 'PROPERTY_UPDATE_FAILED',
  PROPERTY_DELETE_FAILED = 'PROPERTY_DELETE_FAILED',
  PROPERTY_SEARCH_FAILED = 'PROPERTY_SEARCH_FAILED',
  INVALID_PROPERTY_DATA = 'INVALID_PROPERTY_DATA',
  PROPERTY_ALREADY_EXISTS = 'PROPERTY_ALREADY_EXISTS',
  PROPERTY_NOT_OWNED = 'PROPERTY_NOT_OWNED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  
  // User Management
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  USER_UPDATE_FAILED = 'USER_UPDATE_FAILED',
  USER_DELETE_FAILED = 'USER_DELETE_FAILED',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  TRUST_SCORE_UPDATE_FAILED = 'TRUST_SCORE_UPDATE_FAILED',
  AGENT_VERIFICATION_FAILED = 'AGENT_VERIFICATION_FAILED',
  INSUFFICIENT_TRUST_SCORE = 'INSUFFICIENT_TRUST_SCORE',
  
  // Review System
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  REVIEW_CREATION_FAILED = 'REVIEW_CREATION_FAILED',
  REVIEW_UPDATE_FAILED = 'REVIEW_UPDATE_FAILED',
  REVIEW_DELETE_FAILED = 'REVIEW_DELETE_FAILED',
  DUPLICATE_REVIEW = 'DUPLICATE_REVIEW',
  CANNOT_REVIEW_OWN_PROPERTY = 'CANNOT_REVIEW_OWN_PROPERTY',
  REVIEW_NOT_OWNED = 'REVIEW_NOT_OWNED',
  
  // File Operations
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  UPLOAD_DIRECTORY_ERROR = 'UPLOAD_DIRECTORY_ERROR',
  
  // AI & Machine Learning
  AI_VERIFICATION_FAILED = 'AI_VERIFICATION_FAILED',
  FRAUD_DETECTION_FAILED = 'FRAUD_DETECTION_FAILED',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  VERIFICATION_TIMEOUT = 'VERIFICATION_TIMEOUT',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  AI_MODEL_ERROR = 'AI_MODEL_ERROR',
  
  // Search Operations
  SEARCH_QUERY_REQUIRED = 'SEARCH_QUERY_REQUIRED',
  SEARCH_FAILED = 'SEARCH_FAILED',
  INVALID_SEARCH_FILTERS = 'INVALID_SEARCH_FILTERS',
  LOCATION_SEARCH_FAILED = 'LOCATION_SEARCH_FAILED',
  SEARCH_TIMEOUT = 'SEARCH_TIMEOUT',
  TOO_MANY_RESULTS = 'TOO_MANY_RESULTS',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // System & Configuration
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MALFORMED_DATA = 'MALFORMED_DATA',
  OPERATION_FAILED = 'OPERATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // Client-side
  CLIENT_RUNTIME_ERROR = 'CLIENT_RUNTIME_ERROR',
}

export interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly correlationId?: string;
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
    code: string | ErrorCode,
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
    return this.message;
  }
}

/**
 * Utility functions for error handling
 */
export const generateCorrelationId = (): string => {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 11);
  return `${timestamp}-${randomPart}`;
};
