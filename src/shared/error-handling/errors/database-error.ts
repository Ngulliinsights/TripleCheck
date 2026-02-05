import { AppError, ErrorSeverity, RecoveryStrategy } from './base-error'
import { ErrorCategory } from '../constants/error-categories'
import { HttpStatusCode } from '../constants/http-status'
import { PostgreSQLErrorCode } from '../constants/postgres-codes'

export class DatabaseError extends AppError {
  public readonly constraint: string | undefined;
  public readonly table: string | undefined;
  public readonly column: string | undefined;

  constructor(
    message: string,
    code = 'DATABASE_CONNECTION_FAILED',
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
      {
        severity: ErrorSeverity.CRITICAL,
        recoveryStrategies: [RecoveryStrategy.RETRY, RecoveryStrategy.CONTACT_SUPPORT],
        ...(details && { details }),
        ...(correlationId && { correlationId }),
      }
    );
    this.constraint = constraint;
    this.table = table;
    this.column = column;
  }

  static fromPostgres(pgError: any, correlationId?: string): DatabaseError {
    const { code, constraint, table, column, detail } = pgError || {};
    
    let message = 'Database operation failed';
    let errorCode = 'DATABASE_CONNECTION_FAILED';

    switch (code) {
      case PostgreSQLErrorCode.UNIQUE_VIOLATION:
        message = 'Record already exists';
        errorCode = 'DUPLICATE_RECORD';
        break;
      case PostgreSQLErrorCode.FOREIGN_KEY_VIOLATION:
        message = 'Referenced record does not exist';
        errorCode = 'CONSTRAINT_VIOLATION';
        break;
      case PostgreSQLErrorCode.NOT_NULL_VIOLATION:
        message = column ? `${column} is required` : 'Required fields are missing';
        errorCode = 'NOT_NULL_VIOLATION';
        break;
    }

    return new DatabaseError(
      message,
      errorCode,
      { postgresCode: code, ...(detail && { detail }) },
      correlationId,
      constraint,
      table,
      column
    );
  }
}