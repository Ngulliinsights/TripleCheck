/**
 * Shared Error Types & Utilities
 *
 * Unified error foundation for client and server.
 * Resolves circular dependencies by centralizing all error primitives here.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export enum ErrorDomain {
  AI       = 'AI',
  PROPERTY = 'PROPERTY',
  USER     = 'USER',
  SYSTEM   = 'SYSTEM',
  SECURITY = 'SECURITY',
  NETWORK  = 'NETWORK',
  FINANCE  = 'FINANCE',
  STORAGE  = 'STORAGE',
}

export enum ErrorSeverity {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ErrorCategory {
  VALIDATION       = 'VALIDATION',
  AUTHENTICATION   = 'AUTHENTICATION',
  AUTHORIZATION    = 'AUTHORIZATION',
  NOT_FOUND        = 'NOT_FOUND',
  CONFLICT         = 'CONFLICT',
  RATE_LIMIT       = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE         = 'DATABASE',
  BUSINESS_LOGIC   = 'BUSINESS_LOGIC',
  SYSTEM           = 'SYSTEM',
  SECURITY         = 'SECURITY',
  NETWORK          = 'NETWORK',
  PERFORMANCE      = 'PERFORMANCE',
  CONFIGURATION    = 'CONFIGURATION',
}

export enum RecoveryStrategy {
  RETRY               = 'RETRY',
  FALLBACK            = 'FALLBACK',
  REDIRECT            = 'REDIRECT',
  REFRESH             = 'REFRESH',
  LOGOUT              = 'LOGOUT',
  CONTACT_SUPPORT     = 'CONTACT_SUPPORT',
  IGNORE              = 'IGNORE',
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION',
}

export enum HttpStatusCode {
  OK                    = 200,
  CREATED               = 201,
  NO_CONTENT            = 204,
  BAD_REQUEST           = 400,
  UNAUTHORIZED          = 401,
  FORBIDDEN             = 403,
  NOT_FOUND             = 404,
  METHOD_NOT_ALLOWED    = 405,
  CONFLICT              = 409,
  UNPROCESSABLE_ENTITY  = 422,
  TOO_MANY_REQUESTS     = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY           = 502,
  SERVICE_UNAVAILABLE   = 503,
  GATEWAY_TIMEOUT       = 504,
}

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

export enum ErrorCode {
  // Auth & Session
  INVALID_CREDENTIALS       = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED             = 'TOKEN_EXPIRED',
  TOKEN_INVALID             = 'TOKEN_INVALID',
  TOKEN_REQUIRED            = 'TOKEN_REQUIRED',
  SESSION_EXPIRED           = 'SESSION_EXPIRED',
  SESSION_CREATION_FAILED   = 'SESSION_CREATION_FAILED',
  INVALID_SESSION           = 'INVALID_SESSION',
  AUTH_REQUIRED             = 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS  = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED            = 'ACCOUNT_LOCKED',
  PASSWORD_RESET_REQUIRED   = 'PASSWORD_RESET_REQUIRED',
  RATE_LIMITED              = 'RATE_LIMITED',

  // Registration / Login
  USERNAME_EXISTS           = 'USERNAME_EXISTS',
  REGISTRATION_FAILED       = 'REGISTRATION_FAILED',
  LOGIN_FAILED              = 'LOGIN_FAILED',
  LOGOUT_FAILED             = 'LOGOUT_FAILED',
  USER_NOT_FOUND            = 'USER_NOT_FOUND',

  // Validation
  VALIDATION_FAILED         = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING    = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT            = 'INVALID_FORMAT',
  INVALID_EMAIL             = 'INVALID_EMAIL',
  INVALID_USERNAME          = 'INVALID_USERNAME',
  USERNAME_TOO_SHORT        = 'USERNAME_TOO_SHORT',
  USERNAME_TOO_LONG         = 'USERNAME_TOO_LONG',
  PASSWORD_TOO_SHORT        = 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG         = 'PASSWORD_TOO_LONG',
  PASSWORD_WEAK             = 'PASSWORD_WEAK',
  INVALID_PROPERTY_ID       = 'INVALID_PROPERTY_ID',
  INVALID_USER_ID           = 'INVALID_USER_ID',
  INVALID_REVIEW_ID         = 'INVALID_REVIEW_ID',

  // Database
  DATABASE_ERROR            = 'DATABASE_ERROR',
  CONNECTION_FAILED         = 'CONNECTION_FAILED',
  TRANSACTION_FAILED        = 'TRANSACTION_FAILED',
  DUPLICATE_ENTRY           = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION      = 'CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION     = 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION        = 'NOT_NULL_VIOLATION',
  RECORD_NOT_FOUND          = 'RECORD_NOT_FOUND',
  INSERT_FAILED             = 'INSERT_FAILED',
  UPDATE_FAILED             = 'UPDATE_FAILED',
  DELETE_FAILED             = 'DELETE_FAILED',

  // Properties
  PROPERTY_NOT_FOUND        = 'PROPERTY_NOT_FOUND',
  PROPERTY_CREATION_FAILED  = 'PROPERTY_CREATION_FAILED',
  PROPERTY_UPDATE_FAILED    = 'PROPERTY_UPDATE_FAILED',
  PROPERTY_DELETE_FAILED    = 'PROPERTY_DELETE_FAILED',
  PROPERTY_SEARCH_FAILED    = 'PROPERTY_SEARCH_FAILED',
  INVALID_PROPERTY_DATA     = 'INVALID_PROPERTY_DATA',
  PROPERTY_ALREADY_EXISTS   = 'PROPERTY_ALREADY_EXISTS',
  PROPERTY_NOT_OWNED        = 'PROPERTY_NOT_OWNED',
  VERIFICATION_FAILED       = 'VERIFICATION_FAILED',
  VERIFICATION_PENDING      = 'VERIFICATION_PENDING',

  // Users
  USER_CREATION_FAILED      = 'USER_CREATION_FAILED',
  USER_UPDATE_FAILED        = 'USER_UPDATE_FAILED',
  USER_DELETE_FAILED        = 'USER_DELETE_FAILED',
  PROFILE_UPDATE_FAILED     = 'PROFILE_UPDATE_FAILED',
  TRUST_SCORE_UPDATE_FAILED = 'TRUST_SCORE_UPDATE_FAILED',
  AGENT_VERIFICATION_FAILED = 'AGENT_VERIFICATION_FAILED',
  INSUFFICIENT_TRUST_SCORE  = 'INSUFFICIENT_TRUST_SCORE',

  // Reviews
  REVIEW_NOT_FOUND              = 'REVIEW_NOT_FOUND',
  REVIEW_CREATION_FAILED        = 'REVIEW_CREATION_FAILED',
  REVIEW_UPDATE_FAILED          = 'REVIEW_UPDATE_FAILED',
  REVIEW_DELETE_FAILED          = 'REVIEW_DELETE_FAILED',
  DUPLICATE_REVIEW              = 'DUPLICATE_REVIEW',
  CANNOT_REVIEW_OWN_PROPERTY    = 'CANNOT_REVIEW_OWN_PROPERTY',
  REVIEW_NOT_OWNED              = 'REVIEW_NOT_OWNED',

  // Files
  FILE_UPLOAD_FAILED        = 'FILE_UPLOAD_FAILED',
  FILE_TOO_LARGE            = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE         = 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND            = 'FILE_NOT_FOUND',
  FILE_PROCESSING_FAILED    = 'FILE_PROCESSING_FAILED',
  UPLOAD_DIRECTORY_ERROR    = 'UPLOAD_DIRECTORY_ERROR',

  // AI / ML
  AI_VERIFICATION_FAILED    = 'AI_VERIFICATION_FAILED',
  AI_SERVICE_UNAVAILABLE    = 'AI_SERVICE_UNAVAILABLE',
  AI_MODEL_ERROR            = 'AI_MODEL_ERROR',
  FRAUD_DETECTION_FAILED    = 'FRAUD_DETECTION_FAILED',
  VERIFICATION_TIMEOUT      = 'VERIFICATION_TIMEOUT',
  INSUFFICIENT_DATA         = 'INSUFFICIENT_DATA',

  // Search
  SEARCH_QUERY_REQUIRED     = 'SEARCH_QUERY_REQUIRED',
  SEARCH_FAILED             = 'SEARCH_FAILED',
  INVALID_SEARCH_FILTERS    = 'INVALID_SEARCH_FILTERS',
  LOCATION_SEARCH_FAILED    = 'LOCATION_SEARCH_FAILED',
  SEARCH_TIMEOUT            = 'SEARCH_TIMEOUT',
  TOO_MANY_RESULTS          = 'TOO_MANY_RESULTS',

  // External / System
  EXTERNAL_SERVICE_ERROR    = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR     = 'INTERNAL_SERVER_ERROR',
  CONFIGURATION_ERROR       = 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE       = 'SERVICE_UNAVAILABLE',
  REQUEST_TIMEOUT           = 'REQUEST_TIMEOUT',
  RATE_LIMIT_EXCEEDED       = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST           = 'INVALID_REQUEST',
  MALFORMED_DATA            = 'MALFORMED_DATA',
  OPERATION_FAILED          = 'OPERATION_FAILED',
  OPERATION_NOT_ALLOWED     = 'OPERATION_NOT_ALLOWED',
  RESOURCE_CONFLICT         = 'RESOURCE_CONFLICT',
  NOT_FOUND                 = 'NOT_FOUND',
  UNKNOWN_ERROR             = 'UNKNOWN_ERROR',

  // Client-side
  CLIENT_RUNTIME_ERROR      = 'CLIENT_RUNTIME_ERROR',
}

// ---------------------------------------------------------------------------
// Static lookup tables (defined once, not recreated per instance)
// ---------------------------------------------------------------------------

const SEVERITY_MAP: Record<ErrorCategory, ErrorSeverity> = {
  [ErrorCategory.VALIDATION]:       ErrorSeverity.LOW,
  [ErrorCategory.AUTHENTICATION]:   ErrorSeverity.HIGH,
  [ErrorCategory.AUTHORIZATION]:    ErrorSeverity.HIGH,
  [ErrorCategory.NOT_FOUND]:        ErrorSeverity.LOW,
  [ErrorCategory.CONFLICT]:         ErrorSeverity.MEDIUM,
  [ErrorCategory.RATE_LIMIT]:       ErrorSeverity.MEDIUM,
  [ErrorCategory.EXTERNAL_SERVICE]: ErrorSeverity.MEDIUM,
  [ErrorCategory.DATABASE]:         ErrorSeverity.CRITICAL,
  [ErrorCategory.BUSINESS_LOGIC]:   ErrorSeverity.MEDIUM,
  [ErrorCategory.SYSTEM]:           ErrorSeverity.CRITICAL,
  [ErrorCategory.SECURITY]:         ErrorSeverity.CRITICAL,
  [ErrorCategory.NETWORK]:          ErrorSeverity.MEDIUM,
  [ErrorCategory.PERFORMANCE]:      ErrorSeverity.MEDIUM,
  [ErrorCategory.CONFIGURATION]:    ErrorSeverity.HIGH,
};

const RECOVERY_MAP: Record<ErrorCategory, RecoveryStrategy[]> = {
  [ErrorCategory.VALIDATION]:       [RecoveryStrategy.IGNORE],
  [ErrorCategory.AUTHENTICATION]:   [RecoveryStrategy.LOGOUT, RecoveryStrategy.REDIRECT],
  [ErrorCategory.AUTHORIZATION]:    [RecoveryStrategy.CONTACT_SUPPORT],
  [ErrorCategory.NOT_FOUND]:        [RecoveryStrategy.IGNORE],
  [ErrorCategory.CONFLICT]:         [RecoveryStrategy.REFRESH],
  [ErrorCategory.RATE_LIMIT]:       [RecoveryStrategy.RETRY],
  [ErrorCategory.EXTERNAL_SERVICE]: [RecoveryStrategy.RETRY, RecoveryStrategy.FALLBACK],
  [ErrorCategory.DATABASE]:         [RecoveryStrategy.RETRY, RecoveryStrategy.CONTACT_SUPPORT],
  [ErrorCategory.BUSINESS_LOGIC]:   [RecoveryStrategy.CONTACT_SUPPORT],
  [ErrorCategory.SYSTEM]:           [RecoveryStrategy.CONTACT_SUPPORT],
  [ErrorCategory.SECURITY]:         [RecoveryStrategy.LOGOUT, RecoveryStrategy.CONTACT_SUPPORT],
  [ErrorCategory.NETWORK]:          [RecoveryStrategy.RETRY],
  [ErrorCategory.PERFORMANCE]:      [RecoveryStrategy.RETRY],
  [ErrorCategory.CONFIGURATION]:    [RecoveryStrategy.CONTACT_SUPPORT],
};

const RETRYABLE_CATEGORIES = new Set<ErrorCategory>([
  ErrorCategory.NETWORK,
  ErrorCategory.EXTERNAL_SERVICE,
  ErrorCategory.DATABASE,
  ErrorCategory.RATE_LIMIT,
]);

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly correlationId?: string;
}

export interface AppErrorOptions {
  severity?: ErrorSeverity;
  recoveryStrategies?: RecoveryStrategy[];
  details?: Record<string, unknown>;
  correlationId?: string;
  /** True for expected, handled operational errors; false for programmer errors. */
  isOperational?: boolean;
  cause?: Error;
}

