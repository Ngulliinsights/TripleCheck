/**
 * Comprehensive error handling system with structured error types
 * Provides consistent error codes, messages, and handling across the application
 */

// Base error interface for all application errors
export interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown> | undefined;
  readonly timestamp: string;
  readonly correlationId?: string | undefined;
}

// Interface for Zod error structure
interface ZodErrorIssue {
  path: (string | number)[];
  message: string;
}

interface ZodErrorLike {
  errors: ZodErrorIssue[];
}

// Interface for Drizzle/PostgreSQL error structure
interface DrizzleErrorLike {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
  detail?: string;
  message: string;
}

// PostgreSQL error codes that we commonly handle
export enum PostgreSQLErrorCode {
  UNIQUE_VIOLATION = "23505",
  FOREIGN_KEY_VIOLATION = "23503",
  NOT_NULL_VIOLATION = "23502",
  CHECK_VIOLATION = "23514",
  CONNECTION_FAILURE = "08000",
  CONNECTION_EXCEPTION = "08001",
  INVALID_CATALOG_NAME = "3D000", // Database doesn't exist
  INSUFFICIENT_PRIVILEGE = "42501",
  SYNTAX_ERROR = "42601",
  UNDEFINED_TABLE = "42P01",
  UNDEFINED_COLUMN = "42703",
}

// HTTP status codes for different error types
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Error categories for better organization
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  SYSTEM = "SYSTEM",
}

// Structured error codes with consistent naming
export enum ErrorCode {
  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE",

  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED = "ACCESS_DENIED",
  RESOURCE_FORBIDDEN = "RESOURCE_FORBIDDEN",

  // Database errors
  DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED",
  QUERY_FAILED = "QUERY_FAILED",
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
  DUPLICATE_RECORD = "DUPLICATE_RECORD",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",

  // Business logic errors
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE = "EXTERNAL_SERVICE_UNAVAILABLE",
  EXTERNAL_SERVICE_TIMEOUT = "EXTERNAL_SERVICE_TIMEOUT",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // System errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TIMEOUT = "TIMEOUT",
}

// Base application error class
export class AppError extends Error implements BaseError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly details?: Record<string, unknown> | undefined;
  public readonly timestamp: string;
  public readonly correlationId?: string | undefined;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    details?: Record<string, unknown>,
    correlationId?: string,
    isOperational: boolean = true
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.correlationId = correlationId;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): BaseError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
    };
  }
}

// Validation error with field-specific details
export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fieldErrors: Record<string, string[]> = {},
    correlationId?: string
  ) {
    super(
      ErrorCode.VALIDATION_FAILED,
      message,
      HttpStatusCode.BAD_REQUEST,
      ErrorCategory.VALIDATION,
      { fieldErrors },
      correlationId
    );

    this.fieldErrors = fieldErrors;
  }

  static fromZodError(
    zodError: unknown,
    correlationId?: string
  ): ValidationError {
    const fieldErrorsMap = new Map<string, string[]>();

    if (this.isValidZodError(zodError)) {
      this.processZodErrors(zodError, fieldErrorsMap);
    }

    // Convert Map to Record for compatibility
    const fieldErrors: Record<string, string[]> = {};
    fieldErrorsMap.forEach((errors, path) => {
      fieldErrors[path] = errors;
    });

    return new ValidationError(
      "Input validation failed",
      fieldErrors,
      correlationId
    );
  }

  private static isValidZodError(zodError: unknown): zodError is ZodErrorLike {
    return (
      zodError !== null &&
      typeof zodError === "object" &&
      "errors" in zodError &&
      Array.isArray((zodError as ZodErrorLike).errors)
    );
  }

  private static processZodErrors(
    zodError: ZodErrorLike,
    fieldErrorsMap: Map<string, string[]>
  ): void {
    for (const error of zodError.errors) {
      const path = error.path?.join(".") || "unknown";
      this.addErrorToMap(fieldErrorsMap, path, error.message);
    }
  }

  private static addErrorToMap(
    fieldErrorsMap: Map<string, string[]>,
    path: string,
    message: string
  ): void {
    // Validate path is a safe string to prevent object injection
    if (!this.isValidFieldPath(path)) return;

    // Create a new object to avoid prototype pollution
    const cleanPath = String(path).replace(/[^a-zA-Z0-9._-]/g, '');
    
    if (cleanPath !== path || !cleanPath) return;

    // Safe Map-based assignment (no object injection possible)
    const existingErrors = fieldErrorsMap.get(cleanPath);
    if (existingErrors) {
      existingErrors.push(String(message));
    } else {
      fieldErrorsMap.set(cleanPath, [String(message)]);
    }
  }

  private static isValidFieldPath(path: string): boolean {
    return (
      typeof path === 'string' && 
      path.length > 0 && 
      path.length < 100 &&
      /^[a-zA-Z0-9._-]+$/.test(path) && // Only allow safe characters
      !path.startsWith('__') && // Avoid prototype pollution
      !path.includes('prototype')
    );
  }
}

