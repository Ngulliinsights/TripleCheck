/**
 * Comprehensive error handling utilities for the application
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class APIError extends Error implements AppError {
  code?: string;
  status?: number;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Parse error from various sources (API responses, network errors, etc.)
 */
export function parseError(error: any): AppError {
  // Handle APIError instances
  if (error instanceof APIError) {
    return error;
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error
    };
  }

  // Handle API response errors
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    return {
      message: data?.message || getStatusMessage(status),
      status,
      code: data?.code,
      details: data
    };
  }

  // Handle network errors
  if (error?.request) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      details: error
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    details: error
  };
}

/**
 * Get user-friendly message for HTTP status codes
 */
export function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You need to log in to access this resource.';
    case 403:
      return 'You don\'t have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'The provided data is invalid.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  if (!error.status) return false;
  
  // Retry on server errors and rate limiting
  return error.status >= 500 || error.status === 429;
}

/**
 * Determine if an error requires authentication
 */
export function isAuthError(error: AppError): boolean {
  return error.status === 401;
}

/**
 * Create a user-friendly error message for display
 */
export function getDisplayMessage(error: AppError): string {
  // Use custom message if available and user-friendly
  if (error.message && !error.message.includes('fetch')) {
    return error.message;
  }

  // Use status-based message
  if (error.status) {
    return getStatusMessage(error.status);
  }

  // Default fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Log error for debugging (can be extended to send to error reporting service)
 */
export function logError(error: AppError, context?: string) {
  const errorInfo = {
    message: error.message,
    status: error.status,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
  };

  console.error('Application Error:', errorInfo);

  // In production, you might want to send this to an error reporting service
  // Example: errorReportingService.captureException(error, { extra: errorInfo });
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const parsedError = parseError(error);

      // Don't retry if it's not a retryable error
      if (!isRetryableError(parsedError)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe async function wrapper that handles errors gracefully
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return fn().catch(error => {
    logError(parseError(error), 'safeAsync');
    return fallback;
  });
}

/**
 * Create an error handler for React Query
 */
export function createQueryErrorHandler(context: string) {
  return (error: any) => {
    const parsedError = parseError(error);
    logError(parsedError, context);
    return parsedError;
  };
}