export interface SerializedAppError extends BaseError {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly recoveryStrategies: RecoveryStrategy[];
  readonly retryable: boolean;
}

// ---------------------------------------------------------------------------
// Core Error Class
// ---------------------------------------------------------------------------

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
  public readonly cause: Error | undefined;

  constructor(
    code: ErrorCode | string,
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    options: AppErrorOptions = {},
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = options.severity ?? SEVERITY_MAP[category];
    this.recoveryStrategies = options.recoveryStrategies ?? RECOVERY_MAP[category];
    this.details = options.details;
    this.timestamp = new Date().toISOString();
    this.correlationId = options.correlationId;
    this.isOperational = options.isOperational ?? true;
    this.retryable = RETRYABLE_CATEGORIES.has(category);
    this.cause = options.cause;

    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): SerializedAppError {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      category: this.category,
      severity: this.severity,
      recoveryStrategies: this.recoveryStrategies,
      retryable: this.retryable,
      ...(this.details       !== undefined && { details: this.details }),
      ...(this.correlationId !== undefined && { correlationId: this.correlationId }),
    };
  }

  /** Returns the message as-is; override in subclasses to provide user-safe text. */
  getUserMessage(): string {
    return this.message;
  }
}

// ---------------------------------------------------------------------------
// Specialised Subclasses
// ---------------------------------------------------------------------------

