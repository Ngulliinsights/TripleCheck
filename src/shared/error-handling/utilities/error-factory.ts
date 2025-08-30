import { AppError, ErrorSeverity } from '../errors/base-error';
import { ValidationError } from '../errors/validation-error';
import { DatabaseError } from '../errors/database-error';
import { ErrorCategory } from '../constants/error-categories';

export class ErrorFactory {
  static fromUnknown(error: unknown, correlationId?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if ((error as any)?.name === 'ZodError') {
      return ValidationError.fromZod(error, correlationId);
    }

    if ((error as any)?.code && /^\d{5}$/.test(String((error as any).code))) {
      return DatabaseError.fromPostgres(error, correlationId);
    }

    if ((error as any)?.response?.status) {
      const status = (error as any).response.status;
      const message = (error as any).response.statusText || (error as Error).message;
      
      return new AppError(
        'EXTERNAL_SERVICE_ERROR',
        `HTTP ${status}: ${message}`,
        status,
        ErrorCategory.EXTERNAL_SERVICE,
        correlationId ? { correlationId } : {}
      );
    }

    if (error instanceof Error) {
      return new AppError(
        'INTERNAL_SERVER_ERROR',
        error.message,
        500,
        ErrorCategory.SYSTEM,
        {
          severity: ErrorSeverity.CRITICAL,
          details: { originalError: error.message, stack: error.stack },
          isOperational: false,
          cause: error,
          ...(correlationId && { correlationId }),
        }
      );
    }

    return new AppError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      500,
      ErrorCategory.SYSTEM,
      {
        severity: ErrorSeverity.CRITICAL,
        details: { originalError: String(error) },
        isOperational: false,
        ...(correlationId && { correlationId }),
      }
    );
  }

  static createValidationError(
    fieldErrors: Record<string, string | string[]>,
    correlationId?: string
  ): ValidationError {
    const normalizedErrors: Record<string, string[]> = {};
    
    for (const [field, errors] of Object.entries(fieldErrors)) {
      normalizedErrors[field] = Array.isArray(errors) ? errors : [errors];
    }

    return new ValidationError('Validation failed', normalizedErrors, correlationId);
  }
}