import { AppError } from '../errors/base-error'
import { ErrorCategory } from '../constants/error-categories'
import { ErrorFactory } from '../utilities/error-factory'

export const createClientErrorHandler = () => ({
  toClientError: (error: AppError) => ({
    success: false,
    error: {
      code: error.code,
      message: error.getUserMessage(),
      category: error.category,
      severity: error.severity,
      recoveryStrategies: error.recoveryStrategies,
      retryable: error.retryable,
      ...(error.details && { details: error.details }),
      ...(error.correlationId && { correlationId: error.correlationId }),
    },
  }),

  handleApiError: async (response: Response, correlationId?: string): Promise<AppError> => {
    try {
      const errorData = await response.json();
      
      if (errorData.code && errorData.message) {
        return new AppError(
          errorData.code,
          errorData.message,
          response.status,
          errorData.category || ErrorCategory.EXTERNAL_SERVICE,
          {
            severity: errorData.severity,
            recoveryStrategies: errorData.recoveryStrategies,
            details: errorData.details,
            correlationId: errorData.correlationId || correlationId,
          }
        );
      }
    } catch {
      // Fallback to generic error
    }

    switch (response.status) {
      case 401:
        return new AppError('INVALID_CREDENTIALS', 'Authentication required', 401, ErrorCategory.AUTHENTICATION, correlationId ? { correlationId } : {});
      case 403:
        return new AppError('INSUFFICIENT_PERMISSIONS', 'Access denied', 403, ErrorCategory.AUTHORIZATION, correlationId ? { correlationId } : {});
      case 404:
        return new AppError('NOT_FOUND', 'Resource not found', 404, ErrorCategory.NOT_FOUND, correlationId ? { correlationId } : {});
      case 409:
        return new AppError('RESOURCE_CONFLICT', 'Resource conflict', 409, ErrorCategory.CONFLICT, correlationId ? { correlationId } : {});
      case 429:
        return new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, ErrorCategory.RATE_LIMIT, correlationId ? { correlationId } : {});
      default:
        return new AppError(
          'EXTERNAL_SERVICE_ERROR',
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          ErrorCategory.EXTERNAL_SERVICE,
          correlationId ? { correlationId } : {}
        );
    }
  },

  handleGlobalError: (error: Error, correlationId?: string): AppError => {
    return ErrorFactory.fromUnknown(error, correlationId);
  },
});