/** For expected business-rule violations (HTTP 400 by default). */
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: ErrorCode | string = ErrorCode.OPERATION_FAILED,
    statusCode: number = HttpStatusCode.BAD_REQUEST,
    details?: Record<string, unknown>,
    correlationId?: string,
  ) {
    super(code, message, statusCode, ErrorCategory.BUSINESS_LOGIC, { details, correlationId });
  }
}

/** For resource-not-found scenarios (HTTP 404). */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    code: ErrorCode | string = ErrorCode.NOT_FOUND,
    details?: Record<string, unknown>,
  ) {
    super(code, message, HttpStatusCode.NOT_FOUND, ErrorCategory.NOT_FOUND, { details });
  }
}

/** For auth failures (HTTP 401). */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode | string = ErrorCode.AUTH_REQUIRED,
    details?: Record<string, unknown>,
  ) {
    super(code, message, HttpStatusCode.UNAUTHORIZED, ErrorCategory.AUTHENTICATION, { details });
  }
}

/** For permission failures (HTTP 403). */
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode | string = ErrorCode.INSUFFICIENT_PERMISSIONS,
    details?: Record<string, unknown>,
  ) {
    super(code, message, HttpStatusCode.FORBIDDEN, ErrorCategory.AUTHORIZATION, { details });
  }
}

/** For input validation failures (HTTP 422). */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode | string = ErrorCode.VALIDATION_FAILED,
    details?: Record<string, unknown>,
  ) {
    super(code, message, HttpStatusCode.UNPROCESSABLE_ENTITY, ErrorCategory.VALIDATION, { details });
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Generates a RFC-4122 v4-style UUID when available, or a compact timestamp-based fallback. */
export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Narrows an unknown thrown value to `AppError`. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Wraps an unknown caught value in an `AppError`.
 * Pass-through if it is already one.
 */
export function toAppError(err: unknown, correlationId?: string): AppError {
  if (isAppError(err)) return err;

  const cause = err instanceof Error ? err : undefined;
  const message = cause?.message ?? String(err);

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    message,
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    ErrorCategory.SYSTEM,
    { cause, correlationId, isOperational: false },
  );
}