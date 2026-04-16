import { AppError, ErrorSeverity, RecoveryStrategy } from './base-error'
import { ErrorCategory } from '../constants/error-categories'
import { HttpStatusCode } from '../constants/http-status'

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = 'Validation failed',
    fieldErrors: Record<string, string[]> = {},
    correlationId?: string
  ) {
    super(
      'VALIDATION_FAILED',
      message,
      HttpStatusCode.BAD_REQUEST,
      ErrorCategory.VALIDATION,
      {
        severity: ErrorSeverity.LOW,
        recoveryStrategies: [RecoveryStrategy.IGNORE],
        details: { fieldErrors },
        ...(correlationId && { correlationId }),
      }
    );
    this.fieldErrors = fieldErrors;
  }

  static fromZod(zodError: any, correlationId?: string): ValidationError {
    const fieldErrors: Record<string, string[]> = {};
    
    if (zodError?.errors && Array.isArray(zodError.errors)) {
      for (const error of zodError.errors) {
        const fieldPath = Array.isArray(error.path) ? error.path.join('.') : 'unknown';
        if (!fieldErrors[fieldPath]) fieldErrors[fieldPath] = [];
        fieldErrors[fieldPath]?.push(error.message || 'Validation error');
      }
    }

    return new ValidationError('Input validation failed', fieldErrors, correlationId);
  }
}