// Authentication error
export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication failed",
    code: ErrorCode = ErrorCode.INVALID_CREDENTIALS,
    correlationId?: string
  ) {
    super(
      code,
      message,
      HttpStatusCode.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      undefined,
      correlationId
    );
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(
    message: string = "Access denied",
    code: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS,
    correlationId?: string
  ) {
    super(
      code,
      message,
      HttpStatusCode.FORBIDDEN,
      ErrorCategory.AUTHORIZATION,
      undefined,
      correlationId
    );
  }
}

// Database error
export class DatabaseError extends AppError {
  public readonly constraint?: string | undefined;
  public readonly table?: string | undefined;
  public readonly column?: string | undefined;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.QUERY_FAILED,
    details?: Record<string, unknown>,
    correlationId?: string,
    constraint?: string,
    table?: string,
    column?: string
  ) {
    super(
      code,
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCategory.DATABASE,
      details,
      correlationId
    );

    this.constraint = constraint;
    this.table = table;
    this.column = column;
  }

  static fromDrizzleError(
    error: unknown,
    correlationId?: string
  ): DatabaseError {
    if (!error || typeof error !== "object") {
      return new DatabaseError(
        "Unknown database error occurred",
        ErrorCode.QUERY_FAILED,
        { originalError: String(error) },
        correlationId
      );
    }

    const drizzleError = error as DrizzleErrorLike;
    const { code: pgCode, constraint, table, column, detail } = drizzleError;

    // Handle specific PostgreSQL error codes
    switch (pgCode) {
      case PostgreSQLErrorCode.UNIQUE_VIOLATION:
        return new DatabaseError(
          DatabaseError.formatUniqueViolationMessage(constraint, detail),
          ErrorCode.DUPLICATE_RECORD,
          {
            constraint,
            table,
            column,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          constraint,
          table,
          column
        );

      case PostgreSQLErrorCode.FOREIGN_KEY_VIOLATION:
        return new DatabaseError(
          DatabaseError.formatForeignKeyViolationMessage(constraint, detail),
          ErrorCode.CONSTRAINT_VIOLATION,
          {
            constraint,
            table,
            column,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          constraint,
          table,
          column
        );

      case PostgreSQLErrorCode.NOT_NULL_VIOLATION:
        return new DatabaseError(
          DatabaseError.formatNotNullViolationMessage(column),
          ErrorCode.MISSING_REQUIRED_FIELD,
          {
            constraint,
            table,
            column,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          constraint,
          table,
          column
        );

      case PostgreSQLErrorCode.CHECK_VIOLATION:
        return new DatabaseError(
          DatabaseError.formatCheckViolationMessage(constraint, detail),
          ErrorCode.CONSTRAINT_VIOLATION,
          {
            constraint,
            table,
            column,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          constraint,
          table,
          column
        );

      case PostgreSQLErrorCode.CONNECTION_FAILURE:
      case PostgreSQLErrorCode.CONNECTION_EXCEPTION:
        return new DatabaseError(
          "Database connection failed",
          ErrorCode.DATABASE_CONNECTION_FAILED,
          {
            detail,
            postgresCode: pgCode,
          },
          correlationId
        );

      case PostgreSQLErrorCode.INVALID_CATALOG_NAME:
        return new DatabaseError(
          "Database does not exist",
          ErrorCode.DATABASE_CONNECTION_FAILED,
          {
            detail,
            postgresCode: pgCode,
          },
          correlationId
        );

      case PostgreSQLErrorCode.INSUFFICIENT_PRIVILEGE:
        return new DatabaseError(
          "Insufficient database privileges",
          ErrorCode.ACCESS_DENIED,
          {
            detail,
            postgresCode: pgCode,
          },
          correlationId
        );

      case PostgreSQLErrorCode.UNDEFINED_TABLE:
        return new DatabaseError(
          `Table does not exist: ${table || "unknown"}`,
          ErrorCode.QUERY_FAILED,
          {
            table,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          undefined,
          table
        );

      case PostgreSQLErrorCode.UNDEFINED_COLUMN:
        return new DatabaseError(
          `Column does not exist: ${column || "unknown"}`,
          ErrorCode.QUERY_FAILED,
          {
            table,
            column,
            detail,
            postgresCode: pgCode,
          },
          correlationId,
          undefined,
          table,
          column
        );

      default:
        return new DatabaseError(
          drizzleError.message || "Database operation failed",
          ErrorCode.QUERY_FAILED,
          {
            constraint,
            table,
            column,
            detail,
            postgresCode: pgCode,
            originalError: drizzleError.message,
          },
          correlationId,
          constraint,
          table,
          column
        );
    }
  }

  private static formatUniqueViolationMessage(
    constraint?: string,
    detail?: string
  ): string {
    if (constraint) {
      // Handle common constraint patterns from your schema
      if (constraint.includes("email")) {
        return "Email address is already registered";
      }
      if (constraint.includes("username")) {
        return "Username is already taken";
      }
      if (constraint.includes("user_property")) {
        return "You have already performed this action on this property";
      }
      if (constraint.includes("external_id")) {
        return "Transaction with this external ID already exists";
      }
      if (constraint.includes("unique_metric")) {
        return "Statistic for this metric and period already exists";
      }
    }

    return detail || "A record with these details already exists";
  }

  private static formatForeignKeyViolationMessage(
    constraint?: string,
    detail?: string
  ): string {
    if (constraint) {
      if (constraint.includes("user_id")) {
        return "Referenced user does not exist";
      }
      if (constraint.includes("property_id")) {
        return "Referenced property does not exist";
      }
      if (constraint.includes("owner_id")) {
        return "Property owner does not exist";
      }
    }

    return detail || "Referenced record does not exist";
  }

  private static formatNotNullViolationMessage(column?: string): string {
    if (column) {
      const fieldName = column
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${fieldName} is required`;
    }

    return "Required field is missing";
  }

  private static formatCheckViolationMessage(
    constraint?: string,
    detail?: string
  ): string {
    if (constraint) {
      if (constraint.includes("rating")) {
        return "Rating must be between 1 and 5";
      }
      if (constraint.includes("trust_score")) {
        return "Trust score must be between 0 and 100";
      }
      if (constraint.includes("fraud_score")) {
        return "Fraud score must be between 0 and 100";
      }
    }

    return detail || "Data violates database constraints";
  }
}

// Business logic error
export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    statusCode: HttpStatusCode = HttpStatusCode.BAD_REQUEST,
    details?: Record<string, unknown>,
    correlationId?: string
  ) {
    super(
      code,
      message,
      statusCode,
      ErrorCategory.BUSINESS_LOGIC,
      details,
      correlationId
    );
  }
}

// External service error
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    statusCode: HttpStatusCode = HttpStatusCode.BAD_GATEWAY,
    details?: Record<string, unknown>,
    correlationId?: string
  ) {
    super(
      code,
      message,
      statusCode,
      ErrorCategory.EXTERNAL_SERVICE,
      details,
      correlationId
    );
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", correlationId?: string) {
    super(
      ErrorCode.RECORD_NOT_FOUND,
      `${resource} not found`,
      HttpStatusCode.NOT_FOUND,
      ErrorCategory.DATABASE,
      { resource },
      correlationId
    );
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    details?: Record<string, unknown>,
    correlationId?: string
  ) {
    super(
      ErrorCode.RESOURCE_CONFLICT,
      message,
      HttpStatusCode.CONFLICT,
      ErrorCategory.BUSINESS_LOGIC,
      details,
      correlationId
    );
  }
}

// Rate limit error
export class RateLimitError extends AppError {
  constructor(
    message: string = "Rate limit exceeded",
    retryAfter?: number,
    correlationId?: string
  ) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      HttpStatusCode.TOO_MANY_REQUESTS,
      ErrorCategory.SYSTEM,
      { retryAfter },
      correlationId
    );
  }
}

// Error factory for creating errors from different sources
export class ErrorFactory {
  static fromError(
    error: Error | unknown,
    correlationId?: string,
    defaultCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
  ): AppError {
    // If it's already an AppError, return as is
    if (error instanceof AppError) {
      return error;
    }

    // Handle Drizzle/PostgreSQL errors first
    if (ErrorFactory.isDrizzleError(error)) {
      return DatabaseError.fromDrizzleError(error, correlationId);
    }

    // Handle Zod validation errors
    if (ErrorFactory.isZodError(error)) {
      return ValidationError.fromZodError(error, correlationId);
    }

    // Ensure we have an Error object to work with
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Handle specific error types by message content
    if (
      errorObj.name === "ValidationError" ||
      errorObj.message.includes("validation")
    ) {
      return new ValidationError(errorObj.message, {}, correlationId);
    }

    if (errorObj.message.includes("not found")) {
      return new NotFoundError("Resource", correlationId);
    }

    if (
      errorObj.message.includes("duplicate") ||
      errorObj.message.includes("unique constraint")
    ) {
      return new ConflictError(
        errorObj.message,
        { originalError: errorObj.message },
        correlationId
      );
    }

    if (errorObj.message.includes("timeout")) {
      return new AppError(
        ErrorCode.TIMEOUT,
        errorObj.message,
        HttpStatusCode.GATEWAY_TIMEOUT,
        ErrorCategory.SYSTEM,
        { originalError: errorObj.message },
        correlationId
      );
    }

    // Default to internal server error
    return new AppError(
      defaultCode,
      errorObj.message || "An unexpected error occurred",
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCategory.SYSTEM,
      { originalError: errorObj.message, stack: errorObj.stack },
      correlationId,
      false // Non-operational for unexpected errors
    );
  }

  private static isDrizzleError(error: unknown): error is DrizzleErrorLike {
    return (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as DrizzleErrorLike).code === "string" &&
      Boolean((error as DrizzleErrorLike).code?.match(/^\d{5}$/)) // PostgreSQL error codes are 5 digits
    );
  }

  private static isZodError(error: unknown): error is ZodErrorLike {
    return (
      error !== null &&
      typeof error === "object" &&
      "errors" in error &&
      Array.isArray((error as ZodErrorLike).errors)
    );
  }

  static createValidationError(
    fieldErrors: Record<string, string[]>,
    correlationId?: string
  ): ValidationError {
    return new ValidationError("Validation failed", fieldErrors, correlationId);
  }

  static createNotFoundError(
    resource: string,
    correlationId?: string
  ): NotFoundError {
    return new NotFoundError(resource, correlationId);
  }

  static createAuthenticationError(
    message?: string,
    correlationId?: string
  ): AuthenticationError {
    return new AuthenticationError(
      message,
      ErrorCode.INVALID_CREDENTIALS,
      correlationId
    );
  }

  static createAuthorizationError(
    message?: string,
    correlationId?: string
  ): AuthorizationError {
    return new AuthorizationError(
      message,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      correlationId
    );
  }

  static createDatabaseError(
    message: string,
    code: ErrorCode = ErrorCode.QUERY_FAILED,
    details?: Record<string, unknown>,
    correlationId?: string
  ): DatabaseError {
    return new DatabaseError(message, code, details, correlationId);
  }

  static fromDrizzleError(
    error: unknown,
    correlationId?: string
  ): DatabaseError {
    return DatabaseError.fromDrizzleError(error, correlationId);
  }
}

// Error response formatter for API responses
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
    timestamp: string;
    correlationId?: string | undefined;
  };
}

export class ErrorResponseFormatter {
  static format(error: AppError): ErrorResponse {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        correlationId: error.correlationId,
      },
    };
  }

  static formatValidationError(error: ValidationError): ErrorResponse & {
    error: { fieldErrors: Record<string, string[]> };
  } {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        correlationId: error.correlationId,
        fieldErrors: error.fieldErrors,
      },
    };
  }
}

// Utility functions for error handling
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export const getErrorCategory = (error: Error): ErrorCategory => {
  if (error instanceof AppError) {
    return error.category;
  }
  return ErrorCategory.SYSTEM;
};

export const shouldLogError = (error: Error): boolean => {
  // Always log non-operational errors
  if (!isOperationalError(error)) {
    return true;
  }

  // Log server errors but not client errors
  if (error instanceof AppError) {
    return error.statusCode >= 500;
  }

  return true;
};

// Generate correlation ID for request tracking
export const generateCorrelationId = (): string => {
  // Use crypto.randomUUID if available, otherwise fallback to timestamp-based ID
  if (globalThis?.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  // Using timestamp-based approach (note: not cryptographically secure)
  const timestamp = Date.now().toString(36);
  // eslint-disable-next-line sonarjs/pseudo-random
  const randomPart = Math.floor(Math.random() * 1000000).toString(36);
  return `${timestamp}-${randomPart}`;